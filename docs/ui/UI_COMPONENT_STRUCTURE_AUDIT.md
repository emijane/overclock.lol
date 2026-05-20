# UI Component Structure Audit

Practical reference for keeping new and updated pages aligned with the current overclock.lol UI.

## Scope

- App audited: `overclock/`
- Focus: page layout, shared components, styling conventions, responsive behavior, duplication, and source-of-truth UI examples
- This is documentation only. No refactors are proposed as completed work here.

## Current UI Architecture Summary

- The app has a strong dark-first visual system centered on global CSS tokens in `overclock/app/globals.css`.
- The best shared shell primitives are:
  - `overclock/components/app-shell/page-container.tsx`
  - `overclock/components/app-shell/page-reveal.tsx`
  - `overclock/components/app-shell/global-background-shell.tsx`
  - `overclock/components/navigation/global-auth-bar.tsx`
- The best feature-level UI architecture exists in:
  - `overclock/features/lfg/components/lfg-page-shell.tsx`
  - `overclock/features/matches/components/matches-page-view.tsx`
  - `overclock/features/profile/components/profile-edit-form.tsx`
- Many polished route surfaces still repeat background gradients, page spacing, and panel wrappers directly in route files instead of going through one reusable page-shell component.
- The system is visually consistent in dark mode, but not architecturally normalized yet.

## Major UI Areas

### App routes / pages

- Profile page: `overclock/app/u/[username]/page.tsx`
- Account page: `overclock/app/account/page.tsx`
- Competitive settings: `overclock/app/account/competitive/page.tsx`
- My posts: `overclock/app/account/posts/page.tsx`
- LFG section routes:
  - `overclock/app/duos/page.tsx`
  - `overclock/app/lfg/page.tsx`
  - `overclock/app/stacks/page.tsx`
  - `overclock/app/duos/create/page.tsx`
  - `overclock/app/stacks/create/page.tsx`
- Matches / connections: `overclock/app/matches/page.tsx`
- Login: `overclock/app/login/page.tsx`
- Search: `overclock/app/search/users/page.tsx`
- Legal:
  - `overclock/app/privacy/page.tsx`
  - `overclock/app/terms/page.tsx`
  - rendered through `overclock/components/legal/legal-document.tsx`

### Shared components

- Shell:
  - `overclock/components/app-shell/page-container.tsx`
  - `overclock/components/app-shell/page-reveal.tsx`
  - `overclock/components/app-shell/global-background-shell.tsx`
  - `overclock/components/app-shell/global-footer.tsx`
- Navigation:
  - `overclock/components/navigation/global-auth-bar.tsx`
  - `overclock/components/navigation/main-menu-user-search.tsx`
  - `overclock/components/navigation/global-notifications-menu-client.tsx`
  - `overclock/components/navigation/user-menu.tsx`
- UI primitives:
  - `overclock/components/ui/avatar.tsx`
  - `overclock/components/ui/dropdown-menu.tsx`
  - `overclock/components/ui/switch.tsx`
  - `overclock/components/ui/button.tsx`
- Shared interaction widgets:
  - `overclock/components/blocks/user-block-controls.tsx`
  - `overclock/components/matches/lfg-invite-button.tsx`
  - `overclock/components/lfg/lfg-post-actions-menu.tsx`
  - `overclock/components/profile/ranked-avatar.tsx`

### Feature-owned components

- LFG:
  - `overclock/features/lfg/components/lfg-page-shell.tsx`
  - `overclock/features/lfg/components/lfg-post-list.tsx`
  - `overclock/features/lfg/components/lfg-post-card.tsx`
  - `overclock/features/lfg/components/stack-post-card.tsx`
  - `overclock/features/lfg/components/lfg-feed-filters-panel.tsx`
  - `overclock/features/lfg/components/lfg-sidebar.tsx`
- Matches:
  - `overclock/features/matches/components/matches-page-view.tsx`
  - `overclock/features/matches/components/match-card.tsx`
  - `overclock/features/matches/components/incoming-pending-invite-card.tsx`
  - `overclock/features/matches/components/pending-sent-invite-card.tsx`
  - `overclock/features/matches/components/match-invites-tabs.tsx`
- Profile:
  - `overclock/features/profile/components/profile-edit-form.tsx`
  - `overclock/features/profile/components/profile-edit-form-fields.tsx`
  - `overclock/features/profile/components/profile-edit-modal-shell.tsx`
  - `overclock/features/profile/components/recent-profile-posts.tsx`
