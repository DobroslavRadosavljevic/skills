# Source Map

Snapshot date: 2026-10-01.

This reference records the current docs and package evidence used to create the skill. Refresh these sources when the user asks for latest information, when behavior looks version-sensitive, or when working near release-candidate or experimental APIs.

## Documentation Sources

- Context7 library selected: `/websites/tanstack_start_framework_react`.
- Official docs home: https://tanstack.com/start/latest/docs/framework/react/overview
- Getting started: https://tanstack.com/start/latest/docs/framework/react/getting-started
- Build from scratch: https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
- Comparison (Start vs other frameworks): https://tanstack.com/start/latest/docs/framework/react/comparison
- Start vs Next.js: https://tanstack.com/start/latest/docs/framework/react/start-vs-nextjs
- Migrate from Next.js: https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js
- Routing: https://tanstack.com/start/latest/docs/framework/react/guide/routing
- Router routing concepts (colocation / `-` ignore prefix): https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts
- Router file-based routing API (`routeFileIgnorePrefix`): https://tanstack.com/router/latest/docs/framework/react/api/file-based-routing
- Execution model: https://tanstack.com/start/latest/docs/framework/react/guide/execution-model
- Code execution patterns: https://tanstack.com/start/latest/docs/framework/react/guide/code-execution-patterns
- Import protection: https://tanstack.com/start/latest/docs/framework/react/guide/import-protection
- Environment variables: https://tanstack.com/start/latest/docs/framework/react/guide/environment-variables
- Environment functions: https://tanstack.com/start/latest/docs/framework/react/guide/environment-functions
- Server functions: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- Server components: https://tanstack.com/start/latest/docs/framework/react/guide/server-components
- Static server functions: https://tanstack.com/start/latest/docs/framework/react/guide/static-server-functions
- Middleware: https://tanstack.com/start/latest/docs/framework/react/guide/middleware
- Server routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- Server entry point: https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point
- Authentication server primitives: https://tanstack.com/start/latest/docs/framework/react/guide/authentication-server-primitives
- Error boundaries: https://tanstack.com/start/latest/docs/framework/react/guide/error-boundaries
- Hydration errors: https://tanstack.com/start/latest/docs/framework/react/guide/hydration-errors
- Deferred hydration: https://tanstack.com/start/latest/docs/framework/react/guide/deferred-hydration
- Selective SSR: https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr
- SPA mode: https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode
- Static prerendering: https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering
- ISR: https://tanstack.com/start/latest/docs/framework/react/guide/isr
- Hosting: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- Tailwind integration: https://tanstack.com/start/latest/docs/framework/react/guide/tailwind-integration
- TanStack Query integration: https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query
- Production checklist: https://tanstack.com/start/latest/docs/framework/react/guide/production-checklist
- Observability: https://tanstack.com/start/latest/docs/framework/react/guide/observability
- Databases: https://tanstack.com/start/latest/docs/framework/react/guide/databases
- Client entry point: https://tanstack.com/start/latest/docs/framework/react/guide/client-entry-point
- Early hints: https://tanstack.com/start/latest/docs/framework/react/guide/early-hints
- CDN asset URLs: https://tanstack.com/start/latest/docs/framework/react/guide/cdn-asset-urls
- Streaming data from server functions: https://tanstack.com/start/latest/docs/framework/react/guide/streaming-data-from-server-functions
- SEO: https://tanstack.com/start/latest/docs/framework/react/guide/seo

Official raw-doc mirrors used for spot checks:

- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/overview.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/getting-started.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/build-from-scratch.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/server-functions.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/server-routes.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/middleware.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/environment-variables.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/import-protection.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/code-execution-patterns.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/environment-functions.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/authentication-server-primitives.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/server-entry-point.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/static-prerendering.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/isr.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/spa-mode.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/selective-ssr.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/hosting.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/tanstack-query.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/start/framework/react/guide/production-checklist.md

## Package Snapshot

Latest npm `latest` dist-tags observed on 2026-10-01:

