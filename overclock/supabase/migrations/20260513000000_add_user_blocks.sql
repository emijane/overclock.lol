create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_profile_id uuid not null references public.profiles (id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.user_block_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.user_blocks enable row level security;
alter table public.user_block_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_blocks_not_self_check'
      and conrelid = 'public.user_blocks'::regclass
  ) then
    alter table public.user_blocks
      add constraint user_blocks_not_self_check
      check (blocker_profile_id <> blocked_profile_id) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_block_events_action_check'
      and conrelid = 'public.user_block_events'::regclass
  ) then
    alter table public.user_block_events
      add constraint user_block_events_action_check
      check (action in ('block', 'unblock')) not valid;
  end if;
end;
$$;

create unique index if not exists user_blocks_pair_unique_idx
  on public.user_blocks (blocker_profile_id, blocked_profile_id);

create index if not exists user_blocks_blocker_created_idx
  on public.user_blocks (blocker_profile_id, created_at desc);

create index if not exists user_blocks_blocked_created_idx
  on public.user_blocks (blocked_profile_id, created_at desc);

create index if not exists user_block_events_actor_created_idx
  on public.user_block_events (actor_profile_id, created_at desc);

revoke all on table public.user_blocks from anon;
revoke all on table public.user_blocks from authenticated;
grant select, insert, delete on table public.user_blocks to authenticated;

revoke all on table public.user_block_events from anon, authenticated;

drop policy if exists "user_blocks_owner_read" on public.user_blocks;
create policy "user_blocks_owner_read"
on public.user_blocks
for select
to authenticated
using (
  blocker_profile_id = auth.uid()
);

drop policy if exists "user_blocks_owner_insert" on public.user_blocks;
create policy "user_blocks_owner_insert"
on public.user_blocks
for insert
to authenticated
with check (
  blocker_profile_id = auth.uid()
  and blocked_profile_id <> auth.uid()
);

drop policy if exists "user_blocks_owner_delete" on public.user_blocks;
create policy "user_blocks_owner_delete"
on public.user_blocks
for delete
to authenticated
using (
  blocker_profile_id = auth.uid()
);

