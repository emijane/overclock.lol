# Product Backlog

## Purpose

This document keeps the remaining high-signal product backlog in one canonical
root-doc location.

## Scope

- profile polish
- presence and matchmaking follow-up
- quality and test coverage goals

## Profile Polish

- Add featured Twitch clips support with up to `2` saved clips per profile.
- Add owner-only empty states on profile sections so setup feels guided without
  exposing blank cards publicly.
- Add a compact `looking for` summary near the top of the profile for faster
  scanning.
- Add profile completion prompts in account settings to encourage filling out
  rank, socials, hero pools, and bio.
- Add copy or link feedback states across the site so interactions feel more
  polished on mobile.
- Add a better public empty-profile experience so sparse profiles still feel
  intentional.
- Review the profile page visual system and decide on a final accent direction
  so colors and borders stay consistent.

## Presence And Matchmaking

- Add an online status system so players can quickly see who is around right
  now.
- Add availability fields so players can define when they usually play, such as
  `Mon-Fri 5 PM to 10 PM` in their own timezone.
- Add filtering and matching around schedule overlap.
- Add a lightweight `play again` feature so players can send a reconnect
  request after a good session.
- Decide whether online status should start as a simple presence indicator,
  with availability and reconnect layered on later.

## Quality And Testing

- Add tests for profile editing flows, especially bio validation, hero-pool
  skipping, and clear-all behavior.
- Add a lightweight test setup and cover profile edit parsing and validation
  rules:
  - bio limits
  - social URL normalization
  - rank/division validation
  - region/server mismatches
  - `return_to` sanitization

## Later Ideas

- Revisit privacy and contact-visibility rules such as Battletag sharing.
- Consider profile trust signals such as friend count, vouches, or reputation.
- Revisit online and last-seen presentation after the current presence model is
  more mature.

## Related Docs

- `PROJECT_CONTEXT_ROADMAP.md`
- `lfg/LFG_POST_LIFECYCLE_POLICY.md`
- `matches/INVITE_TO_PLAY_ROADMAP.md`
- `presence/USER_PRESENCE_AND_AVAILABILITY.md`
