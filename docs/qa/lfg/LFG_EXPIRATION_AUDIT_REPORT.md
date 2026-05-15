# LFG Expiration Implementation — Production Audit Report

Date: 2026-05-15
Scope: Phases 2A–2F of the LFG post expiration and retention implementation.
Outcome: Four bugs fixed in `20260515060000_fix_lfg_expiration_gaps.sql`.

---

## 1. Confirmed Correct

### Migration override chain

Every function redefined across multiple migrations applies correctly because
Supabase runs migrations in filename timestamp order and `CREATE OR REPLACE`
wins. The final canonical definition for each function is:

| Function | Canonical migration |
|---|---|
| `create_lfg_post_atomic` | `20260515060000` (fix) |
| `close_owned_lfg_post` | `20260515020000` (2B) |
| `expire_stack_posts` | `20260515040000` (2D wrapper) |
| `expire_lfg_posts` | `20260515040000` (2D) |
| `cleanup_expired_lfg_posts` | `20260515060000` (fix) |
| `send_play_invite` | `20260515060000` (fix) |
| `get_profile_page_dto` | `20260515060000` (fix) |
| `get_lfg_feed_page_dto` | `20260515030000` (2C) |
| `get_account_posts_page_dto` | `20260515030000` (2C) |

### Grant model

| Function | Callable by |
|---|---|
| `expire_lfg_posts` | `service_role` only |
| `expire_stack_posts` | `anon, authenticated` (called internally by lifecycle RPCs) |
| `cleanup_expired_lfg_posts` | `service_role` only |
| `create_lfg_post_atomic` | `authenticated` |
| `close_owned_lfg_post` | `authenticated` |
| `send_play_invite` | `authenticated` |
| `get_profile_page_dto` | `anon, authenticated` |
| `get_lfg_feed_page_dto` | `anon, authenticated` |
| `get_account_posts_page_dto` | `authenticated` |

`expire_stack_posts` retains its `anon, authenticated` grant deliberately.
All stack lifecycle RPCs (`send_stack_request`, `accept_stack_request`,
`leave_stack`, `remove_stack_member`, `close_owned_lfg_post`) are
`security definer` and call `perform public.expire_stack_posts()` at the top
of each execution. This works because the caller is a security-definer
function — the anon/authenticated grant is not a privilege escalation risk.

### RLS alignment

`lfg_posts_public_active_read` (Phase 2C):

```sql
status = 'active' AND expires_at > now()
```

All feed queries, viewer active-post counts, and the profile page recent-posts
widget now use the same `expires_at > now()` predicate.

### Expiration column writes

Every code path that transitions a post out of `active` writes the lifecycle
columns correctly:

| Transition | Written columns |
|---|---|
| `create_lfg_post_atomic` INSERT | `expires_at`, `purge_after` |
| `close_owned_lfg_post` UPDATE | `status = 'closed'`, `closed_at`, `purge_after` |
| `expire_lfg_posts` / `expire_stack_posts` UPDATE | `status = 'expired'`, `expired_at` (coalesce), `purge_after` (coalesce) |

All coalesce guards are correct: existing timestamps are never overwritten by
re-runs (`coalesce(expired_at, now())`).

### Stack cleanup integrity

`expire_lfg_posts` handles stack member and request cleanup correctly:

- Collects all expired post IDs and stack-type expired post IDs in one scan.
- Updates all post statuses in a single `UPDATE ... WHERE id = any(v_all_expired_ids)`.
- Runs stack cleanup only when `v_stack_expired_ids` is non-empty.
- Declines pending `stack_requests` with `status = 'declined'`, writes `responded_at` and `declined_at` with coalesce guards.
- Marks `stack_members` removed, preserving `removed_by_profile_id` if already set.

`close_owned_lfg_post` runs the same stack cleanup for manual closes.

### Idempotency

- `expire_lfg_posts`: coalesce guards on `expired_at` and `purge_after` mean re-running
  on already-expired posts is a no-op beyond the status check.
- `cleanup_expired_lfg_posts`: deleting already-deleted rows is impossible; the
  function returns zero counts on subsequent calls.
- Phase 2A backfill: safe to re-run against rows that already have `expires_at`.

### FK cascade correctness

