# Codebase Cleanup Audit

Audit scope: post-`22P02` debugging cleanup recommendations for Overclock.

Constraints followed:

- no code changes in this pass
- no migration edits in this pass
- no deletions in this pass
- no behavior/UI redesign recommendations
- recommendations favor small, verifiable follow-up cleanup

Current state summary:

- The repo worktree is currently clean.
- The real `22P02` fix was the live SQL body for `public.get_profile_page_dto(text, uuid)`.
- I did not find a leftover `uuid-shape-log.ts` file in the app tree.
- I did find one remaining profile timing log/wrapper on the profile page path that looks like debug/perf instrumentation rather than product behavior.

## P0: Temporary / Debug Leftovers

### 1. Profile timing wrapper and console log still present

- Priority: `P0`
- File path: `overclock/app/u/[username]/page.tsx`
- Issue: `measureProfileStep()` wraps the DTO load and logs `[profile:${username}] ...` timing in non-production. This looks like leftover investigation/profiling code rather than route behavior.
- Recommended action: remove `measureProfileStep()` and call `getProfilePageDto(...)` directly unless the team explicitly wants dev-only profiling for this route.
- Risk level: `Low`
- Safe to fix now or wait: `Safe now`

### 2. Investigation artifact check should be kept as a checklist item

- Priority: `P0`
- File path: `overclock/`
- Issue: no `uuid-shape-log.ts` or one-off UUID tracing file is present now, but this exact category caused confusion during the 22P02 investigation.
- Recommended action: keep future cleanup passes checking for ad hoc tracing files before commit.
- Risk level: `Low`
- Safe to fix now or wait: `Safe now`

## P1: Dead or Unused Code

### 3. Unused optional current user helper

- Priority: `P1`
- File path: `overclock/lib/profiles/get-optional-current-user-id.ts`
- Issue: `getOptionalCurrentUserId()` has no call sites in the repo scan.
- Recommended action: verify with one more import/reference check, then delete the file or fold its logic into a shared auth helper if still desired conceptually.
- Risk level: `Low`
- Safe to fix now or wait: `Safe now`

### 4. Stale profile search row shape

- Priority: `P1`
- File path: `overclock/lib/profiles/public-profile-search.ts`
- Issue: `ProfileSearchRow` includes `id?: string | null`, but the mapper never uses `id`.
- Recommended action: remove the unused field from the local row type after confirming the RPC response shape does not need it elsewhere.
- Risk level: `Low`
- Safe to fix now or wait: `Safe now`

## P2: Duplicate Logic

### 5. Duplicated auth-cookie detection

- Priority: `P2`
- File paths:
  - `overclock/lib/profiles/get-optional-current-user-id.ts`
  - `overclock/lib/profiles/get-optional-current-invite-viewer.ts`
- Issue: both files define the same `isSupabaseAuthCookie()` helper.
- Recommended action: extract a tiny shared helper under `overclock/lib/supabase/` or `overclock/lib/profiles/` and reuse it.
- Risk level: `Low`
- Safe to fix now or wait: `Safe now`

### 6. Repeated auth-claims lookup and guest fallback flow

- Priority: `P2`
- File paths:
  - `overclock/lib/profiles/get-current-profile.ts`
  - `overclock/lib/profiles/get-optional-current-user-id.ts`
  - `overclock/lib/profiles/get-optional-current-invite-viewer.ts`
- Issue: all three files perform overlapping “read auth state, derive user/profile presence, degrade to guest/null” logic with slightly different behavior.
- Recommended action: consolidate around a small shared server-side viewer/auth primitive, then let callers layer route-specific behavior on top.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait until after smaller P0/P1 cleanup`

### 7. Repeated DTO parsing helpers across page DTO files

- Priority: `P2`
- File paths:
  - `overclock/lib/pages/profile-page-dto.ts`
  - `overclock/lib/pages/lfg-feed-page-dto.ts`
  - `overclock/lib/pages/account-posts-page-dto.ts`
  - `overclock/lib/pages/matches-page-dto.ts`
- Issue: these files repeat similar normalizers for role profiles, hero snapshots, badges, role validation, and defensive object/array parsing.
- Recommended action: do not broadly refactor now, but identify a few high-value shared mappers first, especially competitive role profile normalization and common “record or null” parsing helpers.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait; split into narrowly-scoped follow-ups`

### 8. Repeated `createClient() + rpc() + throw if error` pattern

- Priority: `P2`
- File paths:
  - `overclock/lib/pages/profile-page-dto.ts`
  - `overclock/lib/pages/lfg-feed-page-dto.ts`
  - `overclock/lib/pages/account-posts-page-dto.ts`
  - `overclock/lib/pages/matches-page-dto.ts`
  - `overclock/lib/matches/play-invites.ts`
  - `overclock/lib/lfg/stack-requests.ts`
  - `overclock/lib/blocks/user-blocks.ts`
