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

## Later Stacks Parity Checklist

When revisiting `/stacks`, review these Duos changes explicitly:

- Mirror the full-width shell behavior if stacks should share the same browsing
  width.
- Re-evaluate whether stacks should also move to a 4-column desktop grid or
  intentionally stay at 3 columns.
- Re-evaluate whether stacks avatars should lose the current border treatment.
- Decide whether fixture support should remain a Duos-led testing aid or stay
  available on both Duos and Stacks.

## What Is Intentionally Duos-Specific For Now

These points should not be assumed to be automatic stacks decisions:

- 4-column desktop feed density
- borderless avatar treatment on feed cards
- Duos as the primary reference surface for LFG polish

Use this note as a small handoff/reference when stacks UI work resumes, not as
a broader LFG UX policy replacement.
