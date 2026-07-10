# Persistence And Remote Sync

## Table Of Contents

- Sync Engine Model
- Lazy And Eager Setup
- Sync Status
- Persistence Plugins
- Remote Sync And CRUD
- Retry, Offline, And Auth Gates
- Transforms And Migrations
- Plugin Selection
- Reliability And Security Checklist

## Sync Engine Model

The v3 sync engine unifies local persistence and remote sync. On a local change it can:

1. Record pending changes locally.
2. Save the changed value to local persistence.
3. Send the change remotely.
4. Apply server-returned fields such as timestamps or identifiers back to the observable and persistence.
5. Clear acknowledged pending metadata.

This supports optimistic local-first UI and retry after restart, but only when persistence, retry, identifiers, auth, and server conflict behavior are configured coherently.

## Lazy And Eager Setup

Use `synced` inside `observable` for lazy activation:

```ts
import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'

const profile$ = observable(
  synced({
    initial: { name: '' },
    get: () => fetch('/api/profile').then((r) => r.json()),
    set: ({ value }) =>
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(value),
      }),
    persist: { name: 'profile' },
  }),
)
```

The synced getter activates on the first observed `get()` or equivalent React read.

Use `syncObservable` for an existing observable and immediate setup:

```ts
import { observable } from '@legendapp/state'
import { syncObservable } from '@legendapp/state/sync'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'

const settings$ = observable({ theme: 'system' as const })

syncObservable(settings$, {
  persist: {
    name: 'settings',
    plugin: ObservablePersistLocalStorage,
  },
})
```

Use `configureSynced(basePlugin?, defaults)` to build a project-standard plugin with shared retry, persistence, and error behavior. Keep environment-specific clients and credentials outside shared state modules.

## Sync Status

Use `syncState(observable$)` rather than inferring state from the data:

```ts
import { syncState, when } from '@legendapp/state'

const status$ = syncState(profile$)

await when(status$.isPersistLoaded)
if (status$.error.get()) report(status$.error.get())
```

Important state and actions include:

- `isPersistLoaded`: local hydration completed.
- `isPersistEnabled`: local persistence is enabled.
- `isLoaded`: remote or async getter completed.
- `isSyncEnabled`: remote sync is enabled.
- `isGetting` / `isSetting`: active operations in current source.
- `lastSync`: latest sync timestamp.
- `syncCount`: completed sync count.
- `error`: latest error.
- `getPendingChanges()`: unsaved local changes.
- `sync()`: manually run the getter.
- `resetPersistence()`: clear persisted data in the current beta source.
- `clearPersist()`: compatibility alias marked for removal in the current v3 source; do not introduce it in new code.
- `reset()`: reset in-memory and sync state in current beta source.

The beta API has evolved. Verify action names in the installed declarations before writing account-reset or recovery code.

## Persistence Plugins

Published v3 beta subpaths include:

- Web: `@legendapp/state/persist-plugins/local-storage`
- Web: `@legendapp/state/persist-plugins/indexeddb`
- React Native: `@legendapp/state/persist-plugins/mmkv`
- React Native: `@legendapp/state/persist-plugins/async-storage`
- Expo: `@legendapp/state/persist-plugins/expo-sqlite`

Selection guidance:

- LocalStorage is synchronous and simple, but has small quotas and blocks the main thread. Do not store secrets.
- IndexedDB is asynchronous and better for larger structured web data. Manage database versions and table changes explicitly.
- MMKV is fast for React Native but needs the matching native dependency and runtime setup.
- AsyncStorage is asynchronous and must receive or resolve the implementation expected by the current plugin version.
- Expo SQLite suits larger structured local-first data but requires explicit schema and upgrade care.

For asynchronous plugins, do not render or act on persistence-dependent state until `isPersistLoaded` is true.

Persist names form a storage schema. Namespace them by app, user, tenant, environment, and version when collisions or cross-account leakage are possible.

## Remote Sync And CRUD

Use the lowest-level plugin that matches the backend:

- `synced`: arbitrary get/set/subscribe behavior.
- `syncedFetch`: simple fetch-backed get/set.
- `syncedCrud`: structured get/list/create/update/delete.
- Backend plugins: Supabase, Firebase, or Keel.
- `syncedQuery`: integrate an existing TanStack Query client or infrastructure.

`syncedCrud` can represent a single value or collections as object, Map, or array. Its current options include identifier and timestamp fields, partial updates, soft-delete fields, ID generation, `changesSince`, paging modes, realtime subscribe, and auth/write gates.

