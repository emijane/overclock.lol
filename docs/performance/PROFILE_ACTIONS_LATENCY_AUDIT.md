# Profile Actions Latency Audit

**Date:** 2026-05-14  
**Scope:** profile-related POST server actions after profile DTO optimization  
**Status:** Audit only; no runtime changes

## 2026-05-24 Duos Invite-Action Follow-Up

This audit remains the canonical action baseline for invite and connection
mutations, and the duos card actions now include extra measurement plus a
lighter identity read.

Current repo baseline on 2026-05-24:

- `overclock/features/matches/actions.ts` now uses
  `getCurrentProfileIdentity()` instead of the heavier full-profile lookup for
  invite and connection actions
- action timing is now split into:
  - `[perf:matches] <action> auth+profile`
  - `[perf:matches] <action> expire sweep` where applicable
  - `[perf:matches] <action> rpc`
  - `[perf:matches] <action> revalidate`
  - `[perf:matches] <action> total`
- this is meant to separate duos card action latency from broader route refresh
  perception

What did not change:

- action result shapes stay the same
- `/matches` and `/connections` revalidation still both run
- SQL ownership and validation stays in the RPC layer

Current interpretation:

- if `auth+profile` remains high after the identity-helper change, the
  remaining latency is mostly Supabase auth/session overhead rather than profile
  row size
- if `rpc` dominates, the next step is SQL-level investigation of
  `send_play_invite`, `cancel_play_invite`, `decline_play_invite`,
  `accept_play_invite`, and `remove_profile_connection`
- if `revalidate` dominates, the next backlog item is narrowing invalidation or
  separating server-action timing from client refresh timing in the calling UI

## Summary Diagnosis

The slow profile-related POST actions are not suffering from UI/render work.
They are mostly paying for:

- repeated auth/profile lookup before each mutation
- one RPC per action, where the RPC still performs many sequential
  `plpgsql` checks and updates
- extra post-mutation invalidation work in the server action layer
- in the block flow, an extra profile read just to compute revalidation paths
- in some callers, an additional client `router.refresh()` after the server
  action already revalidated paths

Current logged baselines:

| Action | Observed latency |
|---|---|
| `updateLastSeen` | ~225-250ms |
| `sendPlayInvite` | 326ms |
| `removeProfileConnection` | 505ms |
| `blockUser` | 557ms |

High-level diagnosis:

- `updateLastSeen` is simple but still pays 2 sequential Supabase calls:
  `auth.getUser()` then `UPDATE profiles`.
- `sendPlayInvite` is only 1 app-layer RPC after auth/profile lookup, but the
  RPC itself does a long chain of read-before-write checks.
- `removeProfileConnection` is 1 app-layer RPC after auth/profile lookup, but
  the RPC serializes lock, row fetch, ownership check, state check, then update.
- `blockUser` is the heaviest user-facing action in this set because it combines
  `getCurrentProfile()`, the `create_user_block` RPC, an extra `profiles` query
  to look up usernames for both sides, and 6-8 `revalidatePath()` calls.

## Exact Files Inspected

- `overclock/features/presence/actions.ts`
- `overclock/features/matches/actions.ts`
- `overclock/lib/blocks/user-blocks.ts`
- `overclock/lib/matches/play-invites.ts`
- `overclock/lib/profiles/get-current-profile.ts`
- `overclock/components/presence/presence-provider.tsx`
- `overclock/app/u/[username]/profile/invite-to-play-button.tsx`
- `overclock/app/matches/remove-connection-button.tsx`
- `overclock/app/u/[username]/profile/editable-profile-header.tsx`
- `overclock/features/blocks/components/user-block-controls.tsx`
- `overclock/supabase/migrations/20260506130000_add_profile_connections.sql`
- `overclock/supabase/migrations/20260513000000_add_user_blocks.sql`
- `overclock/supabase/migrations/20260506113000_add_play_invite_send_rpc_and_rls.sql`

## Action-By-Action Table

| Action | App entrypoint | App-layer Supabase calls | Server-side follow-up work | Main latency drivers |
|---|---|---|---|---|
| `updateLastSeen` | `features/presence/actions.ts` | 2 | none | `auth.getUser()` + `profiles.update()` in sequence |
| `sendPlayInvite` | `features/matches/actions.ts` | 3 | `revalidatePath("/matches")`, `revalidatePath("/connections")` | `getCurrentProfile()` + `send_play_invite` RPC procedural checks |
| `removeProfileConnection` | `features/matches/actions.ts` | 3 | `revalidatePath("/matches")`, `revalidatePath("/connections")` | `getCurrentProfile()` + `remove_profile_connection` lock/read/check/update RPC |
| `blockUser` | `lib/blocks/user-blocks.ts` | 4 | 6 base revalidations + up to 2 profile route revalidations | `getCurrentProfile()` + `create_user_block` RPC + username lookup query + broad invalidation fan-out |

