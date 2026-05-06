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

  return jsonb_build_object(
    'updated', true,
    'error_code', null,
    'invite_id', v_invite.id,
    'status', 'accepted'
  );
end;
$$;

create or replace function public.decline_play_invite(
  p_invite_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite record;
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

  update public.play_invites
  set
    status = 'declined',
    updated_at = now(),
    responded_at = now(),
    declined_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'updated', true,
    'error_code', null,
    'invite_id', v_invite.id,
    'status', 'declined'
  );
end;
$$;

create or replace function public.cancel_play_invite(
  p_invite_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite record;
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

  if v_invite.sender_profile_id <> auth.uid() then
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

  update public.play_invites
  set
    status = 'cancelled',
    updated_at = now(),
    cancelled_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'updated', true,
    'error_code', null,
    'invite_id', v_invite.id,
    'status', 'cancelled'
  );
end;
$$;

create or replace function public.expire_play_invites(
  p_invite_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expired_count integer := 0;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'expired_count', 0,
      'error_code', 'unauthenticated'
    );
  end if;

  update public.play_invites
  set
    status = 'expired',
    updated_at = now()
  where status = 'pending'
    and expires_at <= now()
    and (
      sender_profile_id = auth.uid()
      or recipient_profile_id = auth.uid()
    )
    and (
      p_invite_id is null
      or id = p_invite_id
    );

  get diagnostics v_expired_count = row_count;

  return jsonb_build_object(
    'expired_count', v_expired_count,
    'error_code', null
  );
end;
$$;

revoke all on function public.accept_play_invite(uuid) from public;
revoke all on function public.decline_play_invite(uuid) from public;
revoke all on function public.cancel_play_invite(uuid) from public;
revoke all on function public.expire_play_invites(uuid) from public;

grant execute on function public.accept_play_invite(uuid) to authenticated;
grant execute on function public.decline_play_invite(uuid) to authenticated;
grant execute on function public.cancel_play_invite(uuid) to authenticated;
grant execute on function public.expire_play_invites(uuid) to authenticated;
