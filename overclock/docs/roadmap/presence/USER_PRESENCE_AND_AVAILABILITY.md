Create a concise implementation roadmap for Overclock user presence + availability.

Stack:
- Next.js
- Supabase
- Supabase Realtime Presence
- profiles table

Goal:
Show automatic user status:
- Online
- Recently active
- Offline

Also add separate manual availability:
- Looking to play true/false

Important:
- Do NOT make users manually set online/offline.
- Presence and availability must stay separate.
- Keep the system simple, production-ready, and not overengineered.

Roadmap must cover:

1. Concept
- Explain difference between automatic presence and manual availability.
- Online = active Realtime Presence session.
- Recently active = not online, but last_seen_at is within threshold.
- Offline = no presence and stale/null last_seen_at.
- Looking to play = separate manual badge.

2. Database
Add to profiles:
- last_seen_at timestamptz null
- is_looking_to_play boolean not null default false

Include RLS/ownership notes:
- only profile owner can update these fields.

3. Presence Architecture
- Use one shared Supabase Presence channel: presence:profiles
- Track by user/profile id.
- Collapse multiple tabs into one online state.
- Presence payload should stay small: userId, joinedAt, tabId.

4. Frontend Architecture
- Add PresenceProvider in authenticated app layout.
- Subscribe once after auth/profile loads.
- Track current user.
- Store online user ids in memory.
- Cleanup on sign-out/unmount.

5. last_seen_at Updates
- Update on mount.
- Update when tab becomes visible.
- Optional heartbeat every 60–120s while visible.
- Throttle writes so they happen at most every 2 minutes.
- Do not write on every click/key press.

6. Status Resolver
Use one shared function:
- if user is in presence map → Online
- else if last_seen_at within 15 minutes → Recently active
- else → Offline

Layer Looking to play separately.

7. UI
Show status on:
- profile header
- player cards
- LFG post cards

Use:
- small dot + status text
- separate “Looking to play” chip

8. Edge Cases
Cover:
- multiple tabs
- sudden disconnects
- stale presence
- sign-out cleanup
- SSR fallback from last_seen_at before client presence loads

9. Implementation Steps
Give an ordered step-by-step plan:
- migration
- RLS
- server helpers/actions
- resolver utility
- PresenceProvider
- last_seen heartbeat
- PresenceBadge component
- availability toggle
- profile/card/LFG integration
- testing checklist

Output:
Make it practical, concise, and implementation-ready.
Avoid long explanations.
Use bullets.