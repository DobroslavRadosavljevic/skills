# @xstate/store and framework adapters

Scope: `@xstate/store` 4.3.0 (core, atoms, `fromStore`, the `/undo`, `/reset`, `/persist`, `/validate` extensions, inspection, typing) and its adapters `@xstate/store-react` 2.1.0, `@xstate/store-vue` 2.0.0, `@xstate/store-svelte` 2.0.0, `@xstate/store-solid` 2.0.1, `@xstate/store-angular` 2.0.0, `@xstate/store-preact` 2.0.0. It also covers when to pick a store over a machine, how to upgrade a store to a machine, and how to migrate from v2 and v3. All APIs were checked against `packages/xstate-store*/src` on main.

## Contents

- Install and package map
- Store vs machine: decision rule
- `createStore`: context, transitions, `can`, `trigger`, `send`
- Effects, emitted events, `enq.trigger`
- Reading state: `get`, `getSnapshot`, `subscribe`, `select`
- Reusable logic: `createStoreLogic`, `createStoreConfig`
- Schemas and TypeScript typing
- Immer
- Atoms: `createAtom`, computed, reducer, async, source, configs
- Extensions: `.with()`, undo/redo, reset, persist, validateSchemas, ordering, custom extensions
- Inspection
- `fromStore`: stores as XState actors
- Upgrading a store to a state machine
- Framework adapters (React, Preact, Vue, Svelte, Solid, Angular)
- Testing
- Pitfalls / Do and Don't
- Migration v2 → v3 → v4 and the stale API table
- 5.0.0-alpha (preview)
- Comparisons

## Install and package map

```bash
bun add @xstate/store                # core only (vanilla TS, Node, workers)
bun add @xstate/store-react          # React 18/19 (re-exports all of @xstate/store root)
bun add @xstate/store @xstate/store-react   # add core explicitly when you import subpaths
```

| Package | Version | Peer | Exports beyond the re-exported core |
| --- | --- | --- | --- |
| `@xstate/store` | 4.3.0 | `xstate ^5` **optional** (only needed for `fromStore`) | root + subpaths `./undo`, `./reset`, `./persist`, `./validate` |
| `@xstate/store-react` | 2.1.0 | `react ^18 \|\| ^19` | `useSelector`, `useStore`, `useAtom`, `useAtomState`, `createStoreHook` |
| `@xstate/store-preact` | 2.0.0 | `preact ^10` | `useSelector`, `useStore`, `useAtom`, `useAtomState` |
| `@xstate/store-vue` | 2.0.0 | `vue ^2.7 \|\| ^3` (uses `vue-demi`) | `useSelector`, `useStore`, `useAtom`, `useAtomState` |
| `@xstate/store-solid` | 2.0.1 | `solid-js ^1.7` | `useSelector`, `useStore`, `useAtom`, `useAtomState` |
| `@xstate/store-svelte` | 2.0.0 | `svelte ^3 \|\| ^4 \|\| ^5` | `useSelector`, `useStore` |
| `@xstate/store-angular` | 2.0.0 | `@angular/core ^19` | `injectStore` only |

Facts that matter:

- Every adapter does `export * from '@xstate/store'`, so `createStore`, `createAtom`, `createStoreLogic`, `fromStore`, `shallowEqual`, and all types can come from the adapter package. Subpaths (`/undo`, `/persist`, `/reset`, `/validate`) are **not** re-exported. Import them from `@xstate/store/...` and list `@xstate/store` as a direct dependency. If you rely on the adapter's transitive copy, strict installers can fail to resolve it, or you can end up with two copies.
- The packages are ESM-only (`"type": "module"`, no CJS entry since v4).
- The docs require TypeScript ≥ 5.4. The types use `const` type parameters and `NoInfer`.
- The root has no `createStoreWithProducer`, no `@xstate/store/react`, and no `@xstate/store/solid`. All three were removed in v4.

Root exports (4.3.0): values `createStore`, `createStoreConfig`, `createStoreLogic`, `fromStore`, `shallowEqual`, `createAtom`, `createAtomConfig`, `createAsyncAtom`, `createSourceAtom`, `createReducerAtom`. Types include `Store`, `AnyStore`, `StoreConfig`, `StoreSnapshot`, `StoreContext`, `EventPayloadMap`, `ExtractEvents`, `EventFromStore`, `SnapshotFromStore`, `EnqueueObject`, `StoreEffectEnqueue`, `StoreEffect`, `TriggerObject`, `CanObject`, `StoreAssigner`, `Selector`, `Selection`, `Readable`, `Atom`, `ReadonlyAtom`, `BaseAtom`, `AnyAtom`, `ReducerAtom`, `AtomOptions`, `AtomConfig`, `SourceAtomConfig`, `AsyncAtomState`, `AsyncAtomOptions`, `StoreExtension`, `StoreLogicCreator`, `StoreFromStoreLogicCreator`, `InputFromStoreLogicCreator`, `StoreWithSelectors`, `StoreSelectorsConfig`, `ContextFromStoreConfig`, `EventFromStoreConfig`, `EmitsFromStoreConfig`, `StoreFromStoreConfig`, `StandardSchemaV1`, `StoreSchemas`, `InferSchemaOutput`, `InferSchemaPayloadMap`, `ResolveStoreContext`, `ResolveStoreEventPayloadMap`, `ResolveStoreEmittedPayloadMap`, `StoreInspectionEvent` (plus its aliases), `Observer`, `Subscription`, `Subscribable`, `EventObject`, `ActorRefLike`.

## Store vs machine: decision rule

A store is a **single-state** event reducer. It has one `context`, a flat `on` map, and synchronous transitions. A machine has finite states, so the same event can mean different things in different states. Ask: *do events need to be accepted or rejected based on a mode or phase?*

