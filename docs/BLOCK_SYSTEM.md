# Block System

## Purpose

The block system gives users a private, database-backed way to block other
profiles and prevents blocked pairs from interacting across search, profile
access, invites, requests, notifications, and connection-adjacent systems.

## Core Data Model

- Primary table: `public.user_blocks`
- Columns:
  - `id`
  - `blocker_profile_id`
  - `blocked_profile_id`
  - `created_at`
- Constraints:
  - users cannot block themselves
  - one block row per blocker/blocked pair
  - profile deletes cascade cleanly

## Supporting Rate-Limit Data

- Supporting table: `public.user_block_events`
- Records `block` and `unblock` actions
- Used by RPCs to rate-limit block mutations server-side

## RLS

`user_blocks` is private.

- Read: only the blocker can read their own rows
- Insert: only the authenticated blocker can create a row for themselves
- Delete: only the blocker can remove their own rows
- No update policy

`user_block_events` is RPC-only and has no direct authenticated access.

## Database Functions

- `public.is_profile_blocked_by(blocker, blocked)`
  - one-way block check
- `public.has_either_user_blocked(user_a, user_b)`
  - pair check in either direction
- `public.are_profiles_blocked(user_a, user_b)`
  - compatibility alias for existing stack RPCs
- `public.get_blocked_profile_ids_for_viewer(viewer)`
  - returns every profile the viewer blocked plus every profile that blocked the viewer
- `public.create_user_block(blocked_profile_id)`
  - validates auth
  - rate-limits block actions
  - inserts the block row if needed
  - cancels pending play invites between the pair
  - declines pending stack requests between the pair
  - disconnects active profile connections between the pair
- `public.delete_user_block(blocked_profile_id)`
  - validates auth
  - rate-limits unblock actions
  - removes the caller-owned block row if present

## App Helpers

Server-side helpers live in `overclock/lib/blocks/user-blocks.ts`.

- `blockUser(profileId)`
- `unblockUser(profileId)`
- `getBlockedUsers()`
- `isBlocked(viewerId, targetId)`
- `hasEitherUserBlocked(userA, userB)`
- `getBlockedProfileIdsForViewer(viewerId)`

These helpers are the app-level entrypoint for UI and server reads.

## Enforcement Rules

### Search

- User search excludes blocked pairs server-side
- Both direct search page results and nav search dropdown results use the same filter

### Profiles

- Public profile loading checks the viewer/profile pair
- If either side has blocked the other, the profile resolves as unavailable
- This avoids leaking whether the viewer was blocked versus the profile not existing

### LFG Feeds

- Feed queries exclude blocked authors for the current viewer
- Stack member strips also filter blocked member profiles when feed data is normalized

### Requests

- Existing stack request RPCs already call `are_profiles_blocked`
- The new migration re-points that check to `user_blocks`
- Pending stack requests are auto-declined when a block is created

### Invites

- `send_play_invite` now returns a blocked-pair error when either side has blocked
- `accept_play_invite` re-checks the pair to protect stale UI and race conditions
- Pending play invites are auto-cancelled when a block is created

### Notifications

- Incoming invite and stack-request readers filter blocked participants
- Because pending rows are also cleaned up on block, blocked notifications do not return after refresh

### Connections / Future Session Systems

- Existing profile connections are disconnected when a block is created
- Future chat or session logic should use `hasEitherUserBlocked` before creating or restoring access

## UI

### Account Page

- Blocked users are shown in a compact account card on `/account`
- Each row shows avatar, display name, username, block date, and an unblock button
- Empty state copy: `No blocked users yet.`

### Dropdown Actions

- LFG post cards now show a user actions menu for other signed-in viewers
- Public profile header now includes a matching user actions menu
- Blocking requires confirmation
- Unblocking is immediate

### User-Facing Messages

- Success:
  - `User blocked`
  - `User unblocked`
- Failure:
  - `Action unavailable`

Blocked-state failures in invite/request flows also stay generic.

## Privacy Notes

- The block list is private to the blocker
- The app does not expose whether the other user blocked the viewer
- Generic unavailable states are used instead of explicit blocked messaging
- No auth IDs, Discord IDs, email fields, or private profile data are surfaced in block UI

## Known Boundaries

- Public LFG content is not deleted when a block is created
- Existing non-pending shared group membership is not forcibly rewritten by the block system
- Future chat/session features still need to call the shared helpers when those systems ship