| Package | Version | Notes |
| --- | --- | --- |
| `@tanstack/react-start` | `1.168.60` | `latest` (also has stale `beta` / `alpha` / `pre` tags; do not confuse with those) |
| `@tanstack/react-router` | `1.170.41` | pinned by `react-start` dependencies |
| `@tanstack/router-plugin` | `1.168.42` | file-route / codegen plugin |
| `@tanstack/start-plugin-core` | `1.171.49` | Start plugin core (transitive) |
| `@tanstack/react-start-client` | `1.168.39` | transitive |
| `@tanstack/react-start-server` | `1.167.46` | transitive |
| `@tanstack/start-client-core` | `1.170.34` | transitive |
| `@tanstack/start-server-core` | `1.169.39` | transitive |
| `@tanstack/react-start-rsc` | `0.1.59` | experimental RSC support; peers `@vitejs/plugin-rsc >=0.5.30` (Vite) or `@rspack/core >=2` + `react-server-dom-rspack` (Rsbuild) |
| `@tanstack/react-router-devtools` | `1.167.2` | optional |
| `@tanstack/start-static-server-functions` | `1.167.39` | static server functions (an `alpha` `2.0.0-alpha.*` tag also exists; prefer `latest`) |
| `@tanstack/react-query` | `5.104.0` | optional Query integration |
| `@tanstack/react-router-ssr-query` | `1.167.3` | Query SSR integration; peers Query `>=5.102.0` |
| `@tanstack/cli` | `0.71.1` | `bunx @tanstack/cli@latest create` |
| `@cloudflare/vite-plugin` | `1.62.3` | Cloudflare Workers hosting (a `2.0.0-beta` tag exists; Start docs target `latest`) |
| `@netlify/vite-plugin-tanstack-start` | `1.3.19` | Netlify hosting |
| `vite` | `8.3.2` | Start peer: `vite >=7.0.0` |
| `@vitejs/plugin-react` | `6.1.1` | Vite React plugin |
| `@rsbuild/core` | `2.2.11` | Start peer: `@rsbuild/core ^2.0.0` (Rsbuild 2.2 supported since start-plugin-core 1.171.x) |
| `@rsbuild/plugin-react` | `2.1.1` | Rsbuild React plugin |
| `nitro` | `3.0.260903-beta` | hosting adapter via `nitro/vite` (npm `latest` is still a beta line) |

`@tanstack/react-start@1.168.60` declares `engines.node: >=22.12.0` and peers `react` / `react-dom` `>=18`, `vite >=7.0.0`, and `@rsbuild/core ^2.0.0` (use one build tool).

Changes since the previous snapshot (`1.168.37`, all patch releases):

- Server route handlers receive `params` after route `params.parse` runs (1.168.59).
- SSR uses a lightweight request history; server-side navigation is a no-op, so throw `redirect()` for HTTP redirects (1.168.53). Navigation, redirect, and prerender destinations are validated.
- `setResponseHeaders` replaces existing values and keeps separate `Set-Cookie` values (1.168.52).
- Large deferred SSR payloads stream with backpressure; `seroval` updated to 1.6.7.
- Rsbuild 2.2 support, Rsbuild Windows manifest fix, sitemap `xmlns` uses `http`.
- Router-side changes also apply: React boundary errors typed `unknown`, Link `isTransitioning` removed, Outlet-in-boundary dev warning, and TanStack Store 0.11.2.
- The Start TanStack Query guide now targets Query 5.102+ and `queryClient.query`.

Vite plugin entry: `@tanstack/react-start/plugin/vite`. Rsbuild plugin entry: `@tanstack/react-start/plugin/rsbuild`. Prefer these over the older standalone `@tanstack/react-start-plugin` package.

The current React Start docs install `@tanstack/react-start` and `@tanstack/react-router`. Do not assume the older-looking `@tanstack/start` package is the correct integration without checking the current docs.

## Current Status Notes

- TanStack Start is still documented as a **Release Candidate** (confirmed 2026-10-01 on overview docs). Docs describe it as feature-complete with an API considered stable, but not bug-free before v1.
- npm `latest` for `@tanstack/react-start` is the `1.168.x` RC line (not a separate `rc` dist-tag). Prefer `latest` over `beta` / `alpha` / `pre` unless the user explicitly asks for a prerelease channel.
- TanStack Start is a full-stack React framework powered by TanStack Router and build tools such as Vite or Rsbuild.
- Start adds full-document SSR, streaming, server functions, server routes, middleware, client/server builds, deployment adapters, and full-stack type safety on top of Router.
- Use TanStack Router alone when the app does not need Start's SSR, streaming, server functions, server routes, middleware/context, full-stack build pipeline, or deployment integration.
- React Server Components support is explicitly experimental (`@tanstack/react-start-rsc`). Keep RSC work isolated and check current docs before using it in production.
- Official getting-started paths: TanStack Builder (preferred), `@tanstack/cli` create, official `start-*` examples, or build-from-scratch.

## Refresh Triggers

Refresh docs before answering or editing when:

- The user says latest, current, RC, v1, alpha, beta, migration, deploy, adapter, Cloudflare, Netlify, Vercel, Railway, Nitro, Bun, Node, or edge runtime.
- The task touches `src/start.ts`, CSRF middleware, import protection, server functions, server routes, server entrypoints, sessions, auth, env vars, deployment, prerendering, SPA mode, selective SSR, ISR, or React Server Components.
- Package versions in the repo differ meaningfully from the package snapshot above.
- Generated route files, plugin options, or server route APIs do not match this skill.