| Use `@xstate/store` when | Use an XState machine when |
| --- | --- |
| State is data (lists, forms, counters, selection, UI prefs) | Behavior depends on finite modes (idle/loading/success/error, wizard steps, auth phases) |
| Every event is valid in every situation, or a simple guard in the handler covers it | You need guarded transitions across states, nested or parallel states, or history |
| Effects are fire-and-forget (`enq.effect`) | You need cancellable invoked actors, delays (`after`), retries, timeouts, child actors, `onDone`/`onError` |
| You want a Zustand/Redux-size API with typed events | You need a visualized, testable model (graph paths, Stately tooling) |

Warning sign that a store has outgrown itself: the context grows `status: 'idle' | 'loading' | ...` fields, and every handler starts with `if (context.status !== ...) return;`. That is a hand-rolled state machine. Upgrade it (see "Upgrading a store to a state machine"). You can also keep the store logic and run it inside a machine system via `fromStore`.

## `createStore`: context, transitions, `can`, `trigger`, `send`

```ts
import { createStore } from '@xstate/store';

export const cartStore = createStore({
  context: { items: [] as { id: string; qty: number }[], coupon: null as string | null },
  on: {
    // The event type is inferred from the payload annotation on the 2nd parameter.
    added: (context, event: { id: string; qty?: number }) => ({
      ...context, // REQUIRED: the returned object REPLACES context (no merge since v3)
      items: [...context.items, { id: event.id, qty: event.qty ?? 1 }]
    }),
    removed: (context, event: { id: string }) => {
      if (!context.items.some((i) => i.id === event.id)) return; // "not allowed": no change, can() === false
      return { ...context, items: context.items.filter((i) => i.id !== event.id) };
    },
    cleared: (context) => ({ ...context, items: [] }) // no-payload event
  }
});

cartStore.trigger.added({ id: 'a' });          // typed, preferred
cartStore.send({ type: 'removed', id: 'a' });  // equivalent event-object form
cartStore.can.removed({ id: 'zzz' });          // false — runs the transition purely, no commit, no effects
```

Handler signature: `(context, event, enq) => Context | void`.

- Return a new context object to update. Returning the **same** object is allowed but notifies nobody (the snapshot is unchanged).
- Return `undefined` (bare `return;`) to mark the event as **not allowed**. Context stays as it is, and `store.can.x()` returns `false`. The handler still counts as allowed if it enqueued effects, emits, or triggers.
- Handlers must be synchronous. If a handler returns a Promise, the store throws `"Async transition unsupported here"`. Put async work in `enq.effect`.
- If a handler throws, nothing is committed and the error reaches the `send`/`trigger` caller.
- `store.trigger` is a concrete object built from the known event types: the keys of `schemas.events` when present, otherwise `Object.keys(on)`, plus events that extensions add. Calling an unknown name is a TypeScript error, and at runtime it is `undefined is not a function`. (In v3 it was a Proxy that sent anything.) It falls back to a Proxy only when you call `createStore(customLogic)` without `eventTypes`.
- `store.can.<event>(payload)` (≥ 4.0) is the read-only check for enabling or disabling buttons. If a validation error occurs, `can` returns `false` instead of throwing.
- `store.sessionId` is a random id. `store.getInitialSnapshot()` returns the initial snapshot.

Snapshot shape: `{ status: 'active', context, output: undefined, error: undefined }`. Extensions add fields: undo adds `events`/`undoStack` or `past`/`future`, and persist adds `_persist`. Stores have no start/stop lifecycle. They are active as soon as they are created.

## Effects, emitted events, `enq.trigger`

`enq` (the 3rd handler argument) queues work that runs **after** the new snapshot is committed:

```ts
import { createStore } from '@xstate/store';
import { z } from 'zod';

const todos = createStore({
  schemas: {
    emitted: {
      saved: z.object({ id: z.string() }),
      failed: z.object({ message: z.string() })
    }
  },
  context: { list: [] as { id: string; title: string }[], saving: false },
  on: {
    save: (context, event: { id: string; title: string }, enq) => {
      enq.effect(async ({ trigger, getSnapshot }) => {
        // effect args (≥ 4.2): trigger (typed), send (loose), getSnapshot (fresh state)
        try {
          await fetch('/api/todos', { method: 'POST', body: JSON.stringify(event) });
          trigger.saved({ id: event.id });
        } catch (e) {
          if (getSnapshot().context.saving) trigger.saveFailed({ message: String(e) });
        }
      });
      return { ...context, saving: true };
    },
    saved: (context, event: { id: string }, enq) => {
      enq.emit.saved({ id: event.id });
      return { ...context, saving: false };
    },
    saveFailed: (context, event: { message: string }, enq) => {
      enq.emit.failed({ message: event.message });
      return { ...context, saving: false };
    },
    addAndSave: (context, event: { id: string; title: string }, enq) => {
      enq.trigger.save(event); // queued in the SAME transition, processed breadth-first after this handler
      return { ...context, list: [...context.list, event] };
    }
  }
});

const sub = todos.on('saved', (e) => console.log('saved', e.id)); // typed by schemas.emitted
todos.on('*', (e) => console.log(e.type));                          // wildcard (≥ 3.16): union of emitted events
sub.unsubscribe();
```

Execution order of one `send`:

1. Run the handler, then any `enq.trigger` events in FIFO order, all inside one transition.
2. Commit the snapshot and notify subscribers once, synchronously.
3. Notify inspectors.
4. Run effects and emitted events in the order they were enqueued.

Rules and reasons:

- Call `enq.*` **synchronously** inside the handler. The effects list is consumed when the handler returns, so calling `enq` later (inside a `.then`) does nothing.
- After an `await`, the handler's `context` argument is stale. Read `getSnapshot()` from the effect argument instead (≥ 4.2). Use the effect's `trigger` rather than a module-level `store` reference. This also works with `createStoreLogic`, where no module store exists.
- `enq.trigger` (≥ 4.0) is for composing handlers. Do not call another handler function directly. Triggered events share the one commit and one notification.
- `store.transition(snapshot, event)` returns `[nextSnapshot, effects]` without committing. Emitted events show up as plain objects and effects as functions. Use it in tests.
- Emitted events are not stored in state. They are a notification channel for code outside the store, such as toasts, analytics, or bridging to other stores.