```ts
import { observable } from '@legendapp/state'
import { syncedCrud } from '@legendapp/state/sync-plugins/crud'

const todos$ = observable(
  syncedCrud<Todo>({
    list: ({ lastSync }) => api.listTodos({ since: lastSync }),
    create: (todo) => api.createTodo(todo),
    update: (patch) => api.updateTodo(patch.id, patch),
    delete: (todo) => api.deleteTodo(todo.id),
    fieldId: 'id',
    fieldUpdatedAt: 'updatedAt',
    changesSince: 'last-sync',
    generateId: () => crypto.randomUUID(),
    persist: {
      name: 'todos',
      retrySync: true,
    },
    retry: { infinite: true },
  }),
)
```

For differential sync, the backend must implement the same timestamp and deletion semantics as the client. A client option alone does not create a correct conflict protocol.

## Retry, Offline, And Auth Gates

Important controls include:

- `retry`: retry policy for reads and writes.
- `persist.retrySync`: persist pending writes across restart.
- `debounceSet`: reduce write volume for typing or bursts.
- `waitFor`: delay reads until auth, connectivity, or another condition is ready.
- `waitForSet`: delay writes until prerequisites are ready.
- `syncMode: 'manual'`: require explicit sync in the current source.
- `subscribe`: realtime updates through `update` or `refresh` and a cleanup function.

Do not set infinite retry without observability and cancellation policy. Permanent authorization, validation, or schema errors must not become silent endless loops.

Auth and tenant changes need an explicit sequence:

1. Stop or gate new remote reads and writes.
2. Let the product decide whether to flush, retain, quarantine, or discard pending writes.
3. Unsubscribe realtime listeners.
4. Reset in-memory and persisted state for the old identity.
5. Switch credentials and storage namespace.
6. Reactivate and hydrate the new identity.

A component still calling `useValue(synced$)` can reactivate a lazy resource after reset. Gate the selector on auth state or unmount the consumer during logout.

## Transforms And Migrations

Use sync transforms to map between local and remote shapes. Use persistence transforms for local storage migration and serialization.

```ts
const account$ = observable(
  synced({
    get: api.getAccount,
    transform: {
      load: (remote) => ({ ...remote, createdAt: new Date(remote.createdAt) }),
      save: (local) => ({ ...local, createdAt: local.createdAt.toISOString() }),
    },
    persist: {
      name: 'account-v3',
      transform: {
        load: (stored) => migrateStoredAccount(stored),
        save: (value) => ({ ...value, schemaVersion: 3 }),
      },
    },
  }),
)
```

Available helpers include date and JSON-field transforms plus `combineTransforms`. Verify their exact signatures against the installed beta.

Migration rules:

- Store an explicit schema version for durable data.
- Make migrations idempotent.
- Preserve or deliberately discard pending mutation metadata.
- Test upgrade from every supported prior version.
- Back up or stage destructive IndexedDB/SQLite schema changes.
- Do not confuse encryption transforms with key management; local plaintext may still exist in memory.

## Plugin Selection

### TanStack Query

Use `syncedQuery` when integrating into an existing Query architecture. Outside React, pass a `QueryClient`; inside React, the `useObservableSyncedQuery` helper can obtain it from Context. Query keys may depend on observables and rerun reactively.

Prefer native `synced` or CRUD plugins for new Legend-State-first architecture unless Query-specific caching, invalidation, or migration constraints justify the extra layer.

### Supabase, Firebase, And Keel

Verify current plugin docs and source before implementation. The v3 site explicitly marks Firebase RTDB documentation as under construction. For database plugins:

- Enforce authorization and row-level security on the server.
- Confirm primary keys, created/updated/deleted fields, and realtime payload shapes.
- Test disconnect, duplicate delivery, out-of-order events, and subscription cleanup.
- Never place privileged service credentials in client state.

## Reliability And Security Checklist

- Persistence and sync activation semantics are intentional.
- Async hydration is gated on `isPersistLoaded`.
- Remote readiness and errors use `syncState`.
- Storage keys isolate users, tenants, environments, and schema versions.
- Pending writes survive restart only when the product wants them to.
- Infinite retry cannot hide permanent errors.
- Server responses are validated before merging into trusted state.
- Backend authorization and conflict policy are explicit.
- Realtime subscriptions return cleanup and handle duplicate or stale events.
- Transforms are versioned and tested in both directions.
- Logout and tenant switching cannot reactivate or leak prior identity data.
- Local storage contains no secrets that require a secure credential store.
