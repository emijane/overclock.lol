# Rank Verification System

> **Status: Roadmap only — not shipped.**
> None of the tables, routes, or flows described here exist in the current
> codebase. This is a design proposal for a future implementation.

This note captures the intended rank verification model for competitive role
profiles and LFG trust.

## Goal

Players can self-report role ranks, but high-rank claims need extra trust. A
player claiming Grandmaster or Champion can meaningfully affect LFG quality, so
those ranks should support verification.

Verification should prove a specific role rank, not a global account rank.

Example:

```text
Support - Champion 3 - Verified
DPS - Diamond 4 - Not required
Tank - Not listed
```

## Verification Threshold

Recommended initial threshold:

```text
Grandmaster and Champion require verification to be trusted.
```

Master can stay self-reported at first. If abuse becomes common or the community
expects stronger trust, the threshold can move down to Master later.

## Rank States

Each competitive role profile can have a claimed rank and a verification status.

Suggested statuses:

```text
not_required
unverified
pending
verified
rejected
expired
```

Meaning:

```text
not_required - Claimed rank is below the verification threshold.
unverified   - Claimed rank is at or above the threshold, but no proof exists.
pending      - User submitted proof and is waiting for review.
verified     - A reviewer approved the proof for this role and rank.
rejected     - Submitted proof was rejected.
expired      - The verification was once approved but is no longer current.
```

## Product Rules

- Rank verification is role-specific.
- A verified Support rank does not verify DPS or Tank.
- Users can save high-rank claims before verification, but those claims should be
  visibly unverified.
- Verified badges should appear on public profiles, LFG cards, and LFG posts.
- Verification status should affect trust, filtering, and display, not basic
  profile ownership.
- Verification approval must be server-side/admin-only.

## Suggested MVP Policy

Start with a softer trust model:

```text
Unverified Grandmaster/Champion users can still post.
They are clearly labeled as unverified.
Filters can later allow users to show verified high-rank players only.
```

This keeps onboarding easy while still giving users a way to distinguish trusted
high-rank claims.

A stricter policy can be added later:

```text
Users cannot post as Grandmaster or Champion until verified.
```

That should only be used if the app needs a high-trust competitive environment
from day one.

## User Verification Flow

On the Competitive Profile page:

```text
Support
Rank: Champion 3
Verification: Required
[Submit verification]
```

Submission form:

```text
Verify Champion 3 Support

Upload a screenshot showing:
- Your Battle.net or in-game name
- Your Support rank
- The current competitive screen or season, if visible

[Upload screenshot]
[Submit for review]
```

After submission:

```text
Support - Champion 3
Verification pending
```

After approval:

```text
Champion 3 Support
Verified
```

After rejection:

```text
Champion 3 Support
Verification rejected
[Submit new screenshot]
```

## Data Model

Competitive role profiles should include verification fields:

```text
competitive_role_profiles
- profile_id
- role: "tank" | "dps" | "support"
- rank_tier
- rank_division
- enabled
- verification_status
- verified_at
- verified_by
- verification_expires_at
- updated_at
```

The player's main role should live on `competitive_profiles.main_role`, not on
each role row. Verification remains role-specific, so a verified Support rank
does not verify DPS or Tank.

Submissions should be stored separately from the role profile:

```text
rank_verification_submissions
- id
- profile_id
- role: "tank" | "dps" | "support"
- claimed_rank_tier
- claimed_rank_division
- screenshot_path
- status: "pending" | "approved" | "rejected"
- reviewer_profile_id
- reviewer_notes
- submitted_at
- reviewed_at
```

The submission table preserves review history and avoids overwriting proof every
time the user changes their rank.

## Storage

Rank proof screenshots should be private.

Suggested storage bucket:

```text
rank-verifications
```

Suggested path shape:

```text
private/{profile_id}/{submission_id}.png
```

Screenshots may contain Battle.net names, account details, or private UI
information. They should not be publicly accessible.

## Review Flow

Admin review page:

```text
/admin/rank-verifications
```

Reviewer sees:

```text
Profile
Role
Claimed rank
Uploaded screenshot
Submitted date
[Approve]
[Reject]
Reviewer notes
```

On approval:

```text
rank_verification_submissions.status = "approved"
competitive_role_profiles.verification_status = "verified"
competitive_role_profiles.verified_at = now()
competitive_role_profiles.verified_by = reviewer_profile_id
competitive_role_profiles.verification_expires_at = expiration date
```

On rejection:

```text
rank_verification_submissions.status = "rejected"
competitive_role_profiles.verification_status = "rejected"
```

Approval should only apply if the submitted role and claimed rank still match the
current competitive role profile. If the user changes their role rank while a
submission is pending, the pending submission should either be invalidated or
reviewed against the original submitted claim only.

## Expiration

Ranks change over time, so verification should not last forever.

Recommended initial expiration:

```text
90 days
```

Longer-term, verification could expire at the end of a competitive season if the
app tracks Overwatch season dates.

When verification expires:

```text
verification_status = "expired"
```

The UI can show:

```text
Previously verified
```

or simply:

```text
Expired
```

## Display Rules

Public profile headline:

```text
Champion 3 Support
Verified
```

Competitive profile role card:

```text
Support
Champion 3
Verification: Verified
Hero pool: Ana, Kiriko, Juno
```

LFG card:

```text
misa
Champion 3 Support
Verified
Ana / Kiriko / Juno
```

Unverified high-rank claim:

```text
misa
Champion 3 Support
Unverified
Ana / Kiriko / Juno
```

## Filtering

High-rank LFG filters can later support:

```text
Verified high-rank only
```

This should probably be added after the basic verification flow exists, not as a
requirement for the first implementation.

## Validation and Security

- Determine whether verification is required from server-side rank rules.
- Never allow clients to set `verified`, `verified_at`, `verified_by`, or
  `verification_expires_at` directly.
- Keep screenshot uploads private.
- Only authenticated users can submit verification for their own profile.
- Only authorized admins can approve or reject submissions.
- Reject or invalidate pending submissions when the claimed role/rank no longer
  matches the current role profile.
- Log reviewer identity and review timestamps.

## Future Considerations

- Battle.net account linking could eventually replace or supplement screenshot
  review if reliable rank data is available.
- Discord moderator workflows could be used for manual verification if the app
  has a trusted community server.
- Verification can expand from Grandmaster/Champion to Master if needed.
- The app may eventually distinguish between current verified rank, peak rank,
  and previous-season verification.
