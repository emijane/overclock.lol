# ADR-001 Duo Chat Foundation

## Status

Accepted

## Decision

Ship Duo chat first under `/social` using a generic thread/participant/message schema, with RLS controlling reads and RPCs controlling message sends.

## Why `/social`

- `/connections` is already the relationship-management surface.
- Chat needs room to grow into future Stack chat without overloading the connections page.
- `/social` fits the existing sidebar structure and future chat expansion better.

## Why Invite-Anchored Threads

- Accepted Duo invites already define the exact pair and source post context.
- A strict one-thread-per-accepted-invite rule prevents duplicate conversation history for the same Duo match.

## Why RLS Controls Reads

- Visibility rules belong at the database boundary.
- Blocked or archived threads should disappear even if a client is stale or buggy.

## Why RPC Controls Writes

- Message sends need one auditable path for sender identity, lock checks, and rate limits.
- Direct inserts would spread security-critical logic across grants and client code.

## Why Blocks Remove Visibility

- Disconnecting and blocking are different product states.
- Disconnecting keeps history readable.
- Blocking should fully remove normal access for harassment and safety reasons.

## Why Connection Removal Preserves History

- Duo chat should still preserve past coordination context after an unmatch.
- The product requirement is read allowed, send disabled.

## Why the Schema Is Generic

- V1 only ships Duo chat.
- Future Stack chat should not require a schema rewrite to add multi-participant threads.
