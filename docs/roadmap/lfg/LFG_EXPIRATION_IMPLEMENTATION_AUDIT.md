# LFG Expiration and Cleanup — Implementation Audit

This document records the research and findings gathered before writing any
migration or code changes for the LFG post expiration and retention policy.

## Files Audited

### Migrations (in order)

- `20260427172000_create_lfg_post_atomic.sql` — original RPC, 12-hour cutoff
- `20260427201500_secure_lfg_posts_rls_and_rpc.sql` — RLS policies, indexes,
  first `create_lfg_post_atomic` (security definer), `close_owned_lfg_post`
- `20260502120000_add_lfg_looking_for_roles.sql`
- `20260503123000_remove_lfg_post_creation_rate_limit.sql`
- `20260503124500_remove_lfg_active_post_limit.sql`
- `20260510010000_finish_stacks_mvp.sql` — `are_profiles_blocked`,
  `send_stack_request` (adds 24h created_at guard), `accept_stack_request`
  (closes post when full via `status = 'closed'`)
- `20260510020000_stack_group_lifecycle.sql` — `stack_members` table,
  `expire_stack_posts`, full `create_lfg_post_atomic` (security definer),
  `send_stack_request`, `accept_stack_request`, `leave_stack`,
  `remove_stack_member`, `close_owned_lfg_post` (full stacks cleanup)
- `20260510032000_canonicalize_create_lfg_post_atomic.sql` — drops old
  overloads, re-defines canonical RPC
- `20260513040000_optimize_lfg_feed_page_dto.sql` — `get_lfg_feed_page_dto`
  (CTE-optimized, security definer)

### TypeScript

- `overclock/lib/lfg/lfg-post-policy.ts` — constants
- `overclock/lib/lfg/lfg-post-types.ts` — `LFGPostStatus`, `LFGPost` type
- `overclock/lib/lfg/posts.ts` — all client-callable helpers

### Docs

- `docs/roadmap/lfg/LFG_POST_LIFECYCLE_POLICY.md` — existing policy doc;
  describes 12-hour window, stack lifecycle, no-edit policy

---

## Current Schema State

### lfg_posts columns (confirmed present)

```
id                              uuid PK
profile_id                      uuid FK → profiles (on delete cascade)
lfg_type                        text ('duos','stacks','teams','scrims')
game_mode                       text ('ranked','quick_play')
title                           text (1–80 chars)
status                          text ('active','filled','closed','expired','archived')
posting_role                    text ('tank','dps','support')
looking_for_roles               text[]
competitive_profile_snapshot    jsonb
hero_pool_snapshot              jsonb
snapshot_main_role              text
snapshot_platform               text
snapshot_rank_tier              text
snapshot_rank_division          integer
snapshot_region                 text
snapshot_timezone               text
max_group_size                  smallint (null or 2–6)
current_member_count            smallint default 1
description                     text (null or 1–300 chars)
created_at                      timestamptz default now()
```

### Columns that DO NOT exist yet (all needed)

```
expires_at      timestamptz   — feed/RLS expiry cutoff
expired_at      timestamptz   — set when status transitions to 'expired'
closed_at       timestamptz   — set when status transitions to 'closed'
purge_after     timestamptz   — earliest date eligible for hard delete
```

No `deleted_at` column exists. No `updated_at` on `lfg_posts` either.
No moderation or reports table exists yet.

---

## Current Behavior

### Feed filter (get_lfg_feed_page_dto)

```sql
WHERE lp.lfg_type = p_lfg_type
  AND lp.status IN ('active') -- or ('active','filled') for stacks
  AND lp.created_at >= now() - interval '12 hours'
```

The `12 hours` is a hardcoded local variable. There are no `expires_at`
columns; expiry is derived at read time from `created_at`.

### RLS (lfg_posts_public_active_read)

```sql
USING (
  status = 'active'
  AND created_at >= now() - interval '12 hours'
)
```

Same read-time derivation. Owner read policy allows owner to see all their
own posts regardless of status.

### create_lfg_post_atomic (canonical)

New posts are inserted with `status = 'active'`. No `expires_at` or
`purge_after` is written. Rate-limit checks use:

- `v_active_cutoff = now() - interval '12 hours'` — dedup and slot checks
- `v_create_cutoff = now() - interval '60 minutes'` — creation rate limit

### expire_stack_posts()

Only handles `lfg_type = 'stacks'`. Marks posts expired when:

```sql
status IN ('active','filled')
AND created_at < now() - interval '12 hours'
```

Sets `status = 'expired'`, declines pending stack_requests, marks
stack_members removed.

**Does not set `expired_at` or `purge_after` — those columns do not exist.**
**Does not handle duos or other types.**

### close_owned_lfg_post()