## Reading state: `get`, `getSnapshot`, `subscribe`, `select`

```ts
store.getSnapshot().context; // explicit snapshot read
store.get().context;         // same value; the store is a Readable<StoreSnapshot>
const sub = store.subscribe((snapshot) => render(snapshot.context)); // NOT called immediately
sub.unsubscribe();

import { shallowEqual } from '@xstate/store';
const itemCount = store.select((ctx) => ctx.items.length);              // Readable<number>, Object.is by default
const firstItem = store.select((ctx) => ctx.items[0], shallowEqual);    // custom equality
itemCount.get();
itemCount.subscribe((n) => console.log(n)); // fires only when the selected value changes
```

- `store.subscribe` takes a function, an `Observer` (`{ next, error, complete }`), or `(next, error, complete)`. It also supports `Symbol.observable`, so RxJS `from(store)` works.
- `store.select(selector, equalityFn?)` returns a lazy computed atom (`Selection<T>`). You can read it inside `createAtom(() => ...)` to derive across stores and atoms.

## Reusable logic: `createStoreLogic`, `createStoreConfig`

`createStoreLogic` (≥ 4.0) is the store equivalent of machine logic: an inert definition that you instantiate many times. It is the right tool for per-component stores, per-request stores during SSR, tests, and input-driven initial context.

```ts
import { createStoreLogic, type StoreFromStoreLogicCreator } from '@xstate/store';

export const counterLogic = createStoreLogic({
  context: (input: { initial: number }) => ({ count: input.initial }),
  selectors: {
    count: (ctx) => ctx.count,
    isEven: (ctx) => ctx.count % 2 === 0
  },
  on: { inc: (ctx, e: { by: number }) => ({ count: ctx.count + e.by }) }
});

const store = counterLogic.createStore({ initial: 2 }); // input required because the context fn requires it
store.selectors.isEven.get(); // true — selectors survive .with(...)
type CounterStore = StoreFromStoreLogicCreator<typeof counterLogic>;
```

`createStoreConfig(config)` (≥ 3.1) is an identity function. It lets you define and type a config separately and pass it to `createStore`, `useStore`, or `createStoreHook`. Prefer `createStoreLogic` for anything new, because it supports input and selectors.

## Schemas and TypeScript typing

Three ways to type a store, from least to most explicit:

1. **Inference.** Context comes from `context`. Events come from each handler's 2nd-parameter annotation. A handler without an event parameter becomes a no-payload event.
2. **Standard Schema** (≥ 4.0; Zod 3.24+/4, Valibot, ArkType, and other Standard Schema libraries). `schemas.context`, `schemas.events`, and `schemas.emitted` provide the types. Each event or emitted schema describes the **payload only** (not `type`). Use `z.object({})` for no payload. When `schemas.events` exists, `on` handlers are optional (a missing one is a no-op), and event types come from the schema keys. Schemas do **not** validate at runtime unless you add `validateSchemas()`. You can read them at runtime via `store.schemas` (≥ 4.1).
3. **Explicit generics.** `createStore<Context, Events, Emitted>({...})` accepts event **unions** (`{ type: 'a' } | { type: 'b'; n: number }`). The other overload takes payload maps (`createStore<Ctx, { inc: { by: number } }, { increased: { by: number } }>`). Explicit generics are the only way to type emitted events without a schema library, now that `emits` is gone.

Utility types:

```ts
import type { EventFromStore, SnapshotFromStore, Store, AnyStore } from '@xstate/store';
type CartEvent = EventFromStore<typeof cartStore>;      // { type: 'added'; id: string; qty?: number } | ...
type CartSnapshot = SnapshotFromStore<typeof cartStore>;
function useCartLike(store: typeof cartStore) {}          // prefer typeof over hand-writing Store<...>
// Store<TContext, TEventPayloadMap, TEmittedEventUnion> — 2nd param is a PAYLOAD MAP, 3rd an EVENT UNION
```

## Immer

`createStoreWithProducer` was removed in 4.0. Call `produce` inside the handler:

```ts
import { produce } from 'immer';

on: {
  toggled: (ctx, e: { id: string }) => {
    if (!ctx.items.some((i) => i.id === e.id)) return; // decide "not allowed" BEFORE produce
    return produce(ctx, (draft) => {
      const item = draft.items.find((i) => i.id === e.id)!;
      item.done = !item.done;
    });
  }
}
```

`produce` always returns a value, so put the `return;` (not-allowed) check before calling it. To make a producer itself yield `undefined`, return Immer's `nothing`.

## Atoms

Atoms are a signal graph (based on alien-signals) for free-form state. Stores are themselves `Readable`s inside this graph.

```ts
import { createAtom, createReducerAtom, createAsyncAtom, createSourceAtom, createAtomConfig } from '@xstate/store';

const count = createAtom(0);                       // Atom<number>: get / set / subscribe
count.set(1);
count.set((prev) => prev + 1);

const doubled = createAtom(() => count.get() * 2); // ReadonlyAtom — computed, lazy, cached, no .set
const total = createAtom<number>((prev) => count.get() + (prev ?? 0)); // previous value as 1st arg (type it)
const cartTotal = createAtom(() => cartStore.get().context.items.length + count.get()); // read stores too

const counter = createReducerAtom(0, (state, ev: { type: 'inc' } | { type: 'dec' }) =>
  ev.type === 'inc' ? state + 1 : state - 1
);                                                  // ≥ 4.0: { get, subscribe, send }
counter.send({ type: 'inc' });

const userId = createAtom('u1');
const user = createAsyncAtom(async ({ signal }) => {
  const id = userId.get();                          // read deps BEFORE the first await (tracked synchronously)
  const res = await fetch(`/api/users/${id}`, { signal });
  return (await res.json()) as { name: string };
});                                                 // AsyncAtomState: {status:'pending'} | {status:'done',data} | {status:'error',error}

const media = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = createSourceAtom({                   // ≥ 4.3: read-only external source
  getSnapshot: () => media.matches,
  subscribe: (notify) => {
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify); // or return { unsubscribe }
  }
});

const draftConfig = createAtomConfig((input: { text: string }) => input.text); // ≥ 4.0: inert, per-instance
const draft = draftConfig.createAtom({ text: '' });
```

