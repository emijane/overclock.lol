-- Align active slot limit with live feed visibility.
--
-- Previously: slot limit used created_at >= now() - 12h (12h window)
--             feed visibility used expires_at > now()   (24h window)
--
-- Now: both use expires_at > now().
--
-- Why: a slot is occupied as long as the post is visible. Under the 12h rule,
-- a user's slot freed up at 12h while their post stayed in the feed until 24h.
-- This allowed near-identical duplicate posts to coexist in the feed (one word
-- title difference bypasses dedup). Aligning to expires_at closes that gap.
--
-- What does NOT change:
--   - Dedup check already uses expires_at > now() (fixed in 20260515060000)
--   - Creation rate limit stays on created_at >= now() - 60m (separate concern)
--   - Stacks are not affected (slot check is guarded by p_lfg_type <> 'stacks')
--   - Expiration lifecycle, retention, cleanup — unchanged
--
-- v_active_cutoff is removed from the function since nothing uses it now.

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
  v_create_cutoff               timestamptz := now() - interval '60 minutes';
  v_normalized_looking_for_roles text[];
  v_normalized_title            text := regexp_replace(trim(coalesce(p_title, '')), '\s+', ' ', 'g');
  v_post_id                     uuid;
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

  -- Dedup: block identical posts that are still live in the feed.
  if exists (
    select 1
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type   = p_lfg_type
      and game_mode  = p_game_mode
      and posting_role = p_posting_role
      and lower(regexp_replace(trim(title), '\s+', ' ', 'g')) = lower(v_normalized_title)
      and status in ('active', 'filled')
      and (expires_at is null or expires_at > now())
  ) then
    return jsonb_build_object('created', false, 'error_code', 'duplicate_active_post', 'post_id', null);
  end if;

  -- Slot limit: a slot is occupied while the post is visible in the feed.
  -- Uses expires_at > now() — same window as RLS and feed queries.
  -- Stacks bypass this check (governed by is_profile_in_active_stack instead).
  if p_lfg_type <> 'stacks' and (
    select count(*)
    from public.lfg_posts
    where profile_id   = p_profile_id
      and lfg_type     = p_lfg_type
      and posting_role = p_posting_role
      and status       = 'active'
      and (expires_at is null or expires_at > now())
  ) >= 2 then
    return jsonb_build_object('created', false, 'error_code', 'active_slot_limit', 'post_id', null);
  end if;

  if (
    select count(*)
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type   = p_lfg_type
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
    status,
    expires_at,
    purge_after
  )
  values (
    p_competitive_profile_snapshot,
    null,
    p_game_mode,
    p_hero_pool_snapshot,
    p_lfg_type,
    v_normalized_looking_for_roles,
    case when p_lfg_type = 'stacks' then 5 else p_max_group_size end,
    1,
    p_posting_role,
    p_profile_id,
    p_competitive_profile_snapshot ->> 'main_role',
    p_platform,
    p_rank_division,
    p_rank_tier,
    p_region,
    p_timezone,
    v_normalized_title,
    'active',
    now() + interval '24 hours',
    now() + interval '24 hours' + interval '30 days'
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
