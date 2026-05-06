# Matches And Invites

This document explains how the current Invite to Play and `/matches` system
works in the live codebase.

Use this as the maintenance reference for product behavior, not as a future
spec.

## Overview

The current system is built around a single lifecycle table: `play_invites`.

An invite can move through these states:

- `pending`
- `accepted`
- `declined`
- `expired`
- `cancelled`

Accepted invites are treated as matches. There is no separate `matches` table
right now.

## Where Invites Can Start

Invites can currently be sent from:

- public profile pages
- LFG cards in Duos and Stacks

The sender must be signed in and have a completed enough app profile. Guests
and incomplete profiles are blocked before the send action runs.

## Invite Button States

Invite-capable surfaces currently use these states:

- `Invite to Play`
- `Invite Sent`
- `Matched`
- `Sign in to invite`
- `Profile Required`

These states are derived server-side so profiles and LFG cards stay aligned.

## Invite Lifecycle

### Pending

When a user sends an invite, a `pending` row is created in `play_invites`.

Pending invites:

- appear for the recipient in the main notification bell
- appear for the sender in `/matches` under outgoing invites
- can be accepted or declined by the recipient
- can be cancelled by the sender
- can expire automatically

### Accepted

If the recipient accepts:

- the invite becomes `accepted`
- the row becomes part of match history
- both participants can see the match in `/matches`
- Discord and Battle.net contact info can be shown there

Accepted matches do not expire.

### Declined

If the recipient declines:

- the invite becomes `declined`
- it no longer appears as pending
- it does not appear as a match

### Cancelled

If the sender cancels:

- the invite becomes `cancelled`
- it no longer appears as pending
- it does not appear as a match

### Expired

Pending invites can expire.

Expired invites:

- cannot be accepted
- cannot be declined as active invites
- do not appear as matches

## Expiry Behavior

Pending invites expire. Accepted matches do not.

The app currently enforces expiry in two ways:

- lifecycle RPC logic prevents expired pending invites from being accepted
- `/matches` performs an expiry sweep before rendering so stale pending rows are
  cleaned up

Realtime refresh behavior also helps the UI stop showing rows once they change.

## Notification Bell

The main notification bell is for incoming pending invites only.

It currently shows:

- badge count
- sender summary
- optional source post title
- optional message
- time/expiry context
- `Accept`
- `Decline`

It does not act as a full historical inbox.

## Matches Page

`/matches` is the authenticated home for accepted matches and pending invite
management.

It currently includes:

- `Recent Matches`
- tabbed pending invites card with `Incoming` and `Outgoing`
- `Past Matches` when enough accepted matches exist

### Recent Matches

Recent matches show:

- participant avatar
- display name and username
- role, rank, and region
- source post title if available
- optional invite message
- accepted timestamp
- unlocked contact details when present

### Incoming Invites

Incoming pending invites on `/matches` can be:

- accepted
- declined

### Outgoing Invites

Outgoing pending invites on `/matches` can be:

- cancelled

## Contact Unlock Rules

Private contact details are intentionally gated.

Current rule:

- Discord and Battle.net info are only shown on accepted matches

They should not be exposed on:

- pending invites
- declined invites
- cancelled invites
- expired invites

## Realtime Behavior

The app subscribes to `play_invites` changes for rows involving the current
user.

Current realtime approach:

- Supabase realtime subscription
- debounced `router.refresh()`

This keeps the bell and `/matches` updated when invites are:

- sent
- accepted
- declined
- cancelled
- expired

## Security Model

The current system relies on server-side actions and security-definer RPCs.

Important rules:

- only participants can read invite rows through the intended access path
- only the recipient can accept or decline
- only the sender can cancel
- expired pending invites cannot be accepted
- direct client-side table writes are not the main control path

## Current Data Source

Primary storage:

- `play_invites`

Important supporting helpers and surfaces:

- `lib/matches/play-invites.ts`
- `app/matches/actions.ts`
- `app/matches/page.tsx`
- `app/components/global-notifications-menu-client.tsx`
- `app/u/[username]/profile/invite-to-play-button.tsx`
- `app/lfg/components/lfg-invite-button.tsx`

## Current Testing Coverage

There is focused coverage for:

- invite CTA presentation states
- RPC result normalization
- server action error/result mapping
- invite state derivation precedence

There is still value in deeper integration-style coverage for the query helpers
that build profile and LFG invite state from live data.

## Practical Rules For Future Changes

- Treat `play_invites` as the source of truth unless there is a strong reason to
  introduce a dedicated matches table.
- Keep contact unlock logic tied to `accepted` state only.
- Keep invite state derivation centralized so profiles, LFG cards, the bell,
  and `/matches` do not drift.
- If product adds rematch or replay flows later, do not overload the current
  `matched` UI state without defining the new lifecycle clearly.
