# LFG Post Limits Explained

Date: 2026-04-27

This note explains how LFG posting limits work today, especially the difference
between active slot limits and rolling creation rate limits.

## Two Separate Limits

There are two different rules:

### 1. Active Slot Limit

- Maximum `2` active posts per role per section
- This is checked per:
  - user
  - section
  - role
- Only `status = "active"` posts inside the active visibility window count

Examples:
- A user can have up to `2` active `Tank` posts in `/duos`
- A user can also have up to `2` active `DPS` posts in `/duos`
- A user can also have up to `2` active `Tank` posts in `/stacks`

Important behavior:
- Closing a post frees the active slot immediately
- Expired posts do not count toward active slots

### 2. Creation Rate Limit

- Maximum `4` post creations per section per rolling `60` minutes
- This is checked per:
  - user
  - section
- It is section-wide, not role-wide
- It counts created posts regardless of current status

Important behavior:
- Closed posts still count
- Archived posts still count
- Future removed posts should still count
- Changing roles does not bypass this limit

## What Happens When A User Closes A Post?

Closing a post affects the two limits differently:

- It does free an active slot
- It does not erase the creation from the rolling 60-minute history

That means a user can close a post and still be blocked from reposting if they
have already created `4` posts in that section during the last `60` minutes.

## Example: Close Frees Slot, But Not Creation History

Timeline:

1. `1:00 PM` create Tank post in `/duos`
2. `1:10 PM` create Tank post in `/duos`

Result:

- The user now has `2` active Tank posts in `/duos`
- A third active Tank post is blocked by the active slot limit

If the user closes one post at `1:15 PM`:

- They now have only `1` active Tank post in `/duos`
- The active slot limit no longer blocks them
- But both creations still count toward the rolling 60-minute creation history

So they can repost only if they are still under `4` total creations in `/duos`
within the last `60` minutes.

## Example: Closing Does Not Reset Rate Limit

Timeline:

1. `1:00 PM` create post in `/duos`
2. `1:05 PM` create post in `/duos`
3. `1:10 PM` create post in `/duos`
4. `1:15 PM` create post in `/duos`

Result:

- The user has now hit the `4 creations per 60 minutes` cap for `/duos`

If the user closes all of them at `1:20 PM`:

- They may have zero active posts left
- But they still cannot create a fifth `/duos` post yet

Why:

- The creation rate limit is based on creation timestamps
- It is not refunded by closing posts

The user must wait until one of those creation timestamps ages out of the
rolling `60` minute window.

## Rolling Window Behavior

The creation rate limit is rolling, not fixed by the clock hour.

Example:

1. `1:00 PM` create post
2. `1:10 PM` create post
3. `1:20 PM` create post
4. `1:30 PM` create post

The user cannot create another post in that section until after `2:00 PM`,
because the `1:00 PM` creation is still inside the last `60` minutes until then.

At `2:00 PM`:

- the `1:00 PM` creation ages out
- the user may create another post if no other rule blocks them

## Simple Summary

- Active slot limit controls how many live posts a user can currently hold
- Creation rate limit controls how often a user can create posts over time
- Closing frees live capacity
- Closing does not refund creation history

## Current Policy Summary

- Active posts expire from active surfaces after `12` hours
- Maximum `2` active posts per role per section
- Maximum `4` post creations per section per rolling `60` minutes
