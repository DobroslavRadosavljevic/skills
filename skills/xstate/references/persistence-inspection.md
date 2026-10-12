# Persistence, Restoration, and Inspection

Scope: persisting and restoring XState v5 actors (xstate 5.33.2) — `getPersistedSnapshot`, `createActor(logic, { snapshot })`, deep persistence of children, what is not persisted, versioning, browser and database recipes, event sourcing — plus the inspection API (`inspect`, `system.inspect`, inspection event types), custom inspectors, `@statelyai/inspect` 0.7.2, and serverless/backend workflow patterns.

## Contents

- Persist and restore
- What a persisted snapshot contains
- Rehydration rules
- What is NOT persisted
- Versioning stored snapshots
- Recipe: localStorage
- Recipe: database-backed workflow per request
- Event sourcing alternative
- Inspection API
- Inspection event reference
- Custom inspectors (logging, tests, tracing)
- `@statelyai/inspect`
- Pitfalls
- Stale API

## Persist and restore

```ts
import { createActor } from 'xstate';

const actor = createActor(checkoutMachine).start();

// Persist: JSON-serializable internal state (deep: includes children)
const persisted = actor.getPersistedSnapshot();
await store.save(id, JSON.stringify(persisted));

// Restore: pass it as `snapshot`, then start
const restored = createActor(checkoutMachine, {
  snapshot: JSON.parse(await store.load(id)),
});
restored.start();
```

- `getPersistedSnapshot()` works on every actor type, not only machines. It is not the same object as `getSnapshot()`: machine snapshots have methods (`matches`, `can`, `hasTag`) and live child refs; the persisted form is plain data.
- The option is `snapshot` (v5). `state` still exists as a deprecated alias.
- Always restore with the **same machine** (same state ids, same `setup({ actors })` keys). Restoration resolves children by `src` string against the machine.
- Persist on change with a subscription: `actor.subscribe(() => save(actor.getPersistedSnapshot()))`. Serialize writes (queue them) when the store is async so an older snapshot never overwrites a newer one — `examples/mongodb-persisted-state` uses a task queue for this.

## What a persisted snapshot contains

For a machine actor (from `State.ts#getPersistedSnapshot`):

```ts
{
  status: 'active' | 'done' | 'error' | 'stopped',
  value: StateValue,
  context: { /* actor refs replaced by { xstate$$type: 1, id } markers */ },
  output, error,
  historyValue: { /* serialized as state node ids (≥ 5.19.3) */ },
  children: {
    [childId]: { snapshot: /* child's persisted snapshot */, src: string, systemId?: string, syncSnapshot?: boolean }
  },
}
```

Other logic: promise `{ status, output, error, input }`, callback `{ status, input, ... }`, observable `{ status, context, input, ... }` (the live subscription is stripped), transition `{ status, context, ... }`.

Deep persistence:

- Invoked children are persisted recursively. Inline invoked logic is fine: it is stored under its synthetic src `xstate.invoke.<index>.<stateNodeId>` and resolved back through the state node config.
- Spawned children are persisted only when spawned **by key** (`spawn('todo', ...)`, `spawnChild('todo', ...)`). Spawning inline logic (`spawn(fromPromise(...))`) makes `getPersistedSnapshot()` throw `An inline child actor cannot be persisted.` in development. In production the check is skipped and the snapshot holds a logic object that will not survive JSON — so treat it as an error in both.
- Actor refs stored in `context` are replaced with `{ xstate$$type: 1, id }` markers and re-linked to the restored child with that id.

## Rehydration rules

Verified in `createActor.ts`, `StateMachine.ts#restoreSnapshot`, and `rehydration.test.ts`:

