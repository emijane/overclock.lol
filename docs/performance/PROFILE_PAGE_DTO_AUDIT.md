# Profile Page DTO Audit

**Date:** 2026-05-14  
**Scope:** `/u/[username]` route only, `get_profile_page_dto` RPC only, profile-page loader only  
**Status:** Optimization shipped in
`overclock/supabase/migrations/20260514000000_optimize_profile_page_dto.sql`;
runtime verification still required

## Summary Diagnosis

`GET /u/[username]` is already using the right high-level shape: one request-scoped
identity lookup plus one page-bundle RPC. The main latency risk is inside
`public.get_profile_page_dto`, which is still a procedural `plpgsql`
`security definer` function that serializes a long chain of small reads and
helper calls.

The current RPC does all of the following in sequence:

- resolves viewer state
- loads the target profile
- checks block status multiple times through helper functions
- checks connection and pending invite state through separate lookups
- counts connections through another helper function
- reads `competitive_profiles` twice for the same row
- aggregates role profiles, hero pools, featured clips, badges, and recent posts

The DTO boundary is good. The SQL implementation is the bottleneck.

Primary findings:

- `competitive_profiles` is read twice for `main_role` and `platform`.
- block status is checked three times through helper functions that all hit
  `user_blocks`.
- connection/invite state is resolved through separate lookups after a separate
  block helper call.
- `get_profile_connection_count()` adds another function boundary and another
  table scan.
- the whole RPC is procedural `SELECT ... INTO` work that could be expressed as
  one SQL/CTE query while keeping the DTO shape identical.

Implementation note:

- The RPC has now been rewritten as a SQL/CTE-driven `security definer`
  function in
  `overclock/supabase/migrations/20260514000000_optimize_profile_page_dto.sql`.
- The rewrite collapses the repeated block checks into one pair-state CTE,
  replaces the double `competitive_profiles` lookup with one row fetch, and
  inlines relationship and connection-count reads.
- Fresh before/after timing still needs to be collected against a real database.

## Exact Files Inspected

- `AGENTS.md`
- `docs/README.md`
- `docs/agents/CLEANUP.md`
- `docs/agents/QA.md`
- `docs/performance/GET_LATENCY_AUDIT.md`
- `overclock/app/layout.tsx`
- `overclock/app/u/[username]/page.tsx`
- `overclock/lib/pages/profile-page-dto.ts`
- `overclock/lib/profiles/get-current-profile.ts`
- `overclock/lib/profiles/profile-selects.ts`
- `overclock/lib/supabase/proxy.ts`
- `overclock/proxy.ts`
- `overclock/supabase/migrations/20260427201500_secure_lfg_posts_rls_and_rpc.sql`
- `overclock/supabase/migrations/20260506110000_create_play_invites.sql`
- `overclock/supabase/migrations/20260506113000_add_play_invite_send_rpc_and_rls.sql`
- `overclock/supabase/migrations/20260506130000_add_profile_connections.sql`
- `overclock/supabase/migrations/20260513000000_add_user_blocks.sql`
- `overclock/supabase/migrations/20260513020000_add_page_bundle_rpcs.sql`
- `docs/roadmap/profiles/PUBLIC_PROFILE_PERFORMANCE.md`

## Route Request Path

1. Request enters `overclock/proxy.ts`.
2. `updateSession()` in `overclock/lib/supabase/proxy.ts` runs
   `supabase.auth.getClaims()` and sets `Cache-Control: private, no-store`.
3. App render starts in `overclock/app/layout.tsx`.
4. Root layout calls `getCurrentProfile()`.
5. `getCurrentProfile()` runs:
   - `supabase.auth.getUser()`
   - `profiles.select(OWNER_PROFILE_SELECT).eq("id", user.id).maybeSingle()`
6. `overclock/app/u/[username]/page.tsx` runs and calls `getCurrentProfile()`
   again, but React `cache()` deduplicates it within the request.
