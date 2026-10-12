# Actors, Invoke, Spawn, and the Actor System

Scope: the XState v5 actor model in depth (xstate 5.33.2). Covers every actor logic creator, snapshot statuses, `invoke` vs `spawnChild`/`spawn`, parent–child communication, the actor system (`systemId`, `system.get`), `waitFor`/`toPromise`, error propagation, stopping and cleanup, and proven actor-based architecture patterns. Persistence and the inspection API are covered in `persistence-inspection.md`.

## Contents

- Actor model in one page
- `createActor` and the `Actor` API
- Snapshot statuses
- Actor logic creators (machine, promise, callback, observable, event observable, transition, empty, custom)
- Choosing a logic creator
- `invoke`
- `spawnChild` and `spawn`
- Choosing invoke vs spawn
- Parent–child communication
- The actor system
- `waitFor` and `toPromise`
- Error handling
- Stopping and cleanup
- Architecture patterns
- Pitfalls
- Stale API (v4 → v5)

## Actor model in one page

An actor is a running process with private state. It only changes when it processes an event from its mailbox, one event at a time. It can (1) change its own state, (2) send events to actors it has a reference to, (3) create child actors. Nothing outside can read or mutate its internal state; others see only emitted **snapshots** (`getSnapshot()`, `subscribe`) and **emitted events** (`actor.on`).

XState consequences that matter when writing code:

- **Actor logic** (a machine, `fromPromise(...)`, ...) is a pure description. **Actors** are created from logic with `createActor(logic)` or by a parent machine via `invoke`/`spawnChild`/`spawn`.
- Every root actor creates an implicit **system**. All descendants share it, plus its clock, logger, scheduler, and inspection observers.
- Event delivery is asynchronous to the sender's transition: `sendTo` is executed after the sender's transition finishes, so the receiver reads the sender's *updated* snapshot. Transitions themselves are synchronous and zero-time.
- Parent–child is a strict tree. A child's completion and errors are sent to its parent as events (`xstate.done.actor.<id>`, `xstate.error.actor.<id>`). Only the root can be stopped directly.

## `createActor` and the `Actor` API

```ts
import { createActor } from 'xstate';

const actor = createActor(logic, {
  input,            // required (type error if missing, ≥ 5.6) when the logic declares a non-optional input
  id: 'root',       // id relative to parent; defaults to the sessionId
  systemId: 'app',  // register in the system registry
  snapshot,         // restore a persisted snapshot (see persistence-inspection.md)
  inspect,          // observer or function for inspection events (root only)
  logger,           // used by log(); inherited by children (≥ 5.10)
  clock,            // custom setTimeout/clearTimeout; SimulatedClock for tests; inherited (≥ 5.10)
});

actor.subscribe({ next: (s) => {}, error: (err) => {}, complete: () => {} });
actor.on('someEmitted', (e) => {}); // emitted events; '*' wildcard supported
actor.start();                       // idempotent; also starts invoked/spawned children
actor.send({ type: 'go' });          // event objects only; strings throw in dev
actor.getSnapshot();                 // last snapshot; safe before start()
actor.select((s) => s.context.count).subscribe((n) => {}); // ≥ 5.29, Readable with .get()
actor.stop();                        // root only
```

Facts verified in `createActor.ts`:

- `send` is bound, so `const { send } = actor` is safe.
- Sending to a stopped actor is a no-op with a dev-only `console.warn`.
- `subscribe` on an already stopped actor calls `complete` if it ended `done`, `error` if it ended `error`, and **nothing** if it ended `stopped`.
- `start()` registers `systemId`, starts the system scheduler (root only), calls `logic.start`, notifies observers with the initial snapshot, and starts the mailbox.
- `actor.id`, `actor.sessionId` (globally unique, like `x:3`), `actor.systemId` (public since 5.22.1), `actor.system`, `actor.src`, `actor.logic`.
- `interpret` is a deprecated alias of `createActor`; `devTools` option is typed `never` (deprecated).

## Snapshot statuses

`snapshot.status` is `'active' | 'done' | 'error' | 'stopped'` (type `SnapshotStatus`, exported ≥ 5.16).

