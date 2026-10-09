# Persistence And Offline

Two independent tools. Use either, or both together:

- **SQLite persistence** stores collection rows (and sync metadata for supported adapters) so a restart can render from disk.
- **`@tanstack/offline-transactions`** stores pending mutations in a durable outbox and retries them when the server is reachable.

Neither one defines how local changes reach the server. That stays a mutation handler or an offline `mutationFn`.

## Choosing Local Storage

| Need | Choose |
| --- | --- |
| Session-only UI state | `localOnlyCollectionOptions` |
| Small prefs via Web Storage | `localStorageCollectionOptions` |
| Local records with structured values, whole store fits memory | `indexedDBCollectionOptions` (on `main`; absent from `@tanstack/db@0.12.3`) |
| Cache around a server sync adapter, restart-fast first paint | SQLite persistence |
| Existing durable local DB with replication | RxDB or PowerSync adapter |

## SQLite Persistence

Pick the runtime package; each re-exports `persistedCollectionOptions` from `@tanstack/db-sqlite-persistence-core`:

| Runtime | Package | Factory |
| --- | --- | --- |
| Browser (OPFS) | `@tanstack/browser-db-sqlite-persistence` | `createBrowserWASQLitePersistence` |
| Node.js | `@tanstack/node-db-sqlite-persistence` | `createNodeSQLitePersistence` |
| React Native (OP-SQLite) | `@tanstack/react-native-db-sqlite-persistence` | `createReactNativeSQLitePersistence` |
| Expo | `@tanstack/expo-db-sqlite-persistence` | `createExpoSQLitePersistence` |
| Capacitor | `@tanstack/capacitor-db-sqlite-persistence` | `createCapacitorSQLitePersistence` |
| Tauri | `@tanstack/tauri-db-sqlite-persistence` | `createTauriSQLitePersistence` |
| Electron renderer | `@tanstack/electron-db-sqlite-persistence` | `createElectronSQLitePersistence` |
| Cloudflare Durable Objects | `@tanstack/cloudflare-durable-objects-db-sqlite-persistence` | `createCloudflareDOSQLitePersistence` |

Browser setup:

```sh
bun add @tanstack/db @tanstack/browser-db-sqlite-persistence @journeyapps/wa-sqlite
```

```ts
import {
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
  persistedCollectionOptions,
} from '@tanstack/browser-db-sqlite-persistence'

const database = await openBrowserWASQLiteOPFSDatabase({ databaseName: 'app.sqlite' })
const persistence = createBrowserWASQLitePersistence({ database })

const todos = createCollection(
  persistedCollectionOptions<Todo, string>({
    ...queryCollectionOptions<Todo, string>({ id: 'todos', queryClient, queryKey: ['todos'], queryFn, getKey: (t) => t.id }),
    persistence,
    schemaVersion: 1,
    initialRender: { strategy: 'network-first', networkTimeoutMs: 3_000 }, // optional
  }),
)
```

- Spread a sync adapter's options in to persist its applied data. With no `sync`, the collection is a local persisted store with a loopback sync.
- Keep the collection `id`, `getKey`, database name, and `schemaVersion` stable. Raise `schemaVersion` when the row format changes; a synced collection resets and refetches on mismatch, a no-`sync` collection errors (data cannot be restored). Control with `schemaMismatchPolicy`.
- `syncMode: 'on-demand'` loads only rows for active demand.
- `initialRender` (eager only) lets React/Solid Suspense render restored rows after `networkTimeoutMs` (default 3 s). Hooks expose `isPersistedReady`, `persistedStatus`, `persistedError`. Persisted readiness does not prove authorization; isolate data per user or tenant.
- Manual transactions on a no-`sync` persisted collection need `utils.acceptMutations(transaction)`.
- Multi-tab browsers: give persistence a `BrowserCollectionCoordinator`. Electron: `ElectronCollectionCoordinator`. Needs a secure context and OPFS. After bfcache restore, create fresh database and collection instances. Clean up collections before closing the database.
- Register Temporal constructors globally (for example `temporal-polyfill/global`) before storing `Temporal.Instant`/`PlainDate`.
- Errors: `PersistenceUnavailableError`, `PersistedCollectionDurabilityError` (collection enters error), `IndeterminateCommitError` (check durable state before retrying).
- Electric: `awaitTxId` can resolve before the local SQLite write completes; do not treat it as durability.

## Offline Transactions

```sh
bun add @tanstack/offline-transactions
```

```ts
import { NonRetriableError, startOfflineExecutor } from '@tanstack/offline-transactions'

const executor = startOfflineExecutor({
  collections: { todos },                       // stable registry keys + collection ids
  mutationFns: {
    saveTodo: async ({ transaction, idempotencyKey }) => {
      const todo = transaction.mutations[0]?.modified
      if (!todo) throw new NonRetriableError('Missing mutation')
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(todo),
      })
      if (res.status === 422) throw new NonRetriableError('Rejected')
      if (!res.ok) throw new Error('Retry later')
    },
  },
})
await executor.waitForInit()

const addTodo = executor.createOfflineAction<Todo>({
  mutationFnName: 'saveTodo',
  onMutate: (todo) => { todos.insert(todo) },   // synchronous
})
const tx = addTodo({ id: crypto.randomUUID(), title: 'Buy milk', completed: false })
void tx.when('settled').catch(console.error)
```

- The server must treat repeated `Idempotency-Key` values as one mutation; attempts can replay after a crash or leadership change.
- Plain `Error` means retry; `NonRetriableError` means permanent failure and rollback.
- `waitForInit()` waits for storage, leader election, and the initial outbox read, not for pending mutations or collection readiness. Call `todos.preload()` separately.
- Do not `await tx.when('settled')` to render offline UI; it can stay pending until connectivity returns.
- `createOfflineTransaction({ mutationFnName, autoCommit: false })` for multi-step workflows; `commit()` may stay pending offline.
- Web storage tries IndexedDB, then localStorage. One tab leads via Web Locks, then BroadcastChannel; followers use the normal online path without an outbox. Check `executor.mode`, `storageDiagnostic`, `isOfflineEnabled` after init; use `onStorageFailure`, `onLeadershipChange`.
- React Native/Expo: import from `@tanstack/offline-transactions/react-native`, pass an app-owned `StorageAdapter` (for example AsyncStorage, see the repo example), and install `@react-native-community/netinfo`.
- Inspect or manage: `peekOutbox()`, `getPendingCount()`, `getRunningCount()`, `removeFromOutbox(id)`, `clearOutbox()`, `dispose()`. Keep `mutationFnName` values stable across releases; `onUnknownMutationFn` reports orphaned entries.
- Combine with SQLite persistence: persisted Query Collection for rows, outbox for pending writes, and `await todos.utils.refetch()` at the end of the `mutationFn` to read back.
- On React Native add a UUID polyfill (`react-native-random-uuid`) because DB uses `crypto.randomUUID()`.
