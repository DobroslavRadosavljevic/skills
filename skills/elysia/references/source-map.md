# Source Map

Snapshot date: 2026-10-01.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, adapter work, experimental features, deployment changes, or version mismatches.

## Research Snapshot

- Context7 library: `/elysiajs/documentation` (official documentation, high source reputation).
- Official documentation repository commit inspected: `f68573703415eb3df63ff02851013148fea4748f` (main branch; still documents 1.4).
- npm dist-tags observed on 2026-10-01:
  - `elysia`: `latest` `1.4.30`, `next` `2.0.0-beta.20`
  - `@elysia/openapi`: `latest` `1.4.16`, `next` `2.0.0-beta.4`
  - `@elysia/eden`: `latest` `1.4.10`, `next` `2.0.0-beta.5`
  - `@elysia/node`: `latest` `1.4.6`, `next` `2.0.0-beta.2`
  - `@elysia/codemod`: `latest` `2.0.0-beta.1`
- 1.4.x is in security-only maintenance. 1.4.30 fixes GHSA-gmm9-qwx3-2m3h (critical RCE through unescaped schema property names and string defaults, `<= 1.4.29`) plus four other advisories. 1.4.29 fixed GHSA-9643-4qgh-g8mx (quadratic multipart form-data parse).
- `@elysia/openapi` 1.4.16 adds OpenAPI 3.1 support, regex path scopes, `withHeader` headers in the document, and type-gen stability fixes.

Do not assume the packages share an identical patch version. Check peer dependencies and the application's lockfile before changing them.

## Official Core Documentation

- Home: https://elysiajs.com/
- At a glance: https://elysiajs.com/at-glance
- Key concepts: https://elysiajs.com/key-concept
- Routing: https://elysiajs.com/essential/route
- Handlers and context: https://elysiajs.com/essential/handler
- Validation: https://elysiajs.com/essential/validation
- Lifecycle: https://elysiajs.com/essential/life-cycle
- Plugins, dependencies, and scope: https://elysiajs.com/essential/plugin
- Best practices and feature structure: https://elysiajs.com/essential/best-practice
- Context extension: https://elysiajs.com/patterns/extends-context
- Macros: https://elysiajs.com/patterns/macro
- Error handling: https://elysiajs.com/patterns/error-handling
- Cookies: https://elysiajs.com/patterns/cookie
- TypeScript: https://elysiajs.com/patterns/typescript
- Configuration: https://elysiajs.com/patterns/configuration

## Contracts, Clients, and Realtime

- Unit tests: https://elysiajs.com/patterns/unit-test
- OpenAPI: https://elysiajs.com/patterns/openapi
- OpenAPI plugin reference: https://elysiajs.com/plugins/openapi
- Eden overview: https://elysiajs.com/eden/overview
- Eden Treaty overview: https://elysiajs.com/eden/treaty/overview
- Eden Treaty configuration: https://elysiajs.com/eden/treaty/config
- Eden Treaty responses: https://elysiajs.com/eden/treaty/response
- Eden Treaty unit tests: https://elysiajs.com/eden/treaty/unit-test
- Eden Treaty WebSocket: https://elysiajs.com/eden/treaty/websocket
- WebSocket: https://elysiajs.com/patterns/websocket
- Handler streaming and SSE: https://elysiajs.com/essential/handler#stream

## Runtime and Production

- Deploy to production: https://elysiajs.com/patterns/deploy
- Node.js adapter: https://elysiajs.com/integrations/node
- Deno: https://elysiajs.com/integrations/deno
- Cloudflare Worker adapter: https://elysiajs.com/integrations/cloudflare-worker
- Vercel: https://elysiajs.com/integrations/vercel
- Netlify: https://elysiajs.com/integrations/netlify
- Trace: https://elysiajs.com/patterns/trace
- OpenTelemetry pattern: https://elysiajs.com/patterns/opentelemetry
- OpenTelemetry plugin: https://elysiajs.com/plugins/opentelemetry
- CORS plugin: https://elysiajs.com/plugins/cors
- JWT plugin: https://elysiajs.com/plugins/jwt
- Official plugin overview: https://elysiajs.com/plugins/overview

## Elysia 2 Beta

- Release blog: https://elysiajs.com/blog/elysia-20
- Early migration guide: https://github.com/elysiajs/elysia/pull/1873#issuecomment-4734573873
- Source branch: https://github.com/elysiajs/elysia/tree/kiana
- Codemod: `bunx @elysia/codemod@latest`
- Security advisories: https://github.com/elysiajs/elysia/security/advisories

## Primary Repositories

- Documentation: https://github.com/elysiajs/documentation
- Framework: https://github.com/elysiajs/elysia
- OpenAPI plugin: https://github.com/elysiajs/elysia-openapi
- Eden: https://github.com/elysiajs/eden

## Refresh Triggers

Refresh the relevant official pages and package metadata when:

- The user asks for latest/current behavior, a migration, or an upgrade.
- The installed Elysia version is not `1.4.x`, or is a `2.0.0-beta.x` / `next` build.
- The task touches AOT, `precompile`, `normalize`, OpenAPI type generation, macros, lazy plugins, runtime adapters, deployment, or Bun compilation.
- The target is Cloudflare Worker or another experimental/edge adapter.
- Bun-only APIs appear in a Node, Deno, serverless, or edge deployment.
- OpenAPI, Eden, or official plugin versions do not align with the core package.
- Observed runtime behavior conflicts with this skill; trust the repository lockfile, current docs, tests, and runtime evidence over this snapshot.
