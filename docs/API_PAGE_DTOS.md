# API Page DTOs

This repo is moving page-load data access toward bundled read models instead of
many small route-time queries.

## Goals

- keep GET paths read-only
- reduce repeated auth/profile/block lookups
- return one page-shaped payload per high-traffic surface
- push filtering, pagination, and relationship checks into SQL

## Current Bundle RPCs

- `get_profile_page_dto(text, uuid)`
  - powers `/u/[username]`
- `get_matches_page_dto(uuid)`
  - powers `/matches`
- `get_notifications_menu_dto(uuid)`
  - powers the global notifications menu
- `get_lfg_feed_page_dto(text, uuid, text, text, text, text, text, text[])`
  - powers LFG feed payload assembly for `/duos` and `/stacks`
- `get_account_posts_page_dto(uuid, text, integer, integer)`
  - powers `/account/posts`
- `search_public_profiles_dto(text, integer, uuid)`
  - powers player search reads

## Loader Pattern

1. Route reads auth once through `getCurrentProfile()`.
2. Route calls one page DTO loader from `overclock/lib/pages/*` when available.
3. The loader calls a single Supabase RPC.
4. The loader normalizes JSON into a typed DTO for the route UI.

## Write Pattern

- keep writes in RPCs or server actions with one main mutation entrypoint
- avoid read-before-write checks when the RPC already enforces the rule
- reserve extra read queries for user-facing data that the mutation truly
  cannot derive itself

## Notes

- Request-scoped auth/profile loading should remain read-only.
- Cleanup and expiry should happen in write flows or scheduled jobs, not page
  GET handlers.
- New high-traffic routes should prefer adding a bundle RPC over adding more
  route-time helper fan-out.
