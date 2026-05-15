-- Phase 2 post-audit fixes: four regressions found during the production-
-- correctness audit of the LFG expiration implementation (Phases 2A-2F).
--
-- Fix 1 — create_lfg_post_atomic dedup window (Bug: duplicate posts in feed)
--   Old check: status in ('active','filled') AND created_at >= now() - 12h
--   New check: status in ('active','filled') AND (expires_at IS NULL OR expires_at > now())
--   Why: feed uses expires_at > now() (24h window). Dedup used created_at 12h window.
--        Between hours 12–24, an existing post was visible in the feed but invisible
--        to the dedup check, allowing identical duplicate posts to coexist.
--
-- Fix 2 — send_play_invite source post stale validation (Bug: invite blocked from feed post)
--   Old check: v_source_post.created_at < now() - interval '12 hours'
--   New check: v_source_post.expires_at IS NOT NULL AND v_source_post.expires_at <= now()
--   Why: after Phase 2C, posts are valid in the feed for 24h via expires_at. Users
--        could see a post in the feed between hours 12–24 but get invalid_source_post
--        when sending a play invite from it.
--
-- Fix 3 — cleanup_expired_lfg_posts zombie invite guard (Bug: cleanup blocked forever)
--   Old check: play_invites WHERE source_lfg_post_id = any(eligible) AND status = 'pending'
--   New check: same AND expires_at > now()
--   Why: play_invites have their own expires_at (24h). A pending invite whose expires_at
--        has passed is a zombie — it will never be acted on. Without this fix, zombie
--        invites block post cleanup indefinitely.
--
-- Fix 4 — get_profile_page_dto recent_posts widget (Bug: posts vanish from profile at 12h)
--   Old filter: AND created_at >= now() - interval '12 hours'
--   New filter: AND expires_at > now()
--   Why: the profile page recent-posts widget should show the same active posts the
--        feed shows. After Phase 2C, the feed uses expires_at; this DTO was not updated
--        and posts disappeared from profiles after 12h while still visible in the feed.

