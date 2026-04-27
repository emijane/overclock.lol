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
security invoker
set search_path = public
as $$
declare
  v_active_cutoff timestamptz := now() - interval '12 hours';
  v_create_cutoff timestamptz := now() - interval '60 minutes';
  v_post_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'unauthenticated',
      'post_id', null
    );
  end if;

  if auth.uid() <> p_profile_id then
    return jsonb_build_object(
      'created', false,
      'error_code', 'forbidden',
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
      and lower(regexp_replace(trim(title), '\s+', ' ', 'g')) =
          lower(regexp_replace(trim(p_title), '\s+', ' ', 'g'))
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
    p_title
  )
  returning id into v_post_id;

  return jsonb_build_object(
    'created', true,
    'error_code', null,
    'post_id', v_post_id
  );
end;
$$;
