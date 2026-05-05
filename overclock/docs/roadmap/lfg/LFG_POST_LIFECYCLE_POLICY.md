# LFG Post Lifecycle Policy

This note captures the current lifecycle rules for LFG posts across:

- `/duos`
- `/stacks`
- future LFG sections if they ship later

It exists so the shipped behavior and remaining follow-up work stay clear.

## Goals

The LFG system should feel fast and flexible, like Discord LFG, without turning
into a spam surface.

The product goals are:

- Let players post again when a session does not work out
- Keep feeds fresh and focused on active availability
- Prevent rapid reposting and low-effort spam
- Avoid stale listings staying visible too long
- Keep moderation and trust rules simple

## Core Policy

### Active slot limit

Each user can keep up to:

```text
2 active posts per role per section
```

This limit is checked per:

- user
- section
- role

Important behavior:

- only posts inside the 12-hour active visibility window count
- closing a post frees the active slot immediately
- expired posts do not count toward the active slot limit

### Posting rate limit

Each user can create up to:

```text
4 posts per section per rolling 60-minute window
```

This limit is section-specific, not global.

Examples:

- a user could post twice in `Duos` within one hour
- a user could post up to four times in `Duos` within one hour
- that same user could also still post in `Stacks`, because the limit is per
  section
- a user who creates posts at `1:00 PM`, `1:10 PM`, `1:20 PM`, and `1:30 PM`
  in `Duos` cannot create a fifth `Duos` post until `2:00 PM`

Important behavior:

- the limit is based on post creation events
- closing a post does not refund a slot in the rolling creation history
- future delete behavior should also not refund a slot
- the window is rolling, based on each post's `created_at`

## Post Lifetime

New posts are created as:

```text
status = "active"
```

An active post automatically expires after:

```text
12 hours
```

Once that window passes, the post should no longer appear as active in:

- section feeds
- public profile active listing surfaces
- any other active-post UI

Current implementation detail:

- expired posts are treated as inactive at read time
- `/account/posts` derives an `Expired` presentation state even if the stored
  row is still `status = "active"`

Recommended eventual stored state:

```text
status = "closed"
```

That keeps the stored model simple: active posts are currently live, and closed
posts are no longer live.

## Manual Close Behavior

The owner of a post can close it at any time.

Manual close rules:

- close is owner-only
- close is permanent
- closed posts cannot be reopened
- closing a post immediately removes it from active surfaces
- closing a post does not affect posting rate limits

This matches the product shape of lightweight "looking right now" listings
rather than long-lived posts.

## No Edit Policy For Now

Titles should not be editable after creation in the current product scope.

Reasoning:

- editing after publish makes moderation harder
- a user could post something acceptable, gain visibility, then replace it with
  different content later
- the LFG product does not need heavy post management to be useful
- creating a fresh post is cheap once rate limits are in place

Current recommendation:

- no title editing
- no full post edit flow
- no reopen flow

If this changes later, edit support should be treated as a trust and moderation
decision, not just a UI enhancement.

## Visibility Rules

Only active posts should appear in the public-facing LFG experience.

### Active surfaces

- `/duos`
- `/stacks`
- public profile active listing modules

### Private history surface

- `/account/posts` shows active, closed, and expired posts for the owner

### Hidden surfaces

Closed and expired posts should stay hidden from:

- section feeds
- public profile active listing modules

## Current Enforcement Model

These rules are enforced on the server.

### Server-side posting checks

Before creating a new post, validate:

- authenticated user exists
- onboarding/profile exists
- requested `lfg_type` is valid
- requested role is valid and configured
- required profile fields are present
- the user has not exceeded `2` active posts for that role in that section
- the user has not exceeded `4` created posts in that section within the last
  `60` minutes

Client-side UI may explain the rule, but the server remains the source of
truth.

### Read-time active filtering

Section feeds and profile active-listing queries only return posts that are
still active.

That means they exclude:

- posts with `status != "active"`
- posts older than the `12` hour active window, unless they are proactively
  closed before read

### Optional cleanup model

There are two valid implementation directions:

1. Read-time expiry
2. Background cleanup plus explicit status updates

Read-time expiry shipped first:

- treat any post older than 12 hours as inactive in queries
- optionally backfill `status = "closed"` later with a scheduled cleanup job

Background cleanup becomes more useful if the app later needs analytics,
notifications, or more explicit post history semantics.

## Data Model Implications

The current LFG model already supports this shape with:

- `profile_id`
- `lfg_type`
- `posting_role`
- `status`
- `created_at`

Important implementation expectations:

- consistent use of `created_at` for rolling-window checks
- consistent use of `status` for manual close behavior
- shared query helpers that define what counts as "active"

No major route redesign is needed for this policy.

## Product Reasoning

This policy aims to preserve the feel of a fast LFG channel:

- players can recover from a bad session and post again
- feeds stay fresh because old posts age out automatically
- users are not rewarded for closing and reposting repeatedly
- the app avoids needing a heavy edit/delete moderation surface too early

In short:

```text
Post freely, but not endlessly.
Stay visible while your listing is fresh.
Close it when you're done.
If you do nothing, it expires on its own.
```

## Current Implementation Status

The current implementation already includes:

- owner-only close
- hidden closed and expired posts on public surfaces
- read-time expiry for active feeds
- private post management through `/account/posts`

Temporary current-codebase note:

- active slot limits are currently disabled for testing
- rolling creation rate limits are currently disabled for testing
- duplicate active posts with the same normalized title + section + mode +
  posting role are still blocked
- the shipped public sections are currently `/duos` and `/stacks`

Follow-up work that still makes sense:

- add background cleanup to mark expired posts as closed if explicit stored
  closure becomes important
- add tests around create, close, and expiry behavior