- Blocks:
  - `overclock/features/blocks/components/account-blocked-users-card.tsx`
- Competitive:
  - `overclock/features/competitive/components/role-hero-picker.tsx`

### Layout / navigation components

- Root app shell is in `overclock/app/layout.tsx`
- Background atmosphere is centralized in `overclock/components/app-shell/global-background-shell.tsx`
- Top nav is centralized in `overclock/components/navigation/global-auth-bar.tsx`
- Page width management is centralized in `overclock/components/app-shell/page-container.tsx`

### Form components

- Profile form stack:
  - `overclock/features/profile/components/profile-edit-form.tsx`
  - `overclock/features/profile/components/profile-edit-form-fields.tsx`
  - `overclock/features/profile/components/avatar-upload-button.tsx`
  - `overclock/features/profile/components/profile-cover-upload-button.tsx`
- LFG creation form stack:
  - `overclock/features/lfg/components/post-title-field.tsx`
  - `overclock/features/lfg/components/lfg-game-mode-picker.tsx`
  - `overclock/features/lfg/components/lfg-role-picker.tsx`
  - `overclock/features/lfg/components/stack-group-size-picker.tsx`
  - `overclock/features/lfg/components/stack-description-field.tsx`
- Account toggle forms:
  - `overclock/app/account/availability-toggle-card.tsx`
  - `overclock/app/account/presence-privacy-toggle-card.tsx`

### Card / list / feed components

- Feed cards:
  - `overclock/features/lfg/components/lfg-post-card.tsx`
  - `overclock/features/lfg/components/stack-post-card.tsx`
  - `overclock/app/account/posts/components/account-post-card.tsx`
- Profile cards:
  - `overclock/app/u/[username]/profile/featured-clips/featured-clip-card.tsx`
  - `overclock/features/profile/components/recent-profile-posts.tsx`
- List rows:
  - `overclock/features/matches/components/match-card.tsx`
  - `overclock/features/blocks/components/account-blocked-users-card.tsx`
  - `overclock/components/navigation/main-menu-user-search.tsx`
  - `overclock/app/search/users/page.tsx`

## Key Reusable Components and File Paths

### Page shell primitives

- `overclock/components/app-shell/page-container.tsx`
  - Width container. Current default max width is `max-w-[68rem]`.
- `overclock/components/app-shell/page-reveal.tsx`
  - Shared entrance animation wrapper with `lift` and `fade` variants.
- `overclock/components/app-shell/global-background-shell.tsx`
  - App-wide atmosphere background used by `overclock/app/layout.tsx`.

### Surface and typography system

- `overclock/app/globals.css`
  - Canonical tokens and utility classes:
    - `.oc-profile-display`
    - `.oc-profile-meta`
    - `.oc-profile-pill`
    - `.oc-surface-panel`
    - `.oc-surface-modal`
    - `.oc-surface-elevated`
    - `.oc-surface-subtle`
    - `.oc-surface-solid-lift`
    - `.oc-card-lift`
    - `.oc-profile-icon-button`
    - `.oc-profile-text-button`
    - `.oc-list-row-hover`

### Navigation and discovery

- `overclock/components/navigation/global-auth-bar.tsx`
- `overclock/components/navigation/main-menu-user-search.tsx`
- `overclock/components/navigation/global-notifications-menu-client.tsx`
- `overclock/components/navigation/user-menu.tsx`

### Reusable action controls

- `overclock/components/lfg/lfg-post-actions-menu.tsx`
- `overclock/components/blocks/user-block-controls.tsx`
- `overclock/components/matches/lfg-invite-button.tsx`
- `overclock/components/ui/dropdown-menu.tsx`
- `overclock/components/ui/switch.tsx`

### Shared visual identity components

- `overclock/components/profile/ranked-avatar.tsx`
- `overclock/app/u/[username]/profile/profile-header.tsx`
- `overclock/app/u/[username]/profile/profile-badge.tsx`
- `overclock/app/u/[username]/profile/profile-social-links.tsx`

## Page-Level Layout Patterns

### Pattern A: Atmosphere page with centered content column

Best examples:

- `overclock/app/account/page.tsx`
- `overclock/app/account/competitive/page.tsx`
- `overclock/app/login/page.tsx`
- `overclock/components/legal/legal-document.tsx`

Traits:

