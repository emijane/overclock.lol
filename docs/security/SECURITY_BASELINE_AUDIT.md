# Security Baseline Audit

Last updated: 2026-05-14

## Executive Summary

Overclock’s security model is mostly built around Supabase Auth plus server-side access through the SSR client, with sensitive writes intentionally funneled into `security definer` RPCs. That is the right high-level shape. The strongest surfaces are the write RPCs that explicitly gate on `auth.uid()` and re-check ownership or participant status in SQL.

The biggest confirmed risks are not basic auth bypasses in server actions. They are viewer-context spoofing and privacy-lelevant helper exposure inside read RPCs and block helpers:

1. `get_lfg_feed_page_dto` accepts a caller-supplied `p_viewer_profile_id` for anonymous callers and then returns viewer-only bundle data for that profile, including `heroPools`, `competitiveProfile`, active-post counts, and relationship state. This is a confirmed cross-user data exposure boundary failure.
2. `get_profile_page_dto` accepts a caller-supplied `p_viewer_profile_id` without verifying it matches `auth.uid()`. That lets callers infer block state, connection state, and pending invite state for arbitrary profile pairs.
3. Block helper RPCs such as `get_blocked_profile_ids_for_viewer`, `is_profile_blocked_by`, and `has_either_user_blocked` are granted to authenticated users but do not enforce that the caller is one of the profiles involved. They expose private block graph information.
4. The checked-in migration history is incomplete for several foundational tables. For `profiles`, `competitive_profiles`, `competitive_role_profiles`, `profile_featured_clips`, `profile_hero_pools`, `badges`, and `profile_badges`, this repo does not fully prove final RLS/grant state. That is itself a baseline security gap because code review cannot reconstruct schema truth from source alone.

No evidence of service-role key leakage to the browser was found. The only service-role client creator is server-side and only used by admin badge actions.

## Architecture Diagram Summary

`Browser` -> `Next.js route / client component` -> `server action / server loader / route handler` -> `lib/supabase/server.ts SSR client` -> `Supabase PostgREST / Auth / Storage`

`Browser login` -> `lib/supabase/client.ts browser client` -> `Supabase OAuth` -> `app/auth/callback/route.ts` -> `exchangeCodeForSession()` -> optional profile sync -> redirect

`All requests` -> `proxy.ts` -> `lib/supabase/proxy.ts updateSession()` -> `supabase.auth.getClaims()` -> refreshed cookies / `Cache-Control: private, no-store`

`Admin only` -> `app/admin/badges/actions.ts` -> `lib/supabase/admin.ts service role client` -> unrestricted table writes guarded by app-side admin checks

## Auth Architecture Inventory

| File | Purpose | Trust boundary | Risks |
| --- | --- | --- | --- |
| [overclock/lib/profiles/get-current-profile.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/profiles/get-current-profile.ts:1) | Canonical signed-in profile lookup via `auth.getUser()` plus `profiles` read | Server-only helper returning current authenticated identity | Stronger than cookie heuristics. Depends on `profiles` row existing for onboarding state. |
| [overclock/lib/profiles/get-optional-current-user-id.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/profiles/get-optional-current-user-id.ts:1) | Fast optional current user ID lookup using auth cookie presence + `getClaims()` | Server-only optimization helper | Uses cookie-name heuristic instead of auth truth. Low-risk optimization, but not suitable as an authorization source of truth. |
| [overclock/lib/profiles/get-optional-current-invite-viewer.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/profiles/get-optional-current-invite-viewer.ts:1) | Optional invite viewer state for routes that may render to guests | Server-only optimization helper | Same heuristic risk as above. Correctly falls back to guest/profile-required states. |
| [overclock/features/auth/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/features/auth/actions.ts:1) | Shared sign-out action | Server action, authenticated session mutation | Low risk. |
| [overclock/app/auth/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/auth/actions.ts:1) | Thin re-export of sign-out action | Server action boundary | Low risk. |
| [overclock/app/login/components/discord-login-card.tsx](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/login/components/discord-login-card.tsx:1) | Starts Discord OAuth with browser Supabase client | Browser initiates auth redirect | Redirect target uses same-origin `window.location.origin`; no off-origin open redirect here. |
| [overclock/app/auth/callback/route.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/auth/callback/route.ts:1) | OAuth callback, code exchange, profile sync, redirect | Server route handler with session-establishing authority | `next` is only concatenated onto current origin, so not an external open redirect, but still allows arbitrary internal redirects. Sync failure is swallowed and logged. |
| [overclock/lib/profiles/sync-discord-profile-fields.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/profiles/sync-discord-profile-fields.ts:1) | Syncs trusted auth metadata into `profiles.discord_username` | Server-side profile mutation after login | Uses server client under current user context, not service role. Safe if `profiles` RLS correctly restricts updates to owner. |
| [overclock/lib/supabase/proxy.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/proxy.ts:1) | Refreshes auth session in proxy/middleware | Edge/session trust boundary | Good `Cache-Control: private, no-store`. Global `getClaims()` adds cost to every matched request. |
| [overclock/proxy.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/proxy.ts:1) | Global request proxy entrypoint with feed rate limiting and session refresh | Request-wide auth/session boundary | Rate limiting runs before session update for matched routes. Must remain carefully scoped. |