- **No actions re-run.** Entry actions of the active states, transition actions, and `xstate.init` handling are not executed again; they are assumed done.
- **Eventless (`always`) transitions are not re-evaluated** on start. They run on the next event.
- **Active children are recreated and started** from their persisted snapshots, with the same `id`, `systemId`, and `syncSnapshot`. For promise actors this means the promise creator runs again with the persisted `input` (at-least-once execution). Callback actors re-run their callback with the persisted `input`. Observable actors re-subscribe from scratch.
- **Done/error/stopped children** are restored as-is: not started, not registered in the system, and they do not re-notify the parent.
- Children whose `src` cannot be resolved (renamed actor key, reordered invokes, renamed state ids) are **silently dropped**. The parent then waits forever for an `onDone` that cannot arrive.
- `onSnapshot` / `syncSnapshot` keeps working after rehydration.
- A restored `done` actor completes immediately on `start()`; a restored `error` actor reports its error immediately on `start()` (to `error` observers, or as an unhandled error).
- An incompatible snapshot (e.g. a `value` naming a state that no longer exists) does **not** throw from `createActor`. The restore error is caught and the actor's initial snapshot becomes `{ status: 'error', error }`. Check `actor.getSnapshot().status` before `start()`.
- `input` is ignored when `snapshot` is given, but TypeScript still requires `input` if the machine declares a required input type — pass the original input.

`machine.resolveState({ value, context })` builds a snapshot from a state value only. It has **no children**, so restoring from it does not start the invocations of the active state, and it carries no history. Use it for migrations or tests, not as the main persistence format.

## What is NOT persisted

| Not persisted | Consequence | Mitigation |
| --- | --- | --- |
| Pending delayed events (`after`, delayed `raise`/`sendTo`) — they live in the system scheduler | A restored state with `after: { 5000: ... }` never fires; the timer was scheduled by an entry action that does not re-run | Store an absolute deadline in context and model the wait as an invoked actor that sleeps until `input.deadline` (invocations restart on restore) |
| In-flight side effects and their progress | Promise actors re-run from the start | Idempotent effects (idempotency keys), or persist only at settled states |
| Mailbox (queued, unprocessed events) | Lost | Persist after processing; use an external durable queue for inbound events |
| Subscriptions, `actor.on` listeners, inspectors | Not data | Re-attach after `createActor` |
| Non-JSON context (Date, Map, Set, class instances, functions) | Dates become strings, Map/Set become `{}`, prototypes and functions are lost after `JSON.stringify` | Keep context JSON-safe (ISO strings, arrays, plain objects) or use a serializer such as superjson consistently on both sides |
| Refs to non-child actors in context (e.g. a parent ref passed via input) | Marker is re-linked only to a direct child with that id; anything else becomes `undefined` | Use `sendParent` or `system.get(systemId)` instead of storing foreign refs |
| Emitted events, inspection events | Ephemeral | Event-source if you need history |

## Versioning stored snapshots

A persisted snapshot is coupled to the machine definition (state ids, invoke order, actor keys, context shape). Store a version with it and migrate or discard on mismatch.

```ts
import type { Snapshot } from 'xstate';

const MACHINE_VERSION = 3;
type Stored = { v: number; snapshot: Snapshot<unknown> };

function migrate(stored: Stored): Snapshot<unknown> | undefined {
  if (stored.v === MACHINE_VERSION) return stored.snapshot;
  if (stored.v === 2) {
    const s = stored.snapshot as any;
    // v3 added context.couponCode and renamed state 'pay' -> 'payment'
    return {
      ...s,
      value: s.value === 'pay' ? 'payment' : s.value,
      context: { ...s.context, couponCode: null },
    };
  }
  return undefined; // unknown or too old: start fresh (or route to manual handling)
}
```

Rules that keep snapshots restorable:

- Bump the version on any change to state ids/structure, invoke array order, `setup({ actors })` keys, or context shape.
- Prefer explicit `invoke.id` and named actors over inline logic; inline invoke src strings encode the invoke's array index and the state node id.
- Long-lived workflows: keep old machine versions in code and restore each instance with the version it started with, or drain instances before deploying a breaking change.
- After restoring, assert `getSnapshot().status !== 'error'` and fall back explicitly.