- Route-level `main` uses a repeated radial-gradient dark background
- `PageContainer` with `max-w-4xl`
- 2-part rhythm:
  - header or hero
  - stacked `oc-surface-panel` sections
- Common spacing:
  - `px-4 py-6 sm:px-6 sm:py-8`
  - inner panels `rounded-[22px]` to `rounded-[28px]`

### Pattern B: Feature-owned feed page shell

Best example:

- `overclock/features/lfg/components/lfg-page-shell.tsx`

Traits:

- Shared feed shell used by `duos`, `lfg`, `stacks`, and create flows
- Handles:
  - page title
  - breadcrumb
  - search
  - sidebar
  - filters
  - composer
  - empty/error states
  - post grid/list
- This is the strongest reusable route-shell in the repo today

### Pattern C: Profile page as a vertically stacked section rail

Best example:

- `overclock/app/u/[username]/page.tsx`

Traits:

- Single centered column `max-w-4xl`
- One outer ranked surface
- Vertical stacked section sequence:
  - header
  - hero pools
  - featured clips
  - recent posts
- Tight section separators through top borders and low gap spacing

### Pattern D: Fixed-height management panel

Best example:

- `overclock/app/account/posts/page.tsx`

Traits:

- One `oc-surface-panel` container for full page workflow
- internal header, tabs, scrollable list, pagination
- works well for dashboard-style management views

## Component Reuse Map

### Shell reuse

- `overclock/components/app-shell/page-container.tsx`
  - used by account, competitive, legal, login, matches, navigation, footer, LFG shell
- `overclock/components/app-shell/page-reveal.tsx`
  - used by account, competitive, login, matches, LFG shell

### Feed and action reuse

- `overclock/components/lfg/lfg-post-actions-menu.tsx`
  - used by:
    - `overclock/features/lfg/components/lfg-post-card.tsx`
    - `overclock/features/lfg/components/stack-post-card.tsx`
    - `overclock/features/profile/components/recent-profile-posts.tsx`
    - `overclock/app/account/posts/components/account-post-card.tsx`
- `overclock/components/matches/lfg-invite-button.tsx`
  - used by:
    - `overclock/features/lfg/components/lfg-post-card.tsx`
  - also re-exported from:
    - `overclock/features/lfg/components/lfg-invite-button.tsx`
- `overclock/components/blocks/user-block-controls.tsx`
  - used by:
    - `overclock/features/lfg/components/lfg-post-card.tsx`
    - `overclock/features/lfg/components/stack-post-card.tsx`
    - `overclock/app/u/[username]/profile/editable-profile-header.tsx`
    - `overclock/features/blocks/components/account-blocked-users-card.tsx`
  - also re-exported from:
    - `overclock/features/blocks/components/user-block-controls.tsx`

### Card family reuse

- `overclock/features/lfg/components/lfg-post-list.tsx`
  - owns feed empty/error state and chooses `LFGPostCard` vs `StackPostCard`
- `overclock/features/lfg/components/lfg-post-card.tsx`
  - strongest general-purpose social/feed card
- `overclock/features/lfg/components/stack-post-card.tsx`
  - parallel stack-specific feed card
- `overclock/features/matches/components/match-card.tsx`
  - list-row pattern for account-like lists

## Styling Rules To Preserve

### Typography

- Use `.oc-profile-display` for headings, primary labels, and action labels.
- Use `.oc-profile-meta` for secondary metadata, timestamps, counters, and uppercase utility labels.
- Preserve tight tracking on major headings:
  - `tracking-[-0.045em]`
  - `tracking-[-0.07em]`
- Preserve small uppercase metadata bands for section labels:
  - usually `text-[10px]` or `text-[11px]`
  - uppercase
  - wide tracking

### Surfaces

- Use `oc-surface-panel` for major panels and account/legal/dashboard blocks.
- Use `oc-card-lift` for content cards that should feel lighter and interactive.
- Use `oc-surface-solid-lift` for denser feed cards with a solid base.
- Keep radius hierarchy consistent:
  - page/panel shells: `rounded-[22px]` to `rounded-[28px]`
  - cards: `rounded-[10px]` to `rounded-[12px]`
  - pills/chips/buttons: rounded-full or `rounded-[5px]` to `rounded-[10px]`

### Spacing

- Outer page spacing most often:
  - `px-4 py-6 sm:px-6 sm:py-8`
- Panel interiors most often:
  - `px-5 py-4 sm:px-6 sm:py-5`