| FK | Behavior on post delete |
|---|---|
| `stack_requests.post_id` | `ON DELETE CASCADE` — rows auto-removed |
| `stack_members.post_id` | `ON DELETE CASCADE` — rows auto-removed |
| `play_invites.source_lfg_post_id` | `ON DELETE SET NULL` — invite preserved, post reference nulled |

No manual child-row cleanup is needed in `cleanup_expired_lfg_posts` for
`stack_requests` or `stack_members`. The `ON DELETE SET NULL` on `play_invites`
is intentional: invite recipients should still see their pending invites even
if the originating post is deleted.

### Empty-array edge case

`NOT (id = any(array[]::uuid[]))` evaluates to `true` for all rows in
PostgreSQL. This means when `v_skipped_ids` is empty, all eligible posts are
correctly included in `v_deletable_ids`. No off-by-one or silent exclusion.

### Rate-limit separation

`create_lfg_post_atomic` uses three distinct checks with two different bases:

| Check | Basis |
|---|---|
| Dedup | `expires_at > now()` — aligned with feed (Bug 1 fix) |
| Active slot limit | `expires_at > now()` — aligned with feed (20260515070000) |
| Creation rate limit | `created_at >= now() - 60m` — separate write-budget check |

`v_active_cutoff` has been removed from the function. The creation rate limit
uses its own `v_create_cutoff` variable and is intentionally status-agnostic.

---

## 2. Bugs Found and Fixed

All four bugs are fixed in `20260515060000_fix_lfg_expiration_gaps.sql`.

### Bug 1 — Duplicate posts allowed in feed between hours 12–24

**Severity:** High (UX regression — identical posts visible simultaneously)

**Where:** `create_lfg_post_atomic`, dedup EXISTS check.

**Root cause:** The dedup check used `created_at >= now() - interval '12 hours'`
as the active window. After Phase 2C, posts remain in the feed for 24h via
`expires_at > now()`. Between hours 12 and 24 after a post was created, the
existing post was invisible to the dedup check but visible in the feed, allowing
a user to create an identical duplicate post that would appear alongside it.

**Old:**
```sql
and status in ('active', 'filled')
and created_at >= v_active_cutoff
```

**Fixed:**
```sql
and status in ('active', 'filled')
and (expires_at is null or expires_at > now())
```

---

### Bug 2 — Play invite rejected from a feed-visible post (hours 12–24)

**Severity:** High (UX regression — users blocked from inviting someone they can see in the feed)

**Where:** `send_play_invite` (canonical: `20260513000000`), source post validation.

**Root cause:** `send_play_invite` validated the source LFG post with:
```sql
or v_source_post.created_at < now() - interval '12 hours'
```
After Phase 2C, posts remain visible in the feed for 24h. Between hours 12 and 24,
a user could see a post in the feed and click "Play Together", but receive
`invalid_source_post` because the source post's `created_at` was older than 12h.

**Old:**
```sql
select id, profile_id, status, created_at
into v_source_post ...

or v_source_post.created_at < now() - interval '12 hours'
```

**Fixed:**
```sql
select id, profile_id, status, expires_at
into v_source_post ...

or (v_source_post.expires_at is not null and v_source_post.expires_at <= now())
```

---

### Bug 3 — Zombie play invites block post cleanup indefinitely

**Severity:** Medium (cleanup correctness — posts never purged while zombie invites exist)

**Where:** `cleanup_expired_lfg_posts`, dependency skip check for `play_invites`.

**Root cause:** `play_invites` have their own `expires_at` (24h). A pending invite
whose `expires_at` has passed is a zombie — it has `status = 'pending'` but will
never be accepted or declined. The cleanup skip check did not filter out zombie
invites, so they blocked post deletion forever even though no user could act on them.

**Old:**
```sql
select source_lfg_post_id as dep_post_id
from public.play_invites
where source_lfg_post_id = any(v_eligible_ids)
  and status              = 'pending'
```

**Fixed:**
```sql
select source_lfg_post_id as dep_post_id
from public.play_invites
where source_lfg_post_id = any(v_eligible_ids)
  and status              = 'pending'
  and expires_at          > now()
```

---

### Bug 4 — Profile page recent-posts widget uses stale 12h window

**Severity:** Medium (UX inconsistency — post disappears from profile page at 12h while still in feed)

**Where:** `get_profile_page_dto`, `recent_posts` CTE (canonical: `20260515003000`).

