Read AGENTS.md first.

# Overclock Repo Guide

## Project Overview

- `overclock/` is the active Next.js app.
- The product is a profile-first Overwatch player app with Discord auth, public
  profiles, competitive setup, featured clips, connections, and LFG posting.
- Current shipped LFG surfaces are:
  - `/lfg`
  - `/duos`
  - `/duos/create`
  - `/stacks`
- `/teams` and `/scrims` are roadmap topics, not current shipped routes.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase SSR auth and database access

## Required Reading Order

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/agents/CLEANUP.md`
4. `docs/agents/QA.md`
5. App-specific docs only if the task needs them
6. Before any Next.js code change, read the relevant file in
   `overclock/node_modules/next/dist/docs/`

## Source Of Truth

- Root `docs/` is the canonical documentation home.
- Root `docs/legal/*` must remain the source of truth for legal page content
  because app code reads those files directly.
- `overclock/docs/` is currently a mix of working notes, roadmap material, and
  historical QA. Prefer updating root docs first and only keep app-local docs
  when no root equivalent exists yet.

## Repo Structure

- `README.md`: repo overview and high-level route/status summary
- `docs/`: canonical repo documentation
- `overclock/`: active app
- `overclock/app/`: route files and route-local UI
- `overclock/components/`: shared UI
- `overclock/components/app-shell/`: shared layout and shell primitives
- `overclock/components/matches/`: shared matches and realtime UI helpers
- `overclock/components/navigation/`: shared navigation and menu UI
- `overclock/components/presence/`: shared presence state and badges
- `overclock/features/`: cross-route feature-owned shared code
- `overclock/features/auth/`: shared auth-domain entrypoints
- `overclock/features/presence/`: shared presence-domain entrypoints
- `overclock/features/competitive/`: shared competitive-domain UI
- `overclock/lib/`: infra and domain helpers
- `overclock/tests/`: tests
- `overclock/supabase/`: active migrations

## Architecture Rules

- Keep `overclock/app/` route-focused.
- Route folders may import from:
  - `components/*`
  - `features/*`
  - `lib/*`
- Shared components must not import route-local files.
- Cross-route logic should not live inside `app/*`.
- Prefer domain ownership over generic helper sprawl.
- Do not create empty convention folders unless they are immediately useful.

## Feature Ownership Rules

- Shared UI primitives belong in `overclock/components/ui/*`.
- App-shell and navigation UI should live in shared component space, not inside
  route folders.
- Cross-route profile, competitive, LFG, and matches logic should eventually
  live in domain-owned shared locations rather than route-local folders.
- `lib/*` is for infra, data access, normalization, policies, and pure helpers.

## Cleanup Expectations

- Prefer updating or merging existing docs instead of creating duplicates.
- Do not delete files until usage is verified.
- Do not remove unique information without preserving it elsewhere.
- Generated artifacts are not source and should not drive architecture choices.
- Follow `docs/agents/CLEANUP.md` for cleanup work.

## QA Expectations

- Validate route truth before updating docs.
- Keep `/teams` and `/scrims` documented as roadmap-only unless routes are
  actually shipped.
- Run the smallest useful verification for the scope you changed.
- Follow `docs/agents/QA.md` for QA and regression checks.

## Documentation Rules

- Update docs in the same phase as the structural or behavior change.
- Prefer concise, AI-readable docs.
- Archive stale docs with a clear legacy note instead of silently leaving them
  misleading.
- Keep repo and app READMEs aligned on route status and setup.

## Commits

After making code or doc changes, always provide a git commit message
summarizing what changed and why.
