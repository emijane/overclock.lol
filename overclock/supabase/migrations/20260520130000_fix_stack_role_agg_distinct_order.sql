-- fix: leave_stack and remove_stack_member used array_agg(distinct ... order by ...) which
-- postgres rejects (42P10) because the ORDER BY expression is not in the aggregate argument.
-- corrected to the subquery pattern already used in create_lfg_post_atomic: SELECT DISTINCT
-- in an inner query, then array_agg(role order by ...) without DISTINCT on the outside.

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

  select id, status, looking_for_roles, current_member_count
  into v_post
  from public.lfg_posts
  where id = p_post_id
  for update;

  if v_post.id is null or v_post.status not in ('active', 'filled') then
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

  select id, status, looking_for_roles
  into v_post
  from public.lfg_posts
  where id = p_post_id
  for update;

  if v_post.id is null or v_post.status not in ('active', 'filled') then
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
