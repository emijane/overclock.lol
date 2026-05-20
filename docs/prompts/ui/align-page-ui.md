Read these first:

- `AGENTS.md`
- `docs/README.md`
- `docs/agents/QA.md`
- `docs/agents/UI_AGENT.md`
- `docs/ui/UI_COMPONENT_STRUCTURE_AUDIT.md`
- `docs/ui/UI_COMPONENT_REGISTRY.md`
- `docs/ui/UI_DECISION_RULES.md`

Task:

- Align `[target page file path]` with the current overclock.lol UI system.

Constraints:

- Reuse existing page and component patterns before creating new ones.
- Match the closest source-of-truth page from the UI audit.
- Reuse existing `oc-*` classes and shared shell primitives.
- Reuse `overclock/components/app-shell/dark-page-shell.tsx` if the page matches the account/login/legal/matches dark atmosphere pattern.
- Preserve current server/client boundaries.
- Preserve dark-first styling.
- Avoid new page backgrounds.
- Avoid duplicate dropdowns, buttons, and action menus.
- Do not rename unrelated components.
- Do not refactor architecture unless explicitly requested.
- Keep route-owned UI route-owned unless reuse clearly crosses boundaries.

Deliverables:

- Update the target page UI
- Mention the source-of-truth files you followed
- Mention any remaining duplicated UI worth extracting later

QA checklist:

- Mobile layout checked first
- `sm`, `md`, and `xl` layout checked where relevant
- Typography matches shipped patterns
- Cards/panels use existing surface treatments
- No duplicate action/dropdown component introduced
- No server/client boundary regression introduced
- `npm run verify` run when project-file changes require standard validation
