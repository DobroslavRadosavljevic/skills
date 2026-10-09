<!-- codebase-docs:start -->

## Codebase docs

Two private docs sites hold all docs for this repo. There is no other docs folder.

- **Agent docs** (`<AGENT_APP>`, http://localhost:<AGENT_PORT>): the detailed reference for coding agents. Start at [the task router](<AGENT_APP>/docs/index.md). It maps each task to the page with the exact files, symbols, rules, and commands. Read that page before you change an area.
- **Human docs** (`<HUMAN_APP>`, http://localhost:<HUMAN_PORT>): the owner handbook. It explains each flow, number, cost, and risk in prose. It is not a coding reference.
- **Runbooks** ([index](<AGENT_APP>/docs/<RUNBOOKS_SECTION>/index.md)): step-by-step guides for repeated flows. Before a task, follow a matching runbook.

### Keep both docs sites current

Docs are part of every change. Do this without being asked:

- Update the docs in the same change as the code. A task is not done while a docs page still describes the old behavior.
- Agent docs: update the page that owns the area. Keep its files, symbols, contracts, invariants, numbers, settings, commands, and tests correct.
- Human docs: update the matching page when the change alters what the owner must know. This includes a product flow, user-visible behavior, a number (limit, price, timeout, retention), a third-party service, a cost, a risk, or a manual operation.
- New feature, integration, provider, service, app, package, data store, or major flow: add a new page or section to both sites. Add a row for it to the agent task router and to the human start page.
- Removed or replaced behavior: delete or rewrite the old text in the same change. Do not leave "old" or "deprecated" notes behind.
- Repeated multi-step flow: add or fix a runbook. After you follow a runbook to the end and it works, set its `last-verified` date to today.
- Write from the code, not from memory, plans, or old notes. Check each path, name, and number. Label planned work "Planned".
- Never put secrets, tokens, personal data, or session data in docs. Name env vars only.
- Do not add docs anywhere else: no new docs folder, notes file, or long README section. Root `README.md` stays a short setup page.
- Agent pages use relative `.md` links to other agent pages. Write repo files as inline code paths, because links outside a site's `docs/` folder fail validation.
- Never hand-edit generated pages or the `.blume/` folders.
- Validate after each docs change: <VALIDATE_COMMANDS>. Also run <RUNBOOKS_CHECK_COMMAND> after a runbook change.
- In your final report, list the docs pages you changed. If no page needed a change, say why.

<!-- codebase-docs:end -->
