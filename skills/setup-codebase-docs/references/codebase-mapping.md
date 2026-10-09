# Codebase mapping

The docs are only as deep as your reading of the code. Map the whole codebase before you plan pages. Write down facts with their file paths, so each page cites real code.

## How to read

- Start at entry points and follow the calls: servers, route tables, CLI commands, workers, cron jobs, queue consumers, webhooks, and UI routes.
- Read the data model first: schemas, migrations, ORM models, and stored files. Most flows are easier once you know the tables.
- Read the config next: env schemas, `.env.example`, feature flags, constants, limits, and price tables. Most numbers live there.
- Read tests for behavior that is hard to see in code: edge cases, failure handling, and the expected numbers.
- Read the deploy config: Dockerfiles, platform config files, CI workflows, and infrastructure code.
- Use git history (`git log --stat`, recent commit messages) to find areas that change often and recent decisions.
- Read old docs, plans, and code review notes only as leads. Check each claim in the code.

## What to capture per area

For each product area, service, or package, record:

| Item | Examples |
| --- | --- |
| Purpose | What it does for the user or the system |
| Entry points | Routes, handlers, commands, jobs, UI screens |
| Owner files | The main files and symbols, with paths |
| Data | Tables, columns, statuses, indexes, stored files, cache keys |
| Flow | The steps from trigger to result, including async and retries |
| Numbers | Limits, timeouts, sizes, prices, quotas, intervals, retention |
| Calculations | Formulas for money, usage, scores, and rankings, with rounding |
| Integrations | Third-party APIs, SDKs, webhooks, and what fails when they fail |
| Settings | Env var names, defaults, and where they are read |
| Failure paths | Errors, status codes, fallbacks, and what the user sees |
| Security | Auth checks, access rules, rate limits, and secrets handling |
| Tests | Which tests cover it, and how to run one |
| Commands | Scripts and operator commands for the area |
| Open issues | TODOs, known bugs, and conflicts with old docs |

## Areas to check in every repo

Skip an area only when the code has nothing for it. Then state that in the report.

- Product scope: what exists, what is planned, and what is out of scope.
- System shape: apps, services, packages, runtimes, and how requests move.
- Accounts: sign-up, sign-in, sessions, roles, tenants, and account deletion.
- Each core feature, from the first user action to the last stored row.
- Data stores: databases, caches, queues, object storage, and search indexes.
- Background work: jobs, schedules, workers, and cleanup.
- Money: plans, prices, metering, payments, refunds, and cost controls.
- Abuse and limits: rate limits, quotas, bot defense, and validation.
- Messages: email, push, SMS, and webhooks out.
- Third-party services: each one, its use, its settings, and its failure mode.
- Frontend: routes, state, data fetching, the design system, and accessibility.
- Observability: logs, traces, metrics, alerts, and error tracking.
- Environments, settings, and deploy: each environment, each setting, and each deploy step.
- Local development: setup, ports, seed data, test accounts, and dev tools.
- Quality: tests, lint rules, architecture checks, and code generation.
- Repo conventions: code placement, naming, and the rules in `AGENTS.md`.

## Scale

Big repos need many passes. Go area by area, and write each area's pages before the next area, so the facts are fresh. Mark each area in the progress file: mapped, agent page done, human page done, verified.

Do not stop at a summary. If a flow has six steps and three failure paths, the agent page names all of them with their files. The human page explains all of them in prose.