| Status | Meaning | `output` | `error` | Observer callback |
| --- | --- | --- | --- | --- |
| `active` | running | `undefined` | `undefined` | `next` |
| `done` | reached a final state / promise resolved / observable completed | value | `undefined` | `next(doneSnapshot)` then `complete()` |
| `error` | threw, rejected, or unhandled child error | `undefined` | the error | `error(err)` |
| `stopped` | stopped by parent or `actor.stop()` | `undefined` | `undefined` | `complete()` |

A done snapshot is delivered to `next` before `complete`, so `waitFor(actor, s => s.status === 'done')` works. Use `snapshot.status === 'done'` — v4's `state.done` is gone.

## Actor logic creators

All creators are exported from `xstate`. Each receives `input`, `self`, `system`, and `emit` (emit on all creators ≥ 5.14).

### State machine logic — `createMachine` / `setup(...).createMachine`

Receives events, sends events, spawns/invokes children, has input and output. Use for anything with modes, rules about which events are valid when, or child orchestration. Typed via `setup({ types, actors, actions, guards, delays })`.

### Promise logic — `fromPromise`

```ts
import { fromPromise } from 'xstate';

type User = { id: string; name: string };

// Generics: <TOutput, TInput, TEmitted>
export const fetchUser = fromPromise<User, { userId: string }>(
  async ({ input, signal, self, system, emit }) => {
    const res = await fetch(`/api/users/${input.userId}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // -> status 'error' -> onError
    return (await res.json()) as User;                    // -> status 'done' -> onDone(event.output)
  },
);
```

- `signal` (≥ 5.13) is an `AbortSignal` aborted when the actor is stopped — e.g. the invoking state is exited. Pass it to `fetch` and any cancellable API. Without it the request keeps running; its result is ignored.
- Events sent to a promise actor are ignored. It cannot receive.
- A late resolve/reject after stop is dropped (`status !== 'active'` guard).
- Snapshot: `{ status, output, error, input }`. `input` is cleared when settled.
- Alternative typing: annotate the argument, `fromPromise(async ({ input }: { input: { userId: string } }) => ...)`.

### Callback logic — `fromCallback`

For long-lived, push-based, imperative resources: listeners, sockets, intervals, subscriptions to non-observable APIs.

```ts
import { fromCallback } from 'xstate';

type SocketIn = { type: 'socket.send'; data: string };

// Generics: <TEventReceived, TInput, TEmitted>
export const socketLogic = fromCallback<SocketIn, { url: string }>(
  ({ input, sendBack, receive, self, system, emit }) => {
    const ws = new WebSocket(input.url);
    ws.onopen = () => sendBack({ type: 'socket.open' });
    ws.onmessage = (e) => sendBack({ type: 'socket.message', data: String(e.data) });
    ws.onclose = (e) => sendBack({ type: 'socket.closed', code: e.code });

    receive((event) => {
      if (event.type === 'socket.send' && ws.readyState === WebSocket.OPEN) {
        ws.send(event.data);
      }
    });

    return () => ws.close(); // cleanup: runs when the actor is stopped
  },
);
```

- `sendBack(event)` relays to the **parent**. It is a silent no-op on a root actor (no parent) and after stop. `sendBack` is typed as `AnyEventObject` — it is not checked against the parent's events; keep event types in a shared union and use `satisfies` if you want checking.
- `receive(listener)` registers listeners for every event sent to this actor (`sendTo('socket', ...)`).
- The returned function is the disposer. Return it whenever you acquire anything.
- There is no "done": a callback actor never completes on its own and `onDone` never fires. Signal completion or failure by `sendBack({ type: 'x.done' })` / `sendBack({ type: 'x.failed', error })`.
- A synchronous throw in the callback body or in a `receive` listener puts the actor in `error` (parent gets `xstate.error.actor.<id>`). Throws in async handlers (e.g. inside `ws.onmessage`) are not caught by XState — catch them and `sendBack` an error event.
- Snapshot carries only `status` and `input`; there is no data to read, so `onSnapshot` is pointless.

### Observable logic — `fromObservable`

```ts
import { fromObservable } from 'xstate';
import { interval } from 'rxjs';