## Supabase Client Inventory

| File | Class | Env vars | Safe? | Client exposure possible? | Notes |
| --- | --- | --- | --- | --- | --- |
| [overclock/lib/supabase/server.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/server.ts:1) | Server SSR client | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes, intended | Not by itself, but file is not marked `server-only` | Session-bound, cookie-backed. |
| [overclock/lib/supabase/client.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/client.ts:1) | Browser client | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes, intended public | Yes, by design | Used for OAuth start and realtime/presence refresh clients. |
| [overclock/lib/supabase/proxy.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/proxy.ts:1) | Edge/runtime session client | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | No direct browser exposure | Used only from proxy. |
| [overclock/lib/supabase/admin.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/admin.ts:1) | Admin/service-role client | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Conditionally safe | High impact if imported into a client bundle or misused in a route | No browser import found. Only current use is admin badge actions. |

Admin client imports found:

| File | Use |
| --- | --- |
| [overclock/app/admin/badges/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/admin/badges/actions.ts:1) | Service-role writes to `profile_badges` after app-side admin gate |

## RPC Inventory

Risk levels below are baseline security risk, not performance risk.

| Function | Read/Write | Security mode | `auth.uid()` enforced? | Spoofable params? | Grants | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `create_lfg_post_atomic` | Write | `security definer` final | Yes | `p_profile_id` checked against `auth.uid()` | `authenticated` | P2 |
| `close_owned_lfg_post` | Write | `security definer` final | Yes | `p_post_id` arbitrary but ownership checked | `authenticated` | P2 |
| `send_play_invite` | Write | `security definer` final | Yes | Recipient/post IDs caller-controlled but validated | `authenticated` | P2 |
| `accept_play_invite` | Write | `security definer` final | Yes | `p_invite_id` arbitrary but recipient checked | `authenticated` | P2 |
| `decline_play_invite` | Write | `security definer` | Yes | `p_invite_id` arbitrary but recipient checked | `authenticated` | P2 |
| `cancel_play_invite` | Write | `security definer` | Yes | `p_invite_id` arbitrary but sender checked | `authenticated` | P2 |
| `expire_play_invites` | Write | `security definer` | Yes | `p_invite_id` scoped to participant rows | `authenticated` | P2 |
| `get_profile_connection_count` | Read | `security definer` | No | `p_profile_id` fully caller-supplied | `anon`, `authenticated` | P3 if public counts are intended |
| `remove_profile_connection` | Write | `security definer` | Yes | `p_connection_id` arbitrary but participant checked | `authenticated` | P2 |
| `send_stack_request` | Write | `security definer` | Yes | `p_post_id` and role caller-supplied but validated | `authenticated` | P2 |
| `accept_stack_request` | Write | `security definer` | Yes | `p_request_id` arbitrary but owner checked | `authenticated` | P2 |
| `decline_stack_request` | Write | `security definer` | Yes | `p_request_id` arbitrary but owner checked | `authenticated` | P2 |
| `leave_stack` | Write | `security definer` | Yes | `p_post_id` arbitrary but membership checked | `authenticated` | P2 |
| `remove_stack_member` | Write | `security definer` | Yes | `p_post_id` and member ID caller-supplied but owner/member checks present | `authenticated` | P2 |
| `is_profile_in_active_stack` | Read | `security definer` | No | `p_profile_id` caller-supplied | `authenticated` | P3 |
| `expire_stack_posts` | Write | `security definer` | No | No user params | `anon`, `authenticated` | P2 abuse surface because anonymous callers can trigger write work |
| `is_profile_blocked_by` | Read | `security definer` | No | Both profile IDs spoofable | `authenticated` | P1 privacy leak |
| `has_either_user_blocked` | Read | `security definer` | No | Both profile IDs spoofable | `authenticated` | P1 privacy leak |
| `are_profiles_blocked` | Read | `security definer` | No | Both profile IDs spoofable | `authenticated` | P1 privacy leak |
| `get_blocked_profile_ids_for_viewer` | Read | `security definer` | No | `p_viewer_profile_id` spoofable | `authenticated` | P1 privacy leak |
| `create_user_block` | Write | `security definer` | Yes | Target ID caller-supplied but validated | `authenticated` | P2 |
| `delete_user_block` | Write | `security definer` | Yes | Target ID caller-supplied; no ownership spoof | `authenticated` | P2 |
| `get_profile_page_dto` | Read | `security definer` | Partially | `p_viewer_profile_id` spoofable in current final SQL | `anon`, `authenticated` | P1 privacy leak / relationship inference |
| `get_matches_page_dto` | Read | `security definer` | Yes | `p_current_profile_id` checked against `auth.uid()` | `authenticated` | P2 |
| `get_notifications_menu_dto` | Read | `security definer` | Yes | `p_current_profile_id` checked against `auth.uid()` | `authenticated` | P2 |
| `get_lfg_feed_page_dto` | Read | `security definer` | Partially | For anonymous callers, `p_viewer_profile_id` is spoofable | `anon`, `authenticated` | P0/P1 data exposure |
| `get_account_posts_page_dto` | Read | `security definer` | Yes | `p_profile_id` checked against `auth.uid()` | `authenticated` | P2 |
| `search_public_profiles_dto` | Read | `security definer` | Partially | For anonymous callers, `p_viewer_profile_id` is spoofable | `anon`, `authenticated` | P2 inference leak |
| `update_last_seen` | Write | `security definer` | Yes | No spoofable profile ID | `anon`, `authenticated` | P3 |

