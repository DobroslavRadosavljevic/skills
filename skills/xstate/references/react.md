# @xstate/react

Complete reference for `@xstate/react` 6.1.0 with xstate 5.x: every export, how the hooks behave internally (creation, StrictMode, Fast Refresh, SSR), where state should live, re-render control, props/input, implementations, spawned children, emitted events, error boundaries, Next.js App Router, library integration, testing, version history, and pitfalls.

## Contents

- [Install and versions](#install-and-versions)
- [Exports](#exports)
- [useActor](#useactor)
- [useActorRef](#useactorref)
- [useSelector and shallowEqual](#useselector-and-shallowequal)
- [createActorContext](#createactorcontext)
- [Hook lifecycle internals](#hook-lifecycle-internals)
- [Where state lives: local vs shared vs global](#where-state-lives-local-vs-shared-vs-global)
- [Props, input, and syncing changing props](#props-input-and-syncing-changing-props)
- [Providing implementations inside components](#providing-implementations-inside-components)
- [Spawned and invoked children in child components](#spawned-and-invoked-children-in-child-components)
- [Emitted events and manual subscriptions](#emitted-events-and-manual-subscriptions)
- [Errors and error boundaries](#errors-and-error-boundaries)
- [SSR and Next.js App Router](#ssr-and-nextjs-app-router)
- [Persistence and rehydration](#persistence-and-rehydration)
- [Integrating with TanStack Query, forms, and routers](#integrating-with-tanstack-query-forms-and-routers)
- [Typing in components](#typing-in-components)
- [Testing React components that use machines](#testing-react-components-that-use-machines)
- [Version history and stale APIs](#version-history-and-stale-apis)
- [Do / Don't](#do--dont)
- [Pitfalls with fixes](#pitfalls-with-fixes)
- [Docs vs source discrepancies](#docs-vs-source-discrepancies)

## Install and versions

```bash
bun add xstate @xstate/react
```

- `@xstate/react@6.1.0` peer deps (npm metadata): `react: ^16.8 || ^17 || ^18 || ^19`, `xstate: ^5.28.0`. Runtime deps: `use-sync-external-store` (shim) and `use-isomorphic-layout-effect`.
- `xstate` is an optional peer, but every hook imports from it, so install it.
- npm also has `@xstate/react@7.0.0-alpha.x` on the `alpha` tag (pairs with `xstate@6` alpha). Do not use it in production code or mix it with xstate 5.

## Exports

Verified from `packages/xstate-react/src/index.ts`:

| Export | Signature (simplified) | Purpose |
|---|---|---|
| `useActor` | `useActor(logic, options?) => [snapshot, send, actorRef]` | Component-owned actor, re-renders on every snapshot |
| `useMachine` | same as `useActor`, `logic` restricted to machines | Alias of `useActor` (JSDoc `@alias`, under a `// deprecated` comment in index.ts; not marked `@deprecated`). Prefer `useActor` in new code |
| `useActorRef` | `useActorRef(logic, options?, observerOrListener?) => Actor` | Component-owned actor, no re-renders by itself |
| `useSelector` | `useSelector(actorRef \| undefined, selector, compare?) => T` | Subscribe to a derived slice of any actor-like `{ subscribe, getSnapshot }` |
| `createActorContext` | `createActorContext(logic, options?) => { Provider, useSelector, useActorRef }` | Scoped shared actor via React Context |
| `shallowEqual` | `(a, b) => boolean` | Comparator for `useSelector` when the selector returns objects/arrays |

There is no `useInterpret`, `useSpawn`, `useService`, or `asEffect`/`asLayoutEffect` in v5-era `@xstate/react`. Context objects no longer have `.useActor`.

## useActor

```ts
function useActor<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic> // required (with required `input`) when the logic declares non-optional input
): [SnapshotFrom<TLogic>, Actor<TLogic>['send'], Actor<TLogic>];
```

- Creates the actor once (lazy `useState` initializer), starts it in `useEffect`, stops it on unmount.
- Reads the snapshot through `useSyncExternalStore`, so the component re-renders on **every** emitted snapshot (every transition that produces a new snapshot object).
- Works with any actor logic: machines, `fromPromise`, `fromTransition`, `fromCallback`, `fromObservable`, etc.
- In development it throws if you pass an `ActorRef` instead of logic: "useActor() expects actor logic ... Use the useSelector(actorRef, ...) hook instead".
- Since 6.1.0 it throws `snapshot.error` during render when the actor's snapshot has `status: 'error'` (see [Errors](#errors-and-error-boundaries)).
- `send` is `actorRef.send`, already bound and stable for the lifetime of the actor. Safe in dependency arrays and as a prop.

```tsx
import { assign, fromPromise, setup } from 'xstate';
import { useActor } from '@xstate/react';

type User = { id: string; name: string };

export const userMachine = setup({
  types: {
    context: {} as { userId: string; user: User | null; error: string | null },
    input: {} as { userId: string },
    events: {} as { type: 'retry' } | { type: 'userId.change'; userId: string },
  },
  actors: {
    fetchUser: fromPromise<User, { userId: string }>(async ({ input, signal }) => {
      const res = await fetch(`/api/users/${input.userId}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }),
  },
}).createMachine({
  id: 'user',
  context: ({ input }) => ({ userId: input.userId, user: null, error: null }),
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        src: 'fetchUser',
        input: ({ context }) => ({ userId: context.userId }),
        onDone: { target: 'loaded', actions: assign({ user: ({ event }) => event.output }) },
        onError: { target: 'failed', actions: assign({ error: ({ event }) => String(event.error) }) },
      },
    },
    loaded: {},
    failed: { on: { retry: 'loading' } },
  },
  on: {
    // root transition to a descendant: `loading` is exited and re-entered, so the invoke restarts
    'userId.change': {
      target: '.loading',
      actions: assign({ userId: ({ event }) => event.userId, user: null, error: null }),
    },
  },
});

export function UserCard({ userId }: { userId: string }) {
  // `input` is required by the types because the machine declares `types.input`
  const [snapshot, send] = useActor(userMachine, { input: { userId } });

  if (snapshot.matches('loading')) return <p>Loading…</p>;
  if (snapshot.matches('failed'))
    return <button onClick={() => send({ type: 'retry' })}>Retry ({snapshot.context.error})</button>;
  return <h2>{snapshot.context.user?.name}</h2>;
}
```

Use `useActor` when the component renders most of the snapshot anyway. When only a few values matter, use `useActorRef` + `useSelector` to avoid re-rendering on unrelated context changes.

## useActorRef

```ts
function useActorRef<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic>, // required when input is required
  observerOrListener?: Observer<SnapshotFrom<TLogic>> | ((snapshot: SnapshotFrom<TLogic>) => void)
): Actor<TLogic>;
```

- Same creation/start/stop lifecycle as `useActor`, but **never re-renders the component** on snapshot changes. It returns a stable `Actor` reference.
- The optional third argument subscribes an observer in a `useEffect` whose dependency is the observer itself. An inline function re-subscribes on every render; wrap it in `useCallback`, or subscribe in your own effect.
- Does **not** throw on actor error by itself. Only `useActor` and `useSelector` throw. If you use `useActorRef` without any `useSelector`, handle errors with `onError` in the machine or an `error` observer.
- Use it to: pass the ref down, feed `useSelector`, put it in a Context, trigger side effects from snapshots, or own an actor whose snapshot the component never renders.

```tsx
import { useActorRef, useSelector } from '@xstate/react';

const selectIsSubmitting = (s: SnapshotFrom<typeof formMachine>) => s.hasTag('submitting');

function SignupForm() {
  const formRef = useActorRef(formMachine);
  const isSubmitting = useSelector(formRef, selectIsSubmitting);

  return (
    <form onSubmit={(e) => { e.preventDefault(); formRef.send({ type: 'submit' }); }}>
      <EmailField formRef={formRef} />
      <button disabled={isSubmitting}>Sign up</button>
    </form>
  );
}
```

## useSelector and shallowEqual

```ts
function useSelector<TActor extends Pick<AnyActorRef, 'subscribe' | 'getSnapshot'> | undefined, T>(
  actor: TActor,
  selector: (snapshot: TActor extends { getSnapshot(): infer S } ? S : undefined) => T,
  compare?: (a: T, b: T) => boolean // default: ===
): T;
```

- Built on `useSyncExternalStoreWithSelector`: the component re-renders only when `compare(prevSelected, nextSelected)` is false. The selector re-runs when the snapshot or the selector function changes, so inline selectors are fine (module-level selectors are slightly cheaper and reusable).
- `useSelector` does **not** start or stop the actor. It only subscribes. A global actor must be started by you.
- `actor` may be `undefined` (≥ 4.1.0). The selector then receives `undefined`, and the result type includes `undefined`:

  ```ts
  const count = useSelector(maybeRef, (s) => s?.context.count); // number | undefined
  ```

- Works with anything that has `subscribe` + `getSnapshot`, including `@xstate/store` stores (≥ 4.1.1) and spawned/invoked child refs.
- Since 6.1.0 it throws `snapshot.error` when the selected actor's snapshot has `status: 'error'`.
- Switching to a different actor between renders is supported; it resubscribes and renders the new actor's current value.

Comparators:

```ts
import { shallowEqual, useSelector } from '@xstate/react';

// Primitive: default === is enough
const count = useSelector(ref, (s) => s.context.count);

// New object every time -> needs shallowEqual, otherwise re-renders on every snapshot
const { page, pageSize } = useSelector(
  ref,
  (s) => ({ page: s.context.page, pageSize: s.context.pageSize }),
  shallowEqual,
);

// Derived array: shallowEqual compares arrays element-by-element (keys are indices)
const doneIds = useSelector(
  ref,
  (s) => s.context.todos.filter((t) => t.done).map((t) => t.id),
  shallowEqual,
);

// Custom: compare by identity key
const user = useSelector(ref, (s) => s.context.user, (a, b) => a?.id === b?.id);
```

`shallowEqual` is copied from react-redux: `Object.is` on the top level, then same key count and `Object.is` per key. It does not recurse.

Selector rules:

- Select the smallest value the component renders: a primitive, a boolean from `matches`/`hasTag`/`can`, or a stable reference such as `context.items` (it keeps its identity until an `assign` replaces it).
- Never `useSelector(ref, (s) => s)` in a hot component. It re-renders on every snapshot, same as `useActor`. It is acceptable for small leaf components that render most fields (the friends-list example does this per item).
- Compute expensive derivations from a stable selected value with `useMemo`, or select with `shallowEqual`.

## createActorContext

```ts
function createActorContext<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic>
): {
  Provider: (props: { children: React.ReactNode; logic?: TLogic; options?: ActorOptions<TLogic> }) => React.ReactElement;
  useSelector: <T>(selector: (snapshot: SnapshotFrom<TLogic>) => T, compare?: (a: T, b: T) => boolean) => T;
  useActorRef: () => Actor<TLogic>;
};
```

- Each mounted `<Provider>` creates **its own actor** via `useActorRef`. Two providers means two independent actors. Mount it where the shared scope begins (layout, modal, wizard root), not necessarily at the app root.
- `options` given to `createActorContext` and the Provider's `options` prop are **merged** (provider wins per key) since 4.0.3. Typical split: `inspect` at creation, `input` per provider.
- `logic` prop replaces the default logic, for example `machine.provide(...)` for tests or per-mount implementations. Passing the removed `machine` prop throws at runtime.
- `Ctx.useSelector` / `Ctx.useActorRef` throw `You used a hook from "ActorProvider" but it's not inside a <ActorProvider> component.` outside a Provider.
- Typing gap: Provider `options` is typed as plain `ActorOptions<TLogic>`, so a required `input` is **not** enforced by the compiler here (unlike `useActor`/`useActorRef`). Forgetting it fails at runtime.
- There is no `Ctx.useActor`. Use `Ctx.useSelector` for reads and `Ctx.useActorRef().send` for writes.

```tsx
import { createActorContext } from '@xstate/react';
import { createBrowserInspector } from '@statelyai/inspect';
import { cartMachine } from './cartMachine';

const { inspect } = createBrowserInspector({ autoStart: false });
export const CartContext = createActorContext(cartMachine, { inspect });

export function Shop({ currency }: { currency: 'EUR' | 'USD' }) {
  return (
    <CartContext.Provider options={{ input: { currency } }}>
      <CartBadge />
      <CartDrawer />
    </CartContext.Provider>
  );
}

function CartBadge() {
  const count = CartContext.useSelector((s) => s.context.items.length);
  return <span aria-label="items in cart">{count}</span>;
}

function AddButton({ sku }: { sku: string }) {
  const cartRef = CartContext.useActorRef(); // stable ref, no re-render on cart changes
  return <button onClick={() => cartRef.send({ type: 'item.add', sku })}>Add</button>;
}
```

Works with non-machine logic too: `createActorContext(fromPromise(() => load()))`, then `Ctx.useSelector((s) => s.output)`.

## Hook lifecycle internals

What `useActor`, `useActorRef`, and `createActorContext.Provider` actually do (from `useActorRef.ts`, `useActor.ts`, `stopRootWithRehydration.ts`):

1. **Creation once.** `createActor(logic, options)` runs inside a `useState` initializer. `options` (including `input`, `snapshot`, `inspect`, `id`, `systemId`) are read only at creation. Changing `input` on later renders does nothing.
2. **Identity is `logic.config`, not the logic object.** On each render, if `logic.config !== previousConfig`, the hook creates a new actor, rehydrated from the old actor's persisted snapshot (`getPersistedSnapshot({ __unsafeAllowInlineActors: true })`), and swaps it in during render. This is what makes Fast Refresh work (machine module re-evaluated, state kept).
3. **`machine.provide(...)` keeps the same `config`**, so calling it inline every render does not recreate the actor. Instead a layout effect copies the latest `implementations` onto the running actor's logic after every commit. Actions, guards, actors, and delays provided in render therefore see the latest props/state closures.
4. **Start in `useEffect`, stop in cleanup.** No side effects run during render. Custom actions, invocations, spawned-child starts, and delayed events are deferred by xstate until `start()`. Only the initial snapshot computation (context factory, `assign`s in initial microsteps) runs in render.
5. **StrictMode / Activity reconnects.** Cleanup calls `stopRootWithRehydration`: it snapshots every actor in the tree, mutes observers, stops the root, then restores the snapshots and resets status to "not started". The next effect run calls `start()` on the **same actor object** from the same state. Consequences in dev StrictMode, verified by tests:
   - Initial **entry actions run once**.
   - **Invoked/spawned actors that are active at start are started twice** (first instance is stopped). A `fromCallback` body runs twice and its cleanup runs once in between. A `fromPromise` creator runs twice. The first run's `signal` is aborted. Always honor `signal` and return cleanup from callbacks.
   - `after` delays work (fixed in 4.0.1).
6. **Subscription via `useSyncExternalStore`** with `getServerSnapshot = getSnapshot`, so SSR renders the not-yet-started actor's initial snapshot.

## Where state lives: local vs shared vs global

Choose by who needs to read/write and how long the state lives:

| Need | Use | Why |
|---|---|---|
| One component's UI flow (toggle, fetch, form wizard step) | `useActor(machine)` | Lifetime = component. Unmount stops it. Simplest |
| One component owns it, a few children read slices | `useActorRef` + pass `actorRef` as a prop + `useSelector` in children | Children re-render only for their slice; no context needed |
| A subtree shares it (modal, checkout, editor) | `createActorContext` + `<Ctx.Provider>` at the subtree root | Scoped, testable with `logic` prop, no prop drilling |
| App-wide, lives for the whole session, also used outside React | Module-level `createActor(machine).start()` + `useSelector(globalActor, ...)` | Works in non-React code (router guards, websocket handlers). Client-only (see SSR) |
| Server cache (lists, entities) | TanStack Query / SWR, not a machine | Caching, dedup, invalidation are solved there |

Rules of thumb:

- Keep state as local as possible; lift only when a second consumer appears.
- Prefer passing the `actorRef` (or plain derived props) over passing the whole snapshot. Snapshots change every transition; refs never change.
- Pure presentational components should receive plain props (`isOpen`, `onToggle`) derived from the snapshot, not the actor. This keeps them reusable and testable without xstate.
- A custom hook wrapper (`useToggle()` returning `{ isOpen, toggle }`) hides the machine from callers. This is good when the machine is an implementation detail.

Global actor pattern (client-only):

```ts
// authActor.ts
import { createActor } from 'xstate';
import { authMachine } from './authMachine';

export const authActor = createActor(authMachine);
authActor.start(); // calling start() again later is a no-op, so starting in an effect is also safe

// Any component
const user = useSelector(authActor, (s) => s.context.user);
authActor.send({ type: 'logout' });
```

A stopped actor cannot be restarted. Do not call `globalActor.stop()` in a component cleanup (StrictMode would kill it permanently in dev).

## Props, input, and syncing changing props

- Initial values from props go in `input`, consumed by `context: ({ input }) => ...`. Do not put props into a machine via `machine.provide({ context })`; v5 removed that.
- `input` is read once. When a prop changes later, choose:
  1. **Remount with `key`** when the prop is an identity (user id, document id) and the old state is meaningless for the new value: `<UserCard key={userId} userId={userId} />`.
  2. **Send an event in `useEffect`** when the machine must react (restart a fetch, reset a step):

     ```tsx
     const [snapshot, send] = useActor(userMachine, { input: { userId } });
     const isFirstRender = useRef(true);
     useEffect(() => {
       if (isFirstRender.current) { isFirstRender.current = false; return; } // input already covered it
       send({ type: 'userId.change', userId });
     }, [userId, send]);
     ```

     Skipping the first run is optional. Without it the machine gets a redundant event, which is harmless when the transition is idempotent.
  3. **Read it lazily through a provided implementation** when the machine only needs the latest value at the moment an action/guard runs (see next section). No event is needed.
- Values that come from other hooks (query data, router params) follow the same rules: `input` for the first value, events in an effect for changes.

## Providing implementations inside components

```tsx
function Checkout({ onComplete, api }: { onComplete: (orderId: string) => void; api: Api }) {
  const [snapshot, send] = useActor(
    checkoutMachine.provide({
      actions: {
        // latest onComplete closure is used: implementations are re-synced after every commit
        notifyComplete: ({ context }) => onComplete(context.orderId!),
      },
      actors: {
        placeOrder: fromPromise(({ input }: { input: { cartId: string } }) => api.placeOrder(input.cartId)),
      },
      guards: {
        canPay: ({ context }) => context.total > 0,
      },
    }),
    { input: { cartId: '42' } },
  );
  // ...
}
```

- Safe because `provide` keeps `config` identity (no actor recreation). Verified by tests: guards/actions provided in render use fresh values after re-render.
- Each `useActor(machine.provide(...))` call gets its own actor and its own implementations. Two hooks with the same base machine do not share actions.
- `provide` replaces implementations by name. Names must exist in `setup({ actions, guards, actors, delays })` (or the machine's implementations) for strong typing.
- A newly provided `actors` entry only affects **future** invocations/spawns. An already running invoked actor keeps its original logic.
- Updated implementations are copied in a layout effect after commit. An event sent **during render** would see the previous implementations. Never send during render anyway.
- Do not build the machine itself in render (`createMachine({...})` / `setup(...).createMachine(...)` inside the component). Every render then has a new `config`, so the hook recreates the actor on every render and can loop until React reports too many re-renders. Define machines at module scope and use `.provide()` in render.

## Spawned and invoked children in child components

List-item pattern: the parent keeps child refs in context, and each row subscribes only to its own child.

```ts
// todoMachine.ts
export const todoMachine = setup({
  types: {
    context: {} as { id: string; title: string; done: boolean },
    input: {} as { id: string; title: string },
    events: {} as { type: 'toggle' } | { type: 'rename'; title: string },
  },
}).createMachine({
  context: ({ input }) => ({ ...input, done: false }),
  on: {
    toggle: { actions: assign({ done: ({ context }) => !context.done }) },
    rename: { actions: assign({ title: ({ event }) => event.title }) },
  },
});

// todosMachine.ts
export const todosMachine = setup({
  types: {
    context: {} as { todos: ActorRefFrom<typeof todoMachine>[] },
    events: {} as { type: 'add'; title: string } | { type: 'remove'; id: string },
  },
  actors: { todoMachine },
}).createMachine({
  context: { todos: [] },
  on: {
    add: {
      actions: assign({
        todos: ({ context, event, spawn }) => {
          const id = crypto.randomUUID();
          return [...context.todos, spawn('todoMachine', { id, input: { id, title: event.title } })];
        },
      }),
    },
    remove: {
      actions: [
        stopChild(({ event }) => event.id), // stop the child, not only drop the ref
        assign({ todos: ({ context, event }) => context.todos.filter((t) => t.id !== event.id) }),
      ],
    },
  },
});
```

```tsx
function TodoList() {
  const todosRef = useActorRef(todosMachine);
  // array identity changes only on add/remove, so toggling a todo does not re-render the list
  const todoRefs = useSelector(todosRef, (s) => s.context.todos);
  return (
    <ul>
      {todoRefs.map((ref) => (
        <TodoRow key={ref.id} todoRef={ref} onRemove={() => todosRef.send({ type: 'remove', id: ref.id })} />
      ))}
    </ul>
  );
}

function TodoRow({ todoRef, onRemove }: { todoRef: ActorRefFrom<typeof todoMachine>; onRemove: () => void }) {
  const title = useSelector(todoRef, (s) => s.context.title);
  const done = useSelector(todoRef, (s) => s.context.done);
  return (
    <li>
      <input type="checkbox" checked={done} onChange={() => todoRef.send({ type: 'toggle' })} />
      {title} <button onClick={onRemove}>×</button>
    </li>
  );
}
```

- Use the spawn `id` as the React `key` (`ref.id`). It is stable and unique among siblings.
- Invoked children: read from `snapshot.children[id]`, which exists only while the invoking state is active. Select it, and the result may be `undefined`:

  ```ts
  const machine = setup({
    types: { children: {} as { payment: 'paymentMachine' } },
    actors: { paymentMachine },
  }).createMachine({ /* invoke: { id: 'payment', src: 'paymentMachine' } in some state */ });

  const paymentRef = useSelector(checkoutRef, (s) => s.children.payment); // typed ref | undefined
  const step = useSelector(paymentRef, (s) => s?.value);                  // undefined-safe
  ```

- Children can also be looked up by `systemId`: `actorRef.system.get('notifier')`. This is not reactive. Read it in event handlers or effects, not as render state.

## Emitted events and manual subscriptions

Emitted events (`emit(...)` action, typed via `setup({ types: { emitted } })`) are one-off notifications such as toasts, analytics, or focus requests. They are not state. Subscribe with `actorRef.on` in an effect:

```tsx
const machine = setup({
  types: {
    events: {} as { type: 'save' },
    emitted: {} as { type: 'saved'; at: number } | { type: 'failed'; reason: string },
  },
}).createMachine({
  on: { save: { actions: emit(() => ({ type: 'saved' as const, at: Date.now() })) } },
});

function Editor() {
  const editorRef = useActorRef(machine);
  useEffect(() => {
    const sub = editorRef.on('saved', (e) => toast(`Saved at ${new Date(e.at).toLocaleTimeString()}`));
    const all = editorRef.on('*', (e) => analytics.track(e.type)); // wildcard
    return () => { sub.unsubscribe(); all.unsubscribe(); };
  }, [editorRef]);
  // ...
}
```

- `emit` runs like other deferred actions: listeners registered at that moment receive the event after the transition is processed (and not before the actor is started). Nothing is buffered for late listeners.
- Snapshot side effects (persist to storage, sync to URL): `useEffect(() => { const sub = ref.subscribe((s) => ...); return sub.unsubscribe; }, [ref])`. `subscribe` does not replay the current snapshot; read `ref.getSnapshot()` first if needed.
- Do not call `setState` from a subscription to mirror machine state into React state. Use `useSelector`.
- Non-React derived subscriptions (xstate ≥ 5.29): `actorRef.select(selector, equalityFn?)` returns a `Readable` with `.get()` and `.subscribe()` that fires only when the selected value changes.

## Errors and error boundaries

Since `@xstate/react` 6.1.0, when the actor's snapshot has `status: 'error'` (an unhandled error: an invoked promise rejects with no `onError`, an action throws, and so on), `useActor` and `useSelector` **throw `snapshot.error` during render**, so the nearest React error boundary catches it.

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function Page() {
  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <div role="alert">{String(error)} <button onClick={resetErrorBoundary}>Retry</button></div>
    )}>
      <UserCard userId="1" />
    </ErrorBoundary>
  );
}
```

- Resetting the boundary remounts the child, which creates a **fresh actor** (the errored actor was stopped on unmount). For a global or context-provided actor the errored actor persists. Reset by remounting the Provider (`key`) or recreate the global actor.
- Expected failures (network, validation) belong in the machine: `onError` → a `failed` state with retry. Reserve boundaries for bugs and truly unhandled errors.
- `useActorRef` alone never throws. Before 6.1 the hooks swallowed the error into the snapshot; code that checked `snapshot.status === 'error'` after `useActor` will now hit the boundary first.

## SSR and Next.js App Router

- Hooks are client-only APIs. In the App Router, every file that calls `useActor`, `useActorRef`, `useSelector`, or `createActorContext` hooks must be (or be imported by) a `'use client'` module. Machine definitions (pure `setup(...).createMachine(...)`) can live in shared modules and also be imported by server code.
- During SSR, the hook creates the actor but never starts it (effects do not run on the server). Only the initial snapshot is computed, so no fetches, timers, or custom actions run on the server. The client creates its own actor and starts it after hydration.
- **Hydration consistency:** the initial snapshot must be deterministic for the same `input`. `Date.now()`, `Math.random()`, `crypto.randomUUID()`, or `window`/`localStorage` reads in the `context` factory or in initial `assign`s cause hydration mismatches (and `window` crashes on the server). Pass such values via `input` from the server, or set them in an event after mount.
- **Server data in, flow on the client:** fetch in a Server Component, then pass serializable data as props, then use it as `input`:

  ```tsx
  // app/checkout/page.tsx (Server Component)
  export default async function Page() {
    const cart = await getCart();
    return <CheckoutFlow cart={{ id: cart.id, total: cart.total }} />;
  }

  // app/checkout/CheckoutFlow.tsx
  'use client';
  import { useActor } from '@xstate/react';
  import { checkoutMachine } from './checkoutMachine';

  export function CheckoutFlow({ cart }: { cart: { id: string; total: number } }) {
    const [snapshot, send] = useActor(checkoutMachine, { input: { cart } });
    // ...
  }
  ```

- **No module-level started actors in SSR'd code.** Client Components are still rendered on the server, so their module scope runs there too. A module-level `createActor(m).start()` is shared by **all requests** (cross-user state leak) and runs its side effects on the server. Use `createActorContext` with a Provider in a client layout instead. If you need a true singleton, create it lazily on the client (`typeof window !== 'undefined'`) and render it only after mount.
- Server Actions can be called from provided `fromPromise` actors (`actors: { save: fromPromise(({ input }) => saveAction(input)) }`), which keeps loading/error/retry flow in the machine.

## Persistence and rehydration

```tsx
const STORAGE_KEY = 'wizard:v3'; // version the key; old snapshots may not match a changed machine

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function Wizard() {
  const wizardRef = useActorRef(wizardMachine, { snapshot: loadSnapshot() });
  useEffect(() => {
    const sub = wizardRef.subscribe(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wizardRef.getPersistedSnapshot()));
    });
    return sub.unsubscribe;
  }, [wizardRef]);
  // ...
}
```

- Use `snapshot` (not the deprecated `state` option). Persist `getPersistedSnapshot()`, not `getSnapshot()`. The persisted form includes child actors and history. Entry actions are not re-run on restore; invocations are restarted.
- Reading `localStorage` in render breaks SSR hydration. In SSR apps, render the persisted component client-only, or store the snapshot in a cookie and pass it from the server.
- A persisted snapshot that references states that no longer exist can fail to restore. Version the key and fall back to a fresh start.

## Integrating with TanStack Query, forms, and routers

**TanStack Query (server cache) + machine (flow).** Keep entities, caching, dedup, and invalidation in Query. Let the machine own *when* things happen (wizard steps, optimistic UI phases, retry/confirm flows).

```tsx
function EditProfile({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ['profile', userId], queryFn: () => api.getProfile(userId) });
  const save = useMutation({
    mutationFn: api.saveProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });

  const editRef = useActorRef(
    editMachine.provide({
      actors: {
        // the machine invokes 'saveProfile'; the mutation keeps Query's cache in charge
        saveProfile: fromPromise(({ input }: { input: ProfileDraft }) => save.mutateAsync(input)),
      },
    }),
  );

  // feed query results in as events; the machine decides what they mean in each state
  useEffect(() => {
    if (profile.data) editRef.send({ type: 'profile.loaded', profile: profile.data });
  }, [profile.data, editRef]);
  // ...
}
```

Alternative: invoke `fromPromise(() => queryClient.fetchQuery({ queryKey, queryFn }))` from the machine, so the machine decides when to load and Query still caches. Do not copy the whole query result into machine context and then treat it as the source of truth. Two caches will drift.

**Forms.** For field-level state (values, touched, validation), a form library (TanStack Form, React Hook Form) is the better tool. Use a machine for the multi-step flow around it: steps, async submit, confirm dialogs, conflict resolution. Send the validated values in a `submit` event. Small forms can keep values in machine context (`assign` on `field.change` events). Then select single fields with `useSelector` so typing in one field does not re-render the others.

**Routers.** The router owns the URL. Two directions:

- URL → machine: send events from an effect when params/search change (`useEffect(() => ref.send({ type: 'route.changed', tab }), [tab])`), or remount with `key` for identity params.
- Machine → URL: provide a navigation action in the component: `machine.provide({ actions: { goToReceipt: ({ context }) => navigate({ to: '/orders/$id', params: { id: context.orderId } }) } })`.
- Do not mirror the full URL in context. Store only what the flow needs.

## Typing in components

- `SnapshotFrom<typeof machine>`, `ActorRefFrom<typeof machine>`, `EventFromLogic<typeof machine>`, `InputFrom<typeof machine>` (all from `xstate`) type props and selectors.
- With `setup`, `snapshot.matches(...)` is checked against the machine's state value shape. A typo such as `matches('loadng')` or a wrong nested object is a compile error. `matches` does not narrow `context`. Model "loaded implies data" with `context.user!` guarded by state, or keep nullable checks.
- `snapshot.hasTag(tag)` is typed when `types.tags` is declared. `snapshot.can({ type: 'retry' })` checks whether an event would cause a transition (good for `disabled`).
- `useActor` / `useActorRef` make `options.input` required at the type level when `types.input` is declared (≥ 4.1.2). `createActorContext` Provider does not.
- Typed `send`: events must match `types.events`. A discriminated union of `{ type }` objects is required. v5 has no string shorthand (`send('TOGGLE')`).

## Testing React components that use machines

Strategy:

1. Test machine logic without React: `createActor(machine.provide({...mocks}), { input })`, `.start()`, `.send(...)`, assert with `getSnapshot()`, `await waitFor(actor, (s) => s.matches('done'))`, or `await toPromise(actor)` for final output. This is fast and exact.
2. Test components with Testing Library against real behavior, mocking only I/O through `provide`.

Make the logic injectable so tests can pass mocks:

```tsx
// Component accepts logic (defaulting to the real machine)
export function UserCard({ userId, logic = userMachine }: { userId: string; logic?: typeof userMachine }) {
  const [snapshot, send] = useActor(logic, { input: { userId } });
  // ...
}

// test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromPromise } from 'xstate';

it('shows the user after loading', async () => {
  const logic = userMachine.provide({
    // match the original logic's <Output, Input> so provide() type-checks
    actors: { fetchUser: fromPromise<User, { userId: string }>(async () => ({ id: '1', name: 'Ada' })) },
  });
  render(<UserCard userId="1" logic={logic} />);
  expect(await screen.findByRole('heading', { name: 'Ada' })).toBeInTheDocument();
});

it('retries after failure', async () => {
  let calls = 0;
  const logic = userMachine.provide({
    actors: {
      fetchUser: fromPromise<User, { userId: string }>(async () => {
        calls++;
        if (calls === 1) throw new Error('boom');
        return { id: '1', name: 'Ada' };
      }),
    },
  });
  render(<UserCard userId="1" logic={logic} />);
  await userEvent.click(await screen.findByRole('button', { name: /retry/i }));
  expect(await screen.findByRole('heading', { name: 'Ada' })).toBeInTheDocument();
});
```

- For context-based components, wrap with `<Ctx.Provider logic={machine.provide({...})} options={{ input }}>`.
- `provide` keeps `config` identity, so `typeof userMachine` stays assignable for the `logic` prop.
- Delays: `vi.useFakeTimers()` and advance inside `act(() => vi.advanceTimersByTime(ms))`, or pass `clock: new SimulatedClock()` via options and call `clock.increment(ms)` inside `act`.
- Run component tests under `<React.StrictMode>` at least once. It surfaces non-idempotent invoked callbacks/promises (they run twice in dev).
- For global actors, export a factory (`createAuthActor()`) and create a fresh instance per test. A module singleton leaks state between tests.
- Error boundary behavior (6.1): render inside a boundary and assert the fallback. Silence React's console error in that test.

## Version history and stale APIs

| Version | Change |
|---|---|
| 3.x | xstate v4 era: `useMachine(machine, { actions, guards, context })`, `useInterpret`, `useActor(actorRef)`, `useSpawn`, `createActorContext` (added in 3.1.0) |
| 4.0.0 | xstate v5. `useActorRef` added (replaces `useInterpret` and `useSpawn`). `useActor` now takes **logic**. Old `useActor(actorRef)` became `useSelector(actorRef, s => s)` + `actorRef.send`. Implementations only via `machine.provide(...)`. Factory-function argument removed. `getSnapshot` parameter removed from hooks. FSM support removed. `createActorContext`: `.useActor` removed, Provider `options` prop added, 3rd `observerOrListener` arg removed. `useMachine` became an alias of `useActor`. Package `exports` field (no deep imports). Fast Refresh support |
| 4.0.1 | `after` transitions fixed under StrictMode |
| 4.0.3 | `createActorContext` options merged with Provider `options` |
| 4.1.0 | `useSelector` accepts `undefined` actor |
| 4.1.1 | `useSelector` works with `@xstate/store` stores |
| 4.1.2 | `input` required in hook types when declared |
| 5.0.0 / 5.0.3 | React 19 peer support. Major bump because the xstate peer moved to `^5.19.0`. No hook API change |
| 6.0.0 | No API change. Major bump because the xstate peer moved to `^5.20.0` (the release that moved graph utilities into `xstate/graph`) |
| 6.1.0 | `useActor` / `useSelector` throw the actor's error so React error boundaries catch it. npm peer: `xstate ^5.28.0` |

Stale code to catch:

| Stale (v4 / @xstate/react ≤ 3) | Current |
|---|---|
| `useInterpret(machine, opts, observer)` | `useActorRef(machine, opts, observer)` |
| `useSpawn(logic)` | `useActorRef(logic)` |
| `const [state, send] = useActor(actorRef)` | `const s = useSelector(actorRef, (s) => s); actorRef.send(...)` |
| `useMachine(machine, { actions, guards, services, context })` | `useActor(machine.provide({ actions, guards, actors }), { input })` |
| `useMachine(() => createMachine(...))` | Define the machine at module scope |
| `useSelector(ref, sel, cmp, getSnapshot)` | 3 parameters only |
| `MyCtx.useActor()` | `MyCtx.useSelector(...)` + `MyCtx.useActorRef()` |
| `<MyCtx.Provider machine={...}>` | `<MyCtx.Provider logic={...}>` (`machine` prop throws) |
| `send('TOGGLE')`, `state.nextEvents`, `state.can('X')` with string | `send({ type: 'TOGGLE' })`, `snapshot.can({ type: 'X' })` |
| `{ state: persisted }` option | `{ snapshot: persisted }` |
| `service`, `state` naming | `actorRef`, `snapshot` |
| `asEffect`, `asLayoutEffect` | Plain actions; React effects for React-only work |

## Do / Don't

**Do**

- Define machines at module scope with `setup({ types, actions, guards, actors })`. Inject component-specific behavior with `.provide()` in render.
- Pass first values via `input`. Sync later prop changes with events in effects, or remount with `key`.
- Use `useActorRef` + several narrow `useSelector`s in components that read little but live long.
- Pass `actorRef`s (stable) down the tree, not snapshots.
- Select booleans for rendering: `useSelector(ref, (s) => s.matches('editing'))`, `(s) => s.can({ type: 'submit' })`.
- Model expected failures with `onError`. Wrap actor-using subtrees in an error boundary for unexpected ones (6.1+).
- Honor `signal` in `fromPromise` and return cleanup from `fromCallback` (StrictMode double start, real cancellation).
- Clean up every manual `subscribe` / `on` in the effect's return.

**Don't**

- Don't create machines or call `createActor` in render. Don't use `useMemo(() => createActor(m).start(), [])` either: it starts during render, never stops, and breaks under StrictMode/SSR. Use the hooks.
- Don't select the whole snapshot (`s => s`) in large or frequently rendering components.
- Don't mirror machine state into `useState` via subscriptions.
- Don't expect changing `options` (`input`, `inspect`) to affect an existing actor.
- Don't `send` during render. Send from event handlers or effects.
- Don't start module-level actors in code that is server-rendered.
- Don't stop a global actor from a component cleanup.
- Don't store server cache entities in machine context as the source of truth when a query library already owns them.

## Pitfalls with fixes

| Symptom | Cause | Fix |
|---|---|---|
| Actor resets / infinite re-render / "Too many re-renders" | Machine created inside the component (new `config` each render) | Move machine to module scope. Use `machine.provide()` in render |
| Prop change ignored | `input` only read at creation | `useEffect` + `send`, or `key` remount |
| Callback/action uses old prop value | Action defined in `setup()` closes over module scope | Provide the action in render with `.provide()`, or pass the value in the event |
| Component re-renders on every transition | `useActor` or `useSelector(ref, s => s)`; selector returns a new object/array | Narrow selectors; `shallowEqual`; select stable refs then `useMemo` |
| Fetch/subscription runs twice in dev | StrictMode reconnect restarts active invoked actors | Abort via `signal`; idempotent callbacks with cleanup; this is dev-only |
| `useSelector` on global actor shows initial state forever | Actor never started (`useSelector` doesn't start) | `actor.start()` at creation or in an effect |
| Hydration mismatch | Non-deterministic context factory, or `localStorage` in `snapshot` option during SSR | Deterministic initial context; pass values via `input`; client-only render for persisted state |
| State shared between users on the server | Module-level started actor in SSR'd module | Provider-scoped actor (`createActorContext`) or client-only singleton |
| Error crashes the tree after upgrading to 6.1 | Unhandled actor error now thrown to boundaries | Add `onError` handling in the machine; add an error boundary |
| TypeScript error on a `matches(...)` argument | State value typo or wrong nesting | Use the object form for nested states: `matches({ form: 'invalid' })` |
| Removed list item still running timers | Ref dropped from context without stopping | `stopChild(id)` before removing from context |
| `Ctx.useSelector` throws "not inside a <ActorProvider>" | Component rendered outside the Provider (often in tests) | Wrap with the Provider; in tests pass `logic`/`options` |

## Docs vs source discrepancies

- Docs list `useSelector(actorRef, selector, compare?, getSnapshot?)`. Source has no `getSnapshot` parameter (removed in 4.0.0).
- Docs omit that `useActorRef` accepts a third `observerOrListener` argument (it does).
- A 2024 blog post says `useSelector` starts and stops actors automatically. It does not; only `useActor`/`useActorRef`/Provider manage lifecycle.
- The `todomvc-react` example passes `{ state: ... }` to `createActorContext` (deprecated alias of `snapshot`) and subscribes without unsubscribing. Use `snapshot` and return the unsubscribe.
- Older blog posts (2021–2022: "just use props", "just use hooks") use v4 APIs (`send('TOGGLE')`, `assign((context, event) => ...)`). Their architectural advice still holds: keep machines local, pass props/refs, and sync props via events in effects. Their code does not.