## Recipe: localStorage

```ts
import { createActor, type Snapshot } from 'xstate';
import { checkoutMachine } from './checkoutMachine';

const KEY = 'checkout';
const VERSION = 3;

function load(): Snapshot<unknown> | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    const stored = JSON.parse(raw) as { v: number; snapshot: Snapshot<unknown> };
    return stored.v === VERSION ? stored.snapshot : undefined;
  } catch {
    return undefined; // blocked storage, corrupt JSON
  }
}

function createCheckoutActor() {
  const snapshot = load();
  let actor = createActor(checkoutMachine, { snapshot });
  if (snapshot && actor.getSnapshot().status === 'error') {
    localStorage.removeItem(KEY);
    actor = createActor(checkoutMachine); // incompatible snapshot: start fresh
  }
  actor.subscribe({
    next: () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ v: VERSION, snapshot: actor.getPersistedSnapshot() }));
      } catch {
        /* quota or privacy mode: persistence is best-effort */
      }
    },
    error: (err) => console.error(err),
  });
  return actor.start();
}
```

Framework hooks usually accept the same `snapshot` option (e.g. `useActorRef(machine, { snapshot })`); keep the load/validate step outside the component so it runs once.

## Recipe: database-backed workflow per request

Run a short-lived actor per request: restore → send → wait until settled → persist → stop. Patterned after `examples/express-workflow` and `examples/mongodb-persisted-state`, plus the guards those examples omit.

```ts
import { createActor, waitFor } from 'xstate';
import { orderMachine, MACHINE_VERSION } from './orderMachine';

export async function handleOrderEvent(orderId: string, body: unknown) {
  const event = parseOrderEvent(body); // validate untrusted input against your event union (zod, valibot, ...)

  const row = await db.workflows.find(orderId); // { v, snapshot, rev } | null
  const snapshot = row ? migrate(row) : undefined;
  if (row && !snapshot) throw new Error(`Unsupported workflow version ${row.v}`);

  const actor = createActor(orderMachine, { snapshot, input: { orderId } });
  if (actor.getSnapshot().status === 'error') throw new Error('Stored snapshot is incompatible');

  let failure: unknown;
  actor.subscribe({ error: (err) => (failure = err) }); // prevents unhandled-error crashes
  actor.start();
  actor.send(event);

  // States that run invocations carry tags: ['busy']. Wait until the work started by this event settles.
  const settled = await waitFor(actor, (s) => !s.hasTag('busy') || s.status !== 'active', {
    timeout: 15_000,
  });

  await db.workflows.save(orderId, {
    v: MACHINE_VERSION,
    snapshot: actor.getPersistedSnapshot(),
    expectedRev: row?.rev, // optimistic concurrency: reject if another request wrote first
  });
  actor.stop();

  if (failure) throw failure;
  return { value: settled.value, status: settled.status, output: settled.output };
}
```

Design rules:

- **Concurrency:** two requests can restore the same snapshot. Use optimistic locking (revision column, conditional update) or a per-workflow lock, and retry on conflict.
- **Persist at settled states.** If you persist while a promise actor is in flight, the next restore re-runs it. Combine with idempotency keys derived from workflow id + step.
- **Timers:** `after` does not survive restore. For deadlines (e.g. "cancel order after 24 h"), store `deadlineAt` in context and either run an external scheduler that sends `{ type: 'deadline.reached' }` at that time, or invoke a timer actor that computes the remaining time from `input.deadlineAt`.
- **Long-running work** (minutes to days) does not belong inside one request. Persist a waiting state, run the work in a job runner, and deliver its result as an event in a later request.
- **Validate events** at the boundary. `actor.send(req.body)` as in the express example lets clients send any event type, including internal `xstate.*` events.
- **Side-effect-free alternative** (≥ 5.19): `initialTransition(machine, input)` and `transition(machine, snapshot, event)` return `[nextSnapshot, actions]` without executing anything, so you can compute the next state and run the returned actions yourself. Invocations appear as `xstate.spawnChild` actions and delayed events as actions with `params.delay`; you own executing them. Use this when you need full control over effects; use the actor-per-request recipe when you want XState to run them.

