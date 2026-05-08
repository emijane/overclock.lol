# User Search

## Overview
- Adds compact user search to the main menu.
- Searches public profiles by `username` and `display_name`.
- Shows a live dropdown with avatar, display name, and `@username`.
- Selecting a result opens that user's public profile.

## Architecture
- Main nav UI:
  - `overclock/app/components/main-menu-user-search.tsx`
- Search API route:
  - `overclock/app/api/users/search/route.ts`
- Shared client/server query helpers:
  - `overclock/lib/profiles/profile-search-shared.ts`
- Query + sanitization helpers:
  - `overclock/lib/profiles/public-profile-search.ts`
- Rate limiting:
  - `overclock/lib/profiles/profile-search-rate-limit.ts`
- Nav integration:
  - `overclock/app/components/global-auth-bar.tsx`

## Query Behavior
- Input is trimmed before search.
- Leading `@` is removed for convenience.
- Query length is capped at `40` characters.
- Empty or whitespace-only queries do not send requests.
- Search runs against public `profiles` rows only.
- Matching strategy:
  - username prefix match: `username ILIKE '{query}%'`
  - display name contains match: `display_name ILIKE '%{query}%'`
- Results are merged and deduplicated by username.
- Result limit: `6`

## Sanitization And Security
- Input normalization:
  - trims whitespace
  - strips leading `@`
  - limits query length
- Special wildcard characters used by `ILIKE` are escaped before querying.
- No raw SQL string building is used.
- The search route only selects:
  - `username`
  - `display_name`
  - `avatar_url`
  - `avatar_updated_at`
- Private fields are not returned.
- Search uses the existing Supabase server client and current RLS/public-profile visibility rules.
- Rendered text is React-rendered text, so it is escaped by default.

## Rate Limiting
- API route is throttled in memory per client IP.
- Current limit:
  - `30` requests per minute
  - route: `/api/users/search`
- Client also debounces requests by `220ms` to reduce load.

## UI Behavior
- Compact search input is added to the main menu.
- Hidden on smaller screens to preserve current mobile/nav behavior.
- Dropdown opens while typing valid input.
- Dropdown states:
  - loading: `Searching...`
  - no results: `No players found.`
  - error: route error message
- Result row contents:
  - avatar
  - display name
  - `@username`
- Missing avatar uses first-letter fallback.
- Duplicate display names are handled by always showing `@username`.

## Interaction Handling
- Clicking a result opens `/u/[username]`.
- Dropdown closes on:
  - outside click
  - route change
  - `Escape`
  - result click
- Keyboard behavior:
  - `ArrowDown` / `ArrowUp` cycles results
  - `Enter` opens the active result

## Edge Cases Handled
- empty query
- whitespace-only query
- query too long
- duplicate display names
- missing avatar
- no results
- loading state
- network/server error state
- special character input

## Visibility And Exclusions
- Search only returns rows visible through current public profile access rules.
- No extra private profile fields are exposed.
- There is no separate disabled/deleted/private-profile flag currently filtered here beyond existing public visibility and RLS behavior.
- Current user may appear in results if their public profile matches the query.

## Future Improvements
- mobile-specific search affordance
- highlighted query matches
- rank/hero preview in results if needed
- server-backed persistent rate limiting instead of in-memory throttling
- explicit exclusion rules if disabled/private profile states are added to schema
