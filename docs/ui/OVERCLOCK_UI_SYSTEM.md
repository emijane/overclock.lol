# Overclock UI System

## Scope
- Source of truth: this doc plus current implementation in `overclock/app` and `overclock/components`
- Intent: standardize the existing Overclock look, not introduce a new system

## Related Docs

- `COMPONENT_PATTERNS.md`
- `PROFILE_UI_UPDATE_TEST.md`
- `../branding/BRAND_GUIDELINES.md`

## Core Tokens

| Token | Current value |
| --- | --- |
| Page bg | `#09090b` |
| Card bg | `#05070b` |
| Primary text | `text-zinc-50` / `text-zinc-100` |
| Body text | `text-zinc-300` |
| Secondary text | `text-zinc-500` |
| Accent | `sky-400` / `#38BDF8` |
| Dividers | `border-white/6` |
| Card borders | `border-white/8` |

## Social Brand Colors

| Platform | Value |
| --- | --- |
| Discord | `#5865F2` |
| Battle.net | `#00AEF0` |
| Twitch | `#9146FF` |
| YouTube | `#FF0033` |
| X / Twitter | `text-zinc-100` |

## Visual Identity
- Dark-first, near-black foundation: `#010103`, `#05070b`, `#09090b`
- Atmosphere is competitive, restrained, and immersive rather than loud
- Surfaces feel dense and premium through:
  - low-contrast borders
  - subtle inset highlights
  - heavy soft shadows
  - sparse sky-tinted accents
- Background treatment repeats across app surfaces:
  - radial top glow
  - masked dot-grid overlays
  - occasional faint sky bloom
- Primary examples:
  - `overclock/app/lfg/components/lfg-page-shell.tsx`
  - `overclock/app/account/page.tsx`
  - `overclock/app/matches/page.tsx`
  - `overclock/app/u/[username]/page.tsx`

## Dark Theme Philosophy
- Base background should stay almost black, not charcoal-gray
- Brightness is concentrated in text, rank icons, badges, and small accent controls
- Contrast is built with layering, not strong outlines
- Blue is an accent, not a page color
- Empty space is limited; the product favors compact information density

## Layout Widths
| Pattern | Current usage |
| --- | --- |
| `max-w-[96rem]` | wide feed pages and global nav |
| `max-w-[68rem]` | default `PageContainer` fallback |
| `max-w-4xl` | profile, account, matches, composer-only flows |
| `max-w-xl` | login and onboarding cards |

## Container Patterns
| Pattern | Current rule |
| --- | --- |
| Page shell | `rounded-[28px]` wrapper, often only clipping children |
| Primary card | `rounded-[22px] border border-white/8 bg-[#05070b]` |
| Sub-card | `rounded-[18px] border border-white/8 bg-white/4` |
| Dense chip/pill | `rounded-full border border-white/10 bg-white/5` |
| List row | `px-4 py-3 sm:px-5` with `hover:bg-white/[0.025]` |

- Standard primary card shadow:
  - `shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]`
- Denser content cards sometimes use a smaller shadow:
  - `shadow-[0_16px_36px_rgba(0,0,0,0.26)]`

## Spacing And Density
- Default page gap between major blocks: `gap-3`
- Header sections use tight vertical spacing: `space-y-2` to `space-y-5`
- Card interiors stay compact:
  - headers: `px-4/5/6`, `py-3` to `py-5`
  - rows: `py-2.5` to `py-3`
  - small cards: `p-3` to `p-4`
- Avoid oversized whitespace. Overclock favors:
  - many short stacked groups
  - compressed control bars
  - compact chips instead of long explanatory copy

## Border Usage
- Default borders are faint and cool:
  - `border-white/8`
  - `border-white/6`
  - `border-white/[0.12]` for emphasized duos surfaces
- Borders define depth more than separation
- Dashed borders are reserved for:
  - "clear all" actions
  - empty states
  - optional or resettable controls

## Glow Usage
- Glow is soft and localized
- Acceptable glow patterns:
  - profile rank halo wrapper in `overclock/app/u/[username]/page.tsx`
  - subtle sky focus ring on interactive pills/buttons
  - faint radial page blooms in section shells
- Do not add:
  - neon edge glows on every card
  - bright colored outer shadows on generic UI
  - multi-color glow stacks

## Typography Hierarchy
| Use | Current pattern |
| --- | --- |
| Major page title | `text-5xl sm:text-6xl font-semibold tracking-[-0.075em]` |
| Standard page title | `text-3xl sm:text-4xl font-semibold tracking-[-0.07em]` |
| Profile display name | `text-[29px] sm:text-[31px] font-semibold leading-[1.02] tracking-[-0.045em]` |
| Card title | `text-[14px]` to `text-[16px] font-semibold tracking-[-0.01em/-0.02em]` |
| Body copy | `text-sm` or `text-[16px] leading-6/7 text-zinc-300` |
| Meta label | `text-zinc-500` |
| Breadcrumb / section micro-label | uppercase, `text-[10px]` to `text-[11px]`, expanded tracking |

- Geist Sans is the default voice
- Tight tracking is a major part of the aesthetic
- Headlines are clean and compressed, not decorative

## Muted Text Usage
- `text-zinc-500` is the default muted tone
- Use muted text for:
  - usernames
  - helper copy
  - counts and timestamps
  - unselected tabs
  - secondary filter labels
