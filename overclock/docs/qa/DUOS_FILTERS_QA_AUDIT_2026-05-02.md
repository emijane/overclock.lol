# Duos Filters QA Audit

Date: 2026-05-02

Scope:

- `/duos`
- `Mode`
- `Role`
- `Needs`
- `Min Rank`
- `Max Rank`
- `Region`
- selected filter pills
- `Clear All`

Method:

- source audit of the current implementation in:
  - `app/lfg/components/lfg-feed-filters-panel.tsx`
  - `app/lfg/section-page.tsx`
  - `lib/lfg/lfg-feed-filters.ts`
  - `lib/lfg/posts.ts`
- this is a code-based QA pass, not a recorded browser run

## Summary

The Duos filters are meaningfully more useful than the earlier first-pass
version. Mode, Role, Needs, Region, and the new Min/Max rank model are all
wired into the server-rendered feed query, and the selected-filter chips give
users a clear way to remove individual filters.

The original high-severity rank-range state sync issue has now been addressed:
reversed valid rank bounds are canonicalized so the URL, server query, chips,
and dropdowns can agree on one normalized range.

There are also a few UX clarity issues:

- `Clear All` still lives in the chip row, but now has lighter visual treatment
  than selected filter chips

## Filter: Mode

### Tests

1. Default state
   Expected:
   - dropdown placeholder reads `Mode`
   - no mode chip is shown
   - feed is not constrained by `game_mode`
   Actual:
   - matches current implementation

2. Single select
   Expected:
   - selecting `Ranked` sets `?mode=ranked`
   - dropdown label changes to `Competitive`
   - chip appears as `Mode: Competitive`
   - feed filters on `game_mode = ranked`
   Actual:
   - matches current implementation

3. Change selection
   Expected:
   - switching from `Ranked` to `Quick Play` updates the same query param
   - chip updates in place
   Actual:
   - matches current implementation

4. Reselect current value
   Expected:
   - either no-op or remain selected
   - no duplicated params
   Actual:
   - remains selected; no duplicate query param risk found

### Issues

- Low: selected label becomes `Competitive` / `Quick Play` with no `Mode`
  prefix in the dropdown trigger, so the trigger is only understandable by
  position.

### Recommendations

- Keep the chip label as-is.
- Consider using `Mode: Competitive` only in the chip row and leaving the
  trigger shorter if the row remains permanently visible while filters are
  active.

## Filter: Role

### Tests

1. Default state
   Expected:
   - trigger reads `Role`
   - no chip shown
   - no `posting_role` constraint
   Actual:
   - matches current implementation

2. Single select
   Expected:
   - selecting `Support` sets `?role=support`
   - chip appears as `Role: Support`
   - feed filters on `posting_role = support`
   Actual:
   - matches current implementation

3. Change selection
   Expected:
   - switching role updates `role` only
   - existing non-role filters persist
   Actual:
   - matches current implementation

4. Role + Needs same value
   Expected:
   - allowed
   - query becomes `role=support&looking_for=support`
   - feed returns only posts where poster is Support and also needs Support
   Actual:
   - allowed by current implementation
   - query logic supports this case

### Issues

- Resolved: selected trigger labels now retain context with phrasing such as
  `Role: Support`.

### Recommendations

- Keep the explicit selected-state wording.

## Filter: Needs

### Tests

1. Default state
   Expected:
   - trigger reads `Needs`
   - no chip shown
   - no `looking_for_roles` constraint
   Actual:
   - matches current implementation

2. Single select
   Expected:
   - selecting `DPS` sets `?looking_for=dps`
   - chip appears as `Needs: DPS`
   - feed filters on posts whose `looking_for_roles` contain `dps`
   Actual:
   - matches current implementation

3. Change selection
   Expected:
   - switching from `DPS` to `Tank` updates `looking_for` only
   Actual:
   - matches current implementation

4. Select `Any`
   Expected:
   - removes `looking_for`
   - chip disappears
   Actual:
   - matches current implementation

### Issues

