# React Patterns

## Table Of Contents

- Primary Read Hook
- Selector Compare
- Deprecated And Transitional Hooks
- Writable Atoms In React
- Component-Lifetime Stores
- Context Bundles
- SSR Notes

## Primary Read Hook

Use `useSelector` for React reads:

```tsx
import { createStore, useSelector } from '@tanstack/react-store'

export const petsStore = createStore({
  dogs: 0,
  cats: 0,
})

function AnimalCount({ animal }: { animal: 'dogs' | 'cats' }) {
  const count = useSelector(petsStore, (state) => state[animal])

  return <div>{count}</div>
}
```

`useSelector` works with any source exposing:

- `get(): T`
- `subscribe(listener): { unsubscribe(): void }`

That includes stores, readonly stores, atoms, and readonly atoms.

Omitting the selector subscribes to the whole value:

```tsx
const pets = useSelector(petsStore)
```

Prefer narrow selectors for render performance.

## Selector Compare

`useSelector` accepts `{ compare }`. The default compare is strict equality in the current React source.

Use `shallow` for composite selections:

```tsx
import { shallow, useSelector } from '@tanstack/react-store'

const summary = useSelector(
  petsStore,
  (state) => ({
    total: state.dogs + state.cats,
    hasPets: state.dogs + state.cats > 0,
  }),
  { compare: shallow },
)
```

Prefer primitive selectors when possible. Use composite selections only when grouping values meaningfully reduces repeated subscriptions or keeps UI code simpler.

## Deprecated And Transitional Hooks

Current docs mark `useStore` as a deprecated alias for `useSelector`:

```tsx
// Avoid in new code
const count = useStore(petsStore, (state) => state.dogs)

// Prefer
const count = useSelector(petsStore, (state) => state.dogs)
```

`_useStore` is exported and documented as an experimental combined read/write hook. It returns `[selected, actions]` for stores with actions or `[selected, setState]` for plain stores. Do not use it by default unless the codebase has explicitly standardized on it.

## Writable Atoms In React

Use `useAtom` when a component needs to read and write the same atom:

```tsx
import { createAtom, useAtom } from '@tanstack/react-store'

const countAtom = createAtom(0)

function Counter() {
  const [count, setCount] = useAtom(countAtom)

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      {count}
    </button>
  )
}
```

`useAtom` returns the current value and the atom's stable setter. For read-only atoms, use `useSelector`.

## Component-Lifetime Stores

Use `useCreateStore` or `useCreateAtom` when a store or atom should live for a component mount rather than module lifetime:

```tsx
import { useCreateStore, useSelector } from '@tanstack/react-store'

function DraftEditor({ initialTitle }: { initialTitle: string }) {
  const draftStore = useCreateStore({
    title: initialTitle,
    dirty: false,
  })

  const title = useSelector(draftStore, (state) => state.title)

  return <input value={title} />
}
```

These hooks create stable instances for the lifetime of the component. If props should reset the store after mount, implement that reset explicitly.

## Context Bundles

Use `createStoreContext` when a subtree needs a typed bundle of stores and atoms:

```tsx
import {
  createAtom,
  createStore,
  createStoreContext,
  useSelector,
} from '@tanstack/react-store'
import type { Atom, Store } from '@tanstack/react-store'

const { StoreProvider, useStoreContext } = createStoreContext<{
  countAtom: Atom<number>
  totalsStore: Store<{ count: number }>
}>()

function CountButton() {
  const { countAtom, totalsStore } = useStoreContext()
  const count = useSelector(countAtom)
  const total = useSelector(totalsStore, (state) => state.count)

  return (
    <button
      type="button"
      onClick={() =>
        totalsStore.setState((state) => ({
          ...state,
          count: state.count + 1,
        }))
      }
    >
      {count} / {total}
    </button>
  )
}

function App() {
  return (
    <StoreProvider
      value={{
        countAtom: createAtom(0),
        totalsStore: createStore({ count: 0 }),
      }}
    >
      <CountButton />
    </StoreProvider>
  )
}
```

`useStoreContext()` throws outside the matching provider.

## SSR Notes

React `useSelector` uses `useSyncExternalStoreWithSelector`, with the same source getter for client and server snapshots. That makes reading compatible with React's external-store contract, but store lifetime is still the app's responsibility.

Guidance:

- Keep public, process-wide state in module-scope stores only when it is truly shared.
- Do not put request, session, tenant, auth, or user-specific state in module singletons during SSR.
- For per-user state, create stores per request, per route loader, per provider instance, or per component mount.
- Ensure server-rendered initial values match client hydration values.
