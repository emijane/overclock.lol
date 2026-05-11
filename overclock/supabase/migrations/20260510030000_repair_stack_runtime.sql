-- Repair stack runtime objects after edited historical migrations.
-- Supabase tracks migration filenames, so previously-applied files do not rerun
-- when their contents change later in source control.

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

alter table public.lfg_posts
  alter column current_member_count set default 1;

update public.lfg_posts
set max_group_size = 5
where lfg_type = 'stacks'
  and coalesce(max_group_size, 5) <> 5;

do $$
begin
  alter table public.lfg_posts
    drop constraint if exists lfg_posts_status_check;

  alter table public.lfg_posts
    add constraint lfg_posts_status_check
    check (
      lfg_type in ('duos', 'stacks', 'teams', 'scrims')
      and status in ('active', 'filled', 'closed', 'expired', 'archived')
    ) not valid;
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.stack_members (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lfg_posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  is_owner boolean not null default false,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by_profile_id uuid references public.profiles (id) on delete set null
);

alter table public.stack_members enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stack_members_role_check'
      and conrelid = 'public.stack_members'::regclass
  ) then
    alter table public.stack_members
      add constraint stack_members_role_check
      check (role in ('tank', 'dps', 'support')) not valid;
  end if;
end;
$$;

create unique index if not exists stack_members_active_post_profile_idx
  on public.stack_members (post_id, profile_id)
  where removed_at is null;

create unique index if not exists stack_members_single_owner_idx
  on public.stack_members (post_id)
  where is_owner = true and removed_at is null;

create index if not exists stack_members_profile_active_idx
  on public.stack_members (profile_id, joined_at desc)
  where removed_at is null;

create index if not exists stack_members_post_active_idx
  on public.stack_members (post_id, joined_at asc)
  where removed_at is null;

revoke insert, update, delete on table public.stack_members from anon, authenticated;
grant select on table public.stack_members to anon, authenticated;

drop policy if exists "stack_members_public_read" on public.stack_members;
create policy "stack_members_public_read"
on public.stack_members
for select
to public
using (true);

insert into public.stack_members (post_id, profile_id, role, is_owner, joined_at)
select
  lp.id,
  lp.profile_id,
  lp.posting_role,
  true,
  lp.created_at
from public.lfg_posts lp
where lp.lfg_type = 'stacks'
  and lp.profile_id is not null
  and not exists (
    select 1
    from public.stack_members sm
    where sm.post_id = lp.id
      and sm.profile_id = lp.profile_id
      and sm.removed_at is null
  );

insert into public.stack_members (post_id, profile_id, role, is_owner, joined_at)
select
  sr.post_id,
  sr.requester_profile_id,
  sr.requested_role,
  false,
  coalesce(sr.accepted_at, sr.responded_at, sr.updated_at, sr.created_at)
from public.stack_requests sr
join public.lfg_posts lp on lp.id = sr.post_id
where sr.status = 'accepted'
  and lp.lfg_type = 'stacks'
  and not exists (
    select 1
    from public.stack_members sm
    where sm.post_id = sr.post_id
      and sm.profile_id = sr.requester_profile_id
      and sm.removed_at is null
  );

update public.lfg_posts lp
set current_member_count = counts.member_count
from (
  select post_id, count(*)::smallint as member_count
  from public.stack_members
  where removed_at is null
  group by post_id
) counts
where lp.id = counts.post_id
  and lp.lfg_type = 'stacks';

update public.lfg_posts
set current_member_count = 1
where lfg_type = 'stacks'
  and current_member_count < 1;

update public.lfg_posts
set status = case
  when status in ('closed', 'expired', 'archived') then status
  when current_member_count >= 5 then 'filled'
  else 'active'
end
where lfg_type = 'stacks';

create or replace function public.is_profile_in_active_stack(
  p_profile_id uuid,
  p_exclude_post_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stack_members sm
    join public.lfg_posts lp on lp.id = sm.post_id
    where sm.profile_id = p_profile_id
      and sm.removed_at is null
      and lp.lfg_type = 'stacks'
      and lp.status in ('active', 'filled')
      and (p_exclude_post_id is null or lp.id <> p_exclude_post_id)
  );
