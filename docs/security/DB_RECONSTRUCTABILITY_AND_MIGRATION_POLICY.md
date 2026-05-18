# DB Reconstructability And Migration Policy

Last updated: 2026-05-18

## Goal

A brand-new Supabase database must be rebuildable from repo migrations alone.

## Canonical Reconstructability Files

- [20260427170000_bootstrap_public_profile_and_lfg_core_schema.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260427170000_bootstrap_public_profile_and_lfg_core_schema.sql:1)
- [20260518132000_reconcile_bootstrap_schema_drift.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260518132000_reconcile_bootstrap_schema_drift.sql:1)
- [20260518130000_backfill_profile_table_security_baseline.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260518130000_backfill_profile_table_security_baseline.sql:1)

Together these files restore the missing schema source of truth and keep the
final grant/RLS posture auditable from the repo. In this workspace, the replay
path is source-controlled but not yet fully proven by a successful Docker-backed
empty-db reset.

## Missing Historical Objects Backfilled

The repo previously referenced these objects before fully recreating them:

- `public.lfg_posts`
- `public.profiles`
- `public.competitive_profiles`
- `public.competitive_role_profiles`
- `public.profile_hero_pools`
- `public.profile_featured_clips`
- `public.badges`
- `public.profile_badges`

The bootstrap migration now defines their table DDL, primary/unique keys,
foreign keys, defaults, indexes, RLS enablement, policies, and grants.

## Known Linked-DB Drift Reconciled

The linked public schema comparison also exposed repo drift:

- `public.profiles.platform` was still implied by repo history but is absent in
  the current linked database.
- `public.lfg_posts.updated_at` exists in the current linked database and is
  referenced by later repo functions, but older repo history did not recreate it.

The forward reconciliation migration preserves the linked database behavior while
also making a fresh rebuild converge toward the same final shape.

## Prelaunch Migration Policy

Use these rules before launch:

1. The migration chain must be able to rebuild an empty database without hidden
   manual schema steps.
2. Once any persistent Supabase database has applied a migration, do not rely on
   editing that old file as the deployment mechanism. Ship behavior fixes as new
   forward migrations.
3. If repo history is missing foundational schema, add an explicit bootstrap or
   baseline migration rather than relying on the live database as the source of
   truth.
4. Keep root docs in sync with migration-policy decisions and audit results.
5. Before launch, run:
   - `npx supabase db reset` when Docker/local stack is available
   - `npx supabase db diff --linked` when Docker is available
   - `npx supabase gen types typescript --linked --schema public`
   - `npm run verify`
6. Treat a fresh rebuild as the source of truth. If a linked database differs,
   add a forward reconciliation migration rather than silently accepting drift.

## Verification Limits In This Workspace

This workspace could generate linked public schema types, but `supabase db reset`
and `supabase db diff --linked` require Docker Desktop here and could not be
completed in this session. Re-run those commands in a Docker-enabled
environment before launch to fully prove the empty-db rebuild path.