**Root cause:** Phase 2C updated the feed DTO and RLS to use `expires_at > now()`,
but `get_profile_page_dto` was not included in that migration. The `recent_posts`
CTE on public profile pages (`/u/[username]`) still filtered with
`created_at >= now() - interval '12 hours'`. Posts disappeared from profile pages
at 12h while remaining visible in the LFG feed for 24h.

**Old:**
```sql
and status in ('active', 'filled')
and created_at >= now() - interval '12 hours'
```

**Fixed:**
```sql
and status in ('active', 'filled')
and expires_at > now()
```

---

## 3. Non-Regression Notes

### Policy doc vs code discrepancy (pre-existing)

`LFG_POST_LIFECYCLE_POLICY.md` says active slot limits and creation rate limits
were "permanently removed." However `create_lfg_post_atomic` in Phase 2B has
both checks. This predates Phases 2A–2F — the Phase 2B migration was based on
`20260510020000` which re-added them. The doc reflects an earlier state. This
is a documentation staleness issue, not a Phase 2 regression.

### Index gap for stacks feed (not a bug)

`lfg_posts_active_expires_feed_idx` is a partial index on `WHERE status = 'active'`.
The stacks feed queries `status IN ('active', 'filled')`. `filled` rows require a
separate table scan. This is a performance optimization opportunity, not a
correctness issue. The stacks feed is low-volume enough that this is acceptable
for now.

---

## 4. Complete Functionality Reference

### Post lifecycle: status transitions

```
INSERT → status = 'active', expires_at = now() + 24h, purge_after = expires_at + 30d

active ──────────────────────────────────────────────────── expires_at
  │                                                             │
  │  close_owned_lfg_post()                                     │  expire_lfg_posts()
  ↓                                                             ↓
closed (closed_at = now(), purge_after = now() + 30d)       expired (expired_at = now(), purge_after = now() + 30d)
  │                                                             │
  └──────────────────────────┬──────────────────────────────────┘
                             │  purge_after <= now()
                             ↓
              cleanup_expired_lfg_posts() → hard DELETE
```

### Feed visibility rules

| Surface | Filter | Notes |
|---|---|---|
| LFG feed (`/duos`, `/stacks`) | `expires_at > now()` | Set in RLS + `get_lfg_feed_page_dto` |
| Public profile recent posts | `expires_at > now()` | `get_profile_page_dto` `recent_posts` CTE |
| Account posts page | All statuses, ordered `created_at desc` | `get_account_posts_page_dto` |
| RLS public read | `status = 'active' AND expires_at > now()` | Enforced at database level |

### Rate-limit rules

| Check | Window | Uses |
|---|---|---|
| Active slot limit | Feed visibility (24h) | `expires_at > now()` |
| Dedup check | Feed visibility (24h) | `expires_at > now()` |
| Creation rate limit | Rolling 60 min | `created_at >= now() - 60m` |

Dedup and slot limits align with feed visibility so a user cannot have extra
or identical posts visible simultaneously. The creation rate limit is a
write-budget check and intentionally uses `created_at`. This was updated in
`20260515070000_align_lfg_slot_limits.sql` after the initial audit.

### Service functions

**`expire_lfg_posts()` — service_role only**

Intended to run as a scheduled cron job (every 5–15 minutes recommended):

```sql
select net.http_post(
  url := 'https://<project>.supabase.co/rest/v1/rpc/expire_lfg_posts',
  headers := jsonb_build_object('Authorization', 'Bearer <service_role_key>')
);
```

Behavior:
- Finds all `status IN ('active', 'filled')` posts where `expires_at <= now()`
- Updates `status = 'expired'`, `expired_at = coalesce(expired_at, now())`,
  `purge_after = coalesce(purge_after, now() + 30d)`
- For stacks posts: declines pending `stack_requests`, marks `stack_members` removed
- Returns `{updated: bool, expired_count: int}`
- Idempotent: safe to call repeatedly

**`expire_stack_posts()` — anon, authenticated**

Thin wrapper around `expire_lfg_posts()`. Retained as a security-definer
shim because all stack lifecycle RPCs call `perform public.expire_stack_posts()`
at execution start. This ensures posts are expired before any stack state change
is evaluated, even without a cron job running.

**`cleanup_expired_lfg_posts()` — service_role only**

