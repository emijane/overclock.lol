create or replace function public.get_social_threads_dto()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_threads jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('threads', '[]'::jsonb);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', summary.thread_id,
        'threadType', summary.thread_type,
        'sourceInviteId', summary.source_invite_id,
        'sourceLfgPostId', summary.source_lfg_post_id,
        'sourcePostTitle', summary.source_post_title,
        'peerProfileId', summary.peer_profile_id,
        'peerDisplayName', summary.peer_display_name,
        'peerAvatarSnapshot', summary.peer_avatar_snapshot,
        'peerAvatarPath', summary.peer_avatar_path,
        'peerAvatarUpdatedAt', summary.peer_avatar_updated_at,
        'peerDiscordAvatarUrl', summary.peer_discord_avatar_url,
        'peerDiscordUsername', summary.peer_discord_username,
        'peerBattlenetHandle', summary.peer_battlenet_handle,
        'peerUsername', summary.peer_username,
        'lastMessageAt', summary.last_message_at,
        'lastMessagePreview', summary.last_message_preview,
        'lockedAt', summary.locked_at,
        'lockReason', summary.lock_reason
      )
      order by summary.sort_last_message_at desc, summary.sort_created_at desc
    ),
    '[]'::jsonb
  )
  into v_threads
  from (
    select
      ct.id as thread_id,
      ct.thread_type,
      ct.source_invite_id,
      ct.source_lfg_post_id,
      ct.created_at as sort_created_at,
      coalesce(ct.last_message_at, ct.created_at) as sort_last_message_at,
      ct.last_message_at,
      ct.locked_at,
      ct.lock_reason,
      lp.title as source_post_title,
      peer.profile_id as peer_profile_id,
      coalesce(
        peer.display_name_snapshot,
        peer_profile.display_name,
        peer_profile.username
      ) as peer_display_name,
      peer.avatar_snapshot as peer_avatar_snapshot,
      peer_profile.avatar_url as peer_avatar_path,
      peer_profile.avatar_updated_at as peer_avatar_updated_at,
      peer_profile.discord_avatar_url as peer_discord_avatar_url,
      peer_profile.discord_username as peer_discord_username,
      peer_profile.battlenet_handle as peer_battlenet_handle,
      peer_profile.username as peer_username,
      left(latest_message.body, 120) as last_message_preview
    from public.chat_threads ct
    join public.chat_participants self_participant
      on self_participant.thread_id = ct.id
     and self_participant.profile_id = auth.uid()
    join public.chat_participants peer
      on peer.thread_id = ct.id
     and peer.profile_id <> auth.uid()
    left join public.profiles peer_profile
      on peer_profile.id = peer.profile_id
    left join public.lfg_posts lp
      on lp.id = ct.source_lfg_post_id
    left join lateral (
      select cm.body
      from public.chat_messages cm
      where cm.thread_id = ct.id
        and cm.deleted_at is null
      order by cm.created_at desc, cm.id desc
      limit 1
    ) latest_message on true
    where public.can_read_chat_thread(ct.id, auth.uid())
  ) summary;

  return jsonb_build_object('threads', v_threads);
end;
$$;

create or replace function public.get_social_thread_dto(
  p_thread_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_thread jsonb := null;
begin
  if auth.uid() is null or p_thread_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', summary.thread_id,
    'threadType', summary.thread_type,
    'sourceInviteId', summary.source_invite_id,
    'sourceLfgPostId', summary.source_lfg_post_id,
    'sourcePostTitle', summary.source_post_title,
    'peerProfileId', summary.peer_profile_id,
    'peerDisplayName', summary.peer_display_name,
    'peerAvatarSnapshot', summary.peer_avatar_snapshot,
    'peerAvatarPath', summary.peer_avatar_path,
    'peerAvatarUpdatedAt', summary.peer_avatar_updated_at,
    'peerDiscordAvatarUrl', summary.peer_discord_avatar_url,
    'peerDiscordUsername', summary.peer_discord_username,
    'peerBattlenetHandle', summary.peer_battlenet_handle,
    'peerUsername', summary.peer_username,
    'lastMessageAt', summary.last_message_at,
    'lastMessagePreview', summary.last_message_preview,
    'lockedAt', summary.locked_at,
    'lockReason', summary.lock_reason
  )
  into v_thread
  from (
    select
      ct.id as thread_id,
      ct.thread_type,
      ct.source_invite_id,
      ct.source_lfg_post_id,
      ct.last_message_at,
      ct.locked_at,
      ct.lock_reason,
      lp.title as source_post_title,
      peer.profile_id as peer_profile_id,
      coalesce(
        peer.display_name_snapshot,
        peer_profile.display_name,
        peer_profile.username
      ) as peer_display_name,
      peer.avatar_snapshot as peer_avatar_snapshot,
      peer_profile.avatar_url as peer_avatar_path,
      peer_profile.avatar_updated_at as peer_avatar_updated_at,
      peer_profile.discord_avatar_url as peer_discord_avatar_url,
      peer_profile.discord_username as peer_discord_username,
      peer_profile.battlenet_handle as peer_battlenet_handle,
      peer_profile.username as peer_username,
      left(latest_message.body, 120) as last_message_preview
    from public.chat_threads ct
    join public.chat_participants self_participant
      on self_participant.thread_id = ct.id
     and self_participant.profile_id = auth.uid()
    join public.chat_participants peer
      on peer.thread_id = ct.id
     and peer.profile_id <> auth.uid()
    left join public.profiles peer_profile
      on peer_profile.id = peer.profile_id
    left join public.lfg_posts lp
      on lp.id = ct.source_lfg_post_id
    left join lateral (
      select cm.body
      from public.chat_messages cm
      where cm.thread_id = ct.id
        and cm.deleted_at is null
      order by cm.created_at desc, cm.id desc
      limit 1
    ) latest_message on true
    where ct.id = p_thread_id
      and public.can_read_chat_thread(ct.id, auth.uid())
    limit 1
  ) summary;

  return v_thread;
end;
$$;