App-layer call counts above assume an authenticated, onboarded user:

- `getCurrentProfile()` = `auth.getUser()` + `profiles SELECT`
- mutation RPC call = 1
- `blockUser` additionally performs a post-RPC `profiles` query in
  `getCurrentUsernames()`

## Supabase Call Count Per Action

### `updateLastSeen`

Location: `overclock/features/presence/actions.ts`

| Order | Call | Purpose |
|---|---|---|
| 1 | `supabase.auth.getUser()` | verify authenticated user |
| 2 | `supabase.from("profiles").update(...).eq("id", user.id)` | update `last_seen_at` |

Notes:

- This is a pure read-then-write pattern in app code.
- There is no RPC, no batching, and no cache invalidation.

### `sendPlayInvite`

Locations:

- `overclock/features/matches/actions.ts`
- `overclock/lib/matches/play-invites.ts`

| Order | Call | Purpose |
|---|---|---|
| 1 | `supabase.auth.getUser()` via `getCurrentProfile()` | auth |
| 2 | `profiles SELECT` via `getCurrentProfile()` | onboarding/profile presence |
| 3 | `supabase.rpc("send_play_invite", ...)` | mutation and validation |

Follow-up work:

- `revalidatePath("/matches")`
- `revalidatePath("/connections")`

### `removeProfileConnection`

Locations:

- `overclock/features/matches/actions.ts`
- `overclock/lib/matches/play-invites.ts`

| Order | Call | Purpose |
|---|---|---|
| 1 | `supabase.auth.getUser()` via `getCurrentProfile()` | auth |
| 2 | `profiles SELECT` via `getCurrentProfile()` | onboarding/profile presence |
| 3 | `supabase.rpc("remove_profile_connection", ...)` | mutation and ownership/state validation |

Follow-up work:

- `revalidatePath("/matches")`
- `revalidatePath("/connections")`

### `blockUser`

Locations:

- `overclock/lib/blocks/user-blocks.ts`
- helper: `revalidateBlockPaths()`

| Order | Call | Purpose |
|---|---|---|
| 1 | `supabase.auth.getUser()` via `getCurrentProfile()` | auth |
| 2 | `profiles SELECT` via `getCurrentProfile()` | onboarding/profile presence |
| 3 | `supabase.rpc("create_user_block", ...)` | mutation plus invite/request/connection cleanup |
| 4 | `supabase.from("profiles").select("id, username").in("id", [...])` | fetch usernames for path revalidation |

Follow-up work:

- `revalidatePath("/account")`
- `revalidatePath("/duos")`
- `revalidatePath("/lfg")`
- `revalidatePath("/matches")`
- `revalidatePath("/search/users")`
- `revalidatePath("/stacks")`
- optionally `revalidatePath("/u/[currentUsername]")`
- optionally `revalidatePath("/u/[targetUsername]")`

## Read-Before-Write Checks

### App layer

| Action | Read-before-write pattern | Needed for security? | Notes |
|---|---|---|---|
| `updateLastSeen` | `auth.getUser()` before update | yes, today | action uses auth result to scope update |
| `sendPlayInvite` | `getCurrentProfile()` before RPC | partly redundant | RPC also validates auth and sender profile existence |
| `removeProfileConnection` | `getCurrentProfile()` before RPC | partly redundant | RPC also validates auth, ownership, and state |
| `blockUser` | `getCurrentProfile()` before RPC | partly redundant | RPC also validates auth and target constraints |
| `blockUser` | username lookup after RPC | no, not for mutation | only used for path revalidation |

### Inside RPCs

#### `send_play_invite`

Sequential checks inside the RPC:

1. `auth.uid()` presence
2. recipient id present
3. self-invite guard
4. sender profile row lookup with `competitive_profiles` join
5. recipient existence check
6. block check via `has_either_user_blocked()`
7. source post lookup and validation
8. active connection existence check
9. sender rate-limit count
10. sender-recipient rate-limit count
11. advisory lock
12. duplicate pending invite existence check
13. `INSERT play_invites`

This is the biggest read-before-write chain in the audited mutation set.

#### `remove_profile_connection`

Sequential checks inside the RPC:

1. `auth.uid()` presence
2. connection id present
3. advisory lock
4. `SELECT ... FOR UPDATE` connection row
5. ownership check
6. disconnected-state check
7. `UPDATE profile_connections`

The RPC is compact, but still fully serialized.

