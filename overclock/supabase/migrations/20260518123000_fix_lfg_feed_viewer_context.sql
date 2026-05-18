-- Reapply the hardened viewer-context rules for the public LFG feed DTO.
-- Why: 20260515030000 switched the feed to expires_at, but its function rewrite
-- restored p_viewer_profile_id trust for anonymous callers. That let guests
-- inject a viewer profile id and influence block filtering plus viewerBundle.

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
  v_current_user_id      uuid := auth.uid();
  v_viewer_profile_id    uuid := null;
  v_blocked_profile_ids  uuid[] := array[]::uuid[];
  v_posts                jsonb := '[]'::jsonb;
  v_viewer_bundle        jsonb := null;
  v_cp_main_role         text;
  v_cp_platform          text;
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
      and lp.expires_at > now()
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
          and lp.expires_at > now()
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

revoke all on function public.get_lfg_feed_page_dto(text, uuid, text, text, text, text, text, text[]) from public;
grant execute on function public.get_lfg_feed_page_dto(text, uuid, text, text, text, text, text, text[]) to anon, authenticated;
