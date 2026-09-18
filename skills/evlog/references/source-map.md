# evlog Source Map

Snapshot date: 2026-09-18.

## Current Package Evidence

| Package | Version | Role |
| --- | --- | --- |
| `evlog` `latest` | `2.29.0` (2026-09-10) | Core logger + framework/adapters subpaths |
| `@evlog/cli` | `0.6.3` | Separate early CLI (`map`, `doctor`, `init`, `agents`, `telemetry`) |
| `@evlog/telemetry` | `0.3.1` | CLI/script/GHA product telemetry (no `evlog` core dep) |
| `@evlog/nuxthub` | `2.0.2` | NuxtHub database drain module |

Site: [https://www.evlog.dev/](https://www.evlog.dev/)  
Repo: `https://github.com/evloghq/evlog`  
LLM index: `https://www.evlog.dev/llms.txt` (full: `llms-full.txt`)  
Raw docs: `https://www.evlog.dev/raw/<path>.md`  
MCP: `https://www.evlog.dev/mcp` (streamable HTTP)

Context7: `/websites/evlog_dev`, `/evloghq/evlog`.

CLI requires **Node 20+**. Core TypeScript **5+**. Optional peers exist per integration (install only what you use). Notable peers on 2.29: `ai` `>=6.0.168 <8`, `eve` `>=0.30.0`, `next` `>=16.3.4`, `nitro` `^3.0.260311-beta`, `hono` `>=4.13.7`, `elysia` `>=1.4.30`, `express` `>=5.2.1`.

## Notable Subpath Exports

| Import | Use |
| --- | --- |
| `evlog` | Core: `log`, `initLogger`, `createLogger`, `createError`, `parseError`, `definePlugin`, audit helpers |
| `evlog/next` | Next.js `createEvlog`, `withEvlog` |
| `evlog/next/client`, `evlog/next/stream`, `evlog/next/instrumentation` | Next client, SSE stream, Node instrumentation |
| `evlog/nuxt` | Nuxt module |
| `evlog/nitro`, `evlog/nitro/v3` | Nitro v2 / v3 (+ TanStack Start) |
| `evlog/hono`, `evlog/express`, `evlog/fastify`, `evlog/elysia`, `evlog/nestjs`, `evlog/sveltekit`, `evlog/react-router`, `evlog/orpc`, `evlog/workers` | Framework integrations |
| `evlog/pipeline` | Batch/retry fan-out |
| `evlog/axiom`, `evlog/sentry`, `evlog/posthog`, `evlog/otlp`, `evlog/datadog`, `evlog/better-stack`, `evlog/hyperdx`, `evlog/loki`, `evlog/clickhouse` | Cloud / hybrid drains |
| `evlog/fs`, `evlog/memory` | Local / edge buffers |
| `evlog/http`, `evlog/client`, `evlog/browser` | Client → server transport |
| `evlog/ai` | AI SDK wrap / telemetry |
| `evlog/eve` | eve agent turn hooks (`defineEvlogHook`) |
| `evlog/enrichers` | Enrichers |
| `evlog/vite` | Vite plugin (strip debug, source location, auto-init) |
| `evlog/better-auth` | Better Auth identity enricher |
| `evlog/catalog` | Typed catalogs |
| `evlog/toolkit`, `evlog/toolkit/storage` | Custom drains / framework helpers |
| `evlog/stream` | In-process + SSE event stream (local process only) |
| `evlog/diagnostics` | `node:diagnostics_channel` publisher |

Optional peers exist for frameworks/AI/eve—install only what the integration needs.

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
- Nitro: `https://www.evlog.dev/integrate/frameworks/nitro`
- Drain pipeline: `https://www.evlog.dev/extend/drain-pipeline`

Use cases:

- Client logging: `https://www.evlog.dev/use-cases/client-logging`
- AI SDK: `https://www.evlog.dev/use-cases/ai-sdk/overview`
- Audit: `https://www.evlog.dev/use-cases/audit/overview`
- Telemetry: `https://www.evlog.dev/use-cases/telemetry/overview`
- eve: `https://www.evlog.dev/use-cases/eve`

CLI:

- Overview: `https://www.evlog.dev/cli/overview`
- Map: `https://www.evlog.dev/cli/map`
- Agents: `https://www.evlog.dev/cli/agents`
- Rules / scoring / CI: under `/cli/rules`, `/cli/scoring`, `/cli/ci`

Extend:

- Plugins: `https://www.evlog.dev/extend/plugins`
- Stream: `https://www.evlog.dev/extend/stream`
- Custom framework: `https://www.evlog.dev/extend/custom-framework`

Reference:

- Agent skills (upstream): `https://www.evlog.dev/reference/agent-skills`
- Best practices: `https://www.evlog.dev/reference/best-practices`
- Configuration: `https://www.evlog.dev/reference/configuration`

## Upstream Agent Skills Note

evlog publishes its own skills via `bunx @evlog/cli agents` / `bunx skills add https://www.evlog.dev` (`review-logging-patterns`, `build-audit-logs`, `analyze-logs`). This repo skill is independent harness-neutral guidance; prefer local project setup over duplicating upstream skill files.

## Refresh Triggers

Refresh when:

- `evlog`, `@evlog/cli`, or `@evlog/telemetry` versions move past this snapshot.
- Framework access patterns change (especially TanStack Start / Nitro v3 async context).
- Map adapters add frameworks beyond Nuxt/Nitro/Next/TanStack Start/Hono.
- Audit / AI / eve / telemetry APIs change entrypoints or required peers.
