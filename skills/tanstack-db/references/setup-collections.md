# Setup And Collections

## Status And Packages

TanStack DB is beta and on the `0.x` line (snapshot 2026-10-09). The npm `latest` tag is the only tag; there is no 1.0 RC yet. Docs mention a planned 1.0 RC that removes several deprecated APIs (see [query-vs-db-migration.md](query-vs-db-migration.md)).

| Package | Version | Role |
| --- | --- | --- |
| `@tanstack/db` | 0.12.3 | Core: collections, live queries, transactions, `DbClient`, local collections |
| `@tanstack/react-db` | 0.5.7 | React hooks and `DbProvider`; re-exports all of `@tanstack/db`; React `>=18` |
| `@tanstack/vue-db` / `solid-db` / `svelte-db` / `angular-db` | 0.3.7 / 0.3.7 / 0.5.7 / 0.2.7 | Other frameworks (Angular needs operators from `@tanstack/db`) |
| `@tanstack/query-db-collection` | 1.4.2 | Query Collection; peer `@tanstack/query-core ^5` |
| `@tanstack/electric-db-collection` | 0.5.8 | Electric sync |
| `@tanstack/trailbase-db-collection` | 0.1.118 | TrailBase sync |
| `@tanstack/rxdb-db-collection` | 0.1.106 | RxDB bridge |
| `@tanstack/powersync-db-collection` | 0.2.8 | PowerSync bridge |
| `@tanstack/offline-transactions` | 1.0.65 | Durable outbox for pending mutations |
| `@tanstack/react-router-with-db` | 0.1.0 | Router/Start SSR streaming adapter |
| `@tanstack/*-db-sqlite-persistence` | 0.2.x | Runtime SQLite persistence wrappers (core 0.4.7) |

Install:

```sh
bun add @tanstack/react-db @tanstack/query-db-collection @tanstack/query-core
bun add @tanstack/electric-db-collection   # only when syncing from Electric
```

Always check `bun pm ls` or the lockfile for one copy of `@tanstack/db`. Framework packages pin it exactly.

## Two Ways To Define Collections

Descriptor style (current, SSR-safe, testable):

```tsx
import { DbClient, DbProvider, collectionOptions, useDbClient } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'

export const todoCollection = collectionOptions('todos', (client) =>
  queryCollectionOptions<Todo>({
    id: 'todos',
    queryKey: ['todos'],
    queryClient: client.requireDependency<QueryClient>('queryClient'),
    queryFn: async ({ signal }) => (await fetch('/api/todos', { signal })).json(),
    getKey: (todo) => todo.id,
  }),
)

const queryClient = new QueryClient()
const dbClient = new DbClient({ queryClient }) // options are named dependencies

// <DbProvider client={dbClient}><App /></DbProvider>
export const useTodoCollection = () => useDbClient().collection(todoCollection)
```

- `collectionOptions(id, factory)` returns a stable descriptor. Each `DbClient` calls the factory for fresh adapter config and its own collection instance.
- First-party adapter creators attach their own factory, so `collectionOptions(localOnlyCollectionOptions({...}))` also works.
- Within one `DbClient`, descriptors with the same `id` resolve to one collection; only the first descriptor materializes. A descriptor made from an arbitrary concrete config can materialize in one `DbClient` only.
- Pass descriptors straight into `q.from({ todo: todoCollection })`. A `DbProvider` is required to resolve them; without one DB throws instead of using hidden global state.
- Use `useDbClient().collection(descriptor)` only for imperative calls (`insert`, `update`, `delete`, `preload`, `utils`).
- `DbClient` also offers `preloadLiveQuery`, `dehydrate`, `hydrate`, `applyCollectionChunk`, `createTransaction`, `subscribe`, `getDependency`, `requireDependency`, and `cleanup()`.

Singleton style (still supported, client-only apps):

```ts
import { createCollection } from '@tanstack/react-db'

export const todoCollection = createCollection(
  queryCollectionOptions({ id: 'todos', queryKey: ['todos'], queryClient, queryFn, getKey: (t) => t.id }),
)
```

Pick descriptors for SSR, per-request or per-tenant scope, and tests. Singletons are fine for a pure SPA with one `QueryClient`. Do not create several instances for the same scope: they sync twice and split state.

Business scope belongs in the id, for example `collectionOptions("project:" + projectId + ":todos", ...)`, with the same value in the Query key and `queryFn`. Do not make a collection per `where`/`orderBy`; use `on-demand` mode for subsets.

## Core Collection Options

