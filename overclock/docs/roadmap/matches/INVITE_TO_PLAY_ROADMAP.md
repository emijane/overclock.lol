# Invite to Play Roadmap

This note scopes a first-pass Invite to Play system that fits the current
profile-first, Duos/Stacks product shape and keeps sensitive contact details
locked until both sides accept a connection.

## Current Status

As of the current codebase, Invite to Play is partially shipped:

- Phase 1 is largely complete in Supabase migrations.
- Phase 2 backend RPCs now cover send, accept, decline, cancel, and expiry
  transitions, but no invite UI is wired to the new lifecycle actions yet.
- The main-menu bell and `/matches` route both exist as UI scaffolds, but they
  are not yet backed by live invite data.

Use this roadmap as an implementation guide for the remaining work, not as a
purely greenfield spec.

## Goals

- Let a player send a lightweight invite from a relevant profile or LFG surface.
- Let the recipient review and respond from a compact header notification
  dropdown.
- Turn accepted invites into durable match history that users can revisit on a
  dedicated `/matches` page.
- Unlock Discord and Battle.net contact info only after acceptance.
- Keep state transitions, RLS, and expiry logic server-enforced.

## Recommended Data Model

Use `play_invites` as the source of truth for both pending invites and accepted
match history instead of creating a separate `matches` table in phase one.

Why this is the better first option:

- One row can represent the full lifecycle: `pending`, `accepted`, `declined`,
  `expired`, or `cancelled`.
- The notification dropdown and `/matches` page can query the same canonical
  record with different filters.
- It keeps write paths, RLS, and realtime subscriptions simpler.
- It avoids duplicated participant metadata and reduces cross-table drift.

Tradeoff:

- A single table needs a few more lifecycle fields and careful indexes.
- If a future version needs post-match outcomes, rematch threads, endorsements,
  or moderation artifacts, a separate `matches` table may become cleaner later.

For now, keep `play_invites` as the lifecycle table and add derived SQL views or
server helpers for `pending_incoming_invites`, `pending_sent_invites`, and
`accepted_matches`.

## Phase 1: DB / Schema

Status: mostly complete.

### Core table

`play_invites` now exists and already includes these first-pass lifecycle
fields:

- `id`
- `sender_profile_id`
- `recipient_profile_id`
- `source_lfg_post_id` nullable
- `status` enum-like text constrained to:
  `pending | accepted | declined | expired | cancelled`
- `message` nullable, short freeform note
- `sender_snapshot` jsonb or explicit snapshot fields for fast rendering:
  display name, username, avatar, role, rank, region
- `recipient_snapshot` optional if future history views need stable display
- `created_at`
- `updated_at`
- `expires_at`
- `responded_at` nullable
- `accepted_at` nullable
- `declined_at` nullable
- `cancelled_at` nullable

### Constraints

Already implemented:

- Prevent self-invites.
- Prevent duplicate active invites between the same sender and recipient for the
  same source context only while another row is still `pending`.
- Do not impose a cooldown after an invite is accepted, declined, expired, or
  cancelled. Once no pending invite remains, the sender can invite again unless
  they hit rate limits.
- Require `expires_at > created_at`.
- Treat accepted invites as immutable except for future system-maintained
  history fields.

### Contact visibility

Do not copy Discord handles or BattleTags into the invite row. Keep contact
data on the profile and gate access through accepted-match reads.

Current state:

- Snapshot fields are limited to public-ish sender summary data.
- Contact unlock reads are still future work on accepted match queries.

### Indexes

These targeted indexes are already in place for the main query paths:

- `(recipient_profile_id, status, expires_at desc, created_at desc)` for the
  header dropdown
- `(sender_profile_id, status, created_at desc)` for pending sent invites
- `(sender_profile_id, accepted_at desc)` filtered to `status = 'accepted'`
- `(recipient_profile_id, accepted_at desc)` filtered to `status = 'accepted'`
- `(source_lfg_post_id, status)` if post-level invite state is shown often

