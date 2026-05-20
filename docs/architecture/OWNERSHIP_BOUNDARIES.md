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

## Matches Example

Use `/matches` as the reference split:

- `overclock/app/matches/*`
  - owns request-time orchestration for `/matches` and the `/connections` alias
  - handles auth gating, onboarding redirects, and page DTO loading
- `overclock/features/matches/*`
  - owns matches UI plus invite/connection server actions
- `overclock/lib/pages/matches-page-dto.ts`
  - owns DTO RPC loading and normalization for the page-shaped read model
- `overclock/lib/matches/*`
  - owns invite/connection record access and pure invite helpers

Do not add matches mutations back under `app/matches/*`. Keep that route folder
focused on request-time page orchestration.

## Current Follow-Up Targets

These files still blur the target split and should be treated as cleanup
follow-ups rather than new patterns:

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
