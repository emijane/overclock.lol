# Duos UI Updates

This note captures the currently shipped Duos UI direction across:

```text
/duos
/duos/create
```

It exists so future polish work starts from the current codebase instead of
older composer experiments.

## Current Feed Shape

The Duos surface is browse-first.

Current top-level behavior:

- `/duos` focuses on discovery, filtering, and card browsing
- post creation lives on the dedicated `/duos/create` route
- top-level section switching belongs in the global authenticated header, not
  inside the feed itself

Current header shape on `/duos`:

- large `/ Duos` heading
- no inline "LFG Channel" eyebrow
- Duos feed search
- compact first-pass filter bar below the header

## Current Create Page Shape

The current create route is intentionally narrower and more editorial than the
feed.

Current top-level behavior:

- breadcrumb back to `/duos`
- heading of `/ Create a Post`
- no feed search bar
- no "LFG Channel" eyebrow
- no extra description copy

The current composer uses:

- one main surface
- lighter action chrome
- quieter section labels
- denser spacing than earlier card-within-card drafts

## Current Composer Layout

The shipped create form currently reads like:

```text
breadcrumb
/ Create a Post

Post title                        [Edit profile] [Manage posts]
[title input]

Queue
[Competitive] [Quick Play]

Role
[Tank] [DPS] [Support]

Looking for
[Tank] [DPS] [Support] [All]

Posting as Rank Division Role / Region Timezone
[hero icons]
                                     [Create post]
```

Important current styling notes:

- selected queue and role states use neutral white tones rather than blue
- role icons are white
- the create button is subtle dark UI, not a bright CTA
- the selected-role summary is lightweight and no longer uses a repeated status strip
- hero icons no longer use extra borders in the composer summary

## Current Card Direction

Duos post cards currently:

- reuse the shared LFG card structure
- stay flat, without hover parallax
- include a placeholder `Invite to play` button in the bottom-right corner
- show presence, badges, rank snapshot, role, and hero pool

## Current Loading Direction

The Duos feed does not currently use a custom spinner-first loading experience.

Current behavior:

- no special spiral loader
- no staged feed-card entrance animation
- real cards simply render when the route resolves

The create page and Competitive Profile page do use subtle page-entry motion,
but the Duos feed itself is intentionally calmer right now.

## Design Principles To Preserve

When iterating on Duos UI, preserve these current choices:

- browse-first feed structure
- dedicated create route
- lighter, editorial composer styling
- minimal repeated labels and eyebrow text
- strong separation between feed browsing and post authoring

## Follow-Up Ideas

Useful future polish work:

- replace the placeholder `Invite to play` button with a real flow
- refine mobile spacing for the search + filters stack
- add clearer feed empty-state language for heavily filtered results
- add notification-driven entry points once notifications exist beyond the
  current placeholder bell icon
