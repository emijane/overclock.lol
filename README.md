# overclock.lol

This repository currently contains a profile-first Overwatch player app in the
`overclock/` folder.

The current product is focused on:

- Discord sign-in through Supabase
- onboarding into an app-specific username
- public player profiles at `/u/[username]`
- owner-side profile editing from the public profile modal
- hero pool setup by role
- active LFG surfaces for duos and stacks

The broader LFG system is still being built. `/teams` and `/scrims` remain
roadmap topics and are not current shipped routes.

## Repo layout

- `overclock/` - the active Next.js app
- `docs/` - canonical repository documentation
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
- `/account` - account settings, availability, and presence privacy
- `/account/competitive` - saved LFG preferences and competitive role setup
- `/account/hero-pools` - redirects to competitive setup
- `/lfg` - main LFG shell
- `/duos` - browse-first duo feed
- `/duos/create` - dedicated duo post composer
- `/stacks` - stacks feed
- `/stacks/create` - dedicated stack post composer with fixed `1/5` group start

Roadmap-only, not currently shipped:

- `/teams`
- `/scrims`

## Status

Active work is currently centered on profile quality, onboarding polish, hero pools,
LFG quality, and general codebase cleanup.

## Stacks Notes

- Stack posts start at `1/5` with the owner automatically inserted as the first member.
- Stack membership is exclusive across active stack posts:
  - `active` and `filled` stacks occupy the user
  - `closed` and `expired` stacks free the user
- Stack requests reuse the existing notification dropdown flow for owner-side
  accept and decline actions.
- Public stack cards show only accepted members through overlapping clickable
  avatars, plus the remaining needed role pills.

## Next Steps

- Apply visual QA for `/stacks` on mobile and narrow desktop widths.
- Keep stack lifecycle docs aligned with any future DB or notification changes.
- Document any future owner/member moderation changes only after they ship.
