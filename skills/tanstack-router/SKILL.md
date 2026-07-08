---
name: tanstack-router
description: "Build, review, debug, configure, migrate, or plan TanStack Router React applications with current docs. Use for @tanstack/react-router, file-based routes, code-based routes, route trees, generated routeTree.gen files, typed navigation, Link/useNavigate/redirect, params, validateSearch, loaderDeps, loaders, beforeLoad, route context, auth guards, notFound, error boundaries, pending/deferred data, preloading, TanStack Query integration, SSR, testing, and production routing rewrites."
---

# TanStack Router

Use this skill when work touches TanStack Router, especially `@tanstack/react-router`, `src/routes/**`, `src/router.tsx`, route tree generation, typed navigation, or route-owned data loading.

## Workflow

1. Inspect the local Router shape first:
   - Package versions for `@tanstack/react-router`, `@tanstack/router-plugin`, devtools, adapters, and any Query/SSR integration.
   - Routing mode: file-based, code-based, virtual file routes, or mixed.
   - Route entrypoints: `src/routes/__root.tsx`, `src/router.tsx`, generated `src/routeTree.gen.ts`, app/client entry, and SSR entry if present.
   - Route options that affect behavior: `validateSearch`, `params`, `beforeLoad`, `loaderDeps`, `loader`, `pendingComponent`, `errorComponent`, `notFoundComponent`, `search.middlewares`, `staleTime`, `gcTime`, `preload`, and `ssr` integration.
2. Refresh docs for current behavior, new versions, SSR, testing, route generation, or migrations. Start from [source-map.md](references/source-map.md).
3. For setup, installation, route-tree generation, and file naming, use [setup-route-trees.md](references/setup-route-trees.md).
4. For links, navigation, params, search params, masks, and URL state, use [navigation-url-state.md](references/navigation-url-state.md).
5. For loaders, context, auth guards, Query integration, error/not-found boundaries, preloading, and deferred data, use [loaders-context-errors.md](references/loaders-context-errors.md).
6. For SSR, deployment rewrites, testing, devtools, ESLint, and production checks, use [production-testing.md](references/production-testing.md).

## Implementation Judgment

- Prefer file-based routing unless the repo already uses code-based routes or the user asks otherwise.
- Treat `routeTree.gen.ts` as generated output. Do not hand-edit it; regenerate through the repo's bundler/CLI flow.
- Keep navigation typed. Do not build paths by interpolating params or query strings into `to`; pass `to`, `params`, `search`, and `hash` separately.
- Every route that reads URL search state should declare `validateSearch`; use `loaderDeps` to expose only the search fields a loader actually uses.
- Use `beforeLoad` for route UX gates, redirects, and context enrichment. Do not treat route guards as the private-data authorization boundary.
- Put route-shared dependencies in router context; do not call React hooks directly inside `beforeLoad` or `loader`.
- Decide explicitly between Router's built-in SWR loader cache and an external cache such as TanStack Query. When Query owns freshness, set router preload stale time to `0` and let Query dedupe.
- Handle not-found resources in loaders with `notFound()` so loader data stays correctly typed and UI avoids flicker.

## Verification

Prefer the repo's existing checks. For meaningful Router changes, include the relevant subset:

- Route tree generation via dev/build or explicit Router CLI command.
- Typecheck for route references, params, search, loaders, and context.
- Focused tests for route matching, search validation, loaders, auth redirects, not-found/error boundaries, and navigation.
- Browser smoke for direct loads, client navigation, back/forward, refresh, and production rewrite behavior.
