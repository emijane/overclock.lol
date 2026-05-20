# QA Audit: /duos & /stacks

**Date:** 2026-05-10
**Scope:** `/duos`, `/duos/create`, `/stacks`, `/stacks/create` and all shared LFG infrastructure
**Trigger:** Shipped `/stacks` MVP lifecycle, membership rules, notification integration, and stack card UI refinements

---

## Current Stacks State

- `/stacks` and `/stacks/create` are both shipped.
- Stacks start at `1/5` and automatically insert the owner as the first member.
- Users may belong to only one `active` or `filled` stack at a time.
- Public stack cards show accepted members only:
  - overlapping clickable avatars
  - max `4` visible, then `+X`
  - inline `x/5` count
- Owner-side request handling reuses the existing notification dropdown.
- Current stack statuses are:
  - `active`
  - `filled`
  - `closed`
  - `expired`

## Current Known Limits

- This audit was still static-first:
  - `npm run typecheck`
  - `npm run lint`
  - repo inspection
- No live authenticated browser pass or remote Supabase QA evidence is embedded here.
- Requester-side follow-up notifications still follow the current lightweight pattern rather than a brand-new inbox flow.

## Priority Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | Critical | Rate limiting functions exported but never called — unlimited post creation | ✅ Fixed |
| 2 | Critical | `isLFGType` accepts `"scrims"` and `"teams"` — unshipped sections accept posts via form spoofing | ✅ Fixed |
| 3 | High | `Promise.all` in `getLFGPageData` — no per-branch error handling, crashes entire page on Supabase blip | ✅ Fixed |
| 4 | High | `getLFGPostInviteStates` throw uncaught in `LFGPageShell` — crashes feed on `play_invites` error | ✅ Fixed |
| 5 | High | `formatPostDate` calls `Date.now()` in server component — hydration mismatches on recent posts | ✅ Fixed |
| 6 | High | `<article>` in `LFGPostCard` has no accessible name — screen readers cannot identify posts | ✅ Fixed |
| 7 | High | `closeOwnedActiveLFGPost` passes no `profile_id` to RPC — ownership is DB-only with no app-layer check | ✅ Fixed |
| 8 | Medium | `LFGFeedFiltersPanel` calls `useSearchParams()` without `<Suspense>` — degrades route to CSR | ✅ Fixed |
| 9 | Medium | `getSafeReturnPath` passes `/\evil.com` — partial open redirect via backslash path | ✅ Fixed |
| 10 | Medium | Dual sequential `getCompetitiveProfile` calls on create pages — doubles DB round trips | ✅ Fixed |
| 11 | Medium | `heroPools.heroPicks[role]` — no null guard, throws TypeError if key missing | ✅ Fixed |
| 12 | Medium | `LFGInviteButton` — no user feedback on failed invite (silent reset) | ✅ Fixed |
| 12b | Medium | `LFGInviteButton` — stale error message persists across retry attempts | ✅ Fixed |
| 13 | Low | Post title max length constant duplicated across three files | ✅ Fixed |
| 14 | Low | `createLFGPost` does not revalidate `/lfg` after post creation | ✅ Fixed |
| 14b | Medium | Rate limit `Promise.all` in `createLFGPost` uncaught — Supabase error produces unhandled exception | ✅ Fixed |
| 14c | Low | `heroPools.heroPicks[postingRole]` in `actions.ts` lacks null guard (asymmetric with shell fix) | ✅ Fixed |
| 15 | Medium | Loading skeleton `tracking` class mismatches live shell | Open |
| 16 | Low | `getActiveLFGPosts` RLS policy undocumented | Open |
| 17 | Medium | `LFGFeedFiltersPanel` — no overflow handling on narrow screens (320px unverified) | Open |
| 18 | Low | Missing visible focus ring on interactive buttons | Open |
| 19 | Medium | Flat heading hierarchy — nested pickers use `<h2>` instead of `<h3>` | Open |
| 20 | Low | Role/status pills have no semantic label for screen readers | Open |
| 21 | Medium | `sendPlayInvite` — no application-layer rate limiting | Open |
| 22 | Low | Post title allows zero-width and bidirectional Unicode after NFKC | Open |
| 23 | Low | `type?: LFGType` optional but `composerMode: "cta"` without `type` links to `/lfg/create` (non-existent) | Open |