- Resolved: selected trigger labels now retain context with phrasing such as
  `Needs: DPS`.

- Resolved: the dropdown reset label is now explicit instead of generic.

### Recommendations

- Keep the explicit selected-state wording and reset labels.

## Filter: Min Rank / Max Rank

### Tests

1. Default state
   Expected:
   - triggers read `Min Rank` and `Max Rank`
   - no rank chips shown
   - no rank filtering applied
   Actual:
   - matches current implementation

2. Single min rank
   Expected:
   - `?min_rank=gold`
   - chip `Min Rank: Gold`
   - results include `Gold` and above
   Actual:
   - matches current implementation

3. Single max rank
   Expected:
   - `?max_rank=diamond`
   - chip `Max Rank: Diamond`
   - results include `Diamond` and below
   Actual:
   - matches current implementation

4. Combined range
   Expected:
   - `?min_rank=gold&max_rank=diamond`
   - inclusive range: `Gold`, `Platinum`, `Diamond`
   - two chips shown
   Actual:
   - matches current implementation

5. Reversed range
   Expected:
   - if user creates `min_rank=diamond` and `max_rank=gold`, either:
     - the UI should automatically rewrite the URL to `min_rank=gold&max_rank=diamond`, or
     - the UI should refuse the invalid order
   Actual:
   - valid reversed bounds are now canonicalized into normalized order
   - URL, visible triggers, chips, and server query should now agree

6. Remove one rank chip from reversed range
   Expected:
   - removing one bound should leave the user with the remaining bound they can
     currently see in the UI
   Actual:
   - should now behave predictably because canonicalization happens before
     render

7. No results range
   Expected:
   - if bounds are very narrow and no post matches, user should clearly
     understand that the result is due to the rank filter
   Actual:
   - generic empty state only; no filter-aware explanation

### Issues

- Resolved: reversed Min Rank / Max Rank state sync bug.

- Resolved: rank filter semantics are now explicitly communicated in the UI.
  Current behavior:
  - unranked is not selectable as a bound
  - any active rank bound excludes unranked posts
  Clarified behavior:
  - active rank filters show copy explaining that matching is tier-only and that
    unranked posts are excluded

- Medium: current rank filtering only checks `snapshot_rank_tier`, not
  `snapshot_rank_division`.
  Expected:
  - if the UI suggests precise range filtering, users may assume finer-grained
    ordering inside a tier
  Actual:
  - all divisions within a tier are treated identically

### Recommendations

- Decide whether tier-only filtering is the intended product rule. If yes,
  document it clearly in the UI or docs.

## Filter: Region

### Tests

1. Default state
   Expected:
   - trigger reads `Region`
   - no chip shown
   - no region constraint
   Actual:
   - matches current implementation

2. Single select
   Expected:
   - selecting `Americas` sets `?region=Americas`
   - chip appears as `Region: Americas`
   - feed filters on `snapshot_region = Americas`
   Actual:
   - matches current implementation

3. Change selection
   Expected:
   - switching region updates only `region`
   Actual:
   - matches current implementation

4. No results
   Expected:
   - filtered empty state should communicate that no posts match the selected
     region
   Actual:
   - filter-aware empty-state copy now distinguishes zero matches from a
     generally empty section

### Issues

- Low: empty states are not filter-aware, so region misses look identical to a
  generally empty section.

### Recommendations

- Keep the filter-aware empty-state copy concise and actionable.

## Filter Pills

### Tests

1. No filters selected
   Expected:
   - no chip row
   Actual:
   - matches current implementation

2. Single filter selected
   Expected:
   - chip appears with `Label: Value`
   - `x` clears only that filter
   Actual:
   - matches current implementation

3. Multiple filters selected
   Expected:
   - one chip per active filter
   - order should be stable and understandable
   Actual:
   - order is stable: Mode, Role, Needs, Min Rank, Max Rank, Region

4. Remove chip
   Expected:
   - only that query param is removed
   - all remaining filters persist
   Actual:
   - matches current implementation

