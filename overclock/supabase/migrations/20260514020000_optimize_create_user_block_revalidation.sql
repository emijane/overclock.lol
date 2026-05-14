create or replace function public.create_user_block(
  p_blocked_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_username text := null;
  v_created boolean := false;
  v_declined_request_count integer := 0;
  v_disconnected_connection_count integer := 0;
  v_existing_block_id uuid;
  v_pending_invite_count integer := 0;
  v_target_username text := null;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'actor_username', null,
      'blocked', false,
      'created', false,
      'error_code', 'unauthenticated',
      'target_username', null
    );
  end if;

  if p_blocked_profile_id is null then
    return jsonb_build_object(
      'actor_username', null,
      'blocked', false,
      'created', false,
      'error_code', 'invalid_target',
      'target_username', null
    );
  end if;

  if auth.uid() = p_blocked_profile_id then
    select p.username
    into v_actor_username
    from public.profiles p
    where p.id = auth.uid()
    limit 1;

    return jsonb_build_object(
      'actor_username', v_actor_username,
      'blocked', false,
      'created', false,
      'error_code', 'self_block',
      'target_username', v_actor_username
    );
  end if;

  select
    max(case when p.id = auth.uid() then p.username end),
    max(case when p.id = p_blocked_profile_id then p.username end)
  into v_actor_username, v_target_username
  from public.profiles p
  where p.id = any(array[auth.uid(), p_blocked_profile_id]);

  if v_target_username is null then
    return jsonb_build_object(
      'actor_username', v_actor_username,
      'blocked', false,
      'created', false,
      'error_code', 'target_not_found',
      'target_username', null
    );
  end if;

  if (
    select count(*)
    from public.user_block_events
    where actor_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 20 then
    return jsonb_build_object(
      'actor_username', v_actor_username,
      'blocked', false,
      'created', false,
      'error_code', 'rate_limited',
      'target_username', v_target_username
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext('user_block_pair'),
    hashtext(
      least(auth.uid(), p_blocked_profile_id)::text
      || ':'
      || greatest(auth.uid(), p_blocked_profile_id)::text
    )
  );

  select id
  into v_existing_block_id
  from public.user_blocks
  where blocker_profile_id = auth.uid()
    and blocked_profile_id = p_blocked_profile_id
  limit 1;

  if v_existing_block_id is null then
    insert into public.user_blocks (
      blocker_profile_id,
      blocked_profile_id
    )
    values (
      auth.uid(),
      p_blocked_profile_id
    );

    v_created := true;
  end if;

  update public.play_invites
  set
    status = 'cancelled',
    updated_at = now(),
    cancelled_at = now()
  where status = 'pending'
    and (
      (sender_profile_id = auth.uid() and recipient_profile_id = p_blocked_profile_id)
      or (sender_profile_id = p_blocked_profile_id and recipient_profile_id = auth.uid())
    );

  get diagnostics v_pending_invite_count = row_count;

  update public.stack_requests
  set
    status = 'declined',
    updated_at = now(),
    responded_at = now(),
    declined_at = now()
  where status = 'pending'
    and (
      (owner_profile_id = auth.uid() and requester_profile_id = p_blocked_profile_id)
      or (owner_profile_id = p_blocked_profile_id and requester_profile_id = auth.uid())
    );

  get diagnostics v_declined_request_count = row_count;

  update public.profile_connections
  set
    disconnected_at = now(),
    disconnected_by_profile_id = auth.uid(),
    updated_at = now()
  where disconnected_at is null
    and profile_low_id = least(auth.uid(), p_blocked_profile_id)
    and profile_high_id = greatest(auth.uid(), p_blocked_profile_id);

  get diagnostics v_disconnected_connection_count = row_count;

  insert into public.user_block_events (
    actor_profile_id,
    target_profile_id,
    action
  )
  values (
    auth.uid(),
    p_blocked_profile_id,
    'block'
  );

  return jsonb_build_object(
    'actor_username', v_actor_username,
    'blocked', true,
    'created', v_created,
    'declined_request_count', v_declined_request_count,
    'disconnected_connection_count', v_disconnected_connection_count,
    'error_code', null,
    'pending_invite_count', v_pending_invite_count,
    'target_username', v_target_username
  );
end;
$$;

revoke all on function public.create_user_block(uuid) from public;
grant execute on function public.create_user_block(uuid) to authenticated;
