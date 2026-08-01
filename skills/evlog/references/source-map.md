# evlog Source Map

Snapshot date: 2026-08-01.

## Current Package Evidence

| Package | Version | Role |
| --- | --- | --- |
| `evlog` `latest` | `2.22.4` | Core logger + framework/adapters subpaths |
| `@evlog/cli` | `0.3.0` | Separate early CLI (`map`, `doctor`, `init`) |

Site: [https://www.evlog.dev/](https://www.evlog.dev/)  
Repo: `https://github.com/HugoRCD/evlog`  
LLM index: `https://www.evlog.dev/llms.txt` (full: `llms-full.txt`)  
Raw docs: `https://www.evlog.dev/raw/<path>.md`

Context7: `/websites/evlog_dev`, `/hugorcd/evlog`.

## Notable Subpath Exports

| Import | Use |
| --- | --- |
| `evlog` | Core: `log`, `initLogger`, `createLogger`, `createError`, `parseError`, audit helpers |
| `evlog/next` | Next.js `createEvlog`, `withEvlog` |
| `evlog/nuxt` | Nuxt module |
| `evlog/nitro`, `evlog/nitro/v3` | Nitro v2 / v3 (+ TanStack Start) |
| `evlog/hono`, `evlog/express`, `evlog/fastify`, `evlog/elysia`, `evlog/nestjs`, `evlog/sveltekit`, `evlog/react-router`, `evlog/orpc`, `evlog/workers` | Framework integrations |
| `evlog/pipeline` | Batch/retry fan-out |
| `evlog/axiom`, `evlog/sentry`, `evlog/posthog`, `evlog/otlp`, `evlog/datadog`, `evlog/better-stack`, `evlog/hyperdx` | Cloud drains |
| `evlog/fs`, `evlog/memory` | Local / edge buffers |
| `evlog/http`, `evlog/client`, `evlog/browser` | Client → server transport |
| `evlog/ai` | AI SDK wrap / telemetry |
| `evlog/enrichers` | Enrichers |
| `evlog/vite` | Vite plugin (strip debug, source location) |
| `evlog/better-auth` | Better Auth identity enricher |
| `evlog/catalog` | Typed catalogs |

Optional peers exist for frameworks/AI—install only what the integration needs.

## Official Docs (high value)

Start:

- Introduction: `https://www.evlog.dev/start/introduction`
- Install: `https://www.evlog.dev/start/installation`
- Quick start: `https://www.evlog.dev/start/quick-start`

Learn:

- Overview: `https://www.evlog.dev/learn/overview`
- Wide events: `https://www.evlog.dev/learn/wide-events`
- Structured errors: `https://www.evlog.dev/learn/structured-errors`
- Sampling: `https://www.evlog.dev/learn/sampling`
- Redaction: `https://www.evlog.dev/learn/redaction`
- Typed fields: `https://www.evlog.dev/learn/typed-fields`
- Catalogs: `https://www.evlog.dev/learn/catalogs`
- Lifecycle: `https://www.evlog.dev/learn/lifecycle`

Integrate:

- Frameworks: `https://www.evlog.dev/integrate/frameworks/overview`
- Adapters: `https://www.evlog.dev/integrate/adapters/overview`
- TanStack Start: `https://www.evlog.dev/integrate/frameworks/tanstack-start`
- Next.js: `https://www.evlog.dev/integrate/frameworks/nextjs`
- Drain pipeline: `https://www.evlog.dev/extend/drain-pipeline`

Use cases:

- Client logging: `https://www.evlog.dev/use-cases/client-logging`
- AI SDK: `https://www.evlog.dev/use-cases/ai-sdk/overview`
- Audit: `https://www.evlog.dev/use-cases/audit/overview`

CLI:

- Overview: `https://www.evlog.dev/cli/overview`
- Map: `https://www.evlog.dev/cli/map`
- Rules / scoring / CI: under `/cli/rules`, `/cli/scoring`, `/cli/ci`

Reference:

- Agent skills (upstream): `https://www.evlog.dev/reference/agent-skills`
- Best practices: `https://www.evlog.dev/reference/best-practices`

## Upstream Agent Skills Note

evlog publishes its own skills via `bunx skills add https://www.evlog.dev` (`review-logging-patterns`, `build-audit-logs`, `analyze-logs`). This repo skill is independent harness-neutral guidance; prefer local project setup over duplicating upstream skill files.

## Refresh Triggers

Refresh when:

- `evlog` or `@evlog/cli` versions move past this snapshot.
- Framework access patterns change (especially TanStack Start / Nitro v3 async context).
- Map adapters add frameworks beyond Nuxt/Nitro/Next/TanStack Start.
- Audit / AI / client APIs change entrypoints or required peers.
