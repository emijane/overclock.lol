-- Harden LFG expiration RPC access.
--
-- Goals:
--   1. Global expiration and cleanup stay service-only.
--   2. User-triggered RPCs do not mutate unrelated global post state as a side effect.
--   3. Stack/LFG actions treat expired posts as inactive via expires_at checks.

-- Keep the public compatibility wrapper internal-only.
revoke all on function public.expire_stack_posts() from public;
revoke execute on function public.expire_stack_posts() from anon;
revoke execute on function public.expire_stack_posts() from authenticated;
revoke execute on function public.expire_stack_posts() from service_role;

-- Canonical global expiration entrypoint remains service-only.
revoke all on function public.expire_lfg_posts() from public;
revoke execute on function public.expire_lfg_posts() from anon;
revoke execute on function public.expire_lfg_posts() from authenticated;
grant execute on function public.expire_lfg_posts() to service_role;

-- Hard cleanup remains service-only.
revoke all on function public.cleanup_expired_lfg_posts() from public;
revoke execute on function public.cleanup_expired_lfg_posts() from anon;
revoke execute on function public.cleanup_expired_lfg_posts() from authenticated;
grant execute on function public.cleanup_expired_lfg_posts() to service_role;

create or replace function public.send_stack_request(
  p_post_id uuid,
  p_requested_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post record;
  v_requester record;
  v_request_id uuid;
  v_needed_roles text[];
begin
  if auth.uid() is null then
    return jsonb_build_object('created', false, 'error_code', 'unauthenticated', 'request_id', null);
  end if;

  if p_post_id is null then
    return jsonb_build_object('created', false, 'error_code', 'invalid_post', 'request_id', null);
  end if;

  if p_requested_role not in ('tank', 'dps', 'support') then
    return jsonb_build_object('created', false, 'error_code', 'invalid_role', 'request_id', null);
  end if;

  select
    lp.id,
    lp.profile_id,
    lp.status,
    lp.lfg_type,
    lp.max_group_size,
    lp.current_member_count,
    lp.looking_for_roles,
    lp.expires_at
  into v_post
  from public.lfg_posts lp
  where lp.id = p_post_id;

  if v_post.id is null then
    return jsonb_build_object('created', false, 'error_code', 'post_not_found', 'request_id', null);
  end if;

  if v_post.lfg_type <> 'stacks' then
    return jsonb_build_object('created', false, 'error_code', 'invalid_post_type', 'request_id', null);
  end if;

  if v_post.profile_id = auth.uid() then
    return jsonb_build_object('created', false, 'error_code', 'own_post', 'request_id', null);
  end if;

  if public.are_profiles_blocked(v_post.profile_id, auth.uid()) then
    return jsonb_build_object('created', false, 'error_code', 'blocked_users', 'request_id', null);
  end if;

  if v_post.status <> 'active'
     or (v_post.expires_at is not null and v_post.expires_at <= now()) then
    return jsonb_build_object('created', false, 'error_code', 'post_not_active', 'request_id', null);
  end if;

  if public.is_profile_in_active_stack(auth.uid(), p_post_id) then
    return jsonb_build_object('created', false, 'error_code', 'already_in_active_stack', 'request_id', null);
  end if;

  if v_post.max_group_size is not null and v_post.current_member_count >= v_post.max_group_size then
    return jsonb_build_object('created', false, 'error_code', 'stack_full', 'request_id', null);
  end if;

  v_needed_roles := coalesce(v_post.looking_for_roles, array['tank', 'dps', 'support']::text[]);

  if not (p_requested_role = any(v_needed_roles)) then
    return jsonb_build_object('created', false, 'error_code', 'role_not_needed', 'request_id', null);
  end if;

  if (
    select count(*)
    from public.stack_requests
    where requester_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 10 then
    return jsonb_build_object('created', false, 'error_code', 'rate_limited', 'request_id', null);
  end if;

  perform pg_advisory_xact_lock(
    hashtext('stack_request_send'),
    hashtext(auth.uid()::text || ':' || p_post_id::text)
  );

  if exists (
    select 1
    from public.stack_members
    where post_id = p_post_id
      and profile_id = auth.uid()
      and removed_at is null
  ) then
    return jsonb_build_object('created', false, 'error_code', 'already_member', 'request_id', null);
  end if;

  if exists (
    select 1
    from public.stack_requests
    where post_id = p_post_id
      and requester_profile_id = auth.uid()
      and status = 'pending'
  ) then
    return jsonb_build_object('created', false, 'error_code', 'duplicate_pending_request', 'request_id', null);
  end if;

  select
    p.id,
    p.username,
    p.display_name,
    p.discord_avatar_url,
    p.current_rank_tier,
    p.current_rank_division,
    p.region,
    cp.main_role
  into v_requester
  from public.profiles p
  left join public.competitive_profiles cp on cp.profile_id = p.id
  where p.id = auth.uid();

  if v_requester.id is null then
    return jsonb_build_object('created', false, 'error_code', 'requester_not_found', 'request_id', null);
  end if;

  insert into public.stack_requests (
    post_id,
    requester_profile_id,
    owner_profile_id,
    requested_role,
    status,
    requester_snapshot,
    updated_at
  )
  values (
    p_post_id,
    auth.uid(),
    v_post.profile_id,
    p_requested_role,
    'pending',
    jsonb_build_object(
      'avatar_url', v_requester.discord_avatar_url,
      'display_name', v_requester.display_name,
      'main_role', v_requester.main_role,
      'rank_division', v_requester.current_rank_division,
      'rank_tier', v_requester.current_rank_tier,
      'region', v_requester.region,
      'username', v_requester.username
    ),
    now()
  )
  returning id into v_request_id;

  return jsonb_build_object('created', true, 'error_code', null, 'request_id', v_request_id);
end;
$$;

revoke all on function public.send_stack_request(uuid, text) from public;
grant execute on function public.send_stack_request(uuid, text) to authenticated;

create or replace function public.accept_stack_request(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request record;
  v_post record;
  v_needed_roles text[];
  v_next_roles text[];
begin
  if auth.uid() is null then
    return jsonb_build_object('updated', false, 'error_code', 'unauthenticated', 'request_id', null, 'status', null);
  end if;

  if p_request_id is null then
    return jsonb_build_object('updated', false, 'error_code', 'invalid_request', 'request_id', null, 'status', null);
  end if;

  perform pg_advisory_xact_lock(
    hashtext('stack_request_transition'),
    hashtext(p_request_id::text)
  );

  select id, status, owner_profile_id, post_id, requester_profile_id, requested_role
  into v_request
  from public.stack_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    return jsonb_build_object('updated', false, 'error_code', 'request_not_found', 'request_id', null, 'status', null);
  end if;

  perform pg_advisory_xact_lock(
    hashtext('stack_member_profile'),
    hashtext(v_request.requester_profile_id::text)
  );

  if v_request.owner_profile_id <> auth.uid() then
    return jsonb_build_object('updated', false, 'error_code', 'forbidden', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if v_request.status <> 'pending' then
    return jsonb_build_object('updated', false, 'error_code', 'invalid_state', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if public.are_profiles_blocked(v_request.owner_profile_id, v_request.requester_profile_id) then
    return jsonb_build_object('updated', false, 'error_code', 'blocked_users', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if public.is_profile_in_active_stack(v_request.requester_profile_id, v_request.post_id) then
    return jsonb_build_object('updated', false, 'error_code', 'already_in_active_stack', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  select id, max_group_size, current_member_count, status, looking_for_roles, expires_at
  into v_post
  from public.lfg_posts
  where id = v_request.post_id
  for update;

  if v_post.id is null
     or v_post.status <> 'active'
     or (v_post.expires_at is not null and v_post.expires_at <= now()) then
    return jsonb_build_object('updated', false, 'error_code', 'post_not_active', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if v_post.current_member_count >= 5 then
    return jsonb_build_object('updated', false, 'error_code', 'stack_full', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if exists (
    select 1
    from public.stack_members
    where post_id = v_request.post_id
      and profile_id = v_request.requester_profile_id
      and removed_at is null
  ) then
    return jsonb_build_object('updated', false, 'error_code', 'already_member', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  v_needed_roles := coalesce(v_post.looking_for_roles, array['tank', 'dps', 'support']::text[]);

  if not (v_request.requested_role = any(v_needed_roles)) then
    return jsonb_build_object('updated', false, 'error_code', 'role_not_needed', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  insert into public.stack_members (
    post_id,
    profile_id,
    role,
    is_owner,
    joined_at
  )
  values (
    v_request.post_id,
    v_request.requester_profile_id,
    v_request.requested_role,
    false,
    now()
  );

  update public.stack_requests
  set
    status = 'accepted',
    updated_at = now(),
    responded_at = now(),
    accepted_at = now()
  where id = v_request.id;

  select coalesce(
    array_agg(role order by array_position(array['tank', 'dps', 'support']::text[], role)),
    array[]::text[]
  )
  into v_next_roles
  from unnest(v_needed_roles) as role
  where role <> v_request.requested_role;

  update public.lfg_posts
  set
    current_member_count = current_member_count + 1,
    looking_for_roles = v_next_roles,
    status = case
      when current_member_count + 1 >= 5 then 'filled'
      else 'active'
    end
  where id = v_request.post_id;

  if (select status from public.lfg_posts where id = v_request.post_id) = 'filled' then
    update public.stack_requests
    set
      status = 'declined',
      updated_at = now(),
      responded_at = coalesce(responded_at, now()),
      declined_at = coalesce(declined_at, now())
    where post_id = v_request.post_id
      and status = 'pending';
  end if;

  return jsonb_build_object('updated', true, 'error_code', null, 'request_id', v_request.id, 'status', 'accepted');
end;
$$;

revoke all on function public.accept_stack_request(uuid) from public;
grant execute on function public.accept_stack_request(uuid) to authenticated;

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
    array_agg(distinct role order by array_position(array['tank', 'dps', 'support']::text[], role)),
    array[]::text[]
  )
  into v_next_roles
  from unnest(array_append(coalesce(v_post.looking_for_roles, array[]::text[]), v_member.role)) as role
  where role in ('tank', 'dps', 'support');

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
    array_agg(distinct role order by array_position(array['tank', 'dps', 'support']::text[], role)),
    array[]::text[]
  )
  into v_next_roles
  from unnest(array_append(coalesce(v_post.looking_for_roles, array[]::text[]), v_member.role)) as role
  where role in ('tank', 'dps', 'support');

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

create or replace function public.close_owned_lfg_post(
  p_post_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post record;
begin
  if auth.uid() is null then
    return jsonb_build_object('updated', false, 'error_code', 'unauthenticated', 'lfg_type', null);
  end if;

  select id, lfg_type, profile_id, status, expires_at
  into v_post
  from public.lfg_posts
  where id = p_post_id
  for update;

  if v_post.id is null then
    return jsonb_build_object('updated', false, 'error_code', 'not_found', 'lfg_type', null);
  end if;

  if v_post.profile_id <> auth.uid() then
    return jsonb_build_object('updated', false, 'error_code', 'forbidden', 'lfg_type', v_post.lfg_type);
  end if;

  if v_post.status not in ('active', 'filled')
     or (v_post.expires_at is not null and v_post.expires_at <= now()) then
    return jsonb_build_object('updated', false, 'error_code', 'not_active', 'lfg_type', v_post.lfg_type);
  end if;

  update public.lfg_posts
  set
    status = 'closed',
    closed_at = now(),
    purge_after = now() + interval '30 days'
  where id = p_post_id;

  if v_post.lfg_type = 'stacks' then
    update public.stack_requests
    set
      status = 'declined',
      updated_at = now(),
      responded_at = coalesce(responded_at, now()),
      declined_at = coalesce(declined_at, now())
    where post_id = p_post_id
      and status = 'pending';

    update public.stack_members
    set
      removed_at = now(),
      removed_by_profile_id = auth.uid()
    where post_id = p_post_id
      and removed_at is null;
  end if;

  return jsonb_build_object('updated', true, 'error_code', null, 'lfg_type', v_post.lfg_type);
end;
$$;

revoke all on function public.close_owned_lfg_post(uuid) from public;
grant execute on function public.close_owned_lfg_post(uuid) to authenticated;
