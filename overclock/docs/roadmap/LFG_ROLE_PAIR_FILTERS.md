# LFG Role Pair Filters

This note captures the current first-pass design for connecting:

- the role a player is posting as
- the role or roles they are looking for

It exists so shipped behavior and future filter work can build on the current
LFG post model without collapsing two different role concepts into one.

## Current Data Model

LFG posts now carry two separate role signals:

- `posting_role`
- `looking_for_roles[]`

These mean different things.

### Posting Role

`posting_role` answers:

```text
What role is this player queueing as?
```

Examples:

- Support player posting for Duos
- Tank player posting for Stacks
- DPS player posting for Teams

This is the author's role identity for that post.

### Looking For Roles

`looking_for_roles[]` answers:

```text
What role or roles does this player want teammates to fill?
```

Examples:

- Support player looking for DPS
- Tank player looking for Support
- DPS player looking for Tank or Support

This is the demand side of the post, not the author's own role.

## Why The Filters Should Stay Separate

These values should not be merged into one generic "Role" filter because they
describe different parts of the matchmaking relationship.

If they are collapsed together, the feed loses an important distinction:

- who the poster is playing
- who the poster wants to find

That distinction is exactly what makes LFG posts useful.

## Current Filter Model

The current first-pass shape is:

- `Role`
- `Needs`

Both should be optional and independent.

### Role

This filters by:

```text
post.posting_role
```

Options:

- `Any`
- `Tank`
- `DPS`
- `Support`

### Needs

This filters by:

```text
selected_role in post.looking_for_roles
```

Options:

- `Any`
- `Tank`
- `DPS`
- `Support`

Even though posts store an array for `looking_for_roles`, the filter should
stay a single-select control in the current version. That keeps the browsing
experience fast and easy to understand.

## Match Behavior

The intended query behavior is:

- If only `Role` is selected, filter on `posting_role`
- If only `Needs` is selected, filter on whether the selected role is
  contained in `looking_for_roles`
- If both are selected, require both conditions

Example:

```text
Role = Support
Needs = DPS
```

This should return:

- Support players
- whose post is looking for DPS

That is the most useful connection between the two role fields.

## Why This Is Better Than A Matrix First

It may be tempting to build a combined role-pair UI immediately, such as:

- `Support -> DPS`
- `Tank -> Support`
- `DPS -> Tank`

But that should not be the first shipped version.

Reasons:

- harder to scan
- more UI surface area
- more query-state combinations
- less flexible than two simple controls

Two independent role filters give most of the product value with much less
complexity.

## Current UI Language

Current filter labels:

- `Role`
- `Needs`

Current concise examples:

- `Support`
- `DPS`
- `Support + DPS`

This keeps the language short, readable, and clear about the difference between
poster identity and target role.

## Rollout Order

Recommended implementation order:

1. Keep the existing `posting_role` filter behavior.
2. Add `looking_for_roles` support to feed queries.
3. Add a second role filter control for target role.
4. Support combining both filters together.
5. Observe whether this is enough before designing richer role-pair presets.

Current status:

- Steps 1 through 4 are now shipped on the current first-pass filtered
  sections.
- The current follow-up question is whether the simple `Role` + `Needs` model
  is enough before adding more complexity.

## Current Coverage

The current first-pass connected role filters are available on:

- `/duos`
- `/stacks`

They are not yet available on:

- `/teams`
- `/scrims`

## Scope Guardrails

This roadmap note is only about browsing filters.

It does not require:

- composer changes beyond current stored `looking_for_roles`
- exact-rank matchmaking logic
- recommendation systems
- automatic partner matching
- new Duos-only or Stacks-only schemas

## Future Extensions

If the simple two-filter model proves useful, later versions could add:

- role-pair presets
- "around my role needs" shortcuts
- "show posts looking for my role" personalization
- section-specific defaults for Duos vs Stacks vs Teams

Those should come after the basic connected filter model is validated.
