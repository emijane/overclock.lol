-- Bootstrap the foundational public schema objects that older repo migrations
-- already assume exist.
--
-- This migration is intentionally placed before the first repo-visible RPC
-- migration so a fresh Supabase database can rebuild from source control alone.
--
-- The original historical bootstrap for these objects was missing from the
-- repo. This file restores the missing source-of-truth schema for:
--   - public.profiles
--   - public.competitive_profiles
--   - public.competitive_role_profiles
--   - public.profile_hero_pools
--   - public.profile_featured_clips
--   - public.badges
--   - public.profile_badges
--   - public.lfg_posts
--
-- Notes:
--   - the legacy profiles.platform column is included so the later
--     20260503143000 migration can replay cleanly; a later forward migration
--     drops it to match the current linked database.
--   - lfg_posts.updated_at is included because the current linked database has
--     it and later repo functions update it, but older repo history never
--     recreated the column.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  discord_user_id text,
  discord_username text,
  discord_avatar_url text,
  avatar_url text,
  avatar_updated_at timestamptz,
  cover_image_path text,
  cover_image_updated_at timestamptz,
  bio text,
  timezone text,
  region text,
  platform text,
  current_rank_tier text,
  current_rank_division integer,
  peak_rank_tier text,
  peak_rank_division integer,
  looking_for text[],
  battlenet_handle text,
  twitch_url text,
  x_url text,
  youtube_url text,
  is_public boolean not null default true,
  uses_mic boolean not null default false,
  last_seen_at timestamptz,
  is_looking_to_play boolean not null default false,
  hide_offline_presence boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_key unique (username),
  constraint profiles_username_format_check check (
    username = lower(username)
    and username ~ '^[a-z0-9_]+$'
    and char_length(username) between 3 and 24
  ),
  constraint profiles_display_name_length_check check (
    char_length(btrim(display_name)) between 1 and 40
  )
);

create table if not exists public.competitive_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  main_role text,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitive_profiles_main_role_check check (
    main_role is null or main_role in ('tank', 'dps', 'support')
  ),
  constraint competitive_profiles_platform_check check (
    platform is null or platform in ('PC', 'Console')
  )
);

create table if not exists public.competitive_role_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  rank_tier text not null,
  rank_division integer,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitive_role_profiles_profile_id_role_key unique (profile_id, role),
  constraint competitive_role_profiles_role_check check (
    role in ('tank', 'dps', 'support')
  )
);

create table if not exists public.profile_hero_pools (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  roles text[] not null default array[]::text[],
  hero_picks jsonb not null default jsonb_build_object(
    'tank', '[]'::jsonb,
    'dps', '[]'::jsonb,
    'support', '[]'::jsonb
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_hero_pools_roles_check check (
    roles <@ array['tank', 'dps', 'support']::text[]
  )
);

create table if not exists public.profile_featured_clips (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  url text not null,
  title text,
  thumbnail_url text,
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_featured_clips_profile_id_position_key unique (profile_id, position)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  label text not null,
  description text,
  icon text,
  color text,
  created_at timestamptz not null default now(),
  constraint badges_slug_key unique (slug)
);

create table if not exists public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  constraint profile_badges_profile_id_badge_id_key unique (profile_id, badge_id)
);

create table if not exists public.lfg_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  competitive_profile_snapshot jsonb not null,
  description text,
  game_mode text not null default 'ranked',
  hero_pool_snapshot jsonb not null default '[]'::jsonb,
  lfg_type text not null,
  looking_for_roles text[] not null default array['tank', 'dps', 'support']::text[],
  max_group_size smallint,
  current_member_count smallint not null default 1,
  posting_role text not null,
  snapshot_main_role text,
  snapshot_platform text,
  snapshot_rank_division integer,
  snapshot_rank_tier text not null,
  snapshot_region text,
  snapshot_timezone text,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  expired_at timestamptz,
  closed_at timestamptz,
  purge_after timestamptz,
  constraint lfg_posts_status_check check (
    status in ('active', 'closed', 'archived')
  ),
  constraint lfg_posts_lfg_type_check check (
    lfg_type in ('duos', 'stacks', 'teams', 'scrims')
  ),
  constraint lfg_posts_game_mode_check check (
    game_mode in ('ranked', 'quick_play')
  ),
  constraint lfg_posts_posting_role_check check (
    posting_role in ('tank', 'dps', 'support')
  ),
  constraint lfg_posts_title_length_check check (
    char_length(btrim(title)) between 1 and 80
  ),
  constraint lfg_posts_looking_for_roles_check check (
    cardinality(looking_for_roles) between 1 and 3
    and looking_for_roles <@ array['tank', 'dps', 'support']::text[]
  ),
  constraint lfg_posts_max_group_size_check check (
    max_group_size is null or max_group_size between 2 and 6
  ),
  constraint lfg_posts_current_member_count_check check (
    current_member_count >= 1
  ),
  constraint lfg_posts_description_length_check check (
    description is null or char_length(btrim(description)) between 1 and 300
  )
);

create index if not exists profiles_username_lookup_idx
  on public.profiles (username);

create index if not exists competitive_profiles_profile_lookup_idx
  on public.competitive_profiles (profile_id);

create index if not exists competitive_role_profiles_profile_role_lookup_idx
  on public.competitive_role_profiles (profile_id, role);

create index if not exists profile_hero_pools_profile_lookup_idx
  on public.profile_hero_pools (profile_id);

create index if not exists profile_featured_clips_profile_position_lookup_idx
  on public.profile_featured_clips (profile_id, position);

