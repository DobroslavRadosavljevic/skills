# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: **2026-09-18**
- Package: **`permix@4.3.0`** (npm `latest`, published 2026-09-14)
- Previous in this skill: `permix@4.1.2` (2026-07-02)
- Intermediate: `permix@4.2.0` (2026-09-13)
- Homepage: https://permix.letstri.dev/
- Docs: https://permix.letstri.dev/docs
- LLMs index: https://permix.letstri.dev/llms.txt
- Full dump: https://permix.letstri.dev/llms-full.txt
- GitHub: https://github.com/letstri/permix
- License: MIT
- Engines: `node: >=22`
- Runtime deps: none (core). Framework peers are optional.
- Context7 IDs: `/letstri/permix`, `/llmstxt/permix_letstri_dev_llms-full_txt`
- Stale dist-tags: npm `beta` / `rc` still point at **2.x** — ignore for new work; use **4.x**.
- No GitHub Releases and no `CHANGELOG.md` in the repo. 4.2–4.3 notes below are reconstructed from git history + npm tarball diffs.

The npm tarball also ships `skills/` folders (copy from `node_modules/permix/skills/`). This skill is independent of those packaged files. Packaged frontmatter still stamped `library_version: '4.1.2'` inside `permix@4.3.0` — treat that stamp as stale.

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## 4.2.0 → 4.3.0 delta (from 4.1.2)

### 4.2.0 (2026-09-13)

- **`permix/tanstack-start` `createSetupHandler`**: same setup logic as `setupMiddleware`, meant for `createMiddleware().server(...)` so TanStack Start can strip server-only imports from the client bundle (PR #51 / issue #49).
- TanStack Start docs: isomorphic `beforeLoad` / `loader` checks via a **router-context** core instance + `dehydrate(context)` inside a server function.
- **Hydration first paint:** Solid, Svelte, and Vue subscribe to `setup`/`ready` during render so dehydrated booleans are visible on the first paint (#55).
- **Svelte `PermixHydrate`:** re-hydrates when the `state` prop changes (#71); React and Vue already did.
- Client setup re-runs after every re-hydration (related TanStack Start / SSR work).
- Same package exports as 4.1.2 (no new subpath).

### 4.3.0 (2026-09-14)

- **`permix/nest`**: NestJS adapter — `guard()` + `@Check` decorator. Closes #11 (PR #59).
- New optional peers: `@nestjs/common` `>=10`, `@nestjs/core` `>=10`, `reflect-metadata` `>=0.1.13`.
- Docs: https://permix.letstri.dev/docs/integrations/nest
- Example: https://github.com/letstri/permix/tree/main/examples/nest
- HTTP only (Express and Fastify Nest adapters). Non-HTTP contexts (RPC, WebSockets, GraphQL) skip setup; a `@Check` there throws `PermixNotFoundError` (fail-closed).
- Core public exports unchanged aside from type-only export syntax.

## Refresh Procedure

1. Resolve current docs before answering “latest” questions.
2. Check installed version:

   ```sh
   bun pm ls permix
   ```

3. Prefer https://permix.letstri.dev/docs/ and https://permix.letstri.dev/llms-full.txt.
4. If docs and installed package disagree, report the mismatch.
5. For migrations, re-read https://permix.letstri.dev/docs/migration-v3-to-v4 and GitHub PR #35.
6. For Nest / TanStack Start, re-read the integration pages — they moved more than core between 4.1.2 and 4.3.0.

## Official Pages

### Getting started

- Introduction: https://permix.letstri.dev/docs
- Quick Start: https://permix.letstri.dev/docs/quick-start
- Migrate v3→v4: https://permix.letstri.dev/docs/migration-v3-to-v4
- Comparison: https://permix.letstri.dev/docs/comparison
- Examples: https://github.com/letstri/permix/tree/main/examples
- Sandbox: https://stackblitz.com/edit/permix-sandbox

### Guide

- Instance: https://permix.letstri.dev/docs/guide/instance
- Setup: https://permix.letstri.dev/docs/guide/setup
- Check: https://permix.letstri.dev/docs/guide/check
- Template: https://permix.letstri.dev/docs/guide/template
- ReBAC: https://permix.letstri.dev/docs/guide/rebac
- Events: https://permix.letstri.dev/docs/guide/events
- Hydration: https://permix.letstri.dev/docs/guide/hydration
- Ready: https://permix.letstri.dev/docs/guide/ready

### UI / SSR

- React: https://permix.letstri.dev/docs/integrations/react
- Vue: https://permix.letstri.dev/docs/integrations/vue
- Solid: https://permix.letstri.dev/docs/integrations/solid
- Svelte: https://permix.letstri.dev/docs/integrations/svelte
- Next.js: https://permix.letstri.dev/docs/integrations/next
- TanStack Start: https://permix.letstri.dev/docs/integrations/tanstack-start

### Server / data

- Node: https://permix.letstri.dev/docs/integrations/node
- Server (fetch): https://permix.letstri.dev/docs/integrations/server
- Express: https://permix.letstri.dev/docs/integrations/express
- Hono: https://permix.letstri.dev/docs/integrations/hono
- Elysia: https://permix.letstri.dev/docs/integrations/elysia
- Fastify: https://permix.letstri.dev/docs/integrations/fastify
- NestJS: https://permix.letstri.dev/docs/integrations/nest
- tRPC: https://permix.letstri.dev/docs/integrations/trpc
- oRPC: https://permix.letstri.dev/docs/integrations/orpc
- Effect: https://permix.letstri.dev/docs/integrations/effect
- Drizzle: https://permix.letstri.dev/docs/integrations/drizzle

## Package exports (`permix@4.3.0`)

`.`, `./react`, `./vue`, `./solid`, `./svelte`, `./next`, `./tanstack-start`, `./express`, `./hono`, `./elysia`, `./fastify`, `./node`, `./server`, `./trpc`, `./orpc`, `./effect`, `./drizzle`, `./drizzle/legacy`, **`./nest`** (new in 4.3.0)

No other new framework subpaths vs 4.1.2.

## Optional peers (`permix@4.3.0`)

Install only the adapters you import: `react`/`react-dom` `>=18`, `vue` `>=3`, `solid-js` `>=1`, `svelte` `>=5`, `next` `>=14`, `@tanstack/react-start` `>=1`, `express` `>=4`, `hono` `>=4`, `elysia` `>=1`, `fastify` + `fastify-plugin` `>=5`, `@trpc/server` `>=11`, `@orpc/server` `>=1`, `effect` `>=3`, `drizzle-orm` `>=0.30.0 || >=1.0.0-rc.3`, `@nestjs/common` + `@nestjs/core` `>=10`, `reflect-metadata` `>=0.1.13`.