$$;

revoke all on function public.is_profile_in_active_stack(uuid, uuid) from public;
grant execute on function public.is_profile_in_active_stack(uuid, uuid) to authenticated;

create or replace function public.expire_stack_posts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expired_post_ids uuid[];
  v_count integer := 0;
begin
  select coalesce(array_agg(id), array[]::uuid[])
  into v_expired_post_ids
  from public.lfg_posts
  where lfg_type = 'stacks'
    and status in ('active', 'filled')
    and created_at < now() - interval '12 hours';

  v_count := coalesce(array_length(v_expired_post_ids, 1), 0);

  if v_count = 0 then
    return jsonb_build_object('updated', true, 'expired_count', 0);
  end if;

  update public.lfg_posts
  set status = 'expired'
  where id = any(v_expired_post_ids);

  update public.stack_requests
  set
    status = 'declined',
    updated_at = now(),
    responded_at = coalesce(responded_at, now()),
    declined_at = coalesce(declined_at, now())
  where post_id = any(v_expired_post_ids)
    and status = 'pending';

  update public.stack_members
  set
    removed_at = now(),
    removed_by_profile_id = coalesce(removed_by_profile_id, profile_id)
  where post_id = any(v_expired_post_ids)
    and removed_at is null;

  return jsonb_build_object('updated', true, 'expired_count', v_count);
end;
$$;

revoke all on function public.expire_stack_posts() from public;
grant execute on function public.expire_stack_posts() to anon, authenticated;

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

  perform pg_advisory_xact_lock(
    hashtext('lfg_post_create'),
    hashtext(p_profile_id::text || ':' || p_lfg_type)
  );

  if p_lfg_type = 'stacks' then
    perform pg_advisory_xact_lock(
      hashtext('stack_member_profile'),
      hashtext(p_profile_id::text)
    );
  end if;

  if p_lfg_type = 'stacks' and public.is_profile_in_active_stack(p_profile_id, null) then
    return jsonb_build_object('created', false, 'error_code', 'already_in_active_stack', 'post_id', null);
  end if;

  if exists (
    select 1
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type = p_lfg_type
      and game_mode = p_game_mode
      and posting_role = p_posting_role
      and lower(regexp_replace(trim(title), '\s+', ' ', 'g')) = lower(v_normalized_title)
      and status in ('active', 'filled')
      and created_at >= v_active_cutoff
  ) then
    return jsonb_build_object('created', false, 'error_code', 'duplicate_active_post', 'post_id', null);
  end if;

  if p_lfg_type <> 'stacks' and (
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
    current_member_count,
    posting_role,
    profile_id,
    snapshot_main_role,
    snapshot_platform,
    snapshot_rank_division,
    snapshot_rank_tier,
    snapshot_region,
    snapshot_timezone,
    title,
    status
  )
  values (
    p_competitive_profile_snapshot,
    null,
    p_game_mode,
    p_hero_pool_snapshot,
    p_lfg_type,
    v_normalized_looking_for_roles,
    case when p_lfg_type = 'stacks' then 5 else p_max_group_size end,
    case when p_lfg_type = 'stacks' then 1 else 1 end,
    p_posting_role,
    p_profile_id,
    p_competitive_profile_snapshot ->> 'main_role',
    p_platform,
    p_rank_division,
    p_rank_tier,
    p_region,
    p_timezone,
    v_normalized_title,
    'active'
  )
  returning id into v_post_id;

  if p_lfg_type = 'stacks' then
    insert into public.stack_members (
      post_id,
      profile_id,
      role,
      is_owner,
      joined_at
    )
    values (
      v_post_id,
      p_profile_id,
      p_posting_role,
      true,
      now()
    );
  end if;

  return jsonb_build_object('created', true, 'error_code', null, 'post_id', v_post_id);
end;
$$;

revoke all on function public.create_lfg_post_atomic(
  jsonb, text, jsonb, text, text[], text, text, uuid, integer, text, text, text, text, integer, text
) from public;
grant execute on function public.create_lfg_post_atomic(
  jsonb, text, jsonb, text, text[], text, text, uuid, integer, text, text, text, text, integer, text
) to authenticated;