## RLS And Table Inventory

This repo does not contain a full bootstrap migration for several older tables. The table states below are split between confirmed local migration evidence and unknown baseline gaps.

### Confirmed From Local Migrations

| Table | RLS enabled? | Read grants/policies | Write protection | Ownership enforcement | Findings |
| --- | --- | --- | --- | --- | --- |
| `public.lfg_posts` | Yes | `anon` and `authenticated` can `SELECT`; policy allows active public rows and owner reads | direct `INSERT/UPDATE/DELETE` revoked; writes via RPC | owner read policy; write RPC checks `auth.uid()` | Public by design. Read window limited by status and age. |
| `public.play_invites` | Yes | `authenticated` `SELECT`; participant-only policy | direct DML revoked; writes via RPC | sender/recipient enforced in RPCs | Good participant scoping. |
| `public.profile_connections` | Yes | `authenticated` `SELECT`; active participant-only policy | no direct write grant found; writes via RPC | participant enforced in RPCs | Good for direct reads. Count helper is public-ish. |
| `public.stack_requests` | Yes | `authenticated` `SELECT`; requester or owner policy | direct DML revoked; writes via RPC | owner/requester enforced in RPCs | Good direct table protections. |
| `public.stack_members` | Yes | `public` `SELECT`; `stack_members_public_read` policy is `using (true)` | direct DML revoked | none for reads, public by design | Public membership visibility is intentional-looking but should be explicitly accepted as product policy. |
| `public.user_blocks` | Yes | `authenticated` `SELECT` only for blocker/owner | direct DML technically granted to `authenticated`, but RLS restricts to owner insert/delete | blocker must equal `auth.uid()` | Table RLS is good; helper RPC grants are the weaker point. |
| `public.user_block_events` | Yes | no public/authenticated grants found | no public/authenticated grants found | n/a | Good audit-log isolation if no other grants exist. |
| `public.profile_media` | Yes | owner-only policies for `SELECT` | insert/update owner-only policies | `profile_id = auth.uid()` | No explicit grants found in local migration; baseline grant state not fully provable from repo. |
| `public.profile_media_uploads` | Yes | owner-only policy for `SELECT` | insert owner-only policy | `profile_id = auth.uid()` | Same grant-state caveat as `profile_media`. |
| `storage.objects` for bucket `profile-media` | Supabase storage RLS policy confirmed | public read for whole bucket | authenticated insert/update only on exact own avatar/cover paths | exact path match to `auth.uid()` | No MIME/content validation at storage layer. Public object serving is intentional. |

