# XState Core: Setup, Machines, Actors, Snapshots

Scope: installing XState v5 (stable `xstate@5.33.x`) and its official packages, the core mental model, `setup()` and `createMachine()`, `createActor()` and the actor lifecycle, the full machine snapshot API, and the pure transition functions. Deep dives on actions, guards, invoke/spawn, persistence, testing, and framework bindings live in other reference files.

## Contents

- Complete example
- Install and package map
- Mental model
- `setup()`
- Machine config (top-level keys)
- `createMachine()` without `setup()`
- `createActor()` options
- Actor lifecycle and API
- Machine snapshot API
- Pure functions (no actor)
- Other core exports
- Stale API (v4 → v5)
- Pitfalls

## Complete example

A fetch machine with typed input, a promise actor, retry with a delay, and final output. It runs as is with `bun run`.

```ts
import { assign, createActor, fromPromise, setup, toPromise } from 'xstate';

type User = { id: string; name: string };

const fetchUser = fromPromise(
  async ({ input, signal }: { input: { userId: string }; signal: AbortSignal }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${input.userId}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as User;
  },
);

export const userMachine = setup({
  types: {
    context: {} as { userId: string; user: User | null; error: string | null; attempts: number },
    events: {} as { type: 'user.retry' } | { type: 'user.cancel' },
    input: {} as { userId: string },
    output: {} as { user: User | null },
    tags: {} as 'busy',
  },
  actors: { fetchUser },
  guards: {
    canRetry: ({ context }) => context.attempts < 3,
  },
  delays: {
    backoff: ({ context }) => 2 ** context.attempts * 250,
  },
}).createMachine({
  id: 'user',
  context: ({ input }) => ({ userId: input.userId, user: null, error: null, attempts: 0 }),
  initial: 'loading',
  states: {
    loading: {
      tags: 'busy',
      entry: assign({ attempts: ({ context }) => context.attempts + 1 }),
      invoke: {
        src: 'fetchUser',
        input: ({ context }) => ({ userId: context.userId }),
        onDone: { target: 'success', actions: assign({ user: ({ event }) => event.output }) },
        onError: {
          target: 'failure',
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
      on: { 'user.cancel': 'cancelled' },
    },
    failure: {
      always: { guard: 'canRetry', target: 'waiting' },
      on: { 'user.retry': 'loading' },
    },
    waiting: {
      tags: 'busy',
      after: { backoff: 'loading' },
    },
    success: { type: 'final' },
    cancelled: { type: 'final' },
  },
  output: ({ context }) => ({ user: context.user }),
});

const actor = createActor(userMachine, { input: { userId: '1' } });
actor.subscribe({
  next: (snapshot) => console.log(snapshot.value, snapshot.hasTag('busy')),
  error: (err) => console.error('actor crashed', err),
});
actor.start();

const output = await toPromise(actor); // resolves when the machine reaches a top-level final state
console.log(output.user?.name);
```

Why it is shaped this way: all implementations are named in `setup()` so the config stays serializable and each implementation can be swapped with `machine.provide()`. The `failure` state stays reachable even when retries run out, so the user can still send `user.retry` after the automatic retries stop. Leaving `loading` stops the invoked promise and aborts its `signal`.

## Install and package map

```bash
bun add xstate
bun add -d typescript   # TypeScript >= 5.0 required; strictNullChecks (or strict) required
```

XState has zero runtime dependencies. Subpath entry points of `xstate`: `xstate/actions`, `xstate/guards`, `xstate/actors`, `xstate/dev`, `xstate/graph` (graph and model-based testing, xstate ≥ 5.20).

