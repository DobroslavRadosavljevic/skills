# PROJECT.md Template

Fill for the target repo. Omit sections that do not apply. Prefer concrete paths and commands.

````markdown
# PROJECT

Overview of what this project is and how the codebase maps to it.

## One-liner

<What it is, for whom, and the primary outcome.>

## Problem and promise

- **Problem:** <pain / job to be done>
- **Promise:** <what success looks like for the user>
- **Non-goals:** <explicitly out of scope>

## Users and use cases

- **Primary users:** <roles>
- **Primary flows:** <3–7 critical journeys>
- **Secondary users / surfaces:** <admin, ops, partners, etc.>

## Product surfaces

| Surface | Path / entry | Notes |
| --- | --- | --- |
| <Web app> | `<path or URL>` | <...> |
| <API> | `<path>` | <...> |
| <Worker / jobs> | `<path>` | <...> |

## Stack

- **Languages / runtimes:** <...>
- **Frameworks:** <...>
- **Data / infra:** <DBs, queues, storage, auth providers>
- **Notable libraries:** <only the ones that define the system>

## Repository map

Describe the top-level layout as a bullet list or indented tree (apps/, packages/, src/, etc.).

| Area | Path | Owns |
| --- | --- | --- |
| <domain> | `<path>` | <responsibility> |

## How it runs

- **Install:** `<command>`
- **Dev:** `<command>`
- **Test:** `<command>`
- **Build / deploy:** `<command or pipeline>`
- **Required env (names only):** `VAR_A`, `VAR_B`

## Data and integrations

- **Own data:** <stores, schemas location>
- **External services:** <name + purpose>
- **Auth / tenancy model:** <brief>

## Current stage and constraints

- **Stage:** prototype | beta | production
- **Hard constraints:** <compliance, perf, platforms, deadlines>
- **Known sharp edges:** <things agents routinely break>

## Roadmap snapshot (optional)

- Now: <...>
- Next: <...>
- Later / ideas: <...>

## Glossary

| Term | Meaning in this project |
| --- | --- |
| <term> | <definition> |

## Sources

- Repo: `<paths>`
- User-provided context: <summary>
- Live links: <URLs>
- Open questions: <list>
````
