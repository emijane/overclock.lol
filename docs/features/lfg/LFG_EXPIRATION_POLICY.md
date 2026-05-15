# LFG Post Expiration and Retention Policy

Covers the 24-hour feed expiry, 30-day retention window, scheduled service
functions, and dependency skip rules for LFG posts.

## Feed Expiration

Every new post is given an `expires_at` timestamp at insert:

```
expires_at = created_at + interval '24 hours'
```

Feed visibility and RLS are driven directly by this timestamp:

```sql
-- lfg_posts_public_active_read RLS policy
status = 'active' AND expires_at > now()
```

Once `expires_at` passes, the post disappears from feeds and public profile
surfaces without any background job needing to run first. The background job
exists to update `status` and clean up stack state, not to gate visibility.

## Status Transitions

| From | To | Trigger |
|---|---|---|
| `active` / `filled` | `expired` | `expire_lfg_posts()` scheduled job |
| `active` / `filled` | `closed` | owner calls `close_owned_lfg_post()` |
| `active` | `filled` | stack accepted member count reaches max |
| `filled` | `active` | stack member leaves or is removed |

## Expiration Function

`expire_lfg_posts()` is the canonical entry point for the scheduled expiration job.

**Eligibility:**
```sql
status IN ('active', 'filled')
AND expires_at IS NOT NULL
AND expires_at <= now()
```

**On each eligible post:**
- `status` → `'expired'`
- `expired_at = coalesce(expired_at, now())` (idempotent)
- `purge_after = coalesce(purge_after, now() + interval '30 days')` (idempotent)

**For stacks only:**
- Pending `stack_requests` → `status = 'declined'`
- Active `stack_members` → `removed_at = now()`

**Grants:** `service_role` only. `anon` and `authenticated` cannot call this
function directly.

### Internal compatibility wrapper

`expire_stack_posts()` is a thin wrapper that delegates to `expire_lfg_posts()`.
It exists only for backward compatibility with internal security-definer RPCs
(`close_owned_lfg_post`, `send_stack_request`, etc.) that call it by name.
Because those RPCs are `security definer`, they run as the function owner and
invoke `expire_lfg_posts()` transparently. `expire_stack_posts()` retains its
`anon, authenticated` grant so those call chains are not broken.

## Data Retention

Posts are retained for **30 days** after expiration or close before becoming
eligible for hard delete.

```
purge_after = expires_at + 30 days   (auto-expired posts)
purge_after = now()  + 30 days       (manually closed posts, at close time)
```

During the retention window, posts remain in `lfg_posts` with their final
status. They are not visible in feeds or public profile surfaces, but they are
visible to the owner on `/account/posts`.

## Cleanup Function

`cleanup_expired_lfg_posts()` hard-deletes posts past their retention window.

**Eligibility — all three must hold:**

| Condition | Value |
|---|---|
| `status` | `IN ('expired', 'closed')` |
| `purge_after` | `IS NOT NULL` |
| `purge_after` | `<= now()` |

**Dependency skip rules — any one present blocks deletion:**

| Table | Blocking condition |
|---|---|
| `stack_requests` | `post_id = post.id AND status = 'pending'` |
| `play_invites` | `source_lfg_post_id = post.id AND status = 'pending'` |

No check is needed for `profile_connections` (no FK to `lfg_posts`) or
moderation/reports (table does not exist yet).

**FK cascade behavior on delete:**

| Table | FK behavior |
|---|---|
| `stack_requests` | `ON DELETE CASCADE` — auto-removed |
| `stack_members` | `ON DELETE CASCADE` — auto-removed |
| `play_invites.source_lfg_post_id` | `ON DELETE SET NULL` — nulled, invite survives |

**Return shape:**
```json
{
  "expired_deleted_count": 3,
  "closed_deleted_count": 1,
  "skipped_dependency_count": 0
}
```

**Grants:** `service_role` only. `anon` and `authenticated` cannot call this
function directly.

## No Archive Table

There is no `lfg_post_archive` table. Deleted posts leave no retrievable record
after hard delete. Future moderation needs may add an archive table; that is
not in scope for the current implementation.

## Creation Rate Limit Is Separate from Feed Expiry

The creation rate limit in `create_lfg_post_atomic` uses a `created_at` window
and is intentionally not changed to use `expires_at`. Dedup and slot limits use
`expires_at > now()` to match feed visibility:

| Check | Window | Basis |
|---|---|---|
| Duplicate post dedup | Feed visibility (24h) | `expires_at > now()` |
| Active slot limit | Feed visibility (24h) | `expires_at > now()` |
| Creation rate limit | Rolling 60 minutes | `created_at >= now() - 60 minutes` |

The creation rate limit prevents rapid write bursts regardless of what is
currently visible. Dedup and slot limits align with the feed so that a user
cannot have overlapping identical or extra posts visible simultaneously.

## Scheduled Job Examples

Both functions must be called with `service_role` credentials.

### pg_cron

```sql
-- Run expiration every 15 minutes
select cron.schedule(
  'expire-lfg-posts',
  '*/15 * * * *',
  $$select public.expire_lfg_posts()$$
);

-- Run cleanup once daily (posts won't be eligible before 30 days anyway)
select cron.schedule(
  'cleanup-lfg-posts',
  '0 3 * * *',
  $$select public.cleanup_expired_lfg_posts()$$
);
```

### Supabase Edge Function

```ts
// supabase client must be initialized with the service_role key
const { data, error } = await supabase.rpc('expire_lfg_posts')
const { data, error } = await supabase.rpc('cleanup_expired_lfg_posts')
```

## Timestamp Column Reference

| Column | Written by | Meaning |
|---|---|---|
| `expires_at` | `create_lfg_post_atomic` | When the post leaves the feed |
| `expired_at` | `expire_lfg_posts` | When status was set to `expired` |
| `closed_at` | `close_owned_lfg_post` | When the owner manually closed |
| `purge_after` | all three above | Earliest eligible hard-delete date |

## Related Docs

- `docs/roadmap/lfg/LFG_POST_LIFECYCLE_POLICY.md` — full lifecycle rules
- `docs/roadmap/lfg/LFG_EXPIRATION_IMPLEMENTATION_AUDIT.md` — implementation audit and phase tracking
