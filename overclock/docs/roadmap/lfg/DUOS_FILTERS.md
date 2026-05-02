# Duos Filters

This note captures the current first-pass filter design for:

```text
/duos
```

It exists so the shipped behavior and follow-up work stay clear.

## Goals

The Duos page should help players quickly narrow the feed to relevant partners
without turning the page into a complex search screen.

The product goals are:

- Make it easier to find a duo partner fast
- Keep the Duos experience lightweight
- Avoid cluttering the page with low-signal filters
- Reuse existing post snapshot data where possible
- Keep the first version understandable for everyday players

## Why Start With Duos

Duos was the best LFG section to filter first because the decision-making is
usually simple:

- What mode are they queueing?
- What role are they playing?
- Are they around my rank?
- Are they in my region?

That made Duos a good place to validate the filter model before applying it to:

- `/stacks`
- `/teams`
- `/scrims`

The same first-pass filter model is now also used on `/stacks`.

## Current Filters

The current implementation supports these filters:

- `Mode`
- `Role`
- `Needs`
- `Min Rank`
- `Max Rank`
- `Region`

These are enough to improve discovery meaningfully without turning the feed into
an overbuilt search UI.

## Filter Details

### Mode

Options:

- `Any Mode`
- `Ranked`
- `Quick Play`

Why it shipped in the first pass:

- the feed already stores `game_mode`
- it is a high-signal distinction for duo searching
- it reuses existing LFG posting data cleanly

### Role

Options:

- `Any`
- `Tank`
- `DPS`
- `Support`

Why this shipped in the first pass:

- it is the fastest way to remove irrelevant posts
- it maps directly to the post's `posting_role`
- it is already core to the LFG identity model

### Needs

Options:

- `Any`
- `Tank`
- `DPS`
- `Support`

Why this shipped in the current first pass:

- it lets users browse by the teammate role a post is trying to fill
- it maps directly to the post's `looking_for_roles`
- it works cleanly alongside `Role` without collapsing identity and target into
  one filter

### Min Rank / Max Rank

Options:

- `Any`
- `Bronze`
- `Silver`
- `Gold`
- `Platinum`
- `Diamond`
- `Master`
- `Grandmaster`
- `Champion`

Why this shipped:

- it gives users tighter control than grouped brackets
- it supports an inclusive rank window without adding a complex custom range UI
- it reads naturally for common use cases like `Gold` through `Diamond`

Current behavior:

- `Min Rank` includes posts at or above the selected tier
- `Max Rank` includes posts at or below the selected tier
- using both creates an inclusive range
- if the URL contains reversed bounds, the server normalizes them

### Region

Options are based on the app's existing region values.

Current pattern:

- `Any Region`
- `NA`
- `EU`
- `Asia`

Why it matters:

- Queue quality
- Ping
- Likely schedule overlap

## Filters Not Recommended For This Version

These still stay out of the current filter release:

- hero pool
- platform, unless cross-platform rules make it essential
- timezone
- playstyle
- microphone / comms
- free-text search
- advanced sorting controls

Why:

- They add complexity quickly
- They are lower-signal for the first pass
- Some rely on profile data that may not be consistently helpful for fast Duos
  matching

## Sorting

The current release keeps sorting simple:

```text
Newest first
```

No user-facing sort controls are included yet.

Reason:

- freshness matters most in LFG
- more sort options would dilute the value of the first filter release

## UX Recommendation

The filter bar should stay compact and readable.

Current layout:

```text
Browse Feed
[Mode dropdown] [Role dropdown] [Needs dropdown] [Min Rank dropdown] [Max Rank dropdown] [Region dropdown]
```

The important thing is that the controls clearly read as real filters, not
placeholder copy.

## Query Model

The filters are handled on the server.

Current request shape:

- URL query params on `/duos`
- server-rendered filtering based on those params

Example:

```text
/duos?mode=ranked&role=support&looking_for=dps&min_rank=gold&max_rank=diamond&region=Americas
```

Why URL-based filters are a good fit here:

- shareable
- refresh-safe
- SSR-friendly
- easier to reason about than hidden client-only state

## Data Requirements

The current Duos posts already expose the main fields needed for these filters:

- `game_mode`
- `posting_role`
- `looking_for_roles`
- `snapshot_rank_tier`
- `snapshot_rank_division`
- `snapshot_region`

That means the current Duos filter release did not require a major data model
change.

## Rank Range Rules

The current rank filters use exact tiers for the bounds:

```text
Bronze
Silver
Gold
Platinum
Diamond
Master
Grandmaster
Champion
```

`Unranked` is not exposed as a min/max bound option.

In the current release:

- no min/max rank filter means unranked posts can still appear
- any active min/max rank filter only matches ranked tiers within the selected range

## Empty States

Filtered empty states are not yet specialized.

Current behavior:

- the feed falls back to the section's normal empty-state copy
- clearing filters is available from the filter bar

Useful follow-up:

- add filter-aware empty-state messaging so filtered zero states read differently
  from an empty section with no posts at all

## Non-Goals For This Version

The current filter release still does not include:

- search
- section-wide filters reused everywhere
- advanced sort controls
- personalized "best match" ranking
- exact division-level matching
- filters on routes that have not adopted the current model yet

## Current Implementation Status

The current filter release already includes:

- URL query parsing
- server-side filtering
- shared dropdown controls in the feed header
- clear-filter behavior
- reuse on both `/duos` and `/stacks`

Follow-up work that still makes sense:

- add filter-aware empty-state messaging
- polish mobile spacing and readability further as the filter bar evolves

## Recommendation

The current first-pass Duos filter release is:

```text
Mode + Role + Needs + Min Rank + Max Rank + Region
Newest first
URL-based
Server-rendered
```

That is enough to make the page genuinely more useful without turning the Duos
feed into an overbuilt search UI.
