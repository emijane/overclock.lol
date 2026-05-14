# Block Refresh Latency Audit

**Date:** 2026-05-14  
**Scope:** block/unblock refresh path only  
**Status:** Audit only; no runtime changes

## Summary Diagnosis

The block/unblock mutation itself is no longer the whole problem.

Current timings:

| Segment | Observed time |
|---|---|
| `blockUser` action | ~434-435ms |
| `unblockUser` action | ~467-492ms |
| full POST | ~957-1119ms |
| profile DTO after action | ~120-134ms |

The gap between action time and full POST time is roughly:

- block: ~522-684ms beyond the server action itself
- unblock: ~465-652ms beyond the server action itself

That extra time is consistent with:

- server-side `revalidatePath()` fan-out
- a client `router.refresh()`
- a fresh `/u/[username]` render after refresh
- on the profile page, a new `get_profile_page_dto` call and render pass

The likely critical path is:

1. client triggers block/unblock action
2. server action completes mutation and issues broad revalidation
3. client calls `router.refresh()`
4. current page re-renders and reloads its server data
5. profile DTO runs again on the refreshed request

The action timing logs show the mutation itself is already much cheaper than the
full end-to-end interaction. The remaining cost is refresh and rerender work.

## Files Inspected

- `overclock/lib/blocks/user-blocks.ts`
- `overclock/features/blocks/components/user-block-controls.tsx`
- `overclock/app/u/[username]/profile/editable-profile-header.tsx`
- `overclock/app/lfg/components/lfg-post-card.tsx`
- `overclock/app/lfg/components/stack-post-card.tsx`
- `overclock/features/blocks/components/account-blocked-users-card.tsx`
- `overclock/supabase/migrations/20260513000000_add_user_blocks.sql`
- `overclock/supabase/migrations/20260514020000_optimize_create_user_block_revalidation.sql`

## Action Timing Breakdown

### Block

| Phase | Observed / inferred cost |
|---|---|
| `blockUser` server action | ~434-435ms |
| remaining full POST overhead | ~522-684ms |
| likely refreshed profile DTO inside rerender | ~120-134ms |
| remaining refresh/render overhead after DTO | roughly ~388-564ms |

### Unblock

| Phase | Observed / inferred cost |
|---|---|
| `unblockUser` server action | ~467-492ms |
| remaining full POST overhead | ~465-652ms |
| likely refreshed profile DTO inside rerender | ~120-134ms if current page is profile |
| remaining refresh/render overhead after DTO | roughly ~331-532ms |

Interpretation:

- profile DTO reruns are a real part of the post-action cost, but they do not
  explain the full ~1s end-to-end time by themselves
- the broad invalidation + `router.refresh()` pattern is still the main suspect

## Revalidation Table

Current server-side invalidation in `lib/blocks/user-blocks.ts`:

| Path | Called by block | Called by unblock | Why it may be needed |
|---|---|---|---|
| `/account` | yes | yes | blocked users list and account-owned views |
| `/duos` | yes | yes | feed cards should hide/show blocked authors |
| `/lfg` | yes | yes | general LFG surface can show blocked authors |
| `/matches` | yes | yes | connections/invite surfaces affected by block cleanup |
| `/search/users` | yes | yes | blocked users should disappear/reappear |
| `/stacks` | yes | yes | stack feed cards should hide/show blocked authors |
| `/u/[actorUsername]` | yes | yes | current viewer's own profile state and counts |
| `/u/[targetUsername]` | yes | yes | target profile should hide/show appropriately |

Notes:

- `blockUser()` now gets usernames from `create_user_block`.
- `unblockUser()` still performs a username lookup query because
  `delete_user_block` does not currently return revalidation metadata.
- `/connections` is not directly revalidated here. That is okay because
  `app/connections/page.tsx` re-exports `/matches`, and `/matches` is already
  revalidated.

## `router.refresh()` Caller Table