-- ─── Fix 1: create_lfg_post_atomic ───────────────────────────────────────────
-- Full redef from 20260515020000, dedup EXISTS check updated.
-- v_active_cutoff is kept — still used for the active_slot_limit count check,
-- which remains intentionally on a 12h window (rate-limit design decision).

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
  v_active_cutoff               timestamptz := now() - interval '12 hours';
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

  -- Dedup check: a post is a duplicate if it is still live in the feed.
  -- Uses expires_at > now() (same window as RLS and feed) so a post between
  -- hours 12–24 is correctly detected as a duplicate.
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

  if p_lfg_type <> 'stacks' and (
    select count(*)
    from public.lfg_posts
    where profile_id   = p_profile_id
      and lfg_type     = p_lfg_type
      and posting_role = p_posting_role
      and status       = 'active'
      and created_at  >= v_active_cutoff
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

-- ─── Fix 2: send_play_invite ──────────────────────────────────────────────────
-- Full redef from 20260513000000_add_user_blocks.sql.
-- source_lfg_post_id validation updated: select expires_at instead of created_at,
-- check expires_at <= now() instead of created_at < now() - 12h.

create or replace function public.send_play_invite(
  p_message text,
  p_recipient_profile_id uuid,
  p_source_lfg_post_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection_high_id uuid;
  v_connection_low_id uuid;
  v_invite_id uuid;
  v_normalized_message text := nullif(regexp_replace(trim(coalesce(p_message, '')), '\s+', ' ', 'g'), '');
  v_sender_profile record;
  v_source_post record;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'unauthenticated',
      'invite_id', null
    );
  end if;

  if p_recipient_profile_id is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_recipient',
      'invite_id', null
    );
  end if;

  if auth.uid() = p_recipient_profile_id then
    return jsonb_build_object(
      'created', false,
      'error_code', 'self_invite',
      'invite_id', null
    );
  end if;

  if v_normalized_message is not null and char_length(v_normalized_message) > 280 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_message',
      'invite_id', null
    );
  end if;

  select
    p.id,
    p.username,
    p.display_name,
    p.discord_avatar_url,
    p.region,
    p.current_rank_tier,
    p.current_rank_division,
    cp.main_role
  into v_sender_profile
  from public.profiles p
  left join public.competitive_profiles cp
    on cp.profile_id = p.id
  where p.id = auth.uid();

  if v_sender_profile.id is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'sender_not_found',
      'invite_id', null
    );
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_recipient_profile_id
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'recipient_not_found',
      'invite_id', null
    );
  end if;

  if public.has_either_user_blocked(auth.uid(), p_recipient_profile_id) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'blocked_users',
      'invite_id', null
    );
  end if;

  if p_source_lfg_post_id is not null then
    select id, profile_id, status, expires_at
    into v_source_post
    from public.lfg_posts
    where id = p_source_lfg_post_id;

    -- Source post must exist, belong to the recipient, be active, and not yet expired.
    -- Uses expires_at to match the feed visibility window (Phase 2C: 24h via expires_at).
    if v_source_post.id is null
      or v_source_post.profile_id <> p_recipient_profile_id
      or v_source_post.status <> 'active'
      or (v_source_post.expires_at is not null and v_source_post.expires_at <= now()) then
      return jsonb_build_object(
        'created', false,
        'error_code', 'invalid_source_post',
        'invite_id', null
      );
    end if;
  end if;

  v_connection_low_id := least(auth.uid(), p_recipient_profile_id);
  v_connection_high_id := greatest(auth.uid(), p_recipient_profile_id);

  if exists (
    select 1
    from public.profile_connections
    where profile_low_id = v_connection_low_id
      and profile_high_id = v_connection_high_id
      and disconnected_at is null
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'already_connected',
      'invite_id', null
    );
  end if;

  if (
    select count(*)
    from public.play_invites
    where sender_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 20 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'send_rate_limited',
      'invite_id', null
    );
  end if;

  if (
    select count(*)
    from public.play_invites
    where sender_profile_id = auth.uid()
      and recipient_profile_id = p_recipient_profile_id
      and created_at >= now() - interval '10 minutes'
  ) >= 5 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'recipient_rate_limited',
      'invite_id', null
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext('play_invite_send'),
    hashtext(
      auth.uid()::text
      || ':'
      || p_recipient_profile_id::text
      || ':'
      || coalesce(p_source_lfg_post_id::text, 'no-post')
    )
  );

  if exists (
    select 1
    from public.play_invites
    where sender_profile_id = auth.uid()
      and recipient_profile_id = p_recipient_profile_id
      and (
        source_lfg_post_id = p_source_lfg_post_id
        or (
          source_lfg_post_id is null
          and p_source_lfg_post_id is null
        )
      )
      and status = 'pending'
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'duplicate_pending_invite',
      'invite_id', null
    );
  end if;

  insert into public.play_invites (
    sender_profile_id,
    recipient_profile_id,
    source_lfg_post_id,
    status,
    message,
    sender_snapshot,
    updated_at
  )
  values (
    auth.uid(),
    p_recipient_profile_id,
    p_source_lfg_post_id,
    'pending',
    v_normalized_message,
    jsonb_build_object(
      'avatar_url', v_sender_profile.discord_avatar_url,
      'display_name', v_sender_profile.display_name,
      'main_role', v_sender_profile.main_role,
      'rank_division', v_sender_profile.current_rank_division,
      'rank_tier', v_sender_profile.current_rank_tier,
      'region', v_sender_profile.region,
      'username', v_sender_profile.username
    ),
    now()
  )
  returning id into v_invite_id;

  return jsonb_build_object(
    'created', true,
    'error_code', null,
    'invite_id', v_invite_id
  );
end;
$$;

revoke all on function public.send_play_invite(text, uuid, uuid) from public;
grant execute on function public.send_play_invite(text, uuid, uuid) to authenticated;

-- ─── Fix 3: cleanup_expired_lfg_posts ────────────────────────────────────────
-- Full redef from 20260515050000_add_cleanup_expired_lfg_posts.sql.
-- play_invites skip guard now filters out zombie invites (pending status, expired time).

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
      'expired_deleted_count',    0,
      'closed_deleted_count',     0,
      'skipped_dependency_count', 0
    );
  end if;

  -- 2. Identify posts with active dependencies that must be skipped.
  --    stack_requests: pending requests would lose user-visible data on delete.
  --    play_invites: only block if the invite itself has not yet expired.
  --      expires_at > now() filters out zombie invites (pending status, expired time)
  --      that will never be acted on and would otherwise block cleanup forever.
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
      and expires_at          > now()
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
      'expired_deleted_count',    0,
      'closed_deleted_count',     0,
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
    'expired_deleted_count',    v_expired_deleted,
    'closed_deleted_count',     v_closed_deleted,
    'skipped_dependency_count', v_skipped
  );
