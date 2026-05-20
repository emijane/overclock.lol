# Overclock Repo Refactor Plan

Working plan. Update this document as refactor phases land.

## Status

- Phase 1: Inventory and doc alignment completed
- Phase 2A: Shared app-shell/navigation/presence relocation completed
- Phase 2B: Shared profile edit UI relocation completed
- Phase 2C: Shared matches/realtime UI relocation completed
- Phase 3A: Competitive shared UI extraction completed

## Historical Phase Log

These completed-phase notes are intentionally historical. They preserve the
exact migration record, including old paths that were valid when each phase was
executed.

### Phase 1 Completed

- created governance docs:
  - `AGENTS.md`
  - `docs/README.md`
  - `docs/agents/CLEANUP.md`
  - `docs/agents/QA.md`
  - app-local docs were later consolidated into root `docs/`
- aligned root `README.md` and `overclock/README.md` on current shipped route truth
- established root `docs/` as the canonical documentation home
- preserved legal-doc behavior by leaving `docs/legal/*` as the source of truth
- marked app-local drift docs as legacy or in-transition instead of deleting them
- confirmed `/teams` and `/scrims` should be treated as roadmap-only, not current shipped routes

### Phase 2A Completed

- moved obvious shared app-shell components from `overclock/app/components/*` to:
  - `overclock/components/app-shell/page-container.tsx`
  - `overclock/components/app-shell/page-reveal.tsx`
  - `overclock/components/app-shell/global-background-shell.tsx`
  - `overclock/components/app-shell/global-footer.tsx`
- moved obvious shared navigation components from `overclock/app/components/*` to:
  - `overclock/components/navigation/global-auth-bar.tsx`
  - `overclock/components/navigation/global-notifications-menu.tsx`
  - `overclock/components/navigation/global-notifications-menu-client.tsx`
  - `overclock/components/navigation/main-menu-user-search.tsx`
  - `overclock/components/navigation/user-menu.tsx`
- moved obvious shared presence components from `overclock/app/components/*` to:
  - `overclock/components/presence/presence-provider.tsx`
  - `overclock/components/presence/presence-indicator.tsx`
  - `overclock/components/presence/looking-to-play-badge.tsx`
- updated route imports to consume the new shared component paths
- completed the Phase 2 cleanup checkpoint by deleting the replaced legacy `overclock/app/components/*` duplicates after active imports were verified

### Phase 2B Completed

- moved the clearly shared profile edit UI cluster into `overclock/features/profile/*`:
  - `overclock/features/profile/components/profile-edit-form-fields.tsx`
  - `overclock/features/profile/hooks/use-profile-edit-form.ts`
  - `overclock/features/profile/types/profile-edit-types.ts`
- updated both account profile editing and public profile editing to import the shared profile edit UI from `overclock/features/profile/*`
- completed the Phase 2 cleanup checkpoint by deleting the replaced legacy route-local profile edit duplicates after active imports were verified
- left avatar and cover upload flows in their existing route-local locations because they are not yet clearly shared and still depend on account-route actions

### Phase 2C Completed

- moved the shared realtime refresh helper into:
  - `overclock/components/matches/play-invite-realtime-refresh.tsx`
- updated the shared notification menu client and the route-local matches refresh wrapper to import the shared helper from `overclock/components/matches/*`
- completed the Phase 2 cleanup checkpoint by deleting the replaced legacy `overclock/app/components/play-invite-realtime-refresh.tsx` copy after active imports were verified
- left notification business logic, matches business logic, presence architecture, and realtime infrastructure unchanged

### Phase 3A Completed

- moved the clearly shared competitive hero-picker UI into:
  - `overclock/features/competitive/components/role-hero-picker.tsx`
- updated the competitive role editor to import the picker from `overclock/features/competitive/components/*`
- deleted the replaced legacy `overclock/components/competitive/role-hero-picker.tsx` copy after active imports were verified
- left account-only competitive forms, onboarding logic, public-profile rendering, and competitive persistence logic unchanged

## Legacy Cleanup Pending

- review remaining route-local profile media editor files before any shared extraction
- defer deletion of generated artifacts to the dedicated cleanup phase

