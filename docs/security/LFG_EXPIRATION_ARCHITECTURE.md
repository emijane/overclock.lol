# LFG Expiration Architecture

This note documents the safe execution model for LFG expiration and cleanup.

## Goals

- Keep global expiration and hard cleanup off public user-callable RPCs.
- Make feed and action correctness depend on `expires_at`, not on opportunistic cleanup.
- Restrict global mutation entrypoints to trusted service-role execution.

## Canonical RPCs

- `public.expire_lfg_posts()`
  - purpose: mark expired LFG posts as `expired` and clean up stack-only dependent rows
  - access: `service_role` only
  - caller: scheduled/trusted server-side jobs

- `public.cleanup_expired_lfg_posts()`
  - purpose: hard-delete expired/closed posts after retention windows and dependency checks
  - access: `service_role` only
  - caller: scheduled/trusted server-side jobs

- `public.expire_stack_posts()`
  - purpose: legacy compatibility wrapper around expiration logic
  - access: no `anon`, `authenticated`, or `service_role` execute grants
  - caller: none externally; it must not be used as a public cleanup entrypoint

## User-requested behavior

User-triggered RPCs must not run global cleanup as a side effect.

Instead, stack/LFG action RPCs treat a post as inactive when:

- `status` is no longer actionable, or
- `expires_at <= now()`

That means:

- feeds stay correct through `expires_at` filters and RLS
- direct actions reject expired posts without mutating unrelated rows
- global expiration timing is owned by scheduled service work

## Current rule

If a request needs expiration awareness:

1. read `expires_at`
2. reject expired rows locally
3. do not trigger global cleanup from the user path

## Operational expectation

Production should run trusted scheduled jobs that:

1. call `public.expire_lfg_posts()` to transition live rows into `expired`
2. call `public.cleanup_expired_lfg_posts()` to purge retained expired/closed rows later

This separation keeps public traffic from executing broad mutation RPCs while preserving the existing user-visible feed and action behavior.
