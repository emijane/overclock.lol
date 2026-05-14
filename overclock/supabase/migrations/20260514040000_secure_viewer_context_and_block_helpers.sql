create or replace function public.is_profile_blocked_by(
  p_blocker_profile_id uuid,
  p_blocked_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    auth.uid() is not null
    and (
      p_blocker_profile_id = auth.uid()
      or p_blocked_profile_id = auth.uid()
    )
    and exists (
      select 1
      from public.user_blocks
      where blocker_profile_id = p_blocker_profile_id
        and blocked_profile_id = p_blocked_profile_id
    );
$$;

create or replace function public.has_either_user_blocked(
  p_profile_a uuid,
  p_profile_b uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    auth.uid() is not null
    and (
      p_profile_a = auth.uid()
      or p_profile_b = auth.uid()
    )
    and exists (
      select 1
      from public.user_blocks
      where (blocker_profile_id = p_profile_a and blocked_profile_id = p_profile_b)
         or (blocker_profile_id = p_profile_b and blocked_profile_id = p_profile_a)
    );
$$;

create or replace function public.are_profiles_blocked(
  p_profile_a uuid,
  p_profile_b uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.has_either_user_blocked(p_profile_a, p_profile_b);
$$;

create or replace function public.get_blocked_profile_ids_for_viewer(
  p_viewer_profile_id uuid
)
returns uuid[]
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    case
      when auth.uid() is null or p_viewer_profile_id is distinct from auth.uid()
        then array[]::uuid[]
      else coalesce(
        (
          select array_agg(distinct blocked_profile_id)
          from (
            select ub.blocked_profile_id
            from public.user_blocks ub
            where ub.blocker_profile_id = p_viewer_profile_id

            union

            select ub.blocker_profile_id as blocked_profile_id
            from public.user_blocks ub
            where ub.blocked_profile_id = p_viewer_profile_id
          ) blocked_pairs
        ),
        array[]::uuid[]
      )
    end;
$$;

create or replace function public.get_lfg_feed_page_dto(
  p_lfg_type text,
  p_viewer_profile_id uuid default null,
  p_role text default null,
  p_looking_for text default null,
  p_mode text default null,
  p_region text default null,
  p_search text default null,
  p_rank_tiers text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_cutoff timestamptz := now() - interval '12 hours';
  v_current_user_id uuid := auth.uid();
  v_viewer_profile_id uuid := null;
  v_blocked_profile_ids uuid[] := array[]::uuid[];
  v_posts jsonb := '[]'::jsonb;
  v_viewer_bundle jsonb := null;
  v_cp_main_role text;
  v_cp_platform text;
begin
  if p_lfg_type not in ('duos', 'stacks', 'teams', 'scrims') then
    return jsonb_build_object(
      'errorCode', 'invalid_lfg_type',
      'posts', '[]'::jsonb,
      'viewerBundle', null
    );
  end if;

  if v_current_user_id is null then
    v_viewer_profile_id := null;
  else
    if p_viewer_profile_id is not null and p_viewer_profile_id <> v_current_user_id then
      return jsonb_build_object(
        'errorCode', 'forbidden',
        'posts', '[]'::jsonb,
        'viewerBundle', null
      );
    end if;

    v_viewer_profile_id := coalesce(p_viewer_profile_id, v_current_user_id);
    v_blocked_profile_ids := public.get_blocked_profile_ids_for_viewer(v_viewer_profile_id);
  end if;

  with feed_posts as (
    select lp.*
    from public.lfg_posts lp
    where lp.lfg_type = p_lfg_type
      and (
        case
          when p_lfg_type = 'stacks' then lp.status in ('active', 'filled')
          else lp.status = 'active'
        end
      )
      and lp.created_at >= v_active_cutoff
      and (p_role is null or lp.posting_role = p_role)
      and (p_looking_for is null or coalesce(lp.looking_for_roles, array[]::text[]) @> array[p_looking_for]::text[])
      and (p_mode is null or lp.game_mode = p_mode)
      and (p_region is null or lp.snapshot_region = p_region)
      and (
        p_search is null
        or lp.title ilike ('%' || replace(replace(replace(p_search, '\', '\\'), '%', '\%'), '_', '\_') || '%') escape '\'
      )
      and (p_rank_tiers is null or lp.snapshot_rank_tier = any(p_rank_tiers))
      and not (lp.profile_id = any(v_blocked_profile_ids))
    order by lp.created_at desc
    limit 30
  ),
  badge_sets as (
    select
      pb.profile_id,
      jsonb_agg(
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
      ) as badges
    from public.profile_badges pb
    join public.badges b on b.id = pb.badge_id
    where pb.profile_id in (
      select distinct fp.profile_id
      from feed_posts fp
      where fp.profile_id is not null
    )
    group by pb.profile_id
  ),
  stack_member_sets as (
    select
      sm.post_id,
      jsonb_agg(
        jsonb_build_object(
          'profileId', member.id,
          'username', member.username,
          'displayName', member.display_name,
          'avatarUrl', member.avatar_url,
          'avatarUpdatedAt', member.avatar_updated_at,
          'rankTier', member.current_rank_tier,
          'rankDivision', member.current_rank_division,
          'role', sm.role,
          'isOwner', sm.is_owner
        )
        order by sm.is_owner desc, sm.joined_at asc
      ) as members
    from public.stack_members sm
    join public.profiles member on member.id = sm.profile_id
    where sm.post_id in (select fp.id from feed_posts fp where fp.lfg_type = 'stacks')
      and sm.removed_at is null
      and not (sm.profile_id = any(v_blocked_profile_ids))
    group by sm.post_id
  ),
  viewer_connections as (
    select
      case
        when pc.profile_low_id = v_viewer_profile_id then pc.profile_high_id
        else pc.profile_low_id
      end as author_profile_id
    from public.profile_connections pc
    where v_viewer_profile_id is not null
      and pc.disconnected_at is null
      and (pc.profile_low_id = v_viewer_profile_id or pc.profile_high_id = v_viewer_profile_id)
      and (
        case
          when pc.profile_low_id = v_viewer_profile_id then pc.profile_high_id
          else pc.profile_low_id
        end
      ) in (select distinct fp.profile_id from feed_posts fp where fp.profile_id is not null)
  ),
  viewer_invites as (
    select pi.source_lfg_post_id, pi.recipient_profile_id
    from public.play_invites pi
    where v_viewer_profile_id is not null
      and pi.sender_profile_id = v_viewer_profile_id
      and pi.status = 'pending'
      and pi.expires_at > now()
      and pi.source_lfg_post_id in (select fp.id from feed_posts fp)
  ),
  viewer_stack_memberships as (
    select sm.post_id
    from public.stack_members sm
    where v_viewer_profile_id is not null
      and sm.profile_id = v_viewer_profile_id
      and sm.removed_at is null
      and sm.post_id in (select fp.id from feed_posts fp where fp.lfg_type = 'stacks')
  ),
  viewer_stack_requests as (
    select distinct on (sr.post_id) sr.post_id, sr.status
    from public.stack_requests sr
    where v_viewer_profile_id is not null
      and sr.requester_profile_id = v_viewer_profile_id
      and sr.post_id in (select fp.id from feed_posts fp where fp.lfg_type = 'stacks')
    order by sr.post_id, sr.created_at desc
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', fp.id,
        'profileId', fp.profile_id,
        'lfgType', fp.lfg_type,
        'gameMode', fp.game_mode,
        'title', fp.title,
        'status', fp.status,
        'lookingForRoles', coalesce(fp.looking_for_roles, array[]::text[]),
        'postingRole', fp.posting_role,
        'platform', fp.snapshot_platform,
        'rankTier', fp.snapshot_rank_tier,
        'rankDivision', fp.snapshot_rank_division,
        'region', fp.snapshot_region,
        'timezone', fp.snapshot_timezone,
        'heroPool', coalesce(fp.hero_pool_snapshot, '[]'::jsonb),
        'createdAt', fp.created_at,
        'maxGroupSize', fp.max_group_size,
        'currentMemberCount', coalesce(fp.current_member_count, 1),
        'author', jsonb_build_object(
          'username', author.username,
          'displayName', author.display_name,
          'avatarUrl', author.avatar_url,
          'avatarUpdatedAt', author.avatar_updated_at,
          'coverImagePath', author.cover_image_path,
          'coverImageUpdatedAt', author.cover_image_updated_at,
          'lastSeenAt', author.last_seen_at,
          'isLookingToPlay', coalesce(author.is_looking_to_play, false),
          'hideOfflinePresence', coalesce(author.hide_offline_presence, false),
          'badges', coalesce(bs.badges, '[]'::jsonb)
        ),
        'stackMembers', coalesce(sms.members, '[]'::jsonb),
        'inviteState',
          case
            when v_viewer_profile_id is null or fp.profile_id is null or fp.profile_id = v_viewer_profile_id then 'invite_to_play'
            when vc.author_profile_id is not null then 'connected'
            when vi.source_lfg_post_id is not null then 'invite_sent'
            else 'invite_to_play'
          end,
        'stackRequestState',
          case
            when fp.lfg_type <> 'stacks' or v_viewer_profile_id is null or fp.profile_id is null or fp.profile_id = v_viewer_profile_id then 'none'
            when vsm.post_id is not null then 'accepted'
            else coalesce(vsr.status, 'none')
          end
      )
      order by fp.created_at desc
    ),
    '[]'::jsonb
  )
  into v_posts
  from feed_posts fp
  join public.profiles author on author.id = fp.profile_id
  left join badge_sets bs on bs.profile_id = fp.profile_id
  left join stack_member_sets sms on sms.post_id = fp.id
  left join viewer_connections vc on vc.author_profile_id = fp.profile_id
  left join viewer_invites vi on vi.source_lfg_post_id = fp.id and vi.recipient_profile_id = fp.profile_id
  left join viewer_stack_memberships vsm on vsm.post_id = fp.id
  left join viewer_stack_requests vsr on vsr.post_id = fp.id;

  if v_viewer_profile_id is not null then
    select cp.main_role, cp.platform
    into v_cp_main_role, v_cp_platform
    from public.competitive_profiles cp
    where cp.profile_id = v_viewer_profile_id
    limit 1;

    v_viewer_bundle := jsonb_build_object(
      'activePostCounts', (
        select jsonb_build_object(
          'tank', count(*) filter (where lp.posting_role = 'tank'),
          'dps', count(*) filter (where lp.posting_role = 'dps'),
          'support', count(*) filter (where lp.posting_role = 'support')
        )
        from public.lfg_posts lp
        where lp.profile_id = v_viewer_profile_id
          and lp.lfg_type = p_lfg_type
          and lp.created_at >= v_active_cutoff
          and (
            case
              when p_lfg_type = 'stacks' then lp.status in ('active', 'filled')
              else lp.status = 'active'
            end
          )
      ),
      'competitiveProfile', jsonb_build_object(
        'profileId', v_viewer_profile_id,
        'mainRole', v_cp_main_role,
        'platform', v_cp_platform,
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
          where crp.profile_id = v_viewer_profile_id
        ), '[]'::jsonb)
      ),
      'heroPools', coalesce((
        select jsonb_build_object(
          'roles', coalesce(php.roles, array[]::text[]),
          'heroPicks', coalesce(
            php.hero_picks,
            jsonb_build_object('tank', '[]'::jsonb, 'dps', '[]'::jsonb, 'support', '[]'::jsonb)
          )
        )
        from public.profile_hero_pools php
        where php.profile_id = v_viewer_profile_id
        limit 1
      ), jsonb_build_object(
        'roles', array[]::text[],
        'heroPicks', jsonb_build_object('tank', '[]'::jsonb, 'dps', '[]'::jsonb, 'support', '[]'::jsonb)
      ))
    );
  end if;

  return jsonb_build_object(
    'posts', v_posts,
    'viewerBundle', v_viewer_bundle
  );
end;
$$;

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
  v_current_user_id uuid := auth.uid();
  v_result jsonb;
begin
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
          and created_at >= now() - interval '12 hours'
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
          'profileId', coalesce(tp.id, ''),
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

create or replace function public.search_public_profiles_dto(
  p_query text,
  p_limit integer default 20,
  p_viewer_profile_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_query text := lower(trim(coalesce(p_query, '')));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 50));
  v_current_user_id uuid := auth.uid();
  v_viewer_profile_id uuid := null;
  v_blocked_profile_ids uuid[] := array[]::uuid[];
begin
  if v_current_user_id is null then
    v_viewer_profile_id := null;
  else
    if p_viewer_profile_id is not null and p_viewer_profile_id <> v_current_user_id then
      raise exception 'forbidden'
        using errcode = '42501';
    end if;

    v_viewer_profile_id := coalesce(p_viewer_profile_id, v_current_user_id);
    v_blocked_profile_ids := public.get_blocked_profile_ids_for_viewer(v_viewer_profile_id);
  end if;

  if char_length(v_query) = 0 then
    return '[]'::jsonb;
  end if;

  return coalesce((
    with matched_profiles as (
      select
        p.username,
        p.display_name,
        p.avatar_url,
        p.avatar_updated_at,
        case
          when lower(p.username) = v_query then 0
          when lower(p.username) like v_query || '%' then 1
          else 2
        end as rank_group
      from public.profiles p
      where p.username is not null
        and (
          lower(p.username) like v_query || '%'
          or lower(coalesce(p.display_name, '')) like '%' || v_query || '%'
        )
        and not (p.id = any(v_blocked_profile_ids))
      order by
        rank_group asc,
        length(p.username) asc,
        p.username asc
      limit v_limit
    )
    select jsonb_agg(
      jsonb_build_object(
        'username', mp.username,
        'displayName', mp.display_name,
        'avatarUrl', mp.avatar_url,
        'avatarUpdatedAt', mp.avatar_updated_at
      )
      order by mp.rank_group asc, length(mp.username) asc, mp.username asc
    )
    from matched_profiles mp
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.expire_stack_posts() from public;
grant execute on function public.expire_stack_posts() to authenticated;

revoke all on function public.update_last_seen() from public;
grant execute on function public.update_last_seen() to authenticated;