Sets `status = 'closed'`. Does not set `closed_at` or `purge_after`.
For stacks: declines pending requests and removes all members.

### TypeScript constants (lfg-post-policy.ts)

```ts
ACTIVE_LFG_POST_WINDOW_HOURS = 12        // used in posts.ts for cutoff
LFG_ACTIVE_POST_LIMIT_PER_ROLE_PER_SECTION = 2
LFG_CREATE_RATE_LIMIT_PER_SECTION = 4
LFG_CREATE_RATE_LIMIT_WINDOW_MINUTES = 60
STACK_MAX_GROUP_SIZE = 5
```

`getActivePostCutoffIso()` in `posts.ts` derives cutoff from
`ACTIVE_LFG_POST_WINDOW_HOURS`. All direct Supabase queries use
`.gte('created_at', activePostCutoffIso)`.

### posts.ts direct table queries that need updating

These functions query `lfg_posts` directly (not via the feed DTO RPC) and
use `created_at >= activePostCutoffIso` as the active filter:

- `getActiveLFGPosts` — main fallback feed query
- `getRecentPostsByProfileId` — profile page active posts
- `getActiveLFGPostCountsByRole` — viewer active-post count
- `hasMatchingActiveLFGPost` — client-side dedup check
- `hasReachedActiveLFGPostLimit` — client-side slot limit check

The rate-limit functions (`hasReachedActiveLFGPostLimit`,
`hasReachedLFGPostCreationLimit`) use `created_at` windows and should
not be changed to use `expires_at`.

---

## Gaps Identified

| Gap | Where |
|-----|-------|
| No `expires_at`, `expired_at`, `closed_at`, `purge_after` columns | lfg_posts schema |
| Feed filter uses `created_at + 12h` not `expires_at` | get_lfg_feed_page_dto, getActiveLFGPosts |
| RLS uses `created_at + 12h` not `expires_at` | lfg_posts_public_active_read |
| `expire_stack_posts()` only handles stacks, no `expired_at`/`purge_after` | migration |
| `close_owned_lfg_post()` does not write `closed_at`/`purge_after` | migration |
| `create_lfg_post_atomic` does not write `expires_at`/`purge_after` | migration |
| No function to expire all post types | missing RPC |
| No cleanup/hard-delete function | missing RPC |
| No archive table for metadata | missing table |
| TS constant `ACTIVE_LFG_POST_WINDOW_HOURS = 12` needs to become 24 | lfg-post-policy.ts |
| posts.ts helpers use `created_at` window for feed queries (not rate limits) | posts.ts |

---

## Implementation Status

| Phase | Migration | Status |
|-------|-----------|--------|
| 2A | `20260515010000_add_lfg_post_expiration_fields.sql` | Done — columns added, backfilled, index created |
| 2B | `20260515020000_add_lfg_post_expiration_writes.sql` | Done — lifecycle writes populate the new columns |
| 2C | `20260515030000_switch_lfg_feed_to_expires_at.sql` | Done — RLS + feed DTOs switched to expires_at; TS helpers updated |
| 2D | `20260515040000_add_expire_lfg_posts_service_fn.sql` | Done — expire_lfg_posts() service_role only; expire_stack_posts() delegates |
| 2E | `20260515050000_add_cleanup_expired_lfg_posts.sql` | Done — cleanup_expired_lfg_posts() service_role only; hard-delete with dependency guards |
| 2F | docs only | Done — LFG_EXPIRATION_POLICY.md created; lifecycle/limits/account docs updated to 24h |
| Audit | `20260515060000_fix_lfg_expiration_gaps.sql` | Done — 4 bugs fixed; see docs/qa/lfg/LFG_EXPIRATION_AUDIT_REPORT.md |

## Implementation Plan (drafted, not yet written)

### Migration: `20260515010000_add_lfg_post_expiration.sql`

1. Add columns to `lfg_posts`:
   - `expires_at timestamptz`
   - `expired_at timestamptz`
   - `closed_at timestamptz`
   - `purge_after timestamptz`

2. Backfill existing rows:
   - active/filled: `expires_at = created_at + 24h`,
     `purge_after = expires_at + 30 days`
   - expired: `expires_at = created_at + 12h` (original window),
     `expired_at = created_at + 12h`,
     `purge_after = expired_at + 30 days`
   - closed/archived: `expires_at = created_at + 24h`,
     `closed_at = created_at` (approximation; no `updated_at`),
     `purge_after = created_at + 30 days`

3. Update RLS policy `lfg_posts_public_active_read`:
   ```sql
   USING (status = 'active' AND expires_at > now())
   ```

4. Add index for expiry-based queries:
   ```sql
   CREATE INDEX lfg_posts_active_expires_feed_idx
     ON public.lfg_posts (lfg_type, expires_at desc)
     WHERE status = 'active';
   ```

