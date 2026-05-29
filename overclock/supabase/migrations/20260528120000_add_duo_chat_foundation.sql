create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  thread_type text not null,
  source_lfg_post_id uuid references public.lfg_posts (id) on delete set null,
  source_invite_id uuid references public.play_invites (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  locked_at timestamptz,
  lock_reason text,
  archived_at timestamptz
);

create table if not exists public.chat_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  display_name_snapshot text,
  avatar_snapshot text,
  joined_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chat_threads_type_check'
      and conrelid = 'public.chat_threads'::regclass
  ) then
    alter table public.chat_threads
      add constraint chat_threads_type_check
      check (thread_type in ('duo', 'stack')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chat_threads_lock_reason_check'
      and conrelid = 'public.chat_threads'::regclass
  ) then
    alter table public.chat_threads
      add constraint chat_threads_lock_reason_check
      check (
        lock_reason is null
        or lock_reason in (
          'connection_removed',
          'blocked',
          'invalid_source',
          'archived',
          'manual'
        )
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chat_messages_body_length_check'
      and conrelid = 'public.chat_messages'::regclass
  ) then
    alter table public.chat_messages
      add constraint chat_messages_body_length_check
      check (char_length(trim(body)) between 1 and 1000) not valid;
  end if;
end;
$$;

create unique index if not exists chat_threads_source_invite_unique_idx
  on public.chat_threads (source_invite_id)
  where source_invite_id is not null;

create index if not exists chat_threads_last_message_idx
  on public.chat_threads (last_message_at desc nulls last, created_at desc);

create unique index if not exists chat_participants_thread_profile_unique_idx
  on public.chat_participants (thread_id, profile_id);

create index if not exists chat_participants_profile_thread_idx
  on public.chat_participants (profile_id, thread_id);

create index if not exists chat_messages_thread_created_idx
  on public.chat_messages (thread_id, created_at desc, id desc);

create index if not exists chat_messages_thread_sender_created_idx
  on public.chat_messages (thread_id, sender_profile_id, created_at desc);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_chat_threads_updated_at on public.chat_threads;
create trigger set_chat_threads_updated_at
before update on public.chat_threads
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_chat_messages_updated_at on public.chat_messages;
create trigger set_chat_messages_updated_at
before update on public.chat_messages
for each row
execute function public.set_row_updated_at();

alter table public.chat_threads enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

revoke all on table public.chat_threads from anon, authenticated;
revoke all on table public.chat_participants from anon, authenticated;
revoke all on table public.chat_messages from anon, authenticated;

grant select on table public.chat_threads to authenticated;
grant select on table public.chat_participants to authenticated;
grant select on table public.chat_messages to authenticated;

create or replace function public.is_chat_thread_participant(
  p_thread_id uuid,
  p_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.chat_participants cp
    where cp.thread_id = p_thread_id
      and cp.profile_id = p_profile_id
  );
$$;

