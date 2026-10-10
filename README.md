# Agent Skills

Personal agent skills I use in development workflows.

These are plain skill folders. Each skill has a `SKILL.md` entrypoint and may include focused references, scripts, assets, or product-specific metadata. The skill instructions are written to be usable across agent harnesses instead of depending on one tool.

## Skills

| Skill | Purpose |
| --- | --- |
| `agents-md` | Create, review, or enforce AGENTS.md with commands, boundaries, required ASD-STE100 communication, and E2E/integration-first testing rules. |
| `ai-sdk` | Vercel AI SDK 7 TypeScript: Core, UI, agents, harnesses, tool search, batches, evaluation, Gateway, multimodal, and v5–v7 migrations. |
| `base-ui` | Build, review, migrate, or debug React UIs with Base UI 1.8 primitives. |
| `better-auth` | TypeScript auth with better-auth 1.7 (≥1.7.7 security baseline), official plugins, adapters, and security. |
| `blume` | Blume 2.2 Markdown-first docs sites on Astro: config, MDX, navigation, search, llms.txt/MCP, API references, i18n, CLI, deploy, v1→v2 upgrade, and migration. |
| `brainstorm` | Explore ideas, plans, research, and codebase questions in a read-only session. |
| `bullmq` | Build, review, debug, operate, or migrate BullMQ 6 Redis/Postgres job queues. |
| `bun` | Bun 1.4 runtime, package manager, test runner, bundler, bunfig, and Node compat. |
| `clickhouse` | ClickHouse OLAP from TypeScript: @clickhouse/client, MergeTree, ingest, and Cloud. |
| `clone-to-temp` | Manual-only: fetch repos and datasets into ignored `.temp/` for read-only inspection (never run or install). |
| `codex-image-gen` | Generate or edit images through the Codex CLI built-in image tool always on gpt-6-luna (no API key). |
| `compound-ui` | Build or refactor React UI into shadcn-style compound components. |
| `copywriting` | Simple visitor copy for sites, apps, and docs. STE for technical text. Bans jargon and model words. |
| `crawlee` | Build, scale, and deploy Crawlee 3.18 scrapers: crawler choice, routers, storage, sessions, proxies, anti-blocking, Docker, Apify, and v4 migration. |
| `create-durable-plan` | Advanced durable plan packs under `plans/<date-slug>`: graph, contracts, evidence, file recipes. |
| `d3` | D3.js visualizations: scales, shapes, selections, layouts, geo, and React interop. |
| `date-fns` | date-fns v4 date/time math with `@date-fns/tz` and `@date-fns/utc`. |
| `debug` | Root-cause debugging workflow: reproduce, minimize, rank hypotheses, prove the cause, fix at the root, add a regression check, and hunt sibling bugs. |
| `decimal-js` | decimal.js v10 arbitrary-precision math, money patterns, and rounding. |
| `deduplicate` | Collapse duplicated knowledge into one source of truth and rewire consumers. |
| `design` | Enforce shadcn website visual design: tokens, type, color, spacing, surfaces. |
| `design-engineer` | Diagnose UI/UX, propose multiple solutions, pick the best, and ship craft. |
| `drizzle-orm` | Drizzle ORM 1.0 RC (not 0.x): schema, RQBv2, kit, seed, validators, and Effect drivers. |
| `effect` | Enforce consistent Effect 4.x (stable LTS) application code, thin framework adapters, RC→4.0 migration, and a complete module and package index. |
| `elevenlabs` | Every ElevenLabs product: TTS (Eleven v4), dialogue, Scribe STT, voices, music, SFX, dubbing, Speech Engine, ElevenAgents, SDKs, CLI, MCP. |
| `elysia` | Build, review, debug, test, and deploy Elysia 1.4 apps (≥1.4.30) and plan Elysia 2 beta migrations with current docs. |
| `elysia-architecture` | Portable Elysia house style: feature modules, routes, schemas, and ownership. |
| `evlog` | Build, review, debug, configure, or migrate evlog 2.29 wide-event TypeScript logging (CLI map, drains, AI/eve, telemetry). |
| `feedsmith` | Feedsmith 3.0.x RSS/Atom/RDF/JSON Feed/OPML parse and generate for TypeScript. |
| `github-actions` | GitHub Actions CI/CD for Bun, TypeScript, and Turborepo: workflow templates, caching, quality gates, OIDC, SHA pinning, and releases. |
| `grok` | Cursor IDE only: always-on lock to Grok 4.7 (`cursor-grok-4.7-*`, any reasoning effort). Skip in Codex. |
| `handoff` | Produce or consume agent-to-agent handoff context so another session can resume work. |
| `heyapi` | Hey API (`@hey-api/openapi-ts`): OpenAPI → TypeScript SDKs, validators, Query plugins. |
| `high-signal-tests` | Prune low-signal unit tests; prefer existing E2E and integration setups (never add new ones), E2E artifacts, failure modes first. |
| `impit` | Apify Impit: browser-impersonating HTTP (TLS/HTTP fingerprints) for Node, Python, Rust. |
| `improve-prompt` | Rewrite rough requests into clear, proportional, actionable prompts without doing the work. |
| `intlayer` | Build, review, configure, or debug Intlayer 9.6 i18n in TanStack Start React apps. |
| `is-bot` | Detect self-identifying crawlers/spiders from User-Agent with isbot v5 (`isBot`, custom lists). |
| `jsdoc` | Purposeful JSDoc for complex or non-obvious TypeScript; no type-echo or narration. |
| `kafka` | Apache Kafka from TypeScript: prefer @platformatic/kafka 2.13 (cooperative-sticky, KIP-848), topics, and delivery semantics. |
| `kill-legacy` | Remove legacy, deprecated, compatibility-shim, and fallback code paths. |
| `knip` | Enforce a proper Knip 6.40 setup: minimal config, zero hints, production/strict runs, CI gate, triage, safe auto-fix, and v5 migration. |
| `legend-state` | Build, review, migrate, and debug Legend-State v3 observable, React, persistence, and sync systems. |
| `loop` | Implement, review, fix, and repeat until no actionable review issues remain. |
| `mantine-hooks` | Build, review, debug, migrate, or plan React code with `@mantine/hooks` only. |
| `mcp-server` | TypeScript MCP servers with the official SDK v2 (spec 2026-07-28): tools, auth, transports, Bun, Workers, testing, and v1 migration. |
| `mediabunny` | Mediabunny 1.61 media toolkit: read, write, convert, record, and HLS in browser and server, plus all `@mediabunny/*` extensions. |
| `mobbin` | Enforce Mobbin MCP for real shipped-app UI/UX inspiration before designing. |
| `motion` | Motion for React (motion@13.5): components, AnimatePresence, layout, gestures, scroll, free AnimateView, plus product UI motion a11y and performance. |
| `nitro` | Nitro v3 servers (3.0.260903-beta): file routes, route rules, Vite plugin, ocache/storage, and deploy-anywhere presets. |
| `oxfmt` | Full Oxfmt 0.71 usage guide plus setup, Prettier migration, and CI formatting. |
| `oxlint` | Full Oxlint 1.86 usage guide plus setup, rules/plugins, type-aware lint, Vite+ lint, and ESLint migration. |
| `paper` | Paper design canvas via Paper MCP: design, AI images, tokens, exports, and design-to-code. |
| `permix` | Type-safe Permix 4.3 permissions: setup/check, SSR, React/Next/Nest, and server middleware. |
| `phaser` | Phaser 4.2 HTML5 games: scenes, Arcade/Matter, tilemaps, filters, lighting, framework embedding, Spine/rex/Box2D add-ons, performance, and v3-to-v4 migration. |
| `plain-language` | Always-on ASD-STE100 hard prose (short, active, one word per idea) plus readable naming. |
| `playwright` | Build, review, debug, configure, or plan Playwright 1.63 E2E tests and browser automation. |
| `polar` | Polar.sh merchant-of-record billing with SDK 1.0: checkout, customers, subscriptions, benefits, usage billing, webhooks, and the Better Auth plugin. |
| `postgres` | PostgreSQL 18 schema design, indexing, EXPLAIN, locking, zero-downtime migrations, pooling, RLS, and ops from TypeScript (postgres.js, pg, Bun.SQL). |
| `react` | Build, review, debug, migrate, or plan React 19.3 apps with current React docs. |
| `react-boundaries` | Enforce leaf-owned state/queries, no prop-drill hubs; TanStack-aware composition. |
| `react-email` | React Email 6.11 templates: components, Tailwind styling, CLI preview/export, render, sending, and the editor 1.7. |
| `redis` | Redis 8 and Valkey 9 from TypeScript: client choice, caching, rate limits, locks, streams, Lua/Functions, memory, HA, and security. |
| `remotion` | Remotion 4.0.532 programmatic React video: compositions, animation, media, captions, effects, Studio, Player, SSR/Lambda/web rendering, and v5 readiness. |
| `reorganize` | Split oversized files and group related code into a coherent folder tree. |
| `research` | Investigate external sources and codebase evidence before recommending next steps. |
| `schema-dts` | Type-safe Schema.org JSON-LD with Google schema-dts v2 (WithContext, Graph, Leaf types, gen 2.0.1). |
| `self-improve` | One-time setup: AGENTS.md rules, permanent Bun scripts, runbooks (in the agent docs site when the repo has one, else `runbooks/`), and a bounded quality pass. |
| `sentry` | Sentry JS SDK 11 for TS/JS: errors, span streaming, replay, logs, metrics, source maps, framework packages, and v10→v11 migration. |
| `seo` | Complete SEO playbook: crawl/index, on-page, copywriting, linking, research, schema, GEO, i18n, local, ecommerce, audits. |
| `setup-codebase-docs` | One-time setup of private Blume human and agent docs apps, hand-written from code, with all docs and runbooks moved in and AGENTS.md rules that keep them current. |
| `setup-competitors-md` | One-time COMPETITORS.md landscape: rivals, substitutes, and differentiation. |
| `setup-copywriting-md` | One-time COPYWRITING.md from project copy and competitor messaging patterns. |
| `setup-icp-md` | One-time ICP.md ideal customer profile for the current project. |
| `setup-project-md` | One-time PROJECT.md product and codebase overview from code plus user context. |
| `simplify-layout` | Shorten file and folder names and group related modules so paths stay scannable. |
| `storybook` | Build, review, debug, configure, migrate, or plan Storybook 10.6 UI workshops, including addon-mcp agent tooling. |
| `stripe` | Stripe payments and billing with stripe-node 23: Checkout, webhooks, subscriptions, usage, entitlements, Connect, API-version migration, and go-live. |
| `subagents` | Split harder work into safe disjoint lanes and coordinate subagent results. |
| `supa-review` | Exhaustive code review of git changes (default) or a pointed target, with skill loading and research. |
| `t3-env` | Type-safe env vars with T3 Env: createEnv, server/client split, Standard Schema, presets. |
| `tailwind` | Build, review, debug, configure, or migrate Tailwind CSS v4.3 projects (Vite/PostCSS/CLI/webpack/Turbopack). |
| `tailwind-variants` | Build, review, debug, migrate, or plan Tailwind Variants class recipes. |
| `takumi` | JSX/HTML to OG images & animations with takumi-js 2.14 (no headless browser). |
| `tanstack-charts` | Build, review, debug, migrate, or plan TanStack Charts Alpha visualizations. |
| `tanstack-db` | Build, review, debug, migrate, or plan TanStack DB 0.12 beta collections, live queries, optimistic mutations, and Query-to-DB migration. |
| `tanstack-form` | Build, review, debug, migrate, or plan TanStack Form React forms. |
| `tanstack-hotkeys` | Build, review, debug, migrate, or plan TanStack Hotkeys shortcut systems. |
| `tanstack-query` | Build, review, debug, migrate, or plan TanStack Query server-state code. |
| `tanstack-router` | Build, review, debug, configure, migrate, or plan TanStack Router apps. |
| `tanstack-start` | Build, review, debug, configure, migrate, or plan TanStack Start apps. |
| `tanstack-start-architecture` | Portable Start house style: file routes, page folders, modules, and boundaries. |
| `tanstack-store` | Build, review, debug, migrate, or plan TanStack Store state management. |
| `tanstack-table` | Build, review, debug, migrate, or plan TanStack Table React tables. |
| `tanstack-virtual` | TanStack Virtual 3 lists, grids, tables, and chat feeds in React: dynamic heights, window scroll, sticky items, infinite load, and testing. |
| `testcontainers` | Build, review, debug, configure, or plan Testcontainers integration tests with real Docker dependencies. |
| `threejs` | Three.js r186 3D graphics: scene/render loop, PBR materials, glTF loaders, WebGPURenderer and TSL, post-processing, performance, R3F/drei ecosystem, and r17x to r186 migration. |
| `tsdown` | tsdown 0.23 Rolldown library bundler: config, dts generators, exports, deps, watch/unbundle, 0.22→0.23 upgrade, and tsup migration. |
| `turborepo` | Turborepo 2.11 usage guide: tasks, deferred hashing, caching/eviction, filters and tags, prune/Docker CI, devEngines, and experimental Rust/Python/Go. |
| `turborepo-architecture` | Portable monorepo house style: apps/packages layout, turbo rules, and boundaries. |
| `ua-parser` | UAParser.js v2 User-Agent detection: OSS AGPL, PRO packages, Client Hints, bots, and extensions. |
| `ultraplan` | Ask detailed planning questions, recommend answers, and produce a precise implementation plan before work starts. |
| `unsmell` | Find and fix maintainability problems across a codebase or scoped area. |
| `upgrade-deps` | Safely upgrade JS/TS dependencies in verified groups: baseline gates, security first, one major per commit, release-age and supply-chain checks, rollback. |
| `visx` | Airbnb visx React+D3 visualization primitives, XYChart, and v3→v4 migration. |
| `vite` | Vite 8.3 tooling: config, Rolldown/Oxc builds, plugins, SSR, and v7→v8 migration. |
| `vitest` | Vitest 5 testing: config, mocks, coverage, browser mode, projects, and Jest/v4/v5 migration. |
| `vitest-architecture` | Portable Vitest 5 house style: unit/integration projects, tests/ layout, scripts, and high-signal test rules (no new setups unasked). |
| `wxt` | Build, test, migrate, and publish browser extensions with WXT 0.21: entrypoints, content-script UIs, storage, SPA scraping, MV3 rules, Playwright, wxt submit. |
| `zod` | Build, review, debug, migrate, or plan Zod 4.6 validation and schema code. |

## Install With skills.sh

The [skills.sh](https://www.skills.sh/) CLI can install skills from GitHub repos, URLs, or local paths.

From this checkout:

```bash
npx skills add .
```

Install skills directly from the GitHub repo:

```bash
# List available skills without installing
npx skills add DobroslavRadosavljevic/skills --list

# Install one skill
npx skills add DobroslavRadosavljevic/skills --skill loop

# Install multiple skills
npx skills add DobroslavRadosavljevic/skills --skill loop --skill ultraplan

# Install all skills from the repo
npx skills add DobroslavRadosavljevic/skills --skill '*'
```

Useful options:

- `-g, --global`: install globally instead of into the current project.
- `-a, --agent <name>`: install for a specific agent, such as `codex` or `claude-code`.
- `--copy`: copy files instead of symlinking them.
- `-y, --yes`: skip prompts.
- `--all`: install all skills to all supported agents without prompts.

Example:

```bash
npx skills add DobroslavRadosavljevic/skills --skill motion -a codex -g
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
