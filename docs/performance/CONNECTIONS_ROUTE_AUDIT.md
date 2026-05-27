# Connections Route Audit

**Date:** 2026-05-24  
**Scope:** `/connections` fresh-load latency, long-term scalability, and related shared-shell work  
**Status:** Audit only; no runtime changes

## Summary

Update 2026-05-27:

- `/connections` now renders as an account-workspace page instead of a direct
  alias wrapper around `/matches`
- it still uses the same matches-domain auth and DTO loader path audited below
- alias-specific notes in this audit should be read as historical unless they
  explicitly describe the shared loader path

`/connections` is not its own data implementation. It reuses the shared
matches server loader while rendering inside the account workspace shell.

Current request path:

- `overclock/app/connections/page.tsx`
- `overclock/features/matches/load-matches-route-dto.ts`
- `overclock/lib/profiles/get-current-profile.ts`
- `overclock/lib/pages/matches-page-dto.ts`
- `public.get_matches_page_dto(uuid)`

Current post-hydration adjacent work:

- `GlobalAuthBarServer` resolves viewer identity in the root shell
- `GlobalNotificationsMenuClient` immediately fetches `/api/notifications/menu`
- `/connections` mounts a realtime refresh subscriber
- the global notifications menu mounts another realtime refresh subscriber

The route is therefore paying for:

1. middleware auth/session work
2. one authenticated identity lookup
3. one matches/connections page RPC
4. one immediate notification-menu API request after hydration
5. duplicate realtime listeners for the same viewer

This is enough to explain why the page can feel slow in development even before
we consider Next.js dev compile overhead.

## Measurement Caveat

Fresh loads measured in `npm run dev` are not clean production latency
measurements.

They mix:

- real server request time
- React Server Component work
- Supabase latency
- Next.js dev compile / transform overhead
- browser hydration and follow-up client fetches

Use dev numbers for local direction only. Do not use them as the final baseline
for product decisions. A production-like check should use:

- `npm run build`
- `npm run start`
- route timing logs or browser network timings
- live database `EXPLAIN (ANALYZE, BUFFERS)` for the audited RPCs

## Critical Path Findings

### P0 - `/connections` does more than one data load for the same viewer state

The initial page render reads:

- `getCurrentProfile()` for auth + profile existence
- `get_matches_page_dto()` for connections and invites

Then the signed-in shell immediately triggers another request:

- `GlobalNotificationsMenuClient` fetches `/api/notifications/menu` on mount
- `/api/notifications/menu` calls `getCurrentProfile()` again
- `/api/notifications/menu` then calls `get_notifications_menu_dto()`

Why this matters:

- page load work is split across SSR and an immediate client waterfall
- incoming invite data is effectively loaded twice on a fresh visit
- blocked-profile derivation is repeated in both RPCs
- this doubles pressure on auth, RPC, and database reads as traffic grows

Files:

- `overclock/components/navigation/global-auth-bar.tsx`
- `overclock/components/navigation/global-notifications-menu-client.tsx`
- `overclock/app/api/notifications/menu/route.ts`
- `overclock/lib/pages/matches-page-dto.ts`
- `overclock/supabase/migrations/20260513020000_add_page_bundle_rpcs.sql`

### P0 - `get_matches_page_dto()` is efficient enough for small lists, but its cost grows with active users and historical relationship volume

The RPC performs:

- one blocked-profile helper materialization
- one aggregate for active connections
- one aggregate for outgoing pending invites
- one aggregate for incoming pending invites
- joins into `profiles`, `play_invites`, and `lfg_posts`

The implementation is set-based, which is good, but it still performs all work
inline for each request and returns full JSON payloads even when only part of
the page is immediately visible.

Scalability pressure points:

- active connection lists grow with heavy users
- invite history lookups remain request-time
- blocked-id expansion happens for every page load
- JSON shaping happens inside the hot path instead of using a smaller summary +
  deferred detail strategy

This is not the same N+1 bug that older LFG feed code had, but it is still a
fully dynamic per-request aggregation path with no cache relief.

### P1 - identity lookup is still a serialized auth round-trip plus profile query

`getCurrentProfile()` does:

1. `supabase.auth.getUser()`
2. `profiles SELECT`

This is request-scoped cached, so it is not duplicated inside the same render,
but the first call is still serialized and blocking.

It also reads the full owner-profile projection even when a caller only needs:

- user presence
- profile existence
- profile id
- username/avatar/display name for shell UI

This is a smaller issue than the page RPC, but it is in the critical path of
every authenticated `/connections` request.

