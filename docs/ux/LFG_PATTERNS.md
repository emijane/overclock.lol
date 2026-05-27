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
| `Stacks` | same shell language with a denser heist.lol-inspired social card treatment |
| Create post | composer stays inside the shared LFG architecture, with dedicated create routes where shipped |
| Account posts | management layer, not discovery layer |

## How Users Scan Posts
1. Title
2. Player identity
3. Rank + posting role
4. Mode / platform
5. Social state:
  - hero pool on duos
  - member count, accepted avatars, and needed roles on stacks
6. Invite / request action

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
  - hero pool on duos
  - accepted member avatars and count on stacks
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
- `Duos` and `Stacks` stay in the same family and should not feel like different products
- `Stacks` leans more social:
  - overlapping member avatars
  - compact `x/5` count
  - needed-role pills instead of hero-pool emphasis
- `Stacks` cards should feel darker, flatter, denser, and more cohesive than older dashboard-like LFG cards
- Do not fork the design language between them

## Filters
- Duos and Stacks use a sticky left sidebar on desktop (`lg:flex`), hidden on mobile
- Mobile fallback: horizontal dropdown panel (`LFGFeedFiltersPanel`) shown only on `< lg`
- All filter state is URL-driven (searchParams), immediately reflected
- Sidebar reference: `lfg-sidebar.tsx`
- Horizontal panel reference: `lfg-feed-filters-panel.tsx`
- Rules:
  - `Role` and `Needs` remain separate
  - Rank: single-tier selection sets both `min_rank` and `max_rank` to the same value
  - Region is optional and lightweight
  - Clear Filters link shown only when any filter is active
  - On desktop, active filter chips render in the sidebar only, not in the header
  - Active sidebar chips include an `x` affordance that clears only that filter

## Sidebar Layout Rules (Duos / Stacks)
- Sidebar width: `w-52` (208px)
- Contains: LFG section nav, Create Post CTA, inline filter sections per category
- LFG nav items: Overview, Duos, Stacks (Scrims + Teams marked "Soon", non-interactive)
- Filter sections: Mode, Role, Needs, Region, Rank - each collapsible, closed by default
- Selected item indicator: filled `bg-sky-400` dot; unselected: transparent dot placeholder
- Create Post button: `bg-violet-600/80` pill, links to create page or login for guests
- Sidebar is a flex sibling to the main section inside `PageContainer`
- `PageContainer` uses `flex items-start gap-6` when sidebar layout is active
- Main section gets `min-w-0 flex-1` to fill remaining width

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
- Composer is embedded in the same shell language as browsing
- Blocking conditions are explicit and actionable:
  - login required
  - onboarding required
  - missing profile fields
  - missing competitive role setup
- Each blocker gives one next action
- Reference: `lfg-page-shell.tsx`

For stacks specifically:

- `/stacks/create` is the dedicated creation route
- stack creation does not ask for freeform description or custom group size
- stack groups always start at `1/5`
- the owner becomes the first accepted member automatically

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

Stacks reuse that lightweight pattern through notifications:

- requesters use `Request to Join`
- the requester chooses one currently-needed role
- owners accept or decline from the existing notification dropdown
- only accepted members become public on the stack card

## Stack Card Patterns

- Keep stack cards dense, flatter, and more social than dashboard-like
- Banner treatment:
  - darker and atmospheric
  - softer overlay
  - banner supports mood, not content density
- Metadata:
  - compact pills over the banner
  - timestamp stays quieter than identity and title
- Identity:
  - bright white reserved for display name and title
  - username, rank, region, and secondary metadata stay dimmer
- Group row:
  - overlapping clickable avatars inline with `x/5`
  - max `4` visible avatars, then `+X`
  - only accepted members render publicly
- Needed roles:
  - flatter pills
  - muted semantic tinting
  - show only currently open role slots

## Heist-Inspired Direction

- dark, minimal, premium
- reduced radius globally
- subtle borders
- flatter surfaces
- minimal glow and restrained gradients
- stronger social-object feel, less stacked-component feel

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

## Next Steps

- Verify stack card readability across bright and dark cover images.
- Unify remaining small spacing differences between duos and stacks cards.
- Improve accessible labeling for compact metadata and role/status pills.
- Keep deferred features like realtime party/chat out of LFG card scope.
