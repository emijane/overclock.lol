# Stacks Security Hardening

Last updated: 2026-05-24

## Scope

This pass hardens the shipped stack surfaces:

- `/stacks`
- `/stacks/create`
- `/stacks/[postId]`

It also covers shared dependencies that materially affect stack privacy and
authorization:

- block-helper RPCs and app helpers
- `get_lfg_feed_page_dto`
- stack detail contact/member reads
- stack action RPC trust boundaries

## Confirmed Hardening In This Pass

### Viewer-context enforcement

- `overclock/lib/pages/lfg-feed-page-dto.ts`
  now forwards `viewerProfileId` to `get_lfg_feed_page_dto` only when it matches
  the current authenticated profile.
- `overclock/lib/blocks/user-blocks.ts`
  now refuses app-level block checks unless the current signed-in profile is the
  viewer or one side of the pair being checked.
- `overclock/supabase/migrations/20260524110000_harden_block_helper_access.sql`
  redefines block-helper RPCs so unauthorized direct callers fail with
  `42501 forbidden` instead of silently receiving `false` or `[]`.

### Contact-info gating

- `getStackMemberContactInfoForViewer(...)`
  now proves active membership first and only then selects Discord and
  Battle.net contact fields for stack members.
- This keeps owner/member contact data out of the contact query path for
  unrelated viewers even if a future call-site regresses.

## Findings And Decisions

### Accepted public visibility

`stack_members` public read access remains an intentional product behavior for
now because shipped stack feed/detail UI already shows member identity and role
publicly.

Accepted public data:

- current stack member identity shown in feed/detail
- role and owner/member state used to render stack cards and detail pages

Restricted private data:

- Discord usernames
- Battle.net handles
- owner-only pending-request surfaces

If product direction changes and stack membership should become private, the app
will need a coordinated RLS + DTO change rather than a policy-only flip.

### Remaining audit posture

- Stack write RPCs still rely on SQL ownership/participant checks as the source
  of truth. That remains the correct model.
- `get_profile_active_stack_post_id(...)` is still treated as a self-service
  helper at the app layer. App code now only calls it for the current profile.
- Shared feed/search/profile SQL must continue to derive viewer identity from
  `auth.uid()` or reject mismatches.

## Verification Focus

Use the stack QA checklist plus these security-specific checks:

1. Guest `/stacks` returns no viewer bundle and no spoofable stack request
   state.
2. Authenticated `/stacks` only returns viewer bundle data for the current
   signed-in profile.
3. Guest and unrelated viewers never trigger stack member contact-data reads.
4. Block helper misuse with another profile ID fails closed in app code and in
   direct SQL/RPC calls.

## Related Docs

- `docs/security/SECURITY_BASELINE_AUDIT.md`
- `docs/BLOCK_SYSTEM.md`
- `docs/qa/STACKS_QA_CHECKLIST.md`