5. Update `get_lfg_feed_page_dto`:
   - Replace `lp.created_at >= v_active_cutoff` with `lp.expires_at > now()`
   - Update viewer bundle `activePostCounts` sub-query the same way
   - Remove `v_active_cutoff` variable (no longer needed in feed)

6. Update `create_lfg_post_atomic`:
   - Insert with `expires_at = now() + interval '24 hours'`
   - Insert with `purge_after = now() + interval '24 hours' + interval '30 days'`
   - Rate-limit checks remain `created_at >= v_active_cutoff` (unchanged)

7. Update `close_owned_lfg_post`:
   - Set `closed_at = now()` when closing
   - Set `purge_after = now() + interval '30 days'` if null

8. Replace `expire_stack_posts()` (expanded to all types):
   - Expire all post types: `status IN ('active','filled') AND expires_at <= now()`
   - Set `expired_at = now()` where null
   - Set `purge_after = now() + interval '30 days'` where null
   - For stacks: existing pending request decline + member removal logic
   - For other types: status update only
   - Keep grant to `anon, authenticated` (called from stack RPCs)

9. Create `lfg_post_archive` table (metadata only, no post text):
   ```
   id                uuid PK
   original_post_id  uuid NOT NULL
   author_profile_id uuid
   lfg_type          text
   game_mode         text
   posting_role      text
   rank_tier         text
   rank_division     integer
   region            text
   platform          text
   created_at        timestamptz
   expired_at        timestamptz
   closed_at         timestamptz
   purged_at         timestamptz NOT NULL default now()
   ```
   RLS: no public read. Revoke from anon, authenticated.

10. Create `cleanup_expired_lfg_posts()`:
    - Eligible: `status IN ('expired','closed')`, `purge_after <= now()`,
      no pending play_invites, no pending stack_requests
    - Archive metadata first (skip if already archived)
    - Hard-delete eligible posts
    - Grant to service_role only (revoke from anon, authenticated)
    - Idempotent by design

### TypeScript changes

- `lfg-post-policy.ts`: rename/add constant:
  `LFG_POST_EXPIRY_HOURS = 24`; keep `ACTIVE_LFG_POST_WINDOW_HOURS` for
  rate-limit checks if still needed, or point it at the same value.
- `posts.ts` feed helpers: replace `.gte('created_at', activePostCutoffIso)`
  with `.gt('expires_at', new Date().toISOString())` in:
  - `getActiveLFGPosts`
  - `getRecentPostsByProfileId`
  - `getActiveLFGPostCountsByRole`
  Rate-limit helpers (`hasMatchingActiveLFGPost`, `hasReachedActiveLFGPostLimit`,
  `hasReachedLFGPostCreationLimit`) remain `created_at` based — no change.

### Doc updates

- Update `LFG_POST_LIFECYCLE_POLICY.md` expiry window from 12h to 24h.
- Create `docs/features/lfg/LFG_EXPIRATION_POLICY.md` documenting:
  - expiration vs deletion policy
  - what is archived vs deleted
  - cleanup job expectations

---

## Edge Cases to Handle

| Case | Handling |
|------|----------|
| Posts already expired before migration | Backfill `expired_at`, set `purge_after` |
| Posts manually closed before this migration | Backfill `closed_at` approximation, `purge_after` |
| Posts with pending stack_requests at cleanup time | Cleanup skips them |
| Posts with active play_invites at cleanup time | Cleanup skips them |
| Posts with accepted stack members | Members stay; post still safe to archive/delete after members removed at expiry |
| No moderation table yet | No report-hold logic needed; reserved for future |
| User deleted/banned | `profile_id` FK is on delete cascade for lfg_posts; post goes away naturally; cleanup must not break on null profile |
| Clock drift / UTC | All timestamps stored as `timestamptz`; Supabase normalizes to UTC |
| Duplicate cleanup runs | Archive insert uses `WHERE NOT EXISTS`; delete is idempotent |
| Partial failure | Transaction-safe; archiving before delete in same transaction |

---

## Decisions Resolved

| Decision | Resolution |
|---|---|
| `NOT NULL` constraint on `expires_at` | Left nullable; all checks are null-safe (`expires_at IS NOT NULL AND expires_at <= now()`) |
| `accept_stack_request` close path writing `closed_at` | Investigated: `20260510010000` version is overridden by `20260510020000` which uses `status = 'filled'`, not `'closed'`. No fix needed. |
| Rate-limit `v_active_cutoff` interval — stay 12h or move to 24h | Kept at 12h for rate limits. Feed/RLS use `expires_at > now()` separately. |
| `getPostsByProfileId` DTO for `/account/posts` — add `expires_at`/`closed_at` | Deferred to a future UI pass; the RPC-based DTO already derives display status from `expires_at`. |
