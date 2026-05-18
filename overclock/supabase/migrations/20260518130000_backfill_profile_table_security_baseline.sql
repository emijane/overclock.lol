-- Canonical security baseline for core profile tables whose original bootstrap
-- migrations are not present in this repo.
--
-- Goal:
--   - make final grant and RLS posture reconstructable from source control
--   - align direct table access with shipped app behavior for public profiles
--   - keep owner writes scoped to auth.uid() for profile-owned tables
--
-- This is intentionally a forward-looking baseline. It does not recreate the
-- original historical table creation order, but it does define the final access
-- control truth that launch/security review needs to audit from the repo.

-- Public profiles
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

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

-- Competitive profile settings and role rows are public to support guest
-- profile/LFG reads, while writes stay owner-scoped.
alter table public.competitive_profiles enable row level security;

revoke all on table public.competitive_profiles from anon, authenticated;
grant select on table public.competitive_profiles to anon, authenticated;
grant insert, update on table public.competitive_profiles to authenticated;

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

alter table public.competitive_role_profiles enable row level security;

revoke all on table public.competitive_role_profiles from anon, authenticated;
grant select on table public.competitive_role_profiles to anon, authenticated;
grant insert, update, delete on table public.competitive_role_profiles to authenticated;

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

alter table public.profile_hero_pools enable row level security;

revoke all on table public.profile_hero_pools from anon, authenticated;
grant select on table public.profile_hero_pools to anon, authenticated;
grant insert, update on table public.profile_hero_pools to authenticated;

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

alter table public.profile_featured_clips enable row level security;

revoke all on table public.profile_featured_clips from anon, authenticated;
grant select on table public.profile_featured_clips to anon, authenticated;
grant insert, update, delete on table public.profile_featured_clips to authenticated;

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

-- Badge definitions and badge assignments are public read surfaces. App-side
-- writes happen through a service-role admin client, so end-user direct writes
-- stay fully revoked.
alter table public.badges enable row level security;

revoke all on table public.badges from anon, authenticated;
grant select on table public.badges to anon, authenticated;

drop policy if exists "badges_public_read" on public.badges;
create policy "badges_public_read"
on public.badges
for select
to anon, authenticated
using (true);

alter table public.profile_badges enable row level security;

revoke all on table public.profile_badges from anon, authenticated;
grant select on table public.profile_badges to anon, authenticated;

drop policy if exists "profile_badges_public_read" on public.profile_badges;
create policy "profile_badges_public_read"
on public.profile_badges
for select
to anon, authenticated
using (true);
