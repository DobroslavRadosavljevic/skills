# Testing XState v5 and Graph Paths

How to test XState v5 (`xstate@5.33.x`) logic: pure transition tests, actor tests with Vitest, mocking with `machine.provide()`, timers (`SimulatedClock` and fake timers), emitted events, invoked and spawned children, and model-based testing with `xstate/graph` (`getShortestPaths`, `getSimplePaths`, `createTestModel`, coverage). Covers the standalone `@xstate/graph` 3.0.4 package and the deprecated `@xstate/test`.

## Contents

- Pick the right test level
- Example machine used below
- Pure tests: `initialTransition`, `transition`, microsteps
- Actor tests: `createActor`, `waitFor`, `toPromise`
- Mocking with `machine.provide()`
- Time: fake timers vs `SimulatedClock`
- Emitted events, children, inspection
- `xstate/graph` API reference
- Model-based testing with `createTestModel`
- Driving Playwright and Testing Library from paths
- Coverage and reachability checks
- `@xstate/graph` 3.0.4 and `@xstate/test` 0.5.1
- Pitfalls, Do / Don't, Stale API

## Pick the right test level

| Goal | Tool | Why |
| --- | --- | --- |
| "Event X in state S goes to T, updates context, and plans these effects" | `initialTransition` / `transition` (xstate ≥ 5.19) | Pure. No actor, no timers, no promises. Actions come back as data, so you can assert them without mocks. |
| End-to-end actor behavior: invoked promises, delays, emitted events, children, output | `createActor` + `waitFor` / `toPromise` | Runs the real interpreter, so it catches ordering and lifecycle bugs. |
| Every reachable state / transition is exercised in the real UI or service | `xstate/graph` paths + `createTestModel` | Generates the event sequences for you. You write one executor per event and one assertion per state. |
| "Is every state reachable? Can the machine get stuck?" | `getShortestPaths` + `getStateNodes` | Graph traversal over pure transitions; no SUT needed. |

Test the machine's contract: event in, snapshot (`value`, `context`, tags, `status`, `output`) and effects out. Do not assert internal fields such as `_nodes` or the order of unrelated actions.

## Example machine used below

