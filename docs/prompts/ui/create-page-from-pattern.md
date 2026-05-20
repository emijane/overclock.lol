Read these first:

- `AGENTS.md`
- `docs/README.md`
- `docs/agents/QA.md`
- `docs/agents/UI_AGENT.md`
- `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md`
- `docs/ui/UI_COMPONENT_REGISTRY.md`
- `docs/ui/UI_DECISION_RULES.md`

Task:

- Create `[new page / route / section]` using the closest existing overclock.lol UI pattern.

Constraints:

- Choose the closest source-of-truth page before writing JSX.
- State which page pattern you are following:
  - feed page
  - settings page
  - profile section
  - management panel
- Reuse shared shell primitives, shared actions, and existing `oc-*` styles.
- Reuse `overclock/components/app-shell/dark-page-shell.tsx` for new pages in the repeated dark centered-panel family.
- Reuse `overclock/app/account/components/settings-toggle-card.tsx` for account-route-owned toggle rows instead of copying them.
- Preserve dark-first styling.
- Avoid inventing a new background or visual direction.
- Keep the route focused on orchestration and import shared UI where possible.
- Do not promote route-owned UI into shared component space until reuse clearly crosses boundaries.
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
- `npm run verify` run when project-file changes require standard validation
