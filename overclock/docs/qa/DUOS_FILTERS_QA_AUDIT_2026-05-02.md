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

The largest issue found is a state-sync bug in the Min Rank / Max Rank flow.
If the user creates reversed bounds such as `min_rank=diamond` and
`max_rank=gold`, the server normalizes the results to `Gold -> Diamond`, but
the URL is left reversed. That means the visible dropdown state and chips can
disagree with the raw query string. This is a real correctness and shareability
problem.

There are also a few UX clarity issues:

- `Role` and `Needs` lose their labels after selection and rely on position
- `Any` is overly generic inside some dropdown menus
- rank-range expectations around `Unranked` are not obvious

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

- Medium: when selected, the trigger becomes just `Support`, `Tank`, or `DPS`.
  Next to `Needs`, this can still be misread quickly, especially on mobile or
  once the row wraps.

### Recommendations

- Consider preserving context in the trigger when selected, for example:
  - `Role: Support`
  - `Needs: DPS`
- If that feels too long, use small inline labels above or inside the trigger.

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

- Medium: same trigger-label clarity problem as `Role`. Once selected, `Needs`
  becomes just `DPS` / `Tank` / `Support`, which is understandable only if the
  user remembers the left-to-right order.

- Low: the dropdown menu item `Any` is generic and depends entirely on the open
  menu context. It is usable, but weaker than `Any Needs`.

### Recommendations

- Prefer `Any Needs` in the menu list.
- Consider keeping `Needs` visible in the trigger after selection.

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
   - server-side parsing normalizes the bounds for filtering
   - visible triggers and chips show normalized values
   - raw URL is left reversed
   - this creates a source-of-truth mismatch between query string and visible state

6. Remove one rank chip from reversed range
   Expected:
   - removing one bound should leave the user with the remaining bound they can
     currently see in the UI
   Actual:
   - because chip removal operates on the raw URL params, the remaining bound
     can be surprising when the URL was reversed first

7. No results range
   Expected:
   - if bounds are very narrow and no post matches, user should clearly
     understand that the result is due to the rank filter
   Actual:
   - generic empty state only; no filter-aware explanation

### Issues

- High: reversed Min Rank / Max Rank state sync bug.
  Expected vs actual mismatch:
  - expected: URL, dropdowns, chips, and query behavior all reflect the same
    normalized rank range
  - actual: query behavior and visible UI normalize, but the URL remains
    reversed
  Impact:
  - shared URLs are misleading
  - debugging is harder
  - chip removal and further edits become unintuitive

- Medium: `Unranked` behavior is not obvious.
  Current behavior:
  - unranked is not selectable as a bound
  - any active rank bound excludes unranked posts
  User confusion risk:
  - users may expect `Max Rank: Bronze` to include unranked

- Medium: current rank filtering only checks `snapshot_rank_tier`, not
  `snapshot_rank_division`.
  Expected:
  - if the UI suggests precise range filtering, users may assume finer-grained
    ordering inside a tier
  Actual:
  - all divisions within a tier are treated identically

### Recommendations

- Rewrite the URL when rank bounds are normalized so the query string always
  matches the visible state.
- Add explicit product copy for how unranked is handled, or surface `Unranked`
  as an explicit option if that matters.
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
   - generic empty state only

### Issues

- Low: empty states are not filter-aware, so region misses look identical to a
  generally empty section.

### Recommendations

- Add filter-aware empty-state copy when one or more filters are active.

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
   - matches current implementation in normal cases
   - broken for reversed rank bounds because the visible chips can represent a
     normalized range while the URL remains reversed

### Issues

- Medium: chip row is the clearest expression of active filter meaning, but it
  only appears after selection. Before that, dropdown meaning depends on terse
  placeholders.

- Low: chips and triggers use different wording density.
  Example:
  - trigger: `Support`
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

- Low: `Clear All` visually resembles a removable chip, which is consistent,
  but it is also a bulk action rather than a filter state. Some users may read
  it as another selected filter at a glance.

### Recommendations

- Keep current placement.
- Consider subtle styling differentiation later if users confuse it with a real
  filter chip.

## State Sync Audit

### Dropdowns -> URL

Expected:

- each dropdown selection should update exactly one query param
- invalid params should not become selected UI state

Actual:

- generally works
- invalid values are ignored by `parseLFGFeedFilters`
- rank bounds are the exception because reversed values remain in the URL even
  after the UI normalizes them

### URL -> Server Query

Expected:

- query string should be the authoritative state for server-rendered filtering

Actual:

- mostly true
- rank bounds are functionally normalized server-side before querying

### URL -> Visible UI

Expected:

- visible dropdown state and visible chips should reflect the same meaning as
  the URL

Actual:

- true for Mode, Role, Needs, Region
- not fully true for reversed Min Rank / Max Rank URLs

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
   - empty state itself is not filter-aware

4. Invalid query param values
   Expected:
   - ignored safely
   Actual:
   - supported by parser guards

5. Reversed min/max rank bounds
   Expected:
   - normalized everywhere or blocked
   Actual:
   - normalized only in parsed server state, not in the URL

## UX Issues

1. Medium: `Role` and `Needs` are clearer as placeholders than as selected
   triggers. Once selected, they become bare values and lose context.

2. Medium: `Min Rank` / `Max Rank` suggests precise range control, but the
   implementation is tier-only, not division-aware.

3. Medium: reversed rank bounds can produce a visible state that disagrees with
   the shareable URL.

4. Low: some dropdown `Any` labels are too generic inside the menu list.

5. Low: no filter-aware empty state means users may not realize a zero-result
   feed is caused by their current selections.

6. Low: `Clear All` looks like a state chip rather than a bulk action chip.

## Bugs

### High

1. Reversed Min Rank / Max Rank state sync bug
   Expected:
   - URL, chips, dropdowns, and query behavior all agree
   Actual:
   - query behavior and visible state are normalized, but URL params can remain
     reversed
   Recommendation:
   - canonicalize the URL after normalization or prevent invalid bound order in
     the first place

### Medium

2. Selected `Role` / `Needs` triggers lose context
   Expected:
   - a selected trigger should remain self-explanatory
   Actual:
   - selected values are bare role names and depend on position for meaning
   Recommendation:
   - keep context in trigger labels or add persistent inline labels

3. Rank range semantics are stronger than the actual precision
   Expected:
   - users should understand whether rank filtering is tier-only or
     division-aware
   Actual:
   - UI suggests a more exact range than the underlying filter really supports
   Recommendation:
   - clarify tier-only behavior or extend the system later if finer precision is
     needed

4. Empty states do not explain filter-caused zero results
   Expected:
   - filtered empty states should acknowledge active filters
   Actual:
   - same empty state as a naturally empty section
   Recommendation:
   - add filter-aware empty-state messaging

### Low

5. Generic `Any` menu labels reduce clarity
   Expected:
   - labels should be understandable even inside the open menu
   Actual:
   - several menus use plain `Any`
   Recommendation:
   - use `Any Role`, `Any Needs`, `Any Min Rank`, `Any Max Rank`

6. `Clear All` resembles a normal selected chip
   Expected:
   - bulk action should be obviously distinct enough from selected filters
   Actual:
   - visually close to regular state chips
   Recommendation:
   - consider slightly different styling if this becomes confusing in testing

## Final Recommendation

The Duos filter system is close to solid, but it should not be treated as fully
settled until the rank-range state sync bug is fixed.

Priority order:

1. Fix reversed Min Rank / Max Rank URL normalization
2. Improve selected-state clarity for `Role` and `Needs`
3. Add filter-aware empty-state messaging
4. Tighten `Any` label clarity
