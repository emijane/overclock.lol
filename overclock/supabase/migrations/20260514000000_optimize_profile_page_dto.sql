create or replace function public.get_profile_page_dto(
  p_username text,
  p_viewer_profile_id uuid default null
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  with viewer_auth as (
    select auth.uid() as current_user_id
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
      coalesce(
        p_viewer_profile_id,
        case
          when vps.has_profile then vps.current_user_id
          else null
        end
      ) as viewer_profile_id
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
    from viewer_state vs
    left join target_profile tp on true
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
          jsonb_build_object(
            'tank', '[]'::jsonb,
            'dps', '[]'::jsonb,
            'support', '[]'::jsonb
          )
        )
      )
      from public.profile_hero_pools php
      join target_profile tp on tp.id = php.profile_id
      limit 1
    ), jsonb_build_object(
      'roles', array[]::text[],
      'heroPicks', jsonb_build_object(
        'tank', '[]'::jsonb,
        'dps', '[]'::jsonb,
        'support', '[]'::jsonb
      )
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
      join target_profile tp on tp.id = pb.profile_id
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
          and created_at >= now() - interval '12 hours'
        order by created_at desc
        limit 2
      ) lp
    ), '[]'::jsonb) as recent_posts
  )
  select case
    when tp.id is null or bs.target_blocks_viewer then
      jsonb_build_object(
        'viewer', jsonb_build_object(
          'currentUserId', vs.current_user_id,
          'profileId', vs.viewer_profile_id,
          'viewerState', vs.viewer_state
        ),
        'profile', null
      )
    else
      jsonb_build_object(
        'viewer', jsonb_build_object(
          'currentUserId', vs.current_user_id,
          'profileId', vs.viewer_profile_id,
          'viewerState', vs.viewer_state
        ),
        'profile', jsonb_build_object(
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
        ),
        'competitiveProfile', jsonb_build_object(
          'profileId', tp.id,
          'mainRole', cpr.main_role,
          'platform', cpr.platform,
          'roles', rp.roles
        ),
        'heroPools', hp.hero_pools,
        'featuredClips', fc.featured_clips,
        'badges', bd.badges,
        'recentPosts', rps.recent_posts,
        'relationship', jsonb_build_object(
          'inviteState', rs.invite_state,
          'connectionCount', cc.connection_count,
          'activeConnectionId', rs.active_connection_id,
          'pendingOutgoingInviteId', rs.pending_outgoing_invite_id,
          'initiallyBlockedByViewer', ps.viewer_blocks_target
        )
      )
  end
  from viewer_state vs
  left join target_profile tp on true
  cross join block_state bs
  cross join pair_state ps
  cross join relationship_state rs
  cross join connection_count cc
  left join competitive_profile_row cpr on true
  cross join role_profiles rp
  cross join hero_pools hp
  cross join featured_clips fc
  cross join badges bd
  cross join recent_posts rps;
$$;

revoke all on function public.get_profile_page_dto(text, uuid) from public;
grant execute on function public.get_profile_page_dto(text, uuid) to anon, authenticated;