// Generics: <TContext (emitted value), TInput, TEmitted>
const ticks = fromObservable<number, { ms: number }>(({ input }) => interval(input.ms));
```

- Each emitted value becomes `snapshot.context` (use `onSnapshot` to react; event is `xstate.snapshot.<id>` with `event.snapshot.context`).
- Observable `complete` → status `done` (`onDone`, output `undefined`); observable `error` → status `error` (`onError`).
- Works with any `Subscribable` (RxJS, or any `{ subscribe(observer) }` returning `{ unsubscribe }`). Unsubscribed on stop.

### Event observable logic — `fromEventObservable`

```ts
import { fromEventObservable } from 'xstate';
import { fromEvent, map } from 'rxjs';

const keydowns = fromEventObservable(() =>
  fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    map((e) => ({ type: 'key.down' as const, key: e.key })),
  ),
);
```

Every emitted value must be an event object and is sent **to the parent** (not stored). Only useful as an invoked/spawned child. Completion and error behave like `fromObservable`.

### Transition (reducer) logic — `fromTransition`

```ts
import { fromTransition } from 'xstate';

type CountEvent = { type: 'inc' } | { type: 'dec' };

const counter = fromTransition(
  (count: number, event: CountEvent, { self, system, emit }) => {
    if (event.type === 'inc') return count + 1;
    if (event.type === 'dec') return count - 1;
    return count;
  },
  ({ input }: { input: { start: number } }) => input.start, // or a plain initial value
);
```

- State lives in `snapshot.context`. It never reaches `done` by itself.
- The initial-context factory is called with `{ input }` only. Its type mentions `self`, but source passes only `input` — do not read `self` there.
- Use when a full machine is overkill: a pure reducer whose valid events do not depend on mode.

### Empty actor — `createEmptyActor()`

Returns an **unstarted** actor whose snapshot is `{ status: 'active', context: undefined }` and ignores events. Use as a placeholder (e.g. framework hooks that need *an* actor before the real one exists) or a stub in tests.

### Custom logic

Any object implementing `ActorLogic` works: `transition(snapshot, event, actorScope)`, `getInitialSnapshot(actorScope, input)`, `getPersistedSnapshot(snapshot)`, optional `restoreSnapshot`, optional `start(snapshot, actorScope)`. Snapshots must include `status`, `output`, `error`. Wrap existing logic to add behavior (logging, metrics) by spreading it and overriding `transition`.

### Capability matrix

| Logic | Receives events | Sends to parent | Can spawn | Input | Output / done |
| --- | --- | --- | --- | --- | --- |
| machine | yes | `sendParent`/`sendTo` | yes | yes | yes (final state + `output`) |
| `fromPromise` | no | via `system`/refs only | no | yes | yes (resolved value) |
| `fromCallback` | yes (`receive`) | `sendBack` | no | yes | no |
| `fromObservable` | no | no (snapshots only) | no | yes | completes with `undefined` |
| `fromEventObservable` | no | yes (every value) | no | yes | completes with `undefined` |
| `fromTransition` | yes | via `self`/`system` refs | no | yes | no |

## Choosing a logic creator

- One async request/response with a result → `fromPromise`. Always use `signal`.
- Subscription, socket, DOM/Node listener, `setInterval`, SDK with callbacks → `fromCallback` with a disposer.
- Existing RxJS/observable stream of values → `fromObservable`; stream of events for the parent → `fromEventObservable`.
- Pure reducer with no modes → `fromTransition` (or `@xstate/store` outside of machines).
- Anything with modes, retries, timeouts, multiple steps, or children → a machine.

## `invoke`

An invocation is a child actor whose lifetime equals the time the declaring state is active. It starts on entry and stops on exit.

```ts
import { assign, setup } from 'xstate';

