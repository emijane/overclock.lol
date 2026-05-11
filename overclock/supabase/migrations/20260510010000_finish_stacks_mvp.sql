create or replace function public.are_profiles_blocked(
  p_profile_a uuid,
  p_profile_b uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_has_expected_columns boolean := false;
  v_is_blocked boolean := false;
begin
  if p_profile_a is null or p_profile_b is null then
    return false;
  end if;

  if to_regclass('public.profile_blocks') is null then
    return false;
  end if;

  select count(*) = 2
  into v_has_expected_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profile_blocks'
    and column_name in ('blocker_profile_id', 'blocked_profile_id');

  if not v_has_expected_columns then
    return false;
  end if;

  execute
    'select exists (
      select 1
      from public.profile_blocks
      where (blocker_profile_id = $1 and blocked_profile_id = $2)
         or (blocker_profile_id = $2 and blocked_profile_id = $1)
    )'
  into v_is_blocked
  using p_profile_a, p_profile_b;

  return coalesce(v_is_blocked, false);
end;
$$;

revoke all on function public.are_profiles_blocked(uuid, uuid) from public;
grant execute on function public.are_profiles_blocked(uuid, uuid) to authenticated;

drop function if exists public.create_lfg_post_atomic(
  jsonb,
  text,
  jsonb,
  text,
  text,
  text,
  uuid,
  integer,
  text,
  text,
  text,
  text,
  integer,
  text
);