| File | Caller | When it runs | Why it exists today |
|---|---|---|---|
| `features/blocks/components/user-block-controls.tsx` | `useUserBlockAction().runAction()` | after every block/unblock attempt | refresh feed cards, account list, and any current page using shared block menu |
| `app/u/[username]/profile/editable-profile-header.tsx` | `handleBlockedChange()` | after every block/unblock attempt | refresh profile page server data after local blocked state toggle |

Important detail:

- `editable-profile-header.tsx` passes `onBlockedChange` into `UserBlockMenu`.
- That means the profile page does **not** use the shared `runAction()` refresh.
- On profile pages, only `EditableProfileHeader` does the `router.refresh()`.
- On feed cards and account block list buttons, the shared
  `user-block-controls.tsx` refresh is the one that runs.

So there is not a double `router.refresh()` on the same click path. The
redundancy question is server revalidation plus one client refresh, not two
client refreshes.

## Which Surfaces Actually Need Immediate Refresh

### Profile page

Needs immediate refresh: **yes**

Why:

- local `blockedByViewer` state is updated optimistically, but server-derived
  data also changes:
  - relationship / invite state
  - active connection state
  - connection count
  - hidden/null profile behavior when appropriate
- the measured `profile DTO after action` log strongly suggests this rerender is
  happening and is part of the current path

### Duos feed

Needs immediate refresh: **likely yes**

Why:

- feed cards can contain the blocked target
- blocked users are expected to disappear from visible feeds
- the shared block menu is used inside `lfg-post-card.tsx`

### Stacks feed

Needs immediate refresh: **likely yes**

Why:

- same reason as duos
- shared block menu is used inside `stack-post-card.tsx`

### Matches page

Needs immediate refresh: **likely yes**

Why:

- blocking can cancel pending invites
- blocking can disconnect active connections
- current matches/connections surfaces should reflect that immediately

### `search/users`

Needs immediate refresh: **likely yes**

Why:

- blocked target should disappear from search results
- unblock should allow reappearance

### Account block list

Needs immediate refresh: **yes**

Why:

- list is the canonical UI for blocked users
- unblock should remove the item immediately
- block should add the item if the user visits the account page next

### `/lfg`

Not listed in the task's surface list, but currently revalidated: **probably yes**

Why:

- it is a direct feed surface that can show authors affected by blocking

## Redundant Work Findings

### 1. Broad server invalidation plus current-page `router.refresh()`

This is the main redundancy candidate.

Today the app does both:

- invalidate many routes on the server
- immediately refresh the current route on the client

For the current page, those two operations overlap:

- `revalidatePath(currentPath)` marks cache invalid
- `router.refresh()` then forces the current route to refetch

That pairing is often necessary for immediate UX, but it is also exactly the
kind of thing that can turn a ~450ms mutation into a ~1s full interaction.

### 2. Profile page local state update plus full route refresh

`EditableProfileHeader` already updates:

- `blockedByViewer`

before it calls `router.refresh()`.

That local state avoids stale button state, but server-derived profile state
still forces a refresh. This is not safely removable yet, but it means the
profile page is already half-optimistic and still paying for a full rerender.

### 3. Unblock still does a username lookup

`blockUser()` no longer performs a post-RPC username lookup because
`create_user_block` now returns:

- `actor_username`
- `target_username`

`unblockUser()` still does the extra `profiles` query because `delete_user_block`
returns only status metadata, not usernames.

That explains why unblock remains slightly heavier in the server action than the
optimized block path.

### 4. `/duos`, `/stacks`, and `/lfg` are separate path invalidations

These may all be justified, but they are also a fan-out multiplier.

- `/duos` and `/stacks` are direct user-facing feed routes
- `/lfg` is also a feed route

They are not obviously redundant in the same way `/connections` would be, but
they should be treated as high-cost fan-out.

### 5. `/matches` revalidation likely covers `/connections`

