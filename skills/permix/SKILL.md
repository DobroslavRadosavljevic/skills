---
name: permix
description: "Build, review, debug, configure, migrate, teach, or plan Permix type-safe permissions with current docs and a full usage guide. Use for permix, createPermix, setup, check, template, dehydrate, hydrate, isReady, isReadyAsync, ~all/~any, ValidateDefinition, Rules, ReBAC closures, permix/react, permix/vue, permix/solid, permix/svelte, permix/next, permix/tanstack-start, permix/express, permix/hono, permix/elysia, permix/fastify, permix/node, permix/server, permix/trpc, permix/orpc, permix/drizzle, permix/effect, and Permix v3 to v4 migration."
---

# Permix

Use this skill when work touches Permix permissions: definitions, `setup`/`check`, SSR hydration, UI adapters, server middleware, or v3→v4 migration.

## Workflow

1. Inspect the local Permix surface:
   - Package version (`permix@4.x` preferred; current stable snapshot **4.1.2**).
   - Import path: `permix` (core) vs subpaths (`permix/react`, `permix/next`, `permix/express`, …).
   - Definition shape: action tuples / `{ name, type, required? }` vs legacy v3 `{ action, dataType }`.
   - Where enforcement runs (server middleware vs client UX) and whether SSR dehydrate/hydrate is used.
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task is migration/SSR/integration-specific. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Core API, rules, check, template, ReBAC, errors: [core-api.md](references/core-api.md).
   - React/Vue/Solid/Svelte, Next, TanStack Start, hydration: [frameworks-ssr.md](references/frameworks-ssr.md).
   - Express/Hono/Elysia/Fastify/Node/server/tRPC/oRPC/Drizzle/Effect: [server-integrations.md](references/server-integrations.md).
   - v3→v4 breaking changes: [migration-v4.md](references/migration-v4.md).
5. Prefer Permix **v4** APIs (dot paths, action tuples). Treat client checks as UX only — enforce on the server.
6. Verify with typecheck plus focused `setup`/`check` tests (and middleware 403 paths when server-integrated).

## Core Judgment

- Flow: **`createPermix<Definition>()` → `setup(rules)` → `check('entity.action'[, data])`**.
- Definitions are **action lists** (strings or `{ name, type?, required? }`), optionally nested trees.
- Rules are **booleans** or **`(data?) => boolean`** closures (capture the actor at `setup` time).
- `check` returns **`boolean`**. Use callbacks for AND/OR; use `'~all'` / `'~any'` (or `'post.~all'`) for aggregates.
- **`checkAsync` is removed** in v4 — `await isReadyAsync()` then `check()`.
- Before any rules: `check` / `dehydrate` throw **`PermixNotReadyError`** (not `false`).
- Invalid path throws **`PermixRuleNotDefinedError`**.
- SSR: `dehydrate()` → JSON booleans (functions become `false`) → client `hydrate` → **must `setup()` again** for function rules; hydrate alone does **not** set `isReady`.
- Server: prefer per-request instances via integration middleware; do not share mutable singletons across concurrent requests.
- Security: **server enforcement is mandatory**; hide UI with client checks only.
- Engines: package declares **`node: >=22`**. Optional peer deps only for the adapters you import.

## Verification

Prefer repository-owned commands. For meaningful Permix work, cover the relevant subset:

- Typecheck paths (`$inferPath`), `required: true` data args, and shared `ValidateDefinition` / `Rules`.
- Unit tests: allow/deny, entity-data rules with/without data, `~all`/`~any`, callback composition, not-ready / missing-path errors.
- SSR: dehydrate snapshot shape; client hydrate + re-`setup`; `isReady` gating in UI.
- Server: `setupMiddleware` then `checkMiddleware` — assert 200 vs 403 / `onForbidden`.
- Migration: no remaining `check('entity', 'action')`, `checkAsync`, Better Auth plugin, or `entity`+`action` UI props.

Report which checks ran, which did not, and any version assumptions that remain.
