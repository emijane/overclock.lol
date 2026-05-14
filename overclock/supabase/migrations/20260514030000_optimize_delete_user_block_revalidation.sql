create or replace function public.delete_user_block(
  p_blocked_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_username text := null;
  v_removed_count integer := 0;
  v_target_username text := null;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'actor_username', null,
      'error_code', 'unauthenticated',
      'removed', false,
      'target_username', null,
      'unblocked', false
    );
  end if;

  if p_blocked_profile_id is null then
    select p.username
    into v_actor_username
    from public.profiles p
    where p.id = auth.uid()
    limit 1;

    return jsonb_build_object(
      'actor_username', v_actor_username,
      'error_code', 'invalid_target',
      'removed', false,
      'target_username', null,
      'unblocked', false
    );
  end if;

  select
    max(case when p.id = auth.uid() then p.username end),
    max(case when p.id = p_blocked_profile_id then p.username end)
  into v_actor_username, v_target_username
  from public.profiles p
  where p.id = any(array[auth.uid(), p_blocked_profile_id]);

  if (
    select count(*)
    from public.user_block_events
    where actor_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 20 then
    return jsonb_build_object(
      'actor_username', v_actor_username,
      'error_code', 'rate_limited',
      'removed', false,
      'target_username', v_target_username,
      'unblocked', false
    );
  end if;

  delete from public.user_blocks
  where blocker_profile_id = auth.uid()
    and blocked_profile_id = p_blocked_profile_id;

  get diagnostics v_removed_count = row_count;

  insert into public.user_block_events (
    actor_profile_id,
    target_profile_id,
    action
  )
  values (
    auth.uid(),
    p_blocked_profile_id,
    'unblock'
  );

  return jsonb_build_object(
    'actor_username', v_actor_username,
    'error_code', null,
    'removed', v_removed_count > 0,
    'target_username', v_target_username,
    'unblocked', true
  );
end;
$$;

revoke all on function public.delete_user_block(uuid) from public;
grant execute on function public.delete_user_block(uuid) to authenticated;
