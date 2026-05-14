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
  v_viewer_profile_id uuid := p_viewer_profile_id;
  v_blocked_profile_ids uuid[] := array[]::uuid[];
  v_posts jsonb := '[]'::jsonb;
  v_viewer_bundle jsonb := null;
begin
  if p_lfg_type not in ('duos', 'stacks', 'teams', 'scrims') then
    return jsonb_build_object(
      'errorCode', 'invalid_lfg_type',
      'posts', '[]'::jsonb,
      'viewerBundle', null
    );
  end if;

  if auth.uid() is not null and v_viewer_profile_id is not null and auth.uid() <> v_viewer_profile_id then
    return jsonb_build_object(
      'errorCode', 'forbidden',
      'posts', '[]'::jsonb,
      'viewerBundle', null
    );
  end if;

  if auth.uid() is not null and v_viewer_profile_id is null then
    v_viewer_profile_id := auth.uid();
  end if;

  if v_viewer_profile_id is not null then
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
            when exists (
              select 1
              from public.profile_connections pc
              where pc.disconnected_at is null
                and pc.profile_low_id = least(v_viewer_profile_id, fp.profile_id)
                and pc.profile_high_id = greatest(v_viewer_profile_id, fp.profile_id)
            ) then 'connected'
            when exists (
              select 1
              from public.play_invites pi
              where pi.sender_profile_id = v_viewer_profile_id
                and pi.recipient_profile_id = fp.profile_id
                and pi.source_lfg_post_id = fp.id
                and pi.status = 'pending'
                and pi.expires_at > now()
            ) then 'invite_sent'
            else 'invite_to_play'
          end,
        'stackRequestState',
          case
            when fp.lfg_type <> 'stacks' or v_viewer_profile_id is null or fp.profile_id is null or fp.profile_id = v_viewer_profile_id then 'none'
            when exists (
              select 1
              from public.stack_members sm
              where sm.post_id = fp.id
                and sm.profile_id = v_viewer_profile_id
                and sm.removed_at is null
            ) then 'accepted'
            else coalesce((
              select sr.status
              from public.stack_requests sr
              where sr.post_id = fp.id
                and sr.requester_profile_id = v_viewer_profile_id
              order by sr.created_at desc
              limit 1
            ), 'none')
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
  left join stack_member_sets sms on sms.post_id = fp.id;

  if v_viewer_profile_id is not null then
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
        'mainRole', (
          select cp.main_role
          from public.competitive_profiles cp
          where cp.profile_id = v_viewer_profile_id
          limit 1
        ),
        'platform', (
          select cp.platform
          from public.competitive_profiles cp
          where cp.profile_id = v_viewer_profile_id
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

create or replace function public.get_account_posts_page_dto(
  p_profile_id uuid,
  p_status text default 'all',
  p_page integer default 1,
  p_page_size integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active_cutoff timestamptz := now() - interval '12 hours';
  v_safe_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := greatest(coalesce(p_page_size, 10), 1);
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'errorCode', 'unauthenticated',
      'posts', '[]'::jsonb
    );
  end if;

  if p_profile_id is null or p_profile_id <> auth.uid() then
    return jsonb_build_object(
      'errorCode', 'forbidden',
      'posts', '[]'::jsonb
    );
  end if;

  return (
    with labeled_posts as (
      select
        lp.id,
        lp.created_at,
        lp.game_mode,
        lp.hero_pool_snapshot,
        lp.lfg_type,
        lp.posting_role,
        lp.snapshot_rank_division,
        lp.snapshot_rank_tier,
        lp.status,
        lp.title,
        case
          when lp.status in ('closed', 'archived') then 'closed'
          when lp.status = 'expired' then 'expired'
          when lp.created_at < v_active_cutoff then 'expired'
          else 'active'
        end as display_status
      from public.lfg_posts lp
      where lp.profile_id = p_profile_id
        and lp.status <> 'archived'
    ),
    counts as (
      select
        count(*)::integer as total_count,
        count(*) filter (where display_status = 'active')::integer as active_count,
        count(*) filter (where display_status = 'closed')::integer as closed_count,
        count(*) filter (where display_status = 'expired')::integer as expired_count
      from labeled_posts
    ),
    filtered_posts as (
      select *
      from labeled_posts
      where p_status = 'all' or display_status = p_status
      order by created_at desc
    ),
    paginated_posts as (
      select *
      from filtered_posts
      offset (v_safe_page - 1) * v_page_size
      limit v_page_size
    )
    select jsonb_build_object(
      'counts', jsonb_build_object(
        'all', c.total_count,
        'active', c.active_count,
        'closed', c.closed_count,
        'expired', c.expired_count
      ),
      'pagination', jsonb_build_object(
        'currentPage', v_safe_page,
        'pageSize', v_page_size,
        'totalItems', (
          select count(*)::integer
          from filtered_posts
        ),
        'totalPages', greatest(
          1,
          ceil(
            coalesce((select count(*)::numeric from filtered_posts), 0)
            / v_page_size::numeric
          )::integer
        )
      ),
      'posts', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', pp.id,
            'createdAt', pp.created_at,
            'gameMode', pp.game_mode,
            'heroPool', coalesce(pp.hero_pool_snapshot, '[]'::jsonb),
            'lfgType', pp.lfg_type,
            'postingRole', pp.posting_role,
            'rankDivision', pp.snapshot_rank_division,
            'rankTier', pp.snapshot_rank_tier,
            'status', pp.status,
            'displayStatus', pp.display_status,
            'title', pp.title
          )
          order by pp.created_at desc
        )
        from paginated_posts pp
      ), '[]'::jsonb)
    )
    from counts c
  );
end;
$$;

revoke all on function public.get_account_posts_page_dto(uuid, text, integer, integer) from public;
grant execute on function public.get_account_posts_page_dto(uuid, text, integer, integer) to authenticated;

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
  v_blocked_profile_ids uuid[] := array[]::uuid[];
begin
  if auth.uid() is not null and p_viewer_profile_id is not null and auth.uid() <> p_viewer_profile_id then
    return '[]'::jsonb;
  end if;

  if p_viewer_profile_id is not null then
    v_blocked_profile_ids := public.get_blocked_profile_ids_for_viewer(p_viewer_profile_id);
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

revoke all on function public.search_public_profiles_dto(text, integer, uuid) from public;
grant execute on function public.search_public_profiles_dto(text, integer, uuid) to anon, authenticated;
