# Information architecture

Plan both sites from the codebase map. The lists below show common shapes, not a fixed menu. Add a section for each real area of this codebase. Drop a section the code has no use for.

## Agent site (`internal-agent-docs`)

The agent site answers "which file, which symbol, which rule, which command" for a change an agent is about to make.

Start page `docs/index.md`: the task router.

- A short header: the code wins over the page, paths are repo-relative, and root `AGENTS.md` holds the binding rules.
- "Before any task": root and nested `AGENTS.md`, the runbooks index, and the page for the task.
- A table: "You are about to…" mapped to the pages to read. One row per common change: add a route, change the schema, add an integration, change prices, add a page, and so on.
- The product scope in a few lines, with a link to the full scope page.

Typical sections (numbered folders, two digits):

| Section | Content |
| --- | --- |
| `01-repo` | workspace map, commands, code placement, codegen, lint and format, testing, scripts, the docs sites themselves |
| one section per backend layer | server and routes, services, data access rules |
| `<nn>-database` | schema by table, migration flow, cache and queue keys |
| one section per product area | each feature: owner files, data, flow, numbers, failure paths, tests, change recipes |
| `<nn>-integrations` | each third-party service: client, settings, limits, failure handling |
| `<nn>-web` | routes, data ownership, forms, design system, UI kit |
| `<nn>-ops` | environments and settings, deploy, logging, tracing, local development |
| `<nn>-reference` | dated records: research, audits, competitor notes, design history, product scope |
| `<nn>-runbooks` | the index page and one page per runbook |

Agent page shape:

- One line of purpose.
- Owner files and symbols, as a table or a list with paths.
- Invariants and rules, as short bullets. Each rule says what breaks if you ignore it.
- The flow, as numbered steps with the file that runs each step.
- Numbers and settings, with the file that defines them.
- Change recipes: "To add a new X: 1… 2… 3…", with every file to touch.
- Tests: file names and the command to run one.
- Links to related agent pages.

## Human site (`internal-human-docs`)

The human site answers "how does this work, why, what does it cost, and what can go wrong" for the owner.

Start page `docs/index.mdx`:

- What the product is today, in a few paragraphs.
- One system diagram.
- A table of the sections with one line each.
- A note that the code wins, and the date the pages were checked.

Typical sections:

| Section | Content |
| --- | --- |
| `01-product` | what it is, user journeys, scope and roadmap |
| `02-system` | architecture, request path, data stores, the repository |
| one section per product area | the flow from the user's view and the system's view, the numbers, the edge cases |
| `<nn>-money` | plans, prices, usage, payments, cost controls, operations |
| `<nn>-protection` | abuse, limits, security posture |
| `<nn>-operations` | environments, deploy, logging, local development, operator commands |
| `<nn>-quality` | testing, audits, known risks |
| `<nn>-research` | summaries of research and competitor notes, linked to the agent records |
| `glossary` | each product and technical term, one or two lines |

Human page shape:

- What it is and why it exists.
- The flow as a story, with a Mermaid diagram where steps branch or cross systems.
- Every number with its meaning ("a file upload stops at 25 MB, because…").
- What the user sees, including errors.
- What can go wrong, and what the owner does then.
- Costs and risks.
- Where the code lives, as a short line at the end. The agent site holds the detail.

## Pairing

Each product area has a page in both sites. The pages describe the same facts at different depth. When you add an area, add both pages, a row in the agent task router, and a row in the human start page table.

## Runbooks

Runbooks live only in the agent site, in their own section. The human site can name them in its operations pages, by repo path. See [migration.md](migration.md#runbooks).