Intended to run as a scheduled cron job (daily recommended, e.g. 3 AM UTC):

```sql
select net.http_post(
  url := 'https://<project>.supabase.co/rest/v1/rpc/cleanup_expired_lfg_posts',
  headers := jsonb_build_object('Authorization', 'Bearer <service_role_key>')
);
```

Behavior:
- Eligible: `status IN ('expired', 'closed')` AND `purge_after IS NOT NULL` AND `purge_after <= now()`
- Skipped (blocked from deletion):
  - Posts with pending `stack_requests` (would destroy user-visible data)
  - Posts with pending `play_invites` where `expires_at > now()` (live invite that can still be acted on)
  - Zombie play invites (`status = 'pending'` but `expires_at <= now()`) do **not** block cleanup
- Deletes eligible minus skipped
- FK cascades: `stack_requests` and `stack_members` auto-deleted; `play_invites.source_lfg_post_id` set to null
- Returns `{expired_deleted_count, closed_deleted_count, skipped_dependency_count}`
- Idempotent

### Expiration column reference

| Column | Type | Written by | Purpose |
|---|---|---|---|
| `expires_at` | `timestamptz` | `create_lfg_post_atomic` | Feed/RLS visibility cutoff |
| `expired_at` | `timestamptz` | `expire_lfg_posts` | Audit timestamp for expiry event |
| `closed_at` | `timestamptz` | `close_owned_lfg_post` | Audit timestamp for manual close |
| `purge_after` | `timestamptz` | `create_lfg_post_atomic`, lifecycle RPCs | Earliest eligible date for hard delete |

### Backfill coverage (Phase 2A)

Existing rows at migration time were backfilled:
- `active/filled`: `expires_at = created_at + 24h`, `purge_after = expires_at + 30d`
- `expired`: `expires_at = created_at + 12h`, `expired_at = created_at + 12h`, `purge_after = expired_at + 30d`
- `closed/archived`: `expires_at = created_at + 24h`, `closed_at = created_at` (approximation), `purge_after = created_at + 30d`

A safety backfill in Phase 2C also fills any remaining null `expires_at` on
active/filled rows before switching the RLS predicate.

---

## 5. Manual Test Checklist

### Expiration

1. Create a post. Confirm `expires_at = created_at + 24h` and `purge_after = expires_at + 30d`.
2. Manually set `expires_at = now() - 1 second` on a test post, call `expire_lfg_posts()`.
   - Confirm `status = 'expired'`, `expired_at` is set.
3. Repeat #2 with a stacks post. Confirm pending `stack_requests` → `declined` and `stack_members` → `removed_at` set.
4. Call `expire_lfg_posts()` again on already-expired posts. Confirm `expired_at` timestamp is not overwritten.

### Dedup check (Bug 1 fix)

5. Create post A. Manually set `expires_at = now() + 12h` (simulating a post between hours 12–24).
6. Attempt to create post B with identical type/mode/role/title. Expect `duplicate_active_post`.
7. Set `expires_at = now() - 1 second` on post A (expired). Attempt post B again. Expect success.

### Play invite source validation (Bug 2 fix)

8. Create post A. Manually set `expires_at = now() - 1 second` (simulate 12–24h old post that feed shows as expired).
9. Attempt `send_play_invite` with `source_lfg_post_id = post A id`. Expect `invalid_source_post`.
10. Restore `expires_at = now() + 12h` (simulates hours 12–24, still in feed). Expect invite to succeed.

### Cleanup with zombie invites (Bug 3 fix)

11. Create a post, close it, manually set `purge_after = now() - 1 second`.
12. Create a play invite against the post with `expires_at = now() - 1 second` (zombie) and `status = 'pending'`.
13. Call `cleanup_expired_lfg_posts()`. Confirm post is deleted (zombie invite does not block).
14. Repeat with a live invite (`expires_at = now() + 1h`). Confirm post is skipped, `skipped_dependency_count = 1`.

### Profile page recent posts (Bug 4 fix)

15. Create a post. Navigate to `/u/[username]`. Confirm post appears in recent posts widget.
16. Manually set `expires_at = now() - 1 second`. Reload profile page. Confirm post disappears from widget.
17. Confirm post is still visible in the LFG feed during the same state (feed also respects `expires_at`).

---

