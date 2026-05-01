# Local Agent Guide

This file is a local working note for coding agents and should not be committed.

## Documentation

- Keep documentation accurate to the current codebase.
- Update docs when behavior, setup steps, or architecture meaningfully change.
- Prefer concise, practical documentation over vague summaries.
- When introducing new flows, include the minimum needed context for future maintenance.
- Read `docs/roadmap/PROJECT_CONTEXT_ROADMAP.md` before making substantial product or architecture changes, and keep it updated as the app evolves.

## Roadmap Doc Map

- `docs/roadmap/PROJECT_CONTEXT_ROADMAP.md` - Start here for current product shape, route map, architecture notes, gaps, and broad roadmap direction.
- `docs/roadmap/LFG_ROLE_FLOW.md` - Use when working on future LFG surfaces, role-based posting contexts, hero pools, duos, stacks, teams, or scrims.
- `docs/roadmap/LFG_POST_LIFECYCLE_POLICY.md` - Use when working on LFG post states, close behavior, expiry rules, or lifecycle decisions across posting surfaces.
- `docs/roadmap/LFG_POST_LIMITS_EXPLAINED.md` - Use when working on posting limits, anti-spam constraints, or explaining why LFG creation rules exist.
- `docs/roadmap/ACCOUNT_POSTS_PAGE.md` - Use when working on the private `/account/posts` management surface for active, closed, or expired LFG posts.
- `docs/roadmap/DUOS_FILTERS.md` - Use when working on server-rendered filtering, query shape, or first-pass browsing controls for `/duos`.
- `docs/roadmap/DUOS_UI_UPDATES.md` - Use when working on duos page structure, Competitive Profile presentation, or related UI direction.
- `docs/roadmap/RANK_VERIFICATION_SYSTEM.md` - Use when working on rank trust, verification status, reviewer flows, high-rank claims, or badge display.
- `docs/roadmap/PUBLIC_PROFILE_PERFORMANCE.md` - Use when working on `/u/[username]` performance, public profile auth checks, public read RLS assumptions, or profile query shape.

## Coding Standards

- Preserve existing project structure and naming unless there is a clear reason to improve it.
- Follow current Next.js App Router conventions and keep route-related code colocated with its route segment when practical.
- Split large route files into smaller components, helpers, or actions once a file starts carrying multiple responsibilities.
- Remove stale components and exports when a feature direction changes so the route tree stays easy to scan.
- Prefer small, readable components and server-side validation for sensitive flows.
- Keep auth, profile creation, and other trust-sensitive logic on the server.
- Favor explicit, maintainable code over clever abstractions.
- Add comments only when they save future readers time.
- Run lightweight verification after changes when possible.

## Maintenance Direction

- Preserve the current split-component structure.
- Prefer small route-local components, hooks, and helpers over large all-in-one files.
- Extend extracted profile edit modules instead of rebuilding inline form logic.
- Keep profile editing centralized in the public profile modal unless product requirements change.
- Reuse centralized query/select helpers and validation helpers instead of reintroducing duplication.
- If a file starts growing across multiple responsibilities, split it before adding more behavior.

## Safety

- Do not perform destructive actions without checking with the user first.
- This includes deleting files, resetting git state, rewriting history, dropping data, or making irreversible schema changes without confirmation.
- If an action has hidden risk or non-obvious consequences, pause and confirm first.
- Never expose secrets, service-role credentials, or other sensitive values in client code.

## Collaboration

- Work in baby steps when requested and return after each meaningful step.
- Include a suggested commit message with each update.
- Offer user steps to QA and test update before continuing with further instructions.
- Call out assumptions clearly when proceeding without explicit user input.