```ts
// user.machine.ts
import { assign, emit, fromPromise, setup } from 'xstate';

export type User = { id: string; name: string };

export const userMachine = setup({
  types: {
    context: {} as {
      userId: string;
      user: User | null;
      error: string | null;
      retries: number;
    },
    events: {} as { type: 'FETCH' } | { type: 'RETRY' } | { type: 'CANCEL' },
    input: {} as { userId: string },
    emitted: {} as { type: 'user.loaded'; user: User },
  },
  actors: {
    fetchUser: fromPromise<User, { userId: string }>(async ({ input, signal }) => {
      const res = await fetch(`/api/users/${input.userId}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }),
  },
  actions: {
    track: (_, params: { name: string }) => {
      console.info('track', params.name);
    },
  },
  guards: {
    canRetry: ({ context }) => context.retries < 3,
  },
  delays: {
    retryDelay: ({ context }) => 2 ** context.retries * 1000,
  },
}).createMachine({
  id: 'user',
  context: ({ input }) => ({ userId: input.userId, user: null, error: null, retries: 0 }),
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: {
      tags: ['busy'],
      invoke: {
        id: 'fetchUser',
        src: 'fetchUser',
        input: ({ context }) => ({ userId: context.userId }),
        onDone: {
          target: 'success',
          actions: [
            assign({ user: ({ event }) => event.output }),
            emit(({ event }) => ({ type: 'user.loaded' as const, user: event.output })),
          ],
        },
        onError: {
          target: 'failure',
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
      on: { CANCEL: 'idle' },
    },
    failure: {
      after: {
        retryDelay: {
          guard: 'canRetry',
          target: 'loading',
          actions: assign({ retries: ({ context }) => context.retries + 1 }),
        },
      },
      on: {
        RETRY: { target: 'loading', actions: { type: 'track', params: { name: 'manual-retry' } } },
      },
    },
    success: { type: 'final' },
  },
  output: ({ context }) => context.user,
});
```

Every implementation is named in `setup()`. That is what makes it testable: `provide()` can only replace implementations referenced by name (string `src`, `{ type }` actions, named guards and delays). Inline functions cannot be swapped.

## Pure tests: `initialTransition`, `transition`, microsteps

`initialTransition(logic, input?)` and `transition(logic, snapshot, event)` (both xstate ≥ 5.19) return `[nextSnapshot, actions]`. They never execute actions, never start child actors, and never set timers. `assign` is applied (it is pure), so `context` in the returned snapshot is already updated.

```ts
import { initialTransition, transition } from 'xstate';
import { describe, expect, it } from 'vitest';
import { userMachine, type User } from './user.machine';

describe('userMachine (pure)', () => {
  it('starts idle and plans the fetch on FETCH', () => {
    const [s0, a0] = initialTransition(userMachine, { userId: 'u1' });
    expect(s0.value).toBe('idle');
    expect(a0).toEqual([]);

    const [s1, a1] = transition(userMachine, s0, { type: 'FETCH' });
    expect(s1.value).toBe('loading');
    expect(s1.hasTag('busy')).toBe(true);
    // The invoke shows up as a planned spawn, not a running actor.
    expect(a1).toContainEqual(
      expect.objectContaining({
        type: 'xstate.spawnChild',
        params: expect.objectContaining({ id: 'fetchUser' }),
      }),
    );
  });

  it('handles the done event and plans the emit', () => {
    const [s0] = initialTransition(userMachine, { userId: 'u1' });
    const [s1] = transition(userMachine, s0, { type: 'FETCH' });
    const user: User = { id: 'u1', name: 'Ada' };

    // Internal events are not in the declared event union, so cast.
    const [s2, a2] = transition(userMachine, s1, {
      type: 'xstate.done.actor.fetchUser',
      output: user,
    } as any);

    expect(s2.value).toBe('success');
    expect(s2.status).toBe('done');
    expect(s2.output).toEqual(user);
    expect(a2).toContainEqual(
      expect.objectContaining({
        type: 'xstate.emit',
        params: expect.objectContaining({ event: { type: 'user.loaded', user } }),
      }),
    );
  });

  it('records named actions with resolved params', () => {
    const [s0] = initialTransition(userMachine, { userId: 'u1' });
    const [s1] = transition(userMachine, s0, { type: 'FETCH' });
    const [s2] = transition(userMachine, s1, {
      type: 'xstate.error.actor.fetchUser',
      error: new Error('HTTP 500'),
    } as any);
    expect(s2.value).toBe('failure');

    const [, a3] = transition(userMachine, s2, { type: 'RETRY' });
    expect(a3).toContainEqual(
      expect.objectContaining({ type: 'track', params: { name: 'manual-retry' } }),
    );
  });
});
```

Internal event types you can feed to `transition()`:

| Source | Event |
| --- | --- |
| Invoke done | `{ type: 'xstate.done.actor.<invokeId>', output }` |
| Invoke error | `{ type: 'xstate.error.actor.<invokeId>', error }` |
| Delayed transition | `{ type: 'xstate.after.<delayKey>.<stateNodeId>' }`, e.g. `xstate.after.retryDelay.user.failure` or `xstate.after.1000.(machine).a` when the machine has no `id` |

Returned action objects have `{ type, params, info, exec }`. Built-ins use `xstate.raise`, `xstate.sendTo`, `xstate.emit`, `xstate.log`, `xstate.spawnChild`, `xstate.stopChild`, `xstate.cancel`. Delayed raises (including `after`) appear as `xstate.raise` with `params.delay`. For named custom actions, `exec` is the implementation; call `action.exec?.(action.info, action.params)` only when you deliberately want to run it.

Related pure helpers:

- `getMicrosteps(machine, snapshot, event)` and `getInitialMicrosteps(machine, input?)` (xstate ≥ 5.27) return `Array<[snapshot, actions]>` for each microstep. Use them to assert transient states reached through `always` transitions, which a single macrostep snapshot hides.
- `getNextTransitions(snapshot)` (xstate ≥ 5.26) returns every potential transition from the active states, including guarded, `always`, and `after` transitions, regardless of guard results.
- `snapshot.can(event)` tells you whether an event would cause a transition now (guards evaluated).
- `getNextSnapshot` and `getInitialSnapshot` are deprecated aliases. Use `transition` / `initialTransition`.
- Do not call `machine.transition(snapshot, event, actorScope)` directly; it needs an internal actor scope.

## Actor tests: `createActor`, `waitFor`, `toPromise`

```ts
import { createActor, fromPromise, toPromise, waitFor } from 'xstate';
import { afterEach, expect, it } from 'vitest';
import { userMachine, type User } from './user.machine';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

it('shows busy while loading, then outputs the user', async () => {
  const pending = deferred<User>();
  const machine = userMachine.provide({
    actors: { fetchUser: fromPromise<User, { userId: string }>(() => pending.promise) },
  });
  const actor = createActor(machine, { input: { userId: 'u1' } });
  actor.start();

  actor.send({ type: 'FETCH' });
  expect(actor.getSnapshot().hasTag('busy')).toBe(true);
  expect(actor.getSnapshot().children.fetchUser).toBeDefined();

  pending.resolve({ id: 'u1', name: 'Ada' });
  await expect(toPromise(actor)).resolves.toEqual({ id: 'u1', name: 'Ada' });
  expect(actor.getSnapshot().status).toBe('done');
});
```

Facts verified in source:

- `waitFor(actorRef, predicate, { timeout?, signal? })` checks the current snapshot first, then each emitted snapshot. Default `timeout` is `Infinity` (it was 10 s in v4). It rejects when the actor errors, and rejects with "Actor terminated without satisfying predicate" when the actor completes first. `signal` needs xstate ≥ 5.18.
- `waitFor` uses the global `setTimeout` for its own timeout, not the actor clock.
- `toPromise(actor)` (xstate ≥ 5.2) resolves with `snapshot.output` on `done` and rejects on `error`. It never settles for an actor that you stop manually, because a manual stop is neither done nor error.
- A `done` snapshot is delivered to `next` observers before `complete`, so `waitFor(actor, s => s.status === 'done')` works.
- If an actor errors and nobody subscribed with an `error` callback, XState rethrows the error from a `setTimeout`. Vitest then reports an unhandled error that may surface in another test. Assert errors with `await expect(toPromise(actor)).rejects.toThrow(...)` or `actor.subscribe({ error })`.
- Create a new actor per test and `actor.stop()` in `afterEach` when it can still own timers or children.

Avoid `await new Promise((r) => setTimeout(r, 0))` to "let the promise settle". It is timing-dependent. Wait for the condition you care about with `waitFor`, or control the promise with a deferred.

## Mocking with `machine.provide()`

`machine.provide({ actions, actors, guards, delays })` returns a new machine. It shallow-merges each map over the existing implementations; the original machine is unchanged. The keys are type-checked against the names declared in `setup()`.

```ts
import { createActor, fromPromise, waitFor } from 'xstate';
import { expect, it, vi } from 'vitest';
import { userMachine, type User } from './user.machine';

it('tracks a manual retry and never auto-retries when the guard fails', async () => {
  const track = vi.fn();
  const machine = userMachine.provide({
    actors: {
      fetchUser: fromPromise<User, { userId: string }>(async () => {
        throw new Error('HTTP 500');
      }),
    },
    actions: { track },
    guards: { canRetry: () => false },
    delays: { retryDelay: 10 },
  });

  const actor = createActor(machine, { input: { userId: 'u1' } }).start();
  actor.send({ type: 'FETCH' });
  await waitFor(actor, (s) => s.matches('failure'));
  expect(actor.getSnapshot().context.error).toBe('Error: HTTP 500');

  actor.send({ type: 'RETRY' });
  // Action implementations receive (actionArgs, params).
  expect(track).toHaveBeenCalledWith(
    expect.objectContaining({ context: expect.any(Object) }),
    { name: 'manual-retry' },
  );
  actor.stop();
});
```

Mocking rules:

- Replace actor logic with logic of the same kind and types: `fromPromise<TOutput, TInput>` for promise actors, `fromCallback`, `fromObservable`, or a stub machine for machine actors. Explicit generics keep `onDone` output types aligned.
- A promise that never settles (`fromPromise(() => new Promise(() => {}))`) keeps the machine in `loading` so you can test `CANCEL` and the exit cleanup.
- Assert `input` passed to an invoked actor by capturing it: `fromPromise(async ({ input }) => { seen.push(input); return user; })`.
- `delays` accepts a number or `(args, params) => number`. A small number (`10`) plus `waitFor` is often simpler than fake timers.
- If a test needs `provide()` on something written inline, refactor the machine to name it in `setup()`. Do not test around inline effects with global `fetch` mocks when a named actor would do.

## Time: fake timers vs `SimulatedClock`

Delayed transitions (`after`), delayed `raise`/`sendTo`, and `waitFor` timeouts all go through `setTimeout`. You have two options.

**Vitest fake timers.** The default clock calls the global `setTimeout` lazily, so `vi.useFakeTimers()` works even when it runs after `xstate` is imported. Use the async advance helpers when promises must settle in between.

```ts
import { createActor, fromPromise } from 'xstate';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { userMachine, type User } from './user.machine';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('auto-retries after the backoff delay', async () => {
  let calls = 0;
  const actor = createActor(
    userMachine.provide({
      actors: {
        fetchUser: fromPromise<User, { userId: string }>(async () => {
          calls++;
          throw new Error('HTTP 503');
        }),
      },
    }),
    { input: { userId: 'u1' } },
  ).start();

  actor.send({ type: 'FETCH' });
  await vi.advanceTimersByTimeAsync(0); // let the rejected promise settle
  expect(actor.getSnapshot().value).toBe('failure');

  await vi.advanceTimersByTimeAsync(1000); // 2 ** 0 * 1000
  expect(calls).toBe(2);
  expect(actor.getSnapshot().context.retries).toBe(1);
  actor.stop();
});
```

**`SimulatedClock`** (exported from `xstate`). Pass it as the `clock` option of the root actor. Since xstate 5.10 the root's `clock` propagates to every actor in the system, so invoked and spawned children use it too.

```ts
import { createActor, SimulatedClock } from 'xstate';

const clock = new SimulatedClock();
const actor = createActor(machine, { clock, input: { userId: 'u1' } }).start();

clock.increment(1000); // advance by 1000 ms and fire due timeouts in due order
clock.set(5000);       // jump to an absolute time; throws if time goes backward
clock.now();           // current simulated time
```

`SimulatedClock` only controls XState timers. Promises still resolve on the real microtask queue, so `await` a deferred or `waitFor` before you advance the clock. Its TypeScript interface declares `start(speed)`, but the class does not implement it; do not call `clock.start()`.

Choose fake timers when the system under test also uses timers outside XState (debounce in a component, `setInterval` in a callback actor). Choose `SimulatedClock` when you want XState time isolated from everything else.

## Emitted events, children, inspection

**Emitted events.** Subscribe with `actor.on(type, handler)` before you trigger the transition. `actor.on('*', handler)` receives every emitted event (xstate ≥ 5.13.1). Emits run as deferred effects at the end of the macrostep, so the handler has run by the time `send()` returns.

```ts
const loaded = vi.fn();
const actor = createActor(machine, { input: { userId: 'u1' } });
const sub = actor.on('user.loaded', loaded);
actor.start();
actor.send({ type: 'FETCH' });
await waitFor(actor, (s) => s.status === 'done');
expect(loaded).toHaveBeenCalledWith({ type: 'user.loaded', user: { id: 'u1', name: 'Ada' } });
sub.unsubscribe();
```

**Invoked and spawned children.** `snapshot.children[id]` holds the `ActorRef` for an invoke `id` or a `spawnChild(..., { id })`. Actors registered with `systemId` are available through `actor.system.get(systemId)`. Test a child two ways:

1. Isolated: `createActor(childMachine, { input })` with its own tests.
2. Integrated: keep the real child inside the parent and stub only the child's leaf effects through `childMachine.provide(...)`, then pass the stubbed child into the parent with `parentMachine.provide({ actors: { child: stubbedChild } })`.

Assert that a child was stopped on exit by checking `snapshot.children[id]` is `undefined` after leaving the invoking state.

**Transient states.** States entered and left in one macrostep through `always` never appear in `getSnapshot()` or to `waitFor`. Observe them through inspection microsteps, or use `getMicrosteps()` in a pure test.

```ts
const values: unknown[] = [];
createActor(machine, {
  inspect: (ev) => {
    if (ev.type === '@xstate.microstep') values.push(ev.snapshot);
  },
}).start();
```

Inspection event types: `@xstate.actor`, `@xstate.event`, `@xstate.snapshot`, `@xstate.transition`, `@xstate.microstep`, `@xstate.action`.

**Infinite `always` loops.** Set `options: { maxIterations: 1000 }` in the machine config (xstate ≥ 5.31) to make the interpreter throw instead of hanging. The default is `Infinity`.

## `xstate/graph` API reference

The graph and model-based testing utilities live in core since xstate 5.20: `import { ... } from 'xstate/graph'`. No extra package. All traversal is done with pure transitions and a mock actor scope: actions are not executed, children are not started, and no timers run.

Exports (verified in `packages/core/src/graph/index.ts`): `getShortestPaths`, `getSimplePaths`, `getPathsFromEvents`, `getAdjacencyMap`, `adjacencyMapToArray`, `toDirectedGraph`, `getStateNodes`, `serializeSnapshot`, `joinPaths`, `createTestModel`, `TestModel`, `createShortestPathsGen`, `createSimplePathsGen`, plus types (`StatePath`, `Step`, `TraversalOptions`, `TestModelOptions`, `TestParam`, `TestPath`, `AdjacencyMap`, `DirectedGraphNode`, ...). `validateMachine` and `deduplicatePaths` exist in the source but are **not exported**.

### Signatures

```ts
getShortestPaths(logic, options?): StatePath[]   // one shortest path per reachable state (BFS, weight 1 per edge)
getSimplePaths(logic, options?): StatePath[]     // every path that visits no vertex twice (DFS); can explode
getPathsFromEvents(logic, events, options?): StatePath[] // [] or [onePath]
getAdjacencyMap(logic, options): AdjacencyMap    // options is required; pass {} for defaults
adjacencyMapToArray(map): Array<{ state; event; nextState }>
toDirectedGraph(machine | stateNode): DirectedGraphNode // { id, stateNode, children, edges[{ id, source, target, label: { text }, transition }] } + toJSON()
getStateNodes(machine | stateNode): StateNode[]  // all descendants, root excluded
serializeSnapshot(snapshot): string              // JSON of { value, context } (context omitted when empty)
joinPaths(headPath, tailPath): StatePath         // tail must start at head's end snapshot (same object)
```

`logic` can be any actor logic, not only machines (for example `fromTransition`); for non-machine logic you must pass `events`.

### `StatePath` shape (source differs from the docs)

```ts
interface StatePath<TSnapshot, TEvent> {
  state: TSnapshot;                               // final snapshot
  steps: Array<{ state: TSnapshot; event: TEvent }>;
  weight: number;                                 // number of real events
}
```

`steps[0]` is always `{ event: { type: 'xstate.init' }, state: <initial snapshot> }`. Every later step is `{ event, state: <snapshot after that event> }`, and the last step's `state` equals `path.state`. The graph docs describe `step.state` as the state *before* the event; the shipped code (`alterPath.ts`) stores the state *after*. To get the event sequence, use `path.steps.slice(1).map((s) => s.event)`.

### Traversal options

| Option | Type | Notes |
| --- | --- | --- |
| `events` | `TEvent[] \| (snapshot) => TEvent[]` | Without this option, machines explore every event type the active states handle, as `{ type }` with no payload. **With** it, the plain functions (`getShortestPaths`, `getSimplePaths`, `getAdjacencyMap`) send only the events you list, from every state; auto-discovery is off, so list every event you want explored. `createTestModel` is different: there your events only add payloads for their `type`, and other handled types are still explored as `{ type }`. Wildcard handlers (`'*'`, `'form.*'`) are discovered as literal `{ type: '*' }` events. |
| `filterEvents` | `(snapshot, event) => boolean` | xstate ≥ 5.30. `filterEvents: (s, e) => s.can(e)` explores only enabled events and drops guard-blocked no-ops. Not in `@xstate/graph` 3.0.4. |
| `toState` | `(snapshot) => boolean` | Keeps only paths that end in a matching snapshot. Also stops traversal past a match. |
| `fromState` | snapshot | Start from this snapshot (build it with `initialTransition`/`transition`). Not a state string, although one changelog example shows strings. |
| `stopWhen` | `(snapshot) => boolean` | Do not expand successors of matching snapshots. Your main tool for unbounded `context`. |
| `limit` | `number` (default `Infinity`) | Max dequeues while building the adjacency map. Exceeding it **throws** `Traversal limit exceeded`; it does not truncate quietly. |
| `serializeState` | `(snapshot, event, prevSnapshot) => string` | Vertex identity. Default for machines: `{ value, context }` JSON. Use `(s) => JSON.stringify(s.value)` to ignore context. |
| `serializeEvent` | `(event) => string` | Edge identity. Default `JSON.stringify(event)`. |
| `input` | machine input | Passed to the initial snapshot. Required when the machine's input is required. |

Default event discovery includes `after` events (`xstate.after.<delay>.<id>`) and invoke done/error events (`xstate.done.actor.<id>` without `output`). Supply realistic payloads, for example `{ type: 'xstate.done.actor.fetchUser', output: user }` (in a function-form `events` or a test model), or exclude them with `filterEvents`.

The docs say passed events only add payloads. That is true for `createTestModel`. For the plain functions, `resolveTraversalOptions` spreads your `events` value over the discovery function, so the list (or function result) is complete. List every event, and use `filterEvents` to drop the ones a state does not handle:

```ts
import { getShortestPaths } from 'xstate/graph';

const paths = getShortestPaths(userMachine, {
  input: { userId: 'u1' },
  events: () => [
    { type: 'FETCH' },
    { type: 'RETRY' },
    { type: 'CANCEL' },
    { type: 'xstate.done.actor.fetchUser', output: { id: 'u1', name: 'Ada' } } as any,
    { type: 'xstate.error.actor.fetchUser', error: new Error('HTTP 500') } as any,
  ],
  filterEvents: (snapshot, event) => snapshot.can(event),
});
// The `after` retry is not explored here because its event is not listed.
```

### Bounding the state space

Every distinct `{ value, context }` is a vertex. A counter, a timestamp, or a growing array in `context` makes the graph infinite and the traversal never ends. Bound it:

```ts
import { getShortestPaths } from 'xstate/graph';

const paths = getShortestPaths(cartMachine, {
  events: [
    { type: 'ADD', sku: 'a' },
    { type: 'REMOVE', sku: 'a' },
  ],
  stopWhen: (s) => s.context.items.length >= 3,
  serializeState: (s) => JSON.stringify({ value: s.value, n: s.context.items.length }),
});
```

`getPathsFromEvents` also builds the full adjacency map before it replays your events, so it needs the same bounds on unbounded machines. It does not check that each event is handled: an unhandled event leaves the state unchanged instead of failing.

### Examples

```ts
import { initialTransition, transition } from 'xstate';
import { getPathsFromEvents, getShortestPaths, getSimplePaths } from 'xstate/graph';

const toClosed = getSimplePaths(feedbackMachine, { toState: (s) => s.matches('closed') });

const [initial] = initialTransition(feedbackMachine);
const [form] = transition(feedbackMachine, initial, { type: 'CLICK_BAD' });
const fromForm = getShortestPaths(feedbackMachine, { fromState: form });

const [path] = getPathsFromEvents(feedbackMachine, [
  { type: 'CLICK_BAD' },
  { type: 'SUBMIT' },
]);
expect(path?.state.value).toBe('thanks');
```

## Model-based testing with `createTestModel`

Model-based testing (MBT): you write a small machine that describes what a user can do and see, generate paths through it, and replay each path against the real system under test (SUT) — a browser page, a rendered component, an HTTP API.

### Write a test model, not the production machine

`createTestModel(machine)` calls an internal `validateMachine` and **throws** if any state has `invoke`, `after`, or an inline delayed action (`raise(..., { delay })`). Real app machines usually have those. Write a separate model machine with only user-visible states and user or environment events. Represent async outcomes as events (`SERVER_OK`, `SERVER_FAIL`) whose executors set up network mocks.

```ts
// feedback.model.ts
import { setup } from 'xstate';

export const feedbackModel = setup({
  types: {
    events: {} as
      | { type: 'CLICK_GOOD' }
      | { type: 'CLICK_BAD' }
      | { type: 'TYPE_COMMENT'; value: string }
      | { type: 'SUBMIT' }
      | { type: 'CLOSE' },
  },
}).createMachine({
  id: 'feedback',
  initial: 'question',
  states: {
    question: { on: { CLICK_GOOD: 'thanks', CLICK_BAD: 'form', CLOSE: 'closed' } },
    form: {
      initial: 'empty',
      states: {
        empty: {
          on: {
            TYPE_COMMENT: {
              guard: ({ event }) => event.value.trim().length > 0,
              target: 'filled',
            },
          },
        },
        filled: { on: { SUBMIT: '#feedback.thanks' } },
      },
      on: { CLOSE: 'closed' },
    },
    thanks: { on: { CLOSE: 'closed' } },
    closed: { type: 'final' },
  },
});
```

Inline guards are fine in a model: nothing is mocked, and they only shape which paths exist.

### `createTestModel(machine, options?)` and `TestModel`

```ts
import { createTestModel } from 'xstate/graph';

const model = createTestModel(feedbackModel, {
  events: [
    { type: 'TYPE_COMMENT', value: '' },
    { type: 'TYPE_COMMENT', value: 'Too slow' },
  ],
});
```

`TestModel` methods:

```text
model.getShortestPaths(options?)      // TestPath[]
model.getSimplePaths(options?)        // TestPath[]
model.getPaths(pathGenerator, options?)
model.getPathsFromEvents(events, options?)
model.getShortestPathsFrom(paths, options?) // extend each path with shortest paths from its end
model.getSimplePathsFrom(paths, options?)
model.getAdjacencyMap()
model.testPath(path, params) / model.testState(params, snapshot) / model.testTransition(params, step)
```

`TestModelOptions` = traversal options plus `stateMatcher(snapshot, key)`, `logger: { log, error }`, and `serializeTransition(snapshot, event, prevSnapshot)`. Path getters also accept `allowDuplicatePaths` (default `false`): by default a path whose event sequence is a prefix of a longer path is dropped.

Non-obvious behavior of `createTestModel`:

- Its default `serializeState` appends the incoming transition (`via <event> from <prevValue>`) whenever the state value changes. So `model.getShortestPaths()` yields one path per value-changing transition, which approximates transition coverage. Plain `getShortestPaths(machine)` yields one path per state. Pass `serializeTransition: () => ''` to the model for state coverage only.
- `stateMatcher` default: a key that starts with `#` matches by state node id; any other key uses `snapshot.matches(key)`, which accepts dotted paths (`'form.filled'`). A parent key (`'form'`) runs for every child state too. A `'*'` key runs only when no other key matched.
- `meta.description` on a state (string or `(snapshot) => string`) feeds `path.description`, e.g. `Reaches state "thanks": xstate.init → CLICK_BAD → TYPE_COMMENT ({"value":"Too slow"}) → SUBMIT`.
- `meta.test` is **not** used in v5. Assertions go in the `states` map passed to `path.test()`.
- There is no `testCoverage()` in v5. See the coverage section below.

You can also wrap non-machine logic: `new TestModel(fromTransition(reducer, init), { events: (s) => [...], stateMatcher: (s, key) => ... })`.

### What `path.test(params)` does

`path.test({ events, states })` returns a promise. For each step in order it runs `events[step.event.type]?.(step)` and then every matching `states[key](snapshot)`. The first step is `xstate.init`, so the initial state assertion runs before any event. It does **not** reset or start your SUT; set up a fresh page, render, or server state before you call it. On failure it rethrows the original error with a path trace appended (each state and event, marking the failing one).

Event executor typing: the executor parameter is a `Step` whose `event` is typed only as `{ type }`. Cast to read payload fields:

```ts
type FeedbackEvent = EventFromLogic<typeof feedbackModel>;
type Of<T extends FeedbackEvent['type']> = Extract<FeedbackEvent, { type: T }>;

TYPE_COMMENT: async ({ event }) => {
  const { value } = event as Of<'TYPE_COMMENT'>;
  // ...
},
```

## Driving Playwright and Testing Library from paths

### Playwright

```ts
// feedback.spec.ts
import { expect, test } from '@playwright/test';
import type { EventFromLogic } from 'xstate';
import { createTestModel } from 'xstate/graph';
import { feedbackModel } from './feedback.model';

type FeedbackEvent = EventFromLogic<typeof feedbackModel>;

const model = createTestModel(feedbackModel, {
  events: [
    { type: 'TYPE_COMMENT', value: '' },
    { type: 'TYPE_COMMENT', value: 'Too slow' },
  ],
});

// Generate at module load so the runner can register one test per path.
for (const path of model.getShortestPaths()) {
  test(path.description, async ({ page }) => {
    await page.goto('/feedback');

    await path.test({
      events: {
        CLICK_GOOD: async () => page.getByRole('button', { name: 'Good' }).click(),
        CLICK_BAD: async () => page.getByRole('button', { name: 'Bad' }).click(),
        TYPE_COMMENT: async ({ event }) => {
          const { value } = event as Extract<FeedbackEvent, { type: 'TYPE_COMMENT' }>;
          await page.getByLabel('Comment').fill(value);
        },
        SUBMIT: async () => page.getByRole('button', { name: 'Submit' }).click(),
        CLOSE: async () => page.getByRole('button', { name: 'Close' }).click(),
      },
      states: {
        question: async () => expect(page.getByText('How was your experience?')).toBeVisible(),
        'form.empty': async () =>
          expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled(),
        'form.filled': async () =>
          expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled(),
        thanks: async () => expect(page.getByText('Thanks!')).toBeVisible(),
        closed: async () => expect(page.getByRole('dialog')).toBeHidden(),
      },
    });
  });
}
```

Model async outcomes as events and mock them in the executor, for example `SERVER_FAIL: async () => page.route('**/api/feedback', (r) => r.fulfill({ status: 500 }))` placed before the step that triggers the request. Keep the model's event order in line with how the UI really sequences them.

### Testing Library + Vitest

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('FeedbackDialog', () => {
  for (const path of model.getSimplePaths({ toState: (s) => s.status === 'done' })) {
    it(path.description, async () => {
      const user = userEvent.setup();
      render(<FeedbackDialog />);
      await path.test({
        events: {
          CLICK_GOOD: () => user.click(screen.getByRole('button', { name: 'Good' })),
          CLOSE: () => user.click(screen.getByRole('button', { name: 'Close' })),
          // ...
        },
        states: {
          thanks: () => expect(screen.getByText('Thanks!')).toBeTruthy(),
          // ...
        },
      });
    });
  }
});
```

Choosing paths:

- `getShortestPaths()` — fewest tests that reach every state (or every transition, with the default `createTestModel` serialization). Default choice for UI suites.
- `getSimplePaths({ toState })` — every loop-free route to a goal state. Use for critical flows (checkout, auth). Grows combinatorially; always bound it with `toState`, `stopWhen`, or `filterEvents`.
- `getPathsFromEvents([...])` — one scripted regression path.
- `getShortestPathsFrom(paths)` — "reach X first, then cover everything from there".
- Custom: `model.getPaths(createShortestPathsGen(), options)` or your own `(logic, options) => StatePath[]`.

## Coverage and reachability checks

Use graph helpers to guard the model itself in a fast unit test.

```ts
import type { AnyStateMachine } from 'xstate';
import {
  adjacencyMapToArray,
  getAdjacencyMap,
  getShortestPaths,
  getSimplePaths,
  getStateNodes,
  serializeSnapshot,
  type StatePath,
  type TraversalOptions,
} from 'xstate/graph';

/** State node ids that no path visits. History nodes are never "active", so skip them. */
export function getUnvisitedStateIds(
  machine: AnyStateMachine,
  paths: StatePath<any, any>[],
): string[] {
  const visited = paths.flatMap((p) => p.steps.map((s) => s.state));
  return getStateNodes(machine)
    .filter((node) => node.type !== 'history')
    .filter((node) => !visited.some((snap) => snap.matches(node.path.join('.'))))
    .map((node) => node.id);
}

/** Value-or-context-changing transitions in the adjacency map that no path takes. */
export function getUncoveredTransitions(
  machine: AnyStateMachine,
  paths: StatePath<any, any>[],
  options: TraversalOptions<any, any, any> = {},
) {
  const key = (state: unknown, event: unknown) =>
    `${serializeSnapshot(state as any)} -- ${JSON.stringify(event)}`;
  const covered = new Set(
    paths.flatMap((p) => p.steps.slice(1).map((step, i) => key(p.steps[i].state, step.event))),
  );
  return adjacencyMapToArray(getAdjacencyMap(machine, options)).filter(
    ({ state, event, nextState }) =>
      serializeSnapshot(state as any) !== serializeSnapshot(nextState as any) &&
      !covered.has(key(state, event)),
  );
}

it('every state and transition in the model is reachable', () => {
  // Payload-free discovery would send TYPE_COMMENT without `value` and crash the guard,
  // so pass the complete event list.
  const options = {
    events: [
      { type: 'CLICK_GOOD' },
      { type: 'CLICK_BAD' },
      { type: 'TYPE_COMMENT', value: '' },
      { type: 'TYPE_COMMENT', value: 'Too slow' },
      { type: 'SUBMIT' },
      { type: 'CLOSE' },
    ] as const,
  };
  const paths = getShortestPaths(feedbackModel, options);
  expect(getUnvisitedStateIds(feedbackModel, paths)).toEqual([]);

  const simple = getSimplePaths(feedbackModel, options);
  expect(getUncoveredTransitions(feedbackModel, simple, options)).toEqual([]);
});
```

Pass the same `events`, `stopWhen`, and `serializeState` options to both the path generator and `getAdjacencyMap`, or the keys will not line up. For a dead-end check, look for reachable snapshots with `status === 'active'` whose `getNextTransitions(snapshot)` is empty.

`toDirectedGraph(machine)` gives a nested node/edge structure (`edge.label.text` is the event type, `edge.transition` the definition). Call `JSON.stringify(graph)` to get the serializable form for docs or diagrams.

## `@xstate/graph` 3.0.4 and `@xstate/test` 0.5.1

- **`@xstate/graph` 3.0.4** (npm latest, May 2025, peer `xstate ^5.19.4`) is the pre-merge standalone copy. Its exports match `xstate/graph` plus a `serializeEvent` export, but it has no `filterEvents` and misses later core fixes. The graph docs call it deprecated; npm does not flag it. Use it only if you are stuck below xstate 5.20. Otherwise import from `xstate/graph` and remove the dependency. Older majors (1.x/2.x, and the `xstate-graph` docs page) describe a v4-era API that returned an object map of `{ state, path }`. That API is gone.
- **`@xstate/test` 0.5.1** is deprecated on npm: "Superseded by @xstate/test@2 (model-based and property-based testing for XState v6). Path utilities live in xstate/graph." 0.5.1 peers on `xstate ^4.29`. The `@xstate/test@alpha` (2.0.0-alpha.2) line targets the XState v6 alpha and peers on `vitest`, `fast-check`, `effect`, and `zod`. Do not use it with v5.

Migrating `@xstate/test` 0.x (v4) code to `xstate/graph`:

| `@xstate/test` 0.x | `xstate/graph` (v5) |
| --- | --- |
| `createModel(machine).withEvents({ E: { exec, cases } })` | `createTestModel(machine, { events: [...cases] })` + `path.test({ events: { E: exec } })` |
| `meta: { test: async (page) => ... }` on states | `path.test({ states: { 'a.b': async (snapshot) => ... } })`; close over `page` |
| `getShortestPathPlans()` / `getSimplePathPlans()` → `plan.paths` | `getShortestPaths()` / `getSimplePaths()` → flat `TestPath[]` |
| `getPlanFromEvents(events, { target })` | `getPathsFromEvents(events, { toState })` |
| `path.test(testContext)` | `path.test({ events, states })` |
| `{ filter: (state) => ... }` | `stopWhen` (inverse meaning) and `filterEvents` |
| `testModel.testCoverage()` | Removed; compute with `getStateNodes` / `getAdjacencyMap` |
| `path.segments` | `path.steps` (first step is `xstate.init`) |

Stately Studio can also generate test-path code (shortest or simple strategy, Playwright or custom format) from its Tests panel. It is a paid beta feature; generated code still needs your executors and assertions.

## Pitfalls

- **`createTestModel` throws on `invoke` / `after` / delayed actions.** Fix: write a dedicated test model, or call `getShortestPaths` directly (it has no such check) and replay events yourself.
- **Traversal never finishes.** Unbounded `context` creates infinite vertices. Fix: `stopWhen`, a coarser `serializeState`, a finite `events` list, or `limit` (which throws when hit).
- **Whole branches vanish after you add `events: [...]` to `getShortestPaths`.** The list replaces auto-discovery for the plain functions. Fix: list every event, or use `createTestModel`, which merges payloads with discovery.
- **Paths include no-op events** (guard blocked, wildcard handlers, `xstate.done.actor.*` without output). Fix: `filterEvents: (s, e) => s.can(e)` (xstate ≥ 5.30) and explicit payloads in `events`.
- **`path.test()` reuses state from the previous path.** It never resets the SUT. Fix: new page/render/actor per path.
- **Payload fields are `any`/missing in event executors.** Fix: cast `step.event` with `Extract<...>`.
- **Asserting a transient `always` state with `waitFor`.** It is never emitted. Fix: inspection microsteps, `getMicrosteps`, or `after: { 0: ... }` if it must be observable.
- **`provide()` has no effect.** The implementation is inline. Fix: name it in `setup()`.
- **Fake timers and promises deadlock.** `vi.advanceTimersByTime` does not flush microtasks. Fix: `await vi.advanceTimersByTimeAsync(ms)`.
- **Unhandled actor errors fail a different test.** Fix: always observe errors (`toPromise`, `subscribe({ error })`) and stop actors after each test.
- **`toPromise` hangs.** The actor was stopped manually or never reaches a final state. Fix: assert with `waitFor` on a state instead, or add a final state with `output`.

## Do / Don't

- Do test pure logic with `transition()` and actor behavior with `createActor`; keep both small and fast.
- Do assert `hasTag`, `matches`, `context`, `status`, and `output`; prefer tags for UI-facing assertions so internal state renames do not break tests.
- Do control async with deferreds, `waitFor`, `SimulatedClock`, or fake timers.
- Do keep test models small and user-facing: 5–20 states, events a user or the network can cause.
- Don't sleep with real `setTimeout` in tests.
- Don't import `deduplicatePaths` or `validateMachine` from `xstate/graph`; they are not exported.
- Don't use `getSimplePaths` on a large model without `toState` or other bounds.
- Don't rely on `meta.test`, `testCoverage()`, `getShortestPathPlans()`, or `withEvents()`; they are v4/`@xstate/test` 0.x APIs.

## Stale API

| Stale (v4 / old packages) | Current (v5) |
| --- | --- |
| `interpret(machine).start()` | `createActor(machine).start()` |
| `machine.transition(state, event)` as a pure call | `transition(machine, snapshot, event)` (≥ 5.19) |
| `getNextSnapshot` / `getInitialSnapshot` (5.5, deprecated) | `transition` / `initialTransition` |
| `machine.withConfig({ services, actions, guards, delays })` | `machine.provide({ actors, actions, guards, delays })` |
| `machine.withContext(ctx)` | `input` + `context: ({ input }) => ...` |
| `state.nextEvents` | `snapshot.can(event)`, `getNextTransitions(snapshot)` (≥ 5.26) |
| `waitFor` default 10 s timeout | default `Infinity` |
| `import { getShortestPaths } from '@xstate/graph'` | `import { getShortestPaths } from 'xstate/graph'` (≥ 5.20) |
| `@xstate/test` `createModel` | `createTestModel` from `xstate/graph` |
