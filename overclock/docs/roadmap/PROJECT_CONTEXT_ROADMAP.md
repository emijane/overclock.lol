# Project Context and Roadmap

This note is a lightweight orientation doc for people working inside the repo.
It captures what the app currently does, how it is structured, and what the
next sensible product steps look like based on the current codebase and `TODO`.

## Project Snapshot

`overclock.lol` is a Next.js App Router app for Overwatch players to create a
public profile, connect through Discord auth, and share matchmaking-relevant
details such as rank, platform, preferred server, bio, preferred hero pools,
social links, featured videos, presence, and LFG posts.

The current product shape is profile-first rather than feed-first:

- `/login` is the main entry point and auth gate.
- `/onboarding` creates an app profile for a Discord-authenticated user.
- `/account` now ships small account controls for `Looking to play` and offline
  presence privacy, plus a lightweight placeholder for future account settings.
- `/account/competitive` manages per-role rank and hero setup.
- `/account/hero-pools` redirects to `/account/competitive` for old links.
- `/account/posts` is the private owner-only surface for managing LFG posts.
- `/u/[username]` renders the public player profile.
- `/lfg` is the top-level LFG hub.
- `/duos` is now a browse-first LFG feed with first-pass URL-based filters and
  a dedicated create route at `/duos/create`.
- `/stacks` still supports inline browsing and creating LFG posts, with
  first-pass URL-based filters currently enabled.
- `/teams` and `/scrims` are discussed in roadmap notes but do not currently
  exist as shipped routes in `app/`.
- LFG posts now store both `posting_role` and `looking_for_roles`, and `/duos`
  plus `/stacks` now expose both `Role` and `Needs` filters for role-pair
  browsing.
- Current Duos and Stacks rank filtering is tier-only via `Min rank` /
  `Max rank`; exact division-level matching is intentionally out of scope for
  the current version.
- `/duos` also now supports feed search in addition to the first-pass filters.

The homepage currently redirects to `/login`.

## Current Product Flow

1. A user signs in with Discord through Supabase auth.
2. If they do not yet have a `profiles` row, they are redirected to onboarding.
3. Onboarding creates the app-specific profile with a unique username.
4. The user can fill in account details like bio, region, preferred server,
   platform, socials, featured clips, and looking-for preferences from the edit
   modal on `/u/[username]`.
5. The user can define competitive ranks and hero pools by role on
   `/account/competitive`.
6. Their public profile is available at `/u/[username]`.
7. Once their profile and Competitive Profile are set up, they can create LFG
   posts in Duos and Stacks, with Duos now using a dedicated post-creation
   route instead of an inline feed composer.
8. Active posts appear in section feeds and on the public profile.
9. They can review active, closed, and expired posts from `/account/posts`.
10. They can toggle `Looking to play` and hide offline presence from `/account`.

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
- Presence and availability UI now live in shared app components and account
  settings, with current status displayed on profile surfaces and LFG cards.
- The global authenticated shell currently includes top-level Duos / Matches /
  Stacks navigation, a placeholder notifications bell dropdown, the account
  menu, and smaller toast-style alerts below the main menu.
- Metadata and top-level docs should stay aligned with the current profile-first
  product as the app evolves.

## Current Gaps

These are already visible in the codebase today:

- The public profile experience depends heavily on users filling things out, so
  sparse profiles likely feel unfinished.
- There are no tests yet for the main profile editing, hero-pool, and LFG post
  flows.
- Rank verification remains a roadmap-only trust system rather than a shipped
  feature.
- Invite to Play is only partially shipped: the backend send flow and `/matches`
  route now exist, and backend lifecycle RPCs now cover accept/decline/cancel,
  public profiles plus Duos/Stacks cards now expose first-pass invite-send
  actions, the notification bell now shows incoming pending invites, and the
  bell plus `/matches` now refresh on realtime invite changes.

## Roadmap

### Now

- Polish the core profile setup loop so onboarding, account editing, and hero
  pools feel complete and trustworthy.
- Improve empty states so owners know what to fill in next without exposing
  awkward blank UI publicly.
- Keep roadmap notes in sync with the currently shipped Duos/Stacks-only LFG
  surface area.

### Next

- Add profile completion prompts and guided setup cues in account settings.
- Add validation helpers for external profile URLs and richer profile fields.
- Build rank verification for high-rank role claims and related trust display.
- Finish Invite to Play UI flows by replacing the placeholder bell dropdown with
  deeper invite polish, richer edge-case handling, and any remaining UX cleanup
  across the existing profile, feed, bell, and matches surfaces.
- Add optional cleanup or backfill for expired LFG posts if explicit closed
  status becomes important for analytics, moderation, or history.

### Later

- Add online presence to show who is around right now.
- Add availability windows with timezone-aware scheduling.
- Add matching and filtering around schedule overlap.
- Add a lightweight reconnect or "play again" flow.

## Related Roadmap Notes

- `docs/roadmap/presence/USER_PRESENCE_AND_AVAILABILITY.md` - Use when planning
  automatic online presence, recent activity fallback, and the separate
  `Looking to play` availability state.
- `docs/roadmap/matches/INVITE_TO_PLAY_ROADMAP.md` - Use when planning invite
  notifications, accepted-match history, contact unlock rules, and `/matches`.

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
