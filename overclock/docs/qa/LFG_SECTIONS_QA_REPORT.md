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
- Findings 4-7: Still open

## Completed

### Removed From Active Queue

- Finding 1: `/teams` and `/scrims` create flow now submits `game_mode` correctly.
- Finding 2: Active-slot limits, creation-rate limits, and expiration timing are now separated in application code.

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

## Finding 4

1. Severity: Medium
2. File path: `lib/lfg/posts.ts`
3. What is wrong: Duplicate detection is easy to bypass with cosmetic title changes. It only blocks exact string equality on `title`.
4. How to reproduce it:
   - Create a post titled `Need duo`.
   - Create another with `need duo`, `Need  duo`, or `Need duo ` plus a harmless variation.
   - The second submission is treated as distinct.
5. Why it happens:
   - `hasMatchingActiveLFGPost()` compares `.eq("title", input.title)` and does not normalize case, internal whitespace, or Unicode variants.
   - Only leading/trailing whitespace is trimmed in `createLFGPost()`.
6. Exact recommended fix:
   - Normalize titles server-side before checking/storing them.
   - Store a canonical `normalized_title` value using trim + whitespace collapse + lowercase + Unicode normalization.
   - Compare duplicate rules against `normalized_title`, not raw display text.
7. Regression test to run after fixing:
   - Attempt duplicate posts that differ only by casing, repeated spaces, trailing spaces, or Unicode-normalization variants.
   - Confirm they are blocked as duplicates while genuinely different titles still succeed.

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

## Finding 6

1. Severity: Minor
2. File path: `app/lfg/actions.ts`
3. What is wrong: A blocked duplicate submission is shown as a success state even though no post is created.
4. How to reproduce it:
   - Create a valid post.
   - Submit the same payload again while the first post is still active.
   - The redirect uses the success toast style for `You already have an active post in this section with this title.`
5. Why it happens:
   - The duplicate branch calls `lfgRedirect(..., "success")`.
6. Exact recommended fix:
   - Change the duplicate branch to use the error variant.
   - Keep the message explicit that no new post was created.
7. Regression test to run after fixing:
   - Re-submit an active duplicate.
   - Confirm the UI shows an error-state toast/banner and the database row count stays unchanged.

## Finding 7

1. Severity: Medium
2. File path: `docs/roadmap/PUBLIC_PROFILE_PERFORMANCE.md`
3. What is wrong: The repo gives source-controlled RLS status for public profile tables, but there is no checked-in Supabase SQL or migration file for `lfg_posts`. That means the most sensitive LFG protections, constraints, and owner-write rules are not reviewable from this codebase.
4. How to reproduce it:
   - Search the repo for Supabase migration or SQL files for `lfg_posts` policies/constraints.
   - You will find application code that reads/writes `lfg_posts`, but no repo-visible policy definition to verify who can insert, update, or select rows.
5. Why it happens:
   - Database rules appear to be managed out-of-band instead of being committed alongside the app code.
   - The code assumes RLS and constraints exist, but the repo cannot prove they do.
6. Exact recommended fix:
   - Add source-controlled Supabase migrations for `lfg_posts` and related indexes/constraints.
   - At minimum, check in:
     - `ENABLE ROW LEVEL SECURITY`
     - public read policy for intended feed fields
     - authenticated insert policy scoped to `profile_id = auth.uid()`
     - owner-only update policy for close actions
     - any duplicate/rate-limit supporting indexes or RPC definitions
7. Regression test to run after fixing:
   - Add policy tests or scripted verification that:
     - anonymous users cannot insert/update/delete LFG posts
     - authenticated users cannot create posts for another `profile_id`
     - authenticated users cannot close another user's post
     - public feed reads still work for intended viewers

## Highest-Priority Fix Order

1. Lock down and source-control `lfg_posts` RLS/constraints.
2. Normalize duplicate-title handling further.
3. Tighten role enablement enforcement.
4. Fix duplicate-post success-state messaging.

## Notes

- I did not rewrite application code for this task.
- The report is based on repository inspection only; no live Supabase policy console or seeded E2E session was available in this workspace.
