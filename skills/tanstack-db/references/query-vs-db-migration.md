# DB vs Plain Query, Migration, And Breaking Changes

## Decision Guide

TanStack DB extends TanStack Query; a Query Collection uses a `QueryClient` underneath. The choice is per feature, not per app.

| Situation | Use |
| --- | --- |
| One screen fetches one resource; no client-side joins or re-sorting | Plain Query (`useQuery`) |
| Server state with simple cache, invalidate, refetch, pagination via `useInfiniteQuery` | Plain Query |
| Same entities shown in many views with different filters/sorts/aggregates | DB |
| Client-side joins across resources (todos + lists + users) instead of bespoke endpoints | DB |
| Optimistic write must update several lists/counters at once | DB |
| Mutation rollback boilerplate (`onMutate`/`onError`/`onSettled`) repeated everywhere | DB |
| Realtime sync engine (Electric, PowerSync, TrailBase, RxDB) | DB |
| Offline reads, local persistence, or an outbox of pending writes | DB (+ persistence / offline-transactions) |
| Large dataset where each view should load only its subset | DB `on-demand` (needs a backend that can take pushed-down predicates) |
| Local-only UI state with no joins | Plain React state or a store, not DB |
| Data that must always be fresh and is read once (reports, one-off exports) | Plain Query |
| Very large tables with no way to push predicates and no memory budget | Neither; keep server-side filtering |

Cost of DB: beta API with deprecations before 1.0, more concepts (collections, handlers, sync-back), everything in a collection lives in memory, and eager collections load their whole scope. Choose DB when the pain it removes (waterfalls, endpoint sprawl, slow client filtering, optimistic plumbing) is real.

## Incremental Migration From TanStack Query

Migrate one entity at a time; the rest of the app keeps `useQuery`.

1. **Pick the first entity** with several views or a painful optimistic write. Leave one-off reads alone.
2. **Install**: `bun add @tanstack/react-db @tanstack/query-db-collection`. Reuse the existing `QueryClient` (`@tanstack/query-core` is the same package React Query builds on; keep a single copy).
3. **Add the client and provider** under the existing `QueryClientProvider`:

   ```tsx
   const dbClient = new DbClient({ queryClient })
   // <QueryClientProvider client={queryClient}><DbProvider client={dbClient}>...
   ```

4. **Wrap the existing fetcher** as a Query Collection, reusing its `queryFn` and key factory:

   ```ts
   export const todoCollection = collectionOptions('todos', (client) =>
     queryCollectionOptions<Todo>({
       id: 'todos',
       queryKey: todoKeys.all,
       queryClient: client.requireDependency<QueryClient>('queryClient'),
       queryFn: fetchAllTodos,       // must return the complete set for this scope
       getKey: (t) => t.id,
       staleTime: 30_000,
     }),
   )
   ```

   If `useQuery` and the collection use the exact same key they share one cache document. If their result shapes differ (wrapped response, `select`), give the collection its own key.
5. **Move reads**: replace `useQuery` + `useMemo` filter/sort/join code with `useLiveQuery({ query })`. Drop derived-state glue and per-item N+1 queries in favor of `where`/`join`/`includes`.
6. **Move writes**: convert `useMutation` with cache plumbing into collection handlers (`onInsert`/`onUpdate`/`onDelete`) that call the API and then `await collection.utils.refetch()` (+ `return { refetch: false }` pre-1.0). Call `todos.insert/update/delete` from components. Use `createOptimisticAction` for multi-collection or intent-style writes.
7. **Keep invalidation working**: `queryClient.invalidateQueries({ queryKey })` still refetches a Query Collection's key. Prefer collection `utils.refetch()` or direct writes (`writeUpsert`) over `setQueryData` on a key a collection owns; treat the collection as the owner of that key.
8. **Handle semantics that differ**: `queryFn` result is full state and `[]` deletes all rows; `placeholderData` is unsupported; `select` means row extraction; `structuralSharing` and `notifyOnChangeProps` are managed by the adapter; `initialData` is eager-only.
9. **Scale up when needed**: switch large entities to `syncMode: 'on-demand'` with `parseLoadSubsetOptions`; add a sync engine later without changing components, since queries and mutations use the same collection API.
10. **SSR**: if the app uses Query SSR, migrate to descriptors + `DbClient` hydration for DB-backed routes (see [ssr-testing.md](ssr-testing.md)).
11. **Verify per entity**: optimistic apply, rollback on failure, refetch-after-write, empty list, error state, tab refocus, and no double fetch.

Stop at any step; a half-migrated app is a supported state.

## Deprecations Removed Or Changing At 1.0

Docs say these keep working in 0.12.x and are removed before or at 1.0 (the transaction and virtual-prop items name the "1.0 RC"):

| Today | Replace with |
| --- | --- |
| `useLiveQuery(fn, [deps])`, `useLiveSuspenseQuery(fn, deps)`, `useLiveInfiniteQuery(fn, config, deps)` | `useLiveQuery({ query })`; add `queryKey` only for opaque logic |
| Unhashable query without `queryKey` (warns, mount-stable identity) | Structured expressions or an explicit serializable `queryKey` (1.0 throws) |
| `tx.isPersisted.promise` | `tx.when('settled')` |
| `row.$synced` / `eq(row.$synced, true)` | `!row.$hasPendingWrites` / `eq(row.$hasPendingWrites, false)` |
| Query Collection auto-refetch after handlers | `await collection.utils.refetch()` in the handler, then drop `return { refetch: false }` in 1.0 |
| Electric handler `return { txid }` | `await collection.utils.awaitTxId(txid)` in the handler |
| Handler return values generally (since 0.10) | Do the waiting inside the handler |

`createCollection(...)`, passing collection instances to hooks, and the mutation APIs are explicitly not removed by the SSR work.

## Notable Breaking Changes By Release

- 0.12.0: compound joins; the low-level `JoinClause` IR now stores the predicate in `on` (replace `left`/`right` with `on: new Func('eq', [l, r])`). The sync API drops `begin({ immediate })`; writes during a persisting mutation queue behind it. A transaction's optimistic state drops when its mutation function settles; a handler that returns before the server row arrives shows the previous synced row until that row applies. Aborted subset loads reject with `AbortError`.
- 0.11.x: browser dev builds run the duplicate-instance check; mutation ids are a per-runtime prefix plus counter, not bare UUIDs; new `SyncRowReusedWithoutPreviousValueError` dev check.
- 0.10.0: `Collection.update` keys must match the declared key type; deprecation of handler return values and Query auto-refetch.
- 0.9.0: removed unused subset-algebra helpers (`isWhereSubset`, `unionWherePredicates`, `minusWherePredicates`, `isOrderBySubset`, `isLimitSubset`, `isOffsetLimitSubset`, `isPredicateSubset`, `isLoadSubsetRequestSubsumedBy`); `fn.select()` cannot take collection-valued includes.
- 0.8.0: `DbClient`, `collectionOptions`, `DbProvider`, hydration, and derived query identity added (additive).
- 0.6.0: `autoIndex` default flipped to `off`; indexes are explicit.
- 0.5.0: SQL-style three-valued logic; comparisons with `null`/`undefined` no longer match.
- 0.3.0: `commit()` throws when `mutationFn` fails.
- Pre-release packages: `@tanstack/db-collections` (0.0.x, last published 2025-07) is legacy; use the per-adapter packages. `@tanstack/offline-transactions` is already 1.x.

When upgrading, read the package `CHANGELOG.md` files (db, react-db, query-db-collection, electric-db-collection) between the installed and target versions; DB ships breaking changes in minor releases.
