> Archived on 2026-04-27.
> This was a completed implementation prompt/spec for the LFG post-limit refactor.
> The active QA backlog now lives in `docs/qa/LFG_SECTIONS_QA_REPORT.md`.

Update the LFG posting policy from the previous refactor.

Important change:
The previous prompt set the creation rate limit to **2 post creations per section per 60 minutes**.

Change that to:

- **4 post creations per section per rolling 60 minutes**
- Still section-wide
- Still counts all statuses: active, closed, expired, removed
- Still must NOT be bypassed by changing roles
- Still separate from active slot limits

Keep this policy:

## Active slot limit
- Maximum 2 active posts per role per section
- Closing/removing a post frees the active slot
- Only status='active' posts count toward active slots

## Creation rate limit
- Maximum 4 post creations per section per rolling 60 minutes
- Counts all created posts regardless of current status
- Removed/closed/expired posts still count
- Section-wide, not role-wide

Update constants accordingly:

- `LFG_CREATE_RATE_LIMIT_PER_SECTION = 4`
- `LFG_CREATE_RATE_LIMIT_WINDOW_MINUTES = 60`

Do not change the active slot limit.

## Required QA Pass

After making the update, QA your own implementation.

Specifically verify:

1. A user can create 2 active DPS posts in Duos.
2. A user cannot create a 3rd active DPS post in Duos.
3. Removing one DPS post frees an active slot.
4. After removing one post, the user can create another only if they have not exceeded 4 creations in the last 60 minutes.
5. A user cannot create a 5th post in the same section within 60 minutes, even if previous posts were closed/removed.
6. Switching roles from DPS to Tank or Support does not bypass the 4-per-section creation limit.
7. Creating posts in another section still works if section-scoped limits are intended.
8. Expired posts do not count toward active slots.
9. Expired/closed/removed posts still count toward creation history.
10. The checks are enforced server-side, not only in UI logic.

## Self-audit requirements

Before finishing, inspect the final code and report:

- Whether active slots, creation limits, and expiration are fully separated
- Whether any old `2 creations/hour` value still exists
- Whether any role filter still exists inside the creation rate limiter
- Whether removed/closed posts still count toward creation history
- Whether the implementation is ready for a future bump system

## Deliverable

Return:

1. Files changed
2. Constants changed
3. Final policy summary
4. QA results
5. Any remaining risks or edge cases
