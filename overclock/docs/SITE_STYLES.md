# Site Styles & Theme

Dark-first, zinc-based palette. Tailwind v4 + `react-icons` + `lucide-react`. Font: Geist Sans.

---

## Colors

| Role | Value |
|---|---|
| Page bg | `#09090b` (zinc-950) |
| Card bg | `#05070b` |
| Primary text | `text-zinc-50` / `text-zinc-100` |
| Body text | `text-zinc-300` |
| Muted / secondary | `text-zinc-500` |
| Username | `text-zinc-600` |
| Accent | `sky-400` (#38BDF8) |
| Dividers | `border-white/6` |
| Card borders | `border-white/8` |

### Brand colors (social icons)
| Platform | Color |
|---|---|
| Discord | `#5865F2` |
| Battle.net | `#00AEF0` |
| Twitch | `#9146FF` |
| YouTube | `#FF0033` |
| X/Twitter | `text-zinc-100` |

---

## Page Layout

- Max width: `max-w-4xl` via `PageContainer`
- Page bg uses layered radial gradients + a dot grid overlay (`aria-hidden`):
  ```
  bg-[radial-gradient(circle_at_top,...),#09090b]
  ```
  Dot grid: `bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-size-[11px_11px]` masked to a region
- Wrap page sections in `<PageReveal>` for entrance animation

---

## Cards / Containers

```
rounded-[22px] border border-white/8 bg-[#05070b]
shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]
```

- Larger wrappers (e.g. page sections): `rounded-[28px]`
- List item dividers: `border-b border-white/6`
- Row hover: `hover:bg-white/[0.025]`
- Row padding: `px-4 py-3 sm:px-5`

---

## Typography

| Use | Classes |
|---|---|
| Page heading | `text-3xl sm:text-4xl font-semibold tracking-[-0.07em] text-zinc-50` |
| Display name | `text-[29px] sm:text-[31px] font-semibold leading-[1.02] tracking-[-0.045em] text-zinc-50` |
| Body | `text-[16px] leading-7 tracking-[-0.015em] text-zinc-300` |
| Small label | `text-sm text-zinc-500` |
| Breadcrumb nav | `text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500` |
| Username | `text-sm text-zinc-500` (prefixed `@`) |

---

## Buttons

**Pill (text):**
```
inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5
px-3 text-xs font-medium text-zinc-100 backdrop-blur-md
transition hover:bg-white/10
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70
focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
```

**Icon-only (circular):**
```
inline-flex h-8 w-8 items-center justify-center rounded-full
border border-white/10 bg-white/5 backdrop-blur-md transition
```

**Tab (active / inactive):**
```
active:   bg-white/8 text-zinc-100
inactive: text-zinc-500 hover:text-zinc-300
```
Both: `inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold transition`

---

## Badges / Tags

**Generic:**
```
inline-flex items-center rounded-full border border-white/10 bg-white/5
px-2.5 py-1 text-xs font-medium text-zinc-300
```

**Looking to play (sky):**
```
border-sky-400/20 bg-sky-400/10 text-sky-300
```
Includes animated ping dot: `animate-ping rounded-full bg-sky-400 opacity-75`

**Status pill (copied confirmation):**
```
inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02]
px-2.5 py-1 text-[12px] font-medium tracking-[-0.01em] text-zinc-300 backdrop-blur-md
```

---

## Icons

- Use `lucide-react` for UI icons (chevrons, filters, etc.)
- Use `react-icons/fa` and `react-icons/fa6` for social/brand icons
- Use `react-icons/si` for Battle.net (`SiBattledotnet`)
- Inline icon size with text: `h-3.5 w-3.5`
- Standalone icon in button: `h-4 w-4`

---

## Animations

Defined in `globals.css`, applied via class:

| Class | Effect |
|---|---|
| `page-enter` | Slide up + fade, 820ms `cubic-bezier(0.16,1,0.3,1)` |
| `page-fade-enter` | Fade only, 420ms ease-out |
| `page-enter-delay-1` | +180ms delay |
| `page-enter-delay-2` | +320ms delay |

Respects `prefers-reduced-motion`.
