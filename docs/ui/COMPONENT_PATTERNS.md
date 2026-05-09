# Component Patterns

## Scope
- Document current reusable patterns only
- Primary references:
  - `overclock/app/lfg/components/*`
  - `overclock/app/u/[username]/profile/*`
  - `overclock/app/account/*`
  - `overclock/app/matches/*`
  - `overclock/app/components/*`

## Cards
| Component | Purpose | Current pattern |
| --- | --- | --- |
| Primary surface card | Page sections | `rounded-[22px] border border-white/8 bg-[#05070b]` |
| Sub-card | Dense inner group | `rounded-[18px] border border-white/8 bg-white/4 p-3.5` |
| Feed row card | Connections/invites | border-separated list rows with hover fill |
| Accent wrapper | Rank emphasis | outer `p-px` glow wrapper around dark inner card |

- Spacing:
  - primary cards: `px-4/5/6`, `py-3/4/5`
  - sub-cards: `p-3` to `p-4`
- Hover:
  - brighten background slightly
  - never reflow content
- Mistakes:
  - adding thick outlines
  - replacing dark fill with transparent glass

## Profile Headers
- Purpose: establish player identity quickly
- Structure:
  - cover image/fallback gradient
  - top-right region and server badges
  - overlapping ranked avatar
  - name, username, bio
  - connection count
  - platform / presence pills
  - social/action column
- Reference: `overclock/app/u/[username]/profile/profile-header.tsx`
- Rules:
  - avatar overlap is part of hierarchy
  - actions stay small and right-aligned
  - bio width stays capped
  - username remains muted
  - owner "Edit profile" button routes to `/account` — there is no inline edit modal on the profile page
- Avoid:
  - moving actions above identity
  - large stat dashboards under the name

## LFG Posts
- Purpose: compact scan-friendly listing cards
- Structure:
  - cover strip
  - oversized ranked avatar overlap
  - top-right platform/mode/actions/date
  - name + username + badges
  - title
  - rank + posting role row
  - hero pool strip
  - invite CTA
- Reference: `overclock/app/lfg/components/lfg-post-card.tsx`
- Spacing:
  - header/meta stays tight
  - card body uses `px-4 pb-3.5 pt-2`
  - invite CTA sits at bottom with `mt-auto`
- Interaction:
  - name/username link to profile
  - hero icons scale slightly on hover
  - owner actions hide behind compact menu
- Avoid:
  - adding long descriptions
  - placing filters or large badges inside the card body

## Dropdowns
- Purpose: compact selection without bloating layouts
- Current implementation: Radix dropdown wrappers in `overclock/components/ui/dropdown-menu.tsx`
- Trigger pattern:
  - rounded full or rounded-xl
  - muted by default
  - chevron right-aligned
- Menu pattern:
  - dark fill
  - light border
  - compact item rows
  - focus state uses subtle white overlay
- Examples:
  - `lfg-feed-filters-panel.tsx`
  - `profile-edit-form-fields.tsx`
  - `competitive-role-editor-shell.tsx`
- Avoid:
  - large selects with tall rows
  - colorful focus fills

## Pills And Tags
- Purpose: quick metadata compression
- Types:
  - neutral metadata pills
  - active tabs
  - filter chips
  - platform tags
  - status pills
  - looking-to-play pill
- Rules:
  - keep height `h-7` or `h-8`
  - prefer sentence fragments over full prose
  - use dashed borders only for "clear" or optional-reset actions
- Avoid:
  - oversized tags
  - high-saturation pills for every taxonomy

## Buttons
- Common variants:
  - neutral bordered pill
  - sky confirm/save pill
  - ghost icon button
  - tiny text action
- References:
  - `global-auth-bar.tsx`
  - `account/profile-edit-form.tsx`
  - `lfg-role-picker.tsx`
  - `global-notifications-menu-client.tsx`
- Rules:
  - short copy
  - compact height
  - white/sky solid reserved for high-priority actions
- Avoid:
  - full-width giant CTAs except on small forms where already used

## Modal Patterns
- Purpose: focused editing without leaving context
- Structure:
  - dark scrim
  - centered container
  - `rounded-[28px]` shell, `border border-white/8 bg-[#05070b]`
  - standard card shadow
  - `border-b border-white/6` header divider
  - `border-t border-white/6` footer divider
- References:
  - `featured-video-modal.tsx`
  - `avatar-upload-button.tsx` (avatar crop modal)
  - `profile-cover-upload-button.tsx` (cover crop modal)
- Rules:
  - close action is top-right circular icon button (`h-8 w-8`, `XIcon`, `border-white/10 bg-white/5`)
  - footer cancel uses `inline-flex h-9 items-center border border-white/10 bg-white/5`
  - footer confirm uses `inline-flex h-9 items-center bg-sky-400`
  - footer actions stay compact and right-aligned
- Avoid:
  - huge empty margins
  - full-screen light modals
  - text pill cancel buttons in the header

## Forms
- Purpose: low-friction editing in dense dark surfaces
- Pattern:
  - grouped sections with `grid gap-2/3`
  - labels embedded as small top text inside the field
  - `rounded-xl` inputs on `bg-white/4`
  - low-contrast borders with brighter hover/focus
