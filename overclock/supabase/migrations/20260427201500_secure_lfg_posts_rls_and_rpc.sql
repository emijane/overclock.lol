alter table public.lfg_posts enable row level security;

revoke insert, update, delete on table public.lfg_posts from anon, authenticated;
grant select on table public.lfg_posts to anon, authenticated;

drop policy if exists "lfg_posts_public_active_read" on public.lfg_posts;
create policy "lfg_posts_public_active_read"
on public.lfg_posts
for select
to anon, authenticated
using (
  status = 'active'
  and created_at >= now() - interval '12 hours'
);

drop policy if exists "lfg_posts_owner_read" on public.lfg_posts;
create policy "lfg_posts_owner_read"
on public.lfg_posts
for select
to authenticated
using (profile_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lfg_posts_status_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_status_check
      check (
        status is not null
        and status in ('active', 'closed', 'archived')
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lfg_posts_lfg_type_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_lfg_type_check
      check (
        lfg_type is not null
        and lfg_type in ('duos', 'stacks', 'teams', 'scrims')
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lfg_posts_game_mode_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_game_mode_check
      check (
        game_mode is not null
        and game_mode in ('ranked', 'quick_play')
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lfg_posts_posting_role_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_posting_role_check
      check (
        posting_role is not null
        and posting_role in ('tank', 'dps', 'support')
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lfg_posts_title_length_check'
      and conrelid = 'public.lfg_posts'::regclass
  ) then
    alter table public.lfg_posts
      add constraint lfg_posts_title_length_check
      check (
        title is not null
        and char_length(btrim(title)) between 1 and 80
      ) not valid;
  end if;
end;
$$;

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
  p_title text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_cutoff timestamptz := now() - interval '12 hours';
  v_create_cutoff timestamptz := now() - interval '60 minutes';
  v_normalized_title text := regexp_replace(trim(coalesce(p_title, '')), '\s+', ' ', 'g');
  v_post_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'unauthenticated',
      'post_id', null
    );
  end if;

  if p_profile_id is null or auth.uid() <> p_profile_id then
    return jsonb_build_object(
      'created', false,
      'error_code', 'forbidden',
      'post_id', null
    );
  end if;

  if p_lfg_type not in ('duos', 'stacks', 'teams', 'scrims') then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_lfg_type',
      'post_id', null
    );
  end if;

  if p_game_mode not in ('ranked', 'quick_play') then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_game_mode',
      'post_id', null
    );
  end if;

  if p_posting_role not in ('tank', 'dps', 'support') then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_posting_role',
      'post_id', null
    );
  end if;

  if char_length(v_normalized_title) = 0 or char_length(v_normalized_title) > 80 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_title',
      'post_id', null
    );
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
    return jsonb_build_object(
      'created', false,
      'error_code', 'duplicate_active_post',
      'post_id', null
    );
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
    return jsonb_build_object(
      'created', false,
      'error_code', 'active_slot_limit',
      'post_id', null
    );
  end if;

  if (
    select count(*)
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type = p_lfg_type
      and created_at >= v_create_cutoff
  ) >= 4 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'create_rate_limit',
      'post_id', null
    );
  end if;

  insert into public.lfg_posts (
    competitive_profile_snapshot,
    game_mode,
    hero_pool_snapshot,
    lfg_type,
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
    p_game_mode,
    p_hero_pool_snapshot,
    p_lfg_type,
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

  return jsonb_build_object(
    'created', true,
    'error_code', null,
    'post_id', v_post_id
  );
end;
$$;

revoke all on function public.create_lfg_post_atomic(
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
  text
) from public;

grant execute on function public.create_lfg_post_atomic(
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
  text
) to authenticated;

create or replace function public.close_owned_lfg_post(
  p_post_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lfg_type text;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'unauthenticated',
      'lfg_type', null
    );
  end if;

  update public.lfg_posts
  set status = 'closed'
  where id = p_post_id
    and profile_id = auth.uid()
    and status = 'active'
  returning lfg_type into v_lfg_type;

  return jsonb_build_object(
    'updated', v_lfg_type is not null,
    'error_code', case when v_lfg_type is null then 'not_found_or_inactive' else null end,
    'lfg_type', v_lfg_type
  );
end;
$$;

revoke all on function public.close_owned_lfg_post(uuid) from public;

grant execute on function public.close_owned_lfg_post(uuid) to authenticated;
