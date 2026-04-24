# Duos Filters

This note captures the recommended first-pass filter design for:

```text
/duos
```

It exists so the Duos filter work has a clear scope before implementation
begins.

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

Duos is the best LFG section to filter first because the decision-making is
usually simple:

- What role are they playing?
- Are they around my rank?
- Are they in my region?

That makes Duos a good place to validate the filter model before applying it to:

- `/stacks`
- `/teams`
- `/scrims`

## Recommended First Filters

The first version should support only the highest-value filters:

- `Role`
- `Rank`
- `Region`

These are enough to improve discovery meaningfully without overcomplicating the
interface.

## Filter Details

### Role

Options:

- `All Roles`
- `Tank`
- `DPS`
- `Support`

Why this should be first:

- It is the fastest way to remove irrelevant posts
- It maps directly to the post’s `posting_role`
- It is already core to the LFG identity model

### Rank

Recommended first-pass options:

- `Any Rank`
- `Bronze-Silver`
- `Gold-Plat`
- `Diamond-Master`
- `GM-Champion`

Why grouped brackets are better than every individual division at first:

- Faster to scan
- Less visual clutter
- More aligned with how players broadly search in LFG

Future versions could support:

- exact tier filtering
- "around my rank"
- one-tier-above / one-tier-below logic

But that should not be part of the first release.

### Region

Options should be based on the app’s existing region values.

Recommended pattern:

- `Any Region`
- `NA`
- `EU`
- `Asia`

Why it matters:

- Queue quality
- ping
- likely schedule overlap

## Filters Not Recommended For First Version

These should stay out of the first Duos filter release:

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
- Some of them rely on profile data that may not be consistently helpful for
  fast Duos matching

## Sorting

The first version should keep sorting simple:

```text
Newest first
```

No user-facing sort controls are needed initially.

Reason:

- freshness matters most in LFG
- more sort options will dilute the value of the first filter release

## UX Recommendation

The filter bar should stay compact and readable.

Recommended layout:

```text
Browse Feed
[Role dropdown] [Rank dropdown] [Region dropdown]
```

Or:

```text
Filter Duos
[Role] [Rank] [Region]
```

The important thing is that the controls clearly read as real filters, not
placeholder copy.

## Query Model

The filters should be handled on the server where possible.

Recommended request shape:

- URL query params on `/duos`
- server-rendered filtering based on those params

Example:

```text
/duos?role=support&rank=diamond-master&region=na
```

Why URL-based filters are better here:

- shareable
- refresh-safe
- SSR-friendly
- easier to reason about than hidden client-only state

## Data Requirements

The current Duos posts already expose the main fields needed for these filters:

- `posting_role`
- `snapshot_rank_tier`
- `snapshot_rank_division`
- `snapshot_region`

That means the first Duos filter release should not require a major data model
change.

## Recommended Rank Mapping

For the grouped filter, map tiers like this:

```text
Bronze-Silver
  Bronze, Silver

Gold-Plat
  Gold, Platinum

Diamond-Master
  Diamond, Master

GM-Champion
  Grandmaster, Champion
```

`Unranked` should usually fall under:

```text
Any Rank only
```

unless product rules later decide otherwise.

## Empty States

Filtered empty states should be explicit.

Examples:

- `No duos match these filters.`
- `Try clearing one or more filters to broaden the feed.`

This matters because a filtered empty state is different from:

- no Duos posts existing at all

## Non-Goals For First Version

The first Duos filter release should not include:

- search
- section-wide filters reused everywhere
- advanced sort controls
- personalized "best match" ranking
- exact division-level matching
- section filters beyond Duos

## Baby-Step Implementation Order

### Step 1

Create a small Duos filter spec and lock the first-pass filter set.

### Step 2

Add URL query parsing for Duos filter params.

### Step 3

Add server-side filtering in the Duos feed query.

### Step 4

Replace the current Duos feed helper copy with real filter controls.

### Step 5

Add filtered empty-state messaging.

### Step 6

Polish the mobile layout and reset/clear behavior.

## Recommendation

The best first Duos filter release is:

```text
Role + Rank + Region
Newest first
URL-based
Server-rendered
```

That is enough to make the page genuinely more useful without turning the Duos
feed into an overbuilt search UI.