## 6. Full-Repo 12h Reference Scan

Date: 2026-05-15. Searched entire repo for:
`ACTIVE_LFG_POST_WINDOW_HOURS`, `interval '12 hours'`, `12-hour`, `12 hours`,
`created_at >= now() - interval '12 hours'`, `created_at < now() - interval '12 hours'`

### Category 1 — Intentional historical (no action needed)

**Docs:**

| File | Reason |
|---|---|
| `docs/qa/archive/LFG_REFACTOR_POST_TIMING.md` | Archive folder. Describes state before Phase 2. Correct at time of writing. |
| `docs/roadmap/lfg/LFG_EXPIRATION_IMPLEMENTATION_AUDIT.md` | Pre-implementation audit. Code blocks show the "before" state. Plan text is superseded by implementation. |
| `docs/qa/lfg/LFG_SECURITY_AUDIT_REPORT.md` | Historical security audit (2026-04-27). Already annotated "Partially superseded." |
| `docs/qa/lfg/LFG_EXPIRATION_AUDIT_REPORT.md` | Bug write-ups (Bugs 1–4) quoting the old code that was fixed. |
| `docs/performance/PROFILE_PAGE_DTO_AUDIT.md` | Annotated inline: "updated from `created_at >= now() - 12 hours` in Phase 2C." |

**Migrations (superseded function bodies):**

All migrations before `20260515030000` that define functions with `v_active_cutoff :=
now() - interval '12 hours'` or `created_at >= now() - interval '12 hours'` are
superseded by later `CREATE OR REPLACE` definitions. Supabase applies migrations in
filename timestamp order; the last definition wins. None of these bodies execute at
runtime.

Affected: `20260427172000`, `20260427190500`, `20260427201500`, `20260502120000`,
`20260503123000`, `20260503124500`, `20260506113000`, `20260506130000`,
`20260510000000`, `20260510010000`, `20260510020000`, `20260510030000`,
`20260510032000`, `20260513000000`, `20260513020000`, `20260513030000`,
`20260513040000`, `20260514000000`, `20260514040000`, `20260515003000`,
`20260515020000`, and `20260515060000` (the `create_lfg_post_atomic` in
`20260515060000` is superseded by `20260515070000`).

**Phase 2A backfill (`20260515010000` lines 36–38):**

```sql
expires_at  = created_at + interval '12 hours',
expired_at  = created_at + interval '12 hours',
purge_after = created_at + interval '12 hours' + interval '30 days'
```

Applied only to rows with `status = 'expired'`. These rows were already expired under
the original 12h policy, so `created_at + 12h` is the best available approximation of
when they actually expired. Intentional data reconstruction.

**Phase 2F fix migration comments (`20260515060000` lines 12, 26):**

```
-- Old check: v_source_post.created_at < now() - interval '12 hours'
-- Old filter: AND created_at >= now() - interval '12 hours'
```

Migration comments documenting what the old code looked like before the fix. Intentional.

---

### Category 2 — Rate-limit logic

None. The 60-minute creation rate limit (`created_at >= now() - interval '60 minutes'`)
does not use a 12h reference. No matches fell into this category.

---

### Category 3 — Stale production logic

**None found.**

Every 12h reference in the codebase is either superseded, an intentional backfill,
or a doc/comment recording historical state. The canonical production function for
every affected RPC is defined in the highest-timestamp migration and contains no 12h
references.

Canonical function locations (no 12h references):

| Function | Canonical migration |
|---|---|
| `create_lfg_post_atomic` | `20260515070000` — `v_active_cutoff` removed; slot + dedup use `expires_at > now()` |
| `send_play_invite` | `20260515060000` — source post check uses `expires_at <= now()` |
| `get_profile_page_dto` | `20260515060000` — recent posts use `expires_at > now()` |
| `cleanup_expired_lfg_posts` | `20260515060000` — zombie invite guard uses `expires_at > now()` |
| `expire_lfg_posts` / `expire_stack_posts` | `20260515040000` — threshold is `expires_at <= now()` |
| `get_lfg_feed_page_dto` | `20260515030000` — feed uses `expires_at > now()` |
| `get_account_posts_page_dto` | `20260515030000` — display status uses `expires_at <= now()` |
| `lfg_posts_public_active_read` RLS | `20260515030000` — `expires_at > now()` |
