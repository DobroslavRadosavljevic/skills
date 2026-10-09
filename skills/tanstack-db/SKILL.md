---
name: tanstack-db
description: "Build, review, debug, migrate, or plan TanStack DB (0.12.x, beta, pre-1.0; @tanstack/db 0.12.3, @tanstack/react-db 0.5.7) client-side reactive data with current docs. Use for collections, createCollection, collectionOptions, DbClient, DbProvider, useDbClient, queryCollectionOptions (@tanstack/query-db-collection), electricCollectionOptions, trailBaseCollectionOptions, rxdbCollectionOptions, powerSyncCollectionOptions, localOnly/localStorage collections, getKey, Standard Schema/Zod schemas, useLiveQuery, useLiveSuspenseQuery, useLiveInfiniteQuery, query builder (from, where, join, select, groupBy, orderBy, limit, includes, eq/and/gt/like), differential dataflow, syncMode eager/on-demand/progressive, insert/update/delete, onInsert/onUpdate/onDelete, createOptimisticAction, createTransaction, paced mutations, awaitTxId, rollback, offline-transactions, SQLite persistence, SSR hydration, TanStack Start, migrating TanStack Query apps, deciding DB vs plain Query, and testing."
---

# TanStack DB

Use this skill when work touches TanStack DB: collections, live queries, optimistic mutations, sync engines, local persistence, offline queues, or moving a TanStack Query app onto DB.

## Workflow

1. Inspect the local DB shape before changing code:
   - Package versions for `@tanstack/db`, framework package (`@tanstack/react-db`), collection adapters, `@tanstack/query-core`, `@tanstack/offline-transactions`, `@tanstack/react-router-with-db`, React, and router.
   - Definition style: `collectionOptions(...)` descriptors with `DbClient`/`DbProvider`, or module-level `createCollection(...)` singletons.
   - Data source per collection: REST via Query, Electric, TrailBase, RxDB, PowerSync, local-only, localStorage, or custom sync.
   - Sync mode (`eager`, `on-demand`, `progressive`), mutation handlers, how each handler waits for sync-back, and whether SSR or offline is in scope.
2. Refresh docs when versions or behavior matter. DB is beta and moves fast; start from [source-map.md](references/source-map.md).
3. For packages, `DbClient`, descriptors, `getKey`, schemas, sync modes, indexes, and lifecycle, use [setup-collections.md](references/setup-collections.md).
4. For per-backend setup (Query, Electric, TrailBase, RxDB, PowerSync, local collections, custom sync), use [adapters.md](references/adapters.md).
5. For the query builder, operators, joins, includes, aggregates, hooks, query identity, and performance, use [live-queries.md](references/live-queries.md).
6. For `insert`/`update`/`delete`, handlers, `createOptimisticAction`, transactions, paced mutations, rollback, and errors, use [mutations.md](references/mutations.md).
7. For SQLite/IndexedDB persistence and `@tanstack/offline-transactions`, use [persistence-offline.md](references/persistence-offline.md).
8. For SSR, hydration, TanStack Start, Next.js streaming, and testing, use [ssr-testing.md](references/ssr-testing.md).
9. For "DB or plain Query?", incremental migration, deprecations, and breaking changes, use [query-vs-db-migration.md](references/query-vs-db-migration.md).

## When To Use DB vs Plain Query

- Keep plain TanStack Query for independent server reads, one-screen fetches, simple cache-and-invalidate flows, and data that is never joined, re-sorted, or filtered client-side.
- Add DB when several views need the same entities with different filters, sorts, joins, or aggregates, when optimistic writes touch more than one list, or when a sync engine streams changes.
- DB is not a replacement for Query. A Query Collection runs on a `QueryClient`; the two coexist in one app.
- Full guide and a migration order: [query-vs-db-migration.md](references/query-vs-db-migration.md).

## Implementation Judgment

- DB is beta (0.x). Pin exact versions, because `@tanstack/react-db` pins `@tanstack/db` exactly and two copies throw `DuplicateDbInstanceError` in development.
- Prefer `collectionOptions(id, factory)` descriptors plus `DbClient`/`DbProvider` for new code and anything SSR, tenant-scoped, or tested. `createCollection` still works for client-only singletons.
- Always give a stable explicit `id` and a `getKey` that returns a defined key for every row. Put every changing scope value (tenant, project) in the collection `id` and Query key.
- Use a Standard Schema (Zod, Valibot, ArkType, Effect Schema) for types and client-mutation validation. With transforms, `TInput` must accept `TOutput` values. Schemas do not validate rows from the server.
- Query with the builder helpers (`eq`, `and`, `gt`, `like`, `coalesce`, ...), not JS `===`, `.filter()`, or `||`. Use `.fn.*` variants only when unavoidable; they skip the optimizer and indexes, and need a `queryKey` in React.
- Every `limit`/`offset` needs an `orderBy`. Without `orderBy`, result order is not guaranteed. Joins accept only `eq` or `and` of `eq`.
- A mutation handler must not resolve until the write is visible in synced data, or the optimistic row flickers. Use `refetch()` (Query), `awaitTxId`/`awaitMatch` (Electric), or the adapter's equivalent.
- A Query Collection `queryFn` returns the full state for that scope. Returning `[]` deletes every row.
- Use `tx.when('settled')` for transaction outcomes. `isPersisted.promise` is deprecated. "Settled" means the handler returned; it proves server confirmation only if the handler waited for it.
- Use client-generated UUIDs (`safeRandomUUID()`) for keys so optimistic and synced rows share one key.
- For SSR, create one `DbClient` per request and hydrate a browser `DbClient`. Never share a module-level collection across requests.

## Verification

Prefer the repo's existing checks. For meaningful TanStack DB changes, include the relevant subset:

- Typecheck for collection row types, schema `TInput`/`TOutput`, live query result types, and handler `transaction.mutations` usage.
- Focused tests with a fresh `DbClient` per test for query results, optimistic apply, rollback on handler error, and `await tx.when('settled')`.
- Adapter tests for sync-back waits (`refetch`, `awaitTxId`), on-demand `loadSubsetOptions` parsing, and the empty-result case.
- SSR smoke when touching hydration, `dehydrate()`/`hydrate()`, Suspense streaming, or router context.
- Browser smoke for loading, error, optimistic pending, rollback, and cross-tab or reconnect behavior.
