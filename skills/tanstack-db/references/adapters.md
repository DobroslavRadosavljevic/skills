# Collection Adapters

## Choosing An Adapter

| Backend | Options function | Package |
| --- | --- | --- |
| REST / GraphQL via TanStack Query | `queryCollectionOptions` | `@tanstack/query-db-collection` |
| Postgres via ElectricSQL | `electricCollectionOptions` | `@tanstack/electric-db-collection` |
| TrailBase | `trailBaseCollectionOptions` (capital B) | `@tanstack/trailbase-db-collection` |
| RxDB (durable local DB + replication) | `rxdbCollectionOptions` | `@tanstack/rxdb-db-collection` |
| PowerSync (SQLite, offline-first) | `powerSyncCollectionOptions` | `@tanstack/powersync-db-collection` |
| Session UI state | `localOnlyCollectionOptions` | `@tanstack/db` |
| Small persisted prefs | `localStorageCollectionOptions` | `@tanstack/db` |
| Browser IndexedDB | `indexedDBCollectionOptions` + `createIndexedDB` | `@tanstack/db` (on `main`, not in 0.12.3; verify before use) |
| Anything else | custom `sync` | see [setup-collections.md](setup-collections.md) |

Wrap the result in `collectionOptions(...)` (or pass it to `createCollection`). Use the adapter that matches the backend; do not fake a backend with a local-only collection plus manual fetching.

## Query Collection

Bridges TanStack Query into DB. Uses `@tanstack/query-core`'s `QueryClient`.

```ts
import { QueryClient } from '@tanstack/query-core'
import { DbClient, collectionOptions } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

const todos = collectionOptions('todos', (client) =>
  queryCollectionOptions<Todo>({
    id: 'todos',
    queryKey: ['todos'],
    queryClient: client.requireDependency<QueryClient>('queryClient'),
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/todos', { signal })
      if (!res.ok) throw new Error('Failed to load todos')
      return res.json()
    },
    getKey: (t) => t.id,
    onInsert: async ({ transaction, collection }) => {
      await api.todos.create(transaction.mutations[0].modified)
      await collection.utils.refetch()
      return { refetch: false } // drop this line in 1.0
    },
  }),
)
const dbClient = new DbClient({ queryClient })
```

Rules:

- `queryFn` returns the **complete state** for that collection (eager) or for the requested subset (on-demand). Rows missing from the result are deleted. `[]` deletes everything. Never point one collection at several narrower endpoints; use separate collections, `on-demand`, or direct writes.
- Forward `signal` from the context to `fetch`. `collection.cleanup()` cancels tracked Query keys; clients that ignore `signal` keep running.
- Forwarded Query options: `select`, `enabled`, `refetchInterval`, `retry`, `retryDelay`, `staleTime`, `gcTime`, `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchOnMount`, `networkMode`, `initialData`, `initialDataUpdatedAt`, `meta`. `placeholderData` is unsupported. `select` here means "extract the row array from a wrapped response", not Query's observer `select`.
- `initialData` works for eager collections only.
- Two collections with the same `QueryClient` and exact `queryKey` share one Query cache document. Use distinct keys for independent documents.
- Handlers: today a Query Collection refetches automatically after each handler. The explicit pattern is `await collection.utils.refetch()` then `return { refetch: false }`. In 1.0 the auto-refetch goes away and the `return` is removed. Skip the refetch only when the server stores exactly what you sent.
- Utils: `refetch(opts?)`, `clearError()`, `lastError`, `isError`, `errorCount`, direct writes `writeInsert`, `writeUpdate`, `writeDelete`, `writeUpsert`, `writeBatch(() => ...)`. Direct writes bypass optimistic state; use them for WebSocket/SSE pushes or server-computed fields. Await them inside handlers. Eager mode patches the Query cache in place; on-demand revalidates active queries.
- During a persisting mutation, `refetch()` resolves at the fetch boundary, not after rows apply.

### On-demand predicate push-down

```ts
import { parseLoadSubsetOptions } from '@tanstack/db' // also re-exported by the adapter

queryCollectionOptions({
  id: 'products', queryKey: ['products'], queryClient, getKey: (p) => p.id,
  syncMode: 'on-demand',
  queryFn: async (ctx) => {
    const { filters, sorts, limit, offset } = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions)
    const params = new URLSearchParams()
    for (const f of filters) if (f.operator === 'eq') params.set(f.field.join('.'), String(f.value))
    if (sorts[0]) params.set('sort', sorts.map((s) => `${s.field.join('.')}:${s.direction}`).join(','))
    if (limit) params.set('limit', String(limit))
    if (offset) params.set('offset', String(offset))
    return (await fetch(`/api/products?${params}`, { signal: ctx.signal })).json()
  },
})
```

