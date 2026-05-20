# Docs Guide

Root `docs/` is the canonical documentation home for this repository.

## Purpose

- keep active project guidance in one place
- avoid parallel sources of truth between repo-root and app-local notes
- preserve useful historical context without letting it read like current policy

## Canonical Structure

- `docs/agents/`
  - workflow guidance for cleanup, QA, and agent behavior
- `docs/architecture/` and root architecture notes
  - repo structure, DTO strategy, and codebase audits
- `docs/legal/`
  - canonical legal content read directly by app code
- `docs/performance/`
  - latency and route-performance audits
- `docs/qa/`
  - active QA references plus historical archives
- `docs/roadmap/`
  - shipped-behavior notes, future planning, and the product backlog
- `docs/security/`
  - auth, session, and platform-security references
- `docs/ui/` and `docs/ux/`
  - current UI system guidance and UX patterns
- `docs/features/`
  - feature-specific docs that do not fit better in roadmap or QA

## Source Of Truth

- `docs/legal/*`
  - required by `overclock/components/legal/legal-document.tsx`
- `docs/agents/*`
  - workflow and maintenance guidance
- `docs/roadmap/*`
  - current product-shape notes and backlog
- `docs/qa/*`
  - current QA references and archived historical audits
- `README.md`
  - canonical repo overview
- `overclock/README.md`
  - app setup and app-specific operational details

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

- update an existing root doc before creating a new parallel note
- preserve `docs/legal/*` paths unless app code is intentionally updated
- move working notes into root `docs/` once they become stable references
- archive outdated QA snapshots instead of leaving them mixed with active docs
