You are making a policy/security refactor, not a cosmetic code edit.

Treat this as correctness-critical infrastructure.

Objective:
Fix the LFG anti-spam / slot-limit architecture in a scalable way that supports future bumping, prevents abuse loops, and keeps active-user engagement high.

Non-negotiable requirements:

-----------------------------------
ARCHITECTURAL REQUIREMENTS
-----------------------------------

The code must separate these into independent systems:

A. Active listing slot limits
B. Post creation rate limits
C. Feed visibility/expiration logic

These MUST NOT share the same time window or reuse the same limiter.

Do not patch the bug minimally.
Refactor the policy correctly.

-----------------------------------
ACTIVE SLOT POLICY
-----------------------------------

Implement active slot logic as:

- Maximum 2 active posts per role per section.
- Closing/removing a post frees an active slot.
- Only posts with status='active' count.
- Use expiration only for visibility/active-slot eligibility.

Required constants:

LFG_ACTIVE_POST_LIMIT_PER_ROLE_SECTION
LFG_ACTIVE_POST_WINDOW_HOURS

Use existing naming conventions if necessary but preserve conceptual separation.

-----------------------------------
CREATION RATE LIMIT POLICY
-----------------------------------

Implement a separate rolling creation limiter:

- Maximum 2 post creations per section per rolling 60 minutes.
- Count ALL created posts regardless of current status:
  active
  closed
  expired
  removed

Do NOT:
- filter only active posts
- reuse active-slot logic
- allow role switching to bypass the limiter

This limiter must be section-wide.

Required constants:

LFG_CREATE_RATE_LIMIT_PER_SECTION
LFG_CREATE_RATE_LIMIT_WINDOW_MINUTES

-----------------------------------
ABUSE HISTORY REQUIREMENT
-----------------------------------

Deletion must not erase abuse history.

Preferred:
Implement soft-delete using statuses.

Alternative only if needed:
Introduce event/history tracking for creation events.

Hard deletes that break abuse accounting are prohibited.

-----------------------------------
FUTURE BUMP SYSTEM COMPATIBILITY
-----------------------------------

Structure code so bumping can be added later without rewriting the limiter system.

Create reusable patterns that can support future:

- bump cooldowns
- bump rate limits
- duplicate repost detection

Prepare extension points for:

LFG_BUMP_COOLDOWN_MINUTES
LFG_BUMP_RATE_LIMIT_PER_DAY

Do NOT implement bumping now.
Only prepare architecture for it.

-----------------------------------
REQUIRED FUNCTION SPLIT
-----------------------------------

Refactor into separate functions.

Required logical separation:

getActivePostCutoffIso()

hasReachedActivePostSlotLimit(...)

hasReachedPostCreationRateLimit(...)

validateCanCreateLFGPost(...)

validateCanCreateLFGPost must call BOTH checks.

Server-side enforcement only.
UI-only enforcement is unacceptable.

-----------------------------------
ANTI-ABUSE REQUIREMENTS
-----------------------------------

Explicitly close these loopholes:

1. Create-close-create loops
2. Role-switch bypasses
3. Delete/repost spam
4. Duplicate repost flooding
5. Future bump abuse vectors

Assume adversarial users.

-----------------------------------
TESTING REQUIREMENTS
-----------------------------------

Add or update regression coverage for ALL of these:

- third active post blocked
- closing frees active slot
- closing does not reset creation limiter
- role swapping does not bypass rate limit
- another section still works if intended
- expired posts excluded from active-slot count
- expired posts included in creation history
- server-side enforcement validated

If tests already exist, update them.
Do not skip tests.

-----------------------------------
IMPLEMENTATION CONSTRAINTS
-----------------------------------

Do NOT:
- change unrelated product behavior
- weaken engagement loops
- introduce arbitrary daily quotas
- move business rules into UI
- silently preserve the loophole

Do:
- preserve readability
- favor scalable policy design over minimal edits
- prefer explicit correctness over cleverness

-----------------------------------
DELIVERABLE FORMAT
-----------------------------------

Return:

1. Files changed
2. Exact policy implemented
3. Abuse loopholes closed
4. How future bumping hooks into the design
5. Any risks or follow-up recommendations

Before coding:
First inspect the existing implementation and explain whether any hidden edge cases or race conditions exist before modifying anything.