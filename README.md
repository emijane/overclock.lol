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

Key doc entrypoints:

- `docs/README.md` - docs structure and maintenance rules
- `docs/roadmap/PROJECT_CONTEXT_ROADMAP.md` - current product snapshot
- `docs/roadmap/PRODUCT_BACKLOG.md` - canonical backlog
- `docs/qa/README.md` - QA references and archives

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
- `/social` - private social inbox for accepted Duo chats
- `/social/duos/[threadId]` - accepted Duo chat thread view
- `/duos` - browse-first duo feed
- `/duos/create` - dedicated duo post composer
- `/stacks` - stacks feed
- `/stacks/create` - dedicated stack post composer with fixed `1/5` group start
- `/stacks/[postId]` - dedicated stack detail and supported management view

Roadmap-only, not currently shipped:

- `/teams`
- `/scrims`

## Status

Active work is currently centered on profile quality, onboarding polish, hero pools,
LFG quality, Duo chat foundation work, and general codebase cleanup.

## Stacks Notes

- Stack posts start at `1/5` with the owner automatically inserted as the first member.
- Stack membership is exclusive across active stack posts:
  - `active` and `filled` stacks occupy the user
  - `closed` and `expired` stacks free the user
- Stack requests reuse the existing notification dropdown flow for owner-side
  accept and decline actions.
- Public stack cards show only accepted members through overlapping clickable
  avatars, plus the remaining needed role pills.
- Signed-in users who already belong to an active stack now see a compact
  "Your current stack" panel above the `/stacks` feed with owner, members,
  capacity, and view/leave actions when applicable.
- Stack "View" actions now open a dedicated `/stacks/[postId]` page so the
  current stack remains reachable even when feed filters or search would hide
  its card.

## Next Steps

- Apply visual QA for `/stacks` on mobile and narrow desktop widths.
- Keep stack lifecycle docs aligned with any future DB or notification changes.
- Document any future owner/member moderation changes only after they ship.