Semantics you need to know:

- `subscribe` does **not** emit the current value. Call `.get()` first.
- Options: `{ compare }` (default `Object.is`) on `createAtom`, `createAsyncAtom`, `createSourceAtom`, `createReducerAtom`, and `createAtomConfig`.
- If you pass a function, the atom becomes computed. `createAtom(fn)` never stores `fn` as a value, and `atom.set(fn)` is an updater. To store a function, wrap it: `createAtom({ handler })`.
- Async atoms run lazily on first read or subscribe. They recompute when a dependency they read synchronously changes. The previous run's `signal` is aborted, and stale results are ignored. Dependencies read after an `await` are **not** tracked.
- Source atoms share one external listener across all direct and derived subscribers. The listener is attached on the first live subscriber and released synchronously when the last one leaves. A plain `.get()` reads `getSnapshot` without subscribing. That makes them SSR-safe as long as `getSnapshot` works on the server.
- Derived atoms are read-only. When several values must change together under rules, use a store transition instead of several `set` calls.

## Extensions

`store.with(extension)` (≥ 3.14) wraps the store's **logic** and returns a **new store instance** whose state starts fresh from the wrapped logic. The original store is untouched and independent. Chain `.with()` at creation time and export only the final store.

### Undo/redo — `@xstate/store/undo` (≥ 3.8; `.with` form required in v4)

```ts
import { undoRedo } from '@xstate/store/undo';

const editor = createStore({
  context: { shapes: [] as string[], viewport: { x: 0, y: 0 } },
  on: {
    shapeAdded: (ctx, e: { shape: string; batch?: string }) => ({ ...ctx, shapes: [...ctx.shapes, e.shape] }),
    panned: (ctx, e: { x: number; y: number }) => ({ ...ctx, viewport: e })
  }
}).with(
  undoRedo({
    getTransactionId: (event) => ('batch' in event ? (event.batch as string | undefined) : undefined), // group into one undo step
    skipEvent: (event) => event.type === 'panned'                                // not recorded in history
  })
);
editor.trigger.undo();
editor.trigger.redo();
```

- `strategy: 'event'` (default) stores the event log. Undo replays the remaining events from `getInitialSnapshot()`. Replay drops effects and emits, so replayed handlers must be pure. Redo re-applies events and **does** run their effects. Options: `getTransactionId(event, snapshot)`, `skipEvent(event, snapshot)`.
- `strategy: 'snapshot'` (≥ 3.13) stores past and future snapshots, with no replay. Options: `historyLimit` (default `Infinity`), `compare(past, current)` to skip duplicates, and `restore({ current, next, direction }, enq)` (≥ 4.2.2), which can keep live fields such as the viewport and can emit or trigger. Snapshot strategy keeps memory bounded with `historyLimit`.
- Transaction ids are compared with `===`. **Return `undefined` for "no transaction", not `null`.** Consecutive `null` ids form one group and are undone together. This follows from the source. A docs example uses `?? null`, which causes this bug.
- In development, the extension throws if your store already declares `undo` or `redo` events.

### Reset — `@xstate/store/reset` (≥ 3.17)

```ts
import { reset } from '@xstate/store/reset';
const session = createStore({
  context: { draft: '', user: null as string | null },
  on: { typed: (c, e: { text: string }) => ({ ...c, draft: e.text }) }
}).with(reset({ to: (initial, current) => ({ ...initial, user: current.user }) })); // `to` is optional (full reset)
session.trigger.reset();
```

It adds the `reset` event, which runs no effects. It throws in development if `reset` is already an event name.

### Persist — `@xstate/store/persist` (≥ 3.17; event strategy ≥ 3.17)

```ts
import {
  persist, createJSONStorage, rehydrateStore, clearStorage, flushStorage, isHydrated,
  createBroadcastStorage, subscribeToBroadcastStorage
} from '@xstate/store/persist';

const prefs = createStore({
  context: { theme: 'light' as 'light' | 'dark', recent: [] as string[], hover: null as string | null },
  on: {
    themeSet: (c, e: { theme: 'light' | 'dark' }) => ({ ...c, theme: e.theme }),
    hovered: (c, e: { id: string | null }) => ({ ...c, hover: e.id })
  }
}).with(
  persist({
    name: 'prefs',                                     // storage key (required)
    version: 2,
    pick: (c) => ({ theme: c.theme, recent: c.recent }), // never persist transient fields
    filter: (event) => event.type !== 'hovered',        // skip writes for noisy events
    migrate: (old, fromVersion) => (fromVersion === 1 ? { ...old, recent: [] } : old),
    throttle: 500,
    onError: (err) => console.error(err)
  })
);
window.addEventListener('beforeunload', () => void flushStorage(prefs));
```

- Default storage is `createJSONStorage(() => localStorage)`. On the server, or when storage access throws, this becomes a no-op storage, so the module is SSR-safe. Write errors such as quota errors are swallowed.
- **Sync storage** hydrates inside `getInitialSnapshot`, so the store is created already hydrated. **Async storage** (AsyncStorage, IndexedDB wrappers) cannot hydrate synchronously. Pass `skipHydration: true` and `await rehydrateStore(store)`. Until then, `isHydrated(store)` is `false` and no writes happen.
- Snapshot strategy (default) stores `{ context: pick(context), version }`. When rehydrating, it does a shallow `merge(persisted, current)` (customizable). Options: `pick`, `filter`, `migrate(context, version)`, `merge`, `serialize`, `deserialize`.
- `strategy: 'event'` stores the event log and replays it on hydration. `maxEvents` saves a context checkpoint and drops older events. Options: `maxEvents`, `migrate(events, version)`, `serialize`, `deserialize` (no `pick` and no `filter`). Every event committed after hydration is logged, including no-op events. Replay drops effects, so handlers must be deterministic.
- `clearStorage(store)` removes the data but keeps the current context. `flushStorage(store)` forces throttled writes and waits for queued async writes. Both may return a Promise with async storage (≥ 4.0).
- Cross-tab sync (≥ 4.0): `persist({ name, storage: createBroadcastStorage(createJSONStorage(() => localStorage), { channel? }) })`, then `const stop = subscribeToBroadcastStorage(store)`. Other tabs rehydrate when one tab writes.
- The extension reserves the internal event `__persist.rehydrate`. As of 4.3.0, async writes complete in order, and only committed updates are persisted. `store.can` and `store.transition` do not write.