| Package | What it is | Stable | Status |
| --- | --- | --- | --- |
| `xstate` | Core: machines, actors, actor logic creators, `xstate/graph` | 5.33.2 | Active. `6.0.0-alpha.*` on `alpha` tag: do not use in production |
| `@xstate/react` | `useMachine`, `useActor`, `useActorRef`, `useSelector`, `createActorContext` | 6.1.0 | Active. React 16.8–19. `7.0.0-alpha.*` exists |
| `@xstate/vue` | Vue 3 composables | 5.0.1 | Active |
| `@xstate/svelte` | Svelte bindings | 5.0.0 | Active |
| `@xstate/solid` | Solid bindings | 2.0.0 | Active |
| `@xstate/store` | Small event-driven store (no state machines). `xstate` is an optional peer | 4.3.0 | Active. v4 moved framework bindings into separate packages |
| `@xstate/store-react` | React bindings for the store | 2.1.0 | Active (replaces `@xstate/store/react`) |
| `@xstate/store-vue` / `-svelte` / `-solid` / `-preact` / `-angular` | Store bindings for other frameworks | 2.0.x | Active |
| `@xstate/immer` | `assign` with Immer producers | 0.3.3 | Maintained, low activity. Plain `assign` is usually enough |
| `@statelyai/inspect` | Inspector (browser, WebSocket) for actor systems | 0.7.2 | Active. Use this one |
| `@xstate/inspect` | Old inspector | 0.8.0 | Superseded by `@statelyai/inspect` |
| `@xstate/graph` | Standalone graph package | 3.0.4 | Prefer `xstate/graph` from core (≥ 5.20) |
| `@xstate/test` | Old model-based testing | 0.5.1 | Deprecated on npm. Use `xstate/graph` (`createTestModel`) |
| `@xstate/fsm` | Tiny v4-era FSM | 2.1.0 | Legacy. Use `xstate` or `@xstate/store` |
| `@statelyai/agent` | State-machine-guided AI agents | 1.1.6 | Active. `2.0.0-next.*` on `next` |
| `eslint-plugin-xstate` | Lint rules for machine configs | 3.2.1 | Community-maintained. Check that the rules match v5 |
| `statelyai` (CLI) | Finds machines in a repo, syncs with Stately Studio | 0.12.6 | Pre-1.0 |
| `@statelyai/mcp` | MCP server: validate, run, explore, and visualize machines | 0.16.0 | Pre-1.0 |
| `@statelyai/sdk` | Embed the Stately editor, inspect live systems, Studio API | 0.38.0 | Public alpha. API can change in minors |
| `@xstate/effect` | Effect integration | 0.1.0-alpha.7 | Alpha only |

Versions are npm `latest` tags at the time of writing. Run `npm view <pkg> dist-tags` to get current values.

## Mental model

- **Actor logic** is a pure description of behavior: `(snapshot, event) => nextSnapshot`, plus initial snapshot and optional start and persistence hooks. A **state machine** (`createMachine` or `setup().createMachine`) is one kind of actor logic. `fromPromise`, `fromCallback`, `fromObservable`, `fromEventObservable`, and `fromTransition` are other kinds.
- An **actor** is a running instance of actor logic (`createActor(logic)`). It has a mailbox, processes one event at a time, owns its children, and emits snapshots. The logic stays immutable. Many actors can run from the same machine.
- A **snapshot** is the actor's current, immutable state. For machines it holds `value` (the finite state), `context` (the extended state), `status`, `output`, `error`, `children`, and helper methods.
- **Events** are plain objects with a `type`. Actors change state only because of events. External code sends them with `actor.send`. Internal events come from `raise`, delayed transitions (`after`), and actor done or error events (`xstate.done.actor.*`, `xstate.error.actor.*`).
- **Emitted events** (`emit(...)`, listened to with `actor.on`) are output to outside listeners. They do not cause transitions.
- **Actor system**: `createActor(rootLogic)` creates an implicit system. Every invoked or spawned descendant joins it, and you can find an actor in it by `systemId` with `system.get(id)`.
- **Run-to-completion**: one external event produces one macrostep. This is a chain of microsteps (eventless `always` transitions and raised events) that runs until the state is stable. Only then do observers receive one snapshot.

## `setup()`

`setup({...})` declares types and named implementations once. It returns an object whose `.createMachine(config)` is fully typed. Prefer it for all new code: string references (`'fetchUser'`, `{ type: 'notify', params }`) are type-checked against what you declared, and `snapshot.value` gets a literal union type.

| Key | Purpose |
| --- | --- |
| `types` | Type-only declarations: `context`, `events`, `input`, `output`, `emitted`, `children`, `tags`, `meta`, `transitionMeta` (≥ 5.33). Use `{} as T` values. `setup` does not accept `actions`, `guards`, or `delays` keys in `types` (TS error). They are inferred from the implementations |
| `actors` | Named actor logic: `{ fetchUser: fromPromise(...), child: childMachine }`. Required when `types.children` is set |
| `actions` | Named actions: custom functions `({ context, event, self, system }, params) => void` or built-in action creators (`assign(...)`, `raise(...)`, ...) |
| `guards` | Named guards: `({ context, event }, params) => boolean`, or `and([...])`, `or([...])`, `not(...)`, `stateIn(...)` |
| `delays` | Named delays: a number (ms) or `({ context, event }, params) => number` |
| `schemas` | Typed `unknown`. Passed through to `machine.schemas` for tools (≥ 5.6). XState itself does not validate anything with it |