This is already handled correctly:

- `/connections` is an alias route that re-exports `/matches`
- block code does **not** separately revalidate `/connections`

No redundancy to remove there.

## Why Unblock Still Does Username Lookup

Current difference:

- `blockUser()` calls `create_user_block`, which now returns usernames needed for
  revalidation
- `unblockUser()` calls `delete_user_block`, which does **not** return usernames

Because of that, unblock still does:

1. `getCurrentProfile()`
2. `delete_user_block` RPC
3. `profiles SELECT id, username` for the actor and target
4. `revalidatePath()` fan-out

So unblock remains less optimized than block on the server side, even before
the refresh/rerender phase.

## Safer Refresh Strategy Recommendations

### 1. Keep broad server revalidation for correctness, but narrow the client refresh

Safest first step:

- continue revalidating affected routes on the server
- only call `router.refresh()` on surfaces that truly need immediate current-page
  rerender

This reduces risk because it does not weaken cache invalidation for other
routes.

### 2. Treat current-path refresh as surface-specific, not universal

Recommended split:

- profile page: likely still needs `router.refresh()`
- feed cards: likely still need `router.refresh()` so blocked cards disappear
- account blocked users card: could potentially rely more on local state or
  route-level data ownership, but should be changed only after targeted testing

### 3. Prefer minimal current-path refresh over broad generic refresh hooks

Current shared pattern in `useUserBlockAction()` refreshes unconditionally for
every menu use.

Safer future direction:

- let each surface decide whether it needs immediate `router.refresh()`
- keep server invalidation shared
- avoid a generic always-refresh client helper

### 4. Consider optional optimistic UI only where the surface already has safe local state

Examples:

- profile page already has `blockedByViewer` local state
- account blocked list could remove an unblocked item locally after success

Only do this where:

- the changed UI slice is fully owned by the component
- server-derived side effects are either irrelevant or separately refreshed

### 5. Mirror block's revalidation metadata optimization for unblock

Safe next step:

- return `actor_username` and `target_username` from `delete_user_block`
- remove the extra unblock username lookup

This does not solve the full POST problem, but it trims the server-action part
without changing UI behavior.

### 6. Measure current-path refresh separately from mutation timing

Future instrumentation should log:

- server action duration
- `router.refresh()` start to settled UI
- refreshed profile DTO timing

That would confirm exactly how much of the remaining ~500-650ms belongs to:

- rerender
- route fetch
- cache invalidation side effects

## Recommended Immediate-Need Matrix

| Surface | Immediate client refresh likely needed? | Confidence |
|---|---|---|
| profile page | yes | high |
| duos feed | yes | medium-high |
| stacks feed | yes | medium-high |
| matches page | yes | medium |
| `search/users` | likely yes if action originates there | medium |
| account blocked list | maybe, but could be optimized locally later | medium |

## QA Checklist

- [ ] Block a user from the profile page and confirm blocked state updates
      immediately.
- [ ] Unblock from the profile page and confirm state resets correctly.
- [ ] Block from a duos feed card and confirm the blocked author disappears from
      the visible feed as expected.
- [ ] Block from a stacks feed card and confirm the blocked author disappears
      from the visible feed as expected.
- [ ] Confirm matches/connections surfaces reflect cancelled invites and removed
      active connections after block.
- [ ] Confirm `search/users` hides blocked users and shows them again after
      unblock.
- [ ] Confirm account blocked users list updates correctly after block/unblock.
- [ ] Compare block vs unblock timing and confirm unblock still pays the extra
      username lookup until separately optimized.
- [ ] Measure:
      action time, full POST time, refreshed profile DTO time, and total
      refresh-to-settled UI time.
- [ ] Validate duplicate block behavior still works as success-equivalent.
- [ ] Validate self-block remains impossible.

## Commit Message

`docs: add block refresh latency audit for revalidation and router refresh`