### Schema validation — `@xstate/store/validate` (≥ 4.0)

```ts
import { validateSchemas, StoreValidationError } from '@xstate/store/validate';

const store = createStore({
  schemas: { context: z.object({ count: z.number().int().min(0) }), events: { inc: z.object({ by: z.number() }) } },
  context: { count: 0 },
  on: { inc: (c, e) => ({ count: c.count + e.by }) }
}).with(validateSchemas({ unknownEvents: 'throw', unknownEmitted: 'throw' })); // all checks default on

try { store.trigger.inc({ by: -5 }); }
catch (err) { if (err instanceof StoreValidationError) console.log(err.reason, err.eventType, err.issues); }
```

- It validates the initial context, each incoming event payload (before the transition), the context after the transition, and emitted events (before effects run). Options: `context`, `events`, and `emitted` (each boolean, default `true`), plus `unknownEvents` and `unknownEmitted` (`'throw' | 'ignore'`, default `'throw'`).
- `reason` is one of `'invalidContext' | 'invalidEvent' | 'invalidEmitted' | 'unknownEvent' | 'unknownEmitted' | 'asyncValidationUnsupported'`. Async schemas, such as Zod async refinements, throw `asyncValidationUnsupported`.
- Event types added by other extensions (`reset`, `undo`, `redo`) count as known even though they have no schema. Without any schemas, it warns in development and does nothing.
- It is a dev-time safety net, and it has a per-event cost. Gate it behind an environment check if hot paths matter.

### Extension ordering (derived from source; not covered by upstream tests)

Each `.with()` wraps the previous logic, so the **last** `.with()` is outermost. Recommended order:

```ts
createStore(config)
  .with(validateSchemas()) // innermost: validates app events only
  .with(reset())           // before undoRedo → a reset becomes an undoable history entry
  .with(undoRedo())
  .with(persist({ name: 'doc' })); // outermost
```

Why persist goes last: event-strategy undo and `reset` call the wrapped logic's `getInitialSnapshot()`. When persist is inner, that call goes through persist, which re-reads storage. Undo would then replay from the persisted context, and reset would "reset" to the stored data. Also, persist's internal `__persist.rehydrate` event is not added to `eventTypes`. With `validateSchemas()` outside persist and `schemas.events` declared, `rehydrateStore()` and broadcast sync throw `unknownEvent`. Keep the validator inside persist, or set `unknownEvents: 'ignore'`.

### Writing a custom extension

```ts
import type { StoreExtension, StoreContext, EventPayloadMap, EventObject } from '@xstate/store';

export function logTransitions<C extends StoreContext, E extends EventPayloadMap, Em extends EventObject>(
  log: (type: string, context: C) => void
): StoreExtension<C, E, {}, Em> {           // 3rd param: payload map of NEW events ({} = none)
  return (logic) => ({
    ...logic,                                // keep eventTypes / schemas so trigger stays concrete
    transition: (snapshot, event) => {
      const result = logic.transition(snapshot, event); // keep the tuple (it carries the allowed flag for can())
      log(event.type, result[0].context);
      return result;
    }
  });
}
```

Transitions must stay pure, because `can()` and `transition()` call them without committing. Do side effects by appending effect functions to `result[1]`, as persist does. To add events, declare them in the 3rd type parameter and append them to `eventTypes`.

## Inspection

```ts
import { createBrowserInspector } from '@statelyai/inspect';
const inspector = createBrowserInspector();
const sub = store.inspect(inspector.inspect);   // pass the observer (.inspect), not the inspector object
store.inspect((ev) => {
  // ev.type === '@xstate.transition'; ev.event; ev.snapshot; ev.actorRef === store; ev.rootId === store.sessionId
});
sub.unsubscribe();
```

- In v4 there is one event type, `@xstate.transition`. On subscribe, the inspector immediately receives the current snapshot with `event: { type: '@xstate.init' }`. Events queued with `enq.trigger` are folded into the outer event's single transition.
- React only (≥ 2.1.0): `useStore(definition, { inspect })`, or `useStore(logic, input, { inspect })`. The subscription follows the component lifecycle.
- The docs show `store.inspect(inspector)`. The source test uses `inspector.inspect`, and that is the observer that works. Whether a given `@statelyai/inspect` version renders store transitions well was not verified.

## `fromStore`: stores as XState actors

Use `fromStore` to run store logic as actor logic inside XState: spawn or invoke it from machines, or use `createActor` with system-wide inspection and persistence. It needs `xstate` installed (an optional peer).

```ts
import { fromStore } from '@xstate/store';
import { createActor, setup } from 'xstate';
import { z } from 'zod';

const counterLogic = fromStore({
  context: (input: { initial: number }) => ({ count: input.initial }), // or a plain object
  schemas: { emitted: { changed: z.object({ count: z.number() }) } },
  on: {
    inc: (ctx, e: { by: number }, enq) => {
      enq.emit.changed({ count: ctx.count + e.by });
      return { count: ctx.count + e.by };
    }
  }
});

const actor = createActor(counterLogic, { input: { initial: 1 } });
actor.on('changed', (e) => console.log(e.count)); // emitted → actor.on
actor.subscribe((s) => console.log(s.context));
actor.start();                                     // actors (unlike stores) must be started
actor.send({ type: 'inc', by: 2 });

const parent = setup({ actors: { counter: counterLogic } }).createMachine({
  invoke: { id: 'counter', src: 'counter', input: { initial: 0 } }
});
```

