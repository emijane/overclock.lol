-- Restore expires_at expiration guards in leave_stack and remove_stack_member.
--
-- 20260518120000 added expires_at checks to both functions so that expired-but-
-- not-closed stack posts could not be mutated by users.
-- 20260520130000 rewrote both functions to fix the array_agg(distinct ... order by ...)
-- error (PG 42P10) but accidentally dropped two things in each function:
--   1. expires_at from the post SELECT column list.
--   2. The or (v_post.expires_at is not null and v_post.expires_at <= now()) branch
--      from the post-state guard.
-- The guard was therefore testing an always-NULL value, making it a no-op for
-- expiration. Expired posts could still be left or have members removed.
--
-- This migration restores both functions using create or replace function (idempotent):
--   - Keeps perform public.expire_stack_posts() from 20260520130000.
--   - Keeps the subquery-based array_agg fix from 20260520130000.
--   - Restores expires_at in the post SELECT and the full three-part guard in each.

create or replace function public.leave_stack(
  p_post_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member record;
  v_post record;
  v_next_roles text[];
begin
  perform public.expire_stack_posts();

  if auth.uid() is null then
    return jsonb_build_object('updated', false, 'error_code', 'unauthenticated', 'post_id', null, 'member_profile_id', null);
  end if;

  select sm.profile_id, sm.role, sm.is_owner
  into v_member
  from public.stack_members sm
  where sm.post_id = p_post_id
    and sm.profile_id = auth.uid()
    and sm.removed_at is null
  for update;

  if v_member.profile_id is null then
    return jsonb_build_object('updated', false, 'error_code', 'invalid_member', 'post_id', p_post_id, 'member_profile_id', auth.uid());
  end if;

  if v_member.is_owner then
    return jsonb_build_object('updated', false, 'error_code', 'forbidden', 'post_id', p_post_id, 'member_profile_id', auth.uid());
  end if;

  select id, status, looking_for_roles, current_member_count, expires_at
  into v_post
  from public.lfg_posts
  where id = p_post_id
  for update;

  if v_post.id is null
     or v_post.status not in ('active', 'filled')
     or (v_post.expires_at is not null and v_post.expires_at <= now()) then
    return jsonb_build_object('updated', false, 'error_code', 'post_not_active', 'post_id', p_post_id, 'member_profile_id', auth.uid());
  end if;

  update public.stack_members
  set
    removed_at = now(),
    removed_by_profile_id = auth.uid()
  where post_id = p_post_id
    and profile_id = auth.uid()
    and removed_at is null;

  select coalesce(
    array_agg(role order by array_position(array['tank', 'dps', 'support']::text[], role)),
    array[]::text[]
  )
  into v_next_roles
  from (
    select distinct role
    from unnest(array_append(coalesce(v_post.looking_for_roles, array[]::text[]), v_member.role)) as role
    where role in ('tank', 'dps', 'support')
  ) unique_roles;

  update public.lfg_posts
  set
    current_member_count = greatest(current_member_count - 1, 1),
    looking_for_roles = v_next_roles,
    status = 'active'
  where id = p_post_id;

  return jsonb_build_object('updated', true, 'error_code', null, 'post_id', p_post_id, 'member_profile_id', auth.uid());
end;
$$;

revoke all on function public.leave_stack(uuid) from public;
grant execute on function public.leave_stack(uuid) to authenticated;

create or replace function public.remove_stack_member(
  p_post_id uuid,
  p_member_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner record;
  v_member record;
  v_post record;
  v_next_roles text[];
begin
  perform public.expire_stack_posts();

  if auth.uid() is null then
    return jsonb_build_object('updated', false, 'error_code', 'unauthenticated', 'post_id', p_post_id, 'member_profile_id', p_member_profile_id);
  end if;

  select profile_id
  into v_owner
  from public.stack_members
  where post_id = p_post_id
    and profile_id = auth.uid()
    and is_owner = true
    and removed_at is null
  for update;

  if v_owner.profile_id is null then
    return jsonb_build_object('updated', false, 'error_code', 'forbidden', 'post_id', p_post_id, 'member_profile_id', p_member_profile_id);
  end if;

  select profile_id, role, is_owner
  into v_member
  from public.stack_members
  where post_id = p_post_id
    and profile_id = p_member_profile_id
    and removed_at is null
  for update;

  if v_member.profile_id is null or v_member.is_owner then
    return jsonb_build_object('updated', false, 'error_code', 'invalid_member', 'post_id', p_post_id, 'member_profile_id', p_member_profile_id);
  end if;

  select id, status, looking_for_roles, expires_at
  into v_post
  from public.lfg_posts
  where id = p_post_id
  for update;

  if v_post.id is null
     or v_post.status not in ('active', 'filled')
     or (v_post.expires_at is not null and v_post.expires_at <= now()) then
    return jsonb_build_object('updated', false, 'error_code', 'post_not_active', 'post_id', p_post_id, 'member_profile_id', p_member_profile_id);
  end if;

  update public.stack_members
  set
    removed_at = now(),
    removed_by_profile_id = auth.uid()
  where post_id = p_post_id
    and profile_id = p_member_profile_id
    and removed_at is null;

  select coalesce(
    array_agg(role order by array_position(array['tank', 'dps', 'support']::text[], role)),
    array[]::text[]
  )
  into v_next_roles
  from (
    select distinct role
    from unnest(array_append(coalesce(v_post.looking_for_roles, array[]::text[]), v_member.role)) as role
    where role in ('tank', 'dps', 'support')
  ) unique_roles;

  update public.lfg_posts
  set
    current_member_count = greatest(current_member_count - 1, 1),
    looking_for_roles = v_next_roles,
    status = 'active'
  where id = p_post_id;

  return jsonb_build_object('updated', true, 'error_code', null, 'post_id', p_post_id, 'member_profile_id', p_member_profile_id);
end;
$$;

revoke all on function public.remove_stack_member(uuid, uuid) from public;
grant execute on function public.remove_stack_member(uuid, uuid) to authenticated;
