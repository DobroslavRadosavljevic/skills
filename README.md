# Agent Skills

Personal agent skills I use in development workflows.

These are plain skill folders. Each skill has a `SKILL.md` entrypoint and may include focused references, scripts, assets, or product-specific metadata. The skill instructions are written to be usable across agent harnesses instead of depending on one tool.

## Skills

| Skill | Purpose |
| --- | --- |
| `base-ui` | Build, review, migrate, or debug React UIs with Base UI primitives. |
| `better-auth` | TypeScript auth with better-auth, official plugins, adapters, and security. |
| `brainstorm` | Explore ideas, plans, research, and codebase questions in a read-only session. |
| `bullmq` | Build, review, debug, operate, or migrate BullMQ Redis job queues. |
| `bun` | Bun runtime, package manager, test runner, bundler, bunfig, and Node compat. |
| `clickhouse` | ClickHouse OLAP from TypeScript: @clickhouse/client, MergeTree, ingest, and Cloud. |
| `compound-ui` | Build or refactor React UI into shadcn-style compound components. |
| `d3` | D3.js visualizations: scales, shapes, selections, layouts, geo, and React interop. |
| `drizzle-orm` | Drizzle ORM 1.0 RC (not 0.x): schema, RQBv2, kit, seed, validators, and Effect drivers. |
| `effect` | Build, review, debug, migrate, or plan Effect v4 TypeScript code. |
| `elysia` | Build, review, debug, test, and deploy Elysia applications with current docs. |
| `evlog` | Build, review, debug, configure, or migrate evlog wide-event TypeScript logging. |
| `handoff` | Produce or consume agent-to-agent handoff context so another session can resume work. |
| `intlayer` | Build, review, configure, or debug Intlayer v9 i18n in TanStack Start React apps. |
| `jsdoc` | Purposeful JSDoc for complex or non-obvious TypeScript; no type-echo or narration. |
| `kafka` | Apache Kafka from TypeScript: prefer @platformatic/kafka, topics, and delivery semantics. |
| `legend-state` | Build, review, migrate, and debug Legend-State v3 observable, React, persistence, and sync systems. |
| `loop` | Implement, review, fix, and repeat until no actionable review issues remain. |
| `motion` | Motion for React (`motion/react`) plus product UI motion design, a11y, and performance. |
| `oxfmt` | Full Oxfmt usage guide plus setup, Prettier migration, and CI formatting. |
| `oxlint` | Full Oxlint usage guide plus setup, rules/plugins, type-aware lint, and ESLint migration. |
| `permix` | Type-safe Permix permissions: setup/check, SSR, React/Next, and server middleware. |
| `plain-language` | Always-on clear explanations and readable naming; technical depth only when needed. |
| `playwright` | Build, review, debug, configure, or plan Playwright E2E tests and browser automation. |
| `react` | Build, review, debug, migrate, or plan React apps with current React docs. |
| `research` | Investigate external sources and codebase evidence before recommending next steps. |
| `ship-product` | Build a paid fullstack TanStack Start product from scratch with need-based stack and an env testing gate. |
| `simplify-layout` | Shorten file and folder names and group related modules so paths stay scannable. |
| `storybook` | Build, review, debug, configure, migrate, or plan Storybook 10 UI workshops. |
| `subagents` | Split harder work into safe disjoint lanes and coordinate subagent results. |
| `tailwind` | Build, review, debug, configure, or migrate Tailwind CSS projects. |
| `tailwind-variants` | Build, review, debug, migrate, or plan Tailwind Variants class recipes. |
| `tanstack-charts` | Build, review, debug, migrate, or plan TanStack Charts visualizations. |
| `tanstack-form` | Build, review, debug, migrate, or plan TanStack Form React forms. |
| `tanstack-hotkeys` | Build, review, debug, migrate, or plan TanStack Hotkeys shortcut systems. |
| `tanstack-query` | Build, review, debug, migrate, or plan TanStack Query server-state code. |
| `tanstack-router` | Build, review, debug, configure, migrate, or plan TanStack Router apps. |
| `tanstack-start` | Build, review, debug, configure, migrate, or plan TanStack Start apps. |
| `tanstack-store` | Build, review, debug, migrate, or plan TanStack Store state management. |
| `tanstack-table` | Build, review, debug, migrate, or plan TanStack Table React tables. |
| `testcontainers` | Build, review, debug, configure, or plan Testcontainers integration tests with real Docker dependencies. |
| `tsdown` | Rolldown library bundler: config, dts, exports, deps, watch/unbundle, and tsup migration. |
| `turborepo` | Full Turborepo usage guide plus tasks, caching, filters, prune/Docker CI, and monorepo integrations. |
| `ultraplan` | Ask detailed planning questions, recommend answers, and produce a precise implementation plan before work starts. |
| `unslop-code` | Strip AI-looking code fingerprints and rework implementation to match problem scale. |
| `unslop-copywriting` | Rewrite public UI copy into plain language and remove robotic or leaked-internal text. |
| `unslop-docs` | Rewrite README/docs into plain, verifiable guidance and remove generated-docs slop. |
| `unsmell` | Find and fix maintainability problems across a codebase or scoped area. |
| `visx` | Airbnb visx React+D3 visualization primitives, XYChart, and v3→v4 migration. |
| `vite` | Vite 8 tooling: config, Rolldown/Oxc builds, plugins, SSR, and v7→v8 migration. |
| `vitest` | Vitest 4 testing: config, mocks, coverage, browser mode, projects, and Jest/v3 migration. |
| `zod` | Build, review, debug, migrate, or plan Zod v4 validation and schema code. |

## Install With skills.sh

The [skills.sh](https://www.skills.sh/) CLI can install skills from GitHub repos, URLs, or local paths.

From this checkout:

```bash
bunx skills add .
```

Install skills directly from the GitHub repo:

```bash
# List available skills without installing
bunx skills add DobroslavRadosavljevic/skills --list

# Install one skill
bunx skills add DobroslavRadosavljevic/skills --skill loop

# Install multiple skills
bunx skills add DobroslavRadosavljevic/skills --skill loop --skill ultraplan

# Install all skills from the repo
bunx skills add DobroslavRadosavljevic/skills --skill '*'
```

Useful options:

- `-g, --global`: install globally instead of into the current project.
- `-a, --agent <name>`: install for a specific agent, such as `codex` or `claude-code`.
- `--copy`: copy files instead of symlinking them.
- `-y, --yes`: skip prompts.
- `--all`: install all skills to all supported agents without prompts.

Example:

```bash
bunx skills add DobroslavRadosavljevic/skills --skill motion -a codex -g
```

## Skill Conventions

- Skill folder names are lowercase with hyphens.
- `SKILL.md` frontmatter contains only `name` and `description`.
- `description` explains both what the skill does and when it should trigger.
- Long or detailed guidance goes in `references/` and is linked from `SKILL.md`.
- Scripts and assets are included only when the skill actually uses them.
- Prefer `bun` / `bunx` in command examples over `npm` / `npx`.
- Individual skill folders do not have their own README files.
- Skills stay isolated: no mentions of or dependencies on other skills inside a skill folder.

## License

[MIT](LICENSE)