export const userMachine = setup({
  types: {
    context: {} as { userId: string; user: User | null; error: string | null },
    events: {} as { type: 'retry' },
    input: {} as { userId: string },
  },
  actors: { fetchUser },
}).createMachine({
  id: 'user',
  context: ({ input }) => ({ userId: input.userId, user: null, error: null }),
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        id: 'fetchUser',      // child id: snapshot.children.fetchUser, xstate.done.actor.fetchUser
        src: 'fetchUser',     // key in setup({ actors }) — typed input/output
        input: ({ context }) => ({ userId: context.userId }), // also gets event, self
        onDone: {
          target: 'success',
          actions: assign({ user: ({ event }) => event.output }),
        },
        onError: {
          target: 'failure',
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    success: { type: 'final' },
    failure: { on: { retry: 'loading' } },
  },
});
```

Properties:

- `src` — a key from `setup({ actors })` / `.provide({ actors })` (preferred), or inline logic. Inline logic gets a synthetic src `xstate.invoke.<index>.<stateNodeId>`; inline is allowed alongside named actors since 5.11. With `setup` actors declared, inline `src` cannot have an `id` at the type level (`id?: never`) — move it to `setup({ actors })` if you need an id.
- `id` — default `${index}.${stateNodeId}` (e.g. `0.user.loading`). Set it explicitly so events and `sendTo('id')` are readable.
- `systemId` — registers the child in the system registry (see below).
- `input` — static value or `({ context, event, self }) => input`. `event` is the event that caused entry.
- `onDone` — event `xstate.done.actor.<id>` with `event.output` and `event.actorId` (≥ 5.14).
- `onError` — event `xstate.error.actor.<id>` with `event.error` and `event.actorId`.
- `onSnapshot` — event `xstate.snapshot.<id>` with `event.snapshot`. Setting it turns on `syncSnapshot`; only **active** snapshots are relayed (not the final done one).
- Arrays: `invoke: [{...}, {...}]` start several children; each `invoke` entry is a separate instance even with the same `src`.
- Root-level `invoke` lives as long as the machine.

Lifecycle rules:

- Entering then immediately leaving a state in the same macrostep (e.g. via `always`) never starts its invocations.
- Transitions are not re-entering by default: moving between child states of the invoking state does not restart the invocation. A self-transition with `reenter: true` stops and restarts it.
- A done/error event from a stale invocation cannot hit a different state's handlers: `onDone`/`onError` are registered on the invoking state only.

## `spawnChild` and `spawn`

Spawned actors live until they finish, are stopped with `stopChild`, or the parent stops. State exits do **not** stop them.

### `spawnChild` action (preferred when you do not need the ref in context)

```ts
import { setup, spawnChild, stopChild, sendTo } from 'xstate';

const machine = setup({
  types: { context: {} as { sessionId: string } },
  actors: { analytics: analyticsLogic },
}).createMachine({
  context: { sessionId: 'abc' },
  entry: spawnChild('analytics', {
    id: 'analytics',                                  // always pass an id
    systemId: 'analytics',                            // optional, system-wide
    input: ({ context }) => ({ sessionId: context.sessionId }),
    syncSnapshot: false,                              // true → parent receives xstate.snapshot.analytics
  }),
  on: {
    track: { actions: sendTo('analytics', ({ event }) => event) },
    shutdown: { actions: stopChild('analytics') },
  },
});
```

`id` can be a function `({ context, event }) => string` for dynamic ids. **Always pass `id`**: without it, source stores the child under the key `"undefined"` in `snapshot.children`, so two id-less spawns collide and `sendTo`/`stopChild` by id cannot find them.

### `spawn` inside `assign` (when the ref must live in context)

```ts
import { assign, setup, stopChild, type ActorRefFrom } from 'xstate';

