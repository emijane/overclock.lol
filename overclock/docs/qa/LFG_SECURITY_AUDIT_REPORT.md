# LFG Security Audit Report

Date: 2026-04-27

## 1. Files inspected

- `docs/qa/LFG_SECURITY_AUDIT_INSTRUCTION.md`
- `app/lfg/actions.ts`
- `app/account/posts/page.tsx`
- `app/u/[username]/page.tsx`
- `lib/lfg/posts.ts`
- `lib/lfg/lfg-post-policy.ts`
- `lib/lfg/lfg-post-title.ts`
- `lib/profiles/get-current-profile.ts`
- `lib/supabase/server.ts`
- `supabase/migrations/20260427172000_create_lfg_post_atomic.sql`
- `supabase/migrations/20260427190500_normalize_lfg_duplicate_title_check.sql`

## 2. Security gaps found

### Gap A: No source-controlled `lfg_posts` RLS or table policy definition

- Severity: Medium
- Before this pass, the repo had LFG RPC migrations but no checked-in SQL for:
  - `alter table public.lfg_posts enable row level security`
  - public feed read policy
  - owner read policy for account history
  - direct write restrictions
- Risk:
  - reviewers could not verify who was allowed to read, insert, update, or delete `lfg_posts`
  - application code assumed protections existed, but source control could not prove it

### Gap B: Close flow still used direct table update

- Severity: Medium
- Before this pass, post creation used an RPC, but post closing still did:
  - `.from("lfg_posts").update({ status: "closed" })`
- Risk:
  - if an update policy were added broadly, raw table updates could drift from intended business rules
  - write protections were inconsistent across create vs close

### Gap C: Create RPC was `security invoker`

- Severity: Medium
- `create_lfg_post_atomic(...)` was previously `security invoker`
- Risk:
  - if we enabled RLS and allowed direct table inserts, users could bypass rate-limit and duplicate protections with raw inserts
  - if we enabled RLS and did not allow direct inserts, the invoker RPC would fail
- Fix direction:
  - move the function to `security definer`
  - keep direct table insert blocked
  - force application writes through the RPC

### Gap D: No repo-visible supporting indexes or defensive constraints

- Severity: Minor
- Before this pass, the repo had no source-controlled `lfg_posts` indexes for:
  - public active feed reads
  - owner history reads
  - active-slot checks
  - duplicate checks
  - rolling creation-window checks
- There were also no repo-visible constraints for:
  - `status`
  - `lfg_type`
  - `game_mode`
  - `posting_role`
  - basic title length/sanity

### Gap E: Public table reads would expose whatever columns exist on `lfg_posts`

- Severity: Minor
- RLS controls rows, not columns
- The app currently selects only intended feed fields, but a public table `select` policy still exposes any readable `lfg_posts` columns to allowed roles
- Current assessment:
  - the existing row shape appears intentionally feed-facing
  - if private/internal columns are added later, public feed reads should move to a projection view instead of the base table

## 3. Migration files created or updated

### Created

- `supabase/migrations/20260427201500_secure_lfg_posts_rls_and_rpc.sql`

### Runtime code updated

- `lib/lfg/posts.ts`
  - `closeOwnedActiveLFGPost(...)` now calls `rpc("close_owned_lfg_post")`
  - added `normalizeLFGCloseResult(...)`

## 4. Exact SQL added

Full exact SQL is checked in at:

- `supabase/migrations/20260427201500_secure_lfg_posts_rls_and_rpc.sql`

The migration adds the following database-layer protections.

### RLS and direct-write restrictions

```sql
alter table public.lfg_posts enable row level security;

revoke insert, update, delete on table public.lfg_posts from anon, authenticated;
grant select on table public.lfg_posts to anon, authenticated;
```

### Public feed and owner-history read policies

```sql
create policy "lfg_posts_public_active_read"
on public.lfg_posts
for select
to anon, authenticated
using (
  status = 'active'
  and created_at >= now() - interval '12 hours'
);

create policy "lfg_posts_owner_read"
on public.lfg_posts
for select
to authenticated
using (profile_id = auth.uid());
```

### Defensive `NOT VALID` constraints for new writes

```sql
check (
  status is not null
  and status in ('active', 'closed', 'archived')
)

check (
  lfg_type is not null
  and lfg_type in ('duos', 'stacks', 'teams', 'scrims')
)

check (
  game_mode is not null
  and game_mode in ('ranked', 'quick_play')
)

check (
  posting_role is not null
  and posting_role in ('tank', 'dps', 'support')
)

check (
  title is not null
  and char_length(btrim(title)) between 1 and 80
)
```

### Supporting indexes

```sql
create index if not exists lfg_posts_public_active_feed_idx
  on public.lfg_posts (lfg_type, created_at desc)
  where status = 'active';

create index if not exists lfg_posts_owner_history_idx
  on public.lfg_posts (profile_id, created_at desc);

create index if not exists lfg_posts_owner_active_role_idx
  on public.lfg_posts (profile_id, lfg_type, posting_role, created_at desc)
  where status = 'active';

create index if not exists lfg_posts_owner_active_duplicate_idx
  on public.lfg_posts (
    profile_id,
    lfg_type,
    game_mode,
    posting_role,
    created_at desc
  )
  where status = 'active';

create index if not exists lfg_posts_owner_creation_window_idx
  on public.lfg_posts (profile_id, lfg_type, created_at desc);
```

### RPC-only create enforcement

```sql
create or replace function public.create_lfg_post_atomic(...)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
```

Key behavior inside the function:

