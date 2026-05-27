# UI Component Registry

Use `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md` as the source of truth. This file is the quick lookup table.

## Ownership Rule

- Use `overclock/components/*` for shared app-shell, navigation, and primitive UI already reused across route groups.
- Use route-owned components under `overclock/app/*` when the pattern is only reused inside one route group.
- Do not promote a route-owned component into `overclock/components/*` or `overclock/features/*` until reuse clearly crosses route or domain boundaries.

## Page Types

### If building a feed page

- Use `overclock/features/lfg/components/lfg-page-shell.tsx`
- Use `overclock/features/lfg/components/lfg-post-list.tsx` for feed rendering, empty states, and error states
- Use:
  - `overclock/features/lfg/components/lfg-post-card.tsx` for general LFG feed cards
  - `overclock/features/lfg/components/stack-post-card.tsx` for stack feed cards
- Use when:
  - the page needs title, filters, sidebar rhythm, and embedded empty/error states
- Avoid when:
  - the page is a small account/settings surface or does not behave like a feed

### If building a settings page

- Use the account page pattern from `overclock/app/account/page.tsx`
- Use:
  - `overclock/app/account/layout.tsx`
  - `overclock/components/app-shell/account-workspace-shell.tsx`
  - `overclock/components/navigation/account-settings-navigation.tsx`
  - `overclock/app/account/components/account-page-header.tsx`
  - `overclock/app/account/components/account-section-card.tsx`
  - `oc-surface-panel` from `overclock/app/globals.css`
- For account toggle rows, use:
  - `overclock/app/account/components/settings-toggle-card.tsx`
- Visual direction:
  - keep the account workspace layout and navigation
  - match duos-style density, compact pills, and low-contrast borders through the shared account chrome
  - do not import feed-shell behavior unless the page truly needs feed orchestration
- Use when:
  - the page should read like an enterprise account workspace with persistent account navigation
  - the toggle row is staying inside the account route group
- Avoid when:
  - the page needs a feed shell, profile rail, or a cross-domain shared control

### If building a profile section

- Use the profile page rhythm from `overclock/app/u/[username]/page.tsx`
- Use the section/header pattern from `overclock/app/u/[username]/profile/profile-header.tsx`
- For stacked profile sections, copy from:
  - `overclock/app/u/[username]/profile/featured-clips/featured-clips-section.tsx`
  - `overclock/features/profile/components/recent-profile-posts.tsx`
- Use when:
  - the section is identity-heavy and follows the public profile rail
- Avoid when:
  - the section is really a settings panel or dashboard workflow

## Shells and Layout

### Page shell

- Width container: `overclock/components/app-shell/page-container.tsx`
- Entry animation: `overclock/components/app-shell/page-reveal.tsx`
- Global background shell: `overclock/components/app-shell/global-background-shell.tsx`
- Global nav shell: `overclock/components/navigation/global-auth-bar.tsx`

### Dark atmosphere shell

- `overclock/components/app-shell/dark-page-shell.tsx`
- Use when:
  - a route duplicates the account/login/legal/matches dark radial-gradient wrapper
  - the page still wants `PageContainer`-based sizing and optional width overrides
- Avoid when:
  - the page already uses a stronger feature-owned shell such as `overclock/features/lfg/components/lfg-page-shell.tsx`
  - the route needs a materially different background direction

### Feed shell

- `overclock/features/lfg/components/lfg-page-shell.tsx`

### Centered dark panel page

- Start with:
  - `overclock/components/app-shell/dark-page-shell.tsx`
- Then match one of:
  - `overclock/app/account/page.tsx`
  - `overclock/app/account/competitive/page.tsx`
  - `overclock/app/login/page.tsx`
  - `overclock/components/legal/legal-document.tsx`

## Cards

### General feed card

- `overclock/features/lfg/components/lfg-post-card.tsx`
- Use when:
  - you need the strongest shipped card language for interactive feed content
- Avoid when:
  - the surface is a settings row, management row, or media tile

### Stack feed card

- `overclock/features/lfg/components/stack-post-card.tsx`

### Management / account post card

- `overclock/app/account/posts/components/account-post-card.tsx`
- Use when:
  - the card belongs to the account workspace management panel
  - the content is a post-history or account-owned listing row, not a public discovery card

### Profile media card

- `overclock/app/u/[username]/profile/featured-clips/featured-clip-card.tsx`

### Compact profile listing card

- `overclock/features/profile/components/recent-profile-posts.tsx`

### Account settings toggle card