### Tables Referenced By App But Not Fully Defined In Local Migration History

| Table | Evidence in repo | Confirmed final RLS state? | Baseline concern |
| --- | --- | --- | --- |
| `public.profiles` | altered by presence/media migrations; heavily queried | No | Foundational table without bootstrap DDL/policies in repo. Cannot prove owner/public read/update rules from source alone. |
| `public.competitive_profiles` | altered and queried | No | Cannot prove whether direct reads/writes are intentionally public or owner-only. |
| `public.competitive_role_profiles` | queried and indexed | No | Same concern. |
| `public.profile_hero_pools` | queried, indexed, returned in DTOs | No | Important because hero pools appear viewer-scoped in some DTOs. Missing base policy proof is high-value. |
| `public.profile_featured_clips` | queried/updated/deleted in app | No | App guards with `profile_id = user.id`, but DB baseline not provable. |
| `public.badges` | queried publicly-ish in app/admin | No | Low sensitivity, but no local proof. |
| `public.profile_badges` | queried publicly-ish; service-role writes | No | Important because service-role admin path depends on its schema. |
| `public.notifications` | not found in code or migrations | No table found | Notification UI is DTO-derived, not table-backed at present. |

## Storage Audit

Implemented storage surface found:

| Bucket / path | Public or private | Upload rule | Overwrite risk | Ownership enforcement | Findings |
| --- | --- | --- | --- | --- | --- |
| `profile-media/profile-pictures/<uid>/avatar` | Public read | authenticated `INSERT` and `UPDATE` on exact own path | Owner can overwrite own avatar indefinitely | exact `auth.uid()` path match | Good path scoping. No storage-layer MIME/type guard. |
| `profile-media/covers/<uid>/cover` | Public read | authenticated `INSERT` and `UPDATE` on exact own path | Owner can overwrite own cover indefinitely | exact `auth.uid()` path match | Same MIME/content validation gap. |
| `profile-media/profile-pictures/default_icon.png` | Public read | no direct user write rule | Low | static path | Default avatar is globally readable as intended. |

Storage-specific findings:

1. No separate `avatars`, `covers`, or standalone `profile-pictures` buckets were found. The app uses one public bucket, `profile-media`, with prefix-based ownership rules.
2. MIME checks live in [overclock/app/account/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/account/actions.ts:1), not in storage policy. Attackers who bypass app code and call Storage APIs directly can still upload any bytes to their own allowed object path if Supabase accepts the request.
3. Public read is broad for the whole bucket. That is consistent with public avatars/covers, but it means any future sensitive object placed in the same bucket would become exposed by default.

## Server Action Trust Audit

### Stronger Patterns