---

## Fixed Findings

### #1/#2 — Rate Limiting + Shipped Type Guard (Critical)

**Fixed in:** `overclock/lib/lfg/lfg-post-types.ts`, `overclock/app/lfg/actions.ts`

Added `SHIPPED_LFG_TYPES = ["duos", "stacks"] as const` and `isShippedLFGType()` to `lfg-post-types.ts`. Replaced `isLFGType` with `isShippedLFGType` in `createLFGPost` — `"scrims"` and `"teams"` now redirect to `/duos` with an error. Added `Promise.all([hasReachedLFGPostCreationLimit, hasReachedActiveLFGPostLimit])` call before `createLFGPostAtomically`.

### #3/#4 — Promise.all Error Isolation + Invite States Catch (High)

**Fixed in:** `overclock/app/lfg/components/lfg-page-shell.tsx`

Each branch of `Promise.all` in `getLFGPageData` now has a `.catch()` with safe fallback values. `getLFGPostInviteStates` call wrapped with `.catch(() => ({}))` — feed no longer crashes on `play_invites` Supabase errors.

### #5 — formatPostDate Hydration Mismatch (High)

**Fixed in:** `overclock/app/lfg/components/lfg-post-card.tsx`

Added `suppressHydrationWarning` to the date `<p>` element. Prevents React hydration warnings when the relative timestamp changes between server render and client execution.

### #6 — article Accessible Name (High)

**Fixed in:** `overclock/app/lfg/components/lfg-post-card.tsx`

Added `aria-label={post.title}` to the `<article>` element. Screen readers now announce each post by title when navigating article landmarks.

### #7 — closeOwnedActiveLFGPost Ownership Check (High)

**Fixed in:** `overclock/lib/lfg/posts.ts`

Added application-layer ownership pre-check: queries `lfg_posts` filtering by `id`, `profile_id`, and `status = active` before calling the RPC. Returns `{ updated: false, error_code: "forbidden" }` if the post does not belong to the requesting profile.

### #8 — LFGFeedFiltersPanel Suspense Boundary (Medium)

**Fixed in:** `overclock/app/lfg/components/lfg-page-shell.tsx`

Wrapped `LFGFeedFiltersPanel` in `<Suspense fallback={<div className="h-14" />}>`. Prevents Next.js from deopting the route to full CSR due to `useSearchParams()` usage without a boundary.

### #9 — getSafeReturnPath Backslash Bypass (Medium)

**Fixed in:** `overclock/app/lfg/actions.ts`

Added `path.includes("\\")` to the rejection condition in `getSafeReturnPath`. Paths like `/\evil.com` now correctly return `null`.

### #10 — Dual getCompetitiveProfile Calls (Medium)

**Fixed in:** `overclock/app/lfg/components/lfg-page-shell.tsx`

Replaced the two sequential `getCompetitiveProfile` + `getProfileHeroPools` awaits with a single `Promise.all`, stored in `composerOnlyProfile`. Both `composerRoleOptions` and `competitiveProfileForComposer` now share the single resolved value.

### #11 — heroPools Null Guard (Medium)

**Fixed in:** `overclock/app/lfg/components/lfg-page-shell.tsx`

`heroPools.heroPicks[role]` → `(heroPools.heroPicks[role] ?? [])` in `buildRoleOptions`.

### #12 — LFGInviteButton Error Feedback (Medium)

**Fixed in:** `overclock/app/lfg/components/lfg-invite-button.tsx`

Added `errorMessage` state. When `sendPlayInvite` returns an error that is not a "pending invite" message, sets `errorMessage` to "Couldn't send invite. Try again." and renders it below the button in `text-red-400`.

### #12b — LFGInviteButton stale error on retry (Medium)

**Fixed in:** `overclock/app/lfg/components/lfg-invite-button.tsx`

Added `setErrorMessage(null)` as the first line inside `startTransition` so the previous error is cleared before each new invite attempt.

### #14b — Rate limit Promise.all unhandled throw (Medium)

**Fixed in:** `overclock/app/lfg/actions.ts`

Wrapped the rate limit `Promise.all` in a try/catch that calls `lfgRedirect(lfgTypeValue, "Unable to create your post right now.")` on Supabase error, consistent with the rest of the action's error handling pattern.

