# GET Latency Audit

**Date:** 2026-05-13  
**Scope:** Application-code latency on GET /u/[username] and GET /duos; updateLastSeen() POST variance  
**Status:** P0 fix shipped — see [Fix: get_lfg_feed_page_dto N+1](#fix-get_lfg_feed_page_dto-n1) below

---

## 2026-05-20 Follow-Up

This audit remains useful for the measured Supabase latency, but one shell-level
detail has changed since it was written:

- `overclock/app/layout.tsx` no longer calls `getCurrentProfile()` directly
- the shared auth bar now owns its own server-side identity lookup
- authenticated routes still use `getCurrentProfile()` where they need
  request-scoped identity

Keep that split in mind when using this audit to reason about current shell
coupling or cache boundaries.

Current repo baseline on 2026-05-20:

- `npm run lint` passes
- `npm test` passes
- committed CI already exists at `.github/workflows/ci.yml`
- `overclock/next.config.ts` does not enable `cacheComponents`
- proxy responses are still forced to `Cache-Control: private, no-store`

Current shell decision:

- do not keep growing auth work in `overclock/app/layout.tsx`
- isolate signed-in shell state into a smaller auth-aware boundary when the
  shell refactor lands
- keep auth and authorization decisions closest to page loaders, route
  entrypoints, actions, and route handlers

Why this matters even before a runtime refactor:

- today, `private, no-store` and disabled `cacheComponents` mean the caching win
  is not immediately realized
- the boundary decision still removes ambiguity for the next pass and keeps the
  root shell compatible with future caching/performance work
- `PresenceProvider` already follows the desired model because it resolves user
  identity in the browser instead of forcing root-layout server personalization

## Summary Diagnosis

The 764ms and 1254ms application-code times are driven entirely by **Supabase RPC execution**, not middleware, proxy overhead, or updateLastSeen(). The proxy contributes 8–11ms (JWT decode + cookie writes). updateLastSeen() is client-only and fires after page paint — it is not in the GET critical path.

Both routes pay an initial auth round-trip (~80–150ms) from `getCurrentProfile()`, which does `auth.getUser()` then a `profiles SELECT` in sequence. React `cache()` deduplicates it across root layout and page components, so it only executes once per request.

The remaining latency is inside two stored procedures:

- **`get_profile_page_dto`** runs ~12 sequential sub-operations in a plpgsql procedure (no CTEs). It also hits `competitive_profiles` twice via separate scalar subselects instead of once.
- **`get_lfg_feed_page_dto`** has a per-row EXISTS N+1 pattern in the main aggregation: up to 4 EXISTS subqueries per post × 30 posts = up to 120 EXISTS executions per page load.

---

## Route-by-Route Table

| Route | Observed Total | App-code | Network+Proxy | Supabase Calls (from app) | RPC Complexity |
|---|---|---|---|---|---|
| GET /u/emi | 785ms | 764ms | ~21ms | 2 (getCurrentProfile + get_profile_page_dto RPC) | ~12 sequential sub-ops in plpgsql |
| GET /duos | 1337ms | 1254ms | ~83ms | 2 (getCurrentProfile cached; get_lfg_feed_page_dto RPC) | CTEs + up to 120 EXISTS per page load |
| POST updateLastSeen | — | 222–1043ms | — | 2 (auth.getUser + UPDATE profiles) | No RPC; sequential writes |

---

## Files Inspected

| File | Role |
|---|---|
| `overclock/features/presence/actions.ts` | updateLastSeen() implementation |
| `overclock/components/presence/presence-provider.tsx` | Only caller of updateLastSeen() in render path |
| `overclock/app/account/actions.ts` | Re-exports updateLastSeen (server action, not page load path) |
| `overclock/proxy.ts` | Middleware entry — rate limit + updateSession |
| `overclock/lib/supabase/proxy.ts` | updateSession: auth.getClaims() + Cache-Control header |
| `overclock/lib/profiles/get-current-profile.ts` | getCurrentProfile() — React cache() wrapped |
| `overclock/app/layout.tsx` | Root layout: renders `GlobalAuthBarServer` and `PresenceProvider` |
| `overclock/components/navigation/global-auth-bar-server.tsx` | Shared auth bar: calls `getCurrentProfile()` |
| `overclock/app/u/[username]/page.tsx` | Profile page: calls getCurrentProfile() (cache hit) + getProfilePageDto() |
| `overclock/lib/pages/profile-page-dto.ts` | Calls `get_profile_page_dto` RPC |
| `overclock/app/duos/page.tsx` | Thin wrapper around LFGSectionPage |
| `overclock/app/lfg/section-page.tsx` | Passes config + searchParams to LFGPageShell |
| `overclock/features/lfg/components/lfg-page-shell.tsx` | Calls getCurrentProfile() (cache hit) + getLFGPageData() |
| `overclock/lib/pages/lfg-feed-page-dto.ts` | Calls `get_lfg_feed_page_dto` RPC |
| `overclock/supabase/migrations/20260513020000_add_page_bundle_rpcs.sql` | get_profile_page_dto and get_matches_page_dto SQL |
| `overclock/supabase/migrations/20260513030000_add_feed_account_search_bundle_rpcs.sql` | get_lfg_feed_page_dto and get_account_posts_page_dto SQL |

---

## updateLastSeen() Callers

**Implementation** — `overclock/features/presence/actions.ts:10`

Two sequential Supabase calls:
1. `supabase.auth.getUser()` — validates the session
2. `supabase.from("profiles").update({ last_seen_at })` — writes to profiles table

**Callers:**

| File | Line | Trigger | Blocking? |
|---|---|---|---|
| `overclock/components/presence/presence-provider.tsx` | 95, 125, 131 | Channel subscribe (force), visibility change, 60s heartbeat | No — all `void` / fire-and-forget |
| `overclock/app/account/actions.ts` | 36 | Re-export only; not called on page load | — |

**Key facts:**
- `presence-provider.tsx` is a `"use client"` component — updateLastSeen() is never called during SSR.
- `writeLastSeen()` is throttled: minimum 2 minutes between writes (`LAST_SEEN_WRITE_INTERVAL_MS`), checked at line 90.
- On first subscribe (`force=true`, line 125), the throttle is bypassed and updateLastSeen fires after channel is ready — this is post-hydration, not blocking page paint.
- The POST 222ms–1043ms variance reflects network jitter to Supabase plus the two sequential calls. It does not affect GET page latency.

---

## Supabase Query Count Per Route

### GET /u/[username]

| Step | File | Calls | Notes |
|---|---|---|---|
| getCurrentProfile | `lib/profiles/get-current-profile.ts:11,17` | 2 | auth.getUser() → profiles SELECT; sequential; React-cached |
| get_profile_page_dto RPC | `lib/pages/profile-page-dto.ts:401` | 1 RPC | Contains ~12 sequential sub-ops (see below) |
| **Total from app layer** | | **3 Supabase calls** | |

**Inside get_profile_page_dto (sequential plpgsql, migration line 19–293):**

| # | Operation | Migration Lines | Notes |
|---|---|---|---|
| 1 | profiles EXISTS (viewer has profile) | 44–49 | Only if auth.uid() is not null |
| 2 | profiles SELECT (target user by username) | 63–89 | Main profile fetch |
| 3 | `is_profile_blocked_by(target, viewer)` | 103 | Function call |
| 4 | `is_profile_blocked_by(viewer, target)` | 104 | Second function call (separate) |
| 5 | `has_either_user_blocked(viewer, target)` | 122 | Third function call |
| 6 | profile_connections SELECT | 123–129 | Active connection lookup |
| 7 | play_invites SELECT | 131–138 | Pending outgoing invite |
| 8 | `get_profile_connection_count(target)` | 148 | Fourth function call |
| 9 | competitive_profiles scalar subselect (main_role) | 182–186 | First hit on competitive_profiles |
| 10 | competitive_profiles scalar subselect (platform) | 187–191 | **Second hit on same table** |
| 11 | competitive_role_profiles jsonb_agg | 194–210 | Roles array |
| 12 | profile_hero_pools SELECT | 213–219 | Hero pools |
| 13 | profile_featured_clips SELECT + jsonb_agg | 224–243 | Limit 2 |
| 14 | profile_badges JOIN badges jsonb_agg | 244–260 | All badges |
| 15 | lfg_posts SELECT + jsonb_agg | 261–283 | Last 2 active posts (expires_at > now()) |

**Notable:** competitive_profiles is queried twice with separate scalar subselects (lines 182–191). A single CTE or joined query could fetch both columns in one pass.

---

### GET /duos

| Step | File | Calls | Notes |
|---|---|---|---|
| getCurrentProfile | `lib/profiles/get-current-profile.ts` | 0 new | Shared auth bar already populated the cache |
| getLFGFeedPageDto RPC | `lib/pages/lfg-feed-page-dto.ts:348` | 1 RPC | Contains N+1 EXISTS per post (see below) |
| **Total from app layer** | | **1 Supabase call** (+ 2 cached) | |

**Inside get_lfg_feed_page_dto (migration lines 1–277):**

Postgres-level execution:

| Phase | What runs | Notes |
|---|---|---|
| feed_posts CTE | lfg_posts SELECT with filters, ORDER BY, LIMIT 30 | Single scan |
| badge_sets CTE | profile_badges JOIN badges, grouped by profile_id | Batch — good |
| stack_member_sets CTE | stack_members JOIN profiles, grouped by post_id | Batch — good, stacks only |
| Main aggregation — per post: inviteState | EXISTS on profile_connections; EXISTS on play_invites | **2 EXISTS per post** |
| Main aggregation — per post: stackRequestState | EXISTS on stack_members; subselect on stack_requests | **2 more sub-ops per post** |
| Viewer bundle: activePostCounts | lfg_posts count with filters | 1 query |
| Viewer bundle: competitiveProfile (main_role) | competitive_profiles scalar subselect | First hit |
| Viewer bundle: competitiveProfile (platform) | competitive_profiles scalar subselect | **Second hit, same table** |
| Viewer bundle: roles | competitive_role_profiles jsonb_agg | 1 query |
| Viewer bundle: heroPools | profile_hero_pools SELECT | 1 query |

**N+1 detail:** Lines 152–191 compute `inviteState` and `stackRequestState` inside the `jsonb_agg` for each post row. Postgres evaluates these as correlated subqueries per row. With 30 posts from distinct profiles and a logged-in viewer:
- Up to 2 EXISTS (profile_connections, play_invites) per post for inviteState
- Up to 2 sub-ops per post for stackRequestState (stack_members EXISTS, stack_requests subselect)
- Worst case: 4 × 30 = 120 correlated subquery executions

The short-circuit at line 154 (`when v_viewer_profile_id is null or fp.profile_id = v_viewer_profile_id then 'invite_to_play'`) helps for guest views and own posts, but an authenticated viewer seeing 30 others' posts gets the full cost.

---

## GET Path Writes

Neither GET route performs writes during page load:

- `getCurrentProfile()` is explicitly read-only (comment in source at `get-current-profile.ts:30`).
- `get_profile_page_dto` and `get_lfg_feed_page_dto` are `security definer` read-only functions — no DML.
- `updateLastSeen()` is client-side only; it fires after hydration, never during SSR GET handling.
- `proxy.ts` calls `auth.getClaims()` which may refresh and set cookies but does not write to app tables.

---

## Proxy Analysis

`overclock/proxy.ts` runs on every non-static request. It does:
1. `isLFGFeedRateLimited()` — in-memory check, sub-millisecond.
2. `updateSession()` (`lib/supabase/proxy.ts:4`) — calls `supabase.auth.getClaims()` (JWT decode, not a Supabase API round-trip for valid tokens using the publishable key) then sets `Cache-Control: private, no-store`.

Observed proxy time: 8–11ms. **Not a bottleneck.** The `Cache-Control: private, no-store` header on every response means no CDN or browser caching is possible for any page, which is a correct choice for auth-gated content but worth noting.

---

## Bottlenecks Ranked

### P0 — /duos: per-post EXISTS N+1 in get_lfg_feed_page_dto

**File:** `overclock/supabase/migrations/20260513030000_add_feed_account_search_bundle_rpcs.sql:152–191`

Up to 120 correlated subqueries per page load for a logged-in viewer. Each EXISTS probes profile_connections, play_invites, stack_members, or stack_requests individually per post row inside the jsonb_agg. This is the most likely explanation for the 1254ms application-code time on /duos vs 764ms on /u/emi.

---

### P0 — /u/[username]: 15 sequential sub-operations in plpgsql procedure

**File:** `overclock/supabase/migrations/20260513020000_add_page_bundle_rpcs.sql:42–292`

The profile RPC is a procedural function, not a CTE-based query. Each `select ... into`, scalar subselect, and helper function call runs sequentially. There is no parallelism. The competitive_profiles table is queried twice — once for `main_role` (line 182) and once for `platform` (line 187) — as two separate scalar subselects that could be one.

---

### P1 — getCurrentProfile: two sequential Supabase round-trips per request

**File:** `overclock/lib/profiles/get-current-profile.ts:11–27`

`auth.getUser()` is awaited, then `profiles SELECT` is awaited. These cannot run in parallel because the profile query needs `user.id`. This is unavoidable with the current shape but the combined cost (~80–150ms) is paid on every page load. React `cache()` prevents duplication within a request but does not reduce the sequential cost of the first call.

---

### P1 — viewerBundle: double competitive_profiles query in get_lfg_feed_page_dto

**File:** `overclock/supabase/migrations/20260513030000_add_feed_account_search_bundle_rpcs.sql:222–235`

Same pattern as the profile RPC: `main_role` and `platform` fetched as separate scalar subselects from competitive_profiles instead of a single row lookup. Also present in `get_profile_page_dto` (lines 182–191).

---

### P2 — updateLastSeen POST variance (222ms–1043ms)

**File:** `overclock/features/presence/actions.ts:10–40`

Two sequential calls: `auth.getUser()` then `UPDATE profiles`. The variance is large (4×). This does not block page load but it does mean frequent writes to the profiles table under active use. The `auth.getUser()` call re-validates the session on each POST rather than using the session JWT claims directly.

---

## Recommended Fixes (Do Not Implement)

1. **Rewrite inviteState and stackRequestState checks in get_lfg_feed_page_dto to use LEFT JOINs.**  
   Instead of per-row EXISTS, pre-join `profile_connections` and `play_invites` for the viewer into the CTE layer, then resolve state via CASE on joined columns. Eliminates the N+1. This is the highest-impact change.

2. **Merge the two competitive_profiles scalar subselects into a single CTE or joined subquery.**  
   Applies to both `get_profile_page_dto` (lines 182–191) and `get_lfg_feed_page_dto` viewer bundle (lines 222–235). One query → one row fetch → both columns.

3. **Refactor get_profile_page_dto to use CTEs instead of sequential plpgsql variable assignments.**  
   A CTE-based SQL function lets Postgres plan all reads in a single pass. The current procedural style serializes operations that could overlap.

4. **Collapse the three block-check helper functions into a single inline subquery or pre-fetched set.**  
   `is_profile_blocked_by` × 2 + `has_either_user_blocked` are called at lines 103–122. A single subquery fetching block state for the pair would replace three function call round-trips.

5. **Cache-Control on public profile pages.**  
   `/u/[username]` for a non-authenticated viewer is identical for all requesters. A short `public, s-maxage=30` header would allow CDN caching. Currently `private, no-store` is set for every response regardless of auth state.

6. **Reduce updateLastSeen to one Supabase call.**  
   The server action could be rewritten to accept the `userId` as a verified parameter (e.g., from the session cookie claims via `supabase.auth.getClaims()`), skipping the `auth.getUser()` round-trip and going straight to the UPDATE.

7. **Move auth-aware shell UI out of the root layout.**  
   Keep `app/layout.tsx` focused on viewer-agnostic shell structure and move the
   signed-in header state into a smaller shared boundary. This will not improve
   caching by itself while proxy stays `private, no-store`, but it is the
   correct structural prerequisite for future shell caching work.

---

## QA Checklist for the Eventual Fix

When changes to the RPCs or getCurrentProfile are shipped, verify:

- [ ] `/u/[username]` loads correctly for: guest viewer, self, connected user, user who has blocked viewer, user viewer has blocked
- [ ] `/duos` loads correctly for: guest, logged-in user with no posts, logged-in user with an active post, user with a pending invite to a post author
- [ ] inviteState on feed cards shows the correct state (invite_to_play / invite_sent / connected) after RPC refactor
- [ ] stackRequestState on stacks feed cards shows correct state (none / pending / accepted / declined)
- [ ] Profile connection count is accurate on `/u/[username]`
- [ ] Block/hidden profile correctly returns null profile in the DTO (both directions)
- [ ] updateLastSeen still updates `last_seen_at` and does not regress presence indicators
- [ ] Presence badges on feed cards still reflect online status
- [ ] Log observed application-code time before and after and confirm reduction
- [ ] Run `supabase db diff` or review migration SQL before applying; test on staging before prod

---

## Fix: get_lfg_feed_page_dto N+1

**Migration:** `overclock/supabase/migrations/20260513040000_optimize_lfg_feed_page_dto.sql`  
**Applies to:** P0 bottleneck on /duos and /stacks  
**TypeScript changes:** None — DTO output shape is identical

### What changed

**4 correlated subqueries per post → 4 CTEs scanning once for all posts:**

| Was (per-row, inside jsonb_agg) | Now (CTE, joined once) |
|---|---|
| EXISTS on `profile_connections` per post | `viewer_connections` CTE — one scan for all feed post authors |
| EXISTS on `play_invites` per post | `viewer_invites` CTE — one scan for all feed posts |
| EXISTS on `stack_members` per post | `viewer_stack_memberships` CTE — one scan for stacks posts |
| subselect on `stack_requests` per post | `viewer_stack_requests` CTE — one scan with `DISTINCT ON` |

The main SELECT now LEFT JOINs the 4 CTEs and resolves `inviteState` / `stackRequestState` from join presence rather than correlated probes. Logic and output values are identical.

**Competitive profiles double query → single SELECT INTO:**

The viewer bundle previously queried `competitive_profiles` twice (separate scalar subselects for `main_role` and `platform`). Now a single `SELECT INTO v_cp_main_role, v_cp_platform` fetches both columns before building the bundle.

### Expected query count change

| | Before | After |
|---|---|---|
| Per-post correlated subqueries | up to 4 × 30 = 120 | 0 |
| Batch CTE scans for viewer state | 0 | 4 |
| competitive_profiles lookups (viewer bundle) | 2 | 1 |

### Timing baseline (before fix)

| Route | Total | App-code |
|---|---|---|
| GET /duos | 1337ms | 1254ms |
| GET /stacks | not measured | — |

### Timing after fix

_Fill in after deploying the migration and measuring._

| Route | Total | App-code | Delta |
|---|---|---|---|
| GET /duos | — | — | — |
| GET /stacks | — | — | — |

### Remaining P0 (not yet fixed)

`get_profile_page_dto` still has ~15 sequential sub-operations in a plpgsql procedure. The `/u/[username]` 764ms is the next target.
