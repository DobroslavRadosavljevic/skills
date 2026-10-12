# XState with Vue, Svelte, Solid, vanilla JS, Node, and Angular

Reference for `@xstate/vue` 5.0.1, `@xstate/svelte` 5.0.0, `@xstate/solid` 2.0.0 (all on xstate 5.x), plus framework-free usage (DOM, Node) and Angular, which has no official adapter. Covers every export with signatures, lifecycle and cleanup, error behavior, SSR, version history, and pitfalls.

## Contents

- [Versions and peer dependencies](#versions-and-peer-dependencies)
- [Behavior comparison across adapters](#behavior-comparison-across-adapters)
- [Vue (@xstate/vue)](#vue-xstatevue)
- [Svelte (@xstate/svelte)](#svelte-xstatesvelte)
- [Solid (@xstate/solid)](#solid-xstatesolid)
- [Actor interop primitives (any framework)](#actor-interop-primitives-any-framework)
- [Vanilla JS / DOM](#vanilla-js--dom)
- [Node and server-side scripts](#node-and-server-side-scripts)
- [Angular (no official adapter)](#angular-no-official-adapter)
- [Stale APIs](#stale-apis)
- [Pitfalls](#pitfalls)
- [Docs vs source discrepancies](#docs-vs-source-discrepancies)

## Versions and peer dependencies

| Package | Version | Peer deps (npm metadata) | Exports (verified in `src/index.ts`) |
|---|---|---|---|
| `@xstate/vue` | 5.0.1 | `vue ^3.0.0`, `xstate ^5.32.5` | `useActor`, `useActorRef`, `useMachine`, `useSelector` |
| `@xstate/svelte` | 5.0.0 | `svelte ^3.24.1 \|\| ^4 \|\| ^5`, `xstate ^5.20.0` | `useActor`, `useActorRef`, `useMachine`, `useSelector` |
| `@xstate/solid` | 2.0.0 | `solid-js ^1.6.0`, `xstate ^5.20.0` | `useActor`, `useActorRef`, `useMachine`, `fromActorRef` |

```bash
bun add xstate @xstate/vue      # or @xstate/svelte / @xstate/solid
```

Recent majors carry **no API changes**. Vue 4.0.0/5.0.0, Svelte 4.0.0/5.0.0, and Solid 1.0.0/2.0.0 are major bumps caused by the xstate peer range moving (to 5.19.0, then 5.20.0). The real API breaks happened when each package first targeted xstate v5 (Vue 3.0.0, Svelte 3.0.0, Solid 0.2.0). Vue 5.0.1 only fixed its test config and raised the xstate peer.

`useMachine` is an alias of `useActor` in all three packages (JSDoc `@alias`, typed for machines only). Prefer `useActor`.

All `useActor` / `useActorRef` / `useMachine` signatures make `options.input` required at the type level when the logic declares `types.input` (Vue 3.1.3, Svelte 3.0.4, Solid 0.2.1).

## Behavior comparison across adapters

| | React 6.1 | Vue 5.0.1 | Svelte 5.0.0 | Solid 2.0.0 |
|---|---|---|---|---|
| Actor created | first render (`useState` init) | `setup()` | component init | component body |
| Actor started | `useEffect` | `onMounted` | **immediately** (`createActor(...).start()`) | `onMount` |
| Actor stopped | effect cleanup | `onBeforeUnmount` | `onDestroy` | `onCleanup` inside `onMount` |
| Started during SSR | no | no | **yes** | no |
| `useActor` snapshot | plain value, re-render per snapshot | `{ snapshot: ShallowRef }` | `{ snapshot: Readable store }` | `[snapshot]` = deep **Solid store** (fine-grained) |
| Selector | `useSelector` | `useSelector` → `Ref<T>` | `useSelector` → `Readable<T>` | none: `createMemo` over `fromActorRef` |
| `undefined` actor allowed | yes | yes (also `Ref<actor \| undefined>`) | **no** | yes (also accessor) |
| Third `observer` arg on `useActorRef` | yes | yes | no | no |
| Unhandled actor error | thrown in render → error boundary | `useActor`: rethrown async as a global error. `useSelector` only: swallowed | rethrown async as a global error | swallowed |
| Snapshot after error | n/a (throws) | last good snapshot | last good snapshot | last good snapshot |

Consequences that apply everywhere outside React:

- **Model failures inside the machine** (`onError` → `failed` state). Unhandled errors never appear in the reactive snapshot. The actor does not call `next` with the error snapshot; it calls `error` observers and clears them. To observe them, subscribe with an `error` handler before the error happens, or check `actorRef.getSnapshot().status === 'error'`.
- Options (`input`, `snapshot`, `inspect`, `systemId`) are read once at creation. Prop changes require events, or remounting the component (`:key` in Vue, `{#key}` in Svelte, `<Show keyed>` in Solid).
- Implementations go through `machine.provide({...})` before passing to the composable. Unlike React, none of these adapters re-syncs implementations later. The closures captured at setup time are what run, which is fine because Vue/Svelte/Solid component setup runs once.

## Vue (@xstate/vue)

### Signatures

```ts
function useActor<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic>
): { snapshot: Ref<SnapshotFrom<TLogic>>; send: Actor<TLogic>['send']; actorRef: Actor<TLogic> };

function useActorRef<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic>,
  observerOrListener?: Observer<SnapshotFrom<TLogic>> | ((snapshot: SnapshotFrom<TLogic>) => void)
): Actor<TLogic>;

function useSelector<TActor extends Pick<AnyActorRef, 'getSnapshot' | 'subscribe'> | undefined, T>(
  actor: TActor | Ref<TActor>,
  selector: (snapshot: /* snapshot of TActor, or undefined */) => T,
  compare?: (a: T, b: T) => boolean // default ===
): Ref<T>; // a shallowRef
```

Internals (from source):

- `useActorRef` calls `createActor` synchronously in `setup()`, subscribes the optional observer and calls `start()` in `onMounted`, and calls `stop()` + unsubscribe in `onBeforeUnmount`. It must run inside `setup()` / `<script setup>`. Outside a component instance the lifecycle hooks don't register, so the actor never starts.
- `useActor` = `useActorRef` + `useSelector(actorRef, s => s)`. `snapshot` is a `shallowRef` replaced on every emitted snapshot. It is not deeply reactive, and it doesn't need to be.
- `useSelector` reads the initial value via `getSnapshot()` immediately and uses `watch(actorRef, ..., { immediate: true })`. When you pass a `Ref` of an actor, it resubscribes whenever the ref changes. It updates the returned `shallowRef` only when `compare` says the value changed.
- Dev-only guard: passing an `ActorRef` to `useActor` throws ("expects actor logic ... Use the useSelector(actorRef, ...) hook instead").

### Idiomatic usage

```vue
<script setup lang="ts">
import { useActor } from '@xstate/vue';
import { toggleMachine } from './toggleMachine';

const { snapshot, send } = useActor(toggleMachine, { input: { initiallyOn: false } });
</script>

<template>
  <!-- top-level refs auto-unwrap in templates: `snapshot.value` here is the machine's state value -->
  <button @click="send({ type: 'toggle' })">
    {{ snapshot.matches('on') ? 'On' : 'Off' }} ({{ snapshot.context.count }})
  </button>
</template>
```

In `<script>`, the ref is not unwrapped: `snapshot.value.value` is the state value, and `snapshot.value.context` is the context. Mixing these up is the most common Vue bug with this package.

Fine-grained reads with `useActorRef` + `useSelector`:

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useActorRef, useSelector } from '@xstate/vue';
import { checkoutMachine } from './checkoutMachine';

const checkoutRef = useActorRef(checkoutMachine, { input: { cartId: '42' } });
const total = useSelector(checkoutRef, (s) => s.context.total);
const isPaying = useSelector(checkoutRef, (s) => s.matches('paying'));
const label = computed(() => (isPaying.value ? 'Paying…' : `Pay ${total.value}`));
</script>
```

Actor passed as a prop: wrap with `toRef` so a parent swapping the actor is tracked (`useSelector(props.actor, ...)` captures the first actor only):

```vue
<script setup lang="ts">
import { toRef } from 'vue';
import { useSelector } from '@xstate/vue';
import type { ActorRefFrom } from 'xstate';
import type { todoMachine } from './todoMachine';

const props = defineProps<{ todoRef: ActorRefFrom<typeof todoMachine> }>();
const title = useSelector(toRef(props, 'todoRef'), (s) => s.context.title);
</script>
```

Optional actor (spawned later):

```ts
const childRef = useSelector(parentRef, (s) => s.children.payment); // Ref<ActorRef | undefined>
const step = useSelector(childRef, (s) => s?.value);                // resubscribes when the child appears
```

Shared actor in a subtree, using `provide` / `inject` (no `createActorContext` equivalent exists in Vue):

```ts
// cartContext.ts
import type { InjectionKey } from 'vue';
import type { ActorRefFrom } from 'xstate';
import type { cartMachine } from './cartMachine';
export const CartKey: InjectionKey<ActorRefFrom<typeof cartMachine>> = Symbol('cart');

// Parent.vue <script setup>
const cartRef = useActorRef(cartMachine);
provide(CartKey, cartRef);

// Child.vue <script setup>
const cartRef = inject(CartKey)!;
const count = useSelector(cartRef, (s) => s.context.items.length);
```

Children run `setup` (and subscribe) before the parent's `onMounted` starts the actor. That is fine: subscribing before `start()` is allowed, and `start()` notifies observers with the initial snapshot.

Side effects from snapshots: pass an observer as the third argument (`useActorRef(machine, undefined, (s) => persist(s))`), or `watch(snapshot, ...)`. Emitted events: `onMounted(() => { const sub = actorRef.on('saved', h); onBeforeUnmount(sub.unsubscribe); })`.

### Vue SSR / Nuxt

- `setup()` runs on the server, so the actor is **created** there (context factory and initial `assign`s run), but `onMounted` never runs on the server, so it is **not started**: no invocations, timers, or custom actions. Keep the initial context deterministic, or hydration will mismatch.
- Module-level started actors in Nuxt are shared across requests. Create actors per component, or per request via `provide`.

### Vue version notes

- 3.0.0 (first xstate v5 release): `useMachine` returns `{ snapshot, send, actorRef }` (was `{ state, send, service }`). `useInterpret` and `useSpawn` removed in favor of `useActorRef`. `getSnapshot` parameter removed from composables. FSM removed.
- 3.1.0: `useSelector` accepts `undefined` actors. 3.1.2: works with `@xstate/store` stores. 3.1.3: required `input` typing.
- 4.x, 5.0.0: peer bumps only. 5.0.1: test config fix and xstate peer `^5.32.5`.
- Vue 2 is not supported. Use the vanilla pattern below.

## Svelte (@xstate/svelte)

### Signatures

```ts
function useActor<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic>
): { snapshot: Readable<SnapshotFrom<TLogic>>; send: (event: EventFromLogic<TLogic>) => void; actorRef: Actor<TLogic> };

function useActorRef<TLogic extends AnyActorLogic>(logic: TLogic, options?: ActorOptions<TLogic>): Actor<TLogic>;

function useSelector<TActor extends Pick<AnyActorRef, 'getSnapshot' | 'subscribe'>, T>(
  actor: TActor, // not optional: no undefined support
  selector: (snapshot: SnapshotFrom<TActor>) => T,
  compare?: (a: T, b: T) => boolean
): Readable<T>; // svelte/store readable
```

Internals (from source):

- `useActorRef` = `createActor(logic, options).start()` **immediately**, plus `onDestroy(() => actorRef.stop())`. Because `onDestroy` is used, it must be called during component initialization. In Svelte 5, lifecycle functions outside a component throw.
- `useActor` wraps the actor in a `readable` store seeded with `getSnapshot()`. It only calls `set` when the snapshot object identity changes. The store subscribes lazily (when something reads `$snapshot`) and unsubscribes when the last subscriber leaves; the actor keeps running regardless.
- `useSelector` returns a `readable` seeded with the selected initial value. On subscription it re-reads `getSnapshot()` so late subscribers are current, then updates only when `compare` reports a change.
- No dev guard against passing an `ActorRef` to `useActor`, and no observer argument.

### Idiomatic usage (Svelte 4 and Svelte 5 components)

```svelte
<script lang="ts">
  import { useActor, useSelector } from '@xstate/svelte';
  import { feedbackMachine } from './feedbackMachine';

  const { snapshot, send, actorRef } = useActor(feedbackMachine);
  const canSubmit = useSelector(actorRef, (s) => s.can({ type: 'submit' }));
</script>

{#if $snapshot.matches('closed')}
  <button on:click={() => send({ type: 'restart' })}>Give more feedback</button>
{:else}
  <textarea
    value={$snapshot.context.feedback}
    on:input={(e) => send({ type: 'feedback.update', value: e.currentTarget.value })}
  ></textarea>
  <button disabled={!$canSubmit} on:click={() => send({ type: 'submit' })}>Submit</button>
{/if}
```

Svelte 5 / runes compatibility:

- The returned values are ordinary Svelte stores, and `$store` auto-subscription still works inside runes-mode components. Use `onclick={...}` instead of `on:click` in runes mode; the stores themselves are unchanged.
- In `.svelte.ts` / `.svelte.js` modules (no `$store` syntax), convert with `fromStore` from `svelte/store` (Svelte 5): `const snap = fromStore(snapshot); snap.current.value`. Alternatively, skip the adapter: hold `let snap = $state(actor.getSnapshot())` and update it in `actor.subscribe` inside an `$effect` that returns the unsubscribe.
- `$derived($snapshot.context.items.length)` works in components for derived values.

Shared actor: `setContext(key, actorRef)` in the parent (actor from `useActorRef`) and `getContext(key)` + `useSelector(...)` in children. For app-wide state, a module-level `createActor(machine)` with `.start()` in the browser only (see SSR).

Changing props: send events from `$:` statements (Svelte 4) or `$effect` (Svelte 5), or remount with `{#key id}...{/key}`.

### Svelte SSR / SvelteKit

- Because `useActorRef` starts immediately, **the actor starts during SSR**. Entry actions, invoked promises/callbacks, and spawned children run on the server, and `onDestroy` stops the actor when server rendering finishes. Delayed transitions scheduled during SSR are cancelled by that stop.
- Keep machines that perform side effects from starting on the server. Gate the component with `browser` from `$app/environment`, render it only after mount, or make the initial state side-effect-free and move I/O behind an event sent from `onMount`.
- Module-level started actors in SvelteKit are shared across requests. Use per-component actors or context.

### Svelte version notes

- 3.0.0 (xstate v5): `useMachine` returns `{ snapshot, send, actorRef }` (was `{ state, send, service }`), `useInterpret` → `useActorRef`.
- 3.0.1: `useMachine` marked as alias, not deprecated. 3.0.3: `@xstate/store` compatible. 3.0.4: required `input` typing.
- 4.0.1: Svelte 5 added to the peer range. 4.x / 5.0.0: otherwise peer bumps only.

## Solid (@xstate/solid)

### Signatures

```ts
function useActor<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic>
): [SnapshotFrom<TLogic>, (event: EventFromLogic<TLogic>) => void, ActorRefFrom<TLogic>];

function useActorRef<TLogic extends AnyActorLogic>(logic: TLogic, options?: ActorOptions<TLogic>): ActorRefFrom<TLogic>;

function fromActorRef<TActor extends AnyActorRef | undefined>(
  actorRef: Accessor<TActor> | TActor
): Accessor<SnapshotFrom<NonNullable<TActor>> | (undefined extends TActor ? undefined : never)>;
```

There is no `useSelector` in `@xstate/solid`. Derive with `createMemo` over the reactive snapshot.

Internals (from source):

- `useActorRef`: `createActor` synchronously, `start()` in `onMount`, `stop()` via `onCleanup` registered inside `onMount`.
- `fromActorRef`: wraps the actor (or an accessor returning an actor) in `createMemo`, keeps the snapshot in a Solid **store** built by an internal `createImmutable` (deep clone + structural diff on each snapshot), subscribes in `createEffect`, and unsubscribes via `onCleanup`. When the accessor returns a different actor, it resubscribes and resets the store to the new actor's snapshot.
- `useActor` returns `fromActorRef(actorRef)()`, i.e. **the store object itself**, not an accessor. Its properties are reactive individually: reading `snapshot.context.count` in JSX re-runs only that binding when `count` changes.
- Plain objects and arrays are cloned and diffed. Class instances (actor refs, `Date`, `Map`, custom classes) are not wrappable. They are copied by reference and only trigger updates when replaced. Spawned child refs in context therefore remain the real actor refs.
- Methods (`matches`, `hasTag`, `can`) are called on the store proxy, so `snapshot.matches('x')` inside JSX or a memo is tracked.

### Idiomatic usage

```tsx
import { createMemo, Match, Switch, For } from 'solid-js';
import { useActor, fromActorRef } from '@xstate/solid';
import type { ActorRefFrom } from 'xstate';
import { todosMachine, type todoMachine } from './todosMachine';

export function Todos() {
  const [snapshot, send] = useActor(todosMachine);
  const remaining = createMemo(() => snapshot.context.todos.length);

  return (
    <Switch>
      <Match when={snapshot.matches('loading')}>Loading…</Match>
      <Match when={snapshot.matches('ready')}>
        <p>{remaining()} todos</p>
        <For each={snapshot.context.todos}>{(todoRef) => <TodoRow todoRef={todoRef} />}</For>
        <button onClick={() => send({ type: 'add', title: 'New' })}>Add</button>
      </Match>
    </Switch>
  );
}

function TodoRow(props: { todoRef: ActorRefFrom<typeof todoMachine> }) {
  const todo = fromActorRef(() => props.todoRef); // accessor form tracks prop changes
  return (
    <li onClick={() => props.todoRef.send({ type: 'toggle' })}>
      {todo().context.title} {todo().context.done ? '✓' : ''}
    </li>
  );
}
```

Rules specific to Solid:

- **Don't destructure at setup**: `const { value } = snapshot` or `const count = snapshot.context.count` in the component body reads once and loses reactivity. Read inside JSX, `createMemo`, or `createEffect`.
- The store is a deep clone. `snapshot.context.user !== actorRef.getSnapshot().context.user`, so compare plain data by value or id, not identity.
- Do not mutate the store. Change state only through events.
- Selector equivalent: `const isPaying = createMemo(() => snapshot.matches('paying'))`. `createMemo` only notifies dependents when its value changes (`===`), which gives `useSelector`-like isolation.
- Emitted events: `onMount(() => { const sub = actorRef.on('saved', handler); onCleanup(sub.unsubscribe); })`.
- Solid's own `from(actorRef)` also works (actors are subscribable) but starts as `undefined` until the next emission, and it is not deeply diffed. Prefer `fromActorRef`.

### Solid SSR / SolidStart

`onMount` does not run on the server, so actors are created but not started during SSR, and the initial snapshot is rendered. Initial context must be deterministic for hydration. Module-level started actors are shared across requests.

### Solid version notes

- 0.2.0 (xstate v5): `useActor` takes **logic** (old `useActor(actorRef)` → `fromActorRef(actorRef)`). `createService` removed → `useActorRef`. `fromActorRef` added. `useMachine` became an alias.
- 0.2.1: required `input` typing. 0.2.3: fix so new array entries don't mutate the original machine context.
- 1.x / 2.0.0: peer bumps only.

## Actor interop primitives (any framework)

Every adapter (and every custom integration) is built on these `Actor` members (xstate 5.x):

| Member | Use |
|---|---|
| `actor.getSnapshot()` | Current snapshot, synchronous. Throws in dev if read while the actor is still initializing |
| `actor.subscribe(next \| observer)` → `{ unsubscribe }` | Snapshot changes. **No replay** of the current value, but `start()` emits the initial snapshot to observers already subscribed. A `done` snapshot is delivered via `next`, then `complete`. Errors go only to `error` |
| `actor.on(type \| '*', handler)` → `{ unsubscribe }` | Emitted events (`emit(...)` action) |
| `actor.select(selector, equalityFn = Object.is)` → `Readable<T>` (`.get()`, `.subscribe()`) | Derived value that notifies only on change. **xstate ≥ 5.29.0** |
| `actor[Symbol.observable]()` | InteropObservable. Uses `Symbol.observable` if defined, else `'@@observable'` (same convention as RxJS), so `from(actor)` works |
| `actor.send(event)` | Bound in the constructor, so it is safe to destructure or pass as a callback |
| `actor.start()` / `actor.stop()` | `start()` on a running actor is a no-op. A stopped actor cannot be restarted |
| `actor.getPersistedSnapshot()` | Serializable state for `createActor(logic, { snapshot })` |
| `actor.system.get(systemId)` | Look up actors registered with `systemId` (not reactive) |

If an actor errors and **no** observer has an `error` handler, xstate rethrows the error in a `setTimeout` (a global uncaught error; in Node it crashes the process by default). With at least one handler-less observer, it is reported too.

## Vanilla JS / DOM

```ts
import { assign, createActor, setup } from 'xstate';

const counterMachine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'inc' } | { type: 'dec' } | { type: 'reset' },
  },
}).createMachine({
  context: { count: 0 },
  on: {
    inc: { actions: assign({ count: ({ context }) => context.count + 1 }) },
    dec: { guard: ({ context }) => context.count > 0, actions: assign({ count: ({ context }) => context.count - 1 }) },
    reset: { actions: assign({ count: 0 }) },
  },
});

const actor = createActor(counterMachine);
const output = document.querySelector<HTMLOutputElement>('#count')!;
const decButton = document.querySelector<HTMLButtonElement>('#dec')!;

// subscribe BEFORE start: start() delivers the initial snapshot, so no separate initial render is needed
const sub = actor.subscribe({
  next: (s) => {
    output.textContent = String(s.context.count);
    decButton.disabled = !s.can({ type: 'dec' });
  },
  error: (err) => console.error('counter failed', err),
});

document.querySelector('#inc')!.addEventListener('click', () => actor.send({ type: 'inc' }));
decButton.addEventListener('click', () => actor.send({ type: 'dec' }));

actor.start();

// teardown (SPA route change, web component disconnectedCallback, HMR dispose)
export function dispose() {
  sub.unsubscribe();
  actor.stop();
}
```

- Granular DOM updates without diffing (xstate ≥ 5.29): `actor.select((s) => s.context.count).subscribe((n) => (output.textContent = String(n)))`.
- Web components: create the actor in `connectedCallback`, stop it in `disconnectedCallback`. Use `input` from attributes, and send events from `attributeChangedCallback`.
- Inspect in the browser with `createBrowserInspector()` from `@statelyai/inspect`: `createActor(machine, { inspect })`.

## Node and server-side scripts

```ts
import { createActor, toPromise, waitFor } from 'xstate';
import { importMachine } from './importMachine';

// Run a workflow to completion
const actor = createActor(importMachine, { input: { path: './data.csv' } });
actor.start();
const result = await toPromise(actor); // resolves with snapshot.output on a final state, rejects on error

// Wait for an intermediate condition, with a timeout and cancellation
const ready = await waitFor(serverActor, (s) => s.matches('listening'), {
  timeout: 10_000,
  signal: AbortSignal.timeout(15_000),
});
```

- `toPromise` resolves only on `done`. An actor stopped manually before reaching a final state leaves the promise pending forever. Give long-lived actors explicit `final` states, or use `waitFor` with a timeout.
- `waitFor` resolves immediately if the current snapshot already matches. It rejects on timeout, on abort, or when the actor finishes or errors without matching.
- Pending `after` delays and invoked callbacks keep the event loop alive. `actor.stop()` cancels them, so the process can exit.
- Without an `error` observer (or `toPromise`/`waitFor`, which register one), an unhandled actor error becomes an uncaught exception in a later tick. Attach one in services: `actor.subscribe({ error: (e) => logger.error(e) })`.
- Per-request workflows: create one actor per request/job. Never share a started actor across requests unless it is deliberately global (a connection supervisor, for example).
- Durable workflows: persist `actor.getPersistedSnapshot()` (JSON) after each transition, then restore with `createActor(machine, { snapshot })`. Entry actions are not re-run on restore; invocations restart.
- Pure computation without running actors: `initialTransition(machine, input?)` and `transition(machine, snapshot, event)` return `[nextSnapshot, actions]` without executing effects. This is useful in request handlers that load a persisted snapshot, apply one event, and save the result.

## Angular (no official adapter)

There is no `@xstate/angular`. Use the core actor directly. Actors are `Subscribable` and `InteropObservable`, so they work with Angular signals and with RxJS.

### Signals (Angular ≥ 16) in a component-scoped service

```ts
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { createActor, type Actor, type SnapshotFrom } from 'xstate';
import { checkoutMachine } from './checkout.machine';

type CheckoutSnapshot = SnapshotFrom<typeof checkoutMachine>;

@Injectable() // list in the component's `providers` so the actor lives and dies with that component
export class CheckoutStore {
  private readonly destroyRef = inject(DestroyRef);
  private actor?: Actor<typeof checkoutMachine>;
  private readonly snapshotSig = signal<CheckoutSnapshot | undefined>(undefined);

  readonly snapshot = this.snapshotSig.asReadonly();
  readonly isPaying = computed(() => this.snapshotSig()?.matches('paying') ?? false);
  readonly total = computed(() => this.snapshotSig()?.context.total ?? 0);

  /** Call once with input from the component (e.g. in ngOnInit, where signal inputs are available). */
  init(input: { cartId: string }) {
    if (this.actor) return;
    const actor = createActor(checkoutMachine, { input });
    const sub = actor.subscribe({
      next: (s) => this.snapshotSig.set(s),
      error: (err) => console.error('checkout actor failed', err),
    });
    actor.start();
    this.snapshotSig.set(actor.getSnapshot());
    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
      actor.stop();
    });
    this.actor = actor;
  }

  send(event: Parameters<Actor<typeof checkoutMachine>['send']>[0]) {
    this.actor?.send(event);
  }
}
```

```ts
import { Component, OnInit, inject, input } from '@angular/core';
import { CheckoutStore } from './checkout.store';

@Component({
  selector: 'app-checkout',
  providers: [CheckoutStore],
  template: `
    <button [disabled]="store.isPaying()" (click)="store.send({ type: 'pay' })">
      Pay {{ store.total() }}
    </button>
  `,
})
export class CheckoutComponent implements OnInit {
  readonly cartId = input.required<string>();
  protected readonly store = inject(CheckoutStore);
  ngOnInit() {
    this.store.init({ cartId: this.cartId() });
  }
}
```

- Signals use `Object.is` equality, and every transition produces a new snapshot object, so `snapshotSig.set` always notifies. Derive narrow values with `computed`: `computed` notifies only when its result changes.
- For app-wide state, use `@Injectable({ providedIn: 'root' })` and create the actor in the constructor (no input needed). It lives for the whole app.
- Sync changing `input()`s with `effect(() => store.send({ type: 'cart.changed', cartId: this.cartId() }))`, or recreate the component.
- Emitted events: `const sub = actor.on('saved', h); destroyRef.onDestroy(() => sub.unsubscribe());`.

### RxJS interop

```ts
import { defer, from, map, distinctUntilChanged, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

// from(actor) works via Symbol.observable / '@@observable' (tested in xstate core).
// It does not replay the current snapshot when subscribed after start(), so seed it:
const snapshot$ = defer(() => from(actor).pipe(startWith(actor.getSnapshot())));
const total$ = snapshot$.pipe(map((s) => s.context.total), distinctUntilChanged());

// In an injection context; startWith emits synchronously, so requireSync is valid
const total = toSignal(total$, { requireSync: true });
```

- The observable completes when the actor reaches a final state (after emitting the `done` snapshot) and errors when the actor errors. Handle the error with `catchError`, or `toSignal` will rethrow on read.
- Unsubscribing does not stop the actor. Stop it in `DestroyRef.onDestroy`.

### Angular SSR

Services and constructors run on the server. Do not `start()` side-effectful actors there. Start them inside `afterNextRender(() => ...)` (Angular ≥ 17) or behind `isPlatformBrowser(inject(PLATFORM_ID))`. Root-provided services are per application instance on the server, but module-level actors are shared across requests.

## Stale APIs

| Stale | Current |
|---|---|
| Vue/Svelte: `const { state, send, service } = useMachine(m)` | `const { snapshot, send, actorRef } = useActor(m)` |
| `useInterpret(machine, options, listener)` (Vue/Svelte), `createService` (Solid), `useSpawn` | `useActorRef(...)` (Vue keeps the 3rd `observer` argument; Svelte/Solid do not) |
| Solid `useActor(actorRef)` | `fromActorRef(actorRef)` |
| `useMachine(machine, { actions, guards, services, context })` | `useActor(machine.provide({ actions, guards, actors }), { input })` |
| `useSelector(actor, sel, compare, getSnapshot)` | 3 parameters |
| `machine.initialState`, `interpret(machine)`, `{ state: persisted }` | `createActor(machine).getSnapshot()` / `getInitialSnapshot`, `createActor`, `{ snapshot: persisted }` |
| `send('EVENT')` | `send({ type: 'EVENT' })` |
| `@xstate/fsm` adapters (`useMachine` from FSM) | Removed. Use full `xstate` |

## Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Vue: `snapshot.matches is not a function` in `<script>` | Forgot `.value` on the ref | `snapshot.value.matches(...)` in script; no `.value` in template |
| Vue: child keeps showing old actor's data | `useSelector(props.actor, ...)` captured the first actor | `useSelector(toRef(props, 'actor'), ...)` |
| Vue/Solid: actor never starts | Composable called outside component setup (no `onMounted`/`onMount`) | Call during setup. For non-component code, use `createActor(...).start()` directly |
| Svelte: fetches/timers run during SSR | `useActorRef` starts immediately, even on the server | Gate on `browser`, or trigger I/O via an event in `onMount` |
| Svelte 5: `lifecycle_outside_component` error | `useActor`/`useActorRef` called outside component init (they use `onDestroy`) | Call at the top level of the component `<script>` |
| Svelte: `useSelector(undefined, ...)` crashes | Svelte adapter doesn't accept `undefined` | `{#if childRef}` around a child component that calls `useSelector`, or build a derived store manually |
| Solid: UI doesn't update | Destructured or read snapshot properties outside a tracking scope | Read inside JSX / `createMemo` / `createEffect` |
| UI frozen in last state, error only in console | Unhandled actor error. Non-React adapters don't put it into the snapshot | `onError` transitions in the machine; `subscribe({ error })` for logging |
| Prop change ignored | `input` read once at creation | Send an event on change, or key/remount |
| RxJS/Angular stream starts empty | `from(actor)` doesn't replay the current snapshot after `start()` | `startWith(actor.getSnapshot())` or subscribe before `start()` |
| Node process doesn't exit | Pending delays/invocations | `actor.stop()` after the work is done |
| `toPromise` never resolves | Actor stopped or never reaches a `final` state | Add a final state, or use `waitFor` with `timeout` |

## Docs vs source discrepancies

- Vue and Svelte docs list `useSelector(actor, selector, compare?, getSnapshot?)`. Source has no `getSnapshot` parameter (removed in the xstate v5 majors).
- Vue docs' "options + listener" example still imports `useInterpret` and passes `actions` in options. Both were removed. Use `useActorRef(machine.provide({ actions }), options, listener)`.
- Vue docs' `useSelector(props.actor, ...)` example is not reactive to a changing `actor` prop. Pass `toRef(props, 'actor')`.
- The Solid README's persistence example falls back to `someMachine.initialState` (a v4 API that no longer exists) and mentions `createService`. Use `undefined` (no `snapshot` option) for a fresh start, and `useActorRef`.
- The Svelte docs don't mention that `useActorRef` starts the actor during component init (so also during SSR). The source does exactly that.
