# LFG Post Limits Explained

Date: 2026-05-03

This note explains the current temporary testing policy for LFG posting.

Current shipped public sections:

- `/duos`
- `/stacks`

## Current Testing Policy

- Active posts still expire from active surfaces after `12` hours.
- Active slot limits are currently disabled for testing.
- Rolling per-hour creation rate limits are currently disabled for testing.
- Duplicate active posts with the exact same normalized title, section, mode,
  and posting role are still blocked.

## Still Enforced

- Auth and ownership checks
- Valid section, mode, and role validation
- Title validation
- Duplicate active post prevention on matching normalized title + role + mode + section

## Simple Summary

- You can currently create posts without active-count or rolling-window caps.
- The only creation guard that still intentionally blocks testing is duplicate
  active posts with the same normalized identity.

## Current Policy Summary

- Active posts expire from active surfaces after `12` hours
- There is currently no active-post slot limit
- There is currently no rolling per-hour creation rate limit
- Duplicate active posts are still blocked