The object that `setup()` returns:

| Member | Since | Notes |
| --- | --- | --- |
| `.createMachine(config)` | 5.0 | The machine. Literal state values, typed `getMeta()` keys, and typed `snapshot.children` |
| `.extend({ actions?, guards?, delays? })` | 5.24 | New setup with more implementations. Can chain. Cannot add `types` or `actors` |
| `.createStateConfig(stateConfig)` | 5.21 | Typed state node config. Use it to split large machines into modules |
| `.createAction(fn)` | 5.22 | Typed custom action outside the config |
| `.assign`, `.raise`, `.sendTo`, `.emit`, `.log`, `.cancel`, `.stopChild`, `.spawnChild`, `.enqueueActions` | 5.22 | Built-in action creators bound to this setup's types. Use them outside the machine config, where contextual typing does not reach |

```ts
import { not, setup } from 'xstate';

const base = setup({
  types: {
    context: {} as { count: number; role: 'admin' | 'user' },
    events: {} as { type: 'inc'; by: number } | { type: 'reset' },
  },
  guards: { isAdmin: ({ context }) => context.role === 'admin' },
});

// Typed helpers usable outside the config
const increment = base.assign({
  count: ({ context, event }) => (event.type === 'inc' ? context.count + event.by : context.count),
});

const app = base.extend({
  guards: { isNotAdmin: not('isAdmin') },
  delays: { idle: 30_000 },
});

const counting = app.createStateConfig({
  on: { inc: { actions: increment }, reset: { guard: 'isAdmin', target: 'counting' } },
  after: { idle: 'asleep' },
});

export const counterMachine = app.createMachine({
  context: { count: 0, role: 'user' },
  initial: 'counting',
  states: { counting, asleep: {} },
});
```

## Machine config (top-level keys)

The root of a machine is a state node, so it accepts all state node keys plus some root-only keys.

| Key | Notes |
| --- | --- |
| `id` | Root id. Default is `'(machine)'`. It prefixes the state ids used by `getMeta()` and `#id` targets |
| `context` | An object, or a factory `({ input, spawn, self }) => context`. Use the factory form whenever context depends on input or spawns actors. `self` in the factory: ≥ 5.4 |
| `initial`, `states`, `type` | `type`: `'parallel'`, `'final'`, `'history'`, or the default compound/atomic |
| `on`, `always`, `after` | Event, eventless, and delayed transitions |
| `entry`, `exit` | Actions |
| `invoke` | Actors that live as long as the state is active |
| `tags`, `meta`, `description` | Metadata. `meta` type comes from `types.meta` |
| `output` | Root only. Value or `({ context, event, self }) => output`. Used when a top-level final state is reached |
| `version` | Root only. Informational string, available as `machine.version` |
| `options.maxIterations` | Root only (≥ 5.31). Microstep limit before XState throws an infinite-loop error. Default is `Infinity` |
| `route` | On states with an explicit `id` (≥ 5.28). Makes the state reachable from anywhere with `{ type: 'xstate.route', to: '#id' }` |

## `createMachine()` without `setup()`

It is still supported. Use it for JS-only code or very small machines. Types go in `types: {} as {...}`, which also accepts `actions`, `guards`, `actors`, and `delays` unions (unlike `setup`). Implementations go in the second argument.

```ts
import { createMachine } from 'xstate';

const toggle = createMachine(
  {
    types: {} as {
      context: { count: number };
      events: { type: 'toggle' };
      actions: { type: 'track'; params: { label: string } };
    },
    context: { count: 0 },
    initial: 'off',
    states: {
      off: { on: { toggle: 'on' } },
      on: { entry: { type: 'track', params: { label: 'on' } }, on: { toggle: 'off' } },
    },
  },
  { actions: { track: (_, params) => console.log(params.label) } },
);
```

Trade-offs compared with `setup()`: `snapshot.value` is typed only as `StateValue` (any string or object), `getMeta()` keys are not typed, `snapshot.children` is not typed per child id, and nothing checks that a referenced implementation is provided. To migrate, move `types` and the second argument's implementations into `setup({...})`.

