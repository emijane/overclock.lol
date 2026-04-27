# LFG Sections QA Report

Date: 2026-04-27

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

- Finding 1: Fixed in application code on 2026-04-27
- Finding 2: Fixed in application code on 2026-04-27
- Findings 3-7: Still open

## Finding 1

1. Severity: Critical
2. File path: `app/lfg/components/lfg-page-shell.tsx`
3. What is wrong: `/teams` and `/scrims` expose the create-post form, but the form only renders `game_mode` for `duos` and `stacks`. The server action still requires `game_mode` for every section, so team and scrim posts cannot be created successfully.
4. How to reproduce it:
   - Log in with a fully onboarded profile that has a configured competitive role.
   - Open `/teams` or `/scrims`.
   - Fill in a title, pick a role, and submit.
   - The server redirects back with `Choose a mode before posting.`
5. Why it happens:
   - `app/lfg/components/lfg-page-shell.tsx` only renders `<LFGGameModePicker />` when `type === "duos" || type === "stacks"`.
   - `app/lfg/actions.ts` always reads `game_mode` and hard-fails when `isLFGGameMode(gameModeValue)` is false.
6. Exact recommended fix:
   - Make the contract section-aware.
   - Either:
     - render a hidden default `game_mode` for `teams` and `scrims`, or
     - change `createLFGPost` so `game_mode` is only required for sections that actually use it.
   - If `teams` and `scrims` truly do not need queue mode, update the data model/UI so those posts do not pretend to carry one.
7. Regression test to run after fixing:
   - Submit one valid post from each section: `/duos`, `/stacks`, `/teams`, `/scrims`.
   - Confirm all four create successfully and the resulting feed row shows the expected section-specific data.

## Finding 2

1. Severity: Critical
2. File path: `lib/lfg/posts.ts`
3. What is wrong: The anti-spam limit is not enforcing a rolling "2 created posts per section per 60 minutes" rule. It currently enforces "2 active posts per role per section within the last 12 hours."
4. How to reproduce it:
   - Create two `/duos` posts as `tank`.
   - Close one immediately.
   - Create another `/duos` `tank` post right away. It is allowed because the closed post no longer counts.
   - Repeat with `dps` and `support` to hold up to six simultaneous posts in one section.
5. Why it happens:
   - `getActivePostCutoffIso()` uses `ACTIVE_LFG_POST_WINDOW_HOURS = 12` for both feed visibility and abuse checks.
   - `hasReachedActiveLFGPostLimit()` filters by `status = "active"` and `posting_role`, so closed posts stop counting and each role gets its own bucket.
   - `LFG_ACTIVE_POST_LIMIT_PER_ROLE_PER_SECTION = 2` bakes the per-role loophole into the policy layer.
6. Exact recommended fix:
   - Split feed-expiry logic from rate-limit logic.
   - Add a dedicated rolling rate-limit window of 60 minutes.
   - Count post creation events regardless of current status.
   - If product intent is "per section," remove `posting_role` from the limiter.
   - Enforce this in the database path used for creation, not just in UI copy.
   - If deletion will ever exist, use soft-delete or a post-event table so abuse history is not erased.
7. Regression test to run after fixing:
   - Create two posts in the same section within 60 minutes, close both, then attempt a third.
   - Verify the third is blocked.
   - Verify creating in another section still works if that is intended.
   - Verify role swapping does not grant extra slots in the same section if the policy is section-wide.

## Finding 3

1. Severity: Critical
2. File path: `app/lfg/actions.ts`
3. What is wrong: Duplicate prevention and post-limit checks are raceable. Two near-simultaneous submissions can both pass validation and insert duplicate or over-limit rows.
4. How to reproduce it:
   - Use two tabs or script two parallel POSTs to the create action with the same payload.
   - Fire them at nearly the same time.
   - Both requests can pass `hasMatchingActiveLFGPost()` and `hasReachedActiveLFGPostLimit()` before either `insertLFGPost()` commits.
5. Why it happens:
   - The create flow does three separate steps: read duplicate state, read count state, then insert.
   - There is no transaction, lock, RPC, or database constraint making the check-and-insert atomic.
6. Exact recommended fix:
   - Move LFG creation into one database-enforced operation.
   - Recommended shape:
     - create a Postgres function/RPC that acquires a per-user-per-section advisory lock,
     - re-checks duplicate/rate-limit conditions inside the function,
     - inserts only if all checks still pass.
   - Add supporting constraints/indexes where possible so failures are deterministic even under concurrency.
7. Regression test to run after fixing:
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

1. Fix the `/teams` and `/scrims` create-path breakage.
2. Replace the current active-post limiter with a real rolling creation-event limiter.
3. Move creation enforcement into one atomic database operation.
4. Lock down and source-control `lfg_posts` RLS/constraints.

## Notes

- I did not rewrite application code for this task.
- The report is based on repository inspection only; no live Supabase policy console or seeded E2E session was available in this workspace.