- It has the same handler, `enq.emit`, `enq.effect`, and `enq.trigger` semantics. Effects receive `{ send, trigger, getSnapshot }` bound to `actorScope.self`.
- It supports `getPersistedSnapshot` and `restoreSnapshot`, so `actor.getPersistedSnapshot()` and `createActor(logic, { snapshot })` work.
- It does **not** support `selectors`, `.with()` extensions, or `store.trigger`. Use `actor.send({ type, ...payload })`.
- It accepts `schemas` for typing, both payload-schema and context-schema overloads.

## Upgrading a store to a state machine

The mapping is mechanical:

| Store | Machine (xstate ≥ 5) |
| --- | --- |
| `context` | `context` (or `context: ({ input }) => ...`) |
| `on.evt: (ctx, e) => newCtx` | `on: { evt: { actions: assign(({ context, event }) => partialCtx) } }` (assign merges partials) |
| `return;` (not allowed) | `guard` on the transition, or the event is simply not handled in that state |
| `enq.emit.x(p)` | `emit({ type: 'x', ...p })` action |
| `enq.effect(fn)` | a named action, or an invoked/spawned actor for async work (cancellable) |
| `enq.trigger.y()` | `raise({ type: 'y' })` |
| `status` field in context | real finite states |

```ts
// Before: store with a hand-rolled status field
const fetchStore = createStore({
  context: { status: 'idle' as 'idle' | 'loading' | 'done' | 'error', data: null as string | null },
  on: {
    load: (ctx, _e, enq) => {
      if (ctx.status === 'loading') return;
      enq.effect(async ({ trigger }) => {
        try { trigger.loaded({ data: await (await fetch('/api')).text() }); }
        catch { trigger.failed(); }
      });
      return { ...ctx, status: 'loading' };
    },
    loaded: (ctx, e: { data: string }) => ({ ...ctx, status: 'done', data: e.data }),
    failed: (ctx) => ({ ...ctx, status: 'error' })
  }
});

// After: machine — the status becomes finite states, the effect becomes an invoked (cancellable) actor
import { setup, assign, fromPromise } from 'xstate';

const fetchMachine = setup({
  types: { context: {} as { data: string | null }, events: {} as { type: 'load' } },
  actors: { loadData: fromPromise<string>(async ({ signal }) => (await fetch('/api', { signal })).text()) }
}).createMachine({
  context: { data: null },
  initial: 'idle',
  states: {
    idle: { on: { load: 'loading' } },
    loading: {
      invoke: {
        src: 'loadData',
        onDone: { target: 'done', actions: assign({ data: ({ event }) => event.output }) },
        onError: 'error'
      }
    },
    done: { on: { load: 'loading' } },
    error: { on: { load: 'loading' } }
  }
});
```

An intermediate step is to keep the store unchanged and run it with `fromStore` inside a machine. Then migrate one event at a time.

## Framework adapters

The shared shape: `useSelector(readable, selector?, compare?)` works with stores, `store.select(...)` selections, and atoms, because all of them are `Readable`. `useStore(configOrLogic, input?)` creates a store instance. `useAtom` and `useAtomState` are covered below. `compare` defaults to `===`.

### React — `@xstate/store-react` 2.1.0

```tsx
import { createStoreLogic, useStore, useSelector, useAtom, useAtomState, createAtom, createAtomConfig, createStoreHook, shallowEqual } from '@xstate/store-react';

const counterLogic = createStoreLogic({
  context: (input: { initial: number }) => ({ count: input.initial, tags: [] as string[] }),
  on: { inc: (c) => ({ ...c, count: c.count + 1 }) }
});

function Counter({ initial }: { initial: number }) {
  const store = useStore(counterLogic, { initial });   // created ONCE per mount; later `initial` changes are ignored
  const count = useSelector(store, (s) => s.context.count);
  const view = useSelector(store, (s) => ({ count: s.context.count, n: s.context.tags.length }), shallowEqual);
  return <button onClick={() => store.trigger.inc()}>{count} / {view.n}</button>;
}

const themeAtom = createAtom<'light' | 'dark'>('light');
const draftConfig = createAtomConfig((i: { text: string }) => i.text); // module level; instantiated per component
function Theme() {
  const theme = useAtom(themeAtom);                     // or useAtom(atom, selector, compare)
  const [draft, draftAtom] = useAtomState(draftConfig, { text: '' }); // local atom, stable for the mount
  return <input value={draft} onChange={(e) => draftAtom.set(e.target.value)} data-theme={theme} />;
}

const useCart = createStoreHook({ context: { items: 0 }, on: { add: (c) => ({ items: c.items + 1 }) } });
function CartBadge() {
  const [items, cartStore] = useCart((s) => s.context.items); // ONE module-level store shared by all callers (≥ 3.9.1)
  return <span onClick={() => cartStore.trigger.add()}>{items}</span>;
}
```

- `useSelector` uses `useSyncExternalStore`. A selector that builds a new object or array on each call **must** be given `shallowEqual` or another compare function. Otherwise every snapshot read returns a new value, which causes extra re-renders or a "getSnapshot should be cached" loop.
- `useSelector(store)` without a selector returns the whole snapshot. In 2.1.0 the `compare` argument is honored in that case too.
- `useStore(config | logic, input?, { inspect }?)`. The store is kept in a ref and never stopped or recreated. To reset it, change the component `key`, or apply the `reset()` extension.
- `createStoreHook(config)` builds a module singleton. Do not use it for per-instance state, and avoid it on SSR servers, where it is shared across requests.
- SSR: a store created at module level is shared by every request on the server. For per-request state, create the store in a component with `useStore` and pass it down through React context.

### Preact — `@xstate/store-preact` 2.0.0

The API matches React (`useSelector`, `useStore`, `useAtom`, `useAtomState`), with a bundled `useSyncExternalStore` shim. It has **no** `createStoreHook`, and `useStore` takes no `inspect` option.

### Vue — `@xstate/store-vue` 2.0.0 (Vue 2.7 / 3 through vue-demi)