| Option | Notes |
| --- | --- |
| `id` | Stable, explicit, unique per scope. Required for descriptors and SSR. |
| `getKey` | `(row) => string \| number`. Must return a defined value for every row (`UndefinedKeyError` otherwise). |
| `schema` | Standard Schema. Infers types; do not also pass an explicit generic. |
| `sync` | Custom `{ sync, ... }`; adapters supply this. |
| `syncMode` | `eager` (default), `on-demand`; `progressive` documented for Electric. |
| `startSync` | Start syncing on creation (adapter default is usually `true`). |
| `gcTime` | Idle cleanup delay for the collection. |
| `onInsert` / `onUpdate` / `onDelete` | Persistence handlers. See [mutations.md](mutations.md). |
| `autoIndex`, `defaultIndexType` | Indexing is opt-in (`autoIndex` defaults to `off`). |
| `compare`, `defaultStringCollation` | Row ordering; match backend collation (Electric). |

Status values: `idle`, `loading`, `initialCommit`, `ready`, `error`, `cleaned-up`. Use `await collection.preload()`, `await collection.cleanup()`, `collection.get(key)`, `collection.toArray`, `collection.utils`.

## Schemas And Type Inference

```ts
import { z } from 'zod'

const todoSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  completed: z.boolean().default(false),
  created_at: z.union([z.string(), z.date()]).transform((v) => (typeof v === 'string' ? new Date(v) : v)),
})
// TInput: created_at string | Date, completed optional. TOutput: created_at Date.
```

- Any Standard Schema library works: Zod, Valibot, ArkType, Effect Schema.
- Schemas validate only client `insert()`/`update()`. Failures throw `SchemaValidationError` (`error.type`, `error.issues`) before handlers run. Rows from the server are not validated; parse them in `queryFn` or the adapter.
- Everything stored, queried, and passed to handlers is `TOutput`. Serialize back (for example `toISOString()`) inside the handler.
- `TInput` must be a superset of `TOutput`, because `update()` drafts hold `TOutput` values. Use `z.union([z.string(), z.date()])` for transforms. Zod 4.1+ codecs follow the same rule; the codec input must accept the stored output.
- Validation must be synchronous (`SchemaMustBeSynchronousError`). Do async checks inside handlers.
- Defaults (`.default(...)`) fill missing fields on insert, including timestamps like `created_at: z.date().default(() => new Date())`.
- Without a schema, type the row: `queryCollectionOptions<Todo>(...)`. Do not pass both a generic and `schema`.

## Sync Modes

- `eager` (default): loads the whole collection first. Best under roughly 10k mostly static rows.
- `on-demand`: loads only what live queries request. Query predicates (`where`, `orderBy`, `limit`, `offset`) reach the adapter as `LoadSubsetOptions`. Best for large tables, search, and catalogs (roughly over 50k rows).
- `progressive`: loads the requested subset first, then completes the full sync in the background. Documented for Electric.
- Preload on-demand data through a live query (`dbClient.preloadLiveQuery`, `queryOnce`, or `liveQuery.preload()`); preloading the bare collection does not load subsets.
- Fewer requests than view-specific endpoints is expected: DB dedupes identical subset requests and loads deltas when a query widens.

## Indexes

Indexing is opt-in because it costs bundle size.

```ts
import { BasicIndex } from '@tanstack/db'

queryCollectionOptions({ /* ... */ autoIndex: 'eager', defaultIndexType: BasicIndex })
collection.createIndex((row) => row.createdAt) // explicit
```

Add indexes for fields used in hot `where`/`orderBy`/join conditions on large eager collections. Dev mode can suggest indexes (`configureIndexDevMode`).

## Custom Sync

A sync function receives `{ begin, write, commit, markReady, markError, truncate, collection }` and returns cleanup:

```ts
sync: ({ begin, write, commit, markReady }) => {
  const stop = subscribe((event) => { begin(); write({ type: event.type, value: event.row }); commit() })
  markReady() // only after a usable snapshot exists
  return () => stop()
}
```

- Subscribe first, buffer events during the initial fetch, then flush. Call `markError` only while `collection.status === 'loading'`.
- On-demand adapters return `{ loadSubset }` from `sync`. Adapters can export `exportSyncMeta`/`importSyncMeta`/`mergeSyncMeta` for resumable sync.
- Wrap adapter-specific options (parse, serialize, row update mode) in the adapter; DB does not apply them for you.
- In dev, DB throws `SyncRowReusedWithoutPreviousValueError` if a sync source mutates a row object it already wrote without `previousValue`. Write new row objects.
