# Chat RLS Foundation

## Threat Model

The main risks for v1 chat are:

- a non-participant reading a thread
- a disconnected pair continuing to send
- a blocked pair retaining chat visibility
- the client spoofing sender identity
- realtime leaking messages outside the active thread

## Security Model

- RLS is the primary read boundary.
- RPC is the primary write boundary.
- Normal users do not get direct insert/update/delete access to `chat_messages`.
- Internal helper functions used by policies stay private to SQL and are not exposed as authenticated public RPC surfaces.
- The client sends `thread_id` and `body` only.
- The sender comes from `auth.uid()` inside the database.

## RLS Rules

Normal reads require all of the following:

- the user is a thread participant
- the thread is not archived
- there is no active block between participants

Important outcomes:

- connection removal does not remove read access
- block removes read access
- archive removes read access

## RPC Rules

`public.send_chat_message(...)` validates:

- authenticated sender
- participant membership
- message length and emptiness
- archived state
- block state
- persisted lock state
- current Duo sendability
- per-thread send rate limit

If any of those checks fail, the message is not inserted.

## Realtime Rules

- Realtime listens to `chat_messages` only.
- Subscriptions are filtered by `thread_id`.
- V1 does not subscribe to an inbox-wide channel.
- The client should treat subscription error/closed states as a thread refresh signal so access revocation after block/archive is handled intentionally.

## Access Matrix

- Connected Duo pair:
  - read yes
  - send yes
- Connection removed:
  - read yes
  - send no
- Blocked:
  - read no
  - send no
- Archived:
  - read no
  - send no

## Security Edge Cases

- Concurrent Duo acceptance must not create duplicate threads.
- Two open tabs must not bypass a newly applied block or disconnect.
- Old messages stay readable after disconnect, but not after block.
- Direct inserts into `chat_messages` must fail for authenticated users.
- Inbox reads should not perform per-thread lock recomputation work on every page load.

## Why Direct Inserts Are Forbidden

V1 chat is easier to audit when message writes pass through a single RPC path.
That keeps sender identity, lock enforcement, and rate limiting on the server boundary instead of splitting them across client code and table grants.