create index if not exists profile_badges_profile_granted_lookup_idx
  on public.profile_badges (profile_id, granted_at);

create index if not exists lfg_posts_public_active_feed_idx
  on public.lfg_posts (lfg_type, created_at desc)
  where status = 'active';

create index if not exists lfg_posts_owner_history_idx
  on public.lfg_posts (profile_id, created_at desc);

create index if not exists lfg_posts_owner_active_role_idx
  on public.lfg_posts (profile_id, lfg_type, posting_role, created_at desc)
  where status = 'active';

create index if not exists lfg_posts_owner_active_duplicate_idx
  on public.lfg_posts (
    profile_id,
    lfg_type,
    game_mode,
    posting_role,
    created_at desc
  )
  where status = 'active';

create index if not exists lfg_posts_owner_creation_window_idx
  on public.lfg_posts (profile_id, lfg_type, created_at desc);

create index if not exists lfg_posts_active_expires_feed_idx
  on public.lfg_posts (lfg_type, expires_at desc)
  where status = 'active';

alter table public.profiles enable row level security;
alter table public.competitive_profiles enable row level security;
alter table public.competitive_role_profiles enable row level security;
alter table public.profile_hero_pools enable row level security;
alter table public.profile_featured_clips enable row level security;
alter table public.badges enable row level security;
alter table public.profile_badges enable row level security;
alter table public.lfg_posts enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

revoke all on table public.competitive_profiles from anon, authenticated;
grant select on table public.competitive_profiles to anon, authenticated;
grant insert, update on table public.competitive_profiles to authenticated;

revoke all on table public.competitive_role_profiles from anon, authenticated;
grant select on table public.competitive_role_profiles to anon, authenticated;
grant insert, update, delete on table public.competitive_role_profiles to authenticated;

revoke all on table public.profile_hero_pools from anon, authenticated;
grant select on table public.profile_hero_pools to anon, authenticated;
grant insert, update on table public.profile_hero_pools to authenticated;

revoke all on table public.profile_featured_clips from anon, authenticated;
grant select on table public.profile_featured_clips to anon, authenticated;
grant insert, update, delete on table public.profile_featured_clips to authenticated;

revoke all on table public.badges from anon, authenticated;
grant select on table public.badges to anon, authenticated;

revoke all on table public.profile_badges from anon, authenticated;
grant select on table public.profile_badges to anon, authenticated;

revoke insert, update, delete on table public.lfg_posts from anon, authenticated;
grant select on table public.lfg_posts to anon, authenticated;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "competitive_profiles_public_read" on public.competitive_profiles;
create policy "competitive_profiles_public_read"
on public.competitive_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "competitive_profiles_owner_insert" on public.competitive_profiles;
create policy "competitive_profiles_owner_insert"
on public.competitive_profiles
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "competitive_profiles_owner_update" on public.competitive_profiles;
create policy "competitive_profiles_owner_update"
on public.competitive_profiles
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "competitive_role_profiles_public_read" on public.competitive_role_profiles;
create policy "competitive_role_profiles_public_read"
on public.competitive_role_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "competitive_role_profiles_owner_insert" on public.competitive_role_profiles;
create policy "competitive_role_profiles_owner_insert"
on public.competitive_role_profiles
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "competitive_role_profiles_owner_update" on public.competitive_role_profiles;
create policy "competitive_role_profiles_owner_update"
on public.competitive_role_profiles
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "competitive_role_profiles_owner_delete" on public.competitive_role_profiles;
create policy "competitive_role_profiles_owner_delete"
on public.competitive_role_profiles
for delete
to authenticated
using (profile_id = auth.uid());

drop policy if exists "profile_hero_pools_public_read" on public.profile_hero_pools;
create policy "profile_hero_pools_public_read"
on public.profile_hero_pools
for select
to anon, authenticated
using (true);

drop policy if exists "profile_hero_pools_owner_insert" on public.profile_hero_pools;
create policy "profile_hero_pools_owner_insert"
on public.profile_hero_pools
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "profile_hero_pools_owner_update" on public.profile_hero_pools;
create policy "profile_hero_pools_owner_update"
on public.profile_hero_pools
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "profile_featured_clips_public_read" on public.profile_featured_clips;
create policy "profile_featured_clips_public_read"
on public.profile_featured_clips
for select
to anon, authenticated
using (true);

drop policy if exists "profile_featured_clips_owner_insert" on public.profile_featured_clips;
create policy "profile_featured_clips_owner_insert"
on public.profile_featured_clips
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "profile_featured_clips_owner_update" on public.profile_featured_clips;
create policy "profile_featured_clips_owner_update"
on public.profile_featured_clips
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "profile_featured_clips_owner_delete" on public.profile_featured_clips;
create policy "profile_featured_clips_owner_delete"
on public.profile_featured_clips
for delete
to authenticated
using (profile_id = auth.uid());

drop policy if exists "badges_public_read" on public.badges;
create policy "badges_public_read"
on public.badges
for select
to anon, authenticated
using (true);

drop policy if exists "profile_badges_public_read" on public.profile_badges;
create policy "profile_badges_public_read"
on public.profile_badges
for select
to anon, authenticated
using (true);

drop policy if exists "lfg_posts_public_active_read" on public.lfg_posts;
create policy "lfg_posts_public_active_read"
on public.lfg_posts
for select
to anon, authenticated
using (
  status = 'active'
  and created_at >= now() - interval '12 hours'
);

drop policy if exists "lfg_posts_owner_read" on public.lfg_posts;
create policy "lfg_posts_owner_read"
on public.lfg_posts
for select
to authenticated
using (profile_id = auth.uid());
