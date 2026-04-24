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

The section routing problem was already corrected before this audit, and the current code now routes create/list behavior by `lfg_type` correctly. The biggest remaining launch risks are around incomplete feature surfaces being presented as real features, weak UX around loading states, and a few setup/accessibility gaps in the create flow.

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

## Medium Issues

### 1. Filters, sorting, and search are not implemented but the UI implies they are
Severity: Medium

Why this matters:
- QA expectation and product expectation diverge from the actual feature.
- The Stacks page explicitly promises filtering in its copy.

Evidence:
- `app/lfg/components/lfg-page-shell.tsx`
  - Renders a Filters area that is informational only.
- `app/stacks/page.tsx`
  - `filtersDescription: "Filter by rank, role, region, and playstyle."`
- No filter/search/sort controls or query handling exist in `app/lfg/*`.

Impact:
- Product confusion
- False affordance
- Launch reviewers will likely mark this as incomplete

Recommended fix:
- Either implement real filters/search/sort or change the copy to make it clear these are not live yet.

### 2. No loading state for page data
Severity: Medium

Why this matters:
- Slow network behavior will feel broken.
- Users get no feedback that feed data is loading.

Evidence:
- `app/lfg/components/lfg-page-shell.tsx`
  - No skeleton/loading branch for feed.

Impact:
- Unclear perceived performance
- Poor resilience under latency

Recommended fix:
- Add loading/skeleton UI for feed fetch.

### 3. Empty configured-role state can show two separate gating messages in the same create area
Severity: Medium

Why this matters:
- If the user has no configured role, the page still renders the role picker plus an additional generic “Competitive profile required” notice below it.
- That creates redundant guidance and extra friction.

Evidence:
- `app/lfg/components/lfg-page-shell.tsx`
  - Shows `LFGRolePicker`
  - Also shows `LFGActionNotice` when `!hasConfiguredRole`
- `app/lfg/components/lfg-role-picker.tsx`
  - Already shows role-specific setup messaging once a non-configured role is selected

Impact:
- Cluttered create flow
- Repeated messaging

Recommended fix:
- Collapse the no-role-configured state into one clear CTA.

### 4. Title field is required but has no visible label
Severity: Medium

Why this matters:
- Placeholder text is not a substitute for a label.
- Screen reader and accessibility quality are weaker than they should be.

Evidence:
- `app/lfg/components/post-title-field.tsx`
  - Text input has no `<label>` and no `aria-label`

Impact:
- Accessibility gap
- Harder keyboard/screen-reader usability

Recommended fix:
- Add a visible or screen-reader-only label for the title field.

### 5. Post creation gating depends on profile platform/region/timezone, but the UI does not explain all three requirements before submit
Severity: Medium

Why this matters:
- The UI mostly emphasizes competitive role setup.
- The server also blocks posting if platform, region, or server are missing.

Evidence:
- `app/lfg/actions.ts`
  - `getRequiredProfileError()` blocks if platform, region, or timezone are missing
- `app/lfg/components/lfg-page-shell.tsx`
  - Main setup CTA points only to `/account/competitive`

Impact:
- User can reach a valid role selection state and still be rejected on submit
- Confusing path to resolution

Recommended fix:
- Surface these profile requirements directly in the create flow before submit.

## Minor Issues

### 1. No explicit mobile wrapping safeguard in the bottom create CTA row
Severity: Minor

Why this matters:
- The “Posting as …” summary and button share a single horizontal row.
- On narrower widths or longer localized copy, this may compress awkwardly.

Evidence:
- `app/lfg/components/lfg-role-picker.tsx`
  - Bottom CTA row uses `justify-between` without explicit wrap behavior

Recommended fix:
- Add responsive wrapping or stacked mobile layout for that row.

### 2. Feed error state is generic and not actionable
Severity: Minor

Why this matters:
- Users only see “Try refreshing in a moment.”
- No retry button, no differentiation between auth/data/network failure.

Evidence:
- `app/lfg/components/lfg-page-shell.tsx`
  - Feed fetch failure is collapsed into a generic placeholder message

Recommended fix:
- Add an explicit retry action or more specific messaging where practical.

### 3. No timestamp shown on main section cards
Severity: Minor

Why this matters:
- Freshness matters in LFG listings.
- Profile sidebar cards show age, but main section cards do not.

Evidence:
- `app/lfg/components/lfg-post-list.tsx`
  - Does not render `createdAt`

Recommended fix:
- Consider surfacing created time to help users judge stale posts.

## UX Concerns

### 1. The Filters bar creates a false expectation of interactivity
- It reads like a live control surface but contains no controls.

### 2. Missing submit/loading feedback increases perceived instability
- Feed loading still has no real skeleton or progressive state.

### 3. The post creation path is split across profile setup concepts
- Competitive role setup lives under `/account/competitive`
- Platform/region/server data appears to come from the broader profile editor
- The page does not clearly explain the full checklist needed before posting

### 4. No edit/delete support creates a dead-end after posting
- If a user makes a typo or changes plans, the LFG pages do not offer recovery

### 5. Logged-out and onboarding-gated users are handled clearly, but partially configured users are not
- The blocking rule is valid
- The remediation path is still too opaque

## Security Concerns

### 1. Good: server-side gating is present
- `app/lfg/actions.ts` validates `lfg_type`, `posting_role`, auth, onboarding, role existence, and required profile fields on the server.

### 2. Remaining concern: no anti-spam or posting-frequency protection
Severity: Medium

- This is not a secret leak issue, but it is still a practical abuse vector.
- A logged-in user can still likely create many different posts rapidly.

Recommended fix:
- Add rate limiting, dedupe logic, or an active-post-per-type policy if that matches product rules.

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

### P1
1. Add real loading and submit states.
2. Make profile setup requirements explicit before submit, not only after server rejection.
3. Add accessible labeling to the title input.

### P2
1. Either implement filters/search/sort or remove the misleading filter affordance/copy.
2. Improve the partial-profile setup path so users know whether to go to competitive settings or profile editing.
3. Add a more actionable feed error state.

### P3
1. Add created-time metadata to main listing cards.
2. Review mobile layout resilience of the bottom create CTA row.
3. Consider future edit/delete/close-post controls if the product expects posts to be self-managed.

## Release Recommendation

Current recommendation: Do not treat these pages as fully launch-ready for a polished pre-launch release without at least the P0 and P1 items above.

Reason:
- Core create/list functionality is present and section isolation appears correct.
- The biggest remaining risk is operational and UX quality: duplicate posts, stale data, and UI affordances that promise more than the feature actually delivers.