### P1 - duplicate realtime listeners create avoidable refresh fan-out

`PlayInviteRealtimeRefresh` is mounted from:

- `/connections` page content
- global notifications menu

Both listeners subscribe to the same viewer and both call `router.refresh()`
after database changes.

Why this matters:

- duplicate websocket channels per active user
- duplicate refresh scheduling after the same event
- unnecessary client/server churn under higher concurrency
- more noticeable route instability when invite activity is high

### P1 - no-store shell behavior keeps all auth-gated traffic fully dynamic

The proxy forces:

- `Cache-Control: private, no-store`

That is a reasonable default for authenticated HTML, but it means the route has
no caching safety net at the response layer. Every request must pay the full
identity + DTO path.

This makes request-path efficiency much more important because the app cannot
hide inefficiency behind CDN or browser reuse for signed-in traffic.

### P2 - `/connections` and `/matches` still share the same invalidation-sensitive data

Invite and connection server actions revalidate:

- `/matches`
- `/connections`

If both routes keep rendering the same implementation, this doubles invalidation
intent for one underlying surface. It is not the main cause of slow GETs, but
it is unnecessary scale noise and should be reviewed.

## Structure Audit

The route ownership split is good:

- `app/*` stays thin
- matches domain UI lives in `features/matches/*`
- page DTO loading lives in `lib/pages/*`

The main structural concern is not ownership drift. It is duplicated read work
across shell and route surfaces that represent the same viewer state.

## Security Audit

No obvious authorization regression stood out in the `/connections` read path.

Good current properties:

- route redirects unauthenticated users before rendering page content
- `get_matches_page_dto()` and `get_notifications_menu_dto()` both verify
  `auth.uid()` against the supplied profile id
- block helpers are security-definer functions that fail closed for
  unauthorized callers
- private contact details are returned only through active-connection payloads

Security follow-up to preserve during optimization:

- keep participant-only invite/connection visibility
- keep blocked-user filtering intact
- do not move private contact fields into broader shared caches

## Client-Side / UX Audit

Client-side pressure on `/connections` is moderate:

- notifications menu client fetch on mount
- notifications dropdown action handlers trigger both local state updates and
  `router.refresh()`
- realtime refresh is subscribed twice
- invite tabs are client-side only, though the component itself is lightweight

This is more of a scalability and perceived-responsiveness problem than a
first-byte problem.

## Verification Gaps

Not verified in this repo-only audit:

- live `EXPLAIN (ANALYZE, BUFFERS)` for `get_matches_page_dto()`
- live `EXPLAIN (ANALYZE, BUFFERS)` for `get_notifications_menu_dto()`
- production build timings from `npm run build && npm run start`
- bundle-size attribution for the full signed-in shell
- actual websocket event volume under concurrent invite activity

Those checks are required before we rank SQL rewrites by exact payoff.

## Recommended Plan

### Phase 1 - get trustworthy measurements

1. Add route-level timing logs around the shared matches route loader,
   `getCurrentProfile()`, and `getMatchesPageDto()`.
2. Add timing logs to `/api/notifications/menu` and `getNotificationsMenuDto()`.
3. Measure `/connections` in production mode, not only `npm run dev`.
4. Capture one live `EXPLAIN (ANALYZE, BUFFERS)` for:
   - `public.get_matches_page_dto(uuid)`
   - `public.get_notifications_menu_dto(uuid)`

Goal:

- separate dev compile cost from true backend latency
- prove whether the main bottleneck is identity, RPC SQL, or shell duplication

### Phase 2 - ship the lowest-risk wins first

1. Remove duplicate realtime subscriptions by choosing one owner for
   `PlayInviteRealtimeRefresh`.
2. Stop loading notifications via an immediate mount fetch when the page
   already has equivalent invite state available.
3. Review whether the bell can receive initial payload from the server or a
   shared route DTO instead of a second request.
4. Audit whether `/connections` still needs separate `revalidatePath()` calls
   when it is only an alias for `/matches`.

Expected impact:

- fewer requests on first visit
- lower websocket and refresh churn
- better perceived responsiveness under load

### Phase 3 - trim the auth and shell critical path

1. Replace heavyweight `getCurrentProfile()` usage in the `/connections` route
   path with the smallest identity helper that satisfies:
   - auth gate
   - onboarding gate
   - shell avatar/name needs
2. Consider splitting shell identity display from route authorization so the
   page does not always depend on the full owner projection.
3. Add a dedicated matches-shell identity helper if the current generic helper
   is still overfetching.

Expected impact:

