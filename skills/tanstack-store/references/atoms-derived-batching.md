# Atoms, Derived Values, And Equality

## Table Of Contents

- Atoms
- Atom Options And Compare
- Async Atoms
- Derived Stores And Atoms
- Previous Values
- Equality Strategy
- Batching Behavior

## Atoms

Create a writable atom with an initial value:

```ts
import { createAtom } from '@tanstack/store'

const countAtom = createAtom(0)

countAtom.set((count) => count + 1)
countAtom.set(0)
console.log(countAtom.get())
```

Create a readonly atom with a getter function:

```ts
const doubleAtom = createAtom(() => countAtom.get() * 2)
```

Writable atoms expose:

- `get()`
- `set(valueOrUpdater)`
- `subscribe(observerOrListener)`

Readonly atoms expose:

- `get()`
- `subscribe(observerOrListener)`

## Atom Options And Compare

Atoms accept a `compare(prev, next)` option:

```ts
const userAtom = createAtom(
  { id: '1', name: 'Ada' },
  {
    compare: (prev, next) => prev.id === next.id && prev.name === next.name,
  },
)
```

The source uses `Object.is` by default for atom updates. Use custom comparison sparingly and test it carefully; an overly broad compare can suppress real updates.

## Async Atoms

Use `createAsyncAtom` for Promise-backed readonly state:

```ts
import { createAsyncAtom } from '@tanstack/store'

const profileAtom = createAsyncAtom(async () => {
  return fetchProfile()
})
```

The current source state shape is:

```ts
type AsyncAtomState<TData, TError = unknown> =
  | { status: 'pending' }
  | { status: 'done'; data: TData }
  | { status: 'error'; error: TError }
```

React usage:

```tsx
const profile = useSelector(profileAtom)

if (profile.status === 'pending') return <Spinner />
if (profile.status === 'error') return <ErrorView error={profile.error} />

return <ProfileView profile={profile.data} />
```

Prefer TanStack Query or route data for server cache/state concerns. Use async atoms for local reactive async values when their lifetime and refresh behavior are simple.

## Derived Stores And Atoms

Derived stores and atoms are created by passing a getter function:

```ts
const count = createStore(0)
const double = createStore(() => count.state * 2)

const countAtom = createAtom(0)
const doubleAtom = createAtom(() => countAtom.get() * 2)
```

Dependencies are tracked through reads during the getter. Keep getter functions pure:

- Read other stores or atoms.
- Return a computed value.
- Do not write to stores or atoms.
- Do not perform I/O.

Computed stores return `ReadonlyStore`; computed atoms return `ReadonlyAtom`.

## Previous Values

Getter functions receive the previous computed value:

```ts
const count = createStore(1)

const rollingSum = createStore<number>((previous) => {
  return count.state + (previous ?? 0)
})
```

Use this for rolling calculations, not as a substitute for explicit event history when auditability matters.

## Equality Strategy

Equality appears in two layers:

- Atom update comparison: `options.compare`, default `Object.is`.
- React selector comparison: `useSelector(..., { compare })`, default strict equality.

Use `shallow` for selected object/array results when shallow structural equality is enough:

```ts
import { shallow } from '@tanstack/store'

const selected = useSelector(store, selectSummary, { compare: shallow })
```

Prefer selectors that return primitives or stable references when possible.

## Batching Behavior

`batch` defers notifications until the batch finishes:

```ts
batch(() => {
  countAtom.set((count) => count + 1)
  countAtom.set((count) => count + 1)
})
```

Subscribers should observe the final value once instead of intermediate values. This is useful when a logical action updates multiple stores or atoms.

`flush` processes queued effects and returns early while a batch is active. Most application code does not need to call it directly.