- References:
  - `profile-edit-form-fields.tsx`
  - `onboarding/page.tsx`
  - `competitive-role-editor-shell.tsx`
- Rules:
  - prefer 2-column grids for short peer fields
  - helper text should be one line where possible
  - character count sits inside textarea corner
- Avoid:
  - verbose explanatory blocks between fields
  - light backgrounds inside dark forms

## Hero Selectors
- Purpose: represent play identity visually, not as large text lists
- Pattern:
  - grid of compact image buttons
  - clear selected state via border/fill change
  - small count indicator
  - lightweight clear action
- Reference: `components/competitive/role-hero-picker.tsx`
- Rules:
  - keep hero tiles small
  - cap selection count visibly
  - use image-first recognition
- Avoid:
  - oversized hero cards
  - text-heavy pickers

## Role Cards
- Purpose: summarize one competitive role in minimum space
- Structure:
  - role title
  - optional main-role marker
  - rank line
  - hero icon strip
  - tiny edit button
- Reference: `competitive-role-card.tsx`
- Rules:
  - edit affordance remains secondary
  - missing state uses muted text, not warning colors
- Avoid:
  - large decorative role blocks

## Nav Items
- Pattern:
  - rounded full
  - transparent border idle
  - dark capsule on hover
  - medium or semibold small text
- Reference: `global-auth-bar.tsx`
- Rules:
  - nav should feel quiet until interacted with
  - utility controls sit in the same visual family as nav pills

## Notification UI
- Purpose: show pending invite activity without becoming a dashboard
- Pattern:
  - bell icon button with sky count badge
  - dropdown card with header, rows, and compact accept/decline actions
- Reference: `global-notifications-menu-client.tsx`
- Rules:
  - unread count stays tiny
  - row content truncates aggressively
  - actions stay inline, not stacked
- Avoid:
  - large notification illustrations
  - verbose message bodies

## Avatars
- Types:
  - standard 32-40px circular avatar
  - oversized profile/LFG avatar with overlap
  - ranked avatar ring treatment
- Rules:
  - fallback initials are bold and centered
  - avatar is often paired with rank or presence, not isolated
  - large avatars should anchor identity sections
- References:
  - `components/ui/avatar.tsx`
  - `app/components/ranked-avatar.tsx`
  - `profile-header.tsx`

## Cover Images
- Purpose: create atmosphere behind profile/LFG identity, not carry content
- Rules:
  - crop edge-to-edge
  - darken with overlay where text overlaps
  - fallback uses near-black gradient
- References:
  - `profile-header.tsx`
  - `lfg-post-card.tsx`
  - `account/profile-edit-form.tsx`
- Avoid:
  - bright untreated covers behind white text

## Profile Edit Page (`/account`)
- Purpose: single hub for all profile updates — avatar, cover, bio, socials, region, timezone
- Structure:
  - inline cover strip (`h-24`, `rounded-t-[21px]`) with "Update cover" pill button bottom-right
  - avatar circle (`h-20 w-20`, `rounded-full`) overlapping the cover bottom-left
  - form fields below (`px-4 pb-4 sm:px-5`)
  - "Save" button right-aligned at the bottom
- References:
  - `account/profile-edit-form.tsx` — layout shell
  - `account/avatar-upload-button.tsx` — avatar crop modal trigger
  - `profile-cover-upload-button.tsx` — cover crop modal trigger
  - `profile-edit-form-fields.tsx` — all text/select fields
- Rules:
  - clicking the avatar circle opens the avatar crop modal (`AvatarUploadButton`)
  - clicking "Update cover" opens the cover crop modal (`ProfileCoverUploadButton`)
  - there is no profile edit modal on `/u/[username]` — the "Edit profile" button routes here
- Avoid:
  - adding separate edit modals on the profile page

## Edit Actions
- Pattern:
  - pencil icon in tiny circular button
  - edit text action in small neutral pill
  - owner-only menus for destructive/admin tasks
- Rules:
  - editing should be accessible but visually secondary
  - avoid primary-color edit buttons unless save/submit

## Filters
- Purpose: high-density narrowing without modal friction
- Pattern:
  - horizontal wrap of pill dropdowns
  - active count on the right
  - active chips under the bar
  - clear-all as dashed chip
- Reference: `lfg-feed-filters-panel.tsx`
- Rules:
  - filters should fit above feed, not dominate it
  - active chips must be removable individually
- Avoid:
  - sidebar filter stacks
  - giant multi-row panels for common filtering

## Tab Systems
- Pattern:
  - compact pill tabs inside bordered card header
  - active tab gets subtle filled capsule
  - counts stay inline and muted
- Reference: `match-invites-tabs.tsx`
- Rules:
  - tabs should switch local content only
  - keep headers short and count-driven
- Avoid:
  - underlined marketing-style tabs
  - large segmented controls with lots of copy

## Compactness Checklist
- Keep action rows at `h-7` to `h-10`
- Keep metadata in one line when possible
- Prefer chips, counts, and small labels over paragraphs
- Prefer `gap-2` or `gap-3` over wide gutters
- Truncate long names/titles before increasing card size

## Common Mistakes
- Replacing card borders with bright shadows
- Making forms airy and oversized
- Turning feed content into dashboard tables
- Using accent colors as default text color
- Adding extra descriptive copy where the current UI uses chips or metadata rows
