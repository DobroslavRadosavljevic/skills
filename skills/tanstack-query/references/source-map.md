# TanStack Query Source Map

Snapshot date: 2026-07-08.

## Current Package Evidence

Npm evidence from this snapshot:

- `@tanstack/react-query`: `5.101.2`
- `@tanstack/query-core`: `5.101.2`
- `@tanstack/react-query-devtools`: `5.101.2`
- `@tanstack/eslint-plugin-query`: `5.101.2`
- `@tanstack/react-query` dist-tags: `latest` is `5.101.2`, `previous` is `4.44.0`, `rc` is `5.0.0-rc.16`, `beta` is `5.0.0-beta.35`, `alpha` is `5.0.0-alpha.91`

Context7 resolved official TanStack Query docs. The best repository-backed library ID available during research was `/tanstack/query/v5.90.3`; npm showed the current latest package patch as `5.101.2`, so source files from the `main` branch and `/query/latest` docs were also checked.

## Official Current Docs

Core:

- Overview: `https://tanstack.com/query/latest/docs/framework/react/overview`
- Installation: `https://tanstack.com/query/latest/docs/framework/react/installation`
- Quick start: `https://tanstack.com/query/latest/docs/framework/react/quick-start`
- TypeScript: `https://tanstack.com/query/latest/docs/framework/react/typescript`
- Devtools: `https://tanstack.com/query/latest/docs/framework/react/devtools`
- QueryClientProvider: `https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider`
- `useQuery`: `https://tanstack.com/query/latest/docs/framework/react/reference/useQuery`
- `useMutation`: `https://tanstack.com/query/latest/docs/framework/react/reference/useMutation`
- `useInfiniteQuery`: `https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery`
- `useQueries`: `https://tanstack.com/query/latest/docs/framework/react/reference/useQueries`
- `queryOptions`: `https://tanstack.com/query/latest/docs/framework/react/reference/queryOptions`
- `mutationOptions`: `https://tanstack.com/query/latest/docs/framework/react/reference/mutationOptions`
- Hydration reference: `https://tanstack.com/query/latest/docs/framework/react/reference/hydration`

Guides:

- Important defaults: `https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults`
- Caching: `https://tanstack.com/query/latest/docs/framework/react/guides/caching`
- Queries: `https://tanstack.com/query/latest/docs/framework/react/guides/queries`
- Query keys: `https://tanstack.com/query/latest/docs/framework/react/guides/query-keys`
- Query functions: `https://tanstack.com/query/latest/docs/framework/react/guides/query-functions`
- Query options: `https://tanstack.com/query/latest/docs/framework/react/guides/query-options`
- Dependent queries: `https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries`
- Parallel queries: `https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries`
- Disabling queries: `https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries`
- Infinite queries: `https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries`
- Paginated queries: `https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries`
- Query cancellation: `https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation`
- Query invalidation: `https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation`
- Mutations: `https://tanstack.com/query/latest/docs/framework/react/guides/mutations`
- Invalidations from mutations: `https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations`
- Updates from mutation responses: `https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses`
- Optimistic updates: `https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates`
- Prefetching and router integration: `https://tanstack.com/query/latest/docs/framework/react/guides/prefetching`
- SSR and hydration: `https://tanstack.com/query/latest/docs/framework/react/guides/ssr`
- Advanced SSR: `https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr`
- Suspense: `https://tanstack.com/query/latest/docs/framework/react/guides/suspense`
- Render optimizations: `https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations`
- Network mode: `https://tanstack.com/query/latest/docs/framework/react/guides/network-mode`
- Testing: `https://tanstack.com/query/latest/docs/framework/react/guides/testing`
- Migrating to v5: `https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5`

Plugins and tooling:

- Persist Query Client: `https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient`
- Async storage persister: `https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister`
- Sync storage persister: `https://tanstack.com/query/latest/docs/framework/react/plugins/createSyncStoragePersister`
- Broadcast Query Client: `https://tanstack.com/query/latest/docs/framework/react/plugins/broadcastQueryClient`
- ESLint plugin: `https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query`

## Raw Docs

Use GitHub raw docs when the website is hard to fetch:

- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/overview.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/installation.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/quick-start.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/typescript.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/devtools.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/guides/<guide-name>.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/reference/<reference-name>.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/plugins/<plugin-name>.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/eslint/eslint-plugin-query.md`

## Refresh Triggers

Refresh docs before relying on this skill when:

- The installed package is not v5, or package versions differ across `@tanstack/react-query`, `query-core`, devtools, and plugins.
- The task touches SSR, Server Components, streaming, router prefetching, persistence, broadcast sync, or offline mutations.
- Code uses positional `useQuery(key, fn)` signatures, `cacheTime`, `Hydrate`, query `onSuccess`, or `status: 'loading'`.
- TypeScript errors mention `queryOptions`, `mutationOptions`, `Register`, `skipToken`, `initialPageParam`, or hydration.
- The repo has custom query key factories, active route loaders, or cross-tab/offline behavior.
