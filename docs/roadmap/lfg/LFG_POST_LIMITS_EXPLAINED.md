# LFG Post Limits Explained

Date: 2026-05-03 (updated 2026-05-15)

This note explains the current LFG posting policy.

Current shipped public sections:

- `/duos`
- `/stacks`

## Current Policy

- Active posts expire from active surfaces after `24` hours (`expires_at > now()`).
- Active slot limit: **2 posts per role per section** while posts are live in the feed.
  A slot frees when the post expires (24h) or is manually closed.
- Creation rate limit: **4 posts per section per rolling 60 minutes** regardless of status.
- Duplicate active posts with the exact same normalized title, section, mode,
  and posting role are blocked while either post is still live.

## Still Enforced

- Auth and ownership checks
- Valid section, mode, and role validation
- Title validation
- Active slot limit (2 live posts per role per section; slot = expires_at > now())
- Creation rate limit (4 posts per section per 60-minute window)
- Duplicate active post prevention (same normalized title + role + mode + section, while live)

## Simple Summary

- Users can have up to 2 simultaneously visible posts per role per section.
- Closing a post frees the slot immediately. Expiry (24h) frees it automatically.
- Users can create up to 4 posts per section per hour regardless of status.
- Slightly different titles allow distinct posts — identical content is blocked.

## Stacks

Stacks bypass the slot limit. Instead, the one-active-stack rule applies:
a user can belong to only one active or filled stack at a time.

## Rate Limit vs Slot Limit

| Check | Window | Basis |
|---|---|---|
| Slot limit | 24h (live feed window) | `expires_at > now()` |
| Creation rate | Rolling 60 minutes | `created_at >= now() - 60m` |

The slot limit controls how many live posts you have. The creation rate limit
controls how many times you can post within an hour, regardless of what you
currently have active.
