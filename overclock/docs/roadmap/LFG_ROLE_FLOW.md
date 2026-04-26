# Competitive Profile and LFG Flow

This note captures the intended competitive profile and LFG model for the
current product scope: Overwatch role queue identity used across ranked and
quick play LFG posts.

## Product Scope

The current LFG experience supports both ranked and quick play posts for Duos
and Stacks. A player's competitive identity should still be based on the role
they play, the rank they have on that role, and their hero pool for that role.

LFG sections such as Duos, Stacks, Teams, and Scrims are posting contexts. They
should not require separate registration.

## Competitive Profile

The old Hero Pools page has been folded into Competitive Profile. Instead of
only managing heroes, this page is the source of truth for:

```text
What roles does this player actually play?
What rank are they on each role?
What heroes do they play on each role?
Which role is their main competitive identity?
```

The page should read as a lightweight preferences and setup layer, not as the
place where users actively create LFG posts. Its preferences can prefill future
LFG/LFD post composers, while role setup controls which playable competitive
identities are available when posting.

Recommended route:

```text
/account/competitive
```

The old `/account/hero-pools` route redirects here for existing links.

## Core Model

A user registers per role, not per LFG page.

Example:

```text
Main role: Support
Support rank: Champion 3
Support hero pool: Ana, Kiriko, Juno

Optional off-role: DPS
DPS rank: Diamond 4
DPS hero pool: Cassidy, Ashe, Tracer

Tank: not listed
```

Once the user has registered Support, they can use that Support identity across
all LFG sections:

```text
Duos
Stacks
Teams
Scrims
```

They should not be forced to register Tank or DPS unless they want to post,
appear, or apply as those roles.

## Main Rank

A player's headline rank should come from their selected main role, not from a
single global account rank.

This matters because players often identify by their strongest or primary role.
For example, someone may say they are Champion 3 because they are Champion 3 on
Support, even if their Tank and DPS ranks are lower or unset.

Profile and LFG cards should be able to display:

```text
Champion 3 Support
```

instead of:

```text
Champion 3
```

The rank label is clearer when it stays attached to the role it belongs to.

## Registration Rules

- Users can browse LFG pages without registering every role.
- Users register only the roles they actually want to play.
- Each registered role has its own rank.
- One registered role can be marked as the main role.
- The public profile headline rank comes from the main role.
- Registering one role should unlock posting with that role across all supported
  LFG sections.
- If a user tries to post as an unregistered role, prompt them to set up that
  role first.
- Tank, DPS, and Support setup should remain optional and independent.
- Public profiles should only display completed role data.

## Suggested Competitive Profile UI

```text
Competitive Profile

Support
Status: Main role
Rank: Champion 3
Hero pool: Ana, Kiriko, Juno
[Edit]

DPS
Status: Off-role
Rank: Diamond 4
Hero pool: Cassidy, Ashe, Tracer
[Edit]

Tank
Status: Not listed
[Set up]
```

Role setup:

```text
Choose role: Tank / DPS / Support
Choose rank for that role
Pick hero pool for that role
Mark as main role, if desired
Save
Optional: add another role
```

## Suggested LFG Flow

```text
User opens LFG
-> Selects Duos / Stacks / Teams / Scrims
-> Can browse posts

User creates a post
-> Choose LFG section
-> Choose one of their registered competitive roles
-> If no roles are registered:
   prompt Competitive Profile setup
-> If the chosen role is not registered:
   prompt setup for that role
-> Submit post
```

Initial route shells exist at:

```text
/lfg
/duos
/stacks
/scrims
/teams
```

These pages share one LFG architecture but should feel like standalone
community spaces. Category navigation belongs in the global/top navigation, not
as a repeated card row inside every page. Competitive, Unranked, LFG, and LFD
should remain future filters or post-level labels inside these pages, not
separate parent routes or page-level mode switches.

Example post composer state:

```text
Create Duo Post
Mode: Ranked / Quick Play
Posting as: Support - Champion 3
Hero pool: Ana, Kiriko, Juno
[Change role]
```

If the user changes to an unregistered role:

```text
Tank is not in your Competitive Profile yet.
Set Tank rank and hero pool to post as Tank.
```

## Hero Pool Integration

The existing hero pool feature should be reused inside the Competitive Profile.

Hero pools are role-scoped profile data:

```text
profile_hero_pools
- profile_id
- roles: ["support", "dps"]
- hero_picks: {
    support: ["ana", "kiriko", "juno"],
    dps: ["cassidy", "ashe", "tracer"],
    tank: []
  }
```

Competitive profiles store the user's main competitive identity:

```text
competitive_profiles
- profile_id
- main_role: "support"
```

Competitive role profiles store the user's per-role rank:

```text
competitive_role_profiles
- profile_id
- role: "support"
- rank_tier: "Champion"
- rank_division: 3
- enabled: true
- updated_at
```

The main role should be selected from configured role profiles in server actions.
Keeping `main_role` on the parent competitive profile avoids needing multiple
role rows to coordinate which one is primary.

The hero pool table should remain the source of truth for hero selections unless
there is a future migration to merge rank and heroes into one per-role table.
Competitive Profile forms can display or edit the hero pool inline, but they
should save hero picks back to the shared hero pool data rather than storing
duplicate LFG-only hero lists.

## Posting Model

The LFG post stores where the user is posting, which queue mode they want, and
which registered competitive role identity they are using.

Example:

```text
lfg_posts
- profile_id
- lfg_type: "duos"
- game_mode: "ranked" | "quick_play"
- role: "support"
- rank_tier: "Champion"
- rank_division: 3
- body
- status
```

The role and rank can either be snapshotted onto the post when it is created or
resolved from `competitive_role_profiles` when displayed. Snapshotting is usually
easier for historical accuracy because a user's rank may change later.

## Important Distinction

Competitive role registration answers:

```text
"I am a Champion 3 Support player with this hero pool."
```

An LFG post answers:

```text
"I want to use my Champion 3 Support identity in Duos right now, and I want to
queue Ranked or Quick Play."
```

That means `queue_types` are not needed in role registration for the current
scope. Duos, Stacks, Teams, and Scrims belong to posts and browsing surfaces,
not to the user's registered role identity.

## Validation Notes

- Validate role, rank tier, and rank division on the server.
- Validate that `main_role` points to a configured role profile.
- Decide what happens if the main role is disabled or deleted.
- Validate hero picks on the server using the existing hero roster rules.
- Prevent cross-role hero picks, such as selecting Support heroes for a Tank
  pool.
- Enforce the existing hero pool limit consistently.
- Keep auth-sensitive writes in server actions.

## Future Considerations

If the product later supports different ranked modes, casual modes, region
locking, availability windows, or separate scrim-only identities, LFG-specific
preferences may become useful. Until then, role-scoped Competitive Profile data
is simpler and better matches the current 5v5 ranked role queue scope.
