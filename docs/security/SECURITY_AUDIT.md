# Security Audit

**Date:** 2026-05-20
**Auditor:** Claude Code (automated code audit)
**Scope:** Full codebase — app, migrations, SQL functions, RLS policies, storage, API routes, server actions

---

## Summary

- **Overall risk:** Low-to-medium. The database layer is the strongest part of the security posture. All critical mutations run through SECURITY DEFINER RPCs with auth checks at the SQL level, making it extremely difficult to exploit ownership or access control bugs from the application layer.
- **Biggest risks:** In-process (per-instance) rate limiting for read endpoints will not survive a multi-instance (Vercel serverless) deployment; no HTTP security headers are configured; the auth callback does not validate the `next` redirect param consistently with the rest of the codebase.
- **What is already strong:** RLS on every table, SECURITY DEFINER with pinned `search_path` on every RPC, advisory locking for atomicity, database-level rate limits on all write operations, consistent ownership enforcement, no PII leakage in public API responses, comprehensive block-system enforcement across all surfaces.
- **What needs immediate attention:** Add shared (Redis/Upstash) rate limiting before scaling to multiple instances. Add HTTP security headers via `next.config.ts`. Validate `next` in the OAuth callback.

---

## Scope Reviewed

**Migrations** (all 43 files in `overclock/supabase/migrations/`):
- Schema, constraints, indexes
- RLS enable/disable and policies for all tables
- SECURITY DEFINER / INVOKER RPCs and their grants
- Storage bucket policies

**Tables with RLS reviewed:**
`profiles`, `competitive_profiles`, `competitive_role_profiles`, `profile_hero_pools`, `profile_featured_clips`, `badges`, `profile_badges`, `lfg_posts`, `play_invites`, `profile_connections`, `user_blocks`, `user_block_events`, `stack_requests`, `stack_members`, `profile_media`, `profile_media_uploads`

**RPCs reviewed:**
`create_lfg_post_atomic`, `close_owned_lfg_post`, `send_play_invite`, `accept_play_invite`, `decline_play_invite`, `cancel_play_invite`, `expire_play_invites`, `send_stack_request`, `accept_stack_request`, `decline_stack_request`, `leave_stack`, `remove_stack_member`, `create_user_block`, `delete_user_block`, `remove_profile_connection`, `get_profile_page_dto`, `get_lfg_feed_page_dto`, `search_public_profiles_dto`, `expire_lfg_posts`, `cleanup_expired_lfg_posts`, `update_last_seen`, block helper functions

**API routes:**
- `overclock/app/api/users/search/route.ts`
- `overclock/app/api/notifications/menu/route.ts`
- `overclock/app/auth/callback/route.ts`

**Server actions:**
- `overclock/features/auth/actions.ts`
- `overclock/features/profile/actions/` (all files)
- `overclock/features/matches/actions.ts`
- `overclock/features/lfg/actions.ts`
- `overclock/features/presence/actions.ts`

**Libraries:**
- `overclock/lib/profiles/` (all files)
- `overclock/lib/lfg/lfg-feed-rate-limit.ts`
- `overclock/lib/supabase/` (referenced but not separately listed)

**Configuration:**
- `overclock/next.config.ts`
- `overclock/package.json`

---

## Findings

---

### [MEDIUM] In-Process Rate Limiting Is Not Instance-Shared

**Status:** Confirmed

**Files:**
- `overclock/lib/profiles/profile-search-rate-limit.ts`
- `overclock/lib/lfg/lfg-feed-rate-limit.ts`

**Issue:**

Both rate limiters use a module-level `Map<string, RateLimitEntry>` to track request counts per IP:

```ts
// profile-search-rate-limit.ts
const rateLimitStore = new Map<string, RateLimitEntry>();
```

```ts
// lfg-feed-rate-limit.ts
const rateLimitStore = new Map<string, RateLimitEntry>();
```

The state lives in the Node.js process. On Vercel (and any multi-instance serverless deployment), each cold-start creates a fresh process with an empty map. A client hitting different instances — which happens naturally under load — sees a fresh counter on each instance. If there are N instances running, the effective limit is `N × 30` requests per window for profile search and `N × 45` for LFG feed.

