# Docs Guide

Root `docs/` is the canonical documentation home for this repository.

## Purpose

- keep high-signal project guidance in one place
- reduce drift between repo docs and app-local notes
- keep documentation concise and AI-readable

## Source Of Truth

- `docs/legal/*`: canonical legal content
  - Required by app code in `overclock/app/legal/legal-document.tsx`
- `docs/ui/*`: canonical UI and styling guidance
- `docs/agents/*`: canonical AI workflow, cleanup, and QA guidance
- `README.md`: canonical repo overview
- `overclock/README.md`: app setup and app-specific operational details

## Current Exceptions

- `overclock/docs/roadmap/*` and `overclock/docs/qa/*` still contain active
  working notes and historical audits that have not been fully migrated yet.
- Treat those app-local docs as legacy or in-transition unless a root doc points
  to them directly.

## Route Truth

Current shipped LFG surfaces:

- `/lfg`
- `/duos`
- `/duos/create`
- `/stacks`
- `/stacks/create`

Roadmap-only, not currently shipped routes:

- `/teams`
- `/scrims`

## Maintenance Rules

- update existing docs before creating new parallel docs
- preserve legal doc paths unless app code is intentionally updated
- add clear legacy notes to stale docs before archiving or deleting them