end;
$$;

revoke all     on function public.cleanup_expired_lfg_posts() from public;
revoke execute on function public.cleanup_expired_lfg_posts() from anon, authenticated;
grant  execute on function public.cleanup_expired_lfg_posts() to service_role;

-- ─── Fix 4: get_profile_page_dto ─────────────────────────────────────────────
-- Full redef from 20260515003000_fix_profile_page_dto_empty_uuid.sql.
-- recent_posts CTE filter updated from created_at >= now() - 12h to expires_at > now().

create or replace function public.get_profile_page_dto(
  p_username text,
  p_viewer_profile_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_user_subject text := nullif(auth.jwt() ->> 'sub', '');
  v_current_user_id uuid;
  v_result jsonb;
begin
  if v_current_user_subject ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_current_user_id := v_current_user_subject::uuid;
  else
    v_current_user_id := null;
  end if;

  if v_current_user_id is null then
    if p_viewer_profile_id is not null then
      raise exception 'forbidden'
        using errcode = '42501';
    end if;
  elsif p_viewer_profile_id is not null and p_viewer_profile_id <> v_current_user_id then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  with viewer_auth as (
    select v_current_user_id as current_user_id
  ),
  viewer_profile_status as (
    select
      va.current_user_id,
      exists (
        select 1
        from public.profiles
        where id = va.current_user_id
      ) as has_profile
    from viewer_auth va
  ),
  viewer_state as (
    select
      vps.current_user_id,
      case
        when vps.current_user_id is null then 'guest'
        when vps.has_profile then 'signed_in'
        else 'profile_required'
      end as viewer_state,
      case
        when vps.current_user_id is null then null
        when vps.has_profile then vps.current_user_id
        else null
      end as viewer_profile_id
    from viewer_profile_status vps
  ),
  target_profile as (
    select
      p.id,
      p.username,
      p.display_name,
      p.discord_username,
      p.discord_avatar_url,
      p.avatar_url,
      p.avatar_updated_at,
      p.cover_image_path,
      p.cover_image_updated_at,
      p.bio,
      p.timezone,
      p.region,
      p.current_rank_tier,
      p.current_rank_division,
      p.looking_for,
      p.battlenet_handle,
      p.twitch_url,
      p.x_url,
      p.youtube_url,
      p.last_seen_at,
      p.is_looking_to_play,
      p.hide_offline_presence
    from public.profiles p
    where p.username = lower(trim(coalesce(p_username, '')))
    limit 1
  ),
  block_state as (
    select
      coalesce(
        bool_or(
          ub.blocker_profile_id = tp.id
          and ub.blocked_profile_id = vs.viewer_profile_id
        ),
        false
      ) as target_blocks_viewer,
      coalesce(
        bool_or(
          ub.blocker_profile_id = vs.viewer_profile_id
          and ub.blocked_profile_id = tp.id
        ),
        false
      ) as viewer_blocks_target
    from viewer_state vs
    left join target_profile tp on true
    left join public.user_blocks ub
      on tp.id is not null
      and vs.viewer_profile_id is not null
      and (
        (ub.blocker_profile_id = tp.id and ub.blocked_profile_id = vs.viewer_profile_id)
        or
        (ub.blocker_profile_id = vs.viewer_profile_id and ub.blocked_profile_id = tp.id)
      )
  ),
  pair_state as (
    select
      tp.id as target_profile_id,
      vs.viewer_profile_id,
      bs.target_blocks_viewer,
      bs.viewer_blocks_target,
      (bs.target_blocks_viewer or bs.viewer_blocks_target) as either_blocked,
      case
        when vs.viewer_profile_id is not null and tp.id is not null
          then least(vs.viewer_profile_id, tp.id)
        else null
      end as pair_low,
      case
        when vs.viewer_profile_id is not null and tp.id is not null
          then greatest(vs.viewer_profile_id, tp.id)
        else null
      end as pair_high
    from viewer_state vs
    left join target_profile tp on true
    cross join block_state bs
  ),
  relationship_state as (
    select
      pc.id as active_connection_id,
      pi.id as pending_outgoing_invite_id,
      case
        when pc.id is not null then 'connected'
        when pi.id is not null then 'invite_sent'
        else 'invite_to_play'
      end as invite_state
    from pair_state ps
    left join lateral (
      select id
      from public.profile_connections
      where ps.viewer_profile_id is not null
        and ps.target_profile_id is not null
        and ps.viewer_profile_id <> ps.target_profile_id
        and not ps.either_blocked
        and profile_low_id = ps.pair_low
        and profile_high_id = ps.pair_high
        and disconnected_at is null
      limit 1
    ) pc on true
    left join lateral (
      select id
      from public.play_invites
      where ps.viewer_profile_id is not null
        and ps.target_profile_id is not null
        and ps.viewer_profile_id <> ps.target_profile_id
        and not ps.either_blocked
        and sender_profile_id = ps.viewer_profile_id
        and recipient_profile_id = ps.target_profile_id
        and status = 'pending'
        and expires_at > now()
      limit 1
    ) pi on true
  ),
  connection_count as (
    select count(pc.id)::integer as connection_count
    from target_profile tp
    left join public.profile_connections pc
      on tp.id is not null
      and pc.disconnected_at is null
      and (
        pc.profile_low_id = tp.id
        or pc.profile_high_id = tp.id
      )
  ),
  competitive_profile_row as (
    select
      cp.main_role,
      cp.platform
    from target_profile tp
    left join lateral (
      select
        competitive_profiles.main_role,
        competitive_profiles.platform
      from public.competitive_profiles
      where profile_id = tp.id
      limit 1
    ) cp on true
  ),
  role_profiles as (
    select coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', crp.id,
          'profileId', crp.profile_id,
          'role', crp.role,
          'rankTier', crp.rank_tier,
          'rankDivision', crp.rank_division,
          'enabled', crp.enabled,
          'createdAt', crp.created_at,
          'updatedAt', crp.updated_at
        )
        order by array_position(array['tank','dps','support']::text[], crp.role)
      )
      from public.competitive_role_profiles crp
      join target_profile tp on tp.id = crp.profile_id
    ), '[]'::jsonb) as roles
  ),
  hero_pools as (
    select coalesce((
      select jsonb_build_object(
        'roles', coalesce(php.roles, array[]::text[]),
        'heroPicks', coalesce(
          php.hero_picks,
          jsonb_build_object('tank', '[]'::jsonb, 'dps', '[]'::jsonb, 'support', '[]'::jsonb)
        )
      )
      from public.profile_hero_pools php
      join target_profile tp on tp.id = php.profile_id
      limit 1
    ), jsonb_build_object(
      'roles', array[]::text[],
      'heroPicks', jsonb_build_object('tank', '[]'::jsonb, 'dps', '[]'::jsonb, 'support', '[]'::jsonb)
    )) as hero_pools
  ),
  featured_clips as (
    select coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pfc.id,
          'platform', pfc.platform,
          'position', pfc.position,
          'thumbnailUrl', pfc.thumbnail_url,
          'title', pfc.title,
          'url', pfc.url
        )
        order by pfc.position asc
      )
      from (
        select *
        from public.profile_featured_clips
        where profile_id = (select id from target_profile)
        order by position asc
        limit 2
      ) pfc
    ), '[]'::jsonb) as featured_clips
  ),
  badges as (
    select coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'slug', b.slug,
          'label', b.label,
          'description', b.description,
          'icon', b.icon,
          'color', b.color,
          'grantedAt', pb.granted_at
        )
        order by pb.granted_at asc
      )
      from public.profile_badges pb
      join public.badges b on b.id = pb.badge_id
      where pb.profile_id = (select id from target_profile)
    ), '[]'::jsonb) as badges
  ),
  recent_posts as (
    select coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', lp.id,
          'lfgType', lp.lfg_type,
          'title', lp.title,
          'createdAt', lp.created_at,
          'postingRole', lp.posting_role,
          'rankTier', lp.snapshot_rank_tier,
          'lookingForRoles', coalesce(lp.looking_for_roles, array[]::text[])
        )
        order by lp.created_at desc
      )
      from (
        select *
        from public.lfg_posts
        where profile_id = (select id from target_profile)
          and status in ('active', 'filled')
          and expires_at > now()
        order by created_at desc
        limit 2
      ) lp
    ), '[]'::jsonb) as recent_posts
  )
  select jsonb_build_object(
    'viewer', jsonb_build_object(
      'currentUserId', vs.current_user_id,
      'profileId', vs.viewer_profile_id,
      'viewerState', vs.viewer_state
    ),
    'profile', case
      when tp.id is null then null
      when ps.target_blocks_viewer then null
      else jsonb_build_object(
        'id', tp.id,
        'username', tp.username,
        'displayName', tp.display_name,
        'discordUsername', tp.discord_username,
        'discordAvatarUrl', tp.discord_avatar_url,
        'avatarUrl', tp.avatar_url,
        'avatarUpdatedAt', tp.avatar_updated_at,
        'coverImagePath', tp.cover_image_path,
        'coverImageUpdatedAt', tp.cover_image_updated_at,
        'bio', tp.bio,
        'timezone', tp.timezone,
        'region', tp.region,
        'currentRankTier', tp.current_rank_tier,
        'currentRankDivision', tp.current_rank_division,
        'lookingFor', coalesce(tp.looking_for, array[]::text[]),
        'battlenetHandle', tp.battlenet_handle,
        'twitchUrl', tp.twitch_url,
        'xUrl', tp.x_url,
        'youtubeUrl', tp.youtube_url,
        'lastSeenAt', tp.last_seen_at,
        'isLookingToPlay', coalesce(tp.is_looking_to_play, false),
        'hideOfflinePresence', coalesce(tp.hide_offline_presence, false)
      )
    end,
    'competitiveProfile', case
      when tp.id is null or ps.target_blocks_viewer then
        jsonb_build_object(
          'profileId', tp.id,
          'mainRole', null,
          'platform', null,
          'roles', '[]'::jsonb
        )
      else jsonb_build_object(
        'profileId', tp.id,
        'mainRole', cpr.main_role,
        'platform', cpr.platform,
        'roles', rp.roles
      )
    end,
    'heroPools', case
      when tp.id is null or ps.target_blocks_viewer then
        jsonb_build_object(
          'roles', array[]::text[],
          'heroPicks', jsonb_build_object('tank', '[]'::jsonb, 'dps', '[]'::jsonb, 'support', '[]'::jsonb)
        )
      else hp.hero_pools
    end,
    'featuredClips', case
      when tp.id is null or ps.target_blocks_viewer then '[]'::jsonb
      else fc.featured_clips
    end,
    'badges', case
      when tp.id is null or ps.target_blocks_viewer then '[]'::jsonb
      else bd.badges
    end,
    'recentPosts', case
      when tp.id is null or ps.target_blocks_viewer then '[]'::jsonb
      else rps.recent_posts
    end,
    'relationship', jsonb_build_object(
      'inviteState', case
        when ps.viewer_profile_id is null
          or tp.id is null
          or ps.viewer_profile_id = tp.id
          or ps.either_blocked
          then 'invite_to_play'
        else rs.invite_state
      end,
      'connectionCount', coalesce(cc.connection_count, 0),
      'activeConnectionId', case
        when ps.either_blocked then null
        else rs.active_connection_id
      end,
      'pendingOutgoingInviteId', case
        when ps.either_blocked then null
        else rs.pending_outgoing_invite_id
      end,
      'initiallyBlockedByViewer', coalesce(ps.viewer_blocks_target, false)
    )
  )
  into v_result
  from viewer_state vs
  left join target_profile tp on true
  left join pair_state ps on true
  left join relationship_state rs on true
  left join connection_count cc on true
  left join competitive_profile_row cpr on true
  cross join role_profiles rp
  cross join hero_pools hp
  cross join featured_clips fc
  cross join badges bd
  cross join recent_posts rps;

  return v_result;
end;
$$;

revoke all on function public.get_profile_page_dto(text, uuid) from public;
grant execute on function public.get_profile_page_dto(text, uuid) to anon, authenticated;
