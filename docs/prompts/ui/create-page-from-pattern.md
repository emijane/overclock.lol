Read these first:

- `AGENTS.md`
- `docs/README.md`
- `docs/agents/QA.md`
- `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md`
- `docs/ui/UI_COMPONENT_REGISTRY.md`
- `docs/ui/UI_DECISION_RULES.md`

Task:

- Create `[new page / route / section]` using the closest existing overclock.lol UI pattern.

Requirements:

- Choose the closest source-of-truth page before writing JSX.
- State which page pattern you are following:
  - feed page
  - settings page
  - profile section
  - management panel
- Reuse shared shell primitives, shared actions, and existing `oc-*` styles.
- Preserve dark-first styling.
- Avoid inventing a new background or visual direction.
- Keep the route focused on orchestration and import shared UI where possible.
- Do not rename unrelated components.
- Do not refactor unrelated code.

Deliverables:

- Implement the new page or section
- Mention the source-of-truth files used
- Mention any UI that should later be extracted if reuse is still partial

QA checklist:

- Page matches the chosen source-of-truth pattern
- Mobile-first layout verified
- `sm`, `md`, and `xl` behavior verified where relevant
- Existing shared actions/dropdowns reused where applicable
- Existing typography and surface classes reused
- No unnecessary wrapper or duplicate component introduced
