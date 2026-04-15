# Project Context and Roadmap

This note is a lightweight orientation doc for people working inside the repo.
It captures what the app currently does, how it is structured, and what the
next sensible product steps look like based on the current codebase and `TODO`.

## Project Snapshot

`overclock.lol` is a Next.js App Router app for Overwatch players to create a
public profile, connect through Discord auth, and share matchmaking-relevant
details such as rank, platform, preferred server, bio, and preferred hero pools.

The current product shape is profile-first rather than feed-first:

- `/login` is the main entry point and auth gate.
- `/onboarding` creates an app profile for a Discord-authenticated user.
- `/account` manages editable profile fields.
- `/account/hero-pools` manages role selection and preferred heroes.
- `/u/[username]` renders the public player profile.

The homepage currently redirects to `/login`.

## Current Product Flow

1. A user signs in with Discord through Supabase auth.
2. If they do not yet have a `profiles` row, they are redirected to onboarding.
3. Onboarding creates the app-specific profile with a unique username.
4. The user can fill in account details like bio, region, preferred server, platform,
   rank, and looking-for preferences.
5. The user can separately define hero pools by role.
6. Their public profile is available at `/u/[username]`.

## Technical Context

### Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase SSR auth and database access
- Radix UI primitives for some interactive controls

### Current Architecture Notes

- Auth-sensitive and profile write logic lives in server actions and server-side
  helpers, which is the right direction for this app.
- `lib/profiles/get-current-profile.ts` is the main helper that answers both
  authentication state and whether onboarding is complete.
- Public profile rendering is split into route-local components under
  `app/u/[username]/profile`.
- Hero pool logic is isolated in `lib/heroes/*` and the dedicated account route.
- Some metadata and top-level docs are still starter-template quality and should
  be replaced with project-specific content.

## Current Gaps

These are already visible in the codebase today:

- App metadata in `app/layout.tsx` still uses the default Create Next App title
  and description.
- `README.md` is still boilerplate and does not explain setup, env vars, or the
  product purpose.
- Public profile social links are partly placeholder values rather than
  user-managed data.
- The public profile experience depends heavily on users filling things out, so
  sparse profiles likely feel unfinished.
- There are no tests yet for the main profile editing and hero-pool flows.

## Roadmap

### Now

- Replace placeholder and starter content with project-specific metadata and
  documentation.
- Polish the core profile setup loop so onboarding, account editing, and hero
  pools feel complete and trustworthy.
- Improve empty states so owners know what to fill in next without exposing
  awkward blank UI publicly.

### Next

- Add editable social links for Battle.net, Twitch, X, and YouTube.
- Add profile completion prompts and guided setup cues in account settings.
- Add a compact "looking for" summary near the top of the public profile.
- Add validation helpers for external profile URLs and richer profile fields.
- Support featured Twitch clips or similar profile highlights.

### Later

- Add online presence to show who is around right now.
- Add availability windows with timezone-aware scheduling.
- Add matching and filtering around schedule overlap.
- Add a lightweight reconnect or "play again" flow.

### Quality Track

- Add tests for bio validation, onboarding edge cases, hero-pool save flows, and
  any clear-all or skip behavior.
- Add lightweight verification around auth redirects and public profile loading.

## Working Assumptions

- The app is intentionally centered on Discord-authenticated identity plus a
  separate app profile record.
- The main product value is quick player discovery and profile clarity, not a
  heavy social network.
- Sensitive trust decisions should continue to stay on the server.
- Future work should preserve the current route structure unless there is a
  strong product or maintenance reason to reorganize it.
