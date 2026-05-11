-- Add stack-specific columns to lfg_posts
alter table public.lfg_posts
  add column if not exists max_group_size smallint,
  add column if not exists description text,
  add column if not exists current_member_count smallint not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lfg_posts_max_group_size_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_max_group_size_check
      check (max_group_size is null or max_group_size between 2 and 6) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lfg_posts_current_member_count_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_current_member_count_check
      check (current_member_count >= 1) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lfg_posts_description_length_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_description_length_check
      check (description is null or char_length(btrim(description)) between 1 and 300) not valid;
  end if;
end;
$$;

-- Stack requests table
create table if not exists public.stack_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lfg_posts (id) on delete cascade,
  requester_profile_id uuid not null references public.profiles (id) on delete cascade,
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  requested_role text not null,
  status text not null default 'pending',
  requester_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz
);

alter table public.stack_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stack_requests_status_check'
      and conrelid = 'public.stack_requests'::regclass
  ) then
    alter table public.stack_requests
      add constraint stack_requests_status_check
      check (status in ('pending', 'accepted', 'declined')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'stack_requests_role_check'
      and conrelid = 'public.stack_requests'::regclass
  ) then
    alter table public.stack_requests
      add constraint stack_requests_role_check
      check (requested_role in ('tank', 'dps', 'support')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'stack_requests_self_request_check'
      and conrelid = 'public.stack_requests'::regclass
  ) then
    alter table public.stack_requests
      add constraint stack_requests_self_request_check
      check (requester_profile_id <> owner_profile_id) not valid;
  end if;
end;
$$;

-- One pending request per (post, requester)
create unique index if not exists stack_requests_post_requester_pending_idx
  on public.stack_requests (post_id, requester_profile_id)
  where status = 'pending';

create index if not exists stack_requests_owner_pending_idx
  on public.stack_requests (owner_profile_id, status, created_at desc);

create index if not exists stack_requests_post_accepted_idx
  on public.stack_requests (post_id, accepted_at desc)
  where status = 'accepted';

create index if not exists stack_requests_requester_idx
  on public.stack_requests (requester_profile_id, status, created_at desc);

-- RLS: block all direct DML; security definer RPCs only
revoke insert, update, delete on table public.stack_requests from anon, authenticated;
revoke select on table public.stack_requests from anon;
grant select on table public.stack_requests to authenticated;

drop policy if exists "stack_requests_participant_read" on public.stack_requests;
create policy "stack_requests_participant_read"
on public.stack_requests
for select
to authenticated
using (
  requester_profile_id = auth.uid()
  or owner_profile_id = auth.uid()
);

-- =========================================================
-- RPC: send_stack_request
-- =========================================================
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

  if v_post.status <> 'active' then
    return jsonb_build_object('created', false, 'error_code', 'post_not_active', 'request_id', null);
  end if;

  if v_post.created_at < now() - interval '24 hours' then
    return jsonb_build_object('created', false, 'error_code', 'post_expired', 'request_id', null);
  end if;

  if v_post.max_group_size is not null
    and v_post.current_member_count >= v_post.max_group_size then
    return jsonb_build_object('created', false, 'error_code', 'stack_full', 'request_id', null);
  end if;

  -- Rate limit: 10 requests per 10 minutes globally
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

  -- Already a member (accepted request)
  if exists (
    select 1 from public.stack_requests
    where post_id = p_post_id
      and requester_profile_id = auth.uid()
      and status = 'accepted'
  ) then
    return jsonb_build_object('created', false, 'error_code', 'already_member', 'request_id', null);
  end if;

  -- Already has pending request
  if exists (
    select 1 from public.stack_requests
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

-- =========================================================
-- RPC: accept_stack_request
-- =========================================================
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

  select id, status, owner_profile_id, post_id, requester_profile_id
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

  select id, max_group_size, current_member_count, status
  into v_post
  from public.lfg_posts
  where id = v_request.post_id
  for update;

  if v_post.status <> 'active' then
    return jsonb_build_object('updated', false, 'error_code', 'post_not_active', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  if v_post.max_group_size is not null
    and v_post.current_member_count >= v_post.max_group_size then
    return jsonb_build_object('updated', false, 'error_code', 'stack_full', 'request_id', v_request.id, 'status', v_request.status);
  end if;

  update public.stack_requests
  set
    status = 'accepted',
    updated_at = now(),
    responded_at = now(),
    accepted_at = now()
  where id = v_request.id;

  -- Increment member count
  update public.lfg_posts
  set current_member_count = current_member_count + 1
  where id = v_request.post_id;

  -- Auto-close if now full
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

-- =========================================================
-- RPC: decline_stack_request
-- =========================================================
create or replace function public.decline_stack_request(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request record;
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

  select id, status, owner_profile_id
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

  update public.stack_requests
  set
    status = 'declined',
    updated_at = now(),
    responded_at = now(),
    declined_at = now()
  where id = v_request.id;

  return jsonb_build_object('updated', true, 'error_code', null, 'request_id', v_request.id, 'status', 'declined');
end;
$$;

revoke all on function public.decline_stack_request(uuid) from public;
grant execute on function public.decline_stack_request(uuid) to authenticated;

-- =========================================================
-- Update create_lfg_post_atomic to support max_group_size + description
-- =========================================================
create or replace function public.create_lfg_post_atomic(
  p_competitive_profile_snapshot jsonb,
  p_game_mode text,
  p_hero_pool_snapshot jsonb,
  p_lfg_type text,
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
security invoker
set search_path = public
as $$
declare
  v_active_cutoff timestamptz := now() - interval '12 hours';
  v_create_cutoff timestamptz := now() - interval '60 minutes';
  v_post_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('created', false, 'error_code', 'unauthenticated', 'post_id', null);
  end if;

  if auth.uid() <> p_profile_id then
    return jsonb_build_object('created', false, 'error_code', 'forbidden', 'post_id', null);
  end if;

  if p_lfg_type = 'stacks' and p_max_group_size is not null
    and p_max_group_size not between 2 and 6 then
    return jsonb_build_object('created', false, 'error_code', 'invalid_group_size', 'post_id', null);
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
      and lower(trim(title)) = lower(trim(p_title))
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
    nullif(btrim(coalesce(p_description, '')), ''),
    p_game_mode,
    p_hero_pool_snapshot,
    p_lfg_type,
    p_max_group_size,
    p_posting_role,
    p_profile_id,
    p_competitive_profile_snapshot ->> 'main_role',
    p_platform,
    p_rank_division,
    p_rank_tier,
    p_region,
    p_timezone,
    p_title
  )
  returning id into v_post_id;

  return jsonb_build_object('created', true, 'error_code', null, 'post_id', v_post_id);
end;
$$;

revoke all on function public.create_lfg_post_atomic(
  jsonb, text, jsonb, text, text, text, uuid, integer, text, text, text, text, integer, text
) from public;

grant execute on function public.create_lfg_post_atomic(
  jsonb, text, jsonb, text, text, text, uuid, integer, text, text, text, text, integer, text
) to authenticated;