Additionally, both limiters use `X-Forwarded-For`'s first value without verifying the proxy chain is trusted. If the deployment sits behind a CDN that sets this header, an attacker behind the CDN cannot spoof it — but if the header reaches the app unvalidated, a client can prepend a fake IP (`X-Forwarded-For: 1.2.3.4, real-ip`) and bypass the limit with `count: 1` on each fake IP.

**Why it matters:**

A scraper or competitor can enumerate LFG posts or profile names at unlimited rates in a multi-instance environment. The database-level rate limits on mutations are unaffected (those are PostgreSQL-based and shared), but the read endpoints that proxy to Supabase RPCs could be hammered, driving up Supabase compute costs and potentially degrading response times for real users.

**Fix:**

Replace the in-process maps with a shared rate-limiting backend. Upstash Redis is the lowest-friction Vercel-compatible option:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  prefix: "profile-search",
});

// In route handler:
const identifier = getClientIp(request);
const { success } = await ratelimit.limit(identifier);
if (!success) return NextResponse.json({ error: "..." }, { status: 429 });
```

Alternatively, use Vercel's built-in KV store or enforce rate limits at the Vercel Edge Network level via route-level config. Until a shared store is in place, consider increasing the per-instance limit significantly (these endpoints are read-only) or accepting the risk given the low impact.

**QA:**
1. Deploy two instances (or simulate two process starts locally) and verify that a client hitting both can exceed the limit.
2. After fix: send 31 requests from the same IP across multiple instances and confirm the 31st gets a 429.
3. Send a request with a forged `X-Forwarded-For: 1.2.3.4, realip` and confirm the real IP is used (or the chain is validated).

---

### [LOW] Auth Callback Does Not Validate the `next` Redirect Parameter

**Status:** Confirmed

**Files:**
- `overclock/app/auth/callback/route.ts`

**Issue:**

After exchanging the Discord OAuth code for a session, the callback redirects the user to `${origin}${next}` where `next` is taken directly from the query string without validation:

```ts
const next = requestUrl.searchParams.get("next") ?? "/login";
const origin = requestUrl.origin;
// ...
return NextResponse.redirect(`${origin}${next}`);
```

This is inconsistent with `resolveReturnTo` in `overclock/features/profile/actions/shared.ts`, which validates:

```ts
if (!parsed.startsWith("/") || parsed.startsWith("//")) {
  return "/account";
}
```

Prepending `origin` prevents a cross-domain open redirect (the final URL is always `https://overclock.lol<next>`). However, without path validation:

- `?next=//evil.com` → `https://overclock.lol//evil.com` (path starts with `//`, some parsers can misinterpret this)
- `?next=/legit?message=Your+account+is+suspended` → injects a misleading error message param that could be surfaced in the UI, useful for phishing
- `?next=/legit%0d%0aX-Injected-Header: value` → CRLF injection attempt (mitigated by Next.js HTTP response encoding, but worth hardening)

**Why it matters:**

An attacker can craft a Discord OAuth link that, after the user authenticates, lands them on a manipulated page URL. Combined with a UI that surfaces arbitrary `message` query params as toast notifications (common in this codebase), this becomes a social engineering vector: "Sign in → see fake error message → enter credentials on a spoofed support page."

**Fix:**

Apply the same path validation already used in `resolveReturnTo`:

```ts
// app/auth/callback/route.ts
function safePath(raw: string | null): string {
  const parsed = raw?.trim() ?? "";
  if (!parsed || !parsed.startsWith("/") || parsed.startsWith("//")) {
    return "/";
  }
  // Strip any query/fragment injected into the path segment itself
  const onlyPath = parsed.split("?")[0].split("#")[0];
  return onlyPath || "/";
}

const next = safePath(requestUrl.searchParams.get("next"));
return NextResponse.redirect(`${origin}${next}`);
```

