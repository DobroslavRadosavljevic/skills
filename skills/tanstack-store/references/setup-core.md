# Setup And Core Store

## Table Of Contents

- Installation
- Store Basics
- Immutable Updates
- Store Actions
- Subscriptions
- Batch And Flush
- Derived Stores

## Installation

React:

```sh
npm install @tanstack/react-store
```

Core-only usage:

```sh
npm install @tanstack/store
```

Framework adapter packages re-export core APIs, so a React app usually imports `createStore` from `@tanstack/react-store` and does not need a separate direct dependency on `@tanstack/store`.

## Store Basics

Create a writable store with an initial value:

```ts
import { createStore } from '@tanstack/store'

const countStore = createStore(0)

console.log(countStore.state)
console.log(countStore.get())

countStore.setState(() => 1)
```

Core members:

- `state`: getter for the current value.
- `get()`: method form of current value access.
- `setState(updater)`: update a writable store.
- `subscribe(listenerOrObserver)`: subscribe to changes.
- `actions`: present when the store was created with an action factory.

## Immutable Updates

`setState` takes an updater and replaces the whole store value with the updater return:

```ts
type Pets = {
  dogs: number
  cats: number
}

const petsStore = createStore<Pets>({
  dogs: 0,
  cats: 0,
})

petsStore.setState((state) => ({
  ...state,
  dogs: state.dogs + 1,
}))
```

Do not mutate and return the same object if subscribers should react:

```ts
// Avoid this
petsStore.setState((state) => {
  state.dogs += 1
  return state
})
```

Prefer domain helpers or actions for repeated updates.

## Store Actions

Pass an action factory as the second argument to `createStore`:

```ts
const petsStore = createStore(
  {
    dogs: 0,
    cats: 0,
  },
  (store) => ({
    addDog: () =>
      store.setState((state) => ({
        ...state,
        dogs: state.dogs + 1,
      })),
    addCat: () =>
      store.setState((state) => ({
        ...state,
        cats: state.cats + 1,
      })),
    reset: () => store.setState(() => ({ dogs: 0, cats: 0 })),
  }),
)

petsStore.actions.addDog()
```

The action factory receives only `get` and `setState`. This keeps actions close to the store and preserves type inference.

## Subscriptions

Subscribe for side effects such as persistence, logging, or integration with non-React code:

```ts
const { unsubscribe } = petsStore.subscribe((state) => {
  localStorage.setItem('pets', JSON.stringify(state))
})

unsubscribe()
```

Always keep and call `unsubscribe` when the subscription is tied to a component, request, test, or temporary integration.

The source implementation does not call the subscriber with an initial value on subscribe. Read `store.get()` first when an effect needs the current value immediately.

Observer form is also supported:

```ts
const subscription = petsStore.subscribe({
  next: (state) => console.log(state),
  error: (error) => reportError(error),
  complete: () => console.log('complete'),
})
```

## Batch And Flush

Use `batch` when multiple updates should notify subscribers once with the final state:

```ts
import { batch } from '@tanstack/store'

batch(() => {
  petsStore.setState((state) => ({ ...state, dogs: state.dogs + 1 }))
  petsStore.setState((state) => ({ ...state, cats: state.cats + 1 }))
})
```

`flush()` processes queued effects when no batch is active. Most app code should prefer `batch` and let the library flush automatically.

## Derived Stores

Create a readonly derived store by passing a getter function:

```ts
const count = createStore(0)
const double = createStore(() => count.state * 2)

count.setState(() => 5)
console.log(double.state)
```

The derived getter can receive the previous derived value:

```ts
const count = createStore(1)

const rollingSum = createStore<number>((previous) => {
  return count.state + (previous ?? 0)
})
```

A derived store returns `ReadonlyStore<T>` and does not expose `setState`.