- Helpers: `parseLoadSubsetOptions`, `parseWhereExpression` (custom handlers per operator, `onUnknownOperator`), `parseOrderByExpression`, `extractSimpleComparisons` (AND-only). Supported operators: `eq`, `gt`, `gte`, `lt`, `lte`, `and`, `or`, `in`.
- The API result must match the pushed-down predicate for that subset. Live queries still evaluate predicates locally over loaded rows.
- A static `queryKey` already includes the subset identity. A function `queryKey` replaces that: include every option that changes data (offset too), keep the base key `queryKey({})` as a prefix of derived keys, and build it with `getLoadSubsetDemandKey(opts)`.
- Server pagination: use an on-demand collection with `createCursorPager`; see the Query Collection docs section "Server pagination with live queries".

## Electric Collection

```ts
import { electricCollectionOptions } from '@tanstack/electric-db-collection'

const todos = collectionOptions(
  electricCollectionOptions({
    id: 'todos',
    schema: todoSchema,
    getKey: (t) => t.id,
    shapeOptions: { url: '/api/todos' }, // proxy to Electric, not Electric itself
    // syncMode: 'eager' | 'on-demand' | 'progressive'
    onInsert: async ({ transaction, collection }) => {
      const res = await api.todos.create(transaction.mutations[0].modified)
      await collection.utils.awaitTxId(res.txid) // default timeout 15 s
    },
  }),
)
```

- Wait for sync-back in every handler: `awaitTxId(txid, timeout?)` (recommended) or `awaitMatch(fn, timeout?)` with `isChangeMessage`/`isControlMessage`. Returning `{ txid }` from a handler is deprecated and removed in 1.0.
- Get the txid inside the same Postgres transaction as the write: `SELECT pg_current_xact_id()::xid::text`. A txid from a separate transaction never arrives and `awaitTxId` times out.
- Debug with `localStorage.debug = 'ts/db:electric'` in the browser console.
- Put Electric behind an authenticated proxy (for example a Start server route) that forwards `ELECTRIC_PROTOCOL_QUERY_PARAMS` and sets `table`, optional `where`/`columns` server-side.
- Cleanup rejects pending waits with `StreamAbortedError`; observe those promises.
- Electric streams can resume with SQLite persistence; `awaitTxId` can resolve before the local SQLite write finishes.

## TrailBase Collection

```ts
import { trailBaseCollectionOptions } from '@tanstack/trailbase-db-collection'
import { initClient } from 'trailbase'

const client = initClient('https://trailbase.example.com')
const todos = createCollection(
  trailBaseCollectionOptions({
    id: 'todos',
    recordApi: client.records('todos'),
    getKey: (t) => t.id,
    parse: { created_at: (ts: number) => new Date(ts * 1000) },
    serialize: { created_at: (d: Date) => Math.floor(d.valueOf() / 1000) },
  }),
)
```

- Realtime needs `enable_subscriptions` on the TrailBase server.
- Handlers are optional: TrailBase persists writes itself; use them for extra logic.
- Install `trailbase` next to the collection package.

## RxDB Collection

```ts
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection'

const todos = createCollection(rxdbCollectionOptions({ rxCollection: db.todos, startSync: true }))
```

- RxDB owns durability and replication (`replicateRxCollection`); DB mirrors the change stream in memory and queries there. Data is intentionally duplicated.
- Default handlers write with `bulkUpsert`, `patch`, `bulkRemove`. `syncBatchSize` (default 1000) tunes initial load.
- RxDB schema indexes do not speed up DB live queries.

## PowerSync Collection

```ts
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection'

const documents = createCollection(
  powerSyncCollectionOptions({ database: db, table: APP_SCHEMA.props.documents }),
)
```

- Types come from the PowerSync table (SQLite types: text, integer, no booleans or dates) or from a Standard Schema with input/output transforms.
- Supports on-demand mode, metadata tracking, and advanced transactions; the upload path uses the PowerSync connector's `uploadData`.
- Install the platform SDK (`@powersync/web` + `@journeyapps/wa-sqlite`, or the React Native packages).

## Local Collections

```ts
import { localOnlyCollectionOptions, localStorageCollectionOptions } from '@tanstack/react-db'

const ui = createCollection(localOnlyCollectionOptions({ id: 'ui', getKey: (i) => i.id, initialData: [...] }))
const prefs = createCollection(localStorageCollectionOptions({ id: 'prefs', storageKey: 'app-prefs', getKey: (i) => i.id }))
```

- Call `insert`/`update`/`delete` directly; no server handler is needed. Handlers are optional hooks.
- In a manual `createTransaction`, call `await collection.utils.acceptMutations(transaction)` in `mutationFn`, after the API call if local state must roll back with it. See [mutations.md](mutations.md).
- localStorage stores everything under one key, syncs across tabs via storage events and across same-tab collections sharing one storage object and key. Options: `storage` (`sessionStorage` or custom), `storageEventApi`. Keep data small. With the default JSON parser, peer tabs and restored collections see Dates as strings.
- IndexedDB (`createIndexedDB({ name, version, stores })` then `indexedDBCollectionOptions({ db, name, getKey })`) loads the whole store into memory and syncs tabs via `BroadcastChannel`. It is merged on `main` but absent from `@tanstack/db@0.12.3`; confirm the installed version exports it.
- Local-only collections are not durable and not cross-tab. Use them for UI state, drafts, and wizard state that joins with server data in live queries.