7. The page calls `getProfilePageDto(username, currentProfile?.id ?? null)`.
8. `overclock/lib/pages/profile-page-dto.ts` calls
   `supabase.rpc("get_profile_page_dto", ...)`.
9. `public.get_profile_page_dto()` performs viewer-state, profile, block,
   connection, invite, competitive, hero-pool, featured-clip, badge, and recent
   post reads.
10. The RPC returns `jsonb`.
11. `normalizeDto()` converts raw JSON into the TypeScript DTO shape.
12. The page derives presentation values such as rank display, cover URL, social
    links, and owner state.
13. UI sections render:
    `EditableProfileHeader`, `PreferredHeroPools`, `FeaturedClipsSection`, and
    `RecentProfilePosts`.

## App-Layer Database Operations

| Step | Location | Operation | Count per request |
|---|---|---|---|
| Proxy auth refresh | `lib/supabase/proxy.ts` | `supabase.auth.getClaims()` | 1 |
| Current user lookup | `lib/profiles/get-current-profile.ts` | `supabase.auth.getUser()` | 1 |
| Current profile row | `lib/profiles/get-current-profile.ts` | `profiles SELECT ... maybeSingle()` | 0 or 1 |
| Page DTO fetch | `lib/pages/profile-page-dto.ts` | `rpc("get_profile_page_dto")` | 1 |
| DTO normalization | `lib/pages/profile-page-dto.ts` | in-process JSON normalization only | 0 |
| UI render | `app/u/[username]/page.tsx` | in-process derivation only | 0 |

Notes:

- `getCurrentProfile()` is request-cached, so the second call from the profile
  page should be a cache hit after `app/layout.tsx`.
- Logged-out viewers still pay the `auth.getUser()` call, but they skip the
  `profiles` table read because there is no authenticated user.
- The profile page itself only issues one explicit app-layer RPC after
  `getCurrentProfile()`.

## `get_profile_page_dto` Operation Count

### Top-level sequential work inside the RPC

| # | Operation | Object touched | Kind |
|---|---|---|---|
| 1 | Viewer profile existence check | `profiles` | `SELECT EXISTS ... INTO` |
| 2 | Target profile lookup by username | `profiles` | `SELECT ... INTO` |
| 3 | Hidden-from-viewer block check | `user_blocks` via `is_profile_blocked_by()` | helper call |
| 4 | Viewer-has-blocked-owner check | `user_blocks` via `is_profile_blocked_by()` | helper call |
| 5 | Either-side block short-circuit for relationship state | `user_blocks` via `has_either_user_blocked()` | helper call |
| 6 | Active connection lookup | `profile_connections` | `SELECT id INTO` |
| 7 | Pending outgoing invite lookup | `play_invites` | `SELECT id INTO` |
| 8 | Connection count | `profile_connections` via `get_profile_connection_count()` | helper call |
| 9 | Competitive main role | `competitive_profiles` | scalar subquery |
| 10 | Competitive platform | `competitive_profiles` | scalar subquery |
| 11 | Competitive role list | `competitive_role_profiles` | `jsonb_agg` subquery |
| 12 | Hero pools | `profile_hero_pools` | `jsonb_build_object` subquery |
| 13 | Featured clips | `profile_featured_clips` | limited subquery + `jsonb_agg` |
| 14 | Badges | `profile_badges` + `badges` | join + `jsonb_agg` |
| 15 | Recent posts | `lfg_posts` | limited subquery + `jsonb_agg` |

### Repeated table hits

