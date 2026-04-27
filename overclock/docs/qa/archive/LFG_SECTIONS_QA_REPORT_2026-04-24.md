> Archived on 2026-04-27.
> Superseded by `docs/qa/LFG_SECTIONS_QA_REPORT.md`.
> This snapshot is retained only for historical context and contains outdated conclusions.

# LFG Sections QA Report

Date: 2026-04-24

Scope:
- `/duos`
- `/stacks`
- `/teams`
- `/scrims`
- Shared LFG flow under `app/lfg/*` and `lib/lfg/*`

Audit method:
- Static QA audit of route behavior, server actions, shared UI, validation, and data flow
- Lightweight verification via lint and code-path inspection
- This was not a full authenticated browser E2E session, so findings below are based on code-backed behavior review rather than live click-through with a seeded account

## Executive Summary

The section routing problem was already corrected before this audit, and the current code now routes create/list behavior by `lfg_type` correctly. The biggest remaining launch risks are around incomplete feature surfaces being presented as real features and a few setup/UX gaps in the create flow.

There is no real edit/delete flow for LFG posts, no implemented filters/search/sorting despite a visible Filters section, and no pagination/infinite scroll. Those are not hidden from a QA perspective because the current UI strongly suggests more functionality than actually exists.

## Functional Coverage Summary

### Supported
- Section-specific route load for Duos, Stacks, Teams, and Scrims
- Section-specific `lfg_type` create flow
- Section-specific post fetch via `getActiveLFGPosts(type)`
- Logged-out gating
- Onboarding gating
- Competitive role gating
- Required title validation
- Server-side validation of `lfg_type` and `posting_role`

### Not Supported / Missing
- Edit post
- Delete post
- Close/archive post from the LFG pages
- Filters
- Search
- Sorting
- Pagination / infinite scroll

## UX Concerns

### 1. The Filters bar creates a false expectation of interactivity
- This has been softened, but true filtering/search still does not exist yet.

### 2. The post creation path is split across profile setup concepts
- Competitive role setup lives under `/account/competitive`
- Platform/region/server data appears to come from the broader profile editor

### 3. No edit/delete support creates a dead-end after posting
- Manual post closing now exists for owners, but edit/delete still do not.

### 4. Logged-out and onboarding-gated users are handled clearly, but partially configured users are not
- The blocking rule is valid
- The remediation path is still too opaque

## Security Concerns

### 1. Good: server-side gating is present
- `app/lfg/actions.ts` validates `lfg_type`, `posting_role`, auth, onboarding, role existence, and required profile fields on the server.

### 2. Good: posting frequency protection is now present
- LFG post creation is now limited server-side to `2` posts per section per
  rolling `60` minutes.
- This limit is based on creation events, not whether the posts remain active.

### 3. Good: feed select only pulls public-facing profile fields
- `lib/lfg/posts.ts` fetches `username`, `display_name`, and `discord_avatar_url` only.
- No private profile fields appear exposed by the section feed query.

### 4. Good: no service role or private env usage was found in the LFG route flow
- The touched LFG flow uses the server-side Supabase client with publishable key + auth cookies, which is the expected pattern here.

## Data Integrity QA Notes

### Correct behavior confirmed by code
- Section feeds filter by exact `lfg_type`
  - `lib/lfg/posts.ts` uses `.eq("lfg_type", lfgType)`
- Post creation writes the provided section type
  - `lib/lfg/posts.ts` inserts `lfg_type: input.lfgType`
- User snapshot data is stored at create time
  - Rank, role, region, timezone, platform, and hero pool snapshot are written during create

### Remaining integrity risks
- No filtering/sorting features to validate record selection beyond basic section isolation

## Unsupported Test Areas

These were requested in the QA scope but are currently unsupported by the feature:
- Edit post
- Delete post
- Search
- Sorting
- Pagination / infinite scroll

Recommendation:
- Treat these as product gaps rather than hidden defects unless the product spec says they should already exist.

## Priority-Ranked Suggested Fixes

### P3
1. Consider whether hard delete is ever needed, or whether owner-only close is the permanent lifecycle control.

## Release Recommendation

Current recommendation: Core section behavior is in much better shape now, but these pages still need the remaining polish items before they feel fully launch-ready.

Reason:
- Core create/list functionality is present and section isolation appears correct.
- The biggest remaining risk is product completeness and edge-case UX, especially around self-managing posts after they are created.
