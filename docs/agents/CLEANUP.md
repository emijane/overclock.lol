# Cleanup Guide

Use this for safe repo cleanup work.

## Goals

- reduce dead files and duplicate systems
- keep route boundaries clear
- avoid deleting unique information

## Workflow

1. Identify the candidate file or folder.
2. Verify current imports and references.
3. Verify whether the content is unique.
4. Preserve useful content elsewhere if needed.
5. Delete only after verification is complete.

## Safe Deletion Rules

- Do not delete a file unless it is unused or fully replaced.
- Do not delete docs until the surviving doc contains the useful information.
- Do not delete empty route folders until route status is documented clearly.
- Do not treat generated artifacts as architecture source of truth.

## What To Clean First

- empty placeholder folders
- dead wrappers and re-export shims
- stale duplicate docs
- generated artifacts that are tracked or clutter audits

## Duplicate-System Checks

Watch for:

- multiple shared component homes
- docs split across root and app-local trees
- route-local code reused across unrelated routes
- infra split across root and app-local locations

## Documentation Cleanup

- prefer root `docs/` as the canonical destination
- preserve root `docs/legal/*` behavior
- mark stale docs as legacy before archiving or deleting them

## Stop Conditions

Stop and reassess if:

- a file has active imports
- a doc is still the only source of a policy or workflow
- a cleanup changes behavior instead of structure
