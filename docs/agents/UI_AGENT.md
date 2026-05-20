# UI Agent Guide

Use this when working on overclock.lol UI tasks.

## Read First

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/agents/QA.md`
4. `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md`
5. `docs/ui/UI_COMPONENT_REGISTRY.md`
6. `docs/ui/UI_DECISION_RULES.md`

Read app-specific docs only if the task needs them.

## How To Approach UI Tasks

1. Audit first:
   - identify the page type
   - inspect the current route/component structure
   - confirm whether the duplication is real or only visually similar
2. Identify the page type:
   - feed page
   - settings page
   - profile section
   - management panel
   - legal/auth/supporting page
3. Choose the closest shipped source-of-truth example before editing.
4. Reuse shared shell primitives first:
   - `overclock/components/app-shell/page-container.tsx`
   - `overclock/components/app-shell/page-reveal.tsx`
   - `overclock/components/app-shell/dark-page-shell.tsx` when the route matches the repeated dark atmosphere family
5. Reuse shared styling from `overclock/app/globals.css`.
6. Reuse existing action controls, dropdowns, rows, and cards before creating new ones.
7. Extract only confirmed duplication.
8. Verify after each cleanup step.
9. Do not chain multiple refactors in one pass unless the task explicitly asks for a broader sweep.

## How To Choose Source-Of-Truth Examples

- Start with the nearest existing shipped example, not the most generic component.
- Use this selection order:
  1. same route family
  2. same page type
  3. same interaction pattern
  4. same visual treatment
- If one file already covers the job cleanly, copy that pattern instead of blending multiple references.

- Feed page:
  - `overclock/features/lfg/components/lfg-page-shell.tsx`
- Settings page:
  - `overclock/app/account/page.tsx`
  - `overclock/components/app-shell/dark-page-shell.tsx`
- Profile section:
  - `overclock/app/u/[username]/page.tsx`
  - `overclock/app/u/[username]/profile/profile-header.tsx`
- Management page:
  - `overclock/app/account/posts/page.tsx`
- Compact modal:
  - `overclock/features/profile/components/profile-edit-modal-shell.tsx`
- Row/list item:
  - `overclock/features/matches/components/match-card.tsx`

Pick the closest existing example. Do not blend multiple unrelated styles unless the task clearly spans them.

## What To Preserve

- Dark-first styling
- Existing `oc-*` class system
- Existing page spacing and radius language
- Existing server/client boundaries
- Existing shared action surfaces and dropdown behavior
- Existing ownership boundaries between route-owned UI and shared app-shell/UI primitives

## What Not To Change By Default

- Do not rename components.
- Do not refactor architecture during a styling-only task.
- Do not introduce a new page background direction.
- Do not replace shipped styles with generic defaults from `components/ui/button.tsx`.
- Do not create thin wrappers unless there is a real ownership need.

## Preferred Reuse Targets

- Page shell:
  - `overclock/components/app-shell/page-container.tsx`
  - `overclock/components/app-shell/page-reveal.tsx`
  - `overclock/components/app-shell/dark-page-shell.tsx`
- Feed shell:
  - `overclock/features/lfg/components/lfg-page-shell.tsx`
- Account route-owned row:
  - `overclock/app/account/components/settings-toggle-card.tsx`
- Feed cards:
  - `overclock/features/lfg/components/lfg-post-card.tsx`
  - `overclock/features/lfg/components/stack-post-card.tsx`
- Actions:
  - `overclock/components/lfg/lfg-post-actions-menu.tsx`
  - `overclock/components/blocks/user-block-controls.tsx`
  - `overclock/components/matches/lfg-invite-button.tsx`
- Row/list pattern:
  - `overclock/features/matches/components/match-card.tsx`

## QA Expectations

- Check the page on mobile first.
- Check `sm`, `md`, and `xl` behavior where relevant.
- Verify route-owned extractions stayed inside the correct ownership boundary.
- Verify typography matches:
  - `oc-profile-display` for primary text
  - `oc-profile-meta` for secondary text
- Verify cards and panels use existing surface classes or matching treatments.
- Verify no duplicate dropdown/action control was introduced.
- Verify no server/client boundary was broken during extraction.
- Run `npm run verify` when the task changes project files unless the user explicitly narrows QA.
- Run the smallest useful validation for the changed area.

## Final Output Expectations

- Name the source-of-truth files you followed.
- Call out any duplication that remains.
- If you intentionally did not extract something, say why.