### #14c — heroPools null guard in actions.ts (Low)

**Fixed in:** `overclock/app/lfg/actions.ts`

Added `?? []` to `heroPools.heroPicks[postingRole]` in `buildHeroPoolSnapshot(...)` call, matching the guard added to `lfg-page-shell.tsx`.

### #13 — LFG_POST_TITLE_MAX_CHARACTERS Shared Constant (Low)

**Fixed in:** `overclock/lib/lfg/lfg-post-types.ts`, `overclock/app/lfg/actions.ts`, `overclock/app/lfg/components/post-title-field.tsx`

Added `LFG_POST_TITLE_MAX_CHARACTERS = 80` to `lfg-post-types.ts`. Removed the local `MAX_POST_TITLE_LENGTH` constant from `post-title-field.tsx` and the hardcoded `80` from `actions.ts`. All three now import from the shared constant.

### #14 — revalidatePath('/lfg') (Low)

**Fixed in:** `overclock/app/lfg/actions.ts`

Added `revalidatePath("/lfg")` alongside the section-specific revalidation in `createLFGPost`.

---

## Open Findings

### #15 — Loading Skeleton Tracking Mismatch (Medium)

- Files: `overclock/app/duos/create/loading.tsx`, `overclock/app/stacks/create/loading.tsx`, `overclock/app/lfg/components/lfg-page-loading.tsx`
- Root cause: `LFGPageLoading` uses `tracking-[-0.04em]` on the skeleton h1; the live shell uses `tracking-[-0.075em]`. Causes a visible layout shift when the skeleton transitions to the real page.
- Fix: Align tracking class in `LFGPageLoading` with `tracking-[-0.075em]`.

### #16 — RLS Policy Undocumented (Low)

- File: `overclock/lib/lfg/posts.ts:225–228`
- Root cause: The expected RLS policy for public vs. authenticated reads on `lfg_posts` is not documented.
- Fix: Add a migration comment or docs note confirming the intended read policy.

### #17 — LFGFeedFiltersPanel Mobile Overflow (Medium)

- File: `overclock/app/lfg/components/lfg-feed-filters-panel.tsx`
- Root cause: Six filter buttons in `flex flex-wrap` with no `overflow-x: auto`. Layout on 320px viewports unverified.
- Fix: Test at 320px; add `overflow-x-auto` if wrapping breaks.

### #18 — Missing Focus Rings (Low)

- Files: `overclock/app/lfg/components/lfg-post-actions-menu.tsx`, filter dropdown triggers
- Root cause: Trigger buttons have `hover:` but no `focus-visible:ring-*`. Keyboard users see no focus indicator.
- Fix: Add `focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none`.

### #19 — Flat Heading Hierarchy (Medium)

- Root cause: Role picker and game mode picker inside the inline composer use `<h2>`, but they are nested within the composer section which is already under the page `<h1>`. They should use `<h3>`.

### #20 — Role/Status Pills No Semantic Label (Low)

- File: `overclock/app/lfg/components/lfg-post-card.tsx:134–141`
- Root cause: Platform and mode badges are plain `<span>` elements with no structural label for screen readers.

### #21 — sendPlayInvite No Rate Limiting (Medium)

- File: `overclock/features/matches/actions.ts`
- Root cause: No application-layer rate limit on invite sends.

### #22 — Post Title Unicode (Low)

- File: `overclock/lib/lfg/lfg-post-title.ts`
- Root cause: NFKC normalization does not strip zero-width joiners or RTL overrides. Titles can render differently in moderation tools.
- Fix: Strip Unicode Cf/Cc categories after normalization.

### #23 — Optional type with composerMode cta (Low)

- File: `overclock/app/lfg/components/lfg-page-shell.tsx`
- Root cause: `type?: LFGType` allows callers to pass `composerMode="cta"` without a `type`, producing a `guestCreateHref` of `/login?next=/lfg/create` which does not exist.
- Fix: Make `type` required when `composerMode !== "none"`.

## Next Steps

- Run live QA for stack create, request, accept, decline, leave, remove, and disband flows.
- Confirm one-active-stack enforcement against real concurrent requests.
- Verify notification dropdown behavior after accept/decline in a seeded environment.
- Re-check stack card mobile overflow and focus states in-browser.
