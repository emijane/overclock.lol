# Ownership Boundaries

Canonical ownership split for the active app:

- `overclock/app/*`
  - route entrypoints and orchestration only
  - reads `params` and `searchParams`
  - loads auth/viewer context
  - coordinates page-specific redirects and not-found handling
  - may share route-only helpers with alias routes when the helper stays inside
    `app/*`
  - passes prepared data into shared UI
- `overclock/features/*`
  - domain UI
  - server actions and mutations
  - feature-owned composition that is reusable across routes
  - may import from the same feature subtree plus shared `components/*` and
    `lib/*`
  - must not import sibling feature folders or route-local `app/*` files
- `overclock/lib/*`
  - pure infra
  - data access
  - DTO loaders and normalizers
  - policies
  - pure helpers with no route ownership

## Enforced Lint Boundaries

Architecture linting now enforces these import rules:

- shared `components/*`, `features/*`, and `lib/*` code cannot import `app/*`
- route folders in `app/*` cannot import sibling top-level route folders
- each top-level feature in `features/*` may only import from:
  - its own feature subtree
  - shared `components/*`
  - shared `lib/*`

If shared code needs something from a route or sibling feature, move that code
to a shared component, a lib helper, or the owning feature instead of adding a
cross-boundary import.

## `lib/pages/*`

`overclock/lib/pages/*` is currently a valid page DTO boundary.

Use it for:

- bundled page-shaped read models
- Supabase RPC loaders that return one DTO for one surface
- DTO normalization from raw RPC JSON into typed server-side shapes

Do not use it for:

- route redirects
- auth gating UX decisions
- rendering UI
- generic domain reads that are not page-specific

If a loader stops being page-specific, fold it into a domain service under
`overclock/lib/<domain>/*` instead of growing `lib/pages/*`.

## App-Shell Auth Boundary

The root shell should stay as viewer-agnostic as possible.

- keep `overclock/app/layout.tsx` focused on global HTML, fonts, shared shell
  visuals, and long-lived client providers that do not require a server-side
  identity lookup
- do not treat the root layout as the primary place to resolve the current
  user, current profile, or authorization state
- keep auth checks close to page DTO loaders, route entrypoints, server
  actions, and route handlers
- prefer isolating signed-in shell state into a smaller boundary than the root
  layout when we refactor the global auth bar

Current decision:

- `PresenceProvider` can remain in the root layout because it resolves auth in
  the browser and does not require server-rendered profile state
- the authenticated header shell should eventually move behind a smaller
  auth-aware boundary instead of forcing the entire root layout to stay
  request-scoped
- a nested layout or similarly narrow shared server component boundary is the
  preferred target, not more auth work in `app/layout.tsx`

Why this is the target:

- it matches current Next.js guidance to avoid relying on layouts as the main
  auth-check boundary
- it keeps future caching and shell-performance work possible once cache policy
  changes
- it avoids coupling public or mostly-static shell UI to
  `getCurrentProfile()` by default

## Matches Example

Use `/matches` as the reference split:

- `overclock/app/matches/*`
  - owns the standalone `/matches` route entrypoint
- `overclock/app/connections/*`
  - owns the account-workspace `/connections` route entrypoint
- `overclock/features/matches/*`
  - owns matches UI plus invite/connection server actions and the shared
    route-loader used by both route entrypoints
- `overclock/lib/pages/matches-page-dto.ts`
  - owns DTO RPC loading and normalization for the page-shaped read model
- `overclock/lib/matches/*`
  - owns invite/connection record access and pure invite helpers

Do not add matches mutations back under `app/matches/*` or
`app/connections/*`. Keep those route folders focused on request-time page
orchestration.

## Current Follow-Up Targets

These files still blur the target split and should be treated as cleanup
follow-ups rather than new patterns:

- `overclock/app/layout.tsx`
  - still renders the shared auth-aware header directly from the root layout
- `overclock/features/lfg/section-page.tsx`
  - currently performs route-style search param orchestration
- `overclock/features/lfg/components/lfg-page-shell.tsx`
  - currently performs page DTO loading that should ultimately be orchestrated
    from `app/*`

## Working Rule

When adding a new route:

1. Keep the route file in `app/*` responsible for request-time orchestration.
2. Put domain UI and mutations in `features/*`.
3. Put reusable reads, DTO loaders, and normalizers in `lib/*`.
4. Add a `lib/pages/*` loader only when the read model is truly page-shaped.