- modest server-time improvement on every authenticated request
- cleaner separation between auth gating and profile-display data

### Phase 4 - refactor DTO boundaries to eliminate duplicate viewer reads

1. Decide whether notifications are part of the matches/connections page model.
2. If yes, fold bell-needed invite data into one shared server payload instead
   of fetching it again after hydration.
3. If no, create a lighter summary RPC for the bell:
   - unread count
   - compact rows only
   - no duplicated page-grade participant shaping
4. Reuse blocked-profile state once per request instead of recalculating it in
   adjacent RPCs for the same viewer.

Expected impact:

- lower database round-trips per page visit
- less duplicated JSON construction
- better headroom as active-user counts grow

### Phase 5 - harden SQL for large-user growth

After the live query plans are captured:

1. Confirm the `profile_connections` and `play_invites` indexes are actually
   being used as intended.
2. If plans show repeated scans or sort pressure, refactor
   `get_matches_page_dto()` into smaller CTEs that:
   - isolate active connection ids first
   - join only the needed participant/profile rows
   - join invite/source-post data only for returned rows
3. Consider capped pagination for large connection histories instead of always
   returning the full current list.
4. Consider splitting:
   - active connection summary
   - invite tabs
   - older connection history
   into separately refreshable surfaces
5. If connection counts grow materially, move expensive derived summaries to
   precomputed counters or denormalized per-user read tables where appropriate.

Expected impact:

- better tail latency for power users
- more predictable request cost as relationship data grows
- reduced pressure on Supabase under concurrent reads

### Phase 6 - scale operations and monitoring

1. Add server timing logs for:
   - identity
   - matches DTO RPC
   - notifications RPC
   - total route render
2. Add dashboards/alerts for:
   - p50 / p95 GET `/connections`
   - p50 / p95 GET `/api/notifications/menu`
   - realtime refresh frequency per viewer
3. Watch for:
   - repeated refresh storms
   - unusually large DTO payloads
   - heavy-user rows with large connection history

## Recommended Execution Order

1. Measure in production mode.
2. Remove duplicate realtime ownership.
3. Eliminate the notifications mount waterfall.
4. Reduce identity overfetching.
5. Refactor SQL only after live plans confirm the shape of the cost.

## Phase 1 Implementation

Phase 1 route-level instrumentation is now wired into app code for local
measurement.

Current log labels:

- `[perf:identity] getCurrentProfile auth.getUser`
- `[perf:identity] getCurrentProfile profiles query`
- `[perf:matches] loadMatchesRouteDto auth+profile`
- `[perf:matches] loadMatchesRouteDto dto`
- `[perf:matches] loadMatchesRouteDto total`
- `[perf:matches] getMatchesPageDto rpc`
- `[perf:matches] getMatchesPageDto normalize`
- `[perf:matches] getMatchesPageDto total`
- `[perf:notifications] GET /api/notifications/menu auth+profile`
- `[perf:notifications] GET /api/notifications/menu dto`
- `[perf:notifications] GET /api/notifications/menu total`
- `[perf:notifications] getNotificationsMenuDto rpc`
- `[perf:notifications] getNotificationsMenuDto normalize`
- `[perf:notifications] getNotificationsMenuDto total`

Current env toggles:

- `IDENTITY_PERF=0` disables identity logs
- `MATCHES_PERF=0` disables route and matches DTO logs
- `NOTIFICATIONS_PERF=0` disables notifications logs

Recommended local measurement flow:

1. Run `npm run dev`.
2. Load `/connections` once cold.
3. Reload `/connections` once warm.
4. Watch both `[perf:matches]` and `[perf:notifications]` output together.
5. Repeat with `npm run build && npm run start` for the production-like
   comparison called out earlier in this audit.

## Phase 2 Implementation

Phase 2 low-risk wins are now partially implemented in app code:

- realtime ownership moved to the global notifications menu so `/connections`
  no longer mounts a second `play_invites` subscriber for the same viewer
- the notifications bell now receives an initial server payload from the auth
  bar server component
- the notifications menu no longer performs an immediate mount fetch when that
  initial payload is available
- realtime updates now refresh the bell's own local state in addition to
  calling `router.refresh()`

This reduces:

- duplicate websocket subscriptions
- duplicate refresh scheduling
- first-visit client request waterfalls for the bell

Current follow-up from the original Phase 2 list:

- if production behavior shows stale account-workspace connections views,
  review whether path-based invalidation should cover both `/matches` and
  `/connections` or move to a shared tag-based invalidation strategy

## Suggested Commit Message

`docs: add /connections performance and scalability audit`
