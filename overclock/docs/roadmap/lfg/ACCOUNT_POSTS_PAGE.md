# Account Posts Page

This note captures the current owner-only post management page at:

```text
/account/posts
```

It exists so the shipped behavior and the remaining follow-up work stay clear.

## Goals

The page should give users one private place to review and manage the posts they
have already created without overloading the public profile or the public LFG
feeds.

The product goals are:

- Let users see their current active posts in one place.
- Let users close active posts if they no longer need them.
- Let users understand what happened to older posts.
- Reuse the current LFG card language instead of inventing a second post UI.
- Keep the first version simple and readable.

## Why This Page Exists

The public profile should stay focused on presentation.

The section feeds should stay focused on discovery.

Post management is different from both of those jobs, so it should live in a
private owner-only route instead of being spread across:

- `/u/[username]`
- `/duos`
- `/stacks`
- `/teams`
- `/scrims`

Recommended route:

```text
/account/posts
```

This keeps permissions simple and makes it obvious that the page is for account
management, not public viewing.

## Page Shape

The first version should be a single-column forum-style feed with multiple rows.

The cards should look and feel like the cards already used on the public LFG
pages, with only small additions for status and owner controls.

Recommended structure:

```text
My Posts
[status filter] [optional section filter later]

Post card
Post card
Post card
```

This should read as a feed/list, not as a dense dashboard grid.

## Card Design

Reuse the existing LFG card presentation wherever possible.

The account page cards should preserve:

- Title
- Author snapshot context where it still helps
- Role
- Rank
- Region / server
- Hero pool
- Created time

Additional owner-only details:

- A status pill
- Owner actions for active posts

## Status Model

The account page should distinguish between:

- `Active`
- `Closed`
- `Expired`

### Active

- Post is still live
- Post appears in public section feeds
- Post appears in public active listing surfaces
- Owner can close it

### Closed

- Post was manually closed by the owner
- Post is no longer live
- Post is visible only on `/account/posts`

### Expired

- Post aged out of the 12-hour active window
- Post is no longer live
- Post is visible only on `/account/posts`

Important distinction:

- `Expired` is a presentation state users should understand
- the underlying stored status may still be `active` until a future cleanup job
  explicitly marks it as `closed`

So the account page will need a derived display status, not just a raw database
status.

## Filters

The page should support lightweight filtering from the start.

Recommended first filter:

- `All`
- `Active`
- `Closed`
- `Expired`

Current default:

```text
All Posts
```

Why this is acceptable today:

- it lets owners quickly confirm both what is live and what has already aged out
- it keeps the first release simple because all filtering still happens from one list
- the dropdown can still narrow to active posts when the user wants a management-only view

Section filters can come later if needed:

- `Duos`
- `Stacks`
- `Teams`
- `Scrims`

For the first version, status filtering is enough.

## Owner Actions

First version:

- Active posts can be closed
- Closed posts are read-only
- Expired posts are read-only

Not included in the first version:

- Edit
- Reopen
- Delete

This keeps the lifecycle policy consistent with:

- close is permanent
- expired posts do not become active again
- users do not rewrite live post content after publishing

## Reuse Strategy

The page should reuse existing LFG components where practical.

Recommended reuse:

- Reuse the current post-card visual structure
- Reuse shared post date formatting if it can be extracted cleanly
- Reuse the owner actions menu pattern where it fits
- Reuse shared LFG post types and status helpers

Shared helpers now in use:

- A derived post status helper for `active / closed / expired`
- Shared post query helpers under `lib/lfg/posts`
- A reusable status pill component shared with the public LFG cards

Avoid:

- Copy-pasting the public feed card into a second private-only version unless the
  differences clearly justify it

## Data Requirements

The account page should fetch posts created by the current owner only.

Needed data:

- `id`
- `profile_id`
- `lfg_type`
- `title`
- `status`
- `posting_role`
- `snapshot_rank_tier`
- `snapshot_rank_division`
- `snapshot_region`
- `snapshot_timezone`
- `hero_pool_snapshot`
- `created_at`

The page will also need a derived display status based on:

- stored `status`
- `created_at`
- the 12-hour active window

## Query Model

Current behavior:

- Fetch the current user's posts by `profile_id`
- Order by `created_at desc`
- Derive display status server-side before rendering

Current query scope:

- recent active posts
- recent closed posts
- recent expired posts

Current implementation note:

- the route currently caps the list at the most recent `30` non-archived posts

There is no need for pagination in the first version unless a seeded account
already shows a large history problem.

## UI Recommendations

Suggested page sections:

```text
My Posts
Manage your active and past LFG listings.

[status filter controls]

Active Posts
- post rows...

Closed / Expired Posts
- post rows...
```

Or, if one filtered list feels cleaner:

```text
My Posts
[status filter]

single filtered list
```

Current implementation:

- one filtered list
- default filter of `All Posts`
- status pill on every card

That keeps the page lightweight while still exposing active-only filtering.

## Relationship To Existing LFG Lifecycle Policy

This page should follow `docs/roadmap/lfg/LFG_POST_LIFECYCLE_POLICY.md`.

Important aligned rules:

- 4 posts per section per rolling 60 minutes
- active posts expire after 12 hours
- owner can close active posts
- close is permanent
- no edit or reopen for now

The account page is the private management surface for that lifecycle.

## Current Implementation Status

The current route already includes:

- auth gating to `/login` and `/onboarding`
- page heading and empty states
- a single-column filtered list of the owner's posts
- shared LFG card reuse with status pills
- `All / Active / Closed / Expired` status filtering
- owner close actions for active posts only

## Non-Goals For First Version

The first version should not try to solve everything.

Explicit non-goals:

- editing post titles
- reopening posts
- deleting posts
- pagination
- section filters
- analytics
- notifications

## Recommendation

This page now gives the LFG lifecycle a proper private management home.

Useful follow-up work, if needed later:

- add section filters
- add pagination if real histories start growing
- improve filtered empty-state wording further if users get confused

In short:

```text
Public feeds are for discovery.
Public profiles are for presentation.
Account Posts is for management.
```
