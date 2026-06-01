# Social Chat GET Latency Audit

## Scope

- `/social`
- `/social/duos/[threadId]`
- shared social chat DTO and RPC reads

## Bottlenecks Found

- the root layout notifications fetch could trigger the social inbox RPC before the chat route fetched it again
- direct thread loads refreshed persisted lock state on every GET
- thread loads performed an additional peer-profile query after the inbox and thread RPCs had already joined `profiles`

## Fixes Applied

- request-scoped inbox reads now use React request memoization in `overclock/lib/chat/chat-records.ts`
- server-side chat reads now use the request-cached Supabase client helper
- social chat RPC DTOs now return peer avatar and contact fields needed by the route, removing the extra profile lookup
- direct thread GETs no longer call `refresh_duo_chat_thread_lock_state(...)`; lock state remains maintained on thread creation, connection removal, block creation, and send attempts

## Expected Impact

- fewer duplicate inbox RPCs during a single `/social` request
- one less database round trip on initial thread loads
- no write-on-read lock refresh during direct thread GETs

## Follow-up

- capture fresh dev timings for `get_social_threads_dto`, `get_social_thread_dto`, and `get_chat_thread_messages`
- if latency remains high, inspect `public.can_read_chat_thread(...)` and related block checks with `EXPLAIN ANALYZE`
