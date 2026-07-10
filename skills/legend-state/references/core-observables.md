# Core Observables And Reactivity

## Table Of Contents

- Observable Model
- Reads And Tracking
- Writes And Mutability
- Computed And Linked Values
- Async Observables
- Collections
- Reactions And Events
- Batching
- Helpers And Configuration
- Core Review Checklist

## Observable Model

`observable` wraps primitives, objects, arrays, Maps, Sets, functions, and promises in stable proxy nodes. The `$` suffix is a convention, not syntax.

```ts
import { observable } from '@legendapp/state'

const store$ = observable({
  profile: { first: 'Ada', last: 'Lovelace' },
  todos: [] as Array<{ id: string; title: string; done: boolean }>,
  fullName: () =>
    `${store$.profile.first.get()} ${store$.profile.last.get()}`,
  rename: (first: string, last: string) => {
    store$.profile.assign({ first, last })
  },
})
```

Observable nodes are path based. A child proxy can exist even while its raw value is `undefined`, and setting a deeper child creates the missing object path.

## Reads And Tracking

Use the read that matches intent:

- `get()`: return raw data and track the node in an observing context.
- `get(true)`: shallow tracking for collection keys, additions, removals, or length-level changes.
- `peek()`: return raw data without tracking.
- Property access alone, such as `store$.profile`, does not subscribe.

Tracking also happens through observable array iteration, `.length`, `Object.keys`, and `Object.values`. Avoid accidental broad dependencies.

```ts
const currentTheme = settings$.theme.get()
const snapshot = settings$.peek()
const ids = Object.keys(records$.get(true))
```

Use raw data for expensive, intentionally untracked computation:

```ts
const rows = hugeTable$.get()
const report = computeReport(rows)
```

Do not retain raw references and mutate them later.

## Writes And Mutability

Legend-State is mutable through observable APIs. It does not require immutable cloning.

```ts
store$.profile.first.set('Grace')
store$.profile.assign({ first: 'Grace', last: 'Hopper' })
store$.todos.push({ id: '1', title: 'Ship', done: false })
store$.todos[0].done.toggle()
store$.todos[0].delete()
```

Rules:

- `set(value)` replaces the node value.
- `set(previous => next)` updates from the prior value.
- `assign(partial)` is a shallow, batched `Object.assign` operation.
- `delete()` removes an object key or array item; at the root it sets `undefined`.
- Setting structurally equal data does not notify unchanged properties.
- `set` and `toggle` return `void` in v3; do not chain them.

Never mutate the result of `get()` or `peek()`:

```ts
// Wrong: changes raw data without notification.
const profile = store$.profile.get()
profile.first = 'Grace'
store$.profile.set(profile)

// Correct.
store$.profile.first.set('Grace')
```

Do not clone by reflex. Direct observable operations are clearer and avoid allocation:

```ts
// Avoid when a focused write is enough.
store$.todos.set([...store$.todos.get(), todo])

// Prefer.
store$.todos.push(todo)
```

## Computed And Linked Values

Functions inside observables can be actions or computed values. A function becomes a cached computed observable when read through `.get()` or `.peek()`; calling it as a normal function recomputes directly.

```ts
const totals$ = observable(() =>
  cart$.items.reduce((sum, item$) => sum + item$.price.get(), 0),
)

totals$.get()
```

Computed values are lazy and only recompute while observed. They must not be used as an implicit side-effect mechanism.

Returning another observable from a computed creates a two-way link:

```ts
const selection$ = observable({
  activeId: 'a',
  items: {
    a: { title: 'A' },
    b: { title: 'B' },
  },
  active: () => selection$.items[selection$.activeId.get()],
})

selection$.active.title.set('Selected title')
```

Use `linked` for explicit get/set transformation:

```ts
import { linked, observable } from '@legendapp/state'

const cents$ = observable(1250)
const dollars$ = observable(
  linked({
    get: () => cents$.get() / 100,
    set: (value) => cents$.set(Math.round(value * 100)),
  }),
)
```

Keep links deterministic, reversible when two-way, and free of unrelated writes.

## Async Observables

An observable created from a promise or async function begins as `undefined`, activates on observation, and takes the resolved value.

```ts
import { observable, syncState, when } from '@legendapp/state'

const profile$ = observable(() => fetch('/api/profile').then((r) => r.json()))
const status$ = syncState(profile$)

const profile = await when(profile$)
if (status$.error.get()) handleError(status$.error.get())
```

Do not use data truthiness as the only load indicator when `undefined`, `null`, empty collections, or falsy values are valid results. Use `syncState`.

## Collections

Observable arrays expose normal array methods with observable-aware behavior. Iterators such as `map`, `filter`, `find`, `some`, and `forEach` shallow-track the collection and receive observable elements.

- `filter` returns observable elements.
- `find` returns an observable element or `undefined`.
- Use `.get()` or `.peek()` first when normal raw-array behavior is desired.
- Arrays of objects should have stable unique `id` or `key` fields. For a custom identifier, define the documented sibling key extractor.

Map and Set values are observable and support their native methods through the proxy. Test key identity, deletion, and serialization when persisting them because storage plugins may transform collection types.

## Reactions And Events

Use `observe` for repeating reactive side effects:

```ts
import { observe } from '@legendapp/state'

const dispose = observe((event) => {
  const userId = session$.userId.get()
  startUserWork(userId)
  event.onCleanup = stopUserWork
})

dispose()
```

Use `when` for a one-time truthy condition and `whenReady` when empty arrays or objects should not count as ready:

```ts
await when(session$.isAuthenticated)
await whenReady(results$)
```

Use `onChange` on the narrowest node possible. Parent listeners receive recursive child changes and can become noisy.

Use `event()` for a value-less signal:

```ts
import { event } from '@legendapp/state'

const saved$ = event()
const dispose = saved$.on(() => showToast())
saved$.fire()
dispose()
```

Always retain and call disposers for temporary observers and listeners.

## Batching

Batch related writes so observers and React subscribers see the completed state once:

```ts
import { batch } from '@legendapp/state'

batch(() => {
  form$.status.set('saved')
  form$.dirty.set(false)
  form$.lastSavedAt.set(Date.now())
})
```

Prefer `batch(callback)` over manual `beginBatch`/`endBatch`; callback structure guarantees pairing. Batching is especially important for loops and persisted state.

## Helpers And Configuration

- `ObservableHint.opaque(value)`: treat a large or foreign object as a primitive.
- `ObservableHint.plain(value)`: declare that a subtree has no functions or embedded observables, reducing setup work.
- `mergeIntoObservable(target$, value)`: deep merge while retaining observable nodes and listeners.
- `trackHistory`: record previous values by time.
- `undoRedo`: add bounded undo and redo behavior.
- `enable$GetSet`: opt into `$` shorthand for tracked get/set.
- `enable_PeekAssign`: opt into `_` untracked get and silent assignment. Use sparingly because silent writes bypass notifications.
- `enableReactTracking({ warnMissingUse: true })`: warn about render-time `.get()` calls not wrapped in `useValue`.

Enable configuration once in a predictable entry module before using its augmented types.

## Core Review Checklist

- Reads use `get`, `get(true)`, or `peek` intentionally.
- No raw value returned from an observable is mutated.
- Computed and linked getters are deterministic and side-effect free.
- Temporary `observe`, `onChange`, and event subscriptions are disposed.
- Multi-write operations are batched.
- Collection items have stable identifiers where rendering or reordering matters.
- Async readiness uses `syncState`, `when`, or `whenReady` with correct empty-value semantics.
- Optional syntax configuration is initialized once and not hidden in a leaf module.