| Table | Times hit | Where |
|---|---|---|
| `profiles` | 2 inside RPC, plus 1 app-layer owner read | viewer-profile existence check, target-profile lookup, `getCurrentProfile()` |
| `user_blocks` | 3 helper-driven hits | hidden check, initially-blocked check, either-side block check |
| `profile_connections` | 2 | active connection lookup, connection-count helper |
| `competitive_profiles` | 2 | `main_role`, `platform` |
| `play_invites` | 1 | pending outgoing invite lookup |
| `competitive_role_profiles` | 1 | roles aggregation |
| `profile_hero_pools` | 1 | hero-pool row lookup |
| `profile_featured_clips` | 1 | top 2 featured clips |
| `profile_badges` | 1 | badge aggregation |
| `badges` | 1 | joined into badge aggregation |
| `lfg_posts` | 1 | top 2 recent posts |

## SQL Hotspot Table

| Hotspot | Why it is expensive or redundant | Safe optimization direction |
|---|---|---|
| Procedural `plpgsql` flow | Serializes many tiny reads and helper calls | Convert to one SQL function or one CTE-driven query |
| `competitive_profiles` double lookup | Same row fetched twice for two scalar fields | Fetch one row once and project both columns |
| Triple block checks | Three helper calls against `user_blocks` for one pair | Derive both directional block booleans in one subquery/CTE |
| `get_profile_connection_count()` helper | Extra function boundary and extra scan after connection lookup | Inline count into the main query |
| Separate connection + pending invite lookups | Two more reads after block helper work | Precompute pair state in one joined/CTE block |
| Recent posts filter | Uses `status in ('active', 'filled')` while current `lfg_posts` check constraint only lists `active`, `closed`, `archived` | Verify if `filled` is legacy/stale before rewriting query logic |

## Repeated Query / Function-Call Findings

### 1. Repeated `competitive_profiles` lookup

`competitive_profiles` is read twice for the same `profile_id`:

- once for `main_role`
- once for `platform`

This is the clearest low-risk redundancy in the RPC. One row fetch can supply
both fields without changing the DTO output.

### 2. Repeated block checks that can be merged

The RPC currently asks three separate questions about the same viewer/target pair:

- is target blocking viewer
- is viewer blocking target
- has either side blocked the other

All three are derived from the same `user_blocks` pair. A single inline
subquery/CTE could return:

- `target_blocks_viewer`
- `viewer_blocks_target`
- `either_blocked`

That would preserve the current behavior:

- hard-hide the profile when the owner blocked the viewer
- keep `initiallyBlockedByViewer` for UI state
- suppress connection/invite state when either side is blocked

### 3. Repeated `profile_connections` work

The RPC:

- looks up the active connection row for the pair
- separately counts all active connections for the target profile through
  `get_profile_connection_count()`

Those are different answers, so both are valid, but the count helper adds
another function boundary and another table read. It is a good candidate to
inline into a larger SQL plan.

### 4. Connection and invite state are split into separate reads

Relationship state for non-self viewers is resolved by:

- checking `profile_connections`
- then checking `play_invites`

That is logically fine, but the current implementation does it after the block
helpers and in separate `SELECT INTO` statements. It could be modeled as one
pair-state CTE with joined connection and pending-invite slices.

### 5. Helper functions hide repeated table access from the call site

`is_profile_blocked_by()`, `has_either_user_blocked()`, and
`get_profile_connection_count()` are each simple wrappers. Their behavior is
easy to preserve inline, which makes them good candidates for elimination
inside this RPC only, while leaving the helpers available for other call sites.

## State-by-State Behavior Matrix

| Viewer state | App-layer reads | Extra RPC branches | Expected result |
|---|---|---|---|
| Logged out | `auth.getUser()` only, no owner profile row | skips viewer-profile existence check, skips block helpers, skips pair-state lookups | public profile DTO or `profile: null` if username missing |
| Logged-in self profile | `auth.getUser()` + owner `profiles` row | viewer-profile existence check runs; block/pair-state branch skipped because viewer is target | full profile DTO, owner UI |
| Logged-in other user | `auth.getUser()` + owner `profiles` row | all block helpers run; pair-state lookups may run | full profile DTO plus invite/connection state |
| Connected user | same as logged-in other user | active connection lookup resolves first | `inviteState = connected` |
| Viewer blocked owner | same as logged-in other user | `initiallyBlockedByViewer = true`; either-side block prevents pair-state work | profile still visible, block UI state retained, no invite/connection state |
| Viewer blocked by owner | same as logged-in other user | hidden check returns early | DTO returns `profile: null` |