#### `create_user_block`

Sequential checks and writes inside the RPC:

1. `auth.uid()` presence
2. target present
3. self-block guard
4. target profile existence check
5. actor block-event rate-limit count
6. advisory lock
7. existing block lookup
8. optional `INSERT user_blocks`
9. cancel matching pending invites
10. decline matching pending stack requests
11. disconnect active profile connection
12. insert block event

This mutation is doing multiple cleanup writes on purpose, which explains why it
costs more than a simple single-table mutation.

## Duplicated Auth / Profile Lookups

### `getCurrentProfile()` duplication pattern

`sendPlayInvite`, `removeProfileConnection`, and `blockUser` all do:

1. `auth.getUser()`
2. `profiles SELECT`

before calling an RPC that also re-checks auth and usually re-checks the
profile/ownership state inside SQL.

This duplication is not wrong. It exists because the action wants to return
friendly statuses such as:

- `unauthenticated`
- `onboarding_required`

before it hits the RPC. But it does add latency.

### Sender/recipient profile reads are duplicated across layers

`sendPlayInvite` performs an app-layer current-profile lookup, then the RPC
loads the sender profile again to build the invite snapshot, and also checks the
recipient profile. The app-layer read is mostly for user-facing status handling;
the mutation-critical reads happen again inside SQL.

### `blockUser` does an extra profile read after mutation

After `create_user_block` succeeds, `blockUser` issues a second `profiles`
query just to map profile ids to usernames for revalidation. This is unrelated
to mutation security and is a strong latency suspect for the 557ms path.

## Operations That Should Move Into One RPC

### P0 candidate: `updateLastSeen`

Current shape:

- app auth read
- app profile update

Safe consolidation:

- a single `security definer` or authenticated RPC that updates the caller’s
  own `last_seen_at`

Why it helps:

- removes one app-layer round trip
- keeps ownership enforcement in SQL

### P0 candidate: `blockUser` revalidation support

Current shape:

- `create_user_block` RPC
- extra `profiles` lookup for usernames
- many path revalidations

Safe consolidation options:

- return both usernames from `create_user_block`
- or return canonical paths to invalidate

Why it helps:

- removes one full app-layer query after a heavy mutation

### P1 candidate: invite / connection mutation bundles

`sendPlayInvite` and `removeProfileConnection` are already one RPC each, which is
good. The opportunity is not “move into one RPC” so much as “keep the action
thin and avoid app-layer prechecks when the RPC already enforces them.”

Safe direction:

- preserve friendly action statuses
- consider lighter-weight auth/profile state checks if the route only needs to
  distinguish unauthenticated vs onboarding-required vs authenticated

## Cache Revalidation / Redirect Costs

### `updateLastSeen`

- No `revalidatePath()`
- No `redirect()`
- No `router.refresh()`

This action’s latency is almost entirely database/auth round trips.

### `sendPlayInvite`

Server action:

- `revalidatePath("/matches")`
- `revalidatePath("/connections")`

Client caller:

- `invite-to-play-button.tsx` does not call `router.refresh()` on success

This is a relatively lean invalidation path.

### `removeProfileConnection`

Server action:

- `revalidatePath("/matches")`
- `revalidatePath("/connections")`

Client callers:

- profile page invite button does not call `router.refresh()`
- matches page remove button does call `router.refresh()` after success

This means the matches-page path can pay:

- server revalidation
- then client refresh navigation work

That does not change the server action’s own duration directly, but it can make
the user perceive the action as slower.

### `blockUser`

Server-side invalidation is broad:

- 6 fixed paths
- up to 2 dynamic profile paths

Client callers:

- `editable-profile-header.tsx` always calls `router.refresh()` after the action
- `user-block-controls.tsx` always calls `router.refresh()` after the action

So the block flow stacks:

- heavy mutation RPC
- username lookup
- wide revalidation fan-out
- client refresh

This is the clearest non-database latency amplifier in the audited set.

### Redirects

- No `redirect()` calls were found in the audited action paths.

## Do These Actions Block UI Unnecessarily?

### `updateLastSeen`

No critical UI blocking.

- Called from `PresenceProvider`
- invoked with `void writeLastSeen(...)`
- runs after subscribe, visibility change, or heartbeat
- not in SSR path

It is slow, but it is fire-and-forget from the user’s perspective.

### `sendPlayInvite`

Mostly acceptable UI blocking.

- called inside `startTransition()`
- button is disabled while pending
- no forced page refresh on success

The button does block repeat interaction until completion, which is expected for
this mutation.

### `removeProfileConnection`

Partly blocks UI more than necessary on the matches page.

