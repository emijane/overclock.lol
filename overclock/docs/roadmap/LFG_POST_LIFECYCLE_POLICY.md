# LFG Post Lifecycle Policy

This note captures the intended lifecycle rules for LFG posts across:

- `/duos`
- `/stacks`
- `/teams`
- `/scrims`

It exists so the posting model is clear before implementation work begins.

## Goals

The LFG system should feel fast and flexible, like Discord LFG, without turning
into a spam surface.

The product goals are:

- Let players post again when a session does not work out.
- Keep feeds fresh and focused on active availability.
- Prevent rapid reposting and low-effort spam.
- Avoid stale listings staying visible too long.
- Keep moderation and trust rules simple.

## Core Policy

### Posting limit

Each user can create up to:

```text
4 posts per section per rolling 60-minute window
```

This limit is section-specific, not global.

Examples:

- A user could post twice in `Duos` within one hour.
- A user could post up to four times in `Duos` within one hour.
- That same user could also still post in `Stacks`, because the limit is per
  section.
- A user who creates posts at `1:00 PM`, `1:10 PM`, `1:20 PM`, and `1:30 PM`
  in `Duos` cannot create a fifth `Duos` post until `2:00 PM`.

Important behavior:

- The limit is based on post creation events.
- Closing a post does not refund a slot.
- Future delete behavior should also not refund a slot.
- The window should be rolling, based on each post's `created_at`.

## Post lifetime

New posts are created as:

```text
status = "active"
```

An active post should automatically expire after:

```text
12 hours
```

Once that window passes, the post should no longer appear as active in:

- Section feeds
- Public profile active listing surfaces
- Any other active-post UI

Recommended resulting state:

```text
status = "closed"
```

This keeps the model simple: active posts are currently live, and closed posts
are no longer live.

## Manual close behavior

The owner of a post should be able to close it at any time.

Manual close rules:

- Close is owner-only.
- Close is permanent.
- Closed posts cannot be reopened.
- Closing a post should immediately remove it from active surfaces.
- Closing a post should not affect posting rate limits.

This matches the product shape of lightweight "looking right now" listings
rather than long-lived posts.

## No edit policy for now

Titles should not be editable after creation in the current product scope.

Reasoning:

- Editing after publish makes moderation harder.
- A user could post something acceptable, gain visibility, then replace it with
  different content later.
- The LFG product does not need heavy post management to be useful.
- Creating a fresh post is cheap once rate limits are in place.

Current recommendation:

- No title editing
- No full post edit flow
- No reopen flow

If this changes later, edit support should be treated as a trust and moderation
decision, not just a UI enhancement.

## Visibility rules

Only active posts should appear in the public-facing LFG experience.

### Active surfaces

- `/duos`
- `/stacks`
- `/teams`
- `/scrims`
- Public profile active listing modules

### Hidden surfaces

Closed posts should be hidden from:

- Section feeds
- Public profile active listing modules

For now, closed posts do not need a user-visible history surface.

## Suggested enforcement model

The safest model is to enforce these rules on the server.

### Server-side posting checks

Before creating a new post, validate:

- Authenticated user exists
- Onboarding/profile exists
- Requested `lfg_type` is valid
- Requested role is valid and configured
- Required profile fields are present
- The user has not exceeded `4` created posts in that section within the last
  `60` minutes

Client-side UI may explain the rule, but the server must be the source of
truth.

### Read-time active filtering

Section feeds and profile active-listing queries should only return posts that
are still active.

That means they should exclude:

- Posts with `status != "active"`
- Posts older than the `12` hour active window, unless they are proactively
  closed before read

### Optional cleanup model

There are two valid implementation directions:

1. Read-time expiry
2. Background cleanup plus explicit status updates

Read-time expiry is simpler to ship first:

- treat any post older than 12 hours as inactive in queries
- optionally backfill `status = "closed"` later with a scheduled cleanup job

Background cleanup is better if the app later needs analytics, notifications, or
explicit owner history around post closure.

## Data model implications

The current LFG model already supports most of this shape if posts have:

- `profile_id`
- `lfg_type`
- `role`
- `status`
- `created_at`

Likely implementation needs:

- Consistent use of `created_at` for rolling-window rate checks
- Consistent use of `status` for manual close behavior
- Query helpers that define what counts as "active"

No major route redesign is needed for this policy.

## Product reasoning

This policy aims to preserve the feel of a fast LFG channel:

- Players can recover from a bad session and post again.
- Feeds stay fresh because old posts age out automatically.
- Users are not rewarded for closing and reposting repeatedly.
- The app avoids needing a heavy edit/delete moderation surface too early.

In short:

```text
Post freely, but not endlessly.
Stay visible while your listing is fresh.
Close it when you're done.
If you do nothing, it expires on its own.
```

## Recommended implementation order

1. Add server-side rate limiting: `4 posts per section per rolling hour`
2. Add owner-only `Close Post`
3. Hide closed posts from profile active listings and section feeds
4. Enforce 12-hour expiry in active-post queries
5. Optionally add background cleanup to mark expired posts as closed
