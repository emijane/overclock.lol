# User Presence and Availability

This note captures the currently shipped presence and availability model.

It exists so future work starts from the current implementation rather than the
earlier planning prompt that originally created this file.

## Current Concept

The app currently treats presence and availability as separate ideas.

- Presence is automatic.
- Availability is manual.

Current status model:

- `Online` = active shared presence session
- `Recently active` = not currently online, but `last_seen_at` is recent
- `Offline` = no active presence and stale or missing `last_seen_at`
- `Looking to play` = separate manual toggle owned by the user

## Current Data Model

The `profiles` table now carries the shipped presence-related fields:

- `last_seen_at timestamptz null`
- `is_looking_to_play boolean not null default false`
- `hide_offline_presence boolean not null default false`

Current ownership expectation:

- only the profile owner updates these fields

## Current Architecture

Presence currently uses:

- one shared authenticated client provider
- Supabase Realtime Presence
- a shared presence channel for profiles

Current implementation direction:

- the app subscribes once through a shared `PresenceProvider`
- online user ids are tracked in memory client-side
- owner presence updates are throttled instead of written on every interaction
- `last_seen_at` acts as the SSR-safe fallback before live presence resolves

## Current UI Coverage

Presence and availability currently appear on:

- public profile header
- profile avatar/presence badges
- ranked avatars used in LFG cards
- LFG post cards

Current account controls live at:

- `/account` for manual `Looking to play`
- `/account` for `hide offline presence`

## Current Behavior Notes

- Users do not manually set themselves online or offline.
- `Looking to play` is intentionally independent from online/offline state.
- Offline visibility can be hidden by the owner, but active presence and
  availability badges still remain distinct concepts.

## Follow-Up Ideas

Useful next steps:

- add richer availability windows beyond the simple toggle
- add profile and feed affordances based on schedule overlap
- expose more notification or invite flows that can use the existing presence
  signals
- add lightweight tests around presence resolver behavior and privacy toggles
