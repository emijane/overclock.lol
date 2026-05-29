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

  perform public.refresh_duo_chat_thread_lock_state(p_thread_id);

  select jsonb_build_object(
    'id', summary.thread_id,
    'threadType', summary.thread_type,
    'sourceInviteId', summary.source_invite_id,
    'sourceLfgPostId', summary.source_lfg_post_id,
    'sourcePostTitle', summary.source_post_title,
    'peerProfileId', summary.peer_profile_id,
    'peerDisplayName', summary.peer_display_name,
    'peerAvatarUrl', summary.peer_avatar_url,
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
      coalesce(
        peer.avatar_snapshot,
        peer_profile.discord_avatar_url,
        peer_profile.avatar_url
      ) as peer_avatar_url,
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

revoke all on function public.get_social_thread_dto(uuid) from public;
grant execute on function public.get_social_thread_dto(uuid) to authenticated;

do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when others then null;
end;
$$;
