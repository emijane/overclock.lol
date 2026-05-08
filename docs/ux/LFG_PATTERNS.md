# LFG Patterns

## Scope
- Covers current Duos / Stacks / LFG posting and browsing UX
- Primary references:
  - `overclock/app/lfg/components/*`
  - `overclock/app/duos/*`
  - `overclock/app/stacks/*`

## Core Philosophy
- LFG is scan-first, not read-first
- Posts should feel compact enough to browse in volume
- Competitive identity is the product:
  - role
  - rank
  - hero comfort
  - platform
  - availability
- Friction is accepted for profile setup, not for feed browsing

## Surface Roles
| Surface | Current intent |
| --- | --- |
| `Duos` | most developed LFG surface, denser and more card-forward |
| `Stacks` | same shell language with less specialized tone |
| Create post | inline composer inside the page shell, not a separate product flow |
| Account posts | management layer, not discovery layer |

## How Users Scan Posts
1. Title
2. Player identity
3. Rank + posting role
4. Mode / platform
5. Hero pool
6. Invite action

- Cover art is atmosphere only
- Badges and timestamps are tertiary
- Role/rank line is more important than long copy

## Hierarchy Priorities
- Highest:
  - title
  - display name
  - rank
  - posting role
- Medium:
  - mode
  - platform
  - looking-to-play state
  - hero pool
- Low:
  - timestamp
  - username
  - decorative badges

## What Must Stay Compact
- Post title length
- Filter controls
- Invite actions
- Timestamps and meta labels
- Role and needs tags
- Hero pool previews

## Anti-Clutter Rules
- No body paragraph inside LFG cards
- No large secondary stat blocks
- No duplicate labels for the same concept
- No full-width explanatory banners inside active feeds unless blocking a required action
- Keep helper copy above or outside the feed

## Post Density Philosophy
- The feed should support multi-card scanning without visual fatigue
- Cards can be information-rich if the information is:
  - visually chunked
  - icon-supported
  - metadata-sized
- Prefer more posts per viewport over larger individual cards

## Duos Vs Stacks
- `Duos` gets slightly stronger borders and a more tuned grid layout
- `Stacks` stays in the same family but reads less emphasized
- Do not fork the design language between them

## Filters
- Current expectation:
  - quick horizontal wrap
  - dropdown-based
  - immediately reflected in URL
  - active chips shown beneath
- Reference: `lfg-feed-filters-panel.tsx`
- Rules:
  - `Role` and `Needs` remain separate
  - min/max rank stay explicit
  - region is optional and lightweight
  - clear-all should stay visible only when useful

## Dropdown Usage Rules
- Use dropdowns for constrained enums:
  - mode
  - role
  - needs
  - rank bounds
  - region
- Keep labels short:
  - `Mode`
  - `Role`
  - `Needs`
  - `Min rank`
  - `Max rank`
- Do not convert these into long form sections or side panels

## Role Selection
- Posting role is a primary identity choice
- Looking-for roles are secondary and can be multi-select
- Current create flow rules:
  - choose one posting role
  - choose up to two needed roles or `All`
  - show resulting identity summary immediately
- Reference: `lfg-role-picker.tsx`

## Role / Needs Separation
- `Posting role` answers: "what am I queueing as?"
- `Needs` answers: "what teammate roles am I looking for?"
- Keep them visually distinct:
  - posting role uses stronger emphasis
  - needs uses secondary chip treatment
- Do not merge them into one ambiguous role control

## Create-Post UX
- Composer is embedded in the same shell as browsing
- Blocking conditions are explicit and actionable:
  - login required
  - onboarding required
  - missing profile fields
  - missing competitive role setup
- Each blocker gives one next action
- Reference: `lfg-page-shell.tsx`

## Profile Integration
- LFG posts are extensions of profiles, not anonymous listings
- Strong profile links are required:
  - avatar
  - display name
  - username
  - recent profile posts
- Post creation depends on profile completeness for credibility and consistency

## Competitive Identity Presentation
- The current system prioritizes:
  - rank tier/division
  - role
  - hero pool
  - region/server
  - platform
- This information should appear before social or personality details in LFG contexts

## Title Usage Rules
- Titles are the main content field
- They should be concise, scannable, and sit near the top of the card
- Do not bury titles beneath dense metadata
- Do not add long subtitle/description fields unless the implementation already supports them

## Connections / Matches
- Invite actions should be simple and direct:
  - invite
  - invite sent
  - accept
  - decline
- Current UX avoids threaded chat, negotiation states, or complex invite forms
- Matches page acts as a compact inbox + connection list, not a social hub

## Responsive Considerations
- On mobile:
  - search and filters stack
  - composer buttons can go full width
  - cards remain compact, not expanded
- On desktop:
  - use grid density to show more cards
  - keep controls in horizontal bands above content

## Consistency Rules Across LFG Surfaces
- Reuse the same page shell background and spacing
- Reuse filter chip language across sections
- Keep invite actions in the same position within cards
- Preserve owner actions as hidden/secondary controls
- Use the same empty-state tone across feeds

## Friction To Avoid
- Forcing users into separate multi-step post wizards
- Requiring too many typed fields to create a listing
- Expanding filters into large form blocks
- Hiding the role/rank identity below the fold
- Making users parse prose to understand the listing

## Common UX Pitfalls
- Overloading cards with explanations
- Collapsing role and needs into one selector
- Adding visual noise that competes with rank and player identity
- Making filters taller than the first row of results
- Treating LFG as generic social posting instead of competitive matchmaking

## Agent Checklist
- Preserve dense feed scanning
- Keep posting role, needs, rank, and hero pool visible early
- Prefer pills and rows over paragraphs
- Keep create-post blockers actionable and single-path
- Treat Duos as the strongest LFG reference surface
