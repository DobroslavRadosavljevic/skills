# SSR, TanStack Start, And Testing

## Rules

- Module-level `createCollection` singletons are client-only. On a server they would be shared across requests. Use `collectionOptions(id, factory)` descriptors plus one `DbClient` per server request and one stable `DbClient` per browser app.
- Hydration moves **explicit collection rows** or **live-query result snapshots**. It never serializes handlers, pending optimistic mutations, subscriptions, the dataflow graph, or transaction stacks.
- Hydrated rows are provisional synced state, applied without invoking mutation handlers. Adapter sync stays authoritative and reconciles the first insert of an existing key as an update. Hydration never marks sync ready by itself.
- `initialData` precedence before adapter sync starts (low to high): per-materialization `initialData`, persisted rows, hydrated rows. Fresh sync beats all three.
- Whatever you preload ends up in the HTML. Scope server `DbClient` data to the requesting user.

## Server And Browser Flow

```tsx
// server loader / function
const dbClient = new DbClient({ queryClient: new QueryClient() })

// Option A: ship normalized source rows (several queries reuse them)
await dbClient.collection(todoCollection).preload()
// Option B: ship only the rendered result (source much larger than the view)
await dbClient.preloadLiveQuery({
  query: (q) => q.from({ todo: todoCollection }).where(({ todo }) => eq(todo.status, 'open'))
    .select(({ todo }) => ({ id: todo.id, title: todo.title })),
})
const state = dbClient.dehydrate() // DehydratedDbState; serialize with your framework
```

```tsx
// browser root
const [dbClient] = React.useState(() => new DbClient({ queryClient }))
return (
  <DbProvider client={dbClient}>
    <HydrationBoundary state={loaderData.dbState}><App /></HydrationBoundary>
  </DbProvider>
)
// or imperatively: dbClient.hydrate(state) before any hook reads DB
```

- Browser queries first show the hydrated snapshot, start source sync on commit (so markup matches the server), then publish one atomic handoff to the live result.
- On-demand collections: preload through `preloadLiveQuery` or `queryOnce`, not a bare `collection.preload()`.
- Incremental streams: `dbClient.applyCollectionChunk({ collectionId, rows: [{ key, value, metadata? }], syncMeta? })`. Chunks for an unmaterialized collection are stored and applied on materialize.
- `dehydrate({ shouldDehydrateCollection, shouldDehydrateLiveQuery })` filters what ships.
- Adapters may implement `exportSyncMeta`, `importSyncMeta`, `mergeSyncMeta` so sync resumes from a safe point. Version that payload; ignore unknown versions.
- Query identity must be identical on server and browser. Structured queries derive it automatically; `.fn.*` queries need a serializable `queryKey` or streaming throws.
- Svelte: `client.hydrate(state)` then `<DbProvider {client}>`. Vue, Solid, Angular have no client-provider SSR yet.

## TanStack Start

```tsx
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { DbClient } from '@tanstack/react-db'
import { routerWithDbClient } from '@tanstack/react-router-with-db'
import { routeTree } from './routeTree.gen'

export type RouterContext = { dbClient: DbClient }

export function getRouter() {
  const dbClient = new DbClient({ queryClient: new QueryClient() }) // one per getRouter() call
  const router = createRouter({ routeTree, context: { dbClient } })
  return routerWithDbClient(router, dbClient)
}
```

```tsx
// __root.tsx: createRootRouteWithContext<RouterContext>()
function TodoList() {
  const { data } = useLiveSuspenseQuery({
    query: (q) => q.from({ todo: todoCollection }).where(({ todo }) => eq(todo.status, 'open')),
  })
  return data.map((t) => <Todo key={t.id} todo={t} />)
}
// <Suspense fallback={<p>Loading</p>}><TodoList /></Suspense> inside the route component
```