```vue
<script setup lang="ts">
import { useStore, useSelector, useAtom } from '@xstate/store-vue';
import { counterLogic, themeAtom } from './state';
const store = useStore(counterLogic, { initial: 0 });         // creates a store per setup() call
const count = useSelector(store, (s) => s.context.count);     // Readonly<Ref<number>>
const theme = useAtom(themeAtom);                             // Readonly<Ref<'light' | 'dark'>>
</script>
<template><button @click="store.trigger.inc()">{{ count }} {{ theme }}</button></template>
```

Returned values are readonly refs. Write through `store.trigger` or `atom.set`, never by assigning to the ref. The subscription is cleaned up with the watcher scope. `useAtomState(atomOrConfig, input?)` returns `[Readonly<Ref<T>>, atom]`.

### Svelte — `@xstate/store-svelte` 2.0.0

```svelte
<script lang="ts">
  import { useSelector, useStore } from '@xstate/store-svelte';
  import { counterLogic, themeAtom } from './state';
  const store = useStore(counterLogic, { initial: 0 });
  const count = useSelector(store, (s) => s.context.count); // a Svelte Readable — use $count
  const theme = useSelector(themeAtom);                     // atoms are Readable; there is no useAtom here
</script>
<button on:click={() => store.trigger.inc()}>{$count} {$theme}</button>
```

There is only `useSelector` and `useStore`. The result is a standard `svelte/store` readable, which works with `$` auto-subscription in Svelte 3, 4, and 5.

### Solid — `@xstate/store-solid` 2.0.1

```tsx
import { useSelector, useStore, useAtom } from '@xstate/store-solid';
function Counter() {
  const store = useStore(counterLogic, { initial: 0 });
  const count = useSelector(store, (s) => s.context.count); // Accessor<number> — call it: count()
  const theme = useAtom(themeAtom);                         // Accessor
  return <button onClick={() => store.trigger.inc()}>{count()} {theme()}</button>;
}
```

The subscription lives inside `createEffect` with `onCleanup`. In 2.0.1, the value is refreshed when the subscription starts. `useAtomState` returns `[Accessor<T>, atom]`.

### Angular — `@xstate/store-angular` 2.0.0 (Angular ≥ 19, uses `linkedSignal`)

```ts
import { Component } from '@angular/core';
import { createStore, injectStore } from '@xstate/store-angular';

export const counterStore = createStore({ context: { count: 0 }, on: { inc: (c) => ({ count: c.count + 1 }) } });

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="store.trigger.inc()">{{ count() }}</button>`
})
export class CounterComponent {
  store = counterStore;
  count = injectStore(counterStore, (s) => s.context.count); // readonly Signal; injection context required
  snapshot = injectStore(counterStore);                      // whole snapshot
}
```

`injectStore(readable, selector?, compare?)` must run in an injection context: a field initializer, the constructor, or `runInInjectionContext`. It unsubscribes via `DestroyRef`. It is the **only** export. The 2.0.0 CHANGELOG mentions `useStore(...)` because the changeset is shared across adapters, but the Angular package does not export it. Create per-component stores with `counterLogic.createStore(input)` in a field initializer. Atoms work with `injectStore(atom)`.

## Testing

```ts
import { expect, it } from 'vitest';
import { createStoreLogic } from '@xstate/store';

const cartLogic = createStoreLogic({
  context: { items: [] as { id: string }[] },
  on: {
    added: (c, e: { id: string }) => ({ ...c, items: [...c.items, { id: e.id }] }),
    removed: (c, e: { id: string }) =>
      c.items.some((i) => i.id === e.id) ? { ...c, items: c.items.filter((i) => i.id !== e.id) } : undefined
  }
});