| Files | Pattern | Assessment |
| --- | --- | --- |
| [overclock/app/account/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/account/actions.ts:1), [overclock/app/account/competitive/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/account/competitive/actions.ts:1), [overclock/app/onboarding/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/onboarding/actions.ts:1) | Server action derives acting user from `supabase.auth.getUser()` | Good server-side identity source. |
| [overclock/app/matches/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/matches/actions.ts:1), [overclock/app/stacks/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/stacks/actions.ts:1), [overclock/lib/blocks/user-blocks.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/blocks/user-blocks.ts:1) | Client-supplied IDs are passed into RPCs that re-check participant/owner rules | Good pattern as long as RPC stays correct. |
| [overclock/app/lfg/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/lfg/actions.ts:1) | Sensitive write path uses `getCurrentProfile()` then RPC | Good, assuming current `create_lfg_post_atomic` remains authoritative. |
| [overclock/app/u/[username]/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/u/[username]/actions.ts:1) | Featured-clip updates and deletes include `profile_id = user.id` in the query | Safer than trusting `clip_id` alone. |

### Trust Findings

1. Many actions trust hidden `FormData` IDs such as `post_id`, `request_id`, `connectionId`, `inviteId`, and `member_profile_id`, but most of the real authorization happens correctly in SQL or in `eq("profile_id", user.id)` filters. This is acceptable only because the DB layer is doing the actual ownership check.
2. `return_to` and `return_path` values are sanitized to same-origin slash paths in [overclock/app/account/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/account/actions.ts:1) and [overclock/app/lfg/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/lfg/actions.ts:1). No obvious open redirect was found there.
3. The highest-risk trust errors are in read RPCs, not server actions. The app often passes the current viewer’s ID honestly, but the RPC itself sometimes trusts that parameter even for anonymous callers.

## Secrets And Config Audit

| File | Config surface | Finding |
| --- | --- | --- |
| [overclock/lib/supabase/client.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/client.ts:1) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Correct public exposure. |
| [overclock/lib/supabase/server.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/server.ts:1) | same public envs on server | Fine, but file is not tagged `server-only`. |
| [overclock/lib/supabase/admin.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/admin.ts:1) | `SUPABASE_SERVICE_ROLE_KEY` | No direct leak found. High-value file; should remain server-only. |
| [overclock/lib/admin/admin-access.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/admin/admin-access.ts:1) | `ADMIN_USERNAMES`, `NODE_ENV` | If `ADMIN_USERNAMES` is empty, all users are treated as admin outside production. Safe for local dev, unsafe for any internet-exposed non-production deploy. |
| [overclock/README.md](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/README.md:45) | public Supabase setup vars | No secret leakage. |

## Findings

### P0

1. `get_lfg_feed_page_dto` leaks viewer-only data for arbitrary profile IDs to anonymous callers.
   File: [overclock/supabase/migrations/20260513040000_optimize_lfg_feed_page_dto.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260513040000_optimize_lfg_feed_page_dto.sql:1)
   Why: if `auth.uid()` is `null`, the function still accepts `p_viewer_profile_id`, loads `get_blocked_profile_ids_for_viewer(p_viewer_profile_id)`, and builds `viewerBundle` from `competitive_profiles`, `competitive_role_profiles`, and `profile_hero_pools` for that arbitrary ID.
   Exploit scenario: an unauthenticated attacker can call the RPC with a guessed profile UUID and recover that user’s viewer bundle, then infer feed relationship state such as connected or invite-sent against authors.

### P1

1. `get_profile_page_dto` trusts caller-supplied `p_viewer_profile_id` without matching it to `auth.uid()`.
   File: [overclock/supabase/migrations/20260514000000_optimize_profile_page_dto.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260514000000_optimize_profile_page_dto.sql:1)
   Why: `viewer_state` uses `coalesce(p_viewer_profile_id, current_user_id_if_has_profile)` and never rejects mismatches.
   Exploit scenario: a caller can ask “what would the relationship state be if user X viewed user Y?” and learn connection existence, pending outgoing invite existence, and block-state-derived suppression.

2. Block helper RPCs expose private block graph relationships to any authenticated caller.
   Files: [20260513000000_add_user_blocks.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260513000000_add_user_blocks.sql:91), [20260513000000_add_user_blocks.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260513000000_add_user_blocks.sql:108), [20260513000000_add_user_blocks.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260513000000_add_user_blocks.sql:137)
   Why: `is_profile_blocked_by`, `has_either_user_blocked`, `are_profiles_blocked`, and `get_blocked_profile_ids_for_viewer` are `security definer` and do not require the caller to be the subject of the query.
   Exploit scenario: any signed-in account can map who blocked whom, or fetch another viewer’s entire blocked/blocked-by ID set.

