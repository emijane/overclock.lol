create index if not exists profiles_username_lookup_idx
  on public.profiles (username);

create index if not exists competitive_profiles_profile_lookup_idx
  on public.competitive_profiles (profile_id);

create index if not exists competitive_role_profiles_profile_role_lookup_idx
  on public.competitive_role_profiles (profile_id, role);

create index if not exists profile_hero_pools_profile_lookup_idx
  on public.profile_hero_pools (profile_id);

create index if not exists profile_featured_clips_profile_position_lookup_idx
  on public.profile_featured_clips (profile_id, position);

create index if not exists profile_badges_profile_granted_lookup_idx
  on public.profile_badges (profile_id, granted_at);

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
  v_target_profile record;
  v_viewer_state text := 'guest';
  v_viewer_current_user_id uuid := auth.uid();
  v_viewer_profile_id uuid := null;
  v_has_profile boolean := false;
  v_is_hidden boolean := false;
  v_pair_low uuid;
  v_pair_high uuid;
  v_active_connection_id uuid := null;
  v_pending_outgoing_invite_id uuid := null;
  v_connection_count integer := 0;
  v_initially_blocked_by_viewer boolean := false;
  v_invite_state text := 'invite_to_play';
begin
  if v_viewer_current_user_id is not null then
    select exists (
      select 1
      from public.profiles
      where id = v_viewer_current_user_id
    )
    into v_has_profile;

    if v_has_profile then
      v_viewer_state := 'signed_in';
      v_viewer_profile_id := v_viewer_current_user_id;
    else
      v_viewer_state := 'profile_required';
    end if;
  end if;

  if p_viewer_profile_id is not null then
    v_viewer_profile_id := p_viewer_profile_id;
  end if;

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
  into v_target_profile
  from public.profiles p
  where p.username = lower(trim(coalesce(p_username, '')))
  limit 1;

  if v_target_profile.id is null then
    return jsonb_build_object(
      'viewer', jsonb_build_object(
        'currentUserId', v_viewer_current_user_id,
        'profileId', v_viewer_profile_id,
        'viewerState', v_viewer_state
      ),
      'profile', null
    );
  end if;

  if v_viewer_profile_id is not null then
    v_is_hidden := public.is_profile_blocked_by(v_target_profile.id, v_viewer_profile_id);
    v_initially_blocked_by_viewer := public.is_profile_blocked_by(v_viewer_profile_id, v_target_profile.id);
  end if;

  if v_is_hidden then
    return jsonb_build_object(
      'viewer', jsonb_build_object(
        'currentUserId', v_viewer_current_user_id,
        'profileId', v_viewer_profile_id,
        'viewerState', v_viewer_state
      ),
      'profile', null
    );
  end if;

  if v_viewer_profile_id is not null and v_viewer_profile_id <> v_target_profile.id then
    v_pair_low := least(v_viewer_profile_id, v_target_profile.id);
    v_pair_high := greatest(v_viewer_profile_id, v_target_profile.id);

    if not public.has_either_user_blocked(v_viewer_profile_id, v_target_profile.id) then
      select id
      into v_active_connection_id
      from public.profile_connections
      where profile_low_id = v_pair_low
        and profile_high_id = v_pair_high
        and disconnected_at is null
      limit 1;

      select id
      into v_pending_outgoing_invite_id
      from public.play_invites
      where sender_profile_id = v_viewer_profile_id
        and recipient_profile_id = v_target_profile.id
        and status = 'pending'
        and expires_at > now()
      limit 1;

      if v_active_connection_id is not null then
        v_invite_state := 'connected';
      elsif v_pending_outgoing_invite_id is not null then
        v_invite_state := 'invite_sent';
      end if;
    end if;
  end if;

  v_connection_count := public.get_profile_connection_count(v_target_profile.id);

  return jsonb_build_object(
    'viewer', jsonb_build_object(
      'currentUserId', v_viewer_current_user_id,
      'profileId', v_viewer_profile_id,
      'viewerState', v_viewer_state
    ),
    'profile', jsonb_build_object(
      'id', v_target_profile.id,
      'username', v_target_profile.username,
      'displayName', v_target_profile.display_name,
      'discordUsername', v_target_profile.discord_username,
      'discordAvatarUrl', v_target_profile.discord_avatar_url,
      'avatarUrl', v_target_profile.avatar_url,
      'avatarUpdatedAt', v_target_profile.avatar_updated_at,
      'coverImagePath', v_target_profile.cover_image_path,
      'coverImageUpdatedAt', v_target_profile.cover_image_updated_at,
      'bio', v_target_profile.bio,
      'timezone', v_target_profile.timezone,
      'region', v_target_profile.region,
      'currentRankTier', v_target_profile.current_rank_tier,
      'currentRankDivision', v_target_profile.current_rank_division,
      'lookingFor', coalesce(v_target_profile.looking_for, array[]::text[]),
      'battlenetHandle', v_target_profile.battlenet_handle,
      'twitchUrl', v_target_profile.twitch_url,
      'xUrl', v_target_profile.x_url,
      'youtubeUrl', v_target_profile.youtube_url,
      'lastSeenAt', v_target_profile.last_seen_at,
      'isLookingToPlay', coalesce(v_target_profile.is_looking_to_play, false),
      'hideOfflinePresence', coalesce(v_target_profile.hide_offline_presence, false)
    ),
    'competitiveProfile', jsonb_build_object(
      'profileId', v_target_profile.id,
      'mainRole', (
        select cp.main_role
        from public.competitive_profiles cp
        where cp.profile_id = v_target_profile.id
        limit 1
      ),
      'platform', (
        select cp.platform
        from public.competitive_profiles cp
        where cp.profile_id = v_target_profile.id
        limit 1
      ),
      'roles', coalesce((
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
        where crp.profile_id = v_target_profile.id
      ), '[]'::jsonb)
    ),
    'heroPools', coalesce((
      select jsonb_build_object(
        'roles', coalesce(php.roles, array[]::text[]),
        'heroPicks', coalesce(php.hero_picks, jsonb_build_object('tank', '[]'::jsonb, 'dps', '[]'::jsonb, 'support', '[]'::jsonb))
      )
      from public.profile_hero_pools php
      where php.profile_id = v_target_profile.id
      limit 1
    ), jsonb_build_object(
      'roles', array[]::text[],
      'heroPicks', jsonb_build_object('tank', '[]'::jsonb, 'dps', '[]'::jsonb, 'support', '[]'::jsonb)
    )),
    'featuredClips', coalesce((
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
        where profile_id = v_target_profile.id
        order by position asc
        limit 2
      ) pfc
    ), '[]'::jsonb),
    'badges', coalesce((
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
      where pb.profile_id = v_target_profile.id
    ), '[]'::jsonb),
    'recentPosts', coalesce((
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
        where profile_id = v_target_profile.id
          and status in ('active', 'filled')
          and created_at >= now() - interval '12 hours'
        order by created_at desc
        limit 2
      ) lp
    ), '[]'::jsonb),
    'relationship', jsonb_build_object(
      'inviteState', v_invite_state,
      'connectionCount', v_connection_count,
      'activeConnectionId', v_active_connection_id,
      'pendingOutgoingInviteId', v_pending_outgoing_invite_id,
      'initiallyBlockedByViewer', v_initially_blocked_by_viewer
    )
  );
