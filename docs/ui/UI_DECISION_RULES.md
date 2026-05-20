# UI Decision Rules

Use `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md` and `docs/ui/UI_COMPONENT_REGISTRY.md` before making UI decisions.

## Core Rules

### Reuse before create

- Reuse an existing page pattern before creating a new one.
- Reuse an existing shared component before creating a route-local version.
- Reuse an existing `oc-*` class before inventing a new surface, pill, or typography treatment.
- Reuse a recent extraction such as `overclock/components/app-shell/dark-page-shell.tsx` or `overclock/app/account/components/settings-toggle-card.tsx` before copying that pattern again.

### Preserve server/client boundaries

- Do not move client state into a server component just to share markup.
- Do not move server-only data access into client components.
- If a UI extraction crosses boundaries, keep the extracted component on the correct side and pass data/actions in.

### Preserve dark-first styling

- Treat the current system as dark-first.
- Do not introduce light-theme assumptions.
- Do not replace current dark surfaces with flat neutral defaults.

### Use existing `oc-*` classes

- Prefer the existing system in `overclock/app/globals.css`.
- Start with:
  - `oc-profile-display`
  - `oc-profile-meta`
  - `oc-surface-panel`
  - `oc-card-lift`
  - `oc-surface-solid-lift`
  - `oc-profile-pill`
  - `oc-profile-icon-button`
  - `oc-profile-text-button`
  - `oc-list-row-hover`

### Avoid new page backgrounds

- Do not create a new page background recipe unless the product direction explicitly changes.
- Match an existing page shell first.
- If several routes share the same background pattern, note the extraction candidate instead of copying it again.

### Avoid duplicate dropdowns and actions

- Reuse:
  - `overclock/components/lfg/lfg-post-actions-menu.tsx`
  - `overclock/components/blocks/user-block-controls.tsx`
  - `overclock/components/matches/lfg-invite-button.tsx`
  - `overclock/components/ui/dropdown-menu.tsx`
- Do not build a second version of the same action surface under a route folder.

### Avoid unnecessary wrappers

- Do not add thin re-export wrappers unless there is a real ownership or API reason.
- Do not wrap a shared primitive only to rename it locally without added behavior.
- If a wrapper is necessary, document why.

### Mobile-first layout rules

- Build mobile first.
- Validate `sm`, `md`, and `xl` behaviors explicitly.
- Default page spacing should match shipped patterns:
  - outer page `px-4 py-6 sm:px-6 sm:py-8`
  - panel interiors `px-5 py-4 sm:px-6 sm:py-5`
- Prefer stacked layouts first, then widen into rows or grids at larger breakpoints.

## Page Selection Rules

- Feed page: start from `overclock/features/lfg/components/lfg-page-shell.tsx`
- Settings page: start from `overclock/app/account/page.tsx`
- Profile page or section: start from `overclock/app/u/[username]/page.tsx` and `overclock/app/u/[username]/profile/profile-header.tsx`
- Management panel: start from `overclock/app/account/posts/page.tsx`

## Component Selection Rules

- Card: start from `overclock/features/lfg/components/lfg-post-card.tsx`
- Stack card: use `overclock/features/lfg/components/stack-post-card.tsx`
- Row/list item: start from `overclock/features/matches/components/match-card.tsx`
- Empty state: start from `overclock/features/lfg/components/lfg-post-list.tsx`
- Dropdown: start from `overclock/components/ui/dropdown-menu.tsx`
- Pill/chip: start from `oc-profile-pill` and current LFG/profile chip usage

## Styling Rules

- Keep radius hierarchy consistent.
- Keep low-contrast borders and subtle fills.
- Keep headings on `oc-profile-display`.
- Keep metadata on `oc-profile-meta`.
- Keep buttons and pills visually aligned with shipped pages, not generic component-library defaults.

## Extraction Rules

- If a pattern already exists in 2 or more places, prefer reusing or documenting extraction instead of making a third copy.
- Audit first. Confirm the duplicate structure, ownership boundary, and source-of-truth example before extracting.
- Small duplication inside one route group can stay route-owned.
- Do not promote components to `overclock/features/*` or `overclock/components/*` until reuse clearly crosses route or domain boundaries.
- Prefer route-owned extraction when:
  - the pattern only serves one route family
  - the API is still tightly coupled to one page group
- Prefer shared extraction when:
  - multiple route groups need the same shell, primitive, or control
  - the component belongs to app-shell, navigation, or low-level UI primitives
- Good extraction candidates from the audit:
  - repeated route background shells
  - settings toggle rows
  - avatar/meta/action list rows
  - thin re-export wrappers

## Source-Of-Truth Rules

- Choose the nearest shipped example before writing JSX or extracting shared markup.
- Prefer this order:
  - same route family
  - same page type
  - same interaction pattern
  - same visual treatment
- Do not combine unrelated examples if one strong source-of-truth page already exists.

## Refusal Rules

- Do not refactor architecture during a pure UI alignment task unless explicitly asked.
- Do not rename components during documentation or alignment work unless explicitly asked.
- Do not swap visual direction to a new theme.