3. Schema truth for foundational profile tables is not reconstructable from repo source.
   Files: local migrations missing bootstrap definitions for `profiles`, `competitive_profiles`, `competitive_role_profiles`, `profile_hero_pools`, `profile_featured_clips`, `badges`, `profile_badges`
   Why: security review cannot prove final RLS/grant state for core tables from checked-in code.
   Exploit scenario: a permissive production policy could exist unnoticed because source control does not fully describe it.

### P2

1. `expire_stack_posts()` is anonymous-writable work.
   File: [overclock/supabase/migrations/20260510030000_repair_stack_runtime.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260510030000_repair_stack_runtime.sql:216)
   Why: `grant execute ... to anon, authenticated` on a mutating function.
   Exploit scenario: anonymous callers repeatedly trigger global expiration work to create unnecessary database load.

2. Storage policy enforces path ownership but not object type.
   Files: [overclock/supabase/migrations/20260507000000_profile_avatar_and_media_tracking.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260507000000_profile_avatar_and_media_tracking.sql:66), [overclock/app/account/actions.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/account/actions.ts:1)
   Why: MIME checks exist in app code only.
   Exploit scenario: a direct Storage API caller uploads non-image content to their own public avatar/cover object path.

3. Admin access defaults open in non-production when `ADMIN_USERNAMES` is unset.
   File: [overclock/lib/admin/admin-access.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/admin/admin-access.ts:1)
   Why: `return process.env.NODE_ENV !== "production"`.
   Exploit scenario: a preview or staging environment exposed to the internet could unintentionally grant badge-admin access to any authenticated user.

4. `search_public_profiles_dto` accepts spoofed viewer IDs for anonymous callers.
   File: [overclock/supabase/migrations/20260513030000_add_feed_account_search_bundle_rpcs.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260513030000_add_feed_account_search_bundle_rpcs.sql:405)
   Why: mismatch check only runs when `auth.uid()` is not `null`.
   Exploit scenario: anonymous callers can query search visibility as if they were another user and infer that user’s block filter effect.

### P3

1. Server-only Supabase helpers are not marked with `server-only`.
   Files: [overclock/lib/supabase/server.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/server.ts:1), [overclock/lib/supabase/admin.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/lib/supabase/admin.ts:1)
   Risk: accidental future import into a client boundary is easier than it should be.

2. `update_last_seen()` is granted to `anon` as well as `authenticated`.
   File: [overclock/supabase/migrations/20260514010000_add_update_last_seen_rpc.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260514010000_add_update_last_seen_rpc.sql:37)
   Risk: low because the function checks `auth.uid()`, but the grant is broader than needed.

3. OAuth callback internal redirect target is not tightly allowlisted.
   File: [overclock/app/auth/callback/route.ts](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/app/auth/callback/route.ts:1)
   Risk: low because redirects stay on current origin, but the route still accepts arbitrary internal target paths.

## Recommended Next Audit Order By Page

1. `/duos`, `/stacks`, and `/lfg`
   Reason: confirmed P0 viewer-bundle spoofing and relationship-state leakage in `get_lfg_feed_page_dto`.
2. `/u/[username]`
   Reason: confirmed P1 relationship and block-state inference in `get_profile_page_dto`.
3. `/search/users`
   Reason: `search_public_profiles_dto` shares the same spoofable viewer-context pattern for anonymous callers.
4. `/matches` and nav notifications
   Reason: these RPCs appear better scoped, but they depend on block helpers and relationship data paths.
5. `/account`
   Reason: storage/public object assumptions, featured clips, and profile-owned write surfaces.
6. `/admin/badges`
   Reason: narrow but high-impact service-role path plus non-production admin default behavior.

## Notes

1. No standalone `notifications` table was found. Current notification surfaces are derived from invites and stack requests through DTO RPCs.
2. This audit is intentionally adversarial and only claims what the local code and migrations prove. For older schema objects whose bootstrap migrations are missing from the repo, absence of proof is treated as a security-relevant documentation gap.