end;
$$;

revoke all on function public.get_profile_page_dto(text, uuid) from public;
grant execute on function public.get_profile_page_dto(text, uuid) to anon, authenticated;

create or replace function public.get_matches_page_dto(
  p_current_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_blocked_profile_ids uuid[] := array[]::uuid[];
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'errorCode', 'unauthenticated'
    );
  end if;

  if p_current_profile_id is null or p_current_profile_id <> auth.uid() then
    return jsonb_build_object(
      'errorCode', 'forbidden'
    );
  end if;

  select coalesce(array_agg(value), array[]::uuid[])
  into v_blocked_profile_ids
  from unnest(public.get_blocked_profile_ids_for_viewer(p_current_profile_id)) as value;

  return jsonb_build_object(
    'connections', coalesce((
      with connection_rows as (
        select
          pc.id,
          pc.connected_at,
          pc.created_from_invite_id,
          case
            when pc.profile_low_id = p_current_profile_id then pc.profile_high_id
            else pc.profile_low_id
          end as participant_profile_id
        from public.profile_connections pc
        where pc.disconnected_at is null
          and (pc.profile_low_id = p_current_profile_id or pc.profile_high_id = p_current_profile_id)
      )
      select jsonb_agg(
        jsonb_build_object(
          'id', cr.id,
          'connectedAt', cr.connected_at,
          'createdAt', coalesce(pi.created_at, cr.connected_at),
          'message', pi.message,
          'sourcePostTitle', lp.title,
          'participant', jsonb_build_object(
            'profileId', participant.id,
            'avatarUrl', coalesce(
              case
                when pi.id is not null and pi.sender_profile_id = participant.id then pi.sender_snapshot ->> 'avatar_url'
                when pi.id is not null and pi.recipient_profile_id = participant.id then pi.recipient_snapshot ->> 'avatar_url'
                else null
              end,
              participant.avatar_url
            ),
            'displayName', coalesce(
              case
                when pi.id is not null and pi.sender_profile_id = participant.id then pi.sender_snapshot ->> 'display_name'
                when pi.id is not null and pi.recipient_profile_id = participant.id then pi.recipient_snapshot ->> 'display_name'
                else null
              end,
              participant.display_name
            ),
            'mainRole', coalesce(
              case
                when pi.id is not null and pi.sender_profile_id = participant.id then pi.sender_snapshot ->> 'main_role'
                when pi.id is not null and pi.recipient_profile_id = participant.id then pi.recipient_snapshot ->> 'main_role'
                else null
              end,
              null
            ),
            'rankTier', coalesce(
              case
                when pi.id is not null and pi.sender_profile_id = participant.id then pi.sender_snapshot ->> 'rank_tier'
                when pi.id is not null and pi.recipient_profile_id = participant.id then pi.recipient_snapshot ->> 'rank_tier'
                else null
              end,
              participant.current_rank_tier
            ),
            'rankDivision', coalesce(
              case
                when pi.id is not null and pi.sender_profile_id = participant.id then (pi.sender_snapshot ->> 'rank_division')::integer
                when pi.id is not null and pi.recipient_profile_id = participant.id then (pi.recipient_snapshot ->> 'rank_division')::integer
                else null
              end,
              participant.current_rank_division
            ),
            'rankLabel', '',
            'region', coalesce(
              case
                when pi.id is not null and pi.sender_profile_id = participant.id then pi.sender_snapshot ->> 'region'
                when pi.id is not null and pi.recipient_profile_id = participant.id then pi.recipient_snapshot ->> 'region'
                else null
              end,
              participant.region
            ),
            'username', coalesce(
              case
                when pi.id is not null and pi.sender_profile_id = participant.id then pi.sender_snapshot ->> 'username'
                when pi.id is not null and pi.recipient_profile_id = participant.id then pi.recipient_snapshot ->> 'username'
                else null
              end,
              participant.username
            ),
            'discordUsername', participant.discord_username,
            'battlenetHandle', participant.battlenet_handle
          )
        )
        order by cr.connected_at desc
      )
      from connection_rows cr
      join public.profiles participant on participant.id = cr.participant_profile_id
      left join public.play_invites pi on pi.id = cr.created_from_invite_id
      left join public.lfg_posts lp on lp.id = pi.source_lfg_post_id
      where not (cr.participant_profile_id = any(v_blocked_profile_ids))
    ), '[]'::jsonb),
    'outgoingInvites', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'createdAt', pi.created_at,
          'expiresAt', pi.expires_at,
          'message', pi.message,
          'sourcePostTitle', lp.title,
          'participant', jsonb_build_object(
            'profileId', recipient.id,
            'avatarUrl', coalesce(pi.recipient_snapshot ->> 'avatar_url', recipient.avatar_url),
            'displayName', coalesce(pi.recipient_snapshot ->> 'display_name', recipient.display_name),
            'mainRole', pi.recipient_snapshot ->> 'main_role',
            'rankTier', coalesce(pi.recipient_snapshot ->> 'rank_tier', recipient.current_rank_tier),
            'rankDivision', coalesce((pi.recipient_snapshot ->> 'rank_division')::integer, recipient.current_rank_division),
            'rankLabel', '',
            'region', coalesce(pi.recipient_snapshot ->> 'region', recipient.region),
            'username', coalesce(pi.recipient_snapshot ->> 'username', recipient.username),
            'discordUsername', recipient.discord_username,
            'battlenetHandle', recipient.battlenet_handle
          )
        )
        order by pi.created_at desc
      )
      from public.play_invites pi
      join public.profiles recipient on recipient.id = pi.recipient_profile_id
      left join public.lfg_posts lp on lp.id = pi.source_lfg_post_id
      where pi.sender_profile_id = p_current_profile_id
        and pi.status = 'pending'
        and pi.expires_at > now()
        and not (pi.recipient_profile_id = any(v_blocked_profile_ids))
    ), '[]'::jsonb),
    'incomingInvites', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'createdAt', pi.created_at,
          'expiresAt', pi.expires_at,
          'message', pi.message,
          'sourcePostTitle', lp.title,
          'participant', jsonb_build_object(
            'profileId', sender.id,
            'avatarUrl', coalesce(pi.sender_snapshot ->> 'avatar_url', sender.avatar_url),
            'displayName', coalesce(pi.sender_snapshot ->> 'display_name', sender.display_name),
            'mainRole', pi.sender_snapshot ->> 'main_role',
            'rankTier', coalesce(pi.sender_snapshot ->> 'rank_tier', sender.current_rank_tier),
            'rankDivision', coalesce((pi.sender_snapshot ->> 'rank_division')::integer, sender.current_rank_division),
            'rankLabel', '',
            'region', coalesce(pi.sender_snapshot ->> 'region', sender.region),
            'username', coalesce(pi.sender_snapshot ->> 'username', sender.username),
            'discordUsername', sender.discord_username,
            'battlenetHandle', sender.battlenet_handle
          )
        )
        order by pi.expires_at asc, pi.created_at desc
      )
      from public.play_invites pi
      join public.profiles sender on sender.id = pi.sender_profile_id
      left join public.lfg_posts lp on lp.id = pi.source_lfg_post_id
      where pi.recipient_profile_id = p_current_profile_id
        and pi.status = 'pending'
        and pi.expires_at > now()
        and not (pi.sender_profile_id = any(v_blocked_profile_ids))
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_matches_page_dto(uuid) from public;
grant execute on function public.get_matches_page_dto(uuid) to authenticated;

