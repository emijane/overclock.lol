# Project Context and Roadmap

This note is a lightweight orientation doc for people working inside the repo.
It captures what the app currently does, how it is structured, and what the
next sensible product steps look like based on the current codebase and `TODO`.

## Project Snapshot

`overclock.lol` is a Next.js App Router app for Overwatch players to create a
public profile, connect through Discord auth, and share matchmaking-relevant
details such as rank, platform, preferred server, bio, preferred hero pools,
social links, and featured videos.

The current product shape is profile-first rather than feed-first:

- `/login` is the main entry point and auth gate.
- `/onboarding` creates an app profile for a Discord-authenticated user.
- `/account` is currently a placeholder settings route.
- `/account/competitive` manages per-role rank and hero setup.
- `/account/hero-pools` redirects to `/account/competitive` for old links.
- `/account/posts` is the private owner-only surface for managing LFG posts.
- `/u/[username]` renders the public player profile.
- `/lfg` is the top-level LFG hub.
- `/duos` is now a browse-first LFG feed with first-pass URL-based filters and
  a dedicated create route at `/duos/create`.
- `/stacks`, `/scrims`, and `/teams` still support inline browsing and creating
  LFG posts, with first-pass URL-based filters currently enabled on `/stacks`.

The homepage currently redirects to `/login`.

## Current Product Flow

1. A user signs in with Discord through Supabase auth.
2. If they do not yet have a `profiles` row, they are redirected to onboarding.
3. Onboarding creates the app-specific profile with a unique username.
4. The user can fill in account details like bio, region, preferred server, platform,
   rank, and looking-for preferences from the edit modal on `/u/[username]`.
5. The user can separately define hero pools by role.
6. Their public profile is available at `/u/[username]`.
7. Once their profile and Competitive Profile are set up, they can create LFG
   posts in Duos, Stacks, Scrims, and Teams, with Duos now using a dedicated
   post-creation route instead of an inline feed composer.
8. Active posts appear in section feeds and on the public profile.
9. They can review active, closed, and expired posts from `/account/posts`.

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
- Shared LFG policy, query, and display helpers live under `lib/lfg/*`, while
  reusable section UI lives under `app/lfg/*`.
- Metadata and top-level docs should stay aligned with the current profile-first
  product as the app evolves.

## Current Gaps

These are already visible in the codebase today:

- The public profile experience depends heavily on users filling things out, so
  sparse profiles likely feel unfinished.
- There are no tests yet for the main profile editing, hero-pool, and LFG post
  flows.
- `/teams` and `/scrims` do not yet have the first-pass feed filters now used
  on `/duos` and `/stacks`.
- Rank verification remains a roadmap-only trust system rather than a shipped
  feature.

## Roadmap

### Now

- Replace placeholder and starter content with project-specific metadata and
  documentation.
- Polish the core profile setup loop so onboarding, account editing, and hero
  pools feel complete and trustworthy.
- Improve empty states so owners know what to fill in next without exposing
  awkward blank UI publicly.

### Next

- Add profile completion prompts and guided setup cues in account settings.
- Add a compact "looking for" summary near the top of the public profile.
- Add validation helpers for external profile URLs and richer profile fields.
- Build rank verification for high-rank role claims and related trust display.
- Decide whether `/teams` and `/scrims` should get first-pass filters similar
  to `/duos` and `/stacks`.
- Add optional cleanup or backfill for expired LFG posts if explicit closed
  status becomes important for analytics, moderation, or history.

### Later

- Add online presence to show who is around right now.
- Add availability windows with timezone-aware scheduling.
- Add matching and filtering around schedule overlap.
- Add a lightweight reconnect or "play again" flow.

### Quality Track

- Add tests for bio validation, onboarding edge cases, hero-pool save flows,
  LFG creation and close behavior, and any clear-all or skip behavior.
- Add lightweight verification around auth redirects and public profile loading.

## Working Assumptions

- The app is intentionally centered on Discord-authenticated identity plus a
  separate app profile record.
- The main product value is quick player discovery and profile clarity, not a
  heavy social network.
- Sensitive trust decisions should continue to stay on the server.
- Future work should preserve the current route structure unless there is a
  strong product or maintenance reason to reorganize it.