## `createActor()` options

`createActor(logic, options?)`. If the logic's input type does not include `undefined`, the options argument and `input` are required at the type level, and XState throws at runtime if they are missing (≥ 5.6).

| Option | Notes |
| --- | --- |
| `input` | Typed by `InputFrom<typeof logic>`. Passed to the `context` factory and to the logic |
| `snapshot` | Persisted snapshot from `actor.getPersistedSnapshot()` to restore from. Entry actions are not re-run. Invokes restart, and spawned children are restored recursively |
| `state` | Deprecated alias of `snapshot` |
| `id` | Actor id. Default is the generated `sessionId` |
| `systemId` | Registers the actor so that `system.get(systemId)` finds it |
| `inspect` | Function or observer that receives inspection events (`@xstate.actor`, `@xstate.event`, `@xstate.snapshot`, `@xstate.transition`, `@xstate.microstep`, `@xstate.action`). Only root actors use it, and it covers the whole system |
| `logger` | Used by `log()` actions. Default is `console.log`. Shared with the whole system (≥ 5.10) |
| `clock` | `{ setTimeout, clearTimeout }` for delays. Use `new SimulatedClock()` in tests. Shared with the whole system (≥ 5.10) |
| `parent`, `src`, `syncSnapshot` | Internal plumbing used by invoke and spawn. Do not set them yourself |
| `devTools` | Deprecated and typed `never`. Use `inspect` |

## Actor lifecycle and API

```ts
const actor = createActor(machine, { input }); // created, not running; initial snapshot computed
const sub = actor.subscribe(observer);         // subscribe before start to see the initial snapshot
actor.start();                                  // runs entry actions, starts invokes and the system
actor.send({ type: 'event' });                  // queued in the mailbox, processed one event at a time
actor.stop();                                   // root only; stops all children; status becomes 'stopped'
```

| Member | Behavior |
| --- | --- |
| `start()` | Idempotent. Starts the system for root actors. Events sent before `start()` are queued and processed after it |
| `stop()` | Only for root actors. A child throws `A non-root actor cannot be stopped directly`. Stop children with `stopChild(...)`, or leave the invoking state |
| `send(event)` | Event objects only. A string throws in development. Bound to the instance, so destructuring is safe. Sends to a stopped actor are ignored, with a development warning |
| `subscribe(observer)` / `subscribe(next, error?, complete?)` | Returns `{ unsubscribe }`. `next` gets every snapshot, including the final `done` one. `complete` runs after `done`. `error` runs when the actor fails. Subscribing after the actor stopped calls `complete` at once if it was done, or `error` if it failed |
| `getSnapshot()` | Current snapshot, read synchronously. Not available during construction |
| `getPersistedSnapshot()` | JSON-serializable internal state (context with actor refs replaced, children, history). In development it throws for inline (non-named) child actors. Name them in `setup({ actors })` |
| `on(type, handler)` | Listens to emitted events. Typed by `types.emitted`. Use `'*'` for all (≥ 5.13.1). Returns `{ unsubscribe }`. A throwing handler does not crash the actor (≥ 5.20.2) |
| `select(selector, equalityFn?)` | ≥ 5.29. Returns `Readable` with `.get()` and `.subscribe()`. It notifies only when the selected value changes (`Object.is` by default) |
| `system` | `get(systemId)`, `getAll()` (≥ 5.23), `inspect(observer)` (returns a subscription, ≥ 5.14), `scheduler` |
| `id`, `sessionId`, `systemId` (public ≥ 5.22.1), `src`, `logic`, `options`, `clock` | Identity and configuration |
| `toJSON()`, `[Symbol.observable]()` | Serialization stub, and interop with RxJS `from(actor)` |

Error handling: if actor logic throws (a custom action, a guard, an invoked promise that no `onError` handles), the snapshot gets `status: 'error'` and the actor stops. Observers' `error` callbacks run. If a root actor has no error observer, the error is rethrown asynchronously as an uncaught exception. Always pass an `error` callback for long-lived root actors.

`waitFor(actor, predicate, { timeout?, signal? })` resolves with the first snapshot that matches (it checks the current one first). It rejects on timeout (default `Infinity`), on abort (`signal`, ≥ 5.18), on actor error, or if the actor completes without matching. `toPromise(actor)` (≥ 5.2) resolves with `output` when the actor is done and rejects with its error.