it('rejects removing a missing item and emits nothing', () => {
  const store = cartLogic.createStore();               // a fresh instance per test (avoid module singletons)
  expect(store.can.removed({ id: 'x' })).toBe(false);
  const [next, effects] = store.transition(store.getInitialSnapshot(), { type: 'added', id: 'a' });
  expect(next.context.items).toHaveLength(1);
  expect(effects).toEqual([]);                         // emitted events appear as plain objects, effects as functions
  expect(store.getSnapshot().context.items).toHaveLength(0); // transition() did not commit
});
```

- To test `store.on` listeners, send events and assert on a spy. Emits are synchronous.
- To test async effects, have the effect call `trigger`, then await a condition. With `fromStore`, you can use xstate's `waitFor(actor, predicate)`.
- When a store uses persist, inject storage with `persist({ name, storage: fakeStorage })`. Do not rely on jsdom `localStorage` leaking between tests.

## Pitfalls / Do and Don't

| Don't | Do | Why |
| --- | --- | --- |
| `inc: (c) => ({ count: c.count + 1 })` when context has other keys | `({ ...c, count: c.count + 1 })` | The return value replaces context. Since v3 it is not merged, so missing keys are lost. |
| `inc: { count: (c) => c.count + 1 }` (object assigner) | Use a function handler | Object assigners were removed in v3, and at runtime they throw "not a function". The current overview docs still show this form in the `fromStore` and store-to-machine sections. |
| `async` handler / `await` in the handler | `enq.effect(async ({ trigger, getSnapshot }) => ...)` | The store throws "Async transition unsupported here". |
| `setTimeout(() => enq.emit.x())` | Emit synchronously, or `trigger` an event from the effect | `enq` is consumed when the handler returns. |
| Reading the handler's `context` after `await` in an effect | `getSnapshot().context` from the effect argument | The handler's context is a stale closure. |
| `onClick={store.trigger.inc}` | `onClick={() => store.trigger.inc()}` | The DOM or React event object gets spread into the event payload. |
| `useSelector(store, s => ({ a: s.context.a, b: s.context.b }))` | add `shallowEqual` or select primitives | A new object every time defeats `===`. |
| `const s2 = store.with(undoRedo())` and keep using `store` | Export only the extended store | `.with()` returns a separate store with its own state. |
| Importing `@xstate/store/undo` with only `@xstate/store-react` installed | `bun add @xstate/store` explicitly | Adapters do not re-export subpaths, and a transitive dependency may not resolve. |
| Module-level store in SSR or React Server Components | `createStoreLogic` + `useStore` per request or component | Module state leaks across users on a long-lived server. |
| `getTransactionId: (e) => e.batch ?? null` | `?? undefined` | `null` ids group together into one big undo step. |
| Persist applied before undo or reset | Apply `persist` last | Inner persist re-reads storage on undo replay and on reset. |
| Async Zod refinements with `validateSchemas` | Sync schemas only | They throw `asyncValidationUnsupported`. |
| `createAtom(myCallback)` to store a function | `createAtom({ fn: myCallback })` | A function argument means "computed getter". |
| Growing `status` flags plus guards in every handler | Move to an XState machine | Finite states make the impossible transitions unrepresentable. |

## Migration v2 → v3 → v4 and the stale API table

Version timeline: 2.x (context and transitions as two arguments) → 3.0 (single config, full-replacement handlers, `emits`, `trigger`, effects) → 3.1–3.17 (selectors, atoms, undo, `.with`, persist, reset, adapter packages in 3.15) → **4.0** (schemas, `createStoreLogic`, `can`, `enq.trigger`, removals) → 4.1 (`store.schemas`) → 4.2 (effect args) → 4.3 (`createSourceAtom`, persist fixes, optional `xstate` peer).

The separate adapter packages (`@xstate/store-react` 1.0 and the others) were introduced in **3.15.0**, which also deprecated `@xstate/store/react` and `@xstate/store/solid`. Store **4.0.0** deleted those subpaths and removed `react` and `solid-js` from the core peers. Adapters 2.x match store 4.x. The `examples/store-*` apps in the repo still pin store `^3.17.1` and store-react `^1.0.1`, so do not copy their versions.

| Stale (version) | Current (4.3) |
| --- | --- |
| `createStore({ count: 0 }, { inc: ... })` (v2; deprecated in 3, removed in 4) | `createStore({ context: { count: 0 }, on: { inc: ... } })` |
| `fromStore(context, transitions)` (v2) | `fromStore({ context, on })` |
| `on: { inc: { count: (ctx) => ctx.count + 1 } }` partial or object assigners (v2) | `inc: (ctx) => ({ ...ctx, count: ctx.count + 1 })` |
| Partial context returned and merged (v2) | Return the full context. The return value replaces it. |
| `createStoreWithProducer(produce, ...)` (v2–v3) | `(ctx, e) => produce(ctx, (d) => { ... })` in `createStore` |
| `emits: { saved: (p: { id: string }) => { /* side effect */ } }` (v3) | `schemas: { emitted: { saved: z.object({ id: z.string() }) } }` or the 3rd generic. Move side effects into `store.on('saved', ...)`. |
| `import { useSelector } from '@xstate/store/react'` / `'/solid'` (≤ 3.x) | `from '@xstate/store-react'` / `'@xstate/store-solid'` |
| `createAtom((read) => read(a) * 2)` (3.4–3.17) | `createAtom(() => a.get() * 2)` |
| `createAtom((read, prev) => ...)` (3.12–3.17) | `createAtom((prev) => ...)` |
| `createStore(undoRedo({ context, on }, opts))` (3.8–3.17) | `createStore({ context, on }).with(undoRedo(opts))` |
| `store._snapshot` | `store.getSnapshot()` / `store.get()` |
| Inspection events `@xstate.actor` / `@xstate.event` / `@xstate.snapshot` | A single `@xstate.transition` with `{ event, snapshot }` |
| `store.trigger.anything()` (Proxy, v3) | Only known event names exist. Others are TS errors and runtime `undefined`. |
| `useStore(config)` only (store-react 1.x) | `useStore(config \| logic, input?, { inspect }?)` |
| `enq.effect(() => store.send(...))` closing over the module store | `enq.effect(({ trigger }) => trigger.x())` (≥ 4.2) |
| `clearStorage` / `flushStorage` assumed synchronous | They may return a Promise with async storage (4.0) |

Upgrade checklist for v3 → v4:

1. Replace `emits` with `schemas.emitted` (or generics).
2. Swap `@xstate/store/react` and `/solid` imports for the adapter packages.
3. Remove `createStoreWithProducer`.
4. Convert `undoRedo(config)` to `.with(undoRedo())`.
5. Rewrite `read(...)` in atoms as `.get()`.
6. Rename app events named `reset`, `undo`, or `redo`, which collide with extension events.
7. Update inspection consumers.
8. Make sure TypeScript is ≥ 5.4 and the bundler supports ESM-only packages.

## 5.0.0-alpha (preview)

npm `alpha` is `@xstate/store@5.0.0-alpha.6` (2026-10-08). Its published metadata shows the same subpath exports (`.`, `./undo`, `./reset`, `./persist`, `./validate`). The `xstate` peer moves to `^6.0.0-alpha.65` (still optional). It is the companion to the XState v6 alpha. Adapter alphas exist too: store-react `2.1.0-alpha.3`, and `2.0.1-alpha.*` for the others. API changes in the 5.x alpha were **not verified**, because the local source is the v4 `main` branch. Do not use it in production, and do not write code against it without reading its CHANGELOG.

## Comparisons

- **Zustand:** Zustand actions call `set` directly. A store routes every change through named, typed events, which you can also `can()`, `transition()`, inspect, undo, and emit from.
- **Redux Toolkit:** It has the same event→reducer idea without action creators, slices, or a provider. Effects are queued by transitions instead of living in middleware or thunks, and the ecosystem is far smaller.
- **Jotai:** Store atoms are live instances (`get`/`set`/`subscribe`) that work outside React. Jotai atoms are configs whose values live in a provider or store, and Jotai has deeper Suspense integration.
- **Pinia:** Pinia is Vue-idiomatic, with mutating actions and getters. XState Store is framework-neutral with immutable transitions, and it works in Vue through the adapter.
- **Recoil (archived):** Map atoms to `createAtom`, selectors to derived `createAtom(() => ...)`, and async selectors to `createAsyncAtom`.
