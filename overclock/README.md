# overclock.lol app

`overclock.lol` is a profile-first Overwatch player app built with Next.js and Supabase.
Users sign in with Discord, create an app-specific username, edit profile details from
their public profile modal, manage role-based competitive setup, save social links, add
featured videos, and create LFG posts.

## Current product

- `/login` is the auth entry point.
- `/onboarding` creates the app profile and reserves a username.
- `/u/[username]` renders the public profile and hosts the profile edit modal for owners.
- `/account` manages manual availability and offline presence privacy settings.
- `/account/competitive` manages per-role Competitive Profile setup.
- `/account/hero-pools` redirects to `/account/competitive` for old links.
- `/account/posts` is the private LFG management page for active and past posts.
- `/lfg` is the main LFG hub.
- `/duos` is the browse-first duo feed with server-rendered filters, feed search, and
  a dedicated create route at `/duos/create`.
- `/stacks` is the stack feed with a dedicated create route at `/stacks/create`.
- Stacks currently ship as fixed-size `1/5` groups:
  - the owner is inserted automatically on create
  - accepted members increase the count up to `5/5`
  - `active` and `filled` stacks occupy the user for one-stack-at-a-time rules
  - public cards expose accepted members only through overlapping clickable avatars
  - signed-in users already in an active stack see a current-stack panel on
    `/stacks` with owner, accepted members, capacity, and existing view/leave
    actions when safe
- `/teams` and `/scrims` are not currently implemented routes, even though some roadmap
  notes still discuss them as future surfaces.

Canonical repo docs live in `../docs/`.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase SSR auth

## Environment variables

Create an `.env.local` file in `overclock/` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

The app also expects Supabase auth to be configured for Discord sign-in.
The OAuth callback route in this app is `/auth/callback`.

## Local development

Install dependencies and run the app from this folder:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run verify
```

## Notes

- Session refresh is handled through `proxy.ts`.
- Profile editing writes stay on the server through server actions.
- Public profile cover media URLs are derived from the configured Supabase project URL.
- Public profiles currently include badges, presence, featured clips, preferred hero
  pools, and recent active LFG posts.
- The global header currently exposes Duos and Stacks navigation plus placeholder
  notifications for signed-in users.
- Root `docs/legal/*` is intentionally the source of truth for legal page content.

## Next Steps

- Run live regression QA against stack create/request/accept/leave/remove flows after DB changes.
- Keep root `../docs/` roadmap and QA notes aligned with shipped behavior.
- Keep `/teams` and `/scrims` documented as roadmap-only until real routes ship.