5. Dropdowns to pills sync
   Expected:
   - changing a dropdown updates the corresponding chip
   - removing a chip updates the corresponding dropdown back to placeholder
   Actual:
   - matches current implementation

### Issues

- Medium: chip row is the clearest expression of active filter meaning, but it
  only appears after selection. Before that, dropdown meaning depends on terse
  placeholders.

- Low: chips and triggers use different wording density.
  Example:
  - trigger: `Role: Support`
  - chip: `Role: Support`
  This is not wrong, but it does create two different levels of clarity.

### Recommendations

- Keep chip labels explicit.
- Consider whether triggers should retain more context once selected.

## Clear All

### Tests

1. No active filters
   Expected:
   - `Clear All` should be hidden
   Actual:
   - matches current implementation

2. Active filters present
   Expected:
   - `Clear All` appears to the right of the chips
   - clears only filter params
   - preserves unrelated query params like `message` and `type`
   Actual:
   - matches current implementation

3. Clear after chip removal
   Expected:
   - remaining filters clear correctly
   Actual:
   - matches current implementation

### Issues

- Partially resolved: `Clear All` now has a dashed border and softer treatment,
  which helps distinguish it from selected state chips while keeping it aligned
  with the row.

### Recommendations

- Keep current placement and lighter action styling.
- Reevaluate only if user testing still shows confusion.

## State Sync Audit

### Dropdowns -> URL

Expected:

- each dropdown selection should update exactly one query param
- invalid params should not become selected UI state

Actual:

- generally works
- invalid values are ignored by `parseLFGFeedFilters`
- valid rank bounds are normalized into canonical URL order

### URL -> Server Query

Expected:

- query string should be the authoritative state for server-rendered filtering

Actual:

- mostly true
- rank bounds are normalized server-side before querying

### URL -> Visible UI

Expected:

- visible dropdown state and visible chips should reflect the same meaning as
  the URL

Actual:

- true for the current filter set, including canonicalized rank bounds

## Edge Cases

1. `Role = Needs`
   Expected:
   - allowed and correctly filtered
   Actual:
   - supported

2. `Any`
   Expected:
   - selecting `Any` removes only that filter
   Actual:
   - supported

3. No results
   Expected:
   - active filters should be clearly visible
   - empty state should help users understand zero matches
   Actual:
   - chips help
   - empty state is now filter-aware

4. Invalid query param values
   Expected:
   - ignored safely
   Actual:
   - supported by parser guards

5. Reversed min/max rank bounds
   Expected:
   - normalized everywhere or blocked
   Actual:
   - valid bounds are now normalized in both parsed server state and the URL

## UX Issues

1. Medium: `Role` and `Needs` are clearer as placeholders than as selected
   triggers.
   Status:
   - mostly resolved by explicit selected-state labels

2. Medium: `Min Rank` / `Max Rank` suggests precise range control, but the
   implementation is tier-only, not division-aware.

3. Resolved: reversed rank bounds no longer need to produce a visible state
   that disagrees with the shareable URL.

4. Resolved: dropdown reset labels are now explicit instead of generic.

5. Low: `Clear All` looks like a state chip rather than a bulk action chip.

## Bugs

### Medium

1. Rank range semantics are stronger than the actual precision
   Expected:
   - users should understand whether rank filtering is tier-only or
     division-aware
   Actual:
   - UI now explains tier-only behavior, but the filtering still does not
     account for divisions within a tier
   Recommendation:
   - clarify tier-only behavior or extend the system later if finer precision is
     needed

### Low

2. `Clear All` resembles a normal selected chip
   Expected:
   - bulk action should be obviously distinct enough from selected filters
   Actual:
   - improved, but still intentionally colocated with the selected chips
   Recommendation:
   - monitor whether the current dashed action styling is sufficient in testing

## Final Recommendation

The Duos filter system is close to solid, but it should not be treated as fully
settled until the remaining UX gaps are addressed.

Priority order:

1. Decide whether tier-only rank filtering is the final intended product rule
2. Reevaluate `Clear All` styling only if testing still shows confusion
