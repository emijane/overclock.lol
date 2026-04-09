# Local Agent Guide

This file is a local working note for coding agents and should not be committed.

## Documentation

- Keep documentation accurate to the current codebase.
- Update docs when behavior, setup steps, or architecture meaningfully change.
- Prefer concise, practical documentation over vague summaries.
- When introducing new flows, include the minimum needed context for future maintenance.

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
