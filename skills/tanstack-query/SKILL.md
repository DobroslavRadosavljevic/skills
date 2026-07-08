---
name: tanstack-query
description: "Build, review, debug, migrate, or plan TanStack Query v5 React server-state code with current docs. Use for @tanstack/react-query, QueryClient, QueryClientProvider, useQuery, useMutation, useInfiniteQuery, useQueries, queryOptions, mutationOptions, query keys, cache defaults, staleTime, gcTime, invalidation, optimistic updates, SSR, hydration, prefetching, router integration, suspense, persistence, devtools, ESLint rules, testing, TypeScript, and v4-to-v5 migrations."
---

# TanStack Query

Use this skill when work touches TanStack Query v5, especially `@tanstack/react-query`, server-state caching, query/mutation lifecycle issues, SSR hydration, or migrations from React Query/TanStack Query v4.

## Workflow

1. Inspect the local Query shape before changing code:
   - Package versions for `@tanstack/react-query`, `@tanstack/query-core`, devtools, persist/broadcast packages, ESLint plugin, React, framework router, and test utilities.
   - Provider setup: `QueryClient`, `QueryClientProvider`, SSR request scoping, default options, devtools, and persistence providers.
   - Query conventions: query key factories, `queryOptions`, `mutationOptions`, custom hooks, router loaders, SSR prefetching, and invalidation helpers.
   - Runtime intent: client-only fetching, server prefetch and hydration, route preloading, offline/persistence, or multi-tab sync.
2. Refresh docs for current behavior, package drift, SSR, persistence, or migrations. Start from [source-map.md](references/source-map.md).
3. For installation, provider setup, defaults, query keys, `useQuery`, and TypeScript options, use [setup-core.md](references/setup-core.md).
4. For dependent, parallel, paginated, infinite, disabled, cancellable, selected, and performance-sensitive queries, use [query-patterns.md](references/query-patterns.md).
5. For `useMutation`, invalidation, direct cache writes, optimistic updates, mutation scopes, and offline mutations, use [mutations-cache.md](references/mutations-cache.md).
6. For prefetching, router integration, SSR, hydration, Suspense, Server Components, and streaming caveats, use [ssr-prefetching.md](references/ssr-prefetching.md).
7. For persistence, broadcast sync, devtools, ESLint, testing, and migration checks, use [production-tooling.md](references/production-tooling.md).

## Implementation Judgment

- Treat TanStack Query as server-state management, not a replacement for local client UI state.
- Query keys are cache identity. Include every changing variable used by the query function, and keep keys serializable.
- Prefer object syntax everywhere in v5. Do not reintroduce positional v3/v4 signatures.
- Prefer typed `queryOptions` and `mutationOptions` helpers for reusable queries and mutations.
- Set `staleTime` deliberately. Default stale data refetches on mount, window focus, and reconnect can be correct, but noisy when misunderstood.
- Use targeted invalidation as the default after mutations. Use immutable `setQueryData` when the mutation response already contains the exact updated object.
- For optimistic updates, prefer UI-level `variables` when only one surface needs the pending state; use cache-level `onMutate` rollback when multiple surfaces must react.
- In SSR, create request-scoped query clients on the server and a stable browser client. Avoid module-level server caches that leak data across users.
- In tests, isolate each test with its own `QueryClient`, turn retries off, and clear or recreate clients rather than sharing cache state.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Query changes, include the relevant subset:

- Typecheck for query keys, query function returns, `select`, mutation variables, and SSR hydration types.
- Focused tests for invalidation, optimistic rollback, cache updates, dependent queries, pagination, infinite queries, and error states.
- Browser smoke for loading, stale-data, background-fetching, pagination, mutation pending/error, hydration, and focus/reconnect behavior.
- SSR or route-loader smoke when changing prefetching, hydration, stale times, or provider placement.
- ESLint Query plugin checks when the repo uses `@tanstack/eslint-plugin-query`.
