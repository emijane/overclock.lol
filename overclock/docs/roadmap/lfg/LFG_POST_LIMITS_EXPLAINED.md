# LFG Post Limits Explained

Date: 2026-05-03 (updated 2026-05-06)

This note explains the current LFG posting policy.

Current shipped public sections:

- `/duos`
- `/stacks`

## Current Policy

- Active posts expire from active surfaces after `12` hours.
- Active slot limits have been permanently removed.
- Rolling per-hour creation rate limits have been permanently removed.
- Duplicate active posts with the exact same normalized title, section, mode,
  and posting role are still blocked.

## Still Enforced

- Auth and ownership checks
- Valid section, mode, and role validation
- Title validation
- Duplicate active post prevention on matching normalized title + role + mode + section

## Simple Summary

- Users can create posts without active-count or rolling-window caps.
- The only creation guard that blocks posting is duplicate active posts with
  the same normalized identity.

## Current Policy Summary

- Active posts expire from active surfaces after `12` hours
- There is no active-post slot limit
- There is no rolling per-hour creation rate limit
- Duplicate active posts are still blocked
