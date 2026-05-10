# QA Guide

Use this for structural and doc-phase validation.

## Route Truth

Current shipped LFG routes:

- `/lfg`
- `/duos`
- `/duos/create`
- `/stacks`
- `/stacks/create`

Roadmap-only, not currently shipped:

- `/teams`
- `/scrims`

## Validation Order

1. Confirm route/status docs are truthful.
2. Confirm imports still point at real files.
3. Run targeted lint or typecheck for the changed area when possible.
4. Check for stale references in docs and READMEs.

## Structural QA

- verify route-local code is not presented as shared code
- verify shared components do not depend on route-local files
- verify no empty placeholder folder is treated as shipped functionality

## Doc QA

- keep root `docs/` canonical unless code requires another location
- keep legal docs readable from root `docs/legal/*`
- remove or clearly label stale route claims
- keep docs concise and AI-readable

## UI / Responsive Checks

For any UI-adjacent cleanup or reorganization:

- confirm no route description implies unshipped UI
- confirm component docs still match current visual system
- confirm mobile/responsive notes still reflect current app surfaces

## Regression Prevention

- change one phase at a time
- summarize updated, archived, or deleted docs
- stop before Phase 2 if Phase 1 truth and ownership are still unclear
