create table if not exists public.play_invites (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles (id) on delete cascade,
  source_lfg_post_id uuid references public.lfg_posts (id) on delete set null,
  status text not null default 'pending',
  message text,
  sender_snapshot jsonb,
  recipient_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  responded_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz
);

alter table public.play_invites enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'play_invites_status_check'
      and conrelid = 'public.play_invites'::regclass
  ) then
    alter table public.play_invites
      add constraint play_invites_status_check
      check (
        status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'play_invites_sender_not_recipient_check'
      and conrelid = 'public.play_invites'::regclass
  ) then
    alter table public.play_invites
      add constraint play_invites_sender_not_recipient_check
      check (sender_profile_id <> recipient_profile_id) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'play_invites_message_length_check'
      and conrelid = 'public.play_invites'::regclass
  ) then
    alter table public.play_invites
      add constraint play_invites_message_length_check
      check (
        message is null
        or char_length(btrim(message)) between 1 and 280
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'play_invites_expiry_order_check'
      and conrelid = 'public.play_invites'::regclass
  ) then
    alter table public.play_invites
      add constraint play_invites_expiry_order_check
      check (expires_at > created_at) not valid;
  end if;
end;
$$;

create index if not exists play_invites_recipient_pending_idx
  on public.play_invites (recipient_profile_id, status, expires_at desc, created_at desc);

create index if not exists play_invites_sender_pending_idx
  on public.play_invites (sender_profile_id, status, created_at desc);

create index if not exists play_invites_sender_accepted_idx
  on public.play_invites (sender_profile_id, accepted_at desc)
  where status = 'accepted';

create index if not exists play_invites_recipient_accepted_idx
  on public.play_invites (recipient_profile_id, accepted_at desc)
  where status = 'accepted';

create index if not exists play_invites_source_post_status_idx
  on public.play_invites (source_lfg_post_id, status)
  where source_lfg_post_id is not null;

create unique index if not exists play_invites_live_pending_unique_idx
  on public.play_invites (
    sender_profile_id,
    recipient_profile_id,
    coalesce(source_lfg_post_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status = 'pending';
