-- If two profiles are already connected and the recipient accepts a second
-- pending invite from the same sender (possible when the sender had multiple
-- active LFG posts), mark that invite as accepted so it is cleaned up, but
-- leave the existing profile_connections row untouched.

create or replace function public.accept_play_invite(
  p_invite_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite record;
  v_recipient_profile record;
  v_connection_low_id uuid;
  v_connection_high_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'unauthenticated',
      'invite_id', null,
      'status', null
    );
  end if;

  if p_invite_id is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'invalid_invite',
      'invite_id', null,
      'status', null
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext('play_invite_transition'),
    hashtext(p_invite_id::text)
  );

  select
    id,
    status,
    sender_profile_id,
    recipient_profile_id,
    expires_at
  into v_invite
  from public.play_invites
  where id = p_invite_id
  for update;

  if v_invite.id is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'invite_not_found',
      'invite_id', null,
      'status', null
    );
  end if;

  if v_invite.recipient_profile_id <> auth.uid() then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'forbidden',
      'invite_id', v_invite.id,
      'status', v_invite.status
    );
  end if;

  if v_invite.status = 'pending' and v_invite.expires_at <= now() then
    update public.play_invites
    set
      status = 'expired',
      updated_at = now()
    where id = v_invite.id;

    return jsonb_build_object(
      'updated', false,
      'error_code', 'invite_expired',
      'invite_id', v_invite.id,
      'status', 'expired'
    );
  end if;

  if v_invite.status <> 'pending' then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'invalid_state',
      'invite_id', v_invite.id,
      'status', v_invite.status
    );
  end if;

  -- If these two profiles are already connected, clean up this extra invite
  -- without touching the existing connection row.
  v_connection_low_id := least(v_invite.sender_profile_id, v_invite.recipient_profile_id);
  v_connection_high_id := greatest(v_invite.sender_profile_id, v_invite.recipient_profile_id);

  if exists (
    select 1
    from public.profile_connections
    where profile_low_id = v_connection_low_id
      and profile_high_id = v_connection_high_id
      and disconnected_at is null
  ) then
    update public.play_invites
    set
      status = 'accepted',
      updated_at = now(),
      responded_at = now(),
      accepted_at = now()
    where id = v_invite.id;

    return jsonb_build_object(
      'updated', true,
      'error_code', null,
      'invite_id', v_invite.id,
      'status', 'accepted'
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
  into v_recipient_profile
  from public.profiles p
  left join public.competitive_profiles cp
    on cp.profile_id = p.id
  where p.id = auth.uid();

  if v_recipient_profile.id is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'recipient_not_found',
      'invite_id', v_invite.id,
      'status', v_invite.status
    );
  end if;

  update public.play_invites
  set
    status = 'accepted',
    updated_at = now(),
    responded_at = now(),
    accepted_at = now(),
    recipient_snapshot = jsonb_build_object(
      'avatar_url', v_recipient_profile.discord_avatar_url,
      'display_name', v_recipient_profile.display_name,
      'main_role', v_recipient_profile.main_role,
      'rank_division', v_recipient_profile.current_rank_division,
      'rank_tier', v_recipient_profile.current_rank_tier,
      'region', v_recipient_profile.region,
      'username', v_recipient_profile.username
    )
  where id = v_invite.id;

  insert into public.profile_connections (
    profile_low_id,
    profile_high_id,
    created_from_invite_id,
    connected_at,
    updated_at,
    disconnected_at,
    disconnected_by_profile_id
  )
  values (
    v_connection_low_id,
    v_connection_high_id,
    v_invite.id,
    now(),
    now(),
    null,
    null
  )
  on conflict (profile_low_id, profile_high_id)
  do update
  set
    created_from_invite_id = excluded.created_from_invite_id,
    connected_at = excluded.connected_at,
    updated_at = excluded.updated_at,
    disconnected_at = null,
    disconnected_by_profile_id = null;

  return jsonb_build_object(
    'updated', true,
    'error_code', null,
    'invite_id', v_invite.id,
    'status', 'accepted'
  );
end;
$$;

revoke all on function public.accept_play_invite(uuid) from public;
grant execute on function public.accept_play_invite(uuid) to authenticated;