- Issue: many files repeat the same Supabase RPC boilerplate, with only `matches-page-dto.ts` already introducing a local `callRpc(...)` helper.
- Recommended action: standardize on a tiny shared RPC helper only after behavior is locked down, so the cleanup does not hide per-call auth assumptions.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait`

## P3: Architecture Issues

### 9. Shared component imports route-local server actions

- Priority: `P3`
- File path: `overclock/components/navigation/global-notifications-menu-client.tsx`
- Issue: this shared navigation component imports `acceptStackJoinRequest` and `declineStackJoinRequest` from `@/app/stacks/actions`, which breaks the repo rule that shared components must not depend on route-local files.
- Recommended action: move the stack-request actions behind a feature-owned boundary, likely `overclock/features/...`, and import that shared entrypoint instead.
- Risk level: `High`
- Safe to fix now or wait: `Wait until scoped action-move follow-up`

### 10. Public profile loading overlaps between route helper and page DTO path

- Priority: `P3`
- File paths:
  - `overclock/lib/profiles/get-profile-by-username.ts`
  - `overclock/lib/pages/profile-page-dto.ts`
- Issue: the codebase has two different public profile loading approaches: direct table query with block check, and RPC-driven page DTO loading. That makes ownership of “public profile read rules” less clear.
- Recommended action: decide which path is canonical for public profile reads and document when the simpler helper is still appropriate.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait`

### 11. DB/RPC read logic is spread across route, lib, and feature layers without one obvious ownership model

- Priority: `P3`
- File paths:
  - `overclock/lib/pages/*.ts`
  - `overclock/lib/matches/play-invites.ts`
  - `overclock/lib/lfg/posts.ts`
  - `overclock/lib/lfg/stack-requests.ts`
  - `overclock/lib/blocks/user-blocks.ts`
- Issue: page bundles live in `lib/pages`, while adjacent domain reads/writes are split across unrelated folders. This is workable, but it increases drift risk and makes cleanup harder.
- Recommended action: document ownership boundaries before refactoring. For example: page DTO bundles in `lib/pages`, domain mutations/reads in `features/*` or `lib/<domain>/*`, and route files only orchestrate.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait`

## P4: Maintainability Cleanup

### 12. Stale file-level comment in server Supabase helper

- Priority: `P4`
- File path: `overclock/lib/supabase/server.ts`
- Issue: the top comments say the file “is used in Server Components,” but it is also used by server actions and route handlers. The guidance is partially stale.
- Recommended action: update the comment so it reflects all intended server-only call sites.
- Risk level: `Low`
- Safe to fix now or wait: `Safe now`

### 13. Ambiguous `createClient()` naming across client/server modules

- Priority: `P4`
- File paths:
  - `overclock/lib/supabase/server.ts`
  - `overclock/lib/supabase/client.ts`
  - many importing call sites
- Issue: both server and browser helpers export the same generic `createClient()` name. The imports are valid, but the symmetry increases review mistakes and makes call sites harder to skim.
- Recommended action: consider naming the server helper `createServerSupabaseClient()` or similar in a later cleanup pass, but only as a deliberate mechanical refactor.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait`

### 14. Very large files with mixed responsibilities

- Priority: `P4`
- File paths:
  - `overclock/lib/lfg/posts.ts`
  - `overclock/lib/matches/play-invites.ts`
  - `overclock/app/account/actions.ts`
  - `overclock/lib/pages/profile-page-dto.ts`
  - `overclock/app/lfg/components/lfg-page-shell.tsx`
