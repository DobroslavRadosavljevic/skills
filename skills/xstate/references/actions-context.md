# Context, input, output, and actions (XState v5)

Scope: everything about data flowing into, through, and out of a v5 state machine — initial `context`, `input`, `output`, every
built-in action creator, custom actions and params, execution order, delayed events and cancellation, the event emitter, pure
transition functions, and the stale v4 forms to replace. Verified against `xstate@5.33.2` source (`packages/core/src/actions/*`,
`stateUtils.ts`, `createActor.ts`, `setup.ts`, `system.ts`) and CHANGELOG. Version tags like "(≥ 5.9.0)" mark features added after 5.0.

## Contents

- [Mental model](#mental-model)
- [Context](#context)
- [Input](#input)
- [Output](#output)
- [Custom actions](#custom-actions)
- [Execution order](#execution-order)
- [Built-in actions](#built-in-actions) — `assign`, `raise`, `sendTo`, `sendParent`, `forwardTo`, `emit`, `log`, `cancel`, `spawnChild`, `stopChild`, `enqueueActions`
- [Setup-bound action helpers](#setup-bound-action-helpers)
- [Event emitter](#event-emitter)
- [Delays, debounce, cancellation](#delays-debounce-cancellation)
- [Pure transition functions](#pure-transition-functions)
- [Overriding with provide](#overriding-with-provide)
- [Pitfalls](#pitfalls)
- [Stale API: v4 → v5](#stale-api-v4--v5)

## Mental model

- **Finite state** answers "what mode am I in?" (`idle`, `loading`, `error`). **Context** answers "with what data?" (`retries: 2`,
  `user`). If a value changes which events are accepted or what the UI shows as a mode, it belongs in a state, not a boolean in
  context. `isLoading`, `hasError`, `isOpen` in context are smells: model them as states and derive booleans with
  `snapshot.matches(...)` / `hasTag(...)`.
- **Actions** are fire-and-forget effects attached to transitions, `entry`, and `exit`. They never decide the next state.
- **Built-in actions** (`assign`, `raise`, `sendTo`, ...) are not functions you call; they are *action objects* the interpreter
  resolves. `assign` is the only way context changes.
- **Input** is creation-time data (like constructor args). **Output** is completion data (like a return value).

## Context

### Initial context

```ts
import { setup, createActor } from 'xstate';

type Filter = 'all' | 'active' | 'done';
type Todo = { id: string; title: string; done: boolean };

const todosMachine = setup({
  types: {
    context: {} as { todos: Todo[]; filter: Filter; createdAt: number },
    input: {} as { initialTodos?: Todo[] },
  },
}).createMachine({
  // Lazy form: evaluated once per actor, receives { input, spawn, self }
  context: ({ input }) => ({
    todos: input.initialTodos ?? [],
    filter: 'all',
    createdAt: Date.now(),
  }),
});

createActor(todosMachine, { input: {} }).start();
```

- Static form `context: { ... }`: the **same object reference** is the initial context of every actor created from the machine
  (source: `StateMachine.getInitialSnapshot` reuses `config.context`). That is why mutation leaks across actors.
- Lazy form `context: ({ input, spawn, self }) => ({ ... })`: fresh object per actor. Use it for anything time-, random-, or
  input-dependent, and to spawn actors at creation. `self` in the factory is ≥ 5.4.0.
- If `types.context` is declared, `context` is required in the config (TS error otherwise). If omitted entirely, context is `{}`.
- Context must be an object (`Record<string, any>`), not a primitive.

### Immutability

Never mutate `context` (no `context.items.push(x)`, no `context.count++` inside an action). Mutations bypass change detection
(subscribers, `useSelector` equality), corrupt the shared static initial context, break persisted-snapshot restore, and make pure
`transition()` results non-deterministic. Always return new values from `assign`.

### Immer

`@xstate/immer` is deprecated; the published `0.3.3` has peer dependency `xstate: ^4.37.2` — do not add it to a v5 project. Use
`immer` directly inside `assign`:

```ts
import { produce } from 'immer';
import { setup, assign } from 'xstate';

const machine = setup({
  types: {
    context: {} as { todos: { id: string; done: boolean }[]; filter: 'all' | 'active' },
    events: {} as { type: 'todo.toggle'; id: string } | { type: 'todo.add'; id: string },
  },
}).createMachine({
  context: { todos: [], filter: 'all' },
  on: {
    // Per-key: produce over one slice
    'todo.toggle': {
      actions: assign({
        todos: ({ context, event }) =>
          produce(context.todos, (draft) => {
            const todo = draft.find((t) => t.id === event.id);
            if (todo) todo.done = !todo.done;
          }),
      }),
    },
    // Whole context: produce returns a full context object; assign merges it
    'todo.add': {
      actions: assign(({ context, event }) =>
        produce(context, (draft) => {
          draft.todos.push({ id: event.id, done: false });
          if (draft.filter === 'all') draft.filter = 'active';
        }),
      ),
    },
  },
});
```

Install with `bun add xstate immer`.

## Input

Input is data given at actor creation. It is read once, when the initial snapshot is computed.

```ts
import { setup, createActor, fromPromise, assign } from 'xstate';

const fetchUser = fromPromise<{ id: string; name: string }, { userId: string }>(
  async ({ input, signal }) => {
    const res = await fetch(`/api/users/${input.userId}`, { signal });
    return res.json();
  },
);

const profileMachine = setup({
  types: {
    context: {} as { userId: string; name: string | null },
    input: {} as { userId: string },
    events: {} as { type: 'userId.change'; userId: string },
  },
  actors: { fetchUser },
}).createMachine({
  context: ({ input }) => ({ userId: input.userId, name: null }),
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        src: 'fetchUser',
        // Mapper receives { context, event, self }; result is typed by fetchUser's input
        input: ({ context }) => ({ userId: context.userId }),
        onDone: { target: 'ready', actions: assign({ name: ({ event }) => event.output.name }) },
      },
    },
    ready: {},
  },
  on: {
    // Input is NOT reactive: new external data arrives as events.
    // A root-level transition to a child exits and re-enters the active child, so a running fetch restarts.
    'userId.change': {
      target: '.loading',
      actions: assign({ userId: ({ event }) => event.userId }),
    },
  },
});

const actor = createActor(profileMachine, { input: { userId: 'u1' } }).start();
```

- Initial `entry` actions receive the init event `{ type: 'xstate.init', input }` as `event`.
- Type input with `types.input`. `createActor` errors at runtime when required input is missing (≥ 5.6.0); TS also requires it.
- Every actor logic creator reads `input` from its first argument: `fromPromise(({ input }) => ...)`,
  `fromCallback(({ input }) => ...)`, `fromObservable(({ input }) => ...)`, `fromTransition(fn, ({ input }) => initialState)`.
- `invoke.input` and `spawnChild(src, { input })`: static value or mapper `({ context, event, self }) => input`. No `params`.
  An invoke input mapper runs after the invoking state's `entry` actions, so it sees context assigned on entry.
- `spawn(src, { input })` inside `assign`/context factory: required when the logic declares input (≥ 5.19.1). With a string
  `src`, a function `input` is called with `{ context, event, self }`; with inline logic, pass a plain value.
- Input is not stored on the snapshot. Copy what you need into context. A restored snapshot (`createActor(m, { snapshot })`) keeps its
  persisted context; the input is not re-applied.
- **Not reactive.** Changing a component prop that fed `input` does not restart or update the actor. Send an event when the
  prop changes (e.g. in an effect: `actorRef.send({ type: 'userId.change', userId })`). Do not recreate the actor per render.
- Input replaces v4 machine factories and `machine.withContext(...)`.

## Output

Output is the actor's result once `snapshot.status === 'done'`.

```ts
import { setup, assign, createActor, toPromise } from 'xstate';

const checkoutMachine = setup({
  types: {
    context: {} as { orderId: string | null; total: number },
    events: {} as { type: 'pay'; orderId: string } | { type: 'cancel' },
    output: {} as { status: 'paid' | 'cancelled'; orderId: string | null; total: number },
  },
}).createMachine({
  context: { orderId: null, total: 42 },
  initial: 'paying',
  states: {
    paying: {
      on: {
        pay: { target: 'paid', actions: assign({ orderId: ({ event }) => event.orderId }) },
        cancel: 'cancelled',
      },
    },
    // Final-state output feeds the root mapper's `event.output`
    paid: { type: 'final', output: { status: 'paid' } },
    cancelled: { type: 'final', output: { status: 'cancelled' } },
  },
  // Machine output: computed when a top-level final state is reached.
  // `event` is the done-state event; its `output` is typed `unknown`, so cast it.
  output: ({ context, event }) => ({
    status: (event.output as { status: 'paid' | 'cancelled' }).status,
    orderId: context.orderId,
    total: context.total,
  }),
});

const actor = createActor(checkoutMachine);
const result = toPromise(actor); // resolves with snapshot.output on 'done', rejects on 'error'
actor.start();
actor.send({ type: 'pay', orderId: 'o_1' });
console.log((await result).status);
```

Rules (from `stateUtils.getMachineOutput`):

- `snapshot.output` comes **only** from the root `output`. If the root has no `output`, `snapshot.output` is `undefined` even when
  the final state defines one.
- A final state's own `output` (`{ type: 'final', output: ({ context, event }) => ... }`) is used for:
  - the `xstate.done.state.<parentId>` event → `onDone` of the parent compound state reads `event.output`;
  - for a top-level final state, the root `output` mapper's `event.output` (typed `unknown`; cast it, or derive everything from
    context). Do not read `self.getSnapshot()` inside output mappers: the snapshot is not committed yet, so it still shows the
    previous state.
- Parents read child output in `invoke.onDone` as `event.output` (event type `xstate.done.actor.<id>`; `event.actorId` ≥ 5.14.0).
  Output is typed when `src` references a `setup({ actors })` key.
- Static output objects with function values trigger a dev warning ("Dynamically mapping values to individual properties is
  deprecated"). Use one mapper function that returns the whole object.
- `toPromise(actor)` (≥ 5.2.0) does not start the actor. It resolves with `undefined` if a root actor is stopped before reaching
  done (stop completes observers); check `getSnapshot().status` when that matters.
- `OutputFrom<typeof machine>` extracts the output type. Promise actors' output is the resolved value; `fromTransition` and
  `fromCallback` actors never produce output.

## Custom actions

### Named actions in `setup` (preferred)

```ts
import { setup } from 'xstate';

declare const analytics: { track(name: string, props?: Record<string, unknown>): void };

const feedbackMachine = setup({
  types: {
    context: {} as { rating: number },
    events: {} as { type: 'rate'; value: number } | { type: 'submit' },
  },
  actions: {
    // Second argument is params. Type it here; setup infers the action object's params from it.
    track: (_, params: { name: string; props?: Record<string, unknown> }) => {
      analytics.track(params.name, params.props);
    },
    focusInput: () => {
      document.querySelector<HTMLInputElement>('#feedback')?.focus();
    },
  },
}).createMachine({
  context: { rating: 0 },
  entry: 'focusInput', // string shorthand for a param-less action
  on: {
    rate: {
      actions: [
        // Static params
        { type: 'track', params: { name: 'rated' } },
        // Dynamic params: ({ context, event }) => params — event is narrowed to 'rate' here
        { type: 'track', params: ({ event }) => ({ name: 'rated', props: { value: event.value } }) },
      ],
    },
  },
});
```

Why named + params: implementations can be swapped with `provide` (tests, platforms), the config stays serializable and visible in
inspection by type name, and an action that only reads `params` does not depend on the machine's context/event types, so it can be
shared across machines.

- Implementation signature: `(args, params) => void`, where `args` is `{ context, event, self, system }`.
- A dynamic `params` function receives only `{ context, event }` (no `self`/`system`).
- With `setup`, referencing an action name that is not in `setup({ actions })` is a type error (≥ 5.8.0).
- Inline functions (`entry: ({ context }) => ...`) are fine for prototypes and one-offs; they show in inspection under the function
  name or `(anonymous)` and cannot be overridden with `provide`.
- Without `setup`, type action objects via `types.actions: { type: 'track'; params: {...} } | ...`. Prefer `setup`.
- Event narrowing: inside `on: { rate: { actions } }` the event is `{ type: 'rate' ... }`. In `entry`/`exit` the event is the union
  of whatever caused entry; use `assertEvent(event, 'rate')` (throws on mismatch; prefix wildcards like `'feedback.*'` ≥ 5.25.0) or
  pass data via dynamic params.

### Side-effect best practices

- Keep effects in custom actions or actors, never in `assign`, guards, `params` functions, `input`/`output` mappers, or delay
  functions. Those run during pure resolution — also inside `transition()`, `getNextSnapshot()`, and `xstate/graph` traversal — where
  custom actions are only collected, not executed.
- Actions are fire-and-forget. Anything async whose result matters (fetch, timers you need to cancel, subscriptions) belongs in an
  invoked/spawned actor (`fromPromise`, `fromCallback`) so the state machine gets `onDone`/`onError` and automatic cleanup on exit.
- A custom action that throws puts the whole actor into `status: 'error'` (and the parent receives `xstate.error.actor.<id>`). There
  is no `escalate`; throw normally, or catch inside the action if failure is non-fatal.
- Custom actions run synchronously while the transition is being processed, with `context` as of that point in the action list.

## Execution order

For one microstep (one transition):

1. `exit` actions, deepest state first; for each exited state, its `exit` actions then stopping its invoked actors.
2. Transition `actions`, in array order.
3. `entry` actions, outermost state first; for each entered state: `entry` actions → start its `invoke`s → `initial` transition
   actions (`initial: { target, actions }`).

Within that list, actions resolve **in order**, and each `assign` immediately updates the context seen by later actions and later
dynamic `params` (v5 always behaves like v4's `predictableActionArguments: true`).

```ts
actions: [
  ({ context }) => console.log(context.count), // old value
  assign({ count: ({ context }) => context.count + 1 }),
  ({ context }) => console.log(context.count), // new value
],
```

Then:

- Raised (non-delayed) events go to the **internal queue** and are processed after the current microstep, before any external
  event. Eventless `always` transitions are checked after each microstep. All of this forms one macrostep; subscribers see one
  snapshot at the end.
- `sendTo`, `emit`, `spawnChild` start, delayed `raise`, and `cancel` are **deferred** until the snapshot is committed, so recipients
  and listeners observe the sender's updated snapshot.
- The initial snapshot (context factory, initial `assign`s, guards) is computed inside `createActor(...)`; initial custom actions
  and deferred built-ins (`entry` with the `xstate.init` event) execute on `actor.start()`. Keep effects out of the context factory.

## Built-in actions

All of these return action objects. Import them from `xstate`. Each accepts static values or expressions `({ context, event, self,
system }, params) => value` unless noted.

### `assign`

```ts
import { assign } from 'xstate';

// Property form: per-key static value or assigner
assign({
  count: ({ context, event }) => context.count + 1,
  status: 'saving',
});

// Function form: return a partial context; shallow-merged into the current context
assign(({ context, event }) => ({ count: context.count + 1, lastEvent: event.type }));

// Reusable with params (in setup actions)
setup({
  actions: {
    setFilter: assign((_, params: { filter: 'all' | 'done' }) => ({ filter: params.filter })),
  },
});
// usage: { type: 'setFilter', params: { filter: 'done' } }
```

- Assigner args: `{ context, event, spawn, self, system }`, second arg `params`.
- Merge is shallow (`Object.assign({}, context, partial)`): nested objects must be rebuilt (spread or `produce`).
- In the property form, a **function value is always called as an assigner**. To store a function in context, wrap it:
  `assign({ onSave: () => handler })`.
- `spawn` inside `assign` creates a child and stores its ref: `assign({ ref: ({ spawn }) => spawn('worker', { id: 'w1' }) })`.

### `raise`

Send an event to the machine itself.

```ts
raise({ type: 'validate' });
raise(({ context }) => ({ type: 'retry', attempt: context.attempt }));
raise({ type: 'timeout' }, { delay: 5000, id: 'request-timeout' }); // delayed; cancellable by id
raise({ type: 'ping' }, { delay: 'pingInterval' });                 // delay key from setup({ delays })
raise({ type: 'ping' }, { delay: ({ context }) => context.backoffMs });
```

- Event must be an object; `raise('x')` throws.
- No delay → internal queue (processed in the same macrostep). With a numeric delay → scheduled on the system clock
  (not the internal queue), delivered later as an external event.
- `id` is a static string. For a computed id use `enqueueActions` (`enqueue.raise(ev, { id: \`t-${context.key}\`, delay })`).

### `sendTo`

Send an event to another actor.

```ts
sendTo('child', { type: 'start' });                                     // by child id (invoke id / spawn id)
sendTo(({ context }) => context.workerRef, ({ event }) => ({ type: 'job', payload: event.payload }));
sendTo(({ system }) => system.get('notifier')!, { type: 'notify' });   // by systemId
sendTo('child', { type: 'poll' }, { delay: 1000, id: 'poll-child' });  // delayed + cancellable
sendTo(({ context }) => context.replyTo, ({ self }) => ({ type: 'reply', from: self }));
```

- Target forms: actor ref, string child id, `({ context, event, self, system }, params) => ref | string`.
- A string id is looked up in **the sender's `snapshot.children` at resolve time**. Missing id → throws "Unable to send event to
  actor '...'" and the sender errors. Exception: children invoked by states being entered in the same transition are resolved later,
  so `entry: sendTo('childInvokedHere', ...)` works.
- **A target function that returns `undefined`/`null` sends the event to the sender itself** (source:
  `targetActorRef = resolvedTarget || actorScope.self`). Guard for missing refs (`system.get(...)` before registration, a
  `null` ref in context) or you will create self-delivered events or loops.
- There is no `systemId` option on `sendTo`; use `({ system }) => system.get(id)` (actors register via `invoke`/`spawn` `systemId`).
- Event must be an object. When the target is a typed ref, the event is type-checked against that actor's events.
- Prefer passing refs explicitly (input, event payload, context) over hard-coded child ids or `sendParent` — it decouples actors and
  keeps types.

### `sendParent` and `forwardTo`

```ts
sendParent({ type: 'child.done' });                    // shorthand for sendTo('#_parent', ...)
sendParent(({ context }) => ({ type: 'progress', pct: context.pct }));
forwardTo('child');                                    // re-send the current event unchanged
forwardTo(({ context }) => context.workerRef);
```

- `sendParent` from a root actor (no parent) throws. Untyped against the parent. Prefer `sendTo(({ context }) => context.parentRef, ...)`
  with the parent ref passed through `input: ({ self }) => ({ parentRef: self })`.
- `forwardTo` adds a dev-only check that throws if the target resolves to nothing (the same self-send risk as `sendTo`).

### `emit` (≥ 5.9.0)

Emit an event to external listeners registered with `actor.on(...)`. Not an event the machine (or parent) receives. See
[Event emitter](#event-emitter).

```ts
emit({ type: 'saved' });
emit(({ context }) => ({ type: 'count.changed', count: context.count }));
```

### `log`

```ts
log();                                             // logs { context, event }
log('entered loading');
log(({ context }) => `retries=${context.retries}`, 'retry'); // logger(label, value)
```

Uses the actor system's `logger` (`createActor(m, { logger })`, propagated to all actors in the system ≥ 5.10.0); defaults to
`console.log`.

### `cancel`

```ts
cancel('request-timeout');
cancel(({ context }) => `poll-${context.jobId}`); // dynamic id allowed here
```

Cancels a pending delayed `raise`/`sendTo` scheduled **by this actor** with that id. No-op if already fired or unknown. Delayed events
from `after` are cancelled automatically when their state exits; all of an actor's scheduled events are cancelled when it stops.

### `spawnChild`

Start a child actor without storing a ref in context (≥ 5.0).

```ts
spawnChild('worker', {
  id: 'worker-1',               // string or ({ context, event, self }) => string
  systemId: 'worker',           // optional global registration
  input: ({ context }) => ({ jobId: context.jobId }),
  syncSnapshot: false,          // true → parent receives snapshot events (onSnapshot-style)
});
```

- Always pass an `id` if you will `sendTo`/`stopChild` it later; access it via `snapshot.children[id]`.
- Use `spawnChild` when you address the child by id; use `assign({ ref: ({ spawn }) => spawn(...) })` when you need the ref in
  context (lists of children, passing refs around). Spawned children live until stopped or the parent stops — unlike `invoke`, they are
  not tied to a state.

### `stopChild`

```ts
stopChild('worker-1');
stopChild(({ context }) => context.workerRef);
```

Stops a child of this actor (by id or ref) and unregisters its `systemId` (nested children too, ≥ 5.25.1). Pending events already
sent to it are processed first. Unknown id → no-op. Also clear the ref from context in the same transition
(`assign({ workerRef: undefined })`) so later `sendTo(({ context }) => context.workerRef, ...)` does not fall through to self.
`stop` is a deprecated alias of `stopChild`.

### `enqueueActions`

Compute a list of actions from context/event/guards at resolve time. Replaces v4 `pure` and `choose`.

```ts
import { setup, enqueueActions, log } from 'xstate';

const machine = setup({
  types: {
    context: {} as { visits: number; userId: string | null },
    events: {} as { type: 'visit' },
  },
  guards: {
    isFirstVisit: ({ context }) => context.visits === 0,
    isLoggedIn: ({ context }) => context.userId !== null,
  },
  actions: {
    track: (_, params: { name: string }) => {},
    // An enqueueActions defined here cannot enqueue sibling named actions by string
    // (they are not typed yet); keep named building blocks as plain functions.
    greet: (_, params: { name: string }) => console.log(`Hello, ${params.name}`),
  },
}).createMachine({
  context: { visits: 0, userId: null },
  on: {
    visit: {
      actions: enqueueActions(({ context, event, enqueue, check, self, system }) => {
        if (check('isFirstVisit')) {
          enqueue({ type: 'track', params: { name: 'first_visit' } });
        }
        if (check({ type: 'isLoggedIn' }) && !check(({ context }) => context.visits > 100)) {
          enqueue({ type: 'greet', params: { name: 'returning' } });
        }
        enqueue.assign({ visits: context.visits + 1 });
        enqueue(log('visit counted'));       // any action object or function
        enqueue(() => console.log('inline'));
        // enqueue.raise / sendTo / sendParent / emit / cancel / spawnChild / stopChild also exist
      }),
    },
  },
});
```

- Callback args: `{ context, event, enqueue, check, self, system }` (`self`/`system` ≥ 5.3.1), plus `params` as the second argument
  for named enqueue actions (≥ 5.9.0).
- `enqueue` helpers: `assign`, `raise`, `sendTo`, `sendParent` (≥ 5.16.0), `emit`, `cancel`, `spawnChild`, `stopChild`. No
  `enqueue.log` — use `enqueue(log(...))`.
- The callback runs once, synchronously. Nothing enqueued after an `await` or in a callback is collected. Do not perform effects in
  the callback itself; enqueue them.
- `context` and `check(...)` in the callback see the context **before** any action enqueued in that same callback runs. If you need
  the new value, compute it locally and pass it along.
- Enqueued actions run in enqueue order, inline with the rest of the action list.

## Setup-bound action helpers

≥ 5.22.0: the object returned by `setup(...)` has `assign`, `sendTo`, `raise`, `log`, `cancel`, `stopChild`, `enqueueActions`, `emit`,
`spawnChild`, and `createAction(fn)`, pre-typed to that setup's context, events, actors, guards, delays, and emitted events. Use them to
define reusable actions outside the machine config without generic noise.

```ts
const s = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'inc'; by: number } | { type: 'reset' },
    emitted: {} as { type: 'count.changed'; count: number },
  },
});

const increment = s.assign({ count: ({ context }) => context.count + 1 });
const announce = s.emit(({ context }) => ({ type: 'count.changed', count: context.count }));
const report = s.createAction(({ context }) => console.log(context.count));

const counter = s.createMachine({
  context: { count: 0 },
  on: { inc: { actions: [increment, announce, report] } },
});
```

These helpers are typed with the full event union (not narrowed per transition); use `assertEvent` when you need a specific event's
payload. `sendParent`/`forwardTo` have no setup-bound version. `s.extend({ actions, guards, delays })` (≥ 5.24.0) adds implementations to
a base setup.

## Event emitter

≥ 5.9.0. Emitted events are for **external** observers (UI toasts, analytics, logging bridges); they are not processed by the
machine or by its parent.

```ts
import { setup, emit, assign, createActor } from 'xstate';

const machine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'inc' },
    emitted: {} as { type: 'count.changed'; count: number } | { type: 'limit.reached' },
  },
}).createMachine({
  context: { count: 0 },
  on: {
    inc: {
      actions: [
        assign({ count: ({ context }) => context.count + 1 }),
        emit(({ context }) => ({ type: 'count.changed', count: context.count })), // sees the new count
      ],
    },
  },
});

const actor = createActor(machine);
const sub = actor.on('count.changed', (e) => console.log(e.count)); // typed payload
actor.on('*', (e) => console.log('any emitted', e.type));           // wildcard ≥ 5.13.1
actor.start();
actor.send({ type: 'inc' });
sub.unsubscribe();
```

- Register handlers before or after `start()`; they are dropped when the actor completes, errors, or stops.
- Emission is deferred until the snapshot is committed. Handler exceptions are reported but do not crash the actor (≥ 5.20.2).
- All actor logic creators can emit (≥ 5.14.0): `fromPromise(({ emit }) => ...)`, `fromCallback(({ emit }) => ...)`,
  `fromObservable(({ emit }) => ...)`, `fromTransition((state, event, { emit }) => ...)`.
- A parent cannot `actor.on(...)` its children's emits through config. To react to a child inside the machine, have the child
  `sendTo` a ref it was given. Use `emit` for the outside world, `sendTo`/`sendParent` for actor-to-actor messages.
- Type with `types.emitted`; `EmittedFrom<typeof actor>` extracts the union.

## Delays, debounce, cancellation

Define named delays in `setup({ delays })` (number or `({ context, event }, params) => number`) and reference them by key in `after`,
`raise`, and `sendTo`. Named delays are typed and overridable with `provide`.

### Debounce with a re-entering state (preferred when the wait is a mode)

```ts
const search = setup({
  types: {
    context: {} as { query: string },
    events: {} as { type: 'query.change'; query: string },
  },
  delays: { debounce: 300 },
}).createMachine({
  context: { query: '' },
  initial: 'idle',
  states: {
    idle: {},
    debouncing: { after: { debounce: 'searching' } },
    searching: { /* invoke the search actor here */ },
  },
  on: {
    // Root-level transition to a child: the active child is exited and re-entered,
    // so every keystroke restarts the `after` timer (and cancels an in-flight search).
    'query.change': {
      target: '.debouncing',
      actions: assign({ query: ({ event }) => event.query }),
    },
  },
});
```

If the handler lives on `debouncing` itself (`debouncing: { on: { 'query.change': { target: 'debouncing' } } }`), add
`reenter: true`: a state targeting itself is not re-entered by default, so the old `after` timer would keep running.

### Debounce with `cancel` + delayed `raise` (when no state change is wanted)

```ts
on: {
  'query.change': {
    actions: [
      assign({ query: ({ event }) => event.query }),
      cancel('debounce'),                                           // MUST come before the raise
      raise({ type: 'query.commit' }, { delay: 300, id: 'debounce' }),
    ],
  },
  'query.commit': { actions: 'runSearch' },
},
```

Order matters: scheduling an id that is already pending does **not** clear the previous timer (`system.scheduler.schedule` overwrites
its bookkeeping but never calls `clearTimeout`). Without `cancel` first, the old timer still fires and the new one becomes
uncancellable.

### Other patterns

- **Timeout guard for a request**: `entry: raise({ type: 'timeout' }, { delay: 'requestTimeout', id: 'req-timeout' })`,
  `exit: cancel('req-timeout')` — or simply `after: { requestTimeout: 'failed' }`, which cancels on exit for you.
- **Per-item timers**: ids must be static in `raise`/`sendTo` options, so build dynamic ids inside `enqueueActions` and cancel with
  `cancel(({ event }) => \`item-${event.id}\`)`.
- **Tests**: pass `clock: new SimulatedClock()` to `createActor` and call `clock.increment(ms)` instead of real waiting.
- v5 never derives delayed-event ids from the event type; always pass an explicit `id` if you will cancel.

## Pure transition functions

These compute snapshots and collect actions without executing custom actions. Use them for server-side workflows, tests, and
debugging. Assigns and guards run; custom actions are returned as objects with `{ type, params, info, exec }`; built-ins that need a
runtime (`xstate.raise` with delay, `xstate.sendTo`, `xstate.spawnChild`, `xstate.emit`, ...) are also returned for you to handle.

```ts
import { initialTransition, transition, getMicrosteps, getNextSnapshot } from 'xstate';

const [s0, initActions] = initialTransition(machine, input);         // ≥ 5.19.0
const [s1, actions] = transition(machine, s0, { type: 'pay', orderId: 'o_1' }); // ≥ 5.19.0
for (const a of actions) {
  // Run your own custom actions; handle built-ins (raise/sendTo/spawnChild/emit) with your runtime
  if (!a.type.startsWith('xstate.')) a.exec?.(a.info, a.params);
}
const steps = getMicrosteps(machine, s1, { type: 'cancel' });       // [snapshot, actions][] ≥ 5.27.0
const next = getNextSnapshot(machine, s1, { type: 'cancel' });      // snapshot only, ≥ 5.5.0
const restored = machine.resolveState(JSON.parse(persisted));        // rehydrate before transition()
```

`getInitialMicrosteps(machine, input?)` (≥ 5.27.0) and `getNextTransitions(snapshot)` (≥ 5.26.0) also exist.

What does **not** exist in 5.x: function-form transitions such as `on: { EV: ({ context, event }) => ({ target, context }) }`. In
5.33.2, `TransitionConfigOrTarget` accepts only a target string, a transition config object, or an array of those. If you see function
transitions, the code targets a pre-release major (the 6.0 alpha line), not v5 — do not mix them into v5 machines.

Reducer-style logic without a statechart is `fromTransition((state, event, { self, system, emit }) => nextState, initialStateOrFn)`;
its state is `snapshot.context`, it accepts input, and it never produces output. It is pure only if it does not send or emit.

## Overriding with provide

```ts
const testMachine = feedbackMachine.provide({
  actions: {
    track: (_, params) => calls.push(params),   // same name, same params shape
    focusInput: () => {},
  },
  delays: { debounce: 0 },
  // guards, actors also overridable
});
```

`provide` returns a new machine; the original is unchanged. Keys are matched by name, so only named actions (setup or string/object
references) can be overridden — inline functions cannot. Note `provide` takes `{ actions: { ... } }`; the docs' cheatsheet example that
passes action implementations at the top level is wrong.

## Pitfalls

| Symptom / mistake | Why | Fix |
| --- | --- | --- |
| `entry: ({ context }) => { assign({ ... }) }` does nothing (dev warns for `assign`/`raise`/`sendTo`/`emit`) | Built-ins return action objects; calling one inside a custom action just builds an object (≥ 5.13.0 warns) | Put the built-in in the action list, or use `enqueueActions(({ enqueue }) => enqueue.assign(...))` |
| Action logs the old value | It is listed before the `assign` | Order actions: `assign` first, effects after |
| `context` in `enqueueActions` callback is stale after `enqueue.assign` | Enqueued actions resolve after the callback returns | Compute the new value locally and reuse it |
| Context mutated (`context.list.push`) | Shared static initial context, broken change detection | Return new objects from `assign`; use `produce` |
| Side effect inside `assign`/guard/params/input mapper | They run during pure resolution (`transition`, graph traversal) and may run more than once | Move effects into custom actions or actors |
| Function stored via `assign({ cb: myFn })` is called | Property-assigner function values are treated as assigners | `assign({ cb: () => myFn })` |
| `sendTo('child', ...)` throws "Unable to send event to actor" | Child not in `snapshot.children` (not invoked yet, already stopped, wrong id) | Send after the child exists, use a ref from context, or invoke it in the state you send from |
| Event unexpectedly handled by the sender | `sendTo(fn)` returned `undefined`/`null` → falls back to `self` | Guard the ref; clear refs with `stopChild` + `assign` together |
| `sendParent` throws in a root actor / tests | No parent | Pass `parentRef` via input; in isolated tests wrap the machine in a parent or provide a stub ref |
| Debounce fires twice | Re-raised with same `id` without `cancel` | `cancel(id)` before `raise(..., { id })`, or use a re-entering state with `after` |
| `after` timer not restarted on self-transition | Self-transitions don't re-enter by default | `reenter: true` |
| `raise('EVENT')` / `sendTo(x, 'EVENT')` throws | String events removed | `{ type: 'EVENT' }` |
| Async work in an action, result ignored | Actions are fire-and-forget | Invoke `fromPromise` and handle `onDone`/`onError` |
| `snapshot.output` undefined although final state has `output` | Only root `output` sets `snapshot.output` | Add root `output` (map `event.output` or derive from context) |
| `toPromise` resolves `undefined` | Actor was stopped before done | Check `getSnapshot().status === 'done'` |
| Prop change ignored by running actor | Input is read once | Send an event on prop change |
| Delay ignored: `raise(ev, { delay: 'slow' })` with no `delays.slow` | Unknown delay key resolves to `undefined` → event raised immediately | Define the key in `setup({ delays })` (typed there) |
| `entry` action needs event payload but event is a union | Entry can be caused by several events | `assertEvent(event, 'type')` or dynamic `params` from the transition |

## Stale API: v4 → v5

| v4 (stale) | v5 |
| --- | --- |
| `assign((ctx, e) => ...)`, actions `(ctx, e, meta)` | `assign(({ context, event }) => ...)`, actions `({ context, event, self, system }, params)` |
| `send(ev)` / `send(ev, { to })` | `raise(ev)` (self) / `sendTo(target, ev)` |
| `actions.send`, `import { actions } from 'xstate'` | named imports from `xstate` |
| `pure(() => [...])`, `choose([...])` | `enqueueActions(({ enqueue, check }) => ...)` |
| `respond(ev)` | `sendTo(({ event }) => event.replyTo, ev)` — put the sender's `self` in the request payload |
| `escalate(err)` | `throw err` in an action/actor; parent handles `onError` |
| `stop(ref)` | `stopChild(ref)` (`stop` is a deprecated alias) |
| `import { spawn } from 'xstate'` | `spawn` from `assign`/context-factory args, or `spawnChild(...)` |
| `{ type: 'greet', message: 'hi' }` | `{ type: 'greet', params: { message: 'hi' } }` |
| `predictableActionArguments: true` | default behavior; remove |
| `machine.withConfig({ actions })` | `machine.provide({ actions })` |
| `machine.withContext(ctx)`, machine factories | `input` + `context: ({ input }) => ...` |
| final state `data: ...`, `event.data` on `done.invoke.*` | `output: ...`, `event.output` on `xstate.done.actor.*` |
| `event.data` on `error.platform.*` | `event.error` on `xstate.error.actor.*` |
| `raise({ type: 'T' }, { delay })` + `cancel('T')` (id from type) | explicit `id` on the delayed action |
| `service.onDone(...)` | `actor.subscribe({ complete })` or `await toPromise(actor)` |
| `@xstate/immer` `assign` | `immer`'s `produce` inside `xstate`'s `assign` |
| `autoForward: true` | explicit `forwardTo('child')` / `sendTo` |
