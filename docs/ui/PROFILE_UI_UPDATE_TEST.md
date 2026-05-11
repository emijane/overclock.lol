# Overclock Design System

## Goal

Overclock should feel like a competitive social platform, not a SaaS dashboard.

Target vibe:
- dense
- social
- dark
- competitive
- identity-first
- underground internet/forum energy

Avoid:
- empty whitespace
- generic Tailwind SaaS cards
- random gradients
- RGB gamer UI
- oversized rounded containers

---

## Core Rules

1. Density over airiness.
2. Identity over generic minimalism.
3. Social presence before utility.
4. Subtle atmosphere over loud decoration.
5. Every page should feel inhabited.

Ask:
- Does this feel active?
- Does this feel competitive?
- Does this feel social?
- Does this feel like Overclock?

---

## Fonts

### Primary
Use `Inter Tight`.

Use for:
- headings
- usernames
- nav
- buttons
- post titles
- pills

Style:
- tight tracking
- compact
- modern
- competitive

### Metadata
Use `IBM Plex Mono`.

Use for:
- timestamps
- rank metadata
- region/platform labels
- status text
- system text

---

## Type Scale

### Hero
```css
font-size: 32px-42px;
font-weight: 700;
letter-spacing: -0.04em;
line-height: 0.95-1;
```

### Section Title
```css
font-size: 18px-24px;
font-weight: 600-700;
letter-spacing: -0.03em;
```

### Card Title / Username
```css
font-size: 14px-16px;
font-weight: 600;
```

### Metadata
```css
font-size: 11px-12px;
font-family: IBM Plex Mono;
color: #737373;
```

---

## Spacing

Use compact spacing.

Scale:
```css
4px  /* micro */
8px  /* small */
12px /* default */
16px /* section */
20px /* max common gap */
```

Rules:
- compress vertical space
- group related info tightly
- avoid 32px+ gaps unless needed for page structure
- cards should feel dense but readable

---

## Colors

```css
--bg: #090909;
--surface: #111111;
--surface-hover: #171717;

--text: #F5F5F5;
--text-muted: #A1A1A1;
--text-subtle: #737373;

--border: rgba(255,255,255,0.06);
--border-hover: rgba(255,255,255,0.12);
```

Use one main accent color. Keep rank colors controlled. Do not use rainbow UI.

---

## Borders / Radius

```css
border: 1px solid rgba(255,255,255,0.06);
border-radius: 10px-14px;
```

Hover:
```css
border-color: rgba(255,255,255,0.12);
background: #171717;
```

Avoid:
- heavy shadows
- glowing borders
- 24px+ radius
- thick outlines

---

## Cards

Cards should feel part of the feed, not floating SaaS blocks.

Use:
- low contrast surfaces
- subtle borders
- compact padding
- clear hierarchy
- small metadata

Avoid:
- giant padding
- big shadows
- loud gradients
- oversized titles

---

## Motion

```css
transition-duration: 120ms-180ms;
```

Allowed:
- slight brightness shift
- subtle border change
- tiny translateY(-1px)

Avoid:
- slow cinematic motion
- large scaling
- glow animations

---

## Feed Direction

Feeds should feel:
- active
- current
- compact
- socially alive

Show:
- avatars
- status
- rank
- role
- region
- timestamps
- join/request activity

Reduce dead space.

---

## Profile Direction

Profiles should be:
- inspectable
- identity-heavy
- competitive
- immediately scannable

Prioritize:
- username
- rank
- role
- platform
- region
- hero pool
- online/queue status

---

## Final Standard

Overclock should feel like:
- late-night ranked forum
- Discord-adjacent social hub
- private beta gaming community
- competitive identity layer

Not:
- startup dashboard
- generic esports app
- productivity tool
