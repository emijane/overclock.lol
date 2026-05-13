# Cleanup Cron Jobs

## Purpose

These cron jobs keep stale lifecycle data out of request-time page loads.

The app now uses a mixed cleanup strategy:

- Event-based cleanup in write RPCs when a user acts on a record
- Time-based cleanup in cron jobs so GET routes do not need to mutate data

## Scheduled Jobs

### Lifecycle Job

- Path: `/api/cron/lifecycle`
- Schedule: every 15 minutes
- Purpose:
  - expire stale `play_invites`
  - expire stale `stacks` posts

This job is the time-based backstop for items that naturally age out even if no
user clicks anything.

## Retention Job

- Path: `/api/cron/retention`
- Schedule: daily at `05:17` UTC
- Purpose:
  - delete `user_block_events` older than 30 days
  - delete `profile_media_uploads` older than 30 days

These tables exist for rate limiting and audit-lite operational behavior, not
for permanent product history, so they should be pruned periodically.

## Auth

- Both cron routes require `CRON_SECRET`
- Requests must send `Authorization: Bearer <CRON_SECRET>`
- The handlers use the Supabase service role key through
  `SUPABASE_SERVICE_ROLE_KEY`

## Event-Based Cleanup That Still Exists

The cron jobs do not replace write-path safety checks.

- `accept_play_invite`, `decline_play_invite`, and `cancel_play_invite` still
  detect expired invites when a stale client acts on one
- stack write RPCs still validate whether a stack post is usable when a request
  is sent, accepted, or updated
- block creation still cancels pending interactions immediately

This means:

- cron handles passive time drift
- write RPCs handle stale UI and race conditions

## Files

- `overclock/vercel.json`
- `overclock/app/api/cron/lifecycle/route.ts`
- `overclock/app/api/cron/retention/route.ts`
- `overclock/lib/maintenance/cleanup-jobs.ts`
- `overclock/lib/maintenance/cron-auth.ts`
- `overclock/supabase/migrations/20260513010000_add_cleanup_maintenance_rpcs.sql`

## Current Boundaries

- `profile_media` storage-object deletion is still not automated here
- the retention job cleans upload logs, not storage files
- if storage cleanup is added later, it should run as a separate maintenance job
  because it needs both database and storage mutation logic
