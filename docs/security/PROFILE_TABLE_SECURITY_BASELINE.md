# Profile Table Security Baseline

Last updated: 2026-05-18

## Purpose

This document names the canonical source-controlled security baseline for the
older core profile tables whose original bootstrap migrations were missing from
this repo until the reconstructability backfill added a canonical bootstrap.

Canonical migration:

- [20260518130000_backfill_profile_table_security_baseline.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260518130000_backfill_profile_table_security_baseline.sql:1)

Related bootstrap/replay support:

- [20260427170000_bootstrap_public_profile_and_lfg_core_schema.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260427170000_bootstrap_public_profile_and_lfg_core_schema.sql:1)
- [20260518132000_reconcile_bootstrap_schema_drift.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260518132000_reconcile_bootstrap_schema_drift.sql:1)

That migration is the repo source of truth for final grants and RLS posture on:

- `public.profiles`
- `public.competitive_profiles`
- `public.competitive_role_profiles`
- `public.profile_hero_pools`
- `public.profile_featured_clips`
- `public.badges`
- `public.profile_badges`

## Final Access Model

The shipped product model is:

- public profile data is readable by guests and signed-in users
- profile-owned writes are limited to the owning authenticated user
- badge definitions and badge assignments are public read surfaces
- badge writes happen through the server-only service-role admin path, not
  through end-user direct table writes

## Table Summary

| Table | Public read | Owner write | Direct end-user delete | Notes |
| --- | --- | --- | --- | --- |
| `public.profiles` | Yes | insert/update by `id = auth.uid()` | No | Supports onboarding plus profile/account edits |
| `public.competitive_profiles` | Yes | insert/update by `profile_id = auth.uid()` | No | Supports account competitive settings |
| `public.competitive_role_profiles` | Yes | insert/update/delete by `profile_id = auth.uid()` | Yes | Supports role setup/removal |
| `public.profile_hero_pools` | Yes | insert/update by `profile_id = auth.uid()` | No | Supports public profile hero-pool display plus owner edits |
| `public.profile_featured_clips` | Yes | insert/update/delete by `profile_id = auth.uid()` | Yes | Supports public clips plus owner edits |
| `public.badges` | Yes | No | No | Read-only to end users |
| `public.profile_badges` | Yes | No | No | Service-role admin writes only |

## Scope Notes

This baseline fixes the audit problem where final grant/RLS truth for these
tables was not reconstructable from repo source.

It does not claim to recreate the original historical DDL sequence for every
column-by-column change on those older tables. Instead, it captures the final
security posture, while the new bootstrap and reconciliation migrations make a
from-scratch replay path possible from repo source.
