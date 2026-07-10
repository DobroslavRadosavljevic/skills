# Production, Migration, And Testing

## Table Of Contents

- Beta Policy
- V2 To V3 Migration
- React Beta Migration
- Architecture And Ownership
- Performance
- Debugging
- Testing Strategy
- Production Checklist

## Beta Policy

Legend-State v3 remains a beta release in the current snapshot. Before implementation:

1. Read the installed version from the lockfile and package manager.
2. Compare it with npm dist-tags.
3. Read migration notes between the installed beta and the target beta.
4. Inspect installed `.d.ts` exports for any API used in production-sensitive code.
5. Pin the exact beta version unless the project intentionally accepts prerelease drift.

Do not upgrade v2 to v3 as an incidental refactor. Treat it as a state, persistence, and runtime migration with rollback planning.

## V2 To V3 Migration

Important v3 changes include:

- Types were rewritten; imported type names and promise/nullability behavior may change.
- `computed(...)` becomes `observable(() => ...)` or a function child in an observable.
- `proxy(...)` lookup behavior becomes a keyed function child.
- `useComputed(...)` becomes `useObservable(() => ...)` for local computed state.
- `persistObservable` becomes `syncObservable`.
- Persistence configuration moves under `persist`.
- `configureObservablePersistence` gives way to project-specific functions created with `configureSynced`.
- Sync status moves out of a reserved `.state` child into `syncState(observable$)`.
- Old fetch and Query sync paths become `syncedFetch` and `syncedQuery`.
- `useObservable(function)` is reactive; use `peek()` for initialization-only reads.
- Computeds only recompute while observed; side-effectful computed functions are invalid.
- `set` and `toggle` return `void`.
- `onSet` becomes `onAfterSet`.
- Old after-batch behavior is removed or folded into current batch APIs.
- `lockObservable` is removed.
- Direct-access configuration names changed to `enable$GetSet` and `enable_PeekAssign`.
- `trackHistory` moved to its helper subpath.

Migration sequence:

1. Add behavior tests around current v2 state, persistence, and sync.
2. Inventory deprecated imports and implicit behavior.
3. Decide storage compatibility and migration strategy before changing code.
4. Upgrade and fix type-level API changes.
5. Migrate core observables and computed values.
6. Migrate React reads and reactive components.
7. Migrate persistence and remote sync.
8. Run upgrade fixtures using real prior persisted payloads.
9. Exercise offline, restart, reconnect, logout, and rollback paths.

## React Beta Migration

The beta.20 guidance changed the primary React pattern:

```tsx
// Migration aliases; avoid in new work.
const value = useSelector(state$.value)
const other = use$(state$.other)

// Preferred.
const value = useValue(state$.value)
const computed = useValue(() => state$.a.get() + state$.b.get())
```

Migrate direct `.get()` inside `observer` to `useValue`. Keep `observer` only when useful as a hook-count optimization.

Reactive components changed too:

- Web DOM components use `$React` from `@legendapp/state/react-web`.
- React Native built-ins use named `$` exports from `@legendapp/state/react-native`.
- Older `Reactive` configuration and namespace patterns are migration-only.
- Reactive props start with `$`, such as `$value` and `$className`.

Enable missing-use warnings during migration, then scan render paths and verify with React tests.

## Architecture And Ownership

Legend-State supports both atom-style and large-store organization. Choose based on domain ownership, not ideology.

Good boundaries:

- One observable module per domain or remote resource.
- Explicit action functions for repeated business transitions.
- Provider factories for user, tenant, request, or test scopes.
- Sync configuration separated from UI components.
- Storage schema and migration code owned with the persisted domain.
- Derived values close to their source state, but free of side effects.

Avoid:

- One process-wide singleton containing private SSR request data.
- UI components that construct backend clients or persistence plugins repeatedly.
- Hidden observers with no disposal owner.
- Computed values that perform writes, telemetry, or I/O.
- Multiple unsynchronized caches for the same remote resource without a clear source of truth.

## Performance

Optimize from render and write evidence:

