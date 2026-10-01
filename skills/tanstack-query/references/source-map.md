# TanStack Query Source Map

Snapshot date: 2026-10-01.

## Current Package Evidence

Npm evidence from this snapshot (`latest` dist-tag unless noted):

- `@tanstack/react-query`: `5.104.0` (published 2026-09-26)
- `@tanstack/query-core`: `5.104.0`
- `@tanstack/react-query-devtools`: `5.104.0` (peers: `react` and `@types/react` `^18 || ^19`, `@tanstack/react-query` `^5.104.0`)
- `@tanstack/eslint-plugin-query`: `5.104.0`
- `@tanstack/react-query-persist-client`: `5.104.0`
- `@tanstack/query-persist-client-core`: `5.104.0`
- `@tanstack/query-async-storage-persister`: `5.104.0`
- `@tanstack/query-sync-storage-persister`: `5.104.0` (deprecated; prefer async persister)
- `@tanstack/query-broadcast-client-experimental`: `5.104.0`
- `@tanstack/react-query-next-experimental`: `5.104.0`
- `@tanstack/react-query` dist-tags: `latest` is `5.104.0`, `previous` is `4.44.0`; `rc` / `beta` / `alpha` are stale v5 prereleases (`5.0.0-rc.16`, `5.0.0-beta.35`, `5.0.0-alpha.91`). No React Query v6 prerelease is published.
- Peer dependency: `react` `^18 || ^19`

Changes since the previous snapshot (`5.101.4`):

- `5.102.0`: added `queryClient.query` / `queryClient.infiniteQuery`; deprecated `fetchQuery`, `prefetchQuery`, `ensureQueryData`, and infinite variants (removal planned for the next major). Removed experimental render-time prefetching and the query result `promise` property. `usePrefetchQuery` / `usePrefetchInfiniteQuery` use the new methods. Many observer, Suspense, and memory fixes.
- `5.102.x`: hydration typing accepts partial dehydrated state; `MutationCacheConfig` / `QueryCacheConfig` exported; `useQueries` / `useSuspenseQueries` throw falsy errors to boundaries.
- `5.103.x`: exported manager types; trailing-`undefined` partial key filters no longer match shorter keys; structural sharing handles own `constructor` properties; persisted falsy values restore; broadcast client no longer overwrites resolved data on `added` events.
- `5.104.0`: packages built with Vite 8 (no API change).

Other frameworks in the same repo use different majors (for example Svelte Query `6.x`, Solid Query `6.0.0-rc.*` for Solid 2, and a new `@tanstack/angular-query` `5.0.0-rc.0`). Do not read those as React Query majors.

Context7 resolves official TanStack Query docs as `/websites/tanstack_query` (the old `/websites/tanstack_query_v5` ID redirects there; it already covers `queryClient.query`) or `/tanstack/query`. Versioned Context7 IDs may lag npm; when they disagree with npm `5.104.x`, prefer tanstack.com `/query/latest`, GitHub `main` raw docs, and installed package types.

## Official Current Docs

Core:

- Overview: `https://tanstack.com/query/latest/docs/framework/react/overview`
- Installation: `https://tanstack.com/query/latest/docs/framework/react/installation`
- Quick start: `https://tanstack.com/query/latest/docs/framework/react/quick-start`
- TypeScript: `https://tanstack.com/query/latest/docs/framework/react/typescript`
- Devtools: `https://tanstack.com/query/latest/docs/framework/react/devtools`
- API reference index (generated from source): `https://tanstack.com/query/latest/docs/framework/react/reference/index`
- `QueryClient` (includes `query`, `infiniteQuery`, and deprecated methods): `https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient`
- QueryClientProvider: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/QueryClientProvider`
- `useQuery`: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery`
- `useMutation`: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/useMutation`
- `useInfiniteQuery`: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/useInfiniteQuery`
- `useQueries`: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQueries`
- `queryOptions`: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/queryOptions`
- `mutationOptions`: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/mutationOptions`
- Hydration: `https://tanstack.com/query/latest/docs/framework/react/reference/functions/dehydrate`, `.../functions/hydrate`, `.../functions/HydrationBoundary`

Older short reference URLs (for example `/reference/useQuery`) still resolve on the site, but the repo now generates reference pages under `reference/functions/`, `reference/classes/`, `reference/interfaces/`, and `reference/type-aliases/`.

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
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/reference/functions/<function-name>.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/reference/classes/QueryClient.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/plugins/<plugin-name>.md`
- `https://raw.githubusercontent.com/TanStack/query/main/docs/eslint/eslint-plugin-query.md`

When raw `main` and `/query/latest` disagree on support windows or APIs, prefer the published `/query/latest` site and the installed package types.

## Refresh Triggers

Refresh docs before relying on this skill when:

- The installed package is not v5, or package versions differ across `@tanstack/react-query`, `query-core`, devtools, and plugins.
- The task touches SSR, Server Components, streaming, router prefetching, persistence, broadcast sync, or offline mutations.
- Code uses positional `useQuery(key, fn)` signatures, `cacheTime`, `Hydrate`, query `onSuccess`, or `status: 'loading'`.
- Code uses deprecated `fetchQuery`, `prefetchQuery`, `ensureQueryData`, their infinite variants, `experimental_prefetchInRender`, or `query.promise`.
- TypeScript errors mention `queryOptions`, `mutationOptions`, `Register`, `skipToken`, `initialPageParam`, `environmentManager`, `QueryExecuteOptions`, or hydration.
- The repo has custom query key factories, active route loaders, or cross-tab/offline behavior.
