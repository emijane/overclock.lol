# Sessions And Profiles

## Purpose

This document explains:

- how login sessions work
- how the app decides who the current user is
- how a Discord-authenticated account becomes an Overclock profile
- how the app keeps profiles unique

## Core Model

Overclock currently treats identity in two layers:

1. Supabase auth user
2. App profile row in `public.profiles`

The intended invariant is:

- one Supabase auth user maps to at most one app profile
- that profile uses the auth user id as its primary id
- one username maps to one profile

In practice, `profiles.id = auth.users.id`.

## Login Flow

### 1. User starts at `/login`

Relevant file:

- `overclock/app/login/page.tsx`

Behavior:

- signed-out users stay on `/login`
- signed-in users without a profile are redirected to `/onboarding`
- signed-in users with a profile are redirected to `/u/[username]`

### 2. Discord OAuth returns to `/auth/callback`

Relevant file:

- `overclock/app/auth/callback/route.ts`

Behavior:

- reads the OAuth `code`
- exchanges it with Supabase using `supabase.auth.exchangeCodeForSession(code)`
- writes the authenticated session into Supabase-managed cookies
- redirects back into the app

If the callback fails, the user is sent back to `/login` with a generic error
message.

### 3. Session cookies are read on future requests

Relevant files:

- `overclock/lib/supabase/server.ts`
- `overclock/lib/supabase/proxy.ts`

Behavior:

- server code creates a Supabase server client from request cookies
- proxy middleware refreshes auth claims with `supabase.auth.getClaims()`
- proxy responses are marked `Cache-Control: private, no-store`

This keeps authenticated responses private and lets Supabase session cookies stay
current as the user moves through the app.

## How The App Resolves The Current User

Relevant files:

- `overclock/lib/profiles/get-current-profile.ts`
- `overclock/lib/profiles/get-optional-current-user-id.ts`
- `overclock/lib/profiles/get-optional-current-invite-viewer.ts`

### `getCurrentProfile()`

This is the main authenticated identity helper.

It:

- calls `supabase.auth.getUser()`
- returns `{ user: null, profile: null }` when there is no valid session
- looks up `profiles.id = user.id`
- returns the matching app profile when onboarding is complete

This is the main distinction between:

- authenticated but not onboarded
- authenticated and fully profiled
- not authenticated

### Optional identity helpers

For public routes, the app sometimes avoids full auth work unless a Supabase auth
cookie is present.

These helpers:

- check for `sb-*auth-token*` cookies first
- then call `getClaims()`
- return a lightweight viewer id or viewer state

That allows public pages to stay cheap for anonymous users while still enabling
owner controls for signed-in viewers.

## Onboarding Flow

Relevant files:

- `overclock/app/onboarding/page.tsx`
- `overclock/app/onboarding/actions.ts`

### Entry conditions

- unauthenticated users are redirected to `/login`
- authenticated users with an existing profile are redirected away from onboarding

### Profile creation

The onboarding form collects:

- `username`
- `display_name`

The server action then:

- normalizes `username` to lowercase
- validates the username format and length
- validates the display name length
- re-checks the authenticated user on the server
- confirms there is no existing `profiles` row for `user.id`
- inserts a new profile row with `id = user.id`

Important behavior:

- the browser does not choose the profile id
- Discord-derived identity fields come from trusted auth metadata, not from the form
- duplicate usernames fail on the server and return a user-safe message

## Unique Profile Rules

Current uniqueness is enforced by a mix of application logic and database
constraints.

### App-level rules

During onboarding:

- if a `profiles` row already exists for `auth.user.id`, the action stops
- if the insert hits a duplicate constraint, the action reports that the username
  is already taken

### Data-shape rule

The app assumes:

- a profile primary key is the same value as the auth user id

That means one authenticated account should only own one profile row.

### Public identity rule

The app also assumes:

- `username` is unique
- `username` is the public URL key at `/u/[username]`

## Trusted vs Editable Identity Fields

Relevant files:

- `overclock/lib/profiles/discord-profile.ts`
- `overclock/lib/profiles/sync-discord-profile-fields.ts`

### Trusted from Discord / Supabase auth metadata

These are treated as auth-owned inputs:

- Discord provider user id
- Discord username
- Discord display-oriented metadata used during onboarding

The app reads these from `user.user_metadata` server-side.

### App-owned / user-edited

These are managed by Overclock profile flows:

- app username
- display name
- bio
- rank-related settings
- region / timezone
- uploaded avatar / cover image

### Current sync behavior

On authenticated profile reads, the app currently keeps `discord_username`
aligned with trusted auth metadata.

It does not automatically overwrite the user-uploaded app avatar from Discord.

## Route Security Gates

Common route gates today:

- `/login`
  - redirects profiled users away
  - redirects authenticated unprofiled users to onboarding
- `/onboarding`
  - requires auth
  - rejects already-profiled users
- `/account`
  - requires auth
  - requires a completed profile

This pattern prevents partially onboarded users from entering profile-dependent
areas as if they were fully set up.

## Sign Out

Relevant files:

- `overclock/app/auth/actions.ts`
- `overclock/features/auth/actions.ts`

Sign-out is handled through a server action that delegates to shared auth logic.
That flow clears the authenticated session and sends the user back to `/login`.

## Security Notes

### Good current properties

- session establishment happens server-side through Supabase
- authenticated identity is re-checked inside server actions
- onboarding does not trust browser-supplied Discord identity fields
- app profile identity is anchored to auth user id
- private authenticated responses are marked `no-store` in proxy handling

### Things this model depends on

- Supabase auth is the source of truth for session validity
- the `profiles` table must preserve uniqueness for ids and usernames
- server actions must continue to re-check auth and ownership instead of trusting UI state

## Known Limitations

- This doc describes the current app behavior, not a formal threat model
- Database-level constraints for username uniqueness are assumed by app behavior but are not described here in migration detail
- There is no separate multi-profile or account-linking model right now
- Discord metadata trust is limited to what Supabase exposes after OAuth

## Related Docs

- `README.md`
- `docs/legal/PRIVACY_POLICY.md`
- `docs/legal/TERMS_OF_SERVICE.md`