## Event sourcing alternative

Instead of storing the snapshot, store the events and rebuild state by replaying them. Benefits: full audit log, survives most machine changes, replays actions if you want them.

Capture external events at the boundary (simplest, most reliable):

```ts
function sendAndRecord(actor: AnyActorRef, event: OrderEvent) {
  eventLog.append(workflowId, event); // durable append first
  actor.send(event);
}
```

Or capture via inspection — but filter carefully:

```ts
const actor = createActor(orderMachine, {
  inspect: (ev) => {
    if (
      ev.type === '@xstate.event' &&
      ev.actorRef === actor &&          // delivered to the root
      ev.sourceRef === undefined &&     // sent from outside, not by a child or a timer
      ev.event.type !== 'xstate.init'   // the init event is also reported as an @xstate.event
    ) {
      eventLog.append(workflowId, ev.event);
    }
  },
});
```

Replay caveats:

- Replaying into a live actor re-executes every side effect (emails, payments). Use replay with real effects only for side-effect-free machines, or replay into `transition()` (pure) to rebuild state.
- Events produced by children (`xstate.done.actor.*`, `xstate.error.actor.*`) and timers (`xstate.after.*`) are not external. If you replay only external events into a live actor, async children run again and may finish in a different order, so the result can diverge. For deterministic rebuilds, record every event delivered to the root (drop the `sourceRef === undefined` filter, keep the `xstate.init` filter) and replay with the pure `transition()` function.
- Snapshots and event logs combine well: persist a snapshot every N events and replay only the tail.

## Inspection API

Attach an inspector at the root; it observes every actor in the system.

```ts
import { createActor, type InspectionEvent } from 'xstate';

const actor = createActor(machine, {
  inspect: (ev: InspectionEvent) => console.log(ev.type, ev), // function or { next, error, complete } observer
});

// Or add/remove later (≥ 5.14):
const sub = actor.system.inspect((ev) => console.log(ev));
sub.unsubscribe();
```

- `inspect` is honored only on the root actor; children share the root's system observers.
- The root's own `@xstate.actor` event fires inside `createActor`, so only the `inspect` option sees it — `system.inspect` added afterwards misses it.
- Inspection is synchronous and runs inside the actor's processing. Keep inspectors cheap; buffer or defer heavy work.

## Inspection event reference

