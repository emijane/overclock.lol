-- Phase 2B: Populate expiration and retention fields on LFG lifecycle writes.
-- Requires: 20260515010000_add_lfg_post_expiration_fields.sql
--
-- No feed visibility, RLS, or rate-limit behavior changes in this migration.
-- Feed queries still use the created_at window until Phase 2C.
--
-- What changes:
--   create_lfg_post_atomic  — new posts write expires_at and purge_after
--   close_owned_lfg_post    — closing writes closed_at and purge_after
--   expire_stack_posts      — expiry threshold switches from created_at + 12h to
--                             expires_at (created_at + 24h); writes expired_at and
--                             purge_after; expanded to expire all post types, not
--                             just stacks (stack member/request cleanup is stacks-only)
--
-- Named policy values used in this file:
--   LFG_POST_EXPIRY_HOURS = 24
--   LFG_RETENTION_DAYS    = 30

-- ─── 1. create_lfg_post_atomic ────────────────────────────────────────────────
-- Canonical signature from 20260510032000_canonicalize_create_lfg_post_atomic.sql.
-- Only change: expires_at and purge_after added to INSERT column list and values.

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

  if exists (
    select 1
    from public.lfg_posts
    where profile_id = p_profile_id
      and lfg_type   = p_lfg_type
      and game_mode  = p_game_mode
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

-- ─── 2. close_owned_lfg_post ──────────────────────────────────────────────────
-- Based on 20260510020000_stack_group_lifecycle.sql.
-- Only change: closed_at = now() and purge_after = now() + 30d added to the UPDATE.

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
  perform public.expire_stack_posts();

  if auth.uid() is null then
    return jsonb_build_object('updated', false, 'error_code', 'unauthenticated', 'lfg_type', null);
  end if;

  select id, lfg_type, profile_id, status
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

  if v_post.status not in ('active', 'filled') then
    return jsonb_build_object('updated', false, 'error_code', 'not_active', 'lfg_type', v_post.lfg_type);
  end if;

  update public.lfg_posts
  set
    status     = 'closed',
    closed_at  = now(),
    purge_after = now() + interval '30 days'
  where id = p_post_id;

  if v_post.lfg_type = 'stacks' then
    update public.stack_requests
    set
      status       = 'declined',
      updated_at   = now(),
      responded_at = coalesce(responded_at, now()),
      declined_at  = coalesce(declined_at, now())
    where post_id = p_post_id
      and status  = 'pending';

    update public.stack_members
    set
      removed_at            = now(),
      removed_by_profile_id = auth.uid()
    where post_id    = p_post_id
      and removed_at is null;
  end if;

  return jsonb_build_object('updated', true, 'error_code', null, 'lfg_type', v_post.lfg_type);
end;
$$;

revoke all on function public.close_owned_lfg_post(uuid) from public;
grant execute on function public.close_owned_lfg_post(uuid) to authenticated;

-- ─── 3. expire_stack_posts ────────────────────────────────────────────────────
-- Based on 20260510020000_stack_group_lifecycle.sql.
-- Changes:
--   - Expiry threshold: expires_at <= now() instead of created_at + 12h
--   - All post types are eligible for expiry (not just stacks)
--   - Stack member/request cleanup still runs for stacks posts only
--   - Writes expired_at (if null) and purge_after (if null) on every expiry

create or replace function public.expire_stack_posts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_all_expired_ids   uuid[];
  v_stack_expired_ids uuid[];
  v_count             integer := 0;
begin
  select
    coalesce(array_agg(id),                                          array[]::uuid[]),
    coalesce(array_agg(id) filter (where lfg_type = 'stacks'),      array[]::uuid[])
  into v_all_expired_ids, v_stack_expired_ids
  from public.lfg_posts
  where status in ('active', 'filled')
    and expires_at is not null
    and expires_at <= now();

  v_count := coalesce(array_length(v_all_expired_ids, 1), 0);

  if v_count = 0 then
    return jsonb_build_object('updated', true, 'expired_count', 0);
  end if;

  update public.lfg_posts
  set
    status      = 'expired',
    expired_at  = coalesce(expired_at,  now()),
    purge_after = coalesce(purge_after, now() + interval '30 days')
  where id = any(v_all_expired_ids);

  if coalesce(array_length(v_stack_expired_ids, 1), 0) > 0 then
    update public.stack_requests
    set
      status       = 'declined',
      updated_at   = now(),
      responded_at = coalesce(responded_at, now()),
      declined_at  = coalesce(declined_at,  now())
    where post_id = any(v_stack_expired_ids)
      and status  = 'pending';

    update public.stack_members
    set
      removed_at            = now(),
      removed_by_profile_id = coalesce(removed_by_profile_id, profile_id)
    where post_id    = any(v_stack_expired_ids)
      and removed_at is null;
  end if;

  return jsonb_build_object('updated', true, 'expired_count', v_count);
end;
$$;

revoke all on function public.expire_stack_posts() from public;
grant execute on function public.expire_stack_posts() to anon, authenticated;