## Current Active State

This section reflects the current repo structure after completed cleanup work.
Treat it as the current-state source of truth inside this document.

### Current Structure

- `overclock/app/` is route-focused and should only own route entrypoints plus
  orchestration
- shared shell, navigation, presence, and matches UI now live under:
  - `overclock/components/app-shell/*`
  - `overclock/components/navigation/*`
  - `overclock/components/presence/*`
  - `overclock/components/matches/*`
- shared profile edit UI now lives under:
  - `overclock/features/profile/components/*`
  - `overclock/features/profile/hooks/*`
  - `overclock/features/profile/types/*`
- shared competitive hero-picker UI now lives under:
  - `overclock/features/competitive/components/role-hero-picker.tsx`
- shared matches-domain action entrypoints now live under:
  - `overclock/features/matches/actions.ts`
- `overclock/features/*` should own domain UI plus domain actions and mutations
- `overclock/lib/*` should own infra, data access, normalizers, policies, and
  the documented `lib/pages/*` page DTO boundary
- route-local competitive forms, public-profile rendering, profile media upload,
  and featured clips remain in `overclock/app/*`

### Current Cleanup Reality

- placeholder folders removed in cleanup:
  - `overclock/app/scrims`
  - `overclock/app/teams`
  - `overclock/app/theme`
  - `overclock/app/auth/confirm`
  - accidental `overclock/app/u/\`[username`]/profile`
- removed dead wrappers:
  - `overclock/app/u/[username]/profile/rank-icons.ts`
  - `overclock/app/u/[username]/profile/rank-border-styles.ts`
- removed unused `overclock/components/profile-editor/*` files
- remaining cleanup focus:
  - route-local profile media editor files
  - generated artifacts if tracked or cluttering audits
  - stale app-local docs and old-path references in historical notes

### Current Maintenance Guidance

- use the current-state sections above for repo audits
- treat old path references below as historical unless a section explicitly says
  it reflects current state
- keep `/teams` and `/scrims` documented as roadmap-only, not shipped routes

## Scope

- `overclock/` is the active Next.js app
- `docs/` exists both at repo root and inside `overclock/`
- shared UI is split between `app/components` and `components`
- cross-route feature logic exists inside route folders
- some folders appear orphaned or are placeholders
- Supabase files are split between `root/supabase` and `overclock/supabase`
- generated artifacts clutter source directories

## Rules:
- Route folders may import from:
  - components/*
  - features/*
  - lib/*
- Features may import from:
  - components/*
  - lib/*
- Shared components must NOT import route-local files
- Cross-route logic must not live inside app/*
- Avoid circular feature dependencies

Refactor structure only.
Do not redesign logic, rename APIs unnecessarily, or rewrite behavior unless required for the move.

During migration:
- update imports incrementally
- preserve compatibility where possible
- avoid moving multiple dependent systems in one phase

## Do not create feature modules unless:
- logic is shared across routes
- ownership is clearly domain-specific
- the move reduces coupling

## Required Governance Docs

Before any structural refactor begins, create and/or refactor the following governance docs:

- AGENTS.md
- docs/agents/CLEANUP.md
- docs/agents/QA.md

Goals:
- establish a permanent AI entrypoint
- reduce future prompt size
- centralize repo rules
- standardize cleanup procedures
- standardize QA procedures
- document ownership boundaries
- prevent architecture drift

Requirements:
- prefer refactoring existing docs instead of duplicating them
- keep docs concise and token-efficient
- AGENTS.md becomes the primary AI context file
- future prompts should start with:
  "Read AGENTS.md first"

AGENTS.md should include:
- project overview
- stack
- repo structure
- required reading order
- import boundaries
- architecture rules
- feature ownership rules
- cleanup expectations
- QA expectations
- documentation update rules

CLEANUP.md should include:
- dead file cleanup workflow
- unused import cleanup
- stale doc cleanup
- duplicate-system detection
- safe deletion rules

QA.md should include:
- route validation
- import validation
- lint/typecheck expectations
- UI consistency checks
- responsive/mobile checks
- edge-case verification
- regression prevention workflow

These governance docs must exist before execution phases begin.

## Historical Migration Record

The sections below preserve the original audit, planning snapshot, and
migration record. They intentionally include old paths, placeholder folders, and
pre-cleanup recommendations so completed work remains traceable.

## Re-Audit Summary

The repo is already mostly domain-oriented, but the boundaries are inconsistent.

- `overclock/app` contains both route code and shared cross-route code
- `overclock/components` contains some true shared UI plus at least one unused feature area
- docs live in two different systems
- there are a few clearly empty or accidental folders in the route tree

The safest refactor is a boundary cleanup:

- keep `app/` route-focused
- centralize shared UI
- move cross-route feature code out of route folders
- unify docs ownership
- remove empty or accidental folders last, after structure stabilizes

## Categorization

### Keep

- `overclock/app/*` route entry files:
  `page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`, route-local `actions.ts`
- `overclock/components/ui/*`
- `overclock/lib/*`
- `overclock/tests/*`
- `overclock/public/*`
- root `docs/legal/*`
  Reason: actively consumed by `overclock/app/legal/legal-document.tsx`
- `overclock/app/login/components/index.ts`
  Reason: actively imported as a barrel
- `overclock/features/competitive/components/role-hero-picker.tsx`
  Reason: actively used by competitive profile UI

### Move

- `overclock/app/components/*`
  Move to one shared home such as `overclock/components/app-shell/*`, `overclock/components/profile/*`, `overclock/components/presence/*`, or `overclock/features/*` depending on ownership.
- cross-route profile editing code currently under:
  `overclock/app/u/[username]/profile/*`
  Move shared pieces into a profile feature area.
- `overclock/app/account/profile-edit-form.tsx`
  Move alongside shared profile editing code after extraction.
- thin re-export wrappers under:
  - `overclock/app/u/[username]/profile/rank-icons.ts`
  - `overclock/app/u/[username]/profile/rank-border-styles.ts`
  Either remove or relocate after imports are rewritten.
- app-local docs
  Consolidate into root `docs/` after classifying roadmap vs QA vs implementation docs.

### Merge

- duplicate docs trees
  Consolidate into one root `docs/` tree with clear sections.
- root `README.md` and `overclock/README.md`
  Into one repo-level overview plus one app-level setup file, or rewrite both so they stop disagreeing.
- root `supabase/` and `overclock/supabase/`
  Likely keep only `overclock/supabase/` unless root `supabase/` is used by external tooling.
- shared UI split across:
  - `overclock/app/components`
  - `overclock/components`
  Merge into one shared component system.

### Delete

Only after implementation or migration is complete and imports are updated:

- empty placeholder folders and unused `overclock/components/profile-editor/*`
  files were already removed in cleanup checkpoints
- generated artifacts from tracked or source audits, not source:
  - `overclock/.next`
  - `overclock/.test-dist`
  - `overclock/tsconfig.tsbuildinfo`
  Only if they are actually checked in or cluttering versioned structure.
- possibly root `supabase/.temp`
  Only after confirming no external workflow depends on it.

### Review Manually

- `overclock/app/u/[username]/profile/featured-clips/*`
  The folder is valid, but some exports may be better shared under a profile feature module.
- `overclock/app/account/competitive/components/*`
  Some may stay route-local, some may belong in a reusable competitive feature module.
- `react-easy-crop`
  Still used by cover cropping, so it is not removable yet.
- `docs/qa/*`
  Several files reference `/teams` and `/scrims` as if implemented; likely stale but should be preserved or archived, not blindly deleted.

## Identification

### Route-Local Components

- `overclock/app/lfg/components/*`
- `overclock/app/login/components/*`
- `overclock/app/account/posts/components/*`
- `overclock/app/account/competitive/components/*`
- most of `overclock/app/u/[username]/profile/*`
- `overclock/app/matches/*` cards and refresh helpers
- `overclock/app/legal/legal-document.tsx`
- `overclock/app/account/avatar-upload-button.tsx`
- `overclock/app/u/[username]/profile/profile-cover-upload-button.tsx`

### Truly Shared Components

- `overclock/components/ui/*`
- likely shared from `overclock/app/components/*`:
  - `page-container.tsx`
  - `page-reveal.tsx`
  - `presence-provider.tsx`
  - `presence-indicator.tsx`
  - `global-auth-bar.tsx`
  - `global-footer.tsx`
  - `global-background-shell.tsx`
  - `user-menu.tsx`
  - `main-menu-user-search.tsx`
  - `ranked-avatar.tsx`
  - `looking-to-play-badge.tsx`
  - `play-invite-realtime-refresh.tsx`
  - `global-notifications-menu.tsx`
  - `global-notifications-menu-client.tsx`

### Feature-Specific Logic

- `overclock/lib/profiles/*`
- `overclock/lib/lfg/*`
- `overclock/lib/matches/*`
- `overclock/lib/competitive/*`
- `overclock/lib/badges/*`
- `overclock/lib/heroes/*`
- shared profile editing UI currently misplaced under:
  `overclock/app/u/[username]/profile/*`

### Infra / Domain Helpers

- `overclock/lib/supabase/*`
- `overclock/lib/admin/*`
- `overclock/proxy.ts`
- `overclock/next.config.ts`
- `overclock/eslint.config.mjs`
- `overclock/postcss.config.mjs`
- `overclock/tsconfig*.json`

### Stale Docs

Likely stale based on route reality mismatch:

- root `README.md`
- `docs/qa/lfg/LFG_SECTIONS_QA_REPORT.md`
- `docs/qa/archive/LFG_SECTIONS_QA_REPORT_2026-04-24.md`
- any docs describing `/teams` and `/scrims` as implemented or actively shippable

### Duplicate Docs

- root `README.md` vs `overclock/README.md`
- pre-consolidation parallel doc trees that previously existed before root `docs/` became canonical
- legal markdown is not duplicate right now; root `docs/legal/*` is the source of truth for the app pages

### Placeholder Routes / Folders

- `overclock/app/scrims`
- `overclock/app/teams`
- `overclock/app/theme`
- `overclock/app/auth/confirm`
- `overclock/app/u/\`[username`]/profile`

### Re-Export Wrappers That Add Little or No Value

- `overclock/app/u/[username]/profile/rank-icons.ts`
- `overclock/app/u/[username]/profile/rank-border-styles.ts`

These are route-local passthroughs to `lib/competitive`.

## Final Target Structure

```text
repo/
  README.md
  docs/
    branding/
    features/
    legal/
    roadmap/
    qa/
    ui/
    ux/
  overclock/
    README.md
    app/
      account/
      admin/
      api/
      auth/
      connections/
      duos/
      legal/
      lfg/
      login/
      matches/
      onboarding/
      privacy/
      stacks/
      terms/
      u/
        [username]/
      layout.tsx
      page.tsx
      globals.css
    components/
      ui/
      app-shell/
      presence/
      navigation/
      profile/
      matches/
    features/
      profile/
        components/
        hooks/
        types/
      competitive/
        components/
        hooks/
        types/
      lfg/
        components/
        types/
      matches/
        components/
        types/
      auth/
        components/
    lib/
      admin/
      badges/
      competitive/
      heroes/
      lfg/
      matches/
      profiles/
      supabase/
    public/
    supabase/
      migrations/
    tests/
    next.config.ts
    proxy.ts
    package.json
    tsconfig.json
    eslint.config.mjs
    postcss.config.mjs
```

## Exact Move Recommendations

### Shared App Shell / Navigation / Presence

- `overclock/app/components/page-container.tsx` -> `overclock/components/app-shell/page-container.tsx`
- `overclock/app/components/page-reveal.tsx` -> `overclock/components/app-shell/page-reveal.tsx`
- `overclock/app/components/global-auth-bar.tsx` -> `overclock/components/navigation/global-auth-bar.tsx`
- `overclock/app/components/global-footer.tsx` -> `overclock/components/app-shell/global-footer.tsx`
- `overclock/app/components/global-background-shell.tsx` -> `overclock/components/app-shell/global-background-shell.tsx`
- `overclock/app/components/user-menu.tsx` -> `overclock/components/navigation/user-menu.tsx`
- `overclock/app/components/main-menu-user-search.tsx` -> `overclock/components/navigation/main-menu-user-search.tsx`
- `overclock/app/components/global-notifications-menu.tsx` -> `overclock/components/navigation/global-notifications-menu.tsx`
- `overclock/app/components/global-notifications-menu-client.tsx` -> `overclock/components/navigation/global-notifications-menu-client.tsx`
- `overclock/app/components/presence-provider.tsx` -> `overclock/components/presence/presence-provider.tsx`
- `overclock/app/components/presence-indicator.tsx` -> `overclock/components/presence/presence-indicator.tsx`
- `overclock/app/components/looking-to-play-badge.tsx` -> `overclock/components/presence/looking-to-play-badge.tsx`
- `overclock/app/components/play-invite-realtime-refresh.tsx` -> `overclock/components/matches/play-invite-realtime-refresh.tsx`
- `overclock/app/components/ranked-avatar.tsx` -> `overclock/features/profile/components/ranked-avatar.tsx`

### Profile Feature Extraction

- `overclock/app/u/[username]/profile/profile-edit-form-fields.tsx` -> `overclock/features/profile/components/profile-edit-form-fields.tsx`
- `overclock/app/u/[username]/profile/use-profile-edit-form.ts` -> `overclock/features/profile/hooks/use-profile-edit-form.ts`
- `overclock/app/u/[username]/profile/profile-edit-types.ts` -> `overclock/features/profile/types/profile-edit-types.ts`
- `overclock/app/u/[username]/profile/profile-cover-upload-button.tsx` -> `overclock/features/profile/components/profile-cover-upload-button.tsx`
- `overclock/app/u/[username]/profile/profile-cover-crop.ts` -> `overclock/features/profile/components/profile-cover-crop.ts`
- `overclock/app/account/profile-edit-form.tsx` -> `overclock/features/profile/components/account-profile-edit-form.tsx`
- `overclock/app/account/avatar-upload-button.tsx` -> `overclock/features/profile/components/avatar-upload-button.tsx`
- `overclock/app/account/avatar-crop.ts` -> `overclock/features/profile/components/avatar-crop.ts`

### Competitive Feature Consolidation

- `overclock/components/competitive/role-hero-picker.tsx` -> `overclock/features/competitive/components/role-hero-picker.tsx`
- review whether `overclock/app/account/competitive/components/*` should remain route-local or also move into `features/competitive/components/*`

### Docs Consolidation

- roadmap docs -> root `docs/roadmap/*`
- QA docs -> root `docs/qa/*`
- legacy site-styles note -> merged into `docs/ui/OVERCLOCK_UI_SYSTEM.md`

### Supabase Consolidation

- keep `overclock/supabase/migrations/*` as the active app-owned schema and migrations location
- fold any meaningful root `supabase/` files into that location if they ever exist outside `.temp`

## Exact Delete Recommendations

Only after migration or verification is complete:

- delete empty folders:
  - `overclock/app/scrims`
  - `overclock/app/teams`
  - `overclock/app/theme`
  - `overclock/app/auth/confirm`
  - `overclock/app/u/\`[username`]/profile`
- delete unused files after confirming no imports:
  - `overclock/components/profile-editor/section-card.tsx`
  - `overclock/components/profile-editor/setup-section.tsx`
  - `overclock/components/profile-editor/socials-section.tsx`
- delete route-local wrapper files after direct imports are rewritten:
  - `overclock/app/u/[username]/profile/rank-icons.ts`
  - `overclock/app/u/[username]/profile/rank-border-styles.ts`
- delete generated artifacts from source control if tracked:
  - `overclock/.next/`
  - `overclock/.test-dist/`
  - `overclock/tsconfig.tsbuildinfo`
- delete root `supabase/.temp` only after confirming no developer workflow depends on it

## Exact Merge Recommendations

- merge README ownership:
  - root `README.md` = repo overview
  - `overclock/README.md` = app setup and route status
  - or reduce to one canonical README plus smaller setup note
- merge docs systems:
  - root `docs/` becomes source of truth
  - app-local docs are moved or archived there
- merge shared component systems:
  - `overclock/app/components` and `overclock/components`
  - final shared home should be `overclock/components/*`
- merge duplicate conceptual ownership:
  - route-local profile editing code and account editing code into one profile feature module

## Dependency / Risk Warnings

- high risk:
  - `overclock/app/u/[username]/profile/*`
  - heavily referenced from public profile, account editing, cover/avatar flows, featured clips
- high risk:
  - `overclock/app/components/*`
  - used across layout, auth bar, navigation, LFG, matches, profile
- medium risk:
  - docs consolidation
  - legal docs are loaded from root `docs/legal/*`, so moving them needs path updates
- medium risk:
  - `overclock/supabase/*`
  - migrations and temp linking metadata can affect local tooling
- low risk:
  - empty route folders
  - unused `components/profile-editor/*`
  - thin re-export wrappers
  - generated artifacts

## Low-Risk Cleanup Opportunities

- remove empty `app` folders
- remove accidental `app/u/\`[username`]` duplicate tree
- remove unused `components/profile-editor/*`
- remove thin rank helper wrappers after import cleanup
- standardize README language about `/teams` and `/scrims`
- move generated artifacts fully out of tracked structure

## Risky Areas

- profile editing extraction
- shared navigation and app shell extraction
- docs source-of-truth change if legal pages depend on filesystem paths
- Supabase location cleanup if scripts or tooling assume root vs app-local paths
- competitive feature moves if account route and public profile share types indirectly

## Safest Refactor Order

1. Freeze route-status truth:
   reconcile root `README.md`, `overclock/README.md`, and stale QA notes.
2. Remove only obviously empty accidental folders:
   `app/theme`, `app/auth/confirm`, `app/u/\`[username`]/profile`.
3. Decide doc source of truth:
   root `docs/` is the best candidate because app legal pages already read from it.
4. Consolidate shared component ownership:
   move `app/components/*` into `components/*` without changing behavior.
5. Extract profile editing into `features/profile/*`.
6. Extract competitive shared UI into `features/competitive/*` if still needed after step 5.
7. Delete verified-unused `components/profile-editor/*`.
8. Remove thin rank wrappers.
9. Resolve root `supabase/` vs `overclock/supabase/`.
10. Clean generated artifacts and tighten ignores.

## Migration Strategy

### Migration Phase 1: Inventory and Doc Alignment

- no behavior changes
- confirm ownership of docs, Supabase, shared components

### Migration Phase 2: Shared-Component Relocation

Phase 2A:
- move obvious app-shell/navigation/presence shared components

Phase 2B:
- move clearly shared profile edit UI

Phase 2C:
- move clearly shared matches/realtime UI helpers

### Migration Phase 3: Feature Extraction

- move profile and competitive cross-route code into feature folders

### Migration Phase 4: Cleanup

- delete unused wrappers, empty folders, stale placeholders

### Migration Phase 5: Consistency Pass

- update READMEs, docs references, and import conventions

## After each phase:
- run lint/typecheck
- verify imports
- verify route rendering
- verify no dead imports remain
- update docs immediately
- summarize all moved/deleted files

## If a phase introduces instability:
- stop further refactors
- restore previous import paths
- revert only the affected phase
- re-run validation before continuing

## Do not refactor:
- auth architecture
- middleware/proxy
- Supabase clients
- realtime systems
- notification infrastructure
until structural cleanup is stable.

## Documentation Rules

- Every structural change must update affected docs immediately
- Do not allow docs to become stale between phases
- Remove or archive stale docs after replacements are verified
- Prefer updating existing docs over creating new ones
- Avoid duplicate conceptual docs
- Keep docs concise and optimized for AI scanning
- AGENTS.md should remain the canonical AI entrypoint

## Execution Constraints

- Execute one phase at a time
- Do not combine phases
- Stop after each phase and summarize:
  - moved files
  - deleted files
  - updated imports
  - updated docs
  - remaining risks
- Wait for confirmation before continuing to the next phase