export const todosMachine = setup({
  types: {
    context: {} as { todos: ActorRefFrom<typeof todoMachine>[] },
    events: {} as
      | { type: 'todo.add'; title: string }
      | { type: 'todo.remove'; id: string },
  },
  actors: { todo: todoMachine },
}).createMachine({
  context: { todos: [] },
  on: {
    'todo.add': {
      actions: assign({
        todos: ({ context, event, spawn }) => {
          const id = crypto.randomUUID();
          return [...context.todos, spawn('todo', { id, input: { id, title: event.title } })];
        },
      }),
    },
    'todo.remove': {
      actions: [
        stopChild(({ event }) => event.id),
        assign({ todos: ({ context, event }) => context.todos.filter((t) => t.id !== event.id) }),
      ],
    },
  },
});
```

- `spawn` is available in `assign` property/function assigners and in the `context` factory: `context: ({ spawn, input, self }) => ({ ref: spawn('child', { id: 'child' }) })` (`self` there ≥ 5.4).
- `spawn` options: `id`, `systemId`, `input`, `syncSnapshot`. Spawning by string key resolves the key against `setup({ actors })`; spawning inline logic (`spawn(fromPromise(...))`) works but cannot be persisted and, with named actors declared, cannot take an `id` at the type level.
- Removing a child takes two steps: `stopChild(...)` then `assign` to drop the ref. Stopping does not remove the ref from context; removing the ref does not stop the actor. Do both or you leak.
- Spawned refs are also listed in `snapshot.children[id]`.

### `stopChild`

`stopChild(idOrRefOrFn)` accepts a child id string, an `ActorRef`, or `({ context, event }, params) => ref | id`. It stops only **direct children**; the actor scope throws if the ref is not its child. It unregisters the child's `systemId` (and its nested children's, fixed in 5.25.1) immediately, so a replacement with the same `systemId` can be registered in the same step. `stop` is a deprecated alias.

## Choosing invoke vs spawn

| Need | Use |
| --- | --- |
| Work that belongs to one state (fetch while `loading`, listener while `connected`) | `invoke` |
| Automatic cancel when leaving the state | `invoke` |
| `onDone`/`onError` transitions scoped to a state | `invoke` |
| Dynamic number of children (list items, uploads, sessions) | `spawn` in `assign` |
| Child that must outlive several states | `spawnChild` / `spawn` |
| Fire-and-forget background worker addressed by id | `spawnChild` with `id` |

Prefer invoke by default: its lifecycle is declarative and leak-free. Spawn when the lifetime is not tied to a state; then you own stopping.

Handling completion of spawned children: done and error events still go to the parent as `xstate.done.actor.<id>` / `xstate.error.actor.<id>`. Handle them with `on`. With `setup({ types: { events } })` (checked on 5.33.2), a literal `'xstate.done.actor.todo-1'` key compiles with a plain target, but inline implementations on that key get an untyped (`any`) `event`, which fails under `noImplicitAny`. The robust pattern is for the child to `sendParent` an explicit domain event, or to handle `onDone` on an invoke instead, where `event.output` is typed.

## Parent–child communication

| Direction | Mechanism |
| --- | --- |
| Parent → child | `sendTo('childId', event)`, `sendTo(({ context }) => context.ref, event)`, or `enqueue.sendTo(...)` |
| Child → parent | `sendParent(event)` (machines), `sendBack` (callback), `fromEventObservable` values, done/error events automatically |
| Child → parent (typed, decoupled) | pass the parent ref as input: `input: ({ self }) => ({ parent: self })`, child does `sendTo(({ context }) => context.parent, ...)` |
| Child → anyone | `sendTo(({ system }) => system.get('notifier'), event)` |
| Child state → parent | `onSnapshot` (invoke) or `syncSnapshot: true` (spawn) → `xstate.snapshot.<id>` |
| Actor → external listeners | `emit(...)` action / `emit` arg in creators → `actor.on(type, handler)` |
| Request/response | include `replyTo: self` in the event; receiver does `sendTo(({ event }) => event.replyTo, ...)` |

Verified `sendTo` resolution rules (from `actions/send.ts`):

- A **string** target resolves only against `snapshot.children` (direct children). It does not look up `systemId`. Unknown string → throws `Unable to send event to actor '<id>' from machine '<machineId>'`.
- A **function** target that returns `undefined` sends the event to **self** (source: `resolvedTarget || actorScope.self`). `sendTo(({ system }) => system.get('notifier'), ...)` before `notifier` is registered silently loops back. Guard it: check the ref first in `enqueueActions`.
- `sendTo(target, event, { delay, id })` schedules via the system scheduler; cancel with `cancel(id)`.
- Events sent by actions are delivered after the current transition completes (outgoing queue).

Emitted events are not delivered to the parent. To bridge a child's emitted events into the parent, wrap them in a callback actor:

```ts
const bridge = fromCallback<never, { child: AnyActorRef }>(({ input, sendBack }) => {
  const sub = input.child.on('progress', (e) => sendBack(e));
  return () => sub.unsubscribe();
});
```

## The actor system

- Created implicitly by the root `createActor`. Reach it via `actor.system` or `{ system }` in actions, guards, `input` mappers, and every logic creator.
- `systemId` registers an actor globally: on `createActor(logic, { systemId })`, `invoke.systemId`, `spawnChild(..., { systemId })`, `spawn(..., { systemId })`.
- `system.get(systemId)` returns the ref or `undefined`. It is typed loosely (`AnyActorSystem`), so cast with `ActorRefFrom<typeof logic>` if needed.
- `system.getAll()` (≥ 5.23) returns `{ [systemId]: ref }` for registered running actors.
- Registering a second actor under a taken `systemId` throws `Actor with system ID '<id>' already exists.` Stopped and done actors are unregistered. Use dynamic ids for list items (`todo-${id}`).
- `system.inspect(observerOrFn)` adds an inspection observer and returns a subscription (≥ 5.14). See `persistence-inspection.md`.
- `system.scheduler` (`schedule`, `cancel`, `cancelAll`) is public on the type but is the engine behind delayed events. Use `after`, delayed `raise`/`sendTo`, and `cancel` instead of calling it.
- Stopping: only the root can be stopped (`actor.stop()`); calling `.stop()` on a child throws `A non-root actor cannot be stopped directly.`

Use `systemId` for true singletons (auth, notifier, logger, websocket hub). Do not use it to dodge passing refs between parent and child — explicit refs keep dependencies visible.

## `waitFor` and `toPromise`

```ts
import { waitFor, toPromise } from 'xstate';