- Small cards/lists most often:
  - `px-4 py-3`
  - `gap-2.5` or `gap-3`

### Buttons and pills

- Existing buttons are mostly custom class strings, not the shared `Button` primitive.
- Primary pills/buttons are generally:
  - rounded full
  - low-contrast white border
  - subtle white fill
  - `font-semibold`
- Status chips use tiny text, thin borders, and muted background fills.

### Empty states

- Keep them compact and embedded in the current surface instead of full-screen.
- Best empty-state pattern:
  - `overclock/features/lfg/components/lfg-post-list.tsx`
- Secondary good pattern:
  - `overclock/features/blocks/components/account-blocked-users-card.tsx`
  - `overclock/features/profile/components/recent-profile-posts.tsx`

### Responsive behavior

- Pages are mobile-first.
- Common breakpoints:
  - `sm` for padding and stacked-to-row shifts
  - `md` for 2-column card grids
  - `xl` for 3-4 column feed layouts
- Good responsive references:
  - `overclock/features/lfg/components/lfg-page-shell.tsx`
  - `overclock/features/lfg/components/lfg-post-list.tsx`
  - `overclock/app/u/[username]/profile/profile-header.tsx`

### Dark / light mode handling

- Current shipped UI is effectively dark-mode only.
- `overclock/app/globals.css` contains a base `prefers-color-scheme: dark` block, but most route/component styling uses hard-coded dark backgrounds and light text.
- There is no coherent light-theme component strategy today.
- Safe assumption for future updates: preserve current dark styling unless light mode becomes an explicit project goal.

## Anti-Patterns To Avoid

- Do not create new page backgrounds ad hoc when an existing route already matches the target mood.
- Do not default to `overclock/components/ui/button.tsx` as the visual source of truth. It does not match the newer polished surfaces well.
- Do not introduce generic system colors or bright flat backgrounds that ignore `overclock/app/globals.css`.
- Do not build new list rows with raw typography when `oc-profile-display` and `oc-profile-meta` already match surrounding UI.
- Do not fork another route-local copy of post actions, block controls, invite buttons, or empty-state cards.
- Do not assume light mode is supported just because CSS variables named `--background` and `--foreground` exist.

## Duplicated UI That Should Eventually Be Extracted

### Thin re-export layers

- `overclock/features/lfg/components/lfg-post-actions-menu.tsx`
  - re-exports `overclock/components/lfg/lfg-post-actions-menu.tsx`
- `overclock/features/lfg/components/lfg-invite-button.tsx`
  - re-exports `overclock/components/matches/lfg-invite-button.tsx`
- `overclock/features/blocks/components/user-block-controls.tsx`
  - re-exports `overclock/components/blocks/user-block-controls.tsx`
- `overclock/features/auth/components/auth-message.tsx`
  - re-exports `overclock/components/auth/auth-message.tsx`

These are low-risk cleanup targets once ownership boundaries are finalized.

### Repeated route background shells

- Duplicated atmosphere backgrounds appear in:
  - `overclock/app/account/page.tsx`
  - `overclock/app/account/competitive/page.tsx`
  - `overclock/app/account/posts/page.tsx`
  - `overclock/app/login/page.tsx`
  - `overclock/components/legal/legal-document.tsx`
  - `overclock/features/matches/components/matches-page-view.tsx`
- These should eventually point at one reusable page-background wrapper or page template.

### Similar list-row cards

- `overclock/features/matches/components/match-card.tsx`
- `overclock/features/blocks/components/account-blocked-users-card.tsx`
- search result rows inside:
  - `overclock/components/navigation/main-menu-user-search.tsx`
  - `overclock/app/search/users/page.tsx`

These share avatar + title + metadata + trailing action layouts and are good candidates for a reusable row primitive later.

### Similar feed-card families

- `overclock/features/lfg/components/lfg-post-card.tsx`
- `overclock/features/lfg/components/stack-post-card.tsx`
- `overclock/app/account/posts/components/account-post-card.tsx`
- `overclock/features/profile/components/recent-profile-posts.tsx`

These should not be merged blindly, but they clearly share:

- title row patterns
- metadata rows
- hero-chip strips
- action menu placement
- card radius / border / shadow language

### Similar account toggle cards

- `overclock/app/account/availability-toggle-card.tsx`
- `overclock/app/account/presence-privacy-toggle-card.tsx`

These are near duplicates and could later become one reusable settings-toggle row.

