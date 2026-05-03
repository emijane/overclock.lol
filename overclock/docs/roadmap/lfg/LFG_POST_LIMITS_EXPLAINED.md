# LFG Post Limits Explained

Date: 2026-05-03

This note explains how LFG posting limits work today.

## Current Active Limit

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

## What Happens When A User Closes A Post?

Timeline:

1. `1:00 PM` create Tank post in `/duos`
2. `1:10 PM` create Tank post in `/duos`

Result:

- The user now has `2` active Tank posts in `/duos`
- A third active Tank post is blocked by the active slot limit

If the user closes one post at `1:15 PM`:

- They now have only `1` active Tank post in `/duos`
- The active slot limit no longer blocks them
- They can create another Tank post immediately if no other rule blocks it

## Simple Summary

- The active slot limit controls how many live posts a user can currently hold
- Closing a post frees that slot immediately

## Current Policy Summary

- Active posts expire from active surfaces after `12` hours
- Maximum `2` active posts per role per section
- There is currently no rolling per-hour creation rate limit