### Derived views or helpers

Add one of the following:

- SQL views for `incoming_pending_play_invites`, `sent_pending_play_invites`,
  and `accepted_play_matches`, or
- server-side query helpers under `lib/` that centralize select shape

Prefer shared query helpers first unless the SQL view meaningfully simplifies
RLS-safe reads.

Current gap:

- Invite lifecycle query helpers for incoming pending, sent pending, and
  accepted matches are not centralized yet.

## Phase 2: RPC / Security

Status: backend lifecycle RPCs are in place; UI wiring is still incomplete.

### Required RPCs or server actions

- `send_play_invite` completed
- `accept_play_invite` completed
- `decline_play_invite` completed
- `cancel_play_invite` completed
- `expire_play_invites` completed for participant-scoped read-time cleanup

### State transition rules

- Only `pending` invites can become `accepted`, `declined`, `cancelled`, or
  `expired`.
- Only the recipient can accept or decline.
- Only the sender can cancel.
- Expired invites cannot be accepted or declined.
- Sending a new invite after any resolved state is allowed with no product
  cooldown.
- Anti-spam protection should come from rate limiting, not from long-lived
  invite lockouts between the same pair.

### RLS policy direction

- Sender and recipient can read their own invite rows.
- Only the sender can create an invite row where `sender_profile_id = auth.uid()`.
- Only the recipient can update status to `accepted` or `declined`.
- Only the sender can update status to `cancelled`.
- System expiry logic must run in a controlled server path or privileged job.

Current state:

- Participant read access is already enforced with RLS.
- Create/write access currently flows through the security-definer
  invite RPCs rather than direct client writes.
- Accept, decline, cancel, and expiry transitions now enforce participant
  ownership and pending-only state changes on the server.
- Direct table update policies for client-side writes are still intentionally
  absent.

### Contact info protection

- Public profile reads continue to hide private contact details.
- Accepted-match queries may join or project Discord / Battle.net only when
  `auth.uid()` matches either participant and `status = 'accepted'`.
- Pending, declined, cancelled, and expired invites must never expose private
  contact info.

### Validation rules

- Sender must have a completed enough profile to invite.
- Recipient must still be eligible to receive invites.
- Optional source post must still be visible / valid if required by the UI.
- Message length should be capped conservatively.
- Rate limiting should be enforced server-side and should be the main guard
  against repeated invite spam.

Current state:

- `send_play_invite` already validates auth, recipient existence, self-invite,
  message length, source-post validity, duplicate pending state, and rate
  limits.
- Recipient eligibility beyond simple existence still needs a clearer shared
  policy.

## Phase 3: Notification Dropdown

Status: scaffold exists, live behavior not implemented.

### Purpose

Keep the main-menu bell compact and action-oriented rather than turning it into
a full inbox.

### Header behavior

- Replace the current placeholder bell dropdown with a data-backed bell that
  shows a badge count for pending incoming invites only.
- Hide the badge when count is zero.
- Cap visible badge text if needed, such as `9+`.

### Dropdown contents

Each row should show:

- sender avatar and display name
- sender role, current rank, and region
- related post title if the invite came from an LFG post
- optional message preview
- time left until expiry or a created-time fallback
- `Accept` action
- `Decline` action

### Row behavior

- Pending rows stay actionable.
- Expired rows should disappear from the compact list or render briefly in a
  disabled/gray state before removal.
- Accept/decline should show loading state per row.
- Empty state should say there are no pending invites.
- Error state should preserve the dropdown shell and allow retry.

### Data loading

- Load a lightweight pending incoming invite list for the shell header.
- Keep the select shape intentionally small so the bell stays fast.
- Use centralized query helpers so the menu and later notification surfaces do
  not drift.

Current state:

- The bell dropdown exists in the authenticated shell with a static empty state
  and a link to `/matches`.
- Badge count, actionable rows, loading/error states, and invite data loading
  are still to do.

## Phase 4: Matches Page

Add a dedicated `/matches` route in the authenticated shell navigation.