create or replace function public.can_read_chat_thread(
  p_thread_id uuid,
  p_profile_id uuid
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    p_profile_id is not null
    and exists (
      select 1
      from public.chat_threads ct
      where ct.id = p_thread_id
        and ct.archived_at is null
    )
    and public.is_chat_thread_participant(p_thread_id, p_profile_id)
    and not exists (
      select 1
      from public.chat_participants self_cp
      join public.chat_participants other_cp
        on other_cp.thread_id = self_cp.thread_id
       and other_cp.profile_id <> self_cp.profile_id
      where self_cp.thread_id = p_thread_id
        and self_cp.profile_id = p_profile_id
        and public.has_either_user_blocked(self_cp.profile_id, other_cp.profile_id)
    );
$$;

drop policy if exists "chat_threads_participant_read" on public.chat_threads;
create policy "chat_threads_participant_read"
on public.chat_threads
for select
to authenticated
using (
  public.can_read_chat_thread(id, auth.uid())
);

drop policy if exists "chat_participants_participant_read" on public.chat_participants;
create policy "chat_participants_participant_read"
on public.chat_participants
for select
to authenticated
using (
  public.can_read_chat_thread(thread_id, auth.uid())
);

drop policy if exists "chat_messages_participant_read" on public.chat_messages;
create policy "chat_messages_participant_read"
on public.chat_messages
for select
to authenticated
using (
  deleted_at is null
  and public.can_read_chat_thread(thread_id, auth.uid())
);

create or replace function public.refresh_duo_chat_thread_lock_state(
  p_thread_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_reason text := null;
  v_current_locked_at timestamptz := null;
  v_invite record;
  v_next_reason text := null;
  v_thread record;
begin
  if p_thread_id is null then
    return null;
  end if;

  select
    ct.id,
    ct.thread_type,
    ct.source_invite_id,
    ct.source_lfg_post_id,
    ct.archived_at,
    ct.lock_reason,
    ct.locked_at
  into v_thread
  from public.chat_threads ct
  where ct.id = p_thread_id
  limit 1;

  if v_thread.id is null then
    return null;
  end if;

  v_current_reason := v_thread.lock_reason;
  v_current_locked_at := v_thread.locked_at;

  if v_thread.archived_at is not null then
    v_next_reason := 'archived';
  elsif v_current_reason = 'manual' then
    v_next_reason := 'manual';
  elsif v_thread.thread_type <> 'duo' or v_thread.source_invite_id is null then
    v_next_reason := 'invalid_source';
  else
    select
      pi.id,
      pi.sender_profile_id,
      pi.recipient_profile_id,
      pi.source_lfg_post_id,
      pi.status,
      lp.id as post_id,
      lp.lfg_type
    into v_invite
    from public.play_invites pi
    left join public.lfg_posts lp
      on lp.id = pi.source_lfg_post_id
    where pi.id = v_thread.source_invite_id
    limit 1;

    if v_invite.id is null
      or v_invite.status <> 'accepted'
      or v_invite.source_lfg_post_id is null
      or v_invite.post_id is null
      or v_invite.lfg_type <> 'duos' then
      v_next_reason := 'invalid_source';
    elsif public.has_either_user_blocked(
      v_invite.sender_profile_id,
      v_invite.recipient_profile_id
    ) then
      v_next_reason := 'blocked';
    elsif not exists (
      select 1
      from public.profile_connections pc
      where pc.profile_low_id = least(
          v_invite.sender_profile_id,
          v_invite.recipient_profile_id
        )
        and pc.profile_high_id = greatest(
          v_invite.sender_profile_id,
          v_invite.recipient_profile_id
        )
        and pc.disconnected_at is null
    ) then
      v_next_reason := 'connection_removed';
    end if;
  end if;

  if v_current_reason is distinct from v_next_reason then
    update public.chat_threads
    set
      lock_reason = v_next_reason,
      locked_at = case
        when v_next_reason is null then null
        when v_current_reason = v_next_reason and v_current_locked_at is not null then v_current_locked_at
        else now()
      end
    where id = v_thread.id;
  elsif v_next_reason is not null and v_current_locked_at is null then
    update public.chat_threads
    set locked_at = now()
    where id = v_thread.id;
  end if;

  return v_next_reason;
end;
$$;

create or replace function public.ensure_duo_chat_thread_for_invite(
  p_invite_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite record;
  v_sender_avatar text := null;
  v_sender_display_name text := null;
  v_thread_id uuid := null;
  v_recipient_avatar text := null;
  v_recipient_display_name text := null;
begin
  if p_invite_id is null then
    return null;
  end if;

  perform pg_advisory_xact_lock(
    hashtext('duo_chat_thread_invite'),
    hashtext(p_invite_id::text)
  );

  select
    pi.id,
    pi.sender_profile_id,
    pi.recipient_profile_id,
    pi.source_lfg_post_id,
    pi.status,
    pi.created_at,
    pi.accepted_at,
    pi.sender_snapshot,
    pi.recipient_snapshot,
    sender_profile.username as sender_username,
    sender_profile.display_name as sender_profile_display_name,
    sender_profile.avatar_url as sender_profile_avatar_url,
    sender_profile.discord_avatar_url as sender_profile_discord_avatar_url,
    recipient_profile.username as recipient_username,
    recipient_profile.display_name as recipient_profile_display_name,
    recipient_profile.avatar_url as recipient_profile_avatar_url,
    recipient_profile.discord_avatar_url as recipient_profile_discord_avatar_url,
    lp.id as post_id,
    lp.lfg_type
  into v_invite
  from public.play_invites pi
  join public.lfg_posts lp
    on lp.id = pi.source_lfg_post_id
  left join public.profiles sender_profile
    on sender_profile.id = pi.sender_profile_id
  left join public.profiles recipient_profile
    on recipient_profile.id = pi.recipient_profile_id
  where pi.id = p_invite_id
  limit 1;

  if v_invite.id is null
    or v_invite.status <> 'accepted'
    or v_invite.post_id is null
    or v_invite.lfg_type <> 'duos' then
    return null;
  end if;

  v_sender_display_name := coalesce(
    v_invite.sender_snapshot ->> 'display_name',
    v_invite.sender_profile_display_name,
    v_invite.sender_username
  );
  v_sender_avatar := coalesce(
    v_invite.sender_snapshot ->> 'avatar_url',
    v_invite.sender_profile_discord_avatar_url,
    v_invite.sender_profile_avatar_url
  );
  v_recipient_display_name := coalesce(
    v_invite.recipient_snapshot ->> 'display_name',
    v_invite.recipient_profile_display_name,
    v_invite.recipient_username
  );
  v_recipient_avatar := coalesce(
    v_invite.recipient_snapshot ->> 'avatar_url',
    v_invite.recipient_profile_discord_avatar_url,
    v_invite.recipient_profile_avatar_url
  );

  insert into public.chat_threads (
    thread_type,
    source_lfg_post_id,
    source_invite_id,
    created_at,
    updated_at,
    last_message_at
  )
  values (
    'duo',
    v_invite.source_lfg_post_id,
    v_invite.id,
    coalesce(v_invite.accepted_at, v_invite.created_at, now()),
    now(),
    null
  )
  on conflict (source_invite_id)
  where source_invite_id is not null
  do update
  set source_lfg_post_id = excluded.source_lfg_post_id
  returning id into v_thread_id;

  insert into public.chat_participants (
    thread_id,
    profile_id,
    display_name_snapshot,
    avatar_snapshot,
    joined_at
  )
  values
    (
      v_thread_id,
      v_invite.sender_profile_id,
      v_sender_display_name,
      v_sender_avatar,
      coalesce(v_invite.accepted_at, v_invite.created_at, now())
    ),
    (
      v_thread_id,
      v_invite.recipient_profile_id,
      v_recipient_display_name,
      v_recipient_avatar,
      coalesce(v_invite.accepted_at, v_invite.created_at, now())
    )
  on conflict (thread_id, profile_id)
  do update
  set
    display_name_snapshot = coalesce(
      public.chat_participants.display_name_snapshot,
      excluded.display_name_snapshot
    ),
    avatar_snapshot = coalesce(
      public.chat_participants.avatar_snapshot,
      excluded.avatar_snapshot
    );

  perform public.refresh_duo_chat_thread_lock_state(v_thread_id);

  return v_thread_id;
end;
$$;

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
        'peerAvatarUrl', summary.peer_avatar_url,
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

create or replace function public.get_chat_thread_messages(
  p_thread_id uuid,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_has_more boolean := false;
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 50));
  v_messages jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or p_thread_id is null then
    return jsonb_build_object(
      'hasMore', false,
      'isAccessible', false,
      'messages', '[]'::jsonb
    );
  end if;

  if not public.can_read_chat_thread(p_thread_id, auth.uid()) then
    return jsonb_build_object(
      'hasMore', false,
      'isAccessible', false,
      'messages', '[]'::jsonb
    );
  end if;

  with paged_messages as (
    select
      cm.id,
      cm.thread_id,
      cm.sender_profile_id,
      cm.body,
      cm.created_at,
      cm.updated_at,
      sender_participant.display_name_snapshot as sender_display_name_snapshot,
      sender_participant.avatar_snapshot as sender_avatar_snapshot,
      sender_profile.username as sender_username,
      row_number() over (order by cm.created_at desc, cm.id desc) as row_num
    from public.chat_messages cm
    join public.chat_participants sender_participant
      on sender_participant.thread_id = cm.thread_id
     and sender_participant.profile_id = cm.sender_profile_id
    left join public.profiles sender_profile
      on sender_profile.id = cm.sender_profile_id
    where cm.thread_id = p_thread_id
      and cm.deleted_at is null
      and (
        p_before_created_at is null
        or (cm.created_at, cm.id) < (
          p_before_created_at,
          coalesce(p_before_id, '00000000-0000-0000-0000-000000000000'::uuid)
        )
      )
    order by cm.created_at desc, cm.id desc
    limit v_limit + 1
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', paged_messages.id,
          'threadId', paged_messages.thread_id,
          'senderProfileId', paged_messages.sender_profile_id,
          'body', paged_messages.body,
          'createdAt', paged_messages.created_at,
          'updatedAt', paged_messages.updated_at,
          'senderDisplayName', coalesce(
            paged_messages.sender_display_name_snapshot,
            paged_messages.sender_username
          ),
          'senderAvatarUrl', paged_messages.sender_avatar_snapshot,
          'senderUsername', paged_messages.sender_username
        )
        order by paged_messages.created_at asc, paged_messages.id asc
      ) filter (where paged_messages.row_num <= v_limit),
      '[]'::jsonb
    ),
    coalesce(bool_or(paged_messages.row_num > v_limit), false)
  into v_messages, v_has_more
  from paged_messages;

  return jsonb_build_object(
    'hasMore', v_has_more,
    'isAccessible', true,
    'messages', v_messages
  );
