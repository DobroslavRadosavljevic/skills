# Optimistic Mutations

## Lifecycle

1. The write (`insert`/`update`/`delete`) applies optimistic state at once. Live queries see synced data plus the optimistic overlay.
2. The handler (`onInsert`/`onUpdate`/`onDelete`, or a transaction's `mutationFn`) persists the change.
3. If the handler returns while the transaction is `persisting`, it becomes `completed` and the visible state is recomputed from synced data. If the handler throws, the transaction is `failed` and the optimistic state rolls back.
4. The outer loop (server confirms, sync brings the row back) is the handler's job. The handler must not resolve before the confirmed row is visible, or the optimistic row disappears and reappears.

States: `pending` -> `persisting` -> `completed` | `failed`. Each write returns a `Transaction`.

```ts
const tx = todos.update(todo.id, (draft) => { draft.completed = true })
try {
  await tx.when('settled') // resolves with the tx, rejects with the handler error
} catch (err) {
  toast.error('Could not save')   // optimistic state is already rolled back
}
```

`tx.when('settled')` marks handler settlement, not server proof. It proves confirmation only when the handler awaited the backend (read-back, `refetch()`, `awaitTxId`). `tx.isPersisted.promise` is deprecated and slated for removal in the 1.0 RC; replace it with `tx.when('settled')`. DB never retries failed mutations; wrap calls in your own retry (for example `p-retry`) or use offline transactions.

## Collection Writes

```ts
todos.insert({ id: safeRandomUUID(), text: 'Buy milk', completed: false })
todos.insert([a, b], { metadata: { source: 'import' } })
todos.insert(row, { optimistic: false })          // wait for synced data before showing
todos.update(id, (draft) => { draft.completed = true })
todos.update([id1, id2], (drafts) => drafts.forEach((d) => { d.done = true }))
todos.update(id, { metadata: { intent: 'complete' } }, (draft) => { draft.completed = true })
todos.delete(id)
todos.delete([id1, id2], { optimistic: false })
```

- `update` takes a draft callback, never a replacement object. Mutate draft properties; do not reassign `draft`. Changing the key throws `KeyUpdateNotAllowedError`; delete and re-insert instead.
- Inserting an existing key throws `DuplicateKeyError`. `insert` without a handler or ambient transaction throws `MissingInsertHandlerError` (and update/delete variants). Local-only collections are exempt.
- Draft edits are isolated from stored rows. Assigned plain objects, `Map`/`Set` members, and supported natives (`Date`, `URL`, typed arrays) are copied when the callback returns. Class instances are kept by reference; treat them as immutable.
- Concurrent transactions on one row layer as whole-row snapshots; the latest contributing snapshot is visible. Do not infer server order from layering.
- `optimistic: false` keeps the pending write out of the view. Use it for server-generated fields, validation-heavy writes, and destructive deletes. The view changes only when synced data arrives.

## Handlers

```ts
onUpdate: async ({ transaction, collection }) => {
  await Promise.all(transaction.mutations.map((m) => api.todos.update(m.original.id, m.changes)))
  await collection.utils.refetch() // Query Collection; Electric: awaitTxId
}
```

A mutation has `type` (`insert`/`update`/`delete`), `original`, `modified`, `changes`, `key`, `collection`, `metadata`. Handlers receive `TOutput` (post-schema) data. One handler can serve all operations (`MutationFn`). Handle every mutation in `transaction.mutations`, not just `[0]`, when callers batch.

Do not `await collection.preload()`, a live query `preload()`, or `loadSubset()` inside a handler; the sync commit queues behind the handler and deadlocks. Use the adapter's acknowledgement pattern. Per adapter: Query -> `await collection.utils.refetch()` (+ `return { refetch: false }` pre-1.0); Electric -> `awaitTxId`/`awaitMatch`; PowerSync/RxDB/TrailBase -> their local write path handles it. Details in [adapters.md](adapters.md).

Bypass option: call your existing API, then wait for sync (`await collection.utils.refetch()` or `awaitTxId(txid)`) and use DB only for reads and state.

## createOptimisticAction (Intent Mutations)

```ts
import { createOptimisticAction } from '@tanstack/react-db'

const likePost = createOptimisticAction<string>({
  onMutate: (postId) => {                  // must be synchronous
    postCollection.update(postId, (d) => { d.likeCount += 1; d.likedByMe = true })
  },
  mutationFn: async (postId, { transaction, signal }) => {
    await api.posts.like(postId, { signal })
    await postCollection.utils.refetch()   // wait for server truth
  },
})
likePost(postId)
```

- Use for multi-collection changes, optimistic guesses at server logic, or sending intent instead of row diffs.
- `onMutate` returning a Promise throws `OnMutateMustBeSynchronousError`. Generate ids synchronously.
- Validate params with a schema inside `onMutate`/`mutationFn` if they come from users.
- Teams that want writes only through actions can enforce it with the lint example in `examples/react/action-enforcement`.

## Manual Transactions

```ts
import { createTransaction } from '@tanstack/react-db'

const tx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => { await api.batchSave(transaction.mutations) },
})
tx.mutate(() => { todos.insert(a); todos.update(b.id, (d) => { d.done = true }) })
// later
await tx.commit()      // or tx.rollback()
```

- Collection handlers do not run for mutations captured in a manual transaction; `mutationFn` persists them.
- `autoCommit` defaults to `true` (commit after each `mutate`). Use `false` for drafts: `mutate` per keystroke, `commit` on Save, `rollback` on Cancel.
- `mutate` after commit/rollback throws `TransactionNotPendingMutateError`. If the callback throws, that call's optimistic changes are removed.
- Merge rules inside one transaction: insert+update -> insert; insert+delete -> removed; update+delete -> delete; update+update -> one update. Inserting or deleting the same key twice throws.
- Failed transactions roll back; conflicting transactions on the same item roll back with them.
- Mix local collections in by calling `await localCollection.utils.acceptMutations(transaction)` inside `mutationFn`, after the API succeeds for all-or-nothing behavior.
- `dbClient.createTransaction(config)` ties ambient transaction scope to a client.

## Paced Mutations

Powered by TanStack Pacer. Use for auto-save, sliders, and sequential queues.

```tsx
import { usePacedMutations, debounceStrategy } from '@tanstack/react-db'

const mutate = usePacedMutations<{ field: string; value: string }>({
  onMutate: ({ field, value }) => { draftCollection.update(id, (d) => { d[field] = value }) },
  mutationFn: async ({ transaction }) => { await api.saveDraft(transaction.mutations) },
  strategy: debounceStrategy({ wait: 500 }),
})
const tx = mutate({ field: 'title', value }) // returns a receipt transaction
```

| Strategy | Behavior |
| --- | --- |
| `debounceStrategy({ wait, leading?, trailing? })` | Merge rapid calls; persist after quiet. Skipped calls reject with `DebounceCallDroppedError` when `trailing: false`. |
| `throttleStrategy({ wait, leading?, trailing? })` | Minimum spacing; calls in between merge. `ThrottleCallDroppedError` when edges are disabled. |
| `queueStrategy({ wait?, maxSize?, addItemsTo?, getItemsFrom? })` | One transaction per call, processed in order (FIFO default). Overflow rejects with `QueueCapacityExceededError`; after cleanup `QueueDisposedError`. A failure does not block later items. |

- Outside React: `createPacedMutations(config)` from `@tanstack/db`. Share one instance across components to merge into one pending transaction; each `usePacedMutations` call has its own timer or queue.
- Paced transactions are receipts: await `tx.when('settled')` or `tx.rollback()`; `tx.commit()` throws.
- Debounce/throttle keep one pending and one persisting transaction at a time. Call `strategy.cleanup()` on teardown; pending writes still drain.

## Temporary IDs

Prefer client UUIDs (`safeRandomUUID()` from `@tanstack/db`; works where `crypto.randomUUID` is missing). If the server assigns ids: a stable view key map for React keys, disable follow-up actions on temp rows until settled, or insert with `optimistic: false`. `when('settled')` does not report the real id; read it from the synced row or your own mapping.

## Errors To Recognize

`SchemaValidationError` (`type`, `issues`), `DuplicateKeyError`, `UpdateKeyNotFoundError`, `DeleteKeyNotFoundError`, `KeyUpdateNotAllowedError`, `UndefinedKeyError`, `MissingInsertHandlerError`, `CollectionInErrorStateError`, `MissingMutationFunctionError`, `TransactionNotPendingMutateError`, `TransactionNotPendingCommitError`. Use `instanceof`, not message matching. Production builds shorten messages to a code with a link to the docs `errors` page, except `SchemaValidationError`. Inspect `tx.state` and `tx.error` after failure. `commit()` rejects when `mutationFn` throws; `rollback()` while pending rejects `when('settled')` and ignores a later handler result.

Restart a collection in `error` with `await collection.cleanup(); await collection.preload()`. For Query Collections, `utils.isError`, `utils.errorCount`, `utils.lastError`, and `utils.clearError()` expose sync failures; the last ready data stays usable.