create or replace function public.create_lfg_post_atomic(
  p_competitive_profile_snapshot jsonb,
  p_game_mode text,
  p_hero_pool_snapshot jsonb,
  p_lfg_type text,
  p_looking_for_roles text[],
  p_platform text,
  p_posting_role text,
  p_profile_id uuid,
  p_rank_division integer,
  p_rank_tier text,
  p_region text,
  p_timezone text,
  p_title text,
  p_max_group_size integer default null,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_cutoff timestamptz := now() - interval '12 hours';
  v_create_cutoff timestamptz := now() - interval '60 minutes';
  v_normalized_looking_for_roles text[];
  v_normalized_title text := regexp_replace(trim(coalesce(p_title, '')), '\s+', ' ', 'g');
  v_normalized_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_post_id uuid;
begin
  v_normalized_looking_for_roles := coalesce(
    (
      select array_agg(role order by array_position(array['tank', 'dps', 'support']::text[], role))
      from (
        select distinct role
        from unnest(coalesce(p_looking_for_roles, array[]::text[])) as role
        where role in ('tank', 'dps', 'support')
      ) normalized_roles
    ),
    array['tank', 'dps', 'support']::text[]
  );

  if auth.uid() is null then
    return jsonb_build_object('created', false, 'error_code', 'unauthenticated', 'post_id', null);
  end if;

  if p_profile_id is null or auth.uid() <> p_profile_id then
    return jsonb_build_object('created', false, 'error_code', 'forbidden', 'post_id', null);
  end if;

  if p_lfg_type not in ('duos', 'stacks', 'teams', 'scrims') then
    return jsonb_build_object('created', false, 'error_code', 'invalid_lfg_type', 'post_id', null);
  end if;

  if p_game_mode not in ('ranked', 'quick_play') then
    return jsonb_build_object('created', false, 'error_code', 'invalid_game_mode', 'post_id', null);
  end if;

  if p_posting_role not in ('tank', 'dps', 'support') then
    return jsonb_build_object('created', false, 'error_code', 'invalid_posting_role', 'post_id', null);
  end if;

  if char_length(v_normalized_title) = 0 or char_length(v_normalized_title) > 80 then
    return jsonb_build_object('created', false, 'error_code', 'invalid_title', 'post_id', null);
  end if;

  if p_lfg_type = 'stacks' and p_max_group_size is not null and p_max_group_size not between 2 and 6 then
    return jsonb_build_object('created', false, 'error_code', 'invalid_group_size', 'post_id', null);
  end if;

  if v_normalized_description is not null and char_length(v_normalized_description) > 300 then
    return jsonb_build_object('created', false, 'error_code', 'invalid_description', 'post_id', null);
  end if;

  perform pg_advisory_xact_lock(
    hashtext('lfg_post_create'),
    hashtext(p_profile_id::text || ':' || p_lfg_type)
  );

  if exists (
    select 1
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type = p_lfg_type
      and game_mode = p_game_mode
      and posting_role = p_posting_role
      and lower(regexp_replace(trim(title), '\s+', ' ', 'g')) = lower(v_normalized_title)
      and status = 'active'
      and created_at >= v_active_cutoff
  ) then
    return jsonb_build_object('created', false, 'error_code', 'duplicate_active_post', 'post_id', null);
  end if;

  if (
    select count(*)
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type = p_lfg_type
      and posting_role = p_posting_role
      and status = 'active'
      and created_at >= v_active_cutoff
  ) >= 2 then
    return jsonb_build_object('created', false, 'error_code', 'active_slot_limit', 'post_id', null);
  end if;

  if (
    select count(*)
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type = p_lfg_type
      and created_at >= v_create_cutoff
  ) >= 4 then
    return jsonb_build_object('created', false, 'error_code', 'create_rate_limit', 'post_id', null);
  end if;

  insert into public.lfg_posts (
    competitive_profile_snapshot,
    description,
    game_mode,
    hero_pool_snapshot,
    lfg_type,
    looking_for_roles,
    max_group_size,
    posting_role,
    profile_id,
    snapshot_main_role,
    snapshot_platform,
    snapshot_rank_division,
    snapshot_rank_tier,
    snapshot_region,
    snapshot_timezone,
    title
  )
  values (
    p_competitive_profile_snapshot,
    v_normalized_description,
    p_game_mode,
    p_hero_pool_snapshot,
    p_lfg_type,
    v_normalized_looking_for_roles,
    p_max_group_size,
    p_posting_role,
    p_profile_id,
    p_competitive_profile_snapshot ->> 'main_role',
    p_platform,
    p_rank_division,
    p_rank_tier,
    p_region,
    p_timezone,
    v_normalized_title
  )
  returning id into v_post_id;

  return jsonb_build_object('created', true, 'error_code', null, 'post_id', v_post_id);
end;
$$;

revoke all on function public.create_lfg_post_atomic(
  jsonb,
  text,
  jsonb,
  text,
  text[],
  text,
  text,
  uuid,
  integer,
  text,
  text,
  text,
  text,
  integer,
  text
) from public;

grant execute on function public.create_lfg_post_atomic(
  jsonb,
  text,
  jsonb,
  text,
  text[],
  text,
  text,
  uuid,
  integer,
  text,
  text,
  text,
  text,
  integer,
  text
) to authenticated;

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
    lp.created_at
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

  if v_post.status <> 'active' then
    return jsonb_build_object('created', false, 'error_code', 'post_not_active', 'request_id', null);
  end if;

  if v_post.created_at < now() - interval '24 hours' then
    return jsonb_build_object('created', false, 'error_code', 'post_expired', 'request_id', null);
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
    from public.stack_requests
    where post_id = p_post_id
      and requester_profile_id = auth.uid()
      and status = 'accepted'
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
  v_remaining_slots integer;
  v_next_needed_roles text[];
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

  if v_request.owner_profile_id <> auth.uid() then
    return jsonb_build_object('updated', false, 'error_code', 'forbidden', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if v_request.status <> 'pending' then
    return jsonb_build_object('updated', false, 'error_code', 'invalid_state', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if public.are_profiles_blocked(v_request.owner_profile_id, v_request.requester_profile_id) then
    return jsonb_build_object('updated', false, 'error_code', 'blocked_users', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  select id, max_group_size, current_member_count, status, looking_for_roles
  into v_post
  from public.lfg_posts
  where id = v_request.post_id
  for update;

  if v_post.id is null or v_post.status <> 'active' then
    return jsonb_build_object('updated', false, 'error_code', 'post_not_active', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if v_post.max_group_size is not null and v_post.current_member_count >= v_post.max_group_size then
    return jsonb_build_object('updated', false, 'error_code', 'stack_full', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if exists (
    select 1
    from public.stack_requests
    where post_id = v_request.post_id
      and requester_profile_id = v_request.requester_profile_id
      and status = 'accepted'
      and id <> v_request.id
  ) then
    return jsonb_build_object('updated', false, 'error_code', 'already_member', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  v_needed_roles := coalesce(v_post.looking_for_roles, array['tank', 'dps', 'support']::text[]);

  if not (v_request.requested_role = any(v_needed_roles)) then
    return jsonb_build_object('updated', false, 'error_code', 'role_not_needed', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  update public.stack_requests
  set
    status = 'accepted',
    updated_at = now(),
    responded_at = now(),
    accepted_at = now()
  where id = v_request.id;

  update public.lfg_posts
  set current_member_count = current_member_count + 1
  where id = v_request.post_id;

  if v_post.max_group_size is not null then
    v_remaining_slots := greatest(v_post.max_group_size - (v_post.current_member_count + 1), 0);
  else
    v_remaining_slots := greatest(array_length(v_needed_roles, 1) - 1, 0);
  end if;

  if v_remaining_slots > 0 and coalesce(array_length(v_needed_roles, 1), 0) > v_remaining_slots then
    select coalesce(
      array_agg(role order by array_position(array['tank', 'dps', 'support']::text[], role)),
      array[]::text[]
    )
    into v_next_needed_roles
    from unnest(v_needed_roles) as role
    where role <> v_request.requested_role;

    if coalesce(array_length(v_next_needed_roles, 1), 0) > 0 then
      update public.lfg_posts
      set looking_for_roles = v_next_needed_roles
      where id = v_request.post_id;
    end if;
  end if;

  update public.lfg_posts
  set status = 'closed'
  where id = v_request.post_id
    and max_group_size is not null
    and current_member_count >= max_group_size
    and status = 'active';

  return jsonb_build_object('updated', true, 'error_code', null, 'request_id', v_request.id, 'status', 'accepted');
end;
$$;

revoke all on function public.accept_stack_request(uuid) from public;
grant execute on function public.accept_stack_request(uuid) to authenticated;
