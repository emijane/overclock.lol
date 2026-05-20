# Ownership Boundaries

Canonical ownership split for the active app:

- `overclock/app/*`
  - route entrypoints and orchestration only
  - reads `params` and `searchParams`
  - loads auth/viewer context
  - coordinates page-specific redirects and not-found handling
  - passes prepared data into shared UI
- `overclock/features/*`
  - domain UI
  - server actions and mutations
  - feature-owned composition that is reusable across routes
- `overclock/lib/*`
  - pure infra
  - data access
  - DTO loaders and normalizers
  - policies
  - pure helpers with no route ownership

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