**QA:**
1. Navigate to `/auth/callback?code=valid&next=//evil.com` — confirm redirect goes to `/` or home, not `//evil.com`.
2. Navigate with `?next=/account?message=hacked` — confirm `message` is not rendered.
3. Normal login with `?next=/matches` — confirm the redirect still works.

---

### [LOW] File Upload MIME Type Is Validated From Client-Reported Content-Type, Not File Content

**Status:** Confirmed

**Files:**
- `overclock/features/profile/actions/profile-media.ts`
- `overclock/supabase/migrations/20260507000000_profile_avatar_and_media_tracking.sql`

**Issue:**

The server action validates the uploaded file's MIME type by checking `file.type`, which is the `Content-Type` declared in the multipart form-data part — not derived from the actual bytes:

```ts
function validateMediaFile(file: FormDataEntryValue | null, ..., maxBytes: number): file is File {
  if (!PROFILE_MEDIA_IMAGE_MIME_TYPES.some((type) => type === file.type)) {
    return false;  // file.type is browser-reported, not magic-byte-verified
  }
  // ...
}
```

A raw HTTP request crafted with `Content-Type: image/jpeg` but containing arbitrary bytes (e.g., a valid SVG with embedded `<script>`) would pass this check and be uploaded to Supabase Storage with `contentType: "image/jpeg"`.

The storage RLS policies enforce path ownership but do not restrict by MIME type:

```sql
CREATE POLICY "profile_media_avatar_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-media' AND
    name = 'profile-pictures/' || auth.uid()::text || '/avatar'
    -- no MIME type check here
  );
```

**Why it matters:**

In practice the risk is low because:
1. Upload paths are fixed per user (`profile-pictures/{uid}/avatar`), so there's no path injection
2. Content is served from Supabase Storage's CDN under a different origin
3. Next.js `<Image>` applies `Content-Type: image/jpeg` from what was stored, and browsers reject execution of scripts served as images

The real exposure is a polyglot file attack: an SVG that is valid JPEG from Supabase's perspective but renders as SVG in some rendering contexts. SVG supports `<script>` tags and can run JavaScript when opened directly, even served under a different domain, depending on browser handling.

**Fix:**

Add server-side magic byte verification before upload. A minimal approach:

```ts
async function verifyImageMagicBytes(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  return false;
}
```

Call this in `uploadProfileAvatar` and `uploadProfileCover` before the storage call, and reject with an error if it fails.

Additionally, consider enabling Supabase's `image transformation` feature for avatars/covers, which inherently reprocesses uploaded images through a safe pipeline.

**QA:**
1. Upload a file with `Content-Type: image/jpeg` but containing PNG bytes — confirm it's accepted (magic bytes match after fix, or rejected before fix).
2. Upload an SVG file with `Content-Type: image/jpeg` — confirm it is rejected after fix.
3. Upload a normal JPEG — confirm it succeeds.

---

### [LOW] No HTTP Security Headers Configured

**Status:** Confirmed

**Files:**
- `overclock/next.config.ts`

**Issue:**

`next.config.ts` configures image remote patterns but sets no HTTP security headers:

```ts
const nextConfig: NextConfig = {
  images: { remotePatterns: [...] },
  // No headers() configuration
};
```

The following headers are absent from all responses:

| Header | Risk Without It |
|--------|----------------|
| `Content-Security-Policy` | No protection against XSS via injected scripts from external domains |
| `X-Content-Type-Options: nosniff` | Browsers may MIME-sniff responses and execute as wrong content type |
| `X-Frame-Options: DENY` | The app can be embedded in iframes (clickjacking) |
| `Referrer-Policy: strict-origin-when-cross-origin` | Full URL leaked to third-party destinations (social URLs) |
| `Permissions-Policy` | Camera/mic/geolocation APIs not explicitly disabled |

Given that the app uses React (which escapes HTML in JSX) and Discord OAuth (no user-controlled login form), the XSS risk is already low. But defense-in-depth matters: a missed `dangerouslySetInnerHTML` or a dependency vulnerability would have no CSP backstop.

**Why it matters:**

