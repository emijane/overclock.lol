# UI Component Registry

Use `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md` as the source of truth. This file is the quick lookup table.

## Page Types

### If building a feed page

- Use `overclock/features/lfg/components/lfg-page-shell.tsx`
- Use `overclock/features/lfg/components/lfg-post-list.tsx` for feed rendering, empty states, and error states
- Use:
  - `overclock/features/lfg/components/lfg-post-card.tsx` for general LFG feed cards
  - `overclock/features/lfg/components/stack-post-card.tsx` for stack feed cards

### If building a settings page

- Use the account page pattern from `overclock/app/account/page.tsx`
- Use:
  - `overclock/components/app-shell/page-container.tsx`
  - `overclock/components/app-shell/page-reveal.tsx`
  - `oc-surface-panel` from `overclock/app/globals.css`
- For setting rows, copy the current pattern from:
  - `overclock/app/account/availability-toggle-card.tsx`
  - `overclock/app/account/presence-privacy-toggle-card.tsx`

### If building a profile section

- Use the profile page rhythm from `overclock/app/u/[username]/page.tsx`
- Use the section/header pattern from `overclock/app/u/[username]/profile/profile-header.tsx`
- For stacked profile sections, copy from:
  - `overclock/app/u/[username]/profile/featured-clips/featured-clips-section.tsx`
  - `overclock/features/profile/components/recent-profile-posts.tsx`

## Shells and Layout

### Page shell

- Width container: `overclock/components/app-shell/page-container.tsx`
- Entry animation: `overclock/components/app-shell/page-reveal.tsx`
- Global background shell: `overclock/components/app-shell/global-background-shell.tsx`
- Global nav shell: `overclock/components/navigation/global-auth-bar.tsx`

### Feed shell

- `overclock/features/lfg/components/lfg-page-shell.tsx`

### Centered dark panel page

- Copy from:
  - `overclock/app/account/page.tsx`
  - `overclock/app/account/competitive/page.tsx`
  - `overclock/app/login/page.tsx`
  - `overclock/components/legal/legal-document.tsx`

## Cards

### General feed card

- `overclock/features/lfg/components/lfg-post-card.tsx`

### Stack feed card

- `overclock/features/lfg/components/stack-post-card.tsx`

### Management / account post card

- `overclock/app/account/posts/components/account-post-card.tsx`

### Profile media card

- `overclock/app/u/[username]/profile/featured-clips/featured-clip-card.tsx`

### Compact profile listing card

- `overclock/features/profile/components/recent-profile-posts.tsx`

## Rows and Lists

### Avatar + title + meta + trailing action row

- Primary source: `overclock/features/matches/components/match-card.tsx`
- Similar patterns:
  - `overclock/features/blocks/components/account-blocked-users-card.tsx`
  - `overclock/components/navigation/main-menu-user-search.tsx`
  - `overclock/app/search/users/page.tsx`

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
- Need a profile section: `overclock/app/u/[username]/profile/profile-header.tsx`
- Need a card: `overclock/features/lfg/components/lfg-post-card.tsx`
- Need a row: `overclock/features/matches/components/match-card.tsx`
- Need an empty state: `overclock/features/lfg/components/lfg-post-list.tsx`
- Need a dropdown: `overclock/components/lfg/lfg-post-actions-menu.tsx`
- Need a button style reference: `overclock/features/lfg/components/lfg-page-shell.tsx`
- Need a pill: `overclock/app/globals.css`
- Need a width/motion shell: `overclock/components/app-shell/page-container.tsx` and `overclock/components/app-shell/page-reveal.tsx`