## Timing Notes

These are baseline notes from the existing audit in
`docs/performance/GET_LATENCY_AUDIT.md`. This audit did not re-run the app or
collect fresh runtime traces.

| Segment | Baseline note |
|---|---|
| Total `GET /u/[username]` | 785ms observed for `GET /u/emi` |
| Next.js server/app-code time | 764ms |
| Proxy time | ~8-11ms |
| Network + proxy combined | ~21ms |
| `getCurrentProfile()` | ~80-150ms combined auth + owner profile read, based on prior audit notes |
| `get_profile_page_dto` RPC | dominant remaining cost inside the 764ms app-code budget |
| DTO normalization | present but likely negligible relative to RPC; no direct timing hook exists today |

Current local code instrumentation:

- `app/u/[username]/page.tsx` wraps only `getProfilePageDto()` in
  `measureProfileStep()` and only logs outside production.
- there is no equivalent per-step timing around `getCurrentProfile()`,
  `normalizeDto()`, or the final route render.

Recommended measurement additions for the eventual optimization pass:

- keep the existing `measureProfileStep()` wrapper for the RPC
- add one dev-only timer around `getCurrentProfile()`
- add one dev-only timer around `normalizeDto()`
- if needed, add one request-level timer in the page to separate
  `getCurrentProfile`, RPC, and post-RPC derivation

## Existing Index Coverage

Already present and relevant:

| Object | Existing index | Notes |
|---|---|---|
| `profiles` | `profiles_username_lookup_idx (username)` | supports target lookup by normalized username |
| `competitive_profiles` | `competitive_profiles_profile_lookup_idx (profile_id)` | supports current scalar subqueries |
| `competitive_role_profiles` | `competitive_role_profiles_profile_role_lookup_idx (profile_id, role)` | supports roles aggregation |
| `profile_hero_pools` | `profile_hero_pools_profile_lookup_idx (profile_id)` | supports single-row lookup |
| `profile_featured_clips` | `profile_featured_clips_profile_position_lookup_idx (profile_id, position)` | supports ordered top-2 lookup |
| `profile_badges` | `profile_badges_profile_granted_lookup_idx (profile_id, granted_at)` | supports badge aggregation order |
| `user_blocks` | `user_blocks_pair_unique_idx (blocker_profile_id, blocked_profile_id)` | good for directional block probe |
| `user_blocks` | `user_blocks_blocker_created_idx`, `user_blocks_blocked_created_idx` | helpful for blocker or blocked scans |
| `profile_connections` | `profile_connections_pair_unique_idx (profile_low_id, profile_high_id)` | pair lookup support |
| `profile_connections` | `profile_connections_active_low_idx`, `profile_connections_active_high_idx` | partial indexes for active rows |
| `play_invites` | `play_invites_sender_pending_idx` | helps sender-side pending invite lookup |
| `lfg_posts` | `lfg_posts_owner_history_idx (profile_id, created_at desc)` | closest existing support for recent-post lookup |

## Index Recommendations

No migration changes are proposed in this audit, but these are the safest index
questions to validate during the implementation pass:

### P1 validate whether a partial recent-post index is needed

The recent-post query filters by:

- `profile_id = v_target_profile.id`
- `status in ('active', 'filled')`
- `expires_at > now()` (updated from `created_at >= now() - 12 hours` in Phase 2C)
- `order by created_at desc`
- `limit 2`

`lfg_posts_owner_history_idx` may already be good enough for the top-2 access
pattern, but a profile-page-specific partial index may help if the table grows.
Before adding anything, check an `EXPLAIN ANALYZE` plan against production-like
data because the current owner-history index may already win.