- `overclock/app/account/components/settings-toggle-card.tsx`
- Use when:
  - two or more account settings rows share the same title, description, and switch layout
  - the account route group needs a scalable default row pattern for future toggles
- Avoid when:
  - the control is reused outside account-route-owned UI
  - the row needs different actions than a simple trailing `Switch`

## Rows and Lists

### Avatar + title + meta + trailing action row

- Primary source: `overclock/features/matches/components/match-card.tsx`
- Similar patterns:
  - `overclock/features/blocks/components/account-blocked-users-card.tsx`
  - `overclock/components/navigation/main-menu-user-search.tsx`
  - `overclock/app/search/users/page.tsx`
- Use when:
  - the row is identity-first and ends in one compact action area
- Avoid when:
  - the content is a full card or multi-action feed post

### Feed list wrapper

- `overclock/features/lfg/components/lfg-post-list.tsx`

## Empty States

### Feed empty/error state

- `overclock/features/lfg/components/lfg-post-list.tsx`

### Embedded profile/account empty state

- `overclock/features/profile/components/recent-profile-posts.tsx`
- `overclock/features/blocks/components/account-blocked-users-card.tsx`

## Dropdowns and Action Menus

### Post actions dropdown

- `overclock/components/lfg/lfg-post-actions-menu.tsx`

### User block menu and unblock button

- `overclock/components/blocks/user-block-controls.tsx`

### Base dropdown primitive

- `overclock/components/ui/dropdown-menu.tsx`

## Buttons

### Shipped visual source of truth

- Prefer copying button treatments from the page or component you are matching.
- Good references:
  - `overclock/features/lfg/components/lfg-page-shell.tsx`
  - `overclock/components/matches/lfg-invite-button.tsx`
  - `overclock/features/profile/components/profile-edit-modal-shell.tsx`
  - `overclock/components/blocks/user-block-controls.tsx`

### Low-level fallback only

- `overclock/components/ui/button.tsx`
- Do not treat this as the primary visual source of truth for polished pages.

## Pills and Chips

### Generic pill styling

- Use the `oc-profile-pill` class from `overclock/app/globals.css`

### Status / metadata chip references

- `overclock/features/lfg/components/lfg-post-status-pill.tsx`
- `overclock/features/lfg/components/lfg-post-card.tsx`
- `overclock/features/lfg/components/stack-post-card.tsx`
- `overclock/app/u/[username]/profile/profile-badge.tsx`

## Forms

### Profile form pattern

- `overclock/features/profile/components/profile-edit-form.tsx`
- `overclock/features/profile/components/profile-edit-form-fields.tsx`

### Modal form pattern

- `overclock/features/profile/components/profile-edit-modal-shell.tsx`

### LFG creation form pattern

- `overclock/features/lfg/components/post-title-field.tsx`
- `overclock/features/lfg/components/lfg-game-mode-picker.tsx`
- `overclock/features/lfg/components/lfg-role-picker.tsx`

## Shared Styling Rules

- Tokens and `oc-*` classes live in `overclock/app/globals.css`
- Preserve these first:
  - `.oc-profile-display`
  - `.oc-profile-meta`
  - `.oc-surface-panel`
  - `.oc-card-lift`
  - `.oc-surface-solid-lift`
  - `.oc-profile-pill`
  - `.oc-profile-icon-button`
  - `.oc-profile-text-button`
  - `.oc-list-row-hover`

## First Picks By Need

- Need a feed page: `overclock/features/lfg/components/lfg-page-shell.tsx`
- Need a settings page: `overclock/app/account/page.tsx`
- Need an account workspace shell: `overclock/app/account/layout.tsx` plus the shared account chrome components
- Need the repeated dark route wrapper: `overclock/components/app-shell/dark-page-shell.tsx`
- Need a profile section: `overclock/app/u/[username]/profile/profile-header.tsx`
- Need a card: `overclock/features/lfg/components/lfg-post-card.tsx`
- Need an account toggle row: `overclock/app/account/components/settings-toggle-card.tsx`
- Need a row: `overclock/features/matches/components/match-card.tsx`
- Need an empty state: `overclock/features/lfg/components/lfg-post-list.tsx`
- Need a dropdown: `overclock/components/lfg/lfg-post-actions-menu.tsx`
- Need a button style reference: `overclock/features/lfg/components/lfg-page-shell.tsx`
- Need a pill: `overclock/app/globals.css`
- Need a width/motion shell: `overclock/components/app-shell/page-container.tsx` and `overclock/components/app-shell/page-reveal.tsx`