const snap = await waitFor(actor, (s) => s.matches('success') || s.status === 'error', {
  timeout: 10_000,          // default Infinity (v4 default was 10 s)
  signal: controller.signal // ≥ 5.18
});

const output = await toPromise(actor); // ≥ 5.2
```

`waitFor(actorRef, predicate, { timeout?, signal? })`:

- Checks the current snapshot first and resolves immediately if it matches.
- Rejects with `Timeout of <n> ms exceeded`, with `signal.reason` on abort, with the actor's error if it errors, or with `Actor terminated without satisfying predicate` if it completes (done or stopped) without a match.
- Subscribing to an actor that is **already** stopped calls neither callback, so `waitFor` on a stopped actor whose current snapshot does not match only settles via `timeout`/`signal`. Always pass a `timeout` in servers and tests.

`toPromise(actor)`:

- Resolves with `snapshot.output` on `complete`, rejects with the error on `error`.
- `complete` also fires on `stop`, so stopping an unfinished actor resolves the promise with `undefined`.
- If the actor is already stopped with status `stopped`, the promise never settles.
- It does not start the actor; call `start()` (before or after).

## Error handling

How errors move (verified in `createActor.ts` and `stateUtils.ts`):

1. An action, guard, `input` mapper, or `assign` throws during a machine transition → the machine snapshot becomes `status: 'error'`. There is no `escalate` in v5; throwing is the escalation.
2. A child enters `error` (promise rejects, callback throws, observable errors, machine errors) → the parent receives `xstate.error.actor.<childId>` with `{ error, actorId }`.
3. If the parent has **no transition** for that event (`onError`, or an `on` handler matching it), the parent itself goes to `error` with the same error. This cascades to the root. A wildcard `'*'` handler currently also matches error events — be aware it can swallow child errors.
4. At the root, the error is passed to every observer's `error` callback. If there are no observers, or any observer lacks an `error` callback (e.g. `actor.subscribe(fn)`), the error is rethrown in a `setTimeout` (`reportUnhandledError`) — an uncaught exception that crashes Node processes by default.

Do:

- Give every `invoke` that can fail an `onError`, and every spawned child that can fail an `on: { 'xstate.error.actor.<id>': ... }` or a wrapper that converts failures into domain events.
- Subscribe root actors with an `error` callback (`actor.subscribe({ next, error })`), especially in servers.
- Model failure as states (`failure`, `retrying`) with data in context, not as thrown exceptions you catch elsewhere.

Don't:

- Use `async` actions for I/O. Actions are fire-and-forget; rejected promises from them are not seen by XState. Move I/O into `fromPromise` and invoke it.
- Rely on `try/catch` around `actor.send(...)`. Errors surface via the error status and observers, not by throwing from `send`.

Retry with backoff is a state pattern:

```ts
loading: {
  invoke: {
    src: 'fetchUser',
    input: ({ context }) => ({ userId: context.userId }),
    onDone: { target: 'success', actions: assign({ user: ({ event }) => event.output }) },
    onError: [
      { guard: ({ context }) => context.attempt < 3, target: 'backoff' },
      { target: 'failure', actions: assign({ error: ({ event }) => String(event.error) }) },
    ],
  },
},
backoff: {
  entry: assign({ attempt: ({ context }) => context.attempt + 1 }),
  after: { retryDelay: 'loading' }, // delays: { retryDelay: ({ context }) => 2 ** context.attempt * 250 }
},
```

## Stopping and cleanup

`actor.stop()` on the root, or exiting an invoking state, or `stopChild`, does the following:

- Cancels the actor's pending delayed events (`after`, delayed `sendTo`/`raise`).
- Stops all children recursively (machine actors stop their `snapshot.children`).
- Promise actors: aborts `signal`. Callback actors: clears `receive` listeners and runs the disposer. Observable actors: unsubscribes.
- Sets status `stopped`, calls observers' `complete`, clears observers and `on` listeners, unregisters from the system.
- **Does not run exit actions** of the machine's active states. Put teardown that must run on stop into callback-actor disposers, not exit actions.

Stopping is processed through the mailbox: events already queued for the child (e.g. from exit actions on the invoking state) are handled before the stop.

## Architecture patterns

### List of items (spawn per item)

The `todosMachine` above: parent owns the collection, each item is a machine with its own modes (`viewing`/`editing`), refs in `context`. UI subscribes to each item ref separately so one item's change does not re-render the list. Items talk to the list via `sendParent({ type: 'todo.changed', ... })` or by having the parent read item snapshots.

### Request/response

```ts
// requester
sendTo('server', ({ self }) => ({ type: 'request', replyTo: self, payload: 42 }));
// responder
on: {
  request: {
    actions: sendTo(({ event }) => event.replyTo, ({ event }) => ({ type: 'response', result: event.payload * 2 })),
  },
},
```

Type `replyTo` as `ActorRef<any, ResponseEvent>` (or `AnyActorRef`). This replaces v4's `respond()`.

### WebSocket / subscription as a callback actor

Invoke `socketLogic` (above) at the state where the connection should exist (`connected`, or root for app-lifetime). Route outbound messages with `sendTo('socket', ...)`. Reconnect is a state transition (`socket.closed` → `reconnecting` with `after` → back to the invoking state), so cleanup and restart are automatic.

### Debounced search with cancellation

```ts
const searchMachine = setup({
  types: {
    context: {} as { query: string; results: string[] },
    events: {} as { type: 'search.change'; query: string },
  },
  actors: {
    search: fromPromise<string[], { query: string }>(async ({ input, signal }) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(input.query)}`, { signal });
      return res.json();
    }),
  },
  delays: { debounce: 300 },
}).createMachine({
  context: { query: '', results: [] },
  initial: 'idle',
  states: {
    idle: {
      on: { 'search.change': { target: 'debouncing', actions: assign({ query: ({ event }) => event.query }) } },
    },
    debouncing: {
      after: { debounce: 'searching' },
      on: {
        // reenter restarts the `after` timer
        'search.change': { target: 'debouncing', reenter: true, actions: assign({ query: ({ event }) => event.query }) },
      },
    },
    searching: {
      invoke: {
        src: 'search',
        input: ({ context }) => ({ query: context.query }),
        onDone: { target: 'idle', actions: assign({ results: ({ event }) => event.output }) },
        onError: 'idle',
      },
      on: {
        // leaving `searching` stops the promise actor and aborts `signal`
        'search.change': { target: 'debouncing', actions: assign({ query: ({ event }) => event.query }) },
      },
    },
  },
});
```

### Polling

```ts
polling: {
  initial: 'fetching',
  on: { 'polling.stop': '#app.idle' }, // leaving cancels timer and in-flight request
  states: {
    fetching: {
      invoke: { src: 'poll', onDone: { target: 'waiting', actions: 'storeResult' }, onError: 'waiting' },
    },
    waiting: { after: { pollInterval: 'fetching' } },
  },
},
```

Polling as states (not `setInterval`) avoids overlapping requests and makes pause/resume a transition.

### Worker pool

Spawn N workers with `spawnChild('worker', { id: \`worker-${i}\` })` in the root `entry`. Keep `idle` worker ids and a job queue in context. On `job.submit`, use `enqueueActions` to `sendTo` an idle worker or enqueue the job; workers `sendParent({ type: 'job.done', workerId, result })`, and the parent marks the worker idle and dispatches the next job. Workers are machines or callback actors (wrapping a Web Worker / worker thread, cleaned up in the disposer).

### Global app actor with singleton children

```ts
const appMachine = setup({ actors: { auth: authMachine, notifier: notifierMachine } }).createMachine({
  id: 'app',
  invoke: [
    { id: 'auth', src: 'auth', systemId: 'auth' },
    { id: 'notifier', src: 'notifier', systemId: 'notifier' },
  ],
});
```

Create one root actor at app start; deep actors reach singletons via `system.get('notifier')`. Feature machines invoked/spawned under the root share the system; actors created with a separate `createActor` call have a **separate** system and cannot see these `systemId`s.

### Backend workflows

One actor per workflow instance; restore from storage per request, send the event, wait until it settles (`waitFor`), persist, stop. Invocations of pending work restart on restore, so make side effects idempotent. Full recipe in `persistence-inspection.md`.

## Pitfalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| Promise keeps running after leaving the state | `signal` ignored | Pass `signal` to `fetch`/SDKs |
| Parent machine suddenly in `error` | Child failed and no `onError`/handler | Add `onError` or handle `xstate.error.actor.<id>` |
| Node process crashes on actor error | Root subscribed without `error` callback | `actor.subscribe({ next, error })` |
| Event "disappears" / loops back to sender | `sendTo(fn)` returned `undefined` → sent to self | Check `system.get(...)` result before sending |
| `Unable to send event to actor 'x'` | String target is not a direct child (string ids never use `systemId`) | Use `({ system }) => system.get('x')` or a ref |
| Memory leak with spawned actors | Ref removed but not stopped, or stopped but ref kept | `stopChild(...)` + `assign` together |
| Spawned children overwrite each other | `spawnChild` without `id` | Always pass `id` |
| `Actor with system ID 'x' already exists` | Same `systemId` registered twice (e.g. list items) | Make `systemId` unique or omit it |
| `A non-root actor cannot be stopped directly.` | `child.stop()` | `stopChild(child)` from the parent |
| Teardown never runs on `actor.stop()` | Cleanup in exit actions | Move cleanup into a callback disposer |
| `waitFor`/`toPromise` hangs | Actor already stopped; or never reaches predicate | Add `timeout`; check status first |
| Inline-logic invoke has `id` type error | Named actors exist, inline `src` has `id?: never` | Register logic in `setup({ actors })` |
| `onSnapshot` never sees the final value | Only active snapshots are relayed | Use `onDone` for the final output |

## Stale API (v4 → v5)

| v4 | v5 |
| --- | --- |
| `interpret(machine)` | `createActor(machine)` |
| `services: {}` in options, `src: (ctx, ev) => promise` | `actors: {}`; `src: fromPromise(...)` / `fromCallback(...)` |
| `invoke.data` | `invoke.input` |
| `done.invoke.<id>` / `error.platform.<id>`, `event.data` | `xstate.done.actor.<id>` / `xstate.error.actor.<id>`, `event.output` / `event.error` |
| `spawn` imported from `xstate` | `spawn` from `assign`/`context` args, or `spawnChild` action |
| `stop(...)` action | `stopChild(...)` |
| `respond(event)` | `sendTo(({ event }) => event.replyTo, ...)` |
| `send(event, { to })` | `sendTo(target, event)` / `raise(event)` |
| `escalate(error)` | throw inside the child; parent gets `xstate.error.actor.<id>` |
| `autoForward: true` | explicit `sendTo` / `forwardTo` |
| `service.onTransition`, `state.done` | `actor.subscribe`, `snapshot.status === 'done'` |
| `actor.state`, `service.getSnapshot` via `.state` | `actor.getSnapshot()` |
| `callback(sendBack, onReceive)` | `fromCallback(({ sendBack, receive }) => ...)` |
| `waitFor` default 10 s timeout | default `Infinity` |

Note: the docs site page `sources.mdx` describes the Stately Studio editor's Sources panel (attaching code to actions/actors/guards in the visual editor). It is not an XState runtime API.