- `text-zinc-600` is used for even quieter metadata such as subdued usernames in profile headers

## Hover Behavior
- Hover states brighten slightly; they do not transform the layout
- Common hover moves:
  - background from `white/5` to `white/10`
  - text from `zinc-400/500` to `zinc-100/300`
  - border from `white/8` to `white/12` or `white/20`
  - tiny hero tile scale-up
- Avoid dramatic scale, bounce, or animated gradients

## Pill Styling
- Default pill:
  - rounded full
  - low-contrast border
  - dark translucent fill
  - compact height `h-7` to `h-8`
- Common pill categories:
  - neutral metadata
  - sky "looking to play"
  - role/needs filters
  - platform tags
  - tab toggles
- Examples:
  - `overclock/app/u/[username]/profile/profile-header.tsx`
  - `overclock/app/lfg/components/lfg-feed-filters-panel.tsx`
  - `overclock/app/matches/match-invites-tabs.tsx`

## Button Styling
- Buttons are usually pill-shaped, compact, and text-first
- Primary patterns:
  - neutral dark pill with border for most actions
  - sky solid only for key save/confirm actions
  - white solid only in tiny local actions like invite acceptance
- Height rules:
  - small utility: `h-7`, `h-8`
  - standard action: `h-9`
  - stronger CTA: `h-10`
- Keep button copy short

## Navbar Behavior
- Global auth bar:
  - low-contrast bottom divider with dark translucent shell and backdrop blur
  - wide container aligned to the broad app shell width
  - logo left, compact discovery nav, and utilities grouped into one toolbar lane
- Nav items are quiet by default:
  - `text-zinc-400`
  - transparent border
  - hover adds dark capsule and visible border
- active nav items use the same capsule language with stronger text, border, and fill
- Avatar, notifications, and nav links all use rounded compact hit areas

## Card Patterns
- Main surface cards use `rounded-[22px]`
- Page shells clip their children with `rounded-[28px]`
- Dense internal cards often drop to `rounded-[18px]` or `rounded-[16px]`
- Card hierarchy usually works like:
  - page background
  - outer shell
  - primary card
  - inner row/sub-card
  - pills/badges

## Responsive Behavior
- Desktop widens grids, not element scale
- Mobile keeps the same visual density with:
  - stacked controls
  - reduced header spacing
  - full-width CTA buttons where needed
  - modal sheets attached to bottom with rounded top corners
- Common breakpoints:
  - `sm`: row alignment and spacing increase
  - `md`: 2-column content grids
  - `xl`: wider LFG post grids

## Visual Hierarchy Rules
- Order of attention should be:
  - page title
  - actionable controls
  - player/post identity
  - role/rank/status
  - secondary metadata
- Use brighter text and stronger borders only for top-priority content
- Keep metadata in muted text and small uppercase labels
- Use imagery sparingly:
  - cover images frame identity
  - hero portraits reinforce role selection
  - rank icons punctuate hierarchy

## Empty State Patterns
- Empty states stay inside the same card language
- Pattern:
  - centered icon or marker
  - short title
  - one concise explanatory sentence
  - optional compact CTA
- Styling is subdued, not celebratory
- Examples:
  - `overclock/app/lfg/components/lfg-post-list.tsx`
  - `overclock/app/matches/page.tsx`
  - `overclock/app/u/[username]/profile/recent-profile-posts.tsx`

## Section Spacing
- Most full pages use `px-4 py-6 sm:px-6 sm:py-8`
- Internal sections often separate with:
  - `border-t border-white/[0.06]`
  - `pt-4 pb-5`
- Avoid large standalone section margins; the shell gap usually handles separation

## Acceptable Gradients
- Allowed:
  - near-black vertical fades on cover fallbacks
  - subtle white radial top glows
  - restrained sky radial bloom
  - profile rank glow wrappers driven by rank accent style
- Not allowed:
  - rainbow or multicolor gradients
  - large saturated hero gradients across cards
  - bright gradient buttons outside rare accent CTAs

## Forbidden Styles And Patterns
- Do not introduce:
  - bright dashboard panels
  - bulky SaaS cards with excessive padding
  - pastel surfaces
  - heavy glassmorphism
  - thick outlines
  - oversized 44px+ chips everywhere
  - loud color coding for every category
  - decorative illustrations unrelated to player identity

## Motion Helpers
- Current shared motion classes in `overclock/app/globals.css`:
  - `page-enter`
  - `page-fade-enter`
  - `page-enter-delay-1`
  - `page-enter-delay-2`
- Motion should stay subtle, fast to scan, and compatible with reduced-motion
  preferences.

## Do
- Reuse `rounded-[28px]` page shell + `rounded-[22px]` primary card structure
- Keep controls compact and pill-based
- Use `text-zinc-500` for supporting information
- Use sky accents sparingly for presence, focus, and save states
- Preserve the dark layered background with masked dot textures on core app pages
- Prefer short labels and compressed tracking

## Do Not
- Do not redesign pages into airy marketing layouts
- Do not replace muted zinc tones with colorful category systems
- Do not overexplain inside cards when a pill, count, or short helper line works
- Do not convert dense LFG/feed surfaces into spacious dashboard tables
- Do not use oversized modals, giant buttons, or long stacked form paragraphs