end;
$$;

create or replace function public.send_chat_message(
  p_thread_id uuid,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lock_reason text := null;
  v_message record;
  v_message_id uuid := null;
  v_normalized_body text := trim(coalesce(p_body, ''));
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'unauthenticated',
      'message', null
    );
  end if;

  if p_thread_id is null then
    return jsonb_build_object(
      'created', false,
      'error_code', 'thread_not_found',
      'message', null
    );
  end if;

  if not public.is_chat_thread_participant(p_thread_id, auth.uid()) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'forbidden',
      'message', null
    );
  end if;

  if char_length(v_normalized_body) < 1 or char_length(v_normalized_body) > 1000 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'invalid_message',
      'message', null
    );
  end if;

  v_lock_reason := public.refresh_duo_chat_thread_lock_state(p_thread_id);

  if exists (
    select 1
    from public.chat_threads ct
    where ct.id = p_thread_id
      and ct.archived_at is not null
  ) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'archived',
      'message', null
    );
  end if;

  if not public.can_read_chat_thread(p_thread_id, auth.uid()) then
    return jsonb_build_object(
      'created', false,
      'error_code', 'forbidden',
      'message', null
    );
  end if;

  if v_lock_reason is not null then
    return jsonb_build_object(
      'created', false,
      'error_code', v_lock_reason,
      'message', null
    );
  end if;

  if (
    select count(*)
    from public.chat_messages cm
    where cm.thread_id = p_thread_id
      and cm.sender_profile_id = auth.uid()
      and cm.created_at >= now() - interval '10 seconds'
  ) >= 5 then
    return jsonb_build_object(
      'created', false,
      'error_code', 'rate_limited',
      'message', null
    );
  end if;

  insert into public.chat_messages (
    thread_id,
    sender_profile_id,
    body
  )
  values (
    p_thread_id,
    auth.uid(),
    v_normalized_body
  )
  returning id into v_message_id;

  update public.chat_threads
  set last_message_at = now()
  where id = p_thread_id;

  select
    cm.id,
    cm.thread_id,
    cm.sender_profile_id,
    cm.body,
    cm.created_at,
    cm.updated_at,
    cp.display_name_snapshot as sender_display_name,
    cp.avatar_snapshot as sender_avatar_url,
    p.username as sender_username
  into v_message
  from public.chat_messages cm
  join public.chat_participants cp
    on cp.thread_id = cm.thread_id
   and cp.profile_id = cm.sender_profile_id
  left join public.profiles p
    on p.id = cm.sender_profile_id
  where cm.id = v_message_id
  limit 1;

  return jsonb_build_object(
    'created', true,
    'error_code', null,
    'message', jsonb_build_object(
      'id', v_message.id,
      'threadId', v_message.thread_id,
      'senderProfileId', v_message.sender_profile_id,
      'body', v_message.body,
      'createdAt', v_message.created_at,
      'updatedAt', v_message.updated_at,
      'senderDisplayName', coalesce(v_message.sender_display_name, v_message.sender_username),
      'senderAvatarUrl', v_message.sender_avatar_url,
      'senderUsername', v_message.sender_username
    )
  );
