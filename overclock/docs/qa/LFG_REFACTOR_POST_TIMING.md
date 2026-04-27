# LFG Refactor Post Timing

Date: 2026-04-27

Goal:
- Separate active-post visibility timing from anti-spam post-creation timing.

Policy implemented:
- Active post visibility window: 12 hours
- Active slot limit: 2 active posts per role per section
- Post creation limit: 4 posts per section per rolling 60 minutes
- Closing a post does not refund a creation slot

Code changes:
- `lib/lfg/lfg-post-policy.ts`
  - kept `ACTIVE_LFG_POST_WINDOW_HOURS = 12`
  - kept `LFG_ACTIVE_POST_LIMIT_PER_ROLE_PER_SECTION = 2`
  - added `LFG_CREATE_RATE_LIMIT_PER_SECTION = 4`
  - added `LFG_CREATE_RATE_LIMIT_WINDOW_MINUTES = 60`
- `lib/lfg/posts.ts`
  - added a dedicated `getPostCreationCutoffIso()` helper
  - restored a dedicated active-slot limiter by `profile_id + lfg_type + posting_role`
  - changed rate-limit enforcement to count posts by `profile_id` + `lfg_type`
  - removed `posting_role` and `status = "active"` from the rate-limit query
  - rate-limit query now uses the 60-minute creation window instead of the 12-hour active window
- `app/lfg/actions.ts`
  - restored the active-slot check before insert
  - switched create flow to the new section-wide creation-limit helper
  - updated the user-facing error message to match the real policy

Behavior after refactor:
- A user can keep up to 2 active posts per role in one section at once.
- A user can create up to 4 posts in one section within any rolling 60-minute window.
- A closed post still counts toward that 60-minute creation limit until it ages out.
- Active feeds and active profile listing surfaces still use the 12-hour visibility window.

Still not solved in this refactor:
- The create flow is still raceable under parallel submissions because validation and insert are not atomic.
- Database-side constraints/RPC enforcement are still recommended for full anti-spam hardening.

QA checks to run:
1. Create 2 active DPS posts in `/duos`, then confirm a third active DPS post is blocked.
2. Close one active DPS post, then confirm a new DPS post is only allowed if the user is still under 4 creations in the last 60 minutes.
3. Create 4 posts in `/duos` within 60 minutes across mixed roles, then confirm a fifth post is blocked.
4. Confirm changing roles does not bypass the 4-per-section creation limit.
5. Confirm an active post still disappears from public active surfaces after 12 hours even though creation history uses a 60-minute window.