## Gold-Standard Pages / Components To Copy From

### Best page shells

- LFG feeds and create flows:
  - `overclock/features/lfg/components/lfg-page-shell.tsx`
- Account settings pages:
  - `overclock/app/account/page.tsx`
  - `overclock/app/account/competitive/page.tsx`
- Profile page:
  - `overclock/app/u/[username]/page.tsx`

### Best reusable components

- Page width and reveal:
  - `overclock/components/app-shell/page-container.tsx`
  - `overclock/components/app-shell/page-reveal.tsx`
- Card/feed:
  - `overclock/features/lfg/components/lfg-post-card.tsx`
  - `overclock/features/lfg/components/stack-post-card.tsx`
  - `overclock/features/lfg/components/lfg-post-list.tsx`
- Header/profile identity:
  - `overclock/app/u/[username]/profile/profile-header.tsx`
  - `overclock/components/profile/ranked-avatar.tsx`
- Embedded empty state:
  - `overclock/features/lfg/components/lfg-post-list.tsx`
- Compact modal:
  - `overclock/features/profile/components/profile-edit-modal-shell.tsx`
- Search/dropdown:
  - `overclock/components/navigation/main-menu-user-search.tsx`

## Recommended Source Of Truth By UI Need

### Need a polished feed page

- Start from `overclock/features/lfg/components/lfg-page-shell.tsx`

### Need a dashboard/settings page

- Start from `overclock/app/account/page.tsx`

### Need a profile/public identity section

- Start from `overclock/app/u/[username]/profile/profile-header.tsx`
- Then match section rhythm from `overclock/app/u/[username]/page.tsx`

### Need a small content card

- Start from `overclock/features/lfg/components/lfg-post-card.tsx`
- For media-only cards, use `overclock/app/u/[username]/profile/featured-clips/featured-clip-card.tsx`

### Need an embedded list row

- Start from `overclock/features/matches/components/match-card.tsx`

## Checklist For Updating A Page To Match Current UI

1. Pick the nearest source-of-truth route before writing any JSX.
2. Reuse `PageContainer` for width and `PageReveal` for staged entry unless the page intentionally has no motion.
3. Reuse `oc-surface-panel`, `oc-card-lift`, or `oc-surface-solid-lift` instead of inventing new surface recipes.
4. Use `oc-profile-display` for primary text and `oc-profile-meta` for secondary text.
5. Match existing spacing tokens first:
   - outer page `px-4 py-6 sm:px-6 sm:py-8`
   - panel interiors `px-5 py-4 sm:px-6 sm:py-5`
6. Prefer existing action controls:
   - `LFGPostActionsMenu`
   - `UserBlockMenu`
   - `LFGInviteButton`
   - `Switch`
7. Keep empty states inside the same card/panel system.
8. Preserve the current dark-first palette and border/shadow subtlety.
9. Check mobile layout first, then `sm`, `md`, and `xl`.
10. If building a new repeated pattern, document the candidate extraction point instead of creating another route-local copy silently.

## Reusable Prompt Template For Future UI Alignment Tasks

Use this when asking an AI agent to align a page with the current system:

```md
Read `AGENTS.md` and `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md` first.

Task:
Update `[target file path]` to match the current overclock.lol UI architecture.

Requirements:
- Reuse existing page/layout patterns before inventing new ones.
- Match the closest source-of-truth example from the audit.
- Reuse existing shared components where possible.
- Preserve current dark-mode styling conventions.
- Keep spacing, typography, card treatment, pills, and button styles consistent with shipped pages.
- Prefer extraction notes over new duplication if a reusable pattern is missing.
- Do not rename unrelated files.
- Do not introduce a new design direction.

Reference examples:
- [list 2-4 exact file paths from the audit]

Deliverables:
- implement the UI update
- mention which source-of-truth files were followed
- mention any duplicated UI that should be extracted later
```

## Safest Next Steps

- Consolidate thin re-export UI wrappers once ownership decisions are final.
- Create one reusable dark page-background shell for account/login/legal/matches-style pages.
- Extract one reusable “settings toggle row” from:
  - `overclock/app/account/availability-toggle-card.tsx`
  - `overclock/app/account/presence-privacy-toggle-card.tsx`
- Extract one reusable list-row primitive for avatar + title + meta + trailing action layouts.
- Audit whether `overclock/components/ui/button.tsx` should be updated to match the shipped design system or left as a low-level fallback.
