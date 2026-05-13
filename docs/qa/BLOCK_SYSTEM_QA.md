# Block System QA

## Scope

Safe user blocking with account-side management, private block storage, and
server-side enforcement across profile discovery and interaction systems.

## Files Changed

- `docs/BLOCK_SYSTEM.md`
- `docs/qa/BLOCK_SYSTEM_QA.md`
- `overclock/app/account/page.tsx`
- `overclock/app/api/users/search/route.ts`
- `overclock/app/lfg/components/lfg-invite-button.tsx`
- `overclock/app/lfg/components/lfg-page-shell.tsx`
- `overclock/app/lfg/components/lfg-post-card.tsx`
- `overclock/app/lfg/components/request-to-join-button.tsx`
- `overclock/app/lfg/components/stack-post-card.tsx`
- `overclock/app/matches/play-invite-action-helpers.ts`
- `overclock/app/search/users/page.tsx`
- `overclock/app/u/[username]/page.tsx`
- `overclock/app/u/[username]/profile/editable-profile-header.tsx`
- `overclock/components/navigation/global-notifications-menu-client.tsx`
- `overclock/features/blocks/components/account-blocked-users-card.tsx`
- `overclock/features/blocks/components/user-block-controls.tsx`
- `overclock/lib/blocks/user-blocks.ts`
- `overclock/lib/lfg/posts.ts`
- `overclock/lib/lfg/stack-requests.ts`
- `overclock/lib/matches/play-invites.ts`
- `overclock/lib/profiles/get-profile-by-username.ts`
- `overclock/lib/profiles/public-profile-search.ts`
- `overclock/supabase/migrations/20260513000000_add_user_blocks.sql`
- `overclock/tests/matches/play-invite-action-helpers.test.ts`

## Database Migrations Added

- `20260513000000_add_user_blocks.sql`

## Database / RLS Changes

### Tables

- `public.user_blocks`
- `public.user_block_events`

### Constraints / Indexes

- self-block prevention on `user_blocks`
- unique blocker/blocked pair index
- blocker and blocked lookup indexes
- block-event actor timestamp index

### RLS Policies Added

- `user_blocks_owner_read`
- `user_blocks_owner_insert`
- `user_blocks_owner_delete`

### RPC / SQL Helpers Added Or Replaced

- `is_profile_blocked_by`
- `has_either_user_blocked`
- `are_profiles_blocked`
- `get_blocked_profile_ids_for_viewer`
- `create_user_block`
- `delete_user_block`
- `send_play_invite` updated to reject blocked pairs
- `accept_play_invite` updated to reject blocked pairs and cancel stale pending invites

## UI Locations Updated

- Account page blocked users section on `/account`
- Profile header dropdown on `/u/[username]`
- LFG post card dropdowns on duos/lfg feeds
- Stack post card dropdowns on stacks feed
- Generic block/unblock confirmation + toast UI shared by profile/feed surfaces

## Manual Test Checklist

- Block from LFG post card dropdown
- Block from profile dropdown
- Block button does not appear on own profile/card
- Blocked user appears in account block list
- Unblock works from account block list
- Duplicate block fails gracefully
- Direct server action/API call cannot bypass block rules
- Blocked user cannot request/join/invite
- Blocked user does not appear in search where filtered
- Styling matches `PROFILE_UI_UPDATE_TEST.md`
- Direct profile URL for a blocked pair resolves as unavailable
- Pending notifications from blocked users disappear after refresh
- Existing active connection is removed when a block is created

## Abuse / Edge Case Checklist

- Cannot block yourself
- Cannot create duplicate blocker/blocked rows
- Unblock missing row behaves safely
- Blocked pair invite race is handled server-side
- Blocked pair stack request race is handled server-side
- Two users can block each other without leaking state
- Deleted profile cleanup does not leave broken block rows
- Block list still renders if username/avatar changes
- Search and feed queries do not expose blocked users after refresh
- Incoming pending invites and stack requests are filtered even if stale rows existed

## Verification Run

- `npm run typecheck`
  - passed
- `npm run lint`
  - passed
- `npm run verify`
  - passed
- `npm test`
  - passed
- Supabase type generation/checks
  - no dedicated project script was available in `overclock/package.json`

## Known Limitations

- Rate limiting is backed by `user_block_events`, but there is no cleanup job yet for old event rows
- Public LFG content is hidden from blocked viewers where practical, but old public content is not deleted
- Existing accepted stack membership is not automatically dissolved when one member blocks another
- There is no standalone block API route because current UI uses server functions directly

## Future Improvements

- Add scheduled cleanup or retention management for `user_block_events`
- Expand pair checks into future chat/session systems at first implementation
- Add end-to-end tests once automated browser coverage exists
- Consider paginated block list controls if account block volume grows substantially