`createEmptyActor()` returns an actor that ignores all events. Its snapshot `context` is always `undefined`. Use it as a stand-in for an optional actor, for example in `useSelector(props.actor ?? emptyActor, (s) => s.context?.data)`.

## Machine snapshot API

`actor.getSnapshot()` for a machine returns a `MachineSnapshot`. It is a discriminated union on `status`.

| Member | Meaning |
| --- | --- |
| `value` | State value: `'idle'`, `{ red: 'walk' }`, or `{ a: 'x', b: 'y' }` for parallel states. With `setup()`, typed as the exact union (≥ 5.18) |
| `context` | Extended state. Treat it as immutable. Change it only through `assign` |
| `status` | `'active' \| 'done' \| 'error' \| 'stopped'` (`SnapshotStatus`, ≥ 5.16) |
| `output` | Defined only when `status === 'done'` (top-level final state reached). Narrow on `status` |
| `error` | Defined only when `status === 'error'` |
| `matches(partialValue)` | True if the current value contains the given value: `matches('loading')`, `matches({ form: 'invalid' })`. Typed with `setup()` |
| `hasTag(tag)` | True if any active state node has the tag. Typed by `types.tags`. Prefer tags over long `matches` chains for UI flags like `busy` |
| `can(event)` | True if the event would select a transition that has a target or actions. It runs the guards. It does not execute actions |
| `getMeta()` | `Record<stateId, meta>` for active nodes that have `meta`. Keys are full state ids (`'user.loading'`, or a custom `id`). Typed keys with `setup()` (≥ 5.17) |
| `tags` | `Set<string>` of the active tags |
| `children` | `Record<id, ActorRef \| undefined>` of invoked and spawned children. Typed per id via `types.children` or root `invoke` ids |
| `historyValue` | History state bookkeeping |
| `machine` | The machine that produced this snapshot |
| `toJSON()` | Plain object without methods. `tags` becomes an array |

Related helpers: `mapState(snapshot, { states: { loading: { map: (s) => ... } } })` maps active state nodes to values (≥ 5.31). `isMachineSnapshot(x)` is a type guard. `matchesState(parent, child)` compares state values without a snapshot.

```ts
const snapshot = actor.getSnapshot();
if (snapshot.status === 'done') {
  snapshot.output; // typed output, not undefined
} else if (snapshot.matches('loading') || snapshot.hasTag('busy')) {
  // render spinner
}
const canRetry = snapshot.can({ type: 'user.retry' });
```

## Pure functions (no actor)

Use these on servers, in workflows, reducers, and tests where you store state yourself. They do not run side effects.

| Function | Since | Returns |
| --- | --- | --- |
| `initialTransition(logic, input?)` | 5.19 | `[snapshot, actions]` for the initial state |
| `transition(logic, snapshot, event)` | 5.19 | `[nextSnapshot, actions]` |
| `getInitialMicrosteps(machine, input?)` / `getMicrosteps(machine, snapshot, event)` | 5.27 | `[snapshot, actions][]`, one entry per microstep |
| `getNextTransitions(snapshot)` | 5.26 | All candidate transitions (guards not evaluated), including `always` and `after`. It replaces v4 `state.nextEvents` |
| `getNextSnapshot(logic, snapshot, event)` | 5.5 | Deprecated. Use `transition` |
| `getInitialSnapshot(logic, input?)` | 5.6.2 | Deprecated. Use `initialTransition` |
| `machine.resolveState({ value, context, ... })` | 5.0 | Snapshot from a state value. Required `context` when the context is typed. Throws on an invalid value (≥ 5.7) |
| `machine.provide({ actions, guards, actors, delays })` | 5.0 | New machine with implementations merged over the defaults. Cannot change `context`. Use `input` for that |

How actions come back: `assign` is applied to the returned snapshot already. Custom actions come back as `{ type, params, info, exec }`, and you run them with `action.exec?.(action.info, action.params)`. Built-in effects come back as special objects: `xstate.raise` (delayed only, with `params.delay` and `params.event`), `xstate.sendTo`, `xstate.cancel`, `xstate.emit`, `xstate.log`, `xstate.spawnChild`. Type them with `ExecutableActionsFrom<typeof machine>`.

