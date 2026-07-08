---
name: tanstack-start
description: "Build, review, debug, configure, migrate, or plan TanStack Start React applications with current docs. Use for TanStack Start, @tanstack/react-start, file-based routing, TanStack Router integration, Vite/Rsbuild setup, SSR, streaming, server functions, server routes, middleware, loaders, TanStack Query integration, environment variables, sessions/auth, deployment, hosting, and Next.js migrations."
---

# TanStack Start

Use this skill when the work touches TanStack Start or `@tanstack/react-start`.

## Workflow

1. Identify the app's current Start shape before changing code:
   - Package versions for `@tanstack/react-start`, `@tanstack/react-router`, build plugins, React, and optional `@tanstack/react-query`.
   - Build tool: Vite or Rsbuild.
   - Start entrypoints: `src/router.tsx`, `src/routes/__root.tsx`, generated `routeTree.gen.ts`, optional `src/start.ts`, and optional custom `src/server.ts`.
   - Route files under `src/routes`, especially loaders, `server.handlers`, middleware, and auth boundaries.
2. Refresh current docs when the task depends on latest behavior, deployment adapters, security defaults, RC/experimental APIs, or a version mismatch. Start from [source-map.md](references/source-map.md).
3. For new apps or routing/setup work, use [setup-routing.md](references/setup-routing.md).
4. For data loading, server functions, server routes, middleware, env boundaries, auth, and execution-model issues, use [server-data.md](references/server-data.md).
5. For deployment, production modes, prerendering, ISR, SPA mode, selective SSR, custom server entrypoints, and verification, use [deployment-production.md](references/deployment-production.md).

## Implementation Judgment

- Treat TanStack Start as a full-stack React framework powered by TanStack Router. Keep Router conventions central: typed file routes, route loaders, route context, search params, and route invalidation.
- TanStack Start docs currently describe it as a Release Candidate: feature-complete with an API considered stable, but not bug-free. React Server Components remain experimental. Verify the latest docs before depending on unstable or newly changed behavior.
- Use server functions for same-origin app RPC. Use server routes for public or external HTTP endpoints, webhooks, form posts, and API-style `Response` handling.
- Do not rely on route guards as the data security boundary. Authorize every server function and server route that touches private data.
- Remember that route loaders are isomorphic. Put secrets and server-only work behind server functions, server routes, server-only utilities, or `.server.*` modules.
- If the app defines `src/start.ts`, explicitly preserve or install CSRF middleware for server functions.
- Read server environment variables per request in edge runtimes. Use public prefixes only for intentionally client-exposed values.
- Keep generated route-tree files generated; do not hand-edit them unless the repo explicitly owns a generated snapshot workflow.

## Verification

Prefer the repo's existing checks. For meaningful Start changes, include at least the relevant subset of:

- Typecheck/build, ensuring route tree generation runs.
- Unit or integration tests for loaders, server functions, server routes, and middleware.
- Browser smoke test for navigation, hydration, redirects, pending/error states, and forms.
- Deployment or adapter smoke test when changing hosting, env, SSR mode, prerendering, or server entrypoints.