Clickjacking via `X-Frame-Options` is exploitable with no bugs needed — an attacker wraps the LFG page in an invisible iframe and tricks users into clicking buttons (e.g., "Accept invite"). `X-Content-Type-Options: nosniff` is a trivial add that prevents MIME-confusion attacks on uploaded media served from the same domain.

**Fix:**

Add a `headers()` export to `next.config.ts`:

```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",  // Required for Next.js inline scripts
            "style-src 'self' 'unsafe-inline'",   // Required for Tailwind
            "img-src 'self' data: blob: cdn.discordapp.com img.youtube.com i.ytimg.com https://*.supabase.co",
            "frame-src https://www.youtube.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "font-src 'self'",
          ].join("; "),
        },
      ],
    },
  ];
},
```

Start with `Content-Security-Policy-Report-Only` to validate before enforcing. Adjust the Supabase storage domain to match your project URL.

**QA:**
1. Run `curl -I https://overclock.lol/` and verify the security headers are present.
2. Try to embed the app in an iframe from a different domain — confirm the browser blocks it.
3. Verify that the Discord avatar images still load correctly with the updated `img-src`.

---

### [LOW] `display_name` Accepts Arbitrary Unicode Without Character Restriction

**Status:** Possible Risk

**Files:**
- `overclock/features/profile/actions/profile-basics.ts`
- `overclock/lib/profiles/profile-bio.ts`

**Issue:**

The `display_name` field is stored after a trim but with no Unicode character class restriction:

```ts
displayName: optionalTrimmedString(formData.get("display_name")),
```

The bio sanitizer removes control characters:
```ts
.replace(/[ --]/g, "")
```

But `display_name` uses only `optionalTrimmedString`, which does not filter control characters or restrict the character set. A user could set a display name containing:

- Bidirectional override characters (`U+202E`, `U+200F`) that flip text direction, e.g., reversing a link or filename shown next to the name
- Invisible characters (`U+200B`, zero-width space) that defeat username search or create visually identical usernames
- Confusable homograph characters that make a display name look like another user's

React escapes these when rendering, so they are not an XSS risk, but they can cause visual spoofing in the UI.

**Why it matters:**

An attacker creates a profile with display name `\u202Emoc.liame@retsniw` (RTL override makes "winner@email.com" read as an email). Other users see what looks like a clickable email or URL next to a profile.

**Fix:**

Apply the same control-character strip from `sanitizeProfileBio` to `display_name`:

```ts
function sanitizeDisplayName(value: FormDataEntryValue | null): string | null {
  const raw = value?.toString() ?? "";
  const stripped = raw
    .replace(/[ --​-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 0 ? stripped : null;
}
```

Also enforce a max length (the schema should have a constraint too).

**QA:**
1. Set display name to `\u202Ereversed` and verify the stored value has the RTL character stripped.
2. Set display name to `A​B` (A + zero-width space + B) and verify storage strips the invisible character.

---

### [LOW] YouTube Video ID Is Not Validated Against Expected Format

**Status:** Possible Risk

**Files:**
- `overclock/lib/profiles/featured-clip-shared.ts`

**Issue:**

`getYouTubeVideoId` extracts the video ID from a URL's path segment or query parameter and stores it without format validation:

```ts
if (parsedUrl.pathname === "/watch") {
  return parsedUrl.searchParams.get("v");  // no format check
}
if (parsedUrl.pathname.startsWith("/embed/")) {
  return parsedUrl.pathname.replace("/embed/", "").split("/")[0] || null;  // no format check
}
```

A YouTube URL like `https://youtube.com/watch?v=<img%20onerror%3Dalert(1)>` (URL-decoded: `?v=<img onerror=alert(1)>`) would yield a video ID of `<img onerror=alert(1)>`. This ID is then stored in the database and used in:

