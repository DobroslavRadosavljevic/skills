---
name: elysia
description: "Build, review, debug, test, migrate, secure, or deploy Elysia and ElysiaJS applications with current documentation. Use for Bun or Node Elysia servers, routes, schemas and validation, lifecycle hooks, plugins and scope, guards, macros, context extension, error handling, Eden Treaty, OpenAPI, WebSocket, SSE, runtime adapters, and production readiness."
---

# Elysia

Use this skill when the work touches Elysia or ElysiaJS.

## Workflow

1. Inspect the application before proposing changes:
   - Installed versions of `elysia` and relevant `@elysia/*` packages.
   - Runtime and adapter: Bun, `@elysia/node`, Deno, Cloudflare Worker, Vercel, Netlify, or another Web Standard host.
   - Root instance, export/listen shape, route plugins, prefixes, guards, macros, schemas, error hooks, and tests.
   - Registration order and plugin scope for every cross-cutting hook.
2. Refresh current official docs when the task depends on latest APIs, adapters, package compatibility, experimental support, or version-specific behavior. Start from [source-map.md](references/source-map.md).
3. Route the work to the focused references:
   - Setup, routing, handlers, streaming, and project layout: [setup-routing.md](references/setup-routing.md).
   - Schemas, lifecycle order, status responses, and errors: [validation-lifecycle-errors.md](references/validation-lifecycle-errors.md).
   - Plugins, scope, guards, macros, dependencies, and context: [plugins-context.md](references/plugins-context.md).
   - Tests, Eden, OpenAPI, WebSocket, and SSE: [testing-clients-realtime.md](references/testing-clients-realtime.md).
   - Runtimes, deployment, security, observability, and production checks: [production-runtime-security.md](references/production-runtime-security.md).
4. Preserve the repository's existing architecture and commands unless the user explicitly asks for a migration.
5. Verify behavior at the narrowest useful boundary, then verify the assembled application.

## Core Judgment

- Treat schemas as executable HTTP contracts. Define request and per-status response schemas where the boundary matters; do not duplicate them with hand-written interfaces.
- Keep route handlers thin. Prefer feature-scoped Elysia instances for HTTP concerns and ordinary functions/modules for business logic that does not need request context.
- Let Elysia infer handler context. Do not pass a broad manually typed `Context` through controllers or services when destructured values or schema-derived types are sufficient.
- Respect chain order. Interceptor hooks apply to routes and plugins registered after them, except `onRequest`, which is global to incoming requests.
- Respect plugin encapsulation. A plugin's lifecycle hooks and schemas do not automatically protect parent routes. Choose `local`, `scoped`, or `global` deliberately and test the boundary.
- Prefer `resolve` over `derive` when a value depends on validated request data. `derive` runs before validation; `resolve` runs after validation.
- Return `status(code, value)` for expected HTTP outcomes when type-safe response narrowing matters. Throw only when the outcome should pass through `onError`.
- Use named plugins, plus `seed` when configuration changes identity, when lifecycle deduplication matters.
- Treat OpenAPI security declarations as documentation only. Enforce authentication and authorization in guards, macros, hooks, or handlers.
- Do not assume Bun-only APIs on other adapters. `server` and `server.requestIP` are Bun-specific; adapter and platform limitations must shape the implementation.
- Do not quote benchmark numbers as general application performance guarantees. Profile the actual app and runtime.

## Verification

Prefer repository-owned commands. For meaningful Elysia changes, cover the relevant subset:

- Typecheck and production build with the actual runtime/adapter.
- Direct `app.handle(new Request('http://localhost/...'))` tests for success, validation failures, auth failures, error mapping, headers, and status-specific response bodies.
- Scope/order regression tests when changing hooks, guards, macros, or plugin composition.
- `await app.modules` before testing deferred or lazy-loaded plugins.
- Eden contract tests when the application exports its type to clients.
- Generated OpenAPI inspection when schemas, response status maps, tags, security metadata, or type generation changes.
- Real HTTP smoke test for listen/export, proxy headers, cookies, CORS preflight, streaming, and runtime-specific behavior.
- WebSocket connection, invalid-message, close, timeout, and backpressure checks when realtime behavior changes.
- Deployment-target smoke test when changing adapters, bundling, binary compilation, serverless exports, environment variables, or platform bindings.

Report which checks ran, which did not, and any version-sensitive assumptions that remain.
