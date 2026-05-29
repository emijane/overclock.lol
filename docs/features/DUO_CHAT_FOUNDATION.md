# Duo Chat Foundation

## Purpose

Ship the smallest secure private chat foundation for accepted Duo matches.

## Shipped Scope

- `/social` is the signed-in inbox route.
- `/social/duos/[threadId]` is the accepted Duo chat thread route.
- Threads are created only from accepted Duo `play_invites`.
- Connected Duo posts can deep-link straight into the accepted chat thread.
- The schema is generic enough for future Stack chat:
  - `chat_threads`
  - `chat_participants`
  - `chat_messages`

## Key Decisions

- Chat lives under `/social`, not `/connections`.
- Each accepted Duo invite maps to at most one chat thread.
- Chat reads are protected by RLS.
- Chat sends go through `public.send_chat_message(...)` only.
- The client never provides `sender_profile_id`.
- Realtime is scoped to the open thread and filtered by `thread_id`.

## Thread Lifecycle

- A thread is ensured when a valid Duo invite is accepted.
- The accepted invite remains the permanent source identity for that thread.
- Existing accepted Duo invites are backfilled into chat threads by migration.
- The accepted thread is the message destination surfaced from connected Duo posts and connection notifications.

## Participant Lifecycle

- Duo threads always contain exactly two participants.
- Participant rows store `profile_id` plus lightweight display and avatar snapshots.
- Snapshots keep thread lists cheap even if profile display data changes later.

## Connection Rules

- Active connection:
  - read allowed
  - send allowed
- Connection removed:
  - read allowed
  - send disabled

## Block Rules

- Any active block between thread participants removes read access.
- Any active block between thread participants removes send access.
- Blocking is stricter than disconnecting because the thread should disappear from normal user access.

## Lock State Rules

- Thread send lock is persisted on `chat_threads.locked_at` and `chat_threads.lock_reason`.
- Allowed lock reasons:
  - `connection_removed`
  - `blocked`
  - `invalid_source`
  - `archived`
  - `manual`
- V1 UI uses lock state to hide the composer and show a compact banner when the thread is still readable.

## Archive Rules

- Archived threads are hidden from normal thread lists.
- Archived threads are unreadable to normal users.
- Archived threads are unwritable.
- V1 does not include archive UI.

## Realtime Design

- Only the open thread subscribes to Realtime.
- Realtime listens to `chat_messages` only.
- Realtime filter is `thread_id=eq.<threadId>`.
- V1 does not include inbox-wide realtime or unread counts.

## Message Timestamp Display

- Inline thread timestamps use the viewer's local browser timezone.
- Messages from the current local calendar day show time only.
- Messages from a previous local day show a compact date, with the year added for prior-year messages.

## Contact Display

- Discord and Battle.net remain gated to connected pairs.
- The open Duo chat header uses a compact single-line identity row with display name, `@username`, and source post title.
- The open Duo chat header can show the peer's Discord and Battle.net when those values exist.
- Inbox rows stay compact and do not display contact chips.

## Pagination

- Initial load fetches the newest 50 messages.
- Older pages also use the same size of 50.
- Pagination is cursor-based on `(created_at, id)`.
- The thread does not render a `Start of chat` label once the oldest loaded page is reached.

## Social Surface Chrome

- The inbox list uses the shared site-themed scrollbar styling.
- The open message history uses the same shared scrollbar styling.
- The inbox header stays intentionally compact and avoids extra helper copy.

## Future Compatibility

- Stack chat is intentionally out of scope for v1.
- The current schema is generic so Stack/group chat can reuse it later without a schema rewrite.