Every event has `type`, `rootId` (root's `sessionId`), and `actorRef` (typed `ActorRefLike` = `sessionId`, `send`, `getSnapshot` since 5.18.2; cast to `AnyActorRef` to read `id`, `systemId`, `_parent`, `src`).

| `type` | When | Extra fields |
| --- | --- | --- |
| `@xstate.actor` | An actor is created (constructor time, before start) | — |
| `@xstate.event` | An event is delivered to `actorRef` (including the init event at start, child→parent events, delayed events) | `event`, `sourceRef` (`undefined` for `actor.send(...)` from outside and for the root's init) |
| `@xstate.snapshot` | An actor emits a snapshot after processing an event | `event`, `snapshot` |
| `@xstate.microstep` (≥ 5.7) | Each microstep of a machine macrostep, including `always` hops and the error step | `event`, `snapshot` (after this microstep), `_transitions` (internal) |
| `@xstate.action` (≥ 5.7) | An action is executed | `action: { type, params }` |
| `@xstate.transition` | Declared and exported as `InspectedTransitionEvent` (export ≥ 5.32) but **never emitted** by xstate 5.33.2 | — |

Docs vs source:

- The docs describe microstep events with `value` and `transitions: [{ eventType, target }]`. Source emits `snapshot` (read `snapshot.value`) and `_transitions` (underscore, internal `TransitionDefinition` objects). Code against `snapshot`.
- `@xstate.action` is reported for custom actions (string, object, or inline function — inline functions report the function name or `'(anonymous)'`) and for built-ins with side effects (`xstate.sendTo`, `xstate.raise`, `xstate.spawnChild`, `xstate.stopChild`, `xstate.emit`, `xstate.log`, `xstate.cancel`). `assign` does not appear.
- Transient states passed through `always` never reach `subscribe`/`waitFor`; only `@xstate.microstep` shows them.

## Custom inspectors (logging, tests, tracing)

Structured logger:

```ts
import type { AnyActorRef, InspectionEvent } from 'xstate';

export function createLogInspector(log: (entry: Record<string, unknown>) => void) {
  return (ev: InspectionEvent) => {
    const ref = ev.actorRef as AnyActorRef;
    switch (ev.type) {
      case '@xstate.actor':
        log({ kind: 'actor', id: ref.id, sessionId: ref.sessionId, parent: ref._parent?.sessionId });
        break;
      case '@xstate.event':
        log({
          kind: 'event',
          to: ref.id,
          from: (ev.sourceRef as AnyActorRef | undefined)?.id ?? 'external',
          type: ev.event.type, // log the type only; payloads may hold secrets/PII
        });
        break;
      case '@xstate.snapshot':
        log({ kind: 'snapshot', id: ref.id, status: ev.snapshot.status, value: (ev.snapshot as any).value });
        break;
      case '@xstate.action':
        log({ kind: 'action', id: ref.id, action: ev.action.type });
        break;
    }
  };
}

const actor = createActor(machine, { inspect: createLogInspector((e) => logger.debug(e)) });
```

Test assertions on behavior (sequence of states, including transient ones):

```ts
const values: unknown[] = [];
const actor = createActor(machine, {
  inspect: (ev) => {
    if (ev.type === '@xstate.microstep' && ev.actorRef === actor) values.push((ev.snapshot as any).value);
  },
}).start();
actor.send({ type: 'EV' });
expect(values).toEqual(['b', 'c']);
```

Tracing: open a span on `@xstate.event` for the root and close it on the matching `@xstate.snapshot` (same `actorRef`, same `event` object); attach `sessionId`/`rootId` as attributes to correlate parent and child actors.

## `@statelyai/inspect`

Visual inspector (state diagrams + sequence diagrams) for the Stately Inspector UI. Version 0.7.2, peer `xstate ^5.5.1`, entry points `@statelyai/inspect` and `@statelyai/inspect/server`.

```bash
bun add -d @statelyai/inspect
```

Browser:

```ts
import { createActor } from 'xstate';
import { createBrowserInspector } from '@statelyai/inspect';

const inspector = createBrowserInspector({
  // url: 'https://stately.ai/inspect' (default), iframe: HTMLIFrameElement | null, window
  filter: (e) => !(e.type === '@xstate.event' && e.event.type === 'mouse.move'),
  sanitizeContext: ({ password, ...rest }) => rest,
  sanitizeEvent: (event) => ('token' in event ? { ...event, token: '***' } : event),
  // autoStart: true, maxDeferredEvents: 200, serializationDepthLimit: 10, serialize
});

const actor = createActor(machine, { inspect: inspector.inspect }).start();
```

Node (WebSocket relay that opens the UI):

```ts
import { createWebSocketInspector } from '@statelyai/inspect';
import { createInspectorServer } from '@statelyai/inspect/server';

const server = createInspectorServer({ port: 8080, autoOpen: true }); // defaults shown
const inspector = createWebSocketInspector({ url: 'ws://localhost:8080' });
const actor = createActor(machine, { inspect: inspector.inspect }).start();
// later: inspector.stop(); server.stop();
```

Other APIs (verified in the published `.d.mts`):

- `createSkyInspector({ apiKey?, onerror?, ...options })` sends events to a hosted Stately Sky session and logs a live link.
- `createInspector(adapter, options)` for a custom transport; `createBrowserReceiver` / `createWebSocketReceiver` to consume events.
- Manual events for non-XState code: `inspector.actor(idOrRef, snapshot?, info?)`, `inspector.event(target, event, { source? })`, `inspector.snapshot(idOrRef, snapshot, { event? })`.
- `inspector.start()` / `inspector.stop()`; with `autoStart: false` events are buffered (up to `maxDeferredEvents`) until start.

Behavior to know:

- Only `@xstate.actor`, `@xstate.event`, and `@xstate.snapshot` are forwarded; microstep and action events are dropped.
- `filter`, `sanitize*`, and `serialize` receive the converted Stately events (`{ type, sessionId, sourceId?, event?, snapshot?, rootId, ... }`), not raw XState inspection events.
- Conversion runs in an idle callback (asynchronous), so the UI lags slightly behind.
- Without `window` (SSR, Node tests), `createBrowserInspector` logs `Window does not exist; inspector cannot be started.` and returns a no-op object whose `inspect` is `undefined`. Guard with `typeof window !== 'undefined'` or use the WebSocket inspector on servers.
- Enable inspectors only in development (`import.meta.env.DEV` or equivalent) and sanitize context/events: everything is sent to another window or socket.

Deprecated tooling: `@xstate/inspect` (0.8.0, peer `xstate ^4.37`) and the `devTools: true` option are v4-only; `devTools` is typed `never` in v5. The `@xstate/cli` typegen and the "developer tools" docs page are also v4-only — v5 has no typegen; use `setup({ types })`.

## Pitfalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| `An inline child actor cannot be persisted.` | Spawned inline logic | Register in `setup({ actors })`, spawn by key |
| Restored workflow stuck forever | Child src not resolvable (renamed key/state/invoke order) → child dropped | Version snapshots; explicit `invoke.id`; migrate |
| Restored state's timeout never fires | `after` timers are entry actions; not re-run on restore | Deadline in context + external scheduler or deadline-aware invoked actor |
| Duplicate side effect after restore | In-flight promise re-runs on restore | Persist at settled states; idempotency keys |
| Restored actor immediately errors | Incompatible snapshot; restore error became `status: 'error'` | Check status before `start()`; migrate or start fresh |
| Restoring via `resolveState` does not start invocations | `resolveState` snapshots have no children | Persist with `getPersistedSnapshot()` |
| Dates in context are strings after reload | JSON round trip | Store ISO strings; parse at use sites |
| Event log replays `xstate.init` / child events twice | Inspection filter too broad | Filter `sourceRef === undefined` and skip `xstate.init`, or record at `send` |
| Inspector misses root creation | `system.inspect` added after `createActor` | Pass `inspect` in `createActor` options |
| No microsteps/actions in Stately Inspector | Package forwards only actor/event/snapshot | Use a custom inspector for those |
| `inspect: undefined` in SSR | Browser inspector without `window` | Guard creation or use WebSocket inspector |

## Stale API

| Old | Current |
| --- | --- |
| `interpret(machine, { state })` / `createActor(machine, { state })` | `createActor(machine, { snapshot })` |
| `actor.getPersistedState()` | `actor.getPersistedSnapshot()` |
| `State.create(json)`, `machine.resolveState(State)` | pass the persisted object as `snapshot`; `machine.resolveState({ value, context })` for value-only |
| `state.events`, `state.history`, `state.actions` | inspection API (`@xstate.event`, `@xstate.action`), `actor.subscribe` |
| `@xstate/inspect` `inspect({ iframe })`, `devTools: true` | `@statelyai/inspect` `createBrowserInspector()` + `createActor(m, { inspect: inspector.inspect })` |