end;
$$;

insert into public.chat_threads (
  thread_type,
  source_lfg_post_id,
  source_invite_id,
  created_at,
  updated_at,
  last_message_at
)
select
  'duo',
  pi.source_lfg_post_id,
  pi.id,
  coalesce(pi.accepted_at, pi.responded_at, pi.updated_at, pi.created_at),
  now(),
  null
from public.play_invites pi
join public.lfg_posts lp
  on lp.id = pi.source_lfg_post_id
where pi.status = 'accepted'
  and lp.lfg_type = 'duos'
on conflict (source_invite_id)
where source_invite_id is not null
do nothing;

insert into public.chat_participants (
  thread_id,
  profile_id,
  display_name_snapshot,
  avatar_snapshot,
  joined_at
)
select
  ct.id,
  participant.profile_id,
  participant.display_name_snapshot,
  participant.avatar_snapshot,
  ct.created_at
from public.chat_threads ct
join public.play_invites pi
  on pi.id = ct.source_invite_id
left join public.profiles sender_profile
  on sender_profile.id = pi.sender_profile_id
left join public.profiles recipient_profile
  on recipient_profile.id = pi.recipient_profile_id
cross join lateral (
  values
    (
      pi.sender_profile_id,
      coalesce(
        pi.sender_snapshot ->> 'display_name',
        sender_profile.display_name,
        sender_profile.username
      ),
      coalesce(
        pi.sender_snapshot ->> 'avatar_url',
        sender_profile.discord_avatar_url,
        sender_profile.avatar_url
      )
    ),
    (
      pi.recipient_profile_id,
      coalesce(
        pi.recipient_snapshot ->> 'display_name',
        recipient_profile.display_name,
        recipient_profile.username
      ),
      coalesce(
        pi.recipient_snapshot ->> 'avatar_url',
        recipient_profile.discord_avatar_url,
        recipient_profile.avatar_url
      )
    )
) as participant(profile_id, display_name_snapshot, avatar_snapshot)
where ct.thread_type = 'duo'
  and ct.source_invite_id is not null
