Read these first:

- `AGENTS.md`
- `docs/README.md`
- `docs/agents/QA.md`
- `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md`
- `docs/ui/UI_COMPONENT_REGISTRY.md`
- `docs/ui/UI_DECISION_RULES.md`

Task:

- Extract a reusable UI component from `[source files / pattern description]`.

Requirements:

- Confirm the pattern exists in multiple places before extracting it.
- Preserve server/client boundaries.
- Preserve the current dark-first visual language.
- Reuse existing `oc-*` classes instead of restyling the pattern.
- Avoid introducing a wrapper that only renames an existing component.
- Keep ownership boundaries clear: shared primitives in shared component space, route orchestration in route files.
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
