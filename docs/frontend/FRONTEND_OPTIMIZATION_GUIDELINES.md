# Frontend Optimization Guidelines

## Purpose

This project uses Tailwind CSS for application layout and fast component composition, with `overclock/app/globals.css` providing shared design primitives, reusable motion, and repeated visual treatments.

The goal is to keep styling:

- consistent across routes
- easy to maintain
- cheap to render
- safe to extend without visual drift

## Styling Philosophy

- Prefer Tailwind for structure, spacing, typography, and responsive behavior.
- Prefer global CSS primitives for repeated surfaces, repeated motion, and repeated polish.
- Extract only real patterns.
- Keep route files focused on composition instead of carrying long repeated visual strings.
- Preserve existing product behavior and visual direction when refactoring.

## When To Use Tailwind

Use Tailwind for:

- flex, grid, width, height, min/max sizing
- margin, padding, gap, alignment, positioning
- typography sizing, weights, tracking, line-height
- responsive variants
- one-off visual adjustments that are not shared enough to justify abstraction
- state utilities when the state treatment is local and simple

Examples:

- `flex items-center justify-between gap-3`
- `px-4 py-3 sm:px-6`
- `text-sm font-semibold tracking-[0.08em]`
- `md:grid-cols-2`

## When To Use Vanilla CSS

Use `globals.css` for:

- design tokens
- shared surface primitives
- shared hover/lift transitions
- repeated gradients
- repeated overlays
- repeated animation classes
- reusable component polish
- repeated social/brand color hooks

Examples in this repo:

- `.oc-card-lift`
- `.oc-surface-panel`
- `.oc-surface-modal`
- `.oc-surface-elevated`
- `.oc-surface-subtle`
- `.page-enter`

## Token Rules

Keep tokens practical and used.

Prefer tokens for:

- background layers
- reusable surface colors
- border strengths
- repeated radius values
- repeated shadows
- shared motion timing and easing
- repeated brand accents

Current token categories live in `overclock/app/globals.css` and include:

- `--oc-bg-*`
- `--oc-border-*`
- `--oc-radius-*`
- `--oc-shadow-*`
- `--oc-duration-*`
- `--oc-ease-*`
- `--oc-color-*`

Rules:

- Do not add tokens for one-off values.
- Remove tokens that are no longer used.
- Prefer semantic names like `--oc-bg-card` over purely literal names.
- If a value repeats 3+ times and expresses the same role, consider a token or primitive.

## Shared Surface Conventions

Use the existing global primitives before inventing new class clusters:

- `.oc-card-lift`
  Use for translucent lifted cards with hover lift.
- `.oc-surface-solid-lift`
  Use for solid deep cards with hover shadow changes.
- `.oc-surface-panel`
  Use for deep content shells and large route panels.
- `.oc-surface-modal`
  Use for modal shells that need the stronger modal shadow.
- `.oc-surface-elevated`
  Use for lighter elevated overlays and confirmation surfaces.
- `.oc-surface-subtle`
  Use for empty states and low-emphasis inset panels.
- `.oc-list-row-hover`
  Use for repeated list-row hover affordances.

Keep Tailwind for local sizing and spacing around those primitives:

- Good: `className="oc-surface-panel rounded-[22px] p-5"`
- Bad: repeating `border border-white/8 bg-[#05070b] shadow-[...]` in every shell

## Animation Rules

- Put reusable keyframes and reusable motion classes in `globals.css`.
- Keep animation names semantic and short.
- Use shared easing and duration tokens.
- Always add a `prefers-reduced-motion` fallback for reusable animation systems.
- Avoid repeating identical `transition-* duration-*` groups in many components when one shared primitive can own them.

Examples:

- `page-enter`
- `page-fade-enter`
- shared lift transitions on `.oc-card-lift` and `.oc-surface-solid-lift`

## Component Styling Conventions

### Cards

- Use shared surface primitives for shell visuals.
- Keep per-card spacing and layout in Tailwind.
- Avoid re-encoding the same shadow/background/border combo inline.

### Buttons

- Use Tailwind for one-off button variants.
- Use shared CSS only when multiple buttons share the same visual chrome.
- Preserve focus-visible behavior and disabled affordances.

### Pills and badges

- Use `.oc-profile-pill` when the shared pill treatment fits.
- Keep text color and spacing local if the badge content is route-specific.

### Menus and overlays

- Prefer a shared surface primitive for the shell.
- Keep placement, size, and responsive behavior in Tailwind.

### Loading states

- Reuse motion classes or shared visual shells where possible.
- Avoid creating separate near-identical loading-only surfaces when the live component shell already exists.

## Duplication Avoidance Rules

Before extracting a class, confirm:

1. The pattern appears in multiple places.
2. The pattern means the same thing in each place.
3. The abstraction improves readability more than it hides intent.

Do not extract:

- one-off spacing combinations
- isolated responsive tweaks
- tiny combinations that are clearer inline

Do extract:

- repeated shell surfaces
- repeated hover/lift treatments
- repeated overlay treatments
- repeated deep background/shadow combinations

## Performance Guidelines

- Prefer shared CSS primitives over extremely long repeated arbitrary-value utility strings.
- Reuse stable shadows and backgrounds instead of inventing slightly different versions without reason.
- Keep hover animations limited to opacity, transform, background-color, border-color, and box-shadow.
- Respect `prefers-reduced-motion`.
- Avoid stacking unnecessary blur, shadow, and gradient effects unless they materially improve the UI.
- Keep global CSS truly global and reusable to avoid route-to-route stylesheet conflicts.

## Accessibility Styling Rules

- Never remove visible `focus-visible` affordances during refactors.
- Preserve disabled styling and disabled cursor behavior.
- Preserve contrast relationships when replacing literal colors with tokens.
- Ensure reduced-motion fallbacks exist for reusable motion classes.
- Do not hide interactive affordances behind hover-only behavior.

## Responsive Styling Rules

- Keep responsive layout decisions in Tailwind near the component markup.
- Do not move breakpoint-specific layout logic into global CSS unless it is a true shared pattern.
- Preserve current breakpoint behavior unless a bug is being fixed deliberately.

## Anti-Patterns To Avoid

- Repeating the same arbitrary shadow/background/border cluster across many files.
- Adding tokens that are never consumed.
- Creating generic utility classes for spacing or layout that Tailwind already handles well.
- Mixing multiple slightly different versions of the same card shell without a product reason.
- Using global CSS for route-local one-off styling.
- Introducing new animation styles without reduced-motion handling.

## Good vs Bad Examples

Good:

```tsx
<section className="oc-surface-panel rounded-[22px] p-5 sm:p-6" />
```

Good:

```tsx
<article className="oc-card-lift rounded-[10px] p-3" />
```

Bad:

```tsx
<section className="rounded-[22px] border border-white/8 bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] p-5" />
```

Bad:

```tsx
<div className="transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/[0.11] hover:shadow-[0_10px_22px_rgba(0,0,0,0.22)]" />
```

If that treatment already exists elsewhere, move it into a shared primitive.

## Contributor Expectations

- Start by checking whether a shared primitive already exists.
- If you add a new repeated visual treatment, document it in `globals.css` with a short purpose comment.
- If you introduce a new styling rule used across routes, update this guide in the same change.
- Prefer safe refactors over broad redesigns.
- When in doubt, preserve behavior and reduce duplication incrementally.