### P2 validate whether `has_either_user_blocked()` benefits from a different shape

The helper currently probes `user_blocks` with an `OR` across the two
directions. The pair unique index is good for each directional probe, but the
helper may still be less planner-friendly than two directional probes or a small
pair-state CTE. This looks more like a query-shape issue than an index-gap
issue.

### No immediate missing-index red flags elsewhere

For the current RPC shape, the obvious access paths already have supporting
indexes:

- username lookup
- competitive profile lookup
- role profiles by `profile_id`
- hero pools by `profile_id`
- featured clips by `profile_id, position`
- badge rows by `profile_id, granted_at`
- active connections by pair or participant
- sender pending invites by sender/status

## Security / RLS Behavior To Preserve

The eventual optimization must preserve all of this behavior:

- `get_profile_page_dto` stays read-only.
- `get_profile_page_dto` stays `security definer` unless the full access model is
  intentionally redesigned.
- `currentUserId`, `profileId`, and `viewerState` semantics must not change.
- If the target profile blocked the viewer, the DTO must still return
  `profile: null`.
- If the viewer blocked the target, the DTO must still expose
  `initiallyBlockedByViewer = true`.
- Connection and invite state must remain suppressed when either side is blocked.
- Self-view must not accidentally perform pair-state work or change owner
  behavior.
- DTO output shape must remain identical so `normalizeDto()` and the page UI do
  not change.
- `getCurrentProfile()` must remain aligned with the authenticated user's own
  profile row access pattern.
- `play_invites` and `profile_connections` participant-only read expectations
  must still hold logically even though the RPC uses `security definer`.

## P0 / P1 / P2 Recommendations

### P0

- Rewrite `get_profile_page_dto` as one SQL/CTE-driven query instead of
  procedural `plpgsql` `SELECT INTO` chains.
- Collapse the three block helper calls into one pair-state derivation that
  returns directional booleans and an `either_blocked` flag.
- Replace the two `competitive_profiles` scalar subqueries with one row fetch.

### P1

- Inline `get_profile_connection_count()` into the main RPC query.
- Compute active connection id and pending outgoing invite id from one
  relationship-state slice instead of separate procedural lookups.
- Add dev-only timing around `getCurrentProfile()` and DTO normalization so the
  next pass can prove where the savings land.

### P2

- Revisit whether `/u/[username]` still needs the page-level second
  `getCurrentProfile()` call when root layout has already populated the request
  cache. This is not a behavior problem today, but it is worth keeping visible.
- Validate whether recent-post filtering should be tightened to current route
  truth or current `lfg_posts` status values during the implementation pass.

## QA Checklist For Eventual Optimization

- [ ] Guest viewer can load a public profile with the same DTO shape.
- [ ] Logged-in owner can load their own profile and still see owner controls.
- [ ] Logged-in non-owner can load another visible profile normally.
- [ ] Connected viewer still gets `inviteState = connected` and a valid
      `activeConnectionId`.
- [ ] Pending outgoing invite still yields `inviteState = invite_sent` and a
      valid `pendingOutgoingInviteId`.
- [ ] Viewer who blocked the owner still sees `initiallyBlockedByViewer = true`.
- [ ] Viewer blocked by the owner still receives `profile: null`.
- [ ] Connection count remains accurate for all tested profiles.
- [ ] Competitive profile bundle still returns identical `mainRole`, `platform`,
      and role arrays.
- [ ] Hero pools, featured clips, badges, and recent posts remain unchanged in
      shape and ordering.
- [ ] `normalizeDto()` still succeeds without TypeScript or runtime shape
      changes.
- [ ] Capture before/after timings for:
      total GET, proxy, app-code, `getCurrentProfile`, RPC, and normalization.

## Commit Message

`docs: add profile page DTO latency audit and optimization recommendations`
