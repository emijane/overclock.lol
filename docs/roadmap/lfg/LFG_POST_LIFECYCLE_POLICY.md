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

Each user may have up to **2 active posts per role per section** at the same
time. A slot is occupied as long as the post is visible in the feed (`expires_at
> now()`). The slot frees when the post expires (24h) or the user closes it.

Stacks bypass this limit — stack posts are governed by the one-active-stack rule
instead.

### Posting rate limit

Each user may create up to **4 posts per section per rolling 60 minutes**
regardless of status. Closing or expiring posts does not restore creation budget.

This is a write-rate guard and is unrelated to feed visibility.

## Post Lifetime

New posts are created as:

```text
status = "active"
```

An active post automatically expires after:

```text
24 hours
```

Once that window passes, the post no longer appears as active in:

- section feeds
- public profile active listing surfaces
- any other active-post UI

All post types write `expires_at = created_at + 24 hours` at creation. Feed
and RLS visibility are driven directly by `expires_at > now()`.

A scheduled job (`expire_lfg_posts`) updates the stored status:

```text
status = "expired"
```

For stacks, expiry also frees active members and cancels pending requests.
See `docs/features/lfg/LFG_EXPIRATION_POLICY.md` for full details.

## Stack Lifecycle

Stacks currently ship as fixed-size groups with:

```text
min = 1
max = 5
```

Rules:

- owner is automatically inserted as the first accepted member on create
- all new stack posts start at `1/5`
- accepted members increase the visible count:
  - `1/5`
  - `2/5`
  - `3/5`
  - `4/5`
  - `5/5`
- reaching `5/5` automatically moves the post to:

```text
status = "filled"
```

- leaving or removing a member below `5/5` reverts a filled stack back to:

```text
status = "active"
```

## One-Active-Stack Rule

Users can belong to only one active stack at a time.

Occupied statuses:

- `active`
- `filled`

Freeing statuses:

- `closed`
- `expired`

This rule is enforced server-side for:

- stack creation
- request submission
- request acceptance

## Manual Close Behavior

The owner of a post can close it at any time.

Manual close rules:

- close is owner-only
- close is permanent
- closed posts cannot be reopened
- closing a post immediately removes it from active surfaces
- closing a post does not affect posting rate limits

For stacks, closing also means:

- all current members are freed from that stack
- pending join requests are cancelled automatically
- the stack cannot be reopened

## Stack Leave / Remove / Disband

Additional stack-only lifecycle actions:

- members can leave their current stack
- owners can remove non-owner members
- owners can disband by closing the stack

Behavior:

- leaving or removing decrements the public member count
- the removed role slot is reopened in `looking_for_roles`
- if the stack was `filled`, it becomes `active` again once a member leaves

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

Stacks also follow a stricter membership visibility rule:

- only accepted members are public
- pending and declined requests stay private
- public cards show accepted members through overlapping clickable avatars

## Current Enforcement Model

These rules are enforced on the server.

### Server-side posting checks

Before creating a new post, validate:

- authenticated user exists
- onboarding/profile exists
- requested `lfg_type` is valid
- requested role is valid and configured
- required profile fields are present
- the post is not a duplicate active post with the same normalized title +
  section + mode + posting role

For stacks, also validate:

- the user is not already in another `active` or `filled` stack
- the owner becomes the initial accepted member automatically
- the stack starts at `1/5`

Client-side UI may explain the rule, but the server remains the source of
truth.

### Stack request and accept checks

Before a stack request is created or accepted, validate:

- authenticated user exists
- requester is not the owner
- post is still `active` or `filled` where appropriate
- post is not expired or closed
- requested role is still needed
- stack is not already full
- requester is not already a member
- duplicate pending requests do not exist
- blocked-user rules apply when supported by the runtime database
- acceptance still passes the one-active-stack rule

### Notification Integration

Stacks reuse the existing notification dropdown instead of introducing a new
stack inbox.

Current flow:

- requester clicks `Request to Join`
- requester chooses one currently-needed role
- owner receives a notification dropdown item with accept/decline controls
- accept inserts the member, updates count/roles, and revalidates stack surfaces
- decline follows the existing lightweight dismissal pattern

### Active filtering

Section feeds and profile active-listing queries only return posts that are
still active.

That means they exclude:

- posts with `status != "active"`
- posts where `expires_at <= now()` (feed and RLS both filter on this directly)

### Expiration and cleanup

Background expiration and cleanup are implemented:

- `expire_lfg_posts()` — marks `status = 'expired'` for all post types past
  their `expires_at`; cleans up stack state; callable by `service_role` only
- `cleanup_expired_lfg_posts()` — hard-deletes posts past their `purge_after`
  (30-day retention window); callable by `service_role` only

Both functions are safe to call on a schedule. See
`docs/features/lfg/LFG_EXPIRATION_POLICY.md` for eligibility criteria,
dependency skip rules, and cron examples.

## Data Model Implications

The current LFG model already supports this shape with:

- `profile_id`
- `lfg_type`
- `posting_role`
- `status`
- `created_at`

Stacks additionally rely on:

- `looking_for_roles`
- `current_member_count`
- `max_group_size`
- `stack_requests`
- `stack_members`

Important implementation expectations:

- `expires_at > now()` drives feed and RLS visibility, dedup, and slot limits
- `created_at` windows drive only the creation rate-limit (60-minute write budget)
- consistent use of `status` for manual close behavior
- stack helpers that treat both `active` and `filled` as occupying membership

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
- stack owner auto-membership at create
- stack request submission with role choice
- owner-side accept/decline through notifications
- accepted-member public avatar strip on stack cards
- leave/remove support for stack membership
- `active` / `filled` / `closed` / `expired` stack statuses

Current enforcement note:

- active slot limit: 2 active posts per role per section (slot occupied while
  `expires_at > now()`; freed by expiry or manual close)
- creation rate limit: 4 posts per section per rolling 60 minutes (status-agnostic)
- dedup: identical normalized title + section + mode + posting role is blocked
  while either post is still live (`expires_at > now()`)
- the shipped public sections are `/duos` and `/stacks`

Follow-up work that still makes sense:

- add broader live QA around create/request/accept/leave/remove/close flows
- tighten docs and tests around notification outcomes for declines
- keep deferred realtime party/chat features out of the lifecycle layer

## Stack Card UI Notes

Current stack cards lean into a heist.lol-inspired social object style:

- dark, dense, flatter presentation
- reduced radius and subtle borders
- atmospheric banner treatment
- compact metadata pills over the banner
- overlapping accepted-member avatars inline with the `x/5` count
- flatter available-role pills with restrained semantic tinting

The card should feel cohesive and social rather than like stacked dashboard
modules.

## Next Steps

- Add live regression coverage for stack membership edge cases and expiry cleanup.
- Improve accessibility labeling for compact stack metadata and role pills.
- Keep stack UI polish focused on density and cohesion, not new feature scope.
- Revisit stored-status consistency for duos only if shared lifecycle behavior changes.