- Issue: these files are among the largest in the app and combine multiple responsibilities, making targeted fixes riskier and review harder.
- Recommended action: split only when touching nearby logic anyway; avoid one big “cleanup” refactor. Start with pure normalizers or validation blocks.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait`

### 15. Outdated roadmap/TODO notes likely drifted from shipped behavior

- Priority: `P4`
- File path: `docs/roadmap/PRODUCT_BACKLOG.md` (previously `overclock/TODO`)
- Issue: several entries appear already shipped or partially shipped, including featured clips, social links, and validation helpers. The file is useful, but parts of it look stale.
- Recommended action: prune completed items and mark roadmap vs shipped more clearly so future audits do not treat old notes as missing work.
- Risk level: `Low`
- Safe to fix now or wait: `Safe now`

### 16. Confusing fallback behavior in profile DTO normalization

- Priority: `P4`
- File path: `overclock/lib/pages/profile-page-dto.ts`
- Issue: `normalizeDto()` still uses `profileId: ""` in the empty competitive-profile fallback. That is not the SQL bug anymore, but it keeps a sentinel empty string in app memory that can be misleading.
- Recommended action: consider replacing the local empty fallback model with a clearer nullable shape or an explicit “no profile” DTO state in a follow-up, but only after checking downstream assumptions.
- Risk level: `Medium`
- Safe to fix now or wait: `Wait`

## P5: Risk Review, Do Not Change Yet

### 17. SQL/RPC functions still directly rely on `auth.uid()`

- Priority: `P5`
- File paths:
  - `overclock/supabase/migrations/20260514040000_secure_viewer_context_and_block_helpers.sql`
  - `overclock/supabase/migrations/20260506130000_add_profile_connections.sql`
  - `overclock/supabase/migrations/20260506120000_add_play_invite_lifecycle_rpcs.sql`
  - `overclock/supabase/migrations/20260514010000_add_update_last_seen_rpc.sql`
  - several other mutation/read migrations returned by the repo scan
- Issue: many live-function definitions still use `auth.uid()` directly. Most are probably correct for authenticated mutations, but the profile DTO incident proved that auth-shape assumptions need extra scrutiny on public and hybrid flows.
- Recommended action: review public/hybrid read RPCs first, then authenticated mutations that compare caller-supplied IDs to `auth.uid()`.
- Risk level: `High`
- Safe to fix now or wait: `Wait; audit function-by-function`

### 18. Earlier migration file still contains the old unsafe profile DTO function body

- Priority: `P5`
- File path: `overclock/supabase/migrations/20260514040000_secure_viewer_context_and_block_helpers.sql`
- Issue: this migration still contains an older `get_profile_page_dto(...)` definition with `v_current_user_id uuid := auth.uid();` and `coalesce(tp.id, '')`. The latest migration supersedes it, but older bodies remain in history.
- Recommended action: do not rewrite historical migrations right now. Instead, document clearly that `20260515003000_fix_profile_page_dto_empty_uuid.sql` is the source of truth for the final profile DTO body.
- Risk level: `High`
- Safe to fix now or wait: `Wait`

### 19. Public pages still use authenticated server Supabase clients directly

- Priority: `P5`
- File paths:
  - `overclock/lib/pages/profile-page-dto.ts`
  - `overclock/lib/pages/lfg-feed-page-dto.ts`
  - `overclock/lib/profiles/public-profile-search.ts`
  - `overclock/lib/profiles/get-profile-by-username.ts`
- Issue: these public-facing reads all use `createClient()` with request cookies/auth context. That is not inherently wrong, but it means public pages can still be affected by malformed or unexpected auth state unless each path is carefully guarded.
- Recommended action: audit whether public reads should use a distinct guest-safe server client abstraction for routes that are intentionally public.
- Risk level: `High`
- Safe to fix now or wait: `Wait`

### 20. Protected read/write helpers still trust `user.id` shape locally

- Priority: `P5`
- File paths:
  - `overclock/lib/profiles/get-current-profile.ts`
  - `overclock/lib/blocks/user-blocks.ts`
  - `overclock/lib/profiles/get-optional-current-invite-viewer.ts`
- Issue: these helpers use auth-derived IDs in table filters and follow-up reads. The SQL bug is fixed, but malformed auth state handling should still be reviewed intentionally rather than piecemeal.
- Recommended action: do not add broad guards blindly. Instead, define one canonical server-side auth identity contract and then adopt it across these helpers.
- Risk level: `High`
- Safe to fix now or wait: `Wait`

## Safest Cleanup Order

1. Remove the profile timing log/wrapper in `overclock/app/u/[username]/page.tsx`.
2. Remove `overclock/lib/profiles/get-optional-current-user-id.ts` after one final reference check.
3. Deduplicate `isSupabaseAuthCookie()` between the two optional viewer helpers.
4. Update stale comments and trim the canonical backlog doc at `docs/roadmap/PRODUCT_BACKLOG.md`.
5. Plan, but do not yet execute, the architecture cleanup for shared components importing route-local actions.
6. After that, do a separate risk review for public-read auth handling and `auth.uid()`-dependent SQL functions.

## Files That Should Not Be Touched Yet

- `overclock/supabase/migrations/20260515003000_fix_profile_page_dto_empty_uuid.sql`
  - keep as the final `22P02` fix
- historical migrations under `overclock/supabase/migrations/`
  - do not rewrite history during cleanup
- `overclock/lib/pages/profile-page-dto.ts`
  - only touch for tiny cleanup after runtime confidence is high
- `overclock/lib/matches/play-invites.ts`
  - too large and behavior-heavy for opportunistic cleanup
- `overclock/lib/lfg/posts.ts`
  - too large and behavior-heavy for opportunistic cleanup
- `overclock/app/account/actions.ts`
  - large mutation surface; cleanup should be split by concern
- `overclock/components/navigation/global-notifications-menu-client.tsx`
  - architecture issue is real, but the fix crosses boundaries and should be handled deliberately

## Suggested First Cleanup Commit

Suggested first cleanup commit scope:

- remove `measureProfileStep()` and the `console.log(...)` timing output from `overclock/app/u/[username]/page.tsx`
- delete `overclock/lib/profiles/get-optional-current-user-id.ts` if the final reference check still shows no call sites
- optionally extract a shared `isSupabaseAuthCookie()` helper if that stays small and mechanical

Suggested commit message:

`Remove leftover profile debug timing and unused optional auth helper`

## Verification Commands After Cleanup

Run after each small cleanup change:

```bash
npm run typecheck
npm run verify
```

For route-level validation:

```bash
# signed out / incognito shape
open /u/emi

# signed in shape
open /u/emi while authenticated
```

For targeted reference checks before deleting helpers:

```bash
rg -n "getOptionalCurrentUserId\\(" overclock
rg -n "isSupabaseAuthCookie" overclock
rg -n "@/app/" overclock/components overclock/features overclock/lib
```