on conflict (thread_id, profile_id)
do update
set
  display_name_snapshot = coalesce(
    public.chat_participants.display_name_snapshot,
    excluded.display_name_snapshot
  ),
  avatar_snapshot = coalesce(
    public.chat_participants.avatar_snapshot,
    excluded.avatar_snapshot
  );

do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
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

  if public.has_either_user_blocked(
    v_invite.sender_profile_id,
    v_invite.recipient_profile_id
  ) then
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

  perform public.ensure_duo_chat_thread_for_invite(v_invite.id);

  return jsonb_build_object(
    'updated', true,
    'error_code', null,
    'invite_id', v_invite.id,
    'status', 'accepted'
  );
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
  v_thread_id uuid;
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
    disconnected_at,
    created_from_invite_id
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

  select ct.id
  into v_thread_id
  from public.chat_threads ct
  where ct.source_invite_id = v_connection.created_from_invite_id
  limit 1;

  if v_thread_id is not null then
    perform public.refresh_duo_chat_thread_lock_state(v_thread_id);
  end if;

  return jsonb_build_object(
    'updated', true,
    'error_code', null,
    'connection_id', v_connection.id
  );
end;
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
  v_actor_username text := null;
  v_created boolean := false;
  v_declined_request_count integer := 0;
  v_disconnected_connection_count integer := 0;
  v_existing_block_id uuid;
  v_pending_invite_count integer := 0;
  v_target_username text := null;
  v_thread_id uuid;
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

  for v_thread_id in
    select ct.id
    from public.chat_threads ct
    join public.chat_participants cp_a
      on cp_a.thread_id = ct.id
     and cp_a.profile_id = auth.uid()
    join public.chat_participants cp_b
      on cp_b.thread_id = ct.id
     and cp_b.profile_id = p_blocked_profile_id
  loop
    perform public.refresh_duo_chat_thread_lock_state(v_thread_id);
  end loop;

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

revoke all on function public.set_row_updated_at() from public;
revoke all on function public.is_chat_thread_participant(uuid, uuid) from public;
revoke all on function public.can_read_chat_thread(uuid, uuid) from public;
revoke all on function public.refresh_duo_chat_thread_lock_state(uuid) from public;
revoke all on function public.ensure_duo_chat_thread_for_invite(uuid) from public;
revoke all on function public.get_social_threads_dto() from public;
revoke all on function public.get_social_thread_dto(uuid) from public;
revoke all on function public.get_chat_thread_messages(uuid, timestamptz, uuid, integer) from public;
revoke all on function public.send_chat_message(uuid, text) from public;

grant execute on function public.get_social_threads_dto() to authenticated;
grant execute on function public.get_social_thread_dto(uuid) to authenticated;
grant execute on function public.get_chat_thread_messages(uuid, timestamptz, uuid, integer) to authenticated;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
