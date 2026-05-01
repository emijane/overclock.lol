# LFG Sections QA Report

Date: 2026-04-27

This report supersedes the older archived snapshot at
`docs/qa/archive/LFG_SECTIONS_QA_REPORT_2026-04-24.md`.

Scope audited:
- `/duos`
- `/stacks`
- `/teams`
- `/scrims`
- Shared LFG create/list/manage flow under `app/lfg/*`, `app/account/posts/*`, `app/u/[username]/*`, and `lib/lfg/*`

Method:
- Static audit of route code, server actions, shared UI, Supabase query helpers, and repo-visible database/RLS evidence
- Adversarial review from three angles: spammer, impatient user, normal player
- No production database access or authenticated browser session was available in this workspace, so database-policy findings are limited to what is verifiable from source control

## Status Update

- Finding 1: Fixed and QA'd on 2026-04-27
- Finding 2: Fixed and QA'd on 2026-04-27
- Finding 3: Fixed in source and database on 2026-04-27, pending live concurrency QA
- Finding 4: Fixed in source on 2026-04-27, pending migration apply and live QA
- Finding 6: Fixed and QA'd on 2026-04-27
- Finding 7: Fixed in source on 2026-04-27, pending migration apply and live security QA
- Finding 5: Still open

## Completed

### Removed From Active Queue

- Finding 1: `/teams` and `/scrims` create flow now submits `game_mode` correctly.
- Finding 2: Active-slot limits, creation-rate limits, and expiration timing are now separated in application code.
- Finding 6: Duplicate-post rejection now uses the error toast path instead of a success state.

## Pending Verification

### Finding 3

- Status: Fixed in source and database, pending live concurrency QA
- Files:
  - `app/lfg/actions.ts`
  - `lib/lfg/posts.ts`
  - `supabase/migrations/20260427172000_create_lfg_post_atomic.sql`
- Summary:
  - The create flow now routes through an atomic database function instead of relying on separate read-check-then-insert steps in application code.
  - The database function takes an advisory lock per `profile_id + section`, re-checks duplicate, active-slot, and creation-rate rules, and inserts atomically.
- Live regression test still required:
  - Fire 5 parallel create requests with identical payloads for one user/section.
  - Confirm exactly one row is inserted when duplicate rules should block the rest, and that rate-limit caps are still respected under concurrency.

### Finding 4

- Status: Fixed in source, pending migration deployment and live QA
- Files:
  - `app/lfg/actions.ts`
  - `lib/lfg/lfg-post-title.ts`
  - `lib/lfg/posts.ts`
  - `supabase/migrations/20260427190500_normalize_lfg_duplicate_title_check.sql`
- Summary:
  - Titles are now normalized in application code before validation and insert using Unicode normalization, trim, and whitespace collapse.
  - Duplicate-title fallback checks in application code now compare normalized titles instead of exact raw strings.
  - The atomic database function has a follow-up migration that normalizes casing and repeated outer/internal whitespace during duplicate matching.
- Live regression test still required:
  - Attempt duplicate posts that differ only by casing, repeated spaces, or trailing spaces.
  - Confirm they are blocked as duplicates while genuinely different titles still succeed.

### Finding 7

- Status: Fixed in source, pending migration deployment and live security QA
- Files:
  - `lib/lfg/posts.ts`
  - `supabase/migrations/20260427201500_secure_lfg_posts_rls_and_rpc.sql`
  - `docs/qa/LFG_SECURITY_AUDIT_REPORT.md`
- Summary:
  - `lfg_posts` now has a source-controlled security migration that enables RLS, adds public and owner read policies, blocks direct raw table writes for `anon` and `authenticated`, and moves close actions behind an RPC-backed write path.
  - `create_lfg_post_atomic(...)` is now redefined as `security definer` so the app can preserve RPC-only creation without opening direct insert policies.
  - Supporting indexes and defensive `NOT VALID` constraints are now committed in source control.
- Live regression test still required:
  - Push the migration and confirm raw direct `insert`, `update`, and `delete` against `lfg_posts` are blocked for `anon` and `authenticated`.
  - Confirm public active feed reads still work, owner history reads still work, and both create/close RPCs still succeed for the owning user.

## Finding 5

1. Severity: Medium
2. File path: `lib/competitive/competitive-profile.ts`
3. What is wrong: Disabled competitive roles still look configured to the LFG flow and can still be used for posting if a stale or manually-edited `competitive_role_profiles` row exists.
4. How to reproduce it:
   - In Supabase, set one of a user's `competitive_role_profiles.enabled` values to `false` without deleting the row.
   - Open an LFG section.
   - The role still appears configured, and the server-side create flow still accepts it.
5. Why it happens:
   - `normalizeCompetitiveRoleProfile()` preserves `enabled`, but `getCompetitiveProfile()` does not filter disabled rows out.
   - `app/lfg/components/lfg-page-shell.tsx` treats a role as configured with `Boolean(roleProfile)`.
   - `app/lfg/actions.ts` only checks whether the role row exists, not whether it is enabled.
6. Exact recommended fix:
   - Treat `enabled = false` as unavailable everywhere.
   - Filter disabled roles in `getCompetitiveProfile()` or add `.eq("enabled", true)` to the query.
   - Also reject disabled roles in `createLFGPost()` before insertion.
   - If the product no longer needs disabled rows, remove the column and rely on delete-only semantics.
7. Regression test to run after fixing:
   - Seed one enabled role and one disabled role for the same user.
   - Confirm only the enabled role appears in the picker.
   - Confirm a forged form submission using the disabled role is rejected server-side.

## Highest-Priority Fix Order

1. Tighten role enablement enforcement.
2. Clear Findings 3, 4, and 7 with live QA after migrations are applied.

## Notes

- The original audit was based on repository inspection only; live Supabase policy console and seeded E2E session access were not available in this workspace.
- Findings 1, 2, 3, 4, 6, and 7 now have corresponding source changes in this repo and still require the live verification called out above where marked.


- EXPIRED POSTS STOP FROM POSTING ACTIVE POST BY SAME TITLE