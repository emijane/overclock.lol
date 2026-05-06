create table if not exists public.profile_connections (
  id uuid primary key default gen_random_uuid(),
  profile_low_id uuid not null references public.profiles (id) on delete cascade,
  profile_high_id uuid not null references public.profiles (id) on delete cascade,
  created_from_invite_id uuid references public.play_invites (id) on delete set null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disconnected_at timestamptz,
  disconnected_by_profile_id uuid references public.profiles (id) on delete set null
);

alter table public.profile_connections enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profile_connections_pair_order_check'
      and conrelid = 'public.profile_connections'::regclass
  ) then
    alter table public.profile_connections
      add constraint profile_connections_pair_order_check
      check (profile_low_id < profile_high_id) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profile_connections_disconnected_by_member_check'
      and conrelid = 'public.profile_connections'::regclass
  ) then
    alter table public.profile_connections
      add constraint profile_connections_disconnected_by_member_check
      check (
        disconnected_by_profile_id is null
        or disconnected_by_profile_id = profile_low_id
        or disconnected_by_profile_id = profile_high_id
      ) not valid;
  end if;
end;
$$;

create unique index if not exists profile_connections_pair_unique_idx
  on public.profile_connections (profile_low_id, profile_high_id);

create index if not exists profile_connections_active_low_idx
  on public.profile_connections (profile_low_id, connected_at desc)
  where disconnected_at is null;

create index if not exists profile_connections_active_high_idx
  on public.profile_connections (profile_high_id, connected_at desc)
  where disconnected_at is null;

grant select on table public.profile_connections to authenticated;

drop policy if exists "profile_connections_participant_read" on public.profile_connections;
create policy "profile_connections_participant_read"
on public.profile_connections
for select
to authenticated
using (
  disconnected_at is null
  and auth.uid() is not null
  and (
    profile_low_id = auth.uid()
    or profile_high_id = auth.uid()
  )
);

insert into public.profile_connections (
  profile_low_id,
  profile_high_id,
  created_from_invite_id,
  connected_at,
  updated_at
)
select distinct on (
  least(sender_profile_id, recipient_profile_id),
  greatest(sender_profile_id, recipient_profile_id)
)
  least(sender_profile_id, recipient_profile_id) as profile_low_id,
  greatest(sender_profile_id, recipient_profile_id) as profile_high_id,
  id as created_from_invite_id,
  coalesce(accepted_at, responded_at, updated_at, created_at) as connected_at,
  now() as updated_at
from public.play_invites
where status = 'accepted'
order by
  least(sender_profile_id, recipient_profile_id),
  greatest(sender_profile_id, recipient_profile_id),
  accepted_at desc nulls last,
  updated_at desc,
  created_at desc
on conflict (profile_low_id, profile_high_id)
do update
set
  created_from_invite_id = excluded.created_from_invite_id,
  connected_at = excluded.connected_at,
  updated_at = now(),
  disconnected_at = null,
  disconnected_by_profile_id = null;

create or replace function public.get_profile_connection_count(
  p_profile_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
begin
  if p_profile_id is null then
    return 0;
  end if;

  select count(*)
  into v_count
  from public.profile_connections
  where disconnected_at is null
    and (
      profile_low_id = p_profile_id
      or profile_high_id = p_profile_id
    );

  return coalesce(v_count, 0);
end;
$$;

create or replace function public.remove_profile_connection(
  p_connection_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection record;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'unauthenticated',
      'connection_id', null
    );
  end if;

  if p_connection_id is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'invalid_connection',
      'connection_id', null
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext('profile_connection_transition'),
    hashtext(p_connection_id::text)
  );

  select
    id,
    profile_low_id,
    profile_high_id,
    disconnected_at
  into v_connection
  from public.profile_connections
  where id = p_connection_id
  for update;

  if v_connection.id is null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'connection_not_found',
      'connection_id', null
    );
  end if;

  if auth.uid() <> v_connection.profile_low_id
    and auth.uid() <> v_connection.profile_high_id then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'forbidden',
      'connection_id', v_connection.id
    );
  end if;

  if v_connection.disconnected_at is not null then
    return jsonb_build_object(
      'updated', false,
      'error_code', 'invalid_state',
      'connection_id', v_connection.id
    );
  end if;

  update public.profile_connections
  set
    disconnected_at = now(),
    disconnected_by_profile_id = auth.uid(),
    updated_at = now()
  where id = v_connection.id;

  return jsonb_build_object(
    'updated', true,
    'error_code', null,
    'connection_id', v_connection.id
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
  v_sender_profile record;
  v_source_post record;
  v_invite_id uuid;
  v_normalized_message text := nullif(regexp_replace(trim(coalesce(p_message, '')), '\s+', ' ', 'g'), '');
  v_connection_low_id uuid;
  v_connection_high_id uuid;
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

revoke all on function public.get_profile_connection_count(uuid) from public;
revoke all on function public.remove_profile_connection(uuid) from public;
revoke all on function public.accept_play_invite(uuid) from public;
revoke all on function public.send_play_invite(text, uuid, uuid) from public;

grant execute on function public.get_profile_connection_count(uuid) to anon, authenticated;
grant execute on function public.remove_profile_connection(uuid) to authenticated;
grant execute on function public.accept_play_invite(uuid) to authenticated;
grant execute on function public.send_play_invite(text, uuid, uuid) to authenticated;
