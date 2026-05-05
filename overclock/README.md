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
- `/stacks` currently supports inline creating and browsing posts with the same first-pass
  filter model as Duos.
- `/teams` and `/scrims` are not currently implemented routes, even though some roadmap
  notes still discuss them as future surfaces.

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
```

## Notes

- Session refresh is handled through `proxy.ts`.
- Profile editing writes stay on the server through server actions.
- Public profile cover media URLs are derived from the configured Supabase project URL.
- Public profiles currently include badges, presence, featured clips, preferred hero
  pools, and recent active LFG posts.
- The global header currently exposes Duos and Stacks navigation plus placeholder
  notifications for signed-in users.
