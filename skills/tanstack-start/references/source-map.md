# Source Map

Snapshot date: 2026-07-08.

This reference records the current docs and package evidence used to create the skill. Refresh these sources when the user asks for latest information, when behavior looks version-sensitive, or when working near release-candidate or experimental APIs.

## Documentation Sources

- Context7 library selected: `/websites/tanstack_start_framework_react`.
- Official docs home: https://tanstack.com/start/latest/docs/framework/react/overview
- Getting started: https://tanstack.com/start/latest/docs/framework/react/getting-started
- Build from scratch: https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
- Start vs Router: https://tanstack.com/start/latest/docs/framework/react/start-vs-router
- Start vs Next.js: https://tanstack.com/start/latest/docs/framework/react/start-vs-nextjs
- Migrate from Next.js: https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js
- Routing: https://tanstack.com/start/latest/docs/framework/react/guide/routing
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
- Tailwind integration: https://tanstack.com/start/latest/docs/framework/react/guide/tailwind
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

## Package Snapshot

Latest npm versions observed on 2026-07-08:

- `@tanstack/react-start`: `1.168.27`
- `@tanstack/react-router`: `1.170.17`
- `@tanstack/router-plugin`: `1.168.19`
- `@tanstack/react-query`: `5.101.2`

The current React Start docs install `@tanstack/react-start` and `@tanstack/react-router`. Do not assume the older-looking `@tanstack/start` package is the correct integration without checking the current docs.

## Current Status Notes

- TanStack Start is documented as a Release Candidate. The docs describe it as feature-complete and its API as considered stable, but it may still have bugs before v1.
- TanStack Start is a full-stack React framework powered by TanStack Router and build tools such as Vite or Rsbuild.
- Start adds full-document SSR, streaming, server functions, server routes, middleware, client/server builds, deployment adapters, and full-stack type safety on top of Router.
- Use TanStack Router alone when the app does not need Start's SSR, streaming, server functions, server routes, middleware/context, full-stack build pipeline, or deployment integration.
- React Server Components support is explicitly experimental. Keep RSC work isolated and check current docs before using it in production.

## Refresh Triggers

Refresh docs before answering or editing when:

- The user says latest, current, RC, v1, alpha, beta, migration, deploy, adapter, Cloudflare, Netlify, Vercel, Railway, Nitro, Bun, Node, or edge runtime.
- The task touches `src/start.ts`, CSRF middleware, import protection, server functions, server routes, server entrypoints, sessions, auth, env vars, deployment, prerendering, SPA mode, selective SSR, ISR, or React Server Components.
- Package versions in the repo differ meaningfully from the package snapshot above.
- Generated route files, plugin options, or server route APIs do not match this skill.
