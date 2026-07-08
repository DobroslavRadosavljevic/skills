# Production And Testing

## Table Of Contents

- Framework Adapter Notes
- Store Lifetime
- Persistence And Side Effects
- Debugging Without Devtools
- Testing Patterns
- Migration Checks
- Production Checklist

## Framework Adapter Notes

Install the adapter for the framework:

- React: `@tanstack/react-store`
- Preact: `@tanstack/preact-store`
- Solid: `@tanstack/solid-store`
- Vue: `@tanstack/vue-store`
- Angular: `@tanstack/angular-store`
- Svelte: `@tanstack/svelte-store`
- Lit: `@tanstack/lit-store`

Current docs use `useSelector` as the read API across many adapters, with `useStore` retained as a deprecated alias. Confirm adapter-specific signatures before changing non-React code.

The React adapter is currently documented as ReactDOM-only, not React Native.

## Store Lifetime

Choose lifetime intentionally:

- Module singleton: shared app state that is public and process-wide.
- Component-lifetime: local draft state, local widgets, or per-mounted feature state via `useCreateStore` or `useCreateAtom`.
- Context bundle: subtree state that must be injected, overridden, or scoped.
- Request scoped: SSR/user/session/tenant state.
- Test scoped: per-test stores to avoid leaked state.

Avoid hidden singletons for user-specific state. They are easy to leak across SSR requests and hard to reset in tests.

## Persistence And Side Effects

Use `subscribe` for persistence:

```ts
const subscription = settingsStore.subscribe((settings) => {
  window.localStorage.setItem('settings', JSON.stringify(settings))
})

subscription.unsubscribe()
```

Guidance:

- Read the initial value manually when bootstrapping persistence.
- Debounce or batch expensive persistence if updates are frequent.
- Always unsubscribe temporary subscriptions.
- Keep subscriptions idempotent in React Strict Mode and tests.
- Avoid writing to stores inside derived getters; use explicit actions or event handlers.

## Debugging Without Devtools

No Store-specific devtools package was found in npm during the 2026-07-08 snapshot. Use local debugging tools:

- Log from actions, not every render.
- Temporarily subscribe to a store and print state transitions.
- Expose test-only selectors or helper reads for complex derived state.
- Assert action outputs in unit tests.
- Use React profiler or render counters to confirm selector boundaries.

Remove noisy subscriptions before shipping.

## Testing Patterns

Core store tests:

```ts
const store = createStore({ count: 0 })

store.setState((state) => ({ ...state, count: state.count + 1 }))

expect(store.state.count).toBe(1)
```

Action tests:

```ts
const store = createStore({ count: 0 }, (store) => ({
  increment: () =>
    store.setState((state) => ({ ...state, count: state.count + 1 })),
}))

store.actions.increment()

expect(store.get()).toEqual({ count: 1 })
```

Subscription tests:

```ts
const seen: Array<number> = []
const subscription = countStore.subscribe((value) => seen.push(value))

countStore.setState(() => 1)
subscription.unsubscribe()
countStore.setState(() => 2)

expect(seen).toEqual([1])
```

Batching tests should assert one notification with final state:

```ts
const seen: Array<number> = []
const subscription = countStore.subscribe((value) => seen.push(value))

batch(() => {
  countStore.setState(() => 1)
  countStore.setState(() => 2)
})

expect(seen).toEqual([2])
subscription.unsubscribe()
```

React tests:

- Create stores per test.
- Render components that call `useSelector`.
- Assert unrelated store updates do not re-render components with narrow selectors when that behavior matters.
- Test custom `compare` functions with both changed and unchanged data.
- Test `createStoreContext` outside-provider errors when relevant.

SSR tests:

- Verify request-scoped stores do not share state across requests.
- Verify initial server values match hydrated client values.
- Avoid module singletons for auth/session state in SSR tests unless intentionally global.

## Migration Checks

When migrating older examples:

- Replace `useStore(source, selector, compare)` with `useSelector(source, selector, { compare })`.
- Prefer `useSelector(atom)` or `useAtom(atom)` for atoms.
- Replace manual component-local `useMemo(() => createStore(...), [])` with `useCreateStore` when appropriate.
- Move repeated state transitions into store actions.
- Replace broad whole-store subscriptions with narrow selectors.

## Production Checklist

Before calling a TanStack Store change done:

- Package versions and docs are current.
- Store lifetime matches privacy and SSR requirements.
- Updates are immutable and return complete next values.
- Selectors are as narrow as practical.
- Composite selectors use `compare` only when necessary.
- Subscriptions have cleanup and do not duplicate in Strict Mode.
- Derived getters are pure and do not write or perform I/O.
- Actions cover repeated domain transitions.
- Tests isolate store instances and verify subscription cleanup.
- No deprecated `useStore` usage remains unless intentionally retained for compatibility.
