# Duo Chat QA

## Provisioning

- Accept a valid Duo invite and verify exactly one thread is created.
- Re-run the ensure path and verify it stays idempotent.
- Verify non-Duo accepted invites do not create chat threads.

## RLS

- Verify a participant can read an active thread.
- Verify a non-participant cannot read thread rows, participant rows, or messages.
- Verify an archived thread disappears from normal reads.

## Messaging

- Verify a connected pair can send.
- Verify empty messages fail.
- Verify oversized messages fail.
- Verify direct inserts into `chat_messages` fail for authenticated users.
- Verify rate limiting blocks rapid sends.

## Connection Removal

- Remove a connection and verify:
  - existing chat remains readable
  - sending is disabled
  - the locked-state banner appears

## Blocks

- Block the other participant and verify:
  - the thread disappears from `/social`
  - direct thread access is no longer readable
  - sending fails

## Pagination

- Verify the first load returns the newest 50 messages.
- Verify older-message pagination returns the next older slice without duplicates or gaps.

## Realtime

- Verify only messages for the active `thread_id` appear.
- Verify unrelated thread messages do not show up in the open thread.

## Multi-Tab

- Open the same thread in two tabs.
- Remove the connection in one tab and verify the other tab becomes read-only on next send.
- Apply a block in one tab and verify the other tab loses access correctly.

## Regression Checklist

- `/social` matches the current Overclock workspace layout.
- `/social/duos/[threadId]` matches the current Overclock panel and spacing patterns.
- Sidebar navigation includes `Social`.
- `/connections` still behaves as before.
- `npm run verify` passes.
- Production build passes.
