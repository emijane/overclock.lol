-- Phase 2E: Hard-delete expired and closed LFG posts after the retention window.
-- Requires: 20260515010000_add_lfg_post_expiration_fields.sql (purge_after column)
--           20260515040000_add_expire_lfg_posts_service_fn.sql (expire_lfg_posts)
--
-- What this adds:
--   cleanup_expired_lfg_posts() — service_role-only function that hard-deletes
--   posts eligible for purge and returns per-status counts.
--
-- Deletion criteria (all three must hold):
--   1. status IN ('expired', 'closed')
--   2. purge_after IS NOT NULL
--   3. purge_after <= now()
--
-- Dependency skip rules (any one present blocks deletion):
--   - pending stack_requests referencing the post
--   - pending play_invites where source_lfg_post_id = post.id
--   No check for profile_connections (no FK to lfg_posts).
--   No check for moderation/reports (table does not exist yet).
--
-- FK cascade notes (why no manual child-row cleanup is needed):
--   stack_requests.post_id       ON DELETE CASCADE  → auto-removed on post delete
--   stack_members.post_id        ON DELETE CASCADE  → auto-removed on post delete
--   play_invites.source_lfg_post_id  ON DELETE SET NULL → set to null on post delete
--
-- Idempotency: eligible posts are deleted on first run; subsequent runs find
-- nothing new to delete and return zero counts.
--
-- Security: service_role only. anon and authenticated cannot call this function.
--
-- Return shape:
--   { expired_deleted_count: int, closed_deleted_count: int, skipped_dependency_count: int }

create or replace function public.cleanup_expired_lfg_posts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_eligible_ids    uuid[];
  v_skipped_ids     uuid[];
  v_deletable_ids   uuid[];
  v_expired_deleted integer := 0;
  v_closed_deleted  integer := 0;
  v_skipped         integer := 0;
begin
  -- 1. Collect all posts that have passed their retention window.
  select coalesce(array_agg(id), array[]::uuid[])
  into v_eligible_ids
  from public.lfg_posts
  where status in ('expired', 'closed')
    and purge_after is not null
    and purge_after <= now();

  if coalesce(array_length(v_eligible_ids, 1), 0) = 0 then
    return jsonb_build_object(
      'expired_deleted_count',   0,
      'closed_deleted_count',    0,
      'skipped_dependency_count', 0
    );
  end if;

  -- 2. Identify posts with active dependencies that must be skipped.
  --    Pending stack_requests: would lose user-visible data on delete (CASCADE removes them).
  --    Pending play_invites:   source_lfg_post_id becomes null on delete (SET NULL), but a
  --                            user still holds a pending invite — skip until it resolves.
  select coalesce(array_agg(distinct dep_post_id), array[]::uuid[])
  into v_skipped_ids
  from (
    select post_id as dep_post_id
    from public.stack_requests
    where post_id = any(v_eligible_ids)
      and status  = 'pending'

    union all

    select source_lfg_post_id as dep_post_id
    from public.play_invites
    where source_lfg_post_id = any(v_eligible_ids)
      and status              = 'pending'
  ) deps;

  v_skipped := coalesce(array_length(v_skipped_ids, 1), 0);

  -- 3. Deletable = eligible minus skipped.
  --    When v_skipped_ids is empty, NOT (id = any('{}'::uuid[])) is true for all rows,
  --    so all eligible posts are included.
  select coalesce(array_agg(id), array[]::uuid[])
  into v_deletable_ids
  from public.lfg_posts
  where id = any(v_eligible_ids)
    and not (id = any(v_skipped_ids));

  if coalesce(array_length(v_deletable_ids, 1), 0) = 0 then
    return jsonb_build_object(
      'expired_deleted_count',   0,
      'closed_deleted_count',    0,
      'skipped_dependency_count', v_skipped
    );
  end if;

  -- 4. Count by status before deleting (needed for the return value).
  select
    coalesce(count(*) filter (where status = 'expired'), 0),
    coalesce(count(*) filter (where status = 'closed'),  0)
  into v_expired_deleted, v_closed_deleted
  from public.lfg_posts
  where id = any(v_deletable_ids);

  -- 5. Hard delete. Cascades remove stack_requests and stack_members automatically.
  --    play_invites.source_lfg_post_id is set to null by the FK ON DELETE SET NULL.
  delete from public.lfg_posts
  where id = any(v_deletable_ids);

  return jsonb_build_object(
    'expired_deleted_count',   v_expired_deleted,
    'closed_deleted_count',    v_closed_deleted,
    'skipped_dependency_count', v_skipped
  );
end;
$$;

revoke all     on function public.cleanup_expired_lfg_posts() from public;
revoke execute on function public.cleanup_expired_lfg_posts() from anon, authenticated;
grant  execute on function public.cleanup_expired_lfg_posts() to service_role;
