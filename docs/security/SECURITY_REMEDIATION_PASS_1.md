# Security Remediation Pass 1

Last updated: 2026-05-14

## Scope

This pass fixes only the confirmed baseline vulnerabilities from
[SECURITY_BASELINE_AUDIT.md](/c:/Users/misa/Documents/GitHub/overclock.lol/docs/security/SECURITY_BASELINE_AUDIT.md:1):

1. spoofable viewer context in `get_lfg_feed_page_dto`
2. spoofable viewer context in `get_profile_page_dto`
3. spoofable viewer context in `search_public_profiles_dto`
4. arbitrary block-graph inspection via block helper RPCs
5. overly broad `anon` execute on `expire_stack_posts`
6. overly broad `anon` execute on `update_last_seen`

## Changes

Migration added:

- [20260514040000_secure_viewer_context_and_block_helpers.sql](/c:/Users/misa/Documents/GitHub/overclock.lol/overclock/supabase/migrations/20260514040000_secure_viewer_context_and_block_helpers.sql:1)

### Viewer-context RPC hardening

`get_lfg_feed_page_dto`
- anonymous callers now always resolve to `null` viewer context
- caller-supplied `p_viewer_profile_id` is ignored for guests
- guest requests do not build `viewerBundle`
- guest requests do not evaluate authenticated relationship state
- authenticated callers now get `forbidden` on mismatched `p_viewer_profile_id`

`get_profile_page_dto`
- anonymous callers must use `null` viewer context
- authenticated callers may only use their own profile context
- mismatched viewer-profile input now fails before DTO assembly
- DTO shape for valid callers is unchanged

`search_public_profiles_dto`
- anonymous callers always search with `null` viewer context
- authenticated callers may only search with their own viewer context
- mismatched viewer-profile input now fails instead of applying another user’s block filter

### Block helper hardening

Updated helper RPCs:

- `is_profile_blocked_by`
- `has_either_user_blocked`
- `are_profiles_blocked`
- `get_blocked_profile_ids_for_viewer`

New behavior:

- all require a non-null `auth.uid()`
- callers may only query relationships that involve themselves
- arbitrary third-party block graph inspection now returns denied results instead of leaking data

### Grant tightening

Removed anonymous execute from:

- `expire_stack_posts()`
- `update_last_seen()`

Both remain executable for authenticated callers.

## Behavior Preserved

- DTO output shapes for valid callers are unchanged
- guest `/duos` and `/stacks` still load without viewer bundle data
- authenticated `/duos` and `/stacks` still get viewer bundle data for the signed-in user
- guest and authenticated profile pages still preserve block/privacy semantics
- authenticated block system, notifications, and matches flows still use the same RPC names and response shapes

## QA Targets

- guest `/duos` load
- authenticated `/duos` load
- guest `/stacks` load
- authenticated `/stacks` load
- guest `/u/[username]` profile load
- authenticated `/u/[username]` profile load
- guest player search
- authenticated player search
- block/unblock flow still works
- notifications menu still works
- matches page still works
- `npm run lint`
- `npm run typecheck`

## Notes

This pass does not attempt to solve the separate “missing schema bootstrap truth”
problem from the baseline audit. It only closes the confirmed live vulnerabilities
that were directly fixable through additive migrations.