```ts
return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;  // thumbnail
return `https://www.youtube.com/embed/${videoId}`;             // embed URL
```

React JSX escapes attribute values, so `<img src={embedUrl} />` renders `<img src="https://...embed/&lt;img...&gt;">` — not exploitable as HTML injection. However, the raw string `<img onerror=alert(1)>` is persisted in the database column, which is an unexpected value for a field that should contain only `[A-Za-z0-9_-]{11}`.

**Why it matters:**

The immediate XSS risk is blocked by React. The concern is: if this data is ever consumed by a non-React surface (server-side rendering with a template engine, admin tools, logs), the raw stored value could cause issues. It also makes the DB column meaninglessly permissive.

**Fix:**

After extracting the video ID, validate it matches the expected YouTube ID format:

```ts
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{1,20}$/;

export function getYouTubeVideoId(value: string): string | null {
  // ... existing URL parsing ...
  const rawId = /* extracted id */;
  if (!rawId || !YOUTUBE_VIDEO_ID_RE.test(rawId)) return null;
  return rawId;
}
```

**QA:**
1. Submit a clip URL `https://youtube.com/watch?v=<script>` — confirm the clip is rejected with "Only YouTube URLs are supported."
2. Submit `https://youtube.com/watch?v=dQw4w9WgXcW` (valid ID) — confirm it saves correctly.

---

### [LOW] No Automated Dependency Vulnerability Scanning

**Status:** Confirmed

**Files:**
- `overclock/package.json`

**Issue:**

