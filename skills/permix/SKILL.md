---
name: permix
description: "Build, review, debug, configure, migrate, teach, or plan Permix type-safe permissions with current docs and a full usage guide. Use for permix, createPermix, setup, check, template, dehydrate, hydrate, isReady, isReadyAsync, ~all/~any, ValidateDefinition, Rules, ReBAC closures, permix/react, permix/vue, permix/solid, permix/svelte, permix/next, permix/tanstack-start, createSetupHandler, permix/express, permix/hono, permix/elysia, permix/fastify, permix/node, permix/server, permix/trpc, permix/orpc, permix/nest, permix.guard, @Check, permix/drizzle, permix/effect, and Permix v3 to v4 migration."
---

# Permix

Use this skill when work touches Permix permissions: definitions, `setup`/`check`, SSR hydration, UI adapters, server middleware, NestJS guards, or v3→v4 migration.

Snapshot: `permix@4.3.0` (2026-09-18). Refresh from [source-map.md](references/source-map.md) if the installed version differs.

## Workflow

1. Inspect the local Permix surface:
   - Package version (`permix@4.x` preferred; current stable snapshot **4.3.0**).
   - Import path: `permix` (core) vs subpaths (`permix/react`, `permix/next`, `permix/nest`, `permix/tanstack-start`, …).
   - Definition shape: action tuples / `{ name, type, required? }` vs legacy v3 `{ action, dataType }`.
   - Where enforcement runs (server middleware / Nest `@Check` vs client UX) and whether SSR dehydrate/hydrate is used.
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task is migration/SSR/integration-specific. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Core API, rules, check, template, ReBAC, errors: [core-api.md](references/core-api.md).
   - React/Vue/Solid/Svelte, Next, TanStack Start, hydration: [frameworks-ssr.md](references/frameworks-ssr.md).
   - Express/Hono/Elysia/Fastify/Node/server/tRPC/oRPC/Nest/Drizzle/Effect: [server-integrations.md](references/server-integrations.md).
   - v3→v4 breaking changes: [migration-v4.md](references/migration-v4.md).
5. Prefer Permix **v4** APIs (dot paths, action tuples). Treat client checks as UX only — enforce on the server.
6. Verify with typecheck plus focused `setup`/`check` tests (and middleware 403 / Nest `ForbiddenException` paths when server-integrated).

## Core Judgment

- Flow: **`createPermix<Definition>()` → `setup(rules)` → `check('entity.action'[, data])`**.
- Definitions are **action lists** (strings or `{ name, type?, required? }`), optionally nested trees.
- Rules are **booleans** or **`(data?) => boolean`** closures (capture the actor at `setup` time).
- `check` returns **`boolean`**. Use callbacks for AND/OR; use `'~all'` / `'~any'` (or `'post.~all'`) for aggregates.
- **`checkAsync` is removed** in v4 — `await isReadyAsync()` then `check()`.
- Before any rules: `check` / `dehydrate` throw **`PermixNotReadyError`** (not `false`).
- Invalid path throws **`PermixRuleNotDefinedError`**.
- `template(...)` returns a **function** — call it: `permix.setup(admin())`.
- SSR: `dehydrate()` → JSON booleans (functions become `false`) → client `hydrate` → **must `setup()` again** for function rules; hydrate alone does **not** set `isReady`.
- Server: prefer per-request instances via integration middleware / Nest `guard` / Next `cache()`; do not share mutable core singletons across concurrent requests.
- TanStack Start: `setupMiddleware` (or `createSetupHandler` inside `createMiddleware().server(...)` when the callback imports server-only code). Router `beforeLoad`/`loader` use a **separate** core instance on router context — UX only.
- NestJS: `permix/nest` — `guard()` attaches per-request rules; `@Check` enforces (fail-closed). HTTP only (Express/Fastify adapters).
- Security: **server enforcement is mandatory**; hide UI with client checks only.
- Engines: package declares **`node: >=22`**. Optional peer deps only for the adapters you import.

## Verification

Prefer repository-owned commands. For meaningful Permix work, cover the relevant subset:

- Typecheck paths (`$inferPath`), `required: true` data args, and shared `ValidateDefinition` / `Rules`.
- Unit tests: allow/deny, entity-data rules with/without data, `~all`/`~any`, callback composition, not-ready / missing-path errors.
- SSR: dehydrate snapshot shape; client hydrate + re-`setup`; `isReady` gating in UI.
- Server: `setupMiddleware` then `checkMiddleware` — assert 200 vs 403 / `onForbidden`. Nest: `APP_GUARD` + `@Check` → 201 vs 403; missing guard → `PermixNotFoundError`.
- TanStack Start: server-function `checkMiddleware` / `getOrThrow(context)` for enforcement; `beforeLoad` checks are not enough.
- Migration: no remaining `check('entity', 'action')`, `checkAsync`, Better Auth plugin, or `entity`+`action` UI props.

Report which checks ran, which did not, and any version assumptions that remain.