- called inside `startTransition()`
- button is disabled while pending
- matches page button additionally triggers `router.refresh()`

The extra refresh is likely the biggest avoidable UI-side cost here.

### `blockUser`

Yes, this is the heaviest UI-blocking flow in the audited set.

- called inside `startTransition()`
- block controls stay pending until the action finishes
- client always calls `router.refresh()`
- action itself already triggers broad server invalidation

This appears safe but over-eager.

## Security / Ownership Checks To Preserve

Any future optimization must preserve:

- `updateLastSeen` may only update the signed-in user’s own `profiles` row.
- `sendPlayInvite` must preserve:
  - auth check
  - sender-profile existence requirement
  - recipient existence requirement
  - self-invite rejection
  - blocked-user rejection
  - source-post ownership/active/recency validation
  - active-connection rejection
  - invite rate limits
  - duplicate pending invite rejection
- `removeProfileConnection` must preserve:
  - auth check
  - participant-only ownership check
  - disconnected-state guard
  - row-level lock before transition
- `create_user_block` must preserve:
  - auth check
  - self-block rejection
  - target existence check
  - rate limit
  - invite/request cleanup
  - active connection disconnection
  - block event recording

## Bottlenecks Ranked

### P0

- `blockUser` does the most work end-to-end:
  request auth/profile lookup, heavy cleanup RPC, extra username lookup, broad
  path revalidation, and client refresh.
- `send_play_invite` RPC has the longest pure read-before-write validation chain
  of the audited mutations.
- `updateLastSeen` still pays 2 sequential Supabase round trips for a tiny write.

### P1

- `removeProfileConnection` is already compact, but the action still pays
  `getCurrentProfile()` before hitting an RPC that also fully validates the
  transition.
- client `router.refresh()` after successful remove/block actions likely adds
  noticeable perceived latency on top of server revalidation.

### P2

- `revalidatePath("/connections")` and `revalidatePath("/matches")` are both
  fired for invite/connection mutations even though `/connections` is described
  in docs as an alias for `/matches`; verify whether both invalidations are
  still required by the route structure.
- `blockUser` invalidates `/duos`, `/lfg`, `/matches`, `/search/users`,
  `/stacks`, `/account`, and profile pages every time. This is likely correct
  for data freshness, but it is a good place to audit scope more closely.

## Safe Optimization Recommendations

### 1. Replace `updateLastSeen` with a single RPC

Safe outcome:

- one mutation call instead of `auth.getUser()` plus `profiles.update()`
- preserve owner-only write behavior in SQL

### 2. Trim app-layer prechecks where the RPC already enforces them

Candidates:

- `sendPlayInvite`
- `removeProfileConnection`
- `blockUser`

Safe direction:

- keep user-friendly statuses
- reduce duplicate profile lookups where possible

### 3. Return revalidation metadata from `create_user_block`

Safe outcome:

- remove the extra `profiles` query for usernames
- keep the same invalidation coverage

### 4. Reassess broad revalidation plus `router.refresh()`

Safe direction:

- avoid stacking both when one is enough for the visible surface
- especially review block and matches removal flows

### 5. Refactor `send_play_invite` validation chain into fewer query slices

Safe direction:

- keep all security/rate-limit rules
- reduce repeated procedural checks and separate existence probes

### 6. Measure server action time separately from post-success navigation refresh

Safe outcome:

- distinguish mutation latency from UI refresh latency
- avoid optimizing the wrong layer

## QA Checklist

- [ ] `updateLastSeen` still updates only the current user’s `last_seen_at`.
- [ ] guest `updateLastSeen` remains unauthenticated and does not write.
- [ ] `sendPlayInvite` still rejects self-invite, blocked pairs, duplicate
      pending invites, invalid source posts, and already-connected pairs.
- [ ] `sendPlayInvite` still succeeds for a valid recipient and returns the same
      action result shape.
- [ ] `removeProfileConnection` still allows only participants to disconnect.
- [ ] `removeProfileConnection` still rejects already-disconnected rows.
- [ ] `blockUser` still creates the block, cancels pending invites, declines
      pending stack requests, and disconnects active connections.
- [ ] `blockUser` still preserves duplicate block behavior as success-equivalent
      for the caller.
- [ ] profile page block/unblock UI still reflects the final blocked state.
- [ ] matches page remove-connection flow still updates visible data correctly.
- [ ] invite button flow still updates visible invite state correctly.
- [ ] compare latency before and after for:
      `updateLastSeen`, `sendPlayInvite`, `removeProfileConnection`, `blockUser`.
- [ ] measure server action time separately from client refresh/repaint time.

## Commit Message

`docs: add profile actions latency audit for presence invites connections and blocks`