```ts
import { initialTransition, transition } from 'xstate';

const [s0, initialActions] = initialTransition(userMachine, { userId: '1' });
const stored = JSON.stringify(s0);

// later, e.g. in a request handler
const restored = userMachine.resolveState(JSON.parse(stored));
const [s1, actions] = transition(userMachine, restored, { type: 'user.cancel' });
for (const action of actions) action.exec?.(action.info, action.params);
```

Note: `machine.transition(snapshot, event, actorScope)` and `machine.getInitialSnapshot(actorScope, input)` are actor-logic protocol methods that need an actor scope. Application code should call the free functions above.

## Other core exports

Use them by name. They are covered in other reference files:

- Guards: `and`, `or`, `not`, `stateIn`.
- Actions: `assign`, `raise`, `sendTo`, `sendParent`, `forwardTo`, `emit`, `log`, `cancel`, `spawnChild`, `stopChild`, `enqueueActions`.
- Actor logic: `fromPromise`, `fromCallback`, `fromObservable`, `fromEventObservable`, `fromTransition`, `createEmptyActor`.
- `assertEvent(event, typeOrTypes)` narrows or throws. Partial descriptors such as `'FEEDBACK.*'` work (≥ 5.25).
- Utilities: `waitFor`, `toPromise`, `SimulatedClock`, `getStateNodes`, `pathToStateValue`, `toObserver`.
- `interpret` and `Interpreter` are deprecated aliases of `createActor` and `Actor`.

## Stale API (v4 → v5)

| v4 / stale | v5 |
| --- | --- |
| `interpret(machine)` | `createActor(machine)` |
| `Machine(...)`, `createMachine(config, options)` | `setup({ ...impls }).createMachine(config)` |
| `machine.withConfig(...)` | `machine.provide(...)` |
| `machine.withContext(...)` | `input` + `context: ({ input }) => ...` |
| `machine.transition(state, event)`, `machine.initialState` | `transition(machine, snapshot, event)`, `initialTransition(machine)` |
| `actor.state`, `service.onTransition(...)` | `actor.getSnapshot()`, `actor.subscribe(...)` |
| `actor.send('EVENT')`, `state.can('EVENT')` | `actor.send({ type: 'EVENT' })`, `snapshot.can({ type: 'EVENT' })` |
| `state.done`, `state.meta`, `state.nextEvents` | `snapshot.status === 'done'`, `snapshot.getMeta()`, `getNextTransitions(snapshot)` |
| `state.configuration`, `state.toStrings()`, `state.history`, `state.changed` | `snapshot._nodes` (internal), removed, removed (use `subscribe`), removed |
| `schema`, `tsTypes`, typegen | `types` in `setup()` |
| `predictableActionArguments` | Removed. Actions always run in order |
| `services` (implementation key) | `actors` |
| `createActor(m, { state })` | `createActor(m, { snapshot })` |
| `devTools: true` | `inspect` option + `@statelyai/inspect` |

## Pitfalls

- **Reading `getSnapshot()` before `start()` and expecting entry effects.** The initial snapshot exists right after `createActor` (assign has run), but custom entry actions and invokes run only on `start()`. Subscribe first, then start.
- **Creating actors in render or per request without stopping them.** Each `createActor(...).start()` owns timers and children. Stop root actors when the owner goes away, or use the framework hook that manages the lifecycle.
- **Calling `child.stop()`.** It throws. Use `stopChild(id or ref)`, or model the child's lifetime with `invoke` on a state.
- **No `error` observer on a root actor.** The failure becomes an uncaught exception in a `setTimeout`. Add `error` to `subscribe` and model expected failures with `onError`.
- **Expecting `output` while active.** `output` is only set when `status === 'done'`. Narrow on `status`, or use `toPromise`.
- **Using `can()` for transitions that have neither target nor actions.** They return `false` by design (forbidden transitions).
- **Persisting machines that use inline actors** (`invoke: { src: fromPromise(...) }`). `getPersistedSnapshot()` throws in development. Name the logic in `setup({ actors })` and reference it by string.
- **Mutating `context` in a custom action.** Snapshots are not deep-frozen, so the mutation looks like it works, but observers and `transition()` callers see shared mutable state. Use `assign`.
- **Mixing `machine.resolveState` with typed context and no `context`.** It is a TS error, and at runtime the context would be `{}`.
- **Accidental infinite `always` loops.** Since 5.31 you can set `options: { maxIterations: 1000 }` at the machine root to fail fast in development.
