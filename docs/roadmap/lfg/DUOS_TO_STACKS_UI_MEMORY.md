# Duos UI Memory For Later Stacks Parity

This note captures the recent Duos feed updates that now define the current
Duos baseline and may later be mirrored on `/stacks`.

## Current References

Routes in scope:

- `/duos`
- `/duos/create`
- `/stacks`
- `/stacks/create`

Shared implementation references:

- `overclock/features/lfg/components/lfg-page-shell.tsx`
- `overclock/features/lfg/components/lfg-post-list.tsx`
- `overclock/features/lfg/components/lfg-post-card.tsx`
- `overclock/features/lfg/components/duos-infinite-feed.tsx`
- `overclock/features/lfg/duos-feed.ts`
- `overclock/app/api/lfg/duos/route.ts`
- `overclock/lib/lfg/posts/posts-queries.ts`

## Shipped Duos Baseline

The current Duos feed now ships with these UI choices:

- Duos uses the full browser width while preserving route padding.
- Duos uses a 4-column desktop card grid.
- Duos card avatars no longer use the border treatment still present on stacks.

These are shared-path changes for the real `/duos` page, not fixture-only
styles.

## Temporary Fixture Workflow

Current temporary testing support:

- `/duos?fixtures=1`
- `/stacks?fixtures=1`

Important behavior notes:

- Fixture mode is temporary UI/testing support, not a product feature.
- `/duos?fixtures=1` uses the same shared Duos UI path as live `/duos`.
- Fixture mode was added to make dense grid, scroll, and pagination-style UI
  checks easier without depending on live feed volume.
- Duos fixtures now follow the same initial-page plus append flow as live Duos,
  instead of dumping every placeholder card at once.

## Duos Infinite Scroll Baseline

The current Duos feed now uses a Pinterest-style append pattern with performance
as the first constraint:

- `/duos` server-renders only the first feed batch.
- Later batches append client-side as a bottom sentinel enters view.
- Pagination uses a cursor built from `createdAt + id`.
- Feed ordering stays `created_at desc, id desc`.
- Append requests are bounded and do not use offset pagination.
- Already rendered cards stay mounted while the next batch loads.
- Append state is deduped by post id before merging.

Implementation notes worth preserving:

- The Duos grid/cards remain presentational; fetch orchestration lives in
  `duos-infinite-feed.tsx`.
- The server feed contract lives in `duos-feed.ts`.
- The append endpoint is `GET /api/lfg/duos`.
- The query layer uses the shared LFG post query helper with cursor filtering.
- Fixture mode (`/duos?fixtures=1`) mirrors the same SSR-plus-append behavior so
  scroll and pagination testing stay realistic.

Why this was chosen:

- It reduces the initial Duos payload versus loading the entire feed at once.
- It avoids offset scans, which are the wrong long-term performance shape for
  growing feeds.
- It keeps route-level loading small and moves later work into bounded batch
  fetches.

## Later Stacks Parity Checklist

When revisiting `/stacks`, review these Duos changes explicitly:

- Mirror the full-width shell behavior if stacks should share the same browsing
  width.
- Re-evaluate whether stacks should also move to a 4-column desktop grid or
  intentionally stay at 3 columns.
- Re-evaluate whether stacks avatars should lose the current border treatment.
- Decide whether fixture support should remain a Duos-led testing aid or stay
  available on both Duos and Stacks.
- Copy the same infinite-scroll shape:
  initial SSR batch, client append sentinel, cursor pagination, bounded batch
  size, and append dedupe.
- Prefer reusing the Duos cursor/query pattern for stacks instead of adding
  offset pagination or a separate loading model.

## What Is Intentionally Duos-Specific For Now

These points should not be assumed to be automatic stacks decisions:

- 4-column desktop feed density
- borderless avatar treatment on feed cards
- Duos as the primary reference surface for LFG polish
- Duos being the first LFG surface to adopt infinite scroll

Use this note as a small handoff/reference when stacks UI work resumes, not as
a broader LFG UX policy replacement.