- Subscribe to leaf nodes or selector results rather than whole stores.
- Batch loops and related writes.
- For large untracked computation, call `get()` once and operate on raw data without mutating it.
- Use `ObservableHint.opaque` or `.plain` for foreign or large values that do not need deep observation.
- Give array objects stable identifiers.
- Let list rows subscribe to their own item fields.
- Use `For optimized` only after verifying node reuse behavior.
- Debounce sync writes for high-frequency inputs.
- Avoid excessive reactive wrapper components when normal React rendering is cheaper and clearer.

Performance claims in marketing benchmarks do not replace profiling the actual component tree, data size, persistence plugin, and device.

## Debugging

Start with the boundary that failed:

- Missing React update: verify `useValue` or another tracking boundary, then check `peek` and raw mutation.
- Excess React renders: use trace hooks, inspect selector breadth, and check parent list tracking.
- Computed not running: confirm it is observed and its dependencies use `get()`.
- Persistence not loaded: inspect `isPersistLoaded`, plugin initialization, storage name, and storage errors.
- Sync not running: check lazy activation, `isSyncEnabled`, `waitFor`, auth state, and `syncMode`.
- Writes stuck: inspect pending changes, retry policy, permanent server errors, and `waitForSet`.
- Data returns after logout: find active observers that reactivate the synced resource and verify reset order and identity gating.
- Stale list items after reorder: check stable identifiers and key extraction.
- Beta-only type errors: compare package version, docs version, subpath exports, and installed declarations.

Capture observable status and transition logs at action or sync boundaries. Avoid logging entire sensitive state trees.

## Testing Strategy

### Core Unit Tests

- `get`, `peek`, shallow tracking, `set`, `assign`, `delete`, and toggle behavior.
- No notification for equal values.
- Notification for focused child changes.
- Computed dependency changes and laziness.
- Linked two-way setters and lookup tables.
- `observe` cleanup and disposal.
- `when` versus `whenReady` empty-value behavior.
- One notification after `batch`.
- Array reorder, Map/Set changes, and stable observable references.

### React Tests

- Create observable instances per test unless singleton behavior is under test.
- Assert rendered output and render counts for narrow `useValue` reads.
- Cover conditional reads inside `observer`.
- Test `Memo`, `Show`, `Switch`, and `For` without parent render leakage.
- Run Strict Mode cleanup tests for observers and synced local state.
- Test promise observables with Suspense success and error paths.
- Test reactive web or native inputs for two-way binding and accessibility.
- Use tracing verification helpers in targeted development tests.

### Persistence Tests

- Use isolated storage names and reset storage between tests.
- Hydrate from real fixtures from every supported schema version.
- Assert async hydration gates.
- Test load and save transforms separately and round-trip them.
- Simulate quota, parse, initialization, and write errors.
- Simulate reload with pending writes.
- Resolve overlapping saves out of order and verify the newest local value wins according to policy.
- Test reset, clear, disable, and re-enable behavior.

### Remote Sync Tests

- Mock or fake the backend at the plugin boundary, then add integration tests against a real test backend.
- Cover create, update, partial update, delete, soft delete, paging, last-sync filtering, and server-returned fields.
- Test retryable versus permanent failures.
- Test duplicate and out-of-order realtime events.
- Test offline edits, process restart, reconnect, and acknowledgement cleanup.
- Test auth expiry, logout, user switching, and tenant switching with pending changes.
- Assert server authorization independently from client behavior.

### SSR And Production Smoke

- Render concurrent users and prove state isolation.
- Verify server and client initial snapshots match.
- Ensure browser persistence code is not evaluated on the server.
- Exercise a full offline/reload/reconnect flow on target browsers or devices.
- Inspect storage upgrades and recovery on a copy of production-shaped data.

## Production Checklist

- Exact v3 beta is pinned and documented.
- Current v3 docs, matching tag source, and installed types agree.
- React reads follow `useValue` and React Compiler-safe guidance.
- Raw observable data is never mutated.
- Computed and linked values are pure and observed intentionally.
- Observers and subscriptions have clear disposal owners.
- Batches and write debouncing prevent render or persistence amplification.
- SSR and provider lifetimes prevent cross-user leakage.
- Persistence has versioning, namespace isolation, error handling, and upgrade tests.
- Sync has validation, authorization, retry limits or visibility, conflict semantics, and pending-write recovery.
- Logout and tenant changes safely handle active observers and pending writes.
- Browser/device smoke tests cover offline, restart, reconnect, and failure states.