Status: route and nav link exist, page content is still placeholder UI.

### Purpose

- Show accepted play connections separately from pending notifications.
- Give users a durable place to revisit who they matched with.
- Unlock Discord / Battle.net only after an invite is accepted.

### Page sections

#### Active / Recent Matches

Show accepted invites first, including:

- participant avatar and display name
- role / rank / region snapshot
- related post title if present
- accepted time
- unlocked Discord / Battle.net contact info
- optional next-step action later, such as `View profile` or `Play again`

#### Pending Sent Invites

Show invites the current user sent that are still pending:

- recipient summary
- related post title if available
- created time / expiry time
- current pending status
- `Cancel invite` action

#### Past Matches

Show older accepted invites after the recent section, likely with pagination or
incremental loading if volume grows.

#### Optional history section

Declined, expired, and cancelled invites are optional for the first pass. If
shown later, keep them visually separate from accepted matches.

#### Empty state

If nothing exists yet, explain:

- no accepted matches yet
- invites from LFG or profiles will appear here after acceptance

### Access rules

- Only participants can load accepted match details.
- Contact info is only rendered inside accepted match cards.

Current state:

- `/matches` is already linked from the main shell and account menu.
- The page currently renders a “coming next” structure for active matches,
  pending sent invites, and history, but does not query live invite data yet.

## Phase 5: Realtime Behavior

Status: not implemented yet.

### Notification updates

- Subscribe to incoming invite changes for the authenticated recipient.
- Refresh badge count and dropdown rows when a new pending invite arrives.
- Remove or update a row immediately after accept/decline/expiry.

### Matches page updates

- Refresh `Pending Sent Invites` when a sent invite is accepted, declined,
  cancelled, or expired.
- Refresh `Active / Recent Matches` when an invite transitions to `accepted`.

### Expiry strategy

Use both:

- read-time filtering so expired invites do not remain actionable, and
- a cleanup path that marks stale `pending` rows as `expired`

This keeps UI safe even if background cleanup runs late.

## UI State Requirements

Invite-capable surfaces should standardize button states:

- `Invite to Play`: current user can send a new invite
- `Invite Sent`: a pending outgoing invite already exists for that current
  player/context
- `Matched`: an accepted invite already exists between the pair
- `Unavailable`: recipient is not eligible because of expiry, closed post,
  blocked state, or product-specific gating
- `Profile Required`: sender must complete required profile setup first

These states should be derived from centralized server-side invite eligibility
logic so post cards and profile actions stay consistent.

`Matched` should not act as a cooldown state by itself. It is a status/display
state for an existing accepted connection, but it should not permanently block
future invites if product UX later exposes a re-invite or play-again action.

Current gap:

- No invite-capable LFG or profile surface has shipped these button states yet.

## QA Checklist

- Existing verification: sending an invite through the current server action
  reaches the RPC and returns user-facing validation errors for duplicate,
  invalid, and rate-limit cases.
- Existing verification: `/matches` route access already respects auth and
  onboarding redirects.
- Remaining product QA:
- Sending an invite creates one pending row and updates sender UI state to
  `Invite Sent`.
- Incoming pending invite count appears on the header bell for the recipient.
- Recipient can accept from the dropdown without leaving the current page.
- Recipient can decline from the dropdown without leaving the current page.
- Sender can cancel from the pending sent section on `/matches`.
- Accepted invites appear in `Active / Recent Matches` for both participants.
- Discord / Battle.net stay hidden before acceptance and appear only after
  acceptance.
- Expired invites cannot be accepted through UI or server actions.
- Declined, expired, and cancelled invites do not appear as accepted matches.
- A sender can send a new invite immediately after a prior invite resolves,
  unless server-side rate limiting blocks it.
- Duplicate live pending invites are blocked only for the same active
  sender/recipient/context combination.
- Realtime updates remove the need for manual refresh in the dropdown.
- Empty, loading, and error states render cleanly in both the dropdown and the
  `/matches` page.