The `scripts` block in `package.json` contains `lint`, `typecheck`, `verify`, `test`, and `build`, but no `npm audit` step:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "verify": "npm run lint && npm run typecheck",
  "test": "..."
}
```

Key dependencies and their versions at audit time:
- `next@16.2.3` — Next.js 16 is current; watch for security advisories
- `@supabase/ssr@^0.10.2` — Supabase SSR client
- `@supabase/supabase-js@^2.103.0` — Supabase JS client
- `react@19.2.4` / `react-dom@19.2.4`
- `react-avatar-editor@^15.1.0` — used in avatar crop UI
- `react-easy-crop@^5.5.7` — used in avatar crop UI

No dependency audit is run as part of CI or development verification. A vulnerability in `react-avatar-editor`, `react-easy-crop`, or `@radix-ui/*` could introduce client-side issues that aren't caught.

**Fix:**

Add an audit step to `verify`:

```json
"audit": "npm audit --audit-level=high",
"verify": "npm run lint && npm run typecheck && npm run audit",
```

Or configure GitHub Dependabot in `.github/dependabot.yml` for automatic PR alerts on vulnerable dependencies.

**QA:**
1. Run `npm audit` and review the output.
2. Confirm CI fails on `HIGH` or `CRITICAL` severity advisories after the script is added.

---

## Positive Security Notes

The following areas were reviewed and found to be correctly implemented.

**Database-Layer Defense-in-Depth**
- RLS is enabled on all 16 tables. No table in the public schema is accessible without an explicit policy.
- All write paths go through SECURITY DEFINER RPCs with `set search_path = public, pg_temp` — this pins the search path and prevents search-path-based SQL injection or schema confusion attacks.
- Every RPC verifies `auth.uid()` is not null before any data access. Unauthenticated calls return structured error codes, never data.

**Ownership Enforcement**
- Every mutation verifies ownership via `auth.uid()` at both the RLS policy level AND inside the SECURITY DEFINER RPC. Double-checking at the DB layer means application bugs cannot bypass access control.
- `create_lfg_post_atomic`: `auth.uid() <> p_profile_id` → `forbidden`
- `close_owned_lfg_post`: `profile_id <> auth.uid()` → `forbidden`
- `send_play_invite`: `auth.uid() = p_recipient_profile_id` → `self_invite`; `auth.uid() is null` → `unauthenticated`
- `accept_play_invite`: `v_invite.recipient_profile_id <> auth.uid()` → `forbidden`
- `create_user_block`: `auth.uid() = p_blocked_profile_id` → `self_block`
- `accept_stack_request`: `v_request.owner_profile_id <> auth.uid()` → `forbidden`
- `remove_profile_connection`: `auth.uid() <> profile_low_id AND auth.uid() <> profile_high_id` → `forbidden`

**Block System**
The block system is comprehensive and consistently enforced across all surfaces:
- `send_play_invite`: checks `has_either_user_blocked` before creating
- `accept_play_invite`: rechecks blocks on accept; cancels if either user blocked the other
- `create_user_block`: cancels pending invites, declines pending stack requests, disconnects connections in the same transaction
- `get_lfg_feed_page_dto`: filters blocked profiles from the feed and from stack member lists
- `get_profile_page_dto`: returns `null` for the target profile if `target_blocks_viewer`
- `search_public_profiles_dto`: filters blocked profiles from results
- `send_stack_request` / `accept_stack_request`: check `are_profiles_blocked`

**Block Privacy** (`get_blocked_profile_ids_for_viewer`):
The function returns an empty array if `p_viewer_profile_id is distinct from auth.uid()`. Users cannot enumerate another user's block list.

**Transaction Atomicity**
All critical multi-row operations use `pg_advisory_xact_lock` to prevent race conditions:
- LFG post creation: `hashtext('lfg_post_create') + hashtext(profile_id + lfg_type)`
- Play invite send: `hashtext('play_invite_send') + hashtext(sender + recipient + post)`
- Play invite accept/decline/cancel: `hashtext('play_invite_transition') + hashtext(invite_id)`
- Stack request send: `hashtext('stack_request_send') + hashtext(user + post)`
- Stack request transition: `hashtext('stack_request_transition') + hashtext(request_id)`
- User block creation: `hashtext('user_block_pair') + hashtext(least/greatest pair)`
- Connection removal: `hashtext('profile_connection_transition') + hashtext(connection_id)`

**Database-Level Rate Limiting (Persistent)**
Unlike the in-process read limiters, all write operations are rate-limited in the database and survive instance restarts and multi-instance deployments:
- LFG post creation: 4 posts per 60 min per type, 2 active slots per 12 hours per role
- Play invites: 20 per 10 min globally per sender, 5 per 10 min per recipient
- User blocks: 20 block/unblock events per 10 min per user
- Stack requests: 10 per 10 min per user
- Avatar uploads: 6 per hour; cover uploads: 2 per hour (tracked in `profile_media_uploads`)

**Input Validation**
- Titles: 1–80 chars, whitespace normalized via `regexp_replace`
- Bio: 160 chars max, control characters stripped (`sanitizeProfileBio`)
- Social URLs: domain allowlist enforced; `javascript:` and arbitrary protocols rejected
- Roles, regions, game modes: enum-checked at both app and DB constraint level
- Invite messages: 0–280 chars, whitespace normalized
- File uploads: MIME type checked against `['image/jpeg', 'image/png', 'image/webp']`, size limits enforced

**No PII in Public API Responses**
- `discord_id` / `discord_user_id`: never returned by `get_profile_page_dto`, `search_public_profiles_dto`, or `get_lfg_feed_page_dto`
- Email: not stored (Discord OAuth only)
- Auth tokens: never sent to client
- `sender_snapshot` / `recipient_snapshot` / `requester_snapshot` in invites and requests: only contain public profile fields (username, display_name, avatar_url, rank, region)

**Storage Path Isolation**
Storage upload policies enforce exact path ownership via `auth.uid()`:
```sql
WITH CHECK (
  bucket_id = 'profile-media' AND
  name = 'profile-pictures/' || auth.uid()::text || '/avatar'
)
```
Users cannot overwrite each other's files. No path injection is possible since the path is constructed server-side.

**Return Path Validation**
`resolveReturnTo` in `overclock/features/profile/actions/shared.ts` validates that redirects are relative paths (`startsWith("/")` and not `startsWith("//")`) before use. The auth callback is the one exception (see findings above).

**Service-Role-Only Expiration**
LFG expiration and cleanup RPCs are explicitly revoked from all user roles:
```sql
revoke execute on function public.expire_lfg_posts() from anon;
revoke execute on function public.expire_lfg_posts() from authenticated;
grant execute on function public.expire_lfg_posts() to service_role;
```
Users cannot trigger bulk expiration or cleanup operations.

**Invite Expiry Enforcement**
`accept_play_invite` checks `expires_at <= now()` before accepting and marks the invite `expired` in the same transaction — preventing acceptance of expired invites even if the client-side timer lied.

**Empty UUID Fix**
Migration `20260515003000_fix_profile_page_dto_empty_uuid.sql` addresses UUID parsing from empty strings by using `nullif(auth.jwt() ->> 'sub', '')` and validating the result against a UUID regex before casting — preventing a PostgreSQL cast error from an empty `sub` claim.

**Error Message Hygiene**
Server actions and API routes return generic messages to clients (`"Unable to send that invite right now."`) and log detailed errors server-side with structured context. No stack traces, SQL errors, or internal IDs are returned in HTTP responses.

**DB Constraints as a Second Safety Net**
Even if application logic were bypassed, DB-level constraints prevent corrupt data:
- `play_invites_sender_not_recipient_check`: sender ≠ recipient
- `user_blocks_not_self_check`: cannot block self
- `stack_requests_self_request_check`: cannot request to join own stack
- `play_invites_status_check`: only valid status values
- `play_invites_message_length_check`: enforced at DB level too

---

## Missing Coverage

The following areas could not be fully verified from source code alone:

- **Supabase project access controls** — who has dashboard access and what their roles are (Owner, Admin, Developer) cannot be derived from migrations.
- **Supabase Storage bucket configuration** — whether the `profile-media` bucket is set to public or private at the project level (the RLS policy grants public SELECT, but the bucket's dashboard setting also matters).
- **Production environment variable security** — `.env.local` is not in the repo. Cannot verify that `SUPABASE_SERVICE_ROLE_KEY` is stored in secure secrets management (e.g., Vercel Environment Variables, not hardcoded in deployment scripts).
- **Supabase Realtime RLS** — Realtime subscriptions respect the table's RLS policies, but the channels and filters used in the client were not audited.
- **Cookie security settings (HttpOnly, Secure, SameSite)** — managed by `@supabase/ssr`. The library sets appropriate cookie flags in SSR mode, but the actual cookie headers were not verified in production.
- **Supabase CORS configuration** — the allowed origins for the Supabase project are configured in the Supabase dashboard and cannot be audited from the repo.
- **CI pipeline configuration** — no `.github/workflows/` directory was present. Cannot verify whether security checks run in CI.
- **Admin badge-granting flow** — `ADMIN_USERNAMES` env var controls access; the code path was not fully traced.
- **Realtime presence subscriptions** — `overclock/features/presence/` code accesses presence channels; the channel names and RLS enforcement were not fully traced.

---

## Recommended Next Steps

Prioritized checklist in order of impact:

1. **[IMMEDIATE] Validate `next` param in auth callback** — One function, five lines. Apply the same pattern as `resolveReturnTo`. No dependencies needed.

2. **[BEFORE SCALING] Replace in-process rate limiters with shared store** — Required before any multi-instance or serverless deployment. Upstash Redis + `@upstash/ratelimit` is the standard Vercel-compatible solution.

3. **[SHORT TERM] Add HTTP security headers in `next.config.ts`** — `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` are zero-risk adds. Start with `Content-Security-Policy-Report-Only` to tune the CSP before enforcing.

4. **[SHORT TERM] Add magic byte verification for file uploads** — Read the first 12 bytes of the uploaded file and verify they match the declared MIME type. Low effort, eliminates polyglot file upload risk.

5. **[SHORT TERM] Sanitize `display_name` for control and bidirectional characters** — Apply the same strip already in `sanitizeProfileBio`. Add a max-length constraint at the DB level.

6. **[SHORT TERM] Validate YouTube video ID format in `getYouTubeVideoId`** — Add a `^[A-Za-z0-9_-]{1,20}$` regex check on the extracted ID before returning it.

7. **[ONGOING] Add `npm audit` to CI** — Add `"audit": "npm audit --audit-level=high"` to `package.json` scripts and run it in CI to catch dependency vulnerabilities as they are disclosed.

8. **[ONGOING] Verify Supabase project settings** — Confirm: (a) service role key is stored in secure secrets, (b) `profile-media` bucket is set to "Public" intentionally, (c) Realtime is enabled only on needed tables, (d) only required team members have dashboard access.
