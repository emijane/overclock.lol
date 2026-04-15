# overclock.lol

This repository currently contains a profile-first Overwatch player app in the
`overclock/` folder.

The current product is focused on:

- Discord sign-in through Supabase
- onboarding into an app-specific username
- public player profiles at `/u/[username]`
- owner-side profile editing from the public profile modal
- hero pool setup by role

It is not yet the broader duo/team/scrim platform that earlier project notes described.

## Repo layout

- `overclock/` - the active Next.js app
- `README.md` - repository overview

## App setup

From the `overclock/` directory:

```bash
npm install
npm run dev
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

You will also need Supabase auth configured for Discord and pointed at this app's
callback route: `/auth/callback`.

## Current routes

- `/login` - auth entry point
- `/onboarding` - profile creation
- `/u/[username]` - public profile
- `/account` - placeholder route for future settings
- `/account/hero-pools` - hero pool editor

## Status

Active work is currently centered on profile quality, onboarding polish, hero pools,
and general codebase cleanup.