create or replace function public.is_profile_blocked_by(
  p_blocker_profile_id uuid,
  p_blocked_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
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
  select exists (
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
  select coalesce(
    array_agg(distinct blocked_profile_id),
    array[]::uuid[]
  )
  from (
    select ub.blocked_profile_id
    from public.user_blocks ub
    where ub.blocker_profile_id = p_viewer_profile_id

    union

    select ub.blocker_profile_id as blocked_profile_id
    from public.user_blocks ub
    where ub.blocked_profile_id = p_viewer_profile_id
  ) blocked_pairs;
$$;

create or replace function public.create_user_block(
  p_blocked_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_created boolean := false;
  v_declined_request_count integer := 0;
  v_disconnected_connection_count integer := 0;
  v_existing_block_id uuid;
  v_pending_invite_count integer := 0;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'blocked', false,
      'created', false,
      'error_code', 'unauthenticated'
    );
  end if;

  if p_blocked_profile_id is null then
    return jsonb_build_object(
      'blocked', false,
      'created', false,
      'error_code', 'invalid_target'
    );
  end if;

  if auth.uid() = p_blocked_profile_id then
    return jsonb_build_object(
      'blocked', false,
      'created', false,
      'error_code', 'self_block'
    );
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_blocked_profile_id
  ) then
    return jsonb_build_object(
      'blocked', false,
      'created', false,
      'error_code', 'target_not_found'
    );
  end if;

  if (
    select count(*)
    from public.user_block_events
    where actor_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 20 then
    return jsonb_build_object(
      'blocked', false,
      'created', false,
      'error_code', 'rate_limited'
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext('user_block_pair'),
    hashtext(least(auth.uid(), p_blocked_profile_id)::text || ':' || greatest(auth.uid(), p_blocked_profile_id)::text)
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
    'blocked', true,
    'created', v_created,
    'declined_request_count', v_declined_request_count,
    'disconnected_connection_count', v_disconnected_connection_count,
    'error_code', null,
    'pending_invite_count', v_pending_invite_count
  );
end;
$$;

create or replace function public.delete_user_block(
  p_blocked_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_removed_count integer := 0;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'error_code', 'unauthenticated',
      'removed', false,
      'unblocked', false
    );
  end if;

  if p_blocked_profile_id is null then
    return jsonb_build_object(
      'error_code', 'invalid_target',
      'removed', false,
      'unblocked', false
    );
  end if;

  if (
    select count(*)
    from public.user_block_events
    where actor_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 20 then
    return jsonb_build_object(
      'error_code', 'rate_limited',
      'removed', false,
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
    'error_code', null,
    'removed', v_removed_count > 0,
    'unblocked', true
  );
end;
$$;

revoke all on function public.is_profile_blocked_by(uuid, uuid) from public;
revoke all on function public.has_either_user_blocked(uuid, uuid) from public;
revoke all on function public.are_profiles_blocked(uuid, uuid) from public;
revoke all on function public.get_blocked_profile_ids_for_viewer(uuid) from public;
revoke all on function public.create_user_block(uuid) from public;
revoke all on function public.delete_user_block(uuid) from public;

grant execute on function public.is_profile_blocked_by(uuid, uuid) to authenticated;
grant execute on function public.has_either_user_blocked(uuid, uuid) to authenticated;
grant execute on function public.are_profiles_blocked(uuid, uuid) to authenticated;
grant execute on function public.get_blocked_profile_ids_for_viewer(uuid) to authenticated;
grant execute on function public.create_user_block(uuid) to authenticated;
grant execute on function public.delete_user_block(uuid) to authenticated;

create or replace function public.send_play_invite(
  p_message text,
  p_recipient_profile_id uuid,
  p_source_lfg_post_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection_high_id uuid;
  v_connection_low_id uuid;
  v_invite_id uuid;
  v_normalized_message text := nullif(regexp_replace(trim(coalesce(p_message, '')), '\s+', ' ', 'g'), '');
  v_sender_profile record;
  v_source_post record;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'unauthenticated',
      'invite_id', null
    );
  end if;

  if p_recipient_profile_id is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_recipient',
      'invite_id', null
    );
  end if;

  if auth.uid() = p_recipient_profile_id then
    return jsonb_build_object(
      'created', false,
      'error_code', 'self_invite',
      'invite_id', null
    );
  end if;

  if v_normalized_message is not null and char_length(v_normalized_message) > 280 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_message',
      'invite_id', null
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
  into v_sender_profile
  from public.profiles p
  left join public.competitive_profiles cp
    on cp.profile_id = p.id
  where p.id = auth.uid();

  if v_sender_profile.id is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'sender_not_found',
      'invite_id', null
    );
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_recipient_profile_id
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'recipient_not_found',
      'invite_id', null
    );
  end if;

  if public.has_either_user_blocked(auth.uid(), p_recipient_profile_id) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'blocked_users',
      'invite_id', null
    );
  end if;

  if p_source_lfg_post_id is not null then
    select id, profile_id, status, created_at
    into v_source_post
    from public.lfg_posts
    where id = p_source_lfg_post_id;

    if v_source_post.id is null
      or v_source_post.profile_id <> p_recipient_profile_id
      or v_source_post.status <> 'active'
      or v_source_post.created_at < now() - interval '12 hours' then
      return jsonb_build_object(
        'created', false,
        'error_code', 'invalid_source_post',
        'invite_id', null
      );
    end if;
  end if;

  v_connection_low_id := least(auth.uid(), p_recipient_profile_id);
  v_connection_high_id := greatest(auth.uid(), p_recipient_profile_id);

  if exists (
    select 1
    from public.profile_connections
    where profile_low_id = v_connection_low_id
      and profile_high_id = v_connection_high_id
      and disconnected_at is null
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'already_connected',
      'invite_id', null
    );
  end if;

  if (
    select count(*)
    from public.play_invites
    where sender_profile_id = auth.uid()
      and created_at >= now() - interval '10 minutes'
  ) >= 20 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'send_rate_limited',
      'invite_id', null
    );
  end if;

  if (
    select count(*)
    from public.play_invites
    where sender_profile_id = auth.uid()
      and recipient_profile_id = p_recipient_profile_id
      and created_at >= now() - interval '10 minutes'
  ) >= 5 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'recipient_rate_limited',
      'invite_id', null
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext('play_invite_send'),
    hashtext(
      auth.uid()::text
      || ':'
      || p_recipient_profile_id::text
      || ':'
      || coalesce(p_source_lfg_post_id::text, 'no-post')
    )
  );

  if exists (
    select 1
    from public.play_invites
    where sender_profile_id = auth.uid()
      and recipient_profile_id = p_recipient_profile_id
      and (
        source_lfg_post_id = p_source_lfg_post_id
        or (
          source_lfg_post_id is null
          and p_source_lfg_post_id is null
        )
      )
      and status = 'pending'
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'duplicate_pending_invite',
      'invite_id', null
    );
  end if;

  insert into public.play_invites (
    sender_profile_id,
    recipient_profile_id,
    source_lfg_post_id,
    status,
    message,
    sender_snapshot,
    updated_at
  )
  values (
    auth.uid(),
    p_recipient_profile_id,
    p_source_lfg_post_id,
    'pending',
    v_normalized_message,
    jsonb_build_object(
      'avatar_url', v_sender_profile.discord_avatar_url,
      'display_name', v_sender_profile.display_name,
      'main_role', v_sender_profile.main_role,
      'rank_division', v_sender_profile.current_rank_division,
      'rank_tier', v_sender_profile.current_rank_tier,
      'region', v_sender_profile.region,
      'username', v_sender_profile.username
    ),
    now()
  )
  returning id into v_invite_id;

  return jsonb_build_object(
    'created', true,
    'error_code', null,
    'invite_id', v_invite_id
  );
end;
$$;

create or replace function public.accept_play_invite(
  p_invite_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection_high_id uuid;
  v_connection_low_id uuid;
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

  if public.has_either_user_blocked(v_invite.sender_profile_id, v_invite.recipient_profile_id) then
    update public.play_invites
    set
      status = 'cancelled',
      updated_at = now(),
      cancelled_at = now()
    where id = v_invite.id;

    return jsonb_build_object(
      'updated', false,
      'error_code', 'blocked_users',
      'invite_id', v_invite.id,
      'status', 'cancelled'
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

  v_connection_low_id := least(v_invite.sender_profile_id, v_invite.recipient_profile_id);
  v_connection_high_id := greatest(v_invite.sender_profile_id, v_invite.recipient_profile_id);

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

revoke all on function public.send_play_invite(text, uuid, uuid) from public;
revoke all on function public.accept_play_invite(uuid) from public;

grant execute on function public.send_play_invite(text, uuid, uuid) to authenticated;
grant execute on function public.accept_play_invite(uuid) to authenticated;
