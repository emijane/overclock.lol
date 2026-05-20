Read these first:

- `AGENTS.md`
- `docs/README.md`
- `docs/agents/QA.md`
- `docs/agents/UI_AGENT.md`
- `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md`
- `docs/ui/UI_COMPONENT_REGISTRY.md`
- `docs/ui/UI_DECISION_RULES.md`

Task:

- Extract a reusable UI component from `[source files / pattern description]`.

Constraints:

- Confirm the pattern exists in multiple places before extracting it.
- Audit the existing call sites first and pick the ownership boundary before moving JSX.
- Preserve server/client boundaries.
- Preserve the current dark-first visual language.
- Reuse existing `oc-*` classes instead of restyling the pattern.
- Avoid introducing a wrapper that only renames an existing component.
- Keep ownership boundaries clear: shared primitives in shared component space, route orchestration in route files.
- Keep small duplication inside one route group route-owned when cross-route reuse is not proven.
- Reuse existing patterns such as `overclock/components/app-shell/dark-page-shell.tsx` or `overclock/app/account/components/settings-toggle-card.tsx` when they already solve the duplication.
- Do not rename unrelated files.
- Do not refactor unrelated behavior.

Deliverables:

- Extract the reusable component
- Update the relevant call sites
- Mention the exact files changed
- Explain why the extraction point is appropriate

QA checklist:

- Extracted component matches previous visual output
- No new duplicate dropdown/action/menu created
- No server/client boundary regression
- Mobile layout still correct
- Existing source-of-truth pattern still readable after extraction
- `npm run verify` run when project-file changes require standard validation
