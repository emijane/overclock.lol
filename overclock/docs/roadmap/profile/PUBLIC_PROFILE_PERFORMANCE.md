# Public Profile Performance

This note documents the public profile performance work around `/u/[username]`.
The goal is to keep logged-out profile views fast while preserving owner-only
editing behavior for signed-in users.

## Problem

The public profile route was doing authenticated profile work for every viewer:

1. Load the public profile by username.
2. Load the current signed-in user's profile.
3. Compare the two profiles to decide whether to show owner controls.
4. Load hero pools.
5. Load competitive profile data.
6. Load featured clips.

That meant logged-out public visitors still paid for auth/profile lookup work
that could only ever produce `isOwner = false`.

The route also loaded profile extras sequentially even though hero pools,
competitive profile data, featured clips, badges, and recent posts are
independent reads once the public profile row exists.

## Changes Made

Added `lib/profiles/get-optional-current-user-id.ts`.

This helper checks for a Supabase auth cookie before calling
Supabase auth. If no auth cookie exists, it returns `null` immediately. When a
cookie exists, it reads the auth claim subject id instead of loading the full
current profile row. That lets anonymous public profile views skip auth work and
lets signed-in public profile views avoid owner-profile syncing when the route
only needs `isOwner`.

Updated `app/u/[username]/page.tsx`.

The page now:

- loads the public profile and optional current user id in parallel
- returns `notFound()` if the public profile does not exist
- loads hero pools, competitive profile data, featured clips, badges, and
  recent posts in parallel
- keeps owner detection based on `currentUserId === profile.id`

Updated `lib/competitive/competitive-profile.ts`.

The competitive profile helper now loads `competitive_profiles` and
`competitive_role_profiles` in parallel because both queries only depend on the
same `profileId`.

Updated `lib/profiles/get-profile-by-username.ts`.

Usernames are normalized to lowercase during onboarding, so the public profile
lookup now normalizes the route param and uses an exact `eq("username", value)`
query instead of a case-insensitive `ilike`. This should make better use of the
unique username lookup path.

The intended behavior remains:

- logged-out visitors can view public profiles without edit controls
- logged-in non-owners can view public profiles without edit controls
- logged-in owners can view their profile with edit controls

## RLS Status

The Supabase policies checked during this work showed that RLS is enabled on the
public profile tables:

- `profiles`
- `profile_hero_pools`
- `competitive_profiles`
- `competitive_role_profiles`
- `profile_featured_clips`

Public read policies are present for those tables, and write policies are scoped
to the owner through either `id = auth.uid()` or `profile_id = auth.uid()`.

That means it is safe for logged-out users to read public profile data while
server actions continue to enforce owner-only writes.

## Follow-Up Work

Possible next steps:

- Measure the route again in local dev and production after this change.
- Consider reducing global proxy work if profiling shows `getClaims()` is still
  a major cost on public routes.
- Consider combining public profile reads with database views or RPCs if the
  profile page grows more related data sections.
- Add lightweight route tests for logged-out, logged-in non-owner, and logged-in
  owner profile views.