- `@tanstack/react-router-with-db` (0.1.0, peers `@tanstack/react-db`, `@tanstack/react-router`, `@tanstack/router-core`) adds `dbClient` to router context, wraps the app in `DbProvider`, dehydrates critical state, and streams query results discovered by `useLiveSuspenseQuery` while rendering. Source collections and the dataflow graph never cross the wire.
- Start creates the router per request, so `getRouter()` gives per-request isolation. Do not hoist the `DbClient` or `QueryClient` to module scope on the server.
- Pass runtime flags as `DbClient` dependencies (for example `runtime: 'server' | 'browser'` from `createIsomorphicFn`) and read them with `client.requireDependency` in factories.
- Loader pattern: build a fresh `DbClient` in the loader, preload, return `dehydrate()`; in the component, `dbClient.hydrate(dbState)` on the context client (guard with `useState` initializer) or use `HydrationBoundary`. `examples/react/start-ssr-e2e` in the repo shows both.
- Client-only alternative (no SSR of DB data): keep `createCollection` singletons, set `ssr: false` on routes whose loaders call `collection.preload()`, and preload there so sync starts at navigation. This is the older package guidance that predates `DbClient` SSR; without `ssr: false` the loader would run on the server against a shared singleton.
- Authenticated sync endpoints (Electric proxy, API routes) are Start server routes; keep secrets and shape `where` clauses server-side.
- Query SSR and DB hydration are separate mechanisms. An existing or hydrated Query cache entry with the exact same key takes precedence over `initialData` for an eager Query Collection, but verify the first render rather than assuming it; use `DbClient` hydration for guaranteed row transport.

## Next.js App Router

Start the preload without awaiting, dehydrate the pending promise, and pass it to a client component that creates the browser `DbClient`, `DbProvider`, and `HydrationBoundary`:

```tsx
export default function Page() {
  const dbClient = new DbClient()
  void dbClient.preloadLiveQuery(openTodosQuery)
  const state = dbClient.dehydrate({ shouldDehydrateCollection: () => false, shouldDehydrateLiveQuery: () => true })
  return <DbHydration state={state}><Suspense fallback={<p>Loading</p>}><TodoList /></Suspense></DbHydration>
}
```

## Testing

No dedicated testing guide exists upstream; these patterns follow the documented APIs.

- Create a fresh `DbClient` (and `QueryClient` with `retry: false`) per test; `await dbClient.cleanup()` in `afterEach`. Never share collections between tests.
- Stub a source with a tiny sync adapter instead of mocking DB internals:

```ts
const items = collectionOptions('items', () => ({
  id: 'items',
  getKey: (i: Item) => i.id,
  sync: { sync: ({ begin, write, commit, markReady }) => {
    begin(); seed.forEach((value) => write({ type: 'insert', value })); commit(); markReady()
  } },
  onUpdate: async () => { throw new Error('boom') }, // exercise rollback
}))
```

- Use `localOnlyCollectionOptions` for pure UI/local logic and `queryOnce(q => ...)` to assert query results without hooks.
- Assert optimistic state synchronously after the write, then `await expect(tx.when('settled')).rejects...` and assert rollback. For success, assert after `await tx.when('settled')`.
- Test handler sync-back separately per adapter (Query: mocked `queryFn` returns server truth after `refetch`; Electric: simulate a stream message with the txid).
- Test the empty-array case for Query Collections and `loadSubsetOptions` parsing for on-demand `queryFn`s.
- React: wrap hooks in `<DbProvider client={dbClient}>`; await the first ready state (`isReady`) before asserting data. A render that suspends needs a `Suspense` wrapper.
- `createIndexedDB` accepts a custom `idbFactory` (for example from `fake-indexeddb`) for tests.
- SSR: assert server-rendered markup contains hydrated rows, the browser reuses them with no hydration warning, and source-only fields never appear in the payload.
- In dev, two copies of `@tanstack/db` throw `DuplicateDbInstanceError`; fix dedupe/versions instead of setting `TANSTACK_DB_DISABLE_DUP_CHECK=1`.