create or replace function public.get_notifications_menu_dto(
  p_current_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_blocked_profile_ids uuid[] := array[]::uuid[];
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'errorCode', 'unauthenticated'
    );
  end if;

  if p_current_profile_id is null or p_current_profile_id <> auth.uid() then
    return jsonb_build_object(
      'errorCode', 'forbidden'
    );
  end if;

  select coalesce(array_agg(value), array[]::uuid[])
  into v_blocked_profile_ids
  from unnest(public.get_blocked_profile_ids_for_viewer(p_current_profile_id)) as value;

  return jsonb_build_object(
    'incomingInvites', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'createdAt', pi.created_at,
          'expiresAt', pi.expires_at,
          'message', pi.message,
          'sourcePostTitle', lp.title,
          'participant', jsonb_build_object(
            'profileId', sender.id,
            'avatarUrl', coalesce(pi.sender_snapshot ->> 'avatar_url', sender.avatar_url),
            'displayName', coalesce(pi.sender_snapshot ->> 'display_name', sender.display_name),
            'mainRole', pi.sender_snapshot ->> 'main_role',
            'rankTier', coalesce(pi.sender_snapshot ->> 'rank_tier', sender.current_rank_tier),
            'rankDivision', coalesce((pi.sender_snapshot ->> 'rank_division')::integer, sender.current_rank_division),
            'rankLabel', '',
            'region', coalesce(pi.sender_snapshot ->> 'region', sender.region),
            'username', coalesce(pi.sender_snapshot ->> 'username', sender.username),
            'discordUsername', sender.discord_username,
            'battlenetHandle', sender.battlenet_handle
          )
        )
        order by pi.expires_at asc, pi.created_at desc
      )
      from (
        select *
        from public.play_invites
        where recipient_profile_id = p_current_profile_id
          and status = 'pending'
          and expires_at > now()
        order by expires_at asc, created_at desc
        limit 9
      ) pi
      join public.profiles sender on sender.id = pi.sender_profile_id
      left join public.lfg_posts lp on lp.id = pi.source_lfg_post_id
      where not (pi.sender_profile_id = any(v_blocked_profile_ids))
    ), '[]'::jsonb),
    'stackRequests', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', sr.id,
          'createdAt', sr.created_at,
          'postId', sr.post_id,
          'postTitle', lp.title,
          'requestedRole', sr.requested_role,
          'requester', jsonb_build_object(
            'profileId', requester.id,
            'avatarUrl', requester.avatar_url,
            'displayName', requester.display_name,
            'rankTier', requester.current_rank_tier,
            'rankDivision', requester.current_rank_division,
            'username', requester.username
          )
        )
        order by sr.created_at desc
      )
      from (
        select *
        from public.stack_requests
        where owner_profile_id = p_current_profile_id
          and status = 'pending'
        order by created_at desc
        limit 20
      ) sr
      join public.lfg_posts lp on lp.id = sr.post_id
      join public.profiles requester on requester.id = sr.requester_profile_id
      where lp.status in ('active', 'filled')
        and lp.created_at >= now() - interval '12 hours'
        and not (sr.requester_profile_id = any(v_blocked_profile_ids))
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_notifications_menu_dto(uuid) from public;
grant execute on function public.get_notifications_menu_dto(uuid) to authenticated;