- rejects unauthenticated callers
- rejects `p_profile_id <> auth.uid()`
- validates `lfg_type`, `game_mode`, `posting_role`, and normalized title length
- normalizes title with trim + whitespace collapse before insert
- takes an advisory lock per `profile_id + section`
- blocks:
  - duplicate active post in the same section/role/mode/title
  - more than `2` active posts per role per section in the 12-hour active window
  - more than `4` post creations per section in the rolling 60-minute window
- inserts only after those checks pass

### RPC-only close enforcement

```sql
create or replace function public.close_owned_lfg_post(
  p_post_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
```

Key behavior inside the function:

- rejects unauthenticated callers
- updates only rows where:
  - `id = p_post_id`
  - `profile_id = auth.uid()`
  - `status = 'active'`
- changes status to `closed`
- returns a JSON result containing:
  - `updated`
  - `error_code`
  - `lfg_type`

## 5. Anti-abuse assumption validation

### `2` active posts per role per section

- Enforced in `create_lfg_post_atomic(...)`
- Query scope:
  - `profile_id`
  - `lfg_type`
  - `posting_role`
  - `status = 'active'`
  - `created_at >= now() - interval '12 hours'`

### `4` creations per section per rolling `60` minutes

- Enforced in `create_lfg_post_atomic(...)`
- Query scope:
  - `profile_id`
  - `lfg_type`
  - `created_at >= now() - interval '60 minutes'`
- No status filter is used, so closing a post does not remove it from creation history

### Closed/expired posts still count toward creation history

- Yes, under the current model
- The creation-rate check is status-agnostic
- Expired posts are older than the active 12-hour window, but the creation window is only 60 minutes, so "expired but still inside the create window" is not a real runtime state today

### Removed posts

- Current repo/runtime does not have a separate `removed` status for `lfg_posts`
- The new constraint explicitly allows:
  - `active`
  - `closed`
  - `archived`
- If the product later adds a true `removed` status, this migration will need a follow-up constraint and RPC update

### Closing a post frees active slot but not creation history

- Yes
- `close_owned_lfg_post(...)` changes `status` from `active` to `closed`
- Active-slot checks count only `status = 'active'`
- Creation-rate checks do not filter on status

## 6. Risks before applying

### Risk A: `NOT VALID` constraints do not clean up old bad rows

- The migration adds constraints as `NOT VALID`
- That means:
  - new writes are checked
  - existing legacy rows are not fully validated yet
- This is intentional to reduce migration failure risk
- Recommended follow-up:
  - inspect production data
  - run `validate constraint` later once old rows are confirmed clean

### Risk B: Public read policy is table-based, not view-based

- Public readers can select rows that satisfy the policy from the base table
- If new internal-only columns are added later, public feed access should move to a projection view

### Risk C: `removed` is not part of the current status model

- If moderation/product work introduces `removed`, this migration will need a follow-up update
- Right now the policy and constraints reflect the actual repo-visible runtime states only

### Risk D: Migration must be pushed before the app relies on RPC-only close semantics

- After this code change, closing a post depends on `close_owned_lfg_post(uuid)` existing in the database
- Push the migration before shipping the updated app code

## 7. Manual test steps after migration

### Policy and ownership checks

1. As `anon`, try raw `insert`, `update`, and `delete` on `public.lfg_posts`.
   - Expect all to fail.
2. As `authenticated`, try raw `insert` into `public.lfg_posts`.
   - Expect failure because direct inserts are no longer granted/policy-backed.
3. As `authenticated`, try raw `update` on `public.lfg_posts`.
   - Expect failure because direct updates are no longer granted/policy-backed.
4. As `authenticated`, try raw `delete` on `public.lfg_posts`.
   - Expect failure.
5. As `authenticated`, try `select` for your own closed/expired posts.
   - Expect success.
6. As `anon` or another user, try reading someone else's non-active historical posts directly.
   - Expect those rows to be hidden.

### RPC create checks

1. Call `create_lfg_post_atomic(...)` with `p_profile_id = auth.uid()`.
   - Expect success when under limits.
2. Call it with another user's `profile_id`.
   - Expect `forbidden`.
3. Create `2` active posts for the same role/section.
   - Expect success.
4. Attempt a `3rd` active post for the same role/section in the 12-hour window.
   - Expect `active_slot_limit`.
5. Create `4` posts in one section within 60 minutes.
   - Expect success on the 4th, `create_rate_limit` on the 5th.
6. Close one of those posts and try again before the oldest create timestamp ages out.
   - Expect the active slot to free up, but the create rate to still block if already at `4`.
7. Attempt duplicates that only vary by case, trailing spaces, or repeated spaces.
   - Expect `duplicate_active_post`.

### RPC close checks

1. Call `close_owned_lfg_post(...)` on your own active post.
   - Expect `updated = true`.
2. Call it again on the same post.
   - Expect `updated = false`.
3. Call it on another user's active post.
   - Expect `updated = false`.
4. Confirm raw table updates are still blocked even though the RPC succeeds.

## 8. Summary

- `lfg_posts` is now source-controlled at the database-security layer in repo code.
- Reads are explicit:
  - public gets active recent feed rows
  - owners get their own history
- Writes are RPC-only:
  - create goes through `create_lfg_post_atomic(...)`
  - close goes through `close_owned_lfg_post(...)`
- Direct raw table writes are blocked for `anon` and `authenticated`.
- Supporting indexes and defensive constraints are now reviewable in source control.
# Historical Snapshot

This report reflects a point-in-time security audit and may not describe the
current codebase exactly line-for-line after later refactors.
