# XState Migration and Version Awareness

Covers upgrading XState v4 code to v5 (stale-API table, grep patterns, step-by-step procedure, verification), the
notable features added in each 5.x minor and in the integration-package majors (`@xstate/react`, `vue`, `svelte`,
`solid`, `store`), and an ALPHA preview of XState v6 with guidance for writing v5 code that will migrate cleanly.
Stable baseline: `xstate` 5.33.2, `@xstate/react` 6.1.0, `@xstate/vue` 5.0.1, `@xstate/svelte` 5.0.0,
`@xstate/solid` 2.0.0, `@xstate/store` 4.3.0.

## Contents

1. Detect what you are on
2. v4 → v5 stale-API table (core, actions, guards, transitions, actors, events, TypeScript, snapshots)
3. Semantic changes that compile but behave differently
4. Framework packages: v4-era → v5-era hooks
5. Before/after example
6. Step-by-step migration procedure
7. Grep patterns for stale usages
8. Verification checklist
9. 5.x minor feature timeline (5.1 → 5.33)
10. Integration package majors and `@xstate/store` 1 → 4
11. XState v6 ALPHA preview
12. Write v5 code that migrates cleanly to v6
13. Pitfalls

---

## 1. Detect what you are on

```bash
# Installed versions (lockfile truth)
bun pm ls --all | grep -E '(^|[ /])(xstate|@xstate/[a-z-]+|@statelyai/[a-z-]+)@'

# Registry metadata (dist-tags: latest vs alpha)
npm view xstate dist-tags
npm view @xstate/react dist-tags
npm view @xstate/store dist-tags
```

Quick fingerprints:

| You see | Version |
| --- | --- |
| `interpret(`, `cond:`, `services:`, `(context, event) =>`, `send(`, `schema:`, `tsTypes` | v4 |
| `createActor(`, `setup({ types })`, `({ context, event }) =>`, `guard:`, `fromPromise` | v5 |
| `(args, enq) =>`, `enq.raise`, `schemas: {`, `createAsyncLogic`, `checkStateIn`, `actor.trigger.X()` | v6 alpha |

XState v5 needs TypeScript ≥ 5.0 and `strictNullChecks: true` (or `strict: true`) for correct inference;
`skipLibCheck: true` is recommended.

---

## 2. v4 → v5 stale-API table

Rule of thumb: if it took positional `(context, event)` arguments, accepted a string event, or lived in a second
`createMachine` argument, it is stale.

### Machines and actors

| v4 | v5 | Notes |
| --- | --- | --- |
| `Machine(config)` | `createMachine(config)` or `setup({...}).createMachine(config)` | `Machine` removed. Prefer `setup` for typed implementations. |
| `createMachine(config, { actions, guards, services, delays })` | `setup({ actions, guards, actors, delays }).createMachine(config)` | Second argument still accepted in v5 but deprecated in source; removed in v6. |
| `machine.withConfig(impl)` | `machine.provide(impl)` | Same shape; `services` key → `actors`. |
| `machine.withContext(ctx)` | `context: ({ input }) => ...` + `createActor(m, { input })` | Context can no longer be overridden from outside. |
| `machine.options` | `machine.implementations` | |
| `machine.initialState` / `machine.getInitialState()` | `initialTransition(machine, input?)[0]` (≥ 5.19) | `getInitialSnapshot(logic, input?)` (5.6.2) also exists but is `@deprecated` in source. |
| `machine.transition(state, event)` | `transition(machine, snapshot, event)` → `[next, actions]` (≥ 5.19) | `machine.transition` now needs an internal actor scope. `getNextSnapshot` (5.5) is `@deprecated`. |
| `machine.transition('a.b', ev)` / state-value strings | `machine.resolveState({ value: { a: 'b' }, context })` then `transition(...)` | Compound string values dropped; invalid values throw (≥ 5.7). |
| `State.create` / `State.from` / `machine.createState` / `resolveStateValue` | `machine.resolveState({ value, context })` | `State` class gone; `instanceof State` → `isMachineSnapshot(x)`. |
| `interpret(machine, opts)` | `createActor(logic, opts)` | `interpret` still exported in 5.x as deprecated alias; removed in v6. |
| `Interpreter` / `AnyInterpreter` types | `Actor<typeof logic>` / `AnyActor` | |
| `interpret(m).start(state)` | `createActor(m, { snapshot }).start()` | `start()` takes no args. Options key `state` is a deprecated alias of `snapshot`. |
| `{ devTools: true }` option | `{ inspect }` option or `@statelyai/inspect` | `devTools?: never` in types → passing it is a type error. `@xstate/inspect` is deprecated. |
| `{ execute: false }` option, `service.execute(state)` | `transition()` / `initialTransition()` return actions without running them | Or keep implementations out of the base machine and `.provide()` no-ops. |
| `{ deferEvents }` option | removed | Events sent before `start()` are queued. |
| `service.state` / `service.initialState` | `actor.getSnapshot()` | |
| `service.onTransition(fn)` / `onChange` / `onEvent` / `onSend` | `actor.subscribe(fn)`; events/actions via `inspect` | `subscribe` does **not** emit the current snapshot immediately (see §3). |
| `service.onDone(fn)` / `onStop(fn)` | `actor.subscribe({ complete })` or `await toPromise(actor)` (≥ 5.2) | |
| `service.onError(fn)` | `actor.subscribe({ error })` | |
| `service.off(listener)` | `subscription.unsubscribe()` | |
| `service.batch(events)` | `for (const e of events) actor.send(e)` | |
| `service.nextState(event)` | `transition(logic, actor.getSnapshot(), event)` or `snapshot.can(event)` | |
| `service.children` | `snapshot.children` | Values are `ActorRef`s. |
| `service.status` | `snapshot.status` (`'active' \| 'done' \| 'error' \| 'stopped'`) | Type exported as `SnapshotStatus` (≥ 5.16). |
| `service.machine` | `actor.logic` | |
| `state._sessionid` | `actor.sessionId` | |
| `service.stop()` on a child | `stopChild(id)` action in the parent | Root `actor.stop()` still exists. Exit actions do **not** run on external stop. |

### Sending events

| v4 | v5 | Notes |
| --- | --- | --- |
| `service.send('EV')` | `actor.send({ type: 'EV' })` | String events throw. |
| `service.send('EV', { x })` | `actor.send({ type: 'EV', x })` | |
| `state.can('EV')` | `snapshot.can({ type: 'EV' })` | |
| `send(ev)` action | `raise(ev)` | Self-send. |
| `send(ev, { to: 'child' })` | `sendTo('child', ev)` | `to` may be an id, ref, or `({ context, event }) => ref`. |
| `send(ev, { delay, id })` | `raise(ev, { delay, id })` / `sendTo(to, ev, { delay, id })` | |
| `cancel('EV_TYPE')` relying on implicit id | `cancel('explicitId')` with `{ id: 'explicitId' }` on the send | Delayed-event ids are no longer derived from event types. |
| `respond(ev)` | `sendTo(({ event }) => event.sender, ev)` | Put the requester's `self` in the event payload; there is no `origin`. |
| `sendParent(ev)` | `sendParent(ev)` | Unchanged. |
| `forwardTo('child')` | `forwardTo('child')` | Unchanged. |
| `sendUpdate()` | parent `invoke: { onSnapshot }` | |
| `escalate(err)` | `throw err` inside the action/actor | Caught by parent `onError`. |
| `autoForward: true` / `forward` on invoke | explicit `sendTo(childId, ({ event }) => event)` on the events the child needs | |

### Actions

| v4 | v5 | Notes |
| --- | --- | --- |
| `(context, event, meta) => {}` | `({ context, event, self, system }, params) => {}` | Single object arg + `params` second. Applies to actions, guards, delays, `assign` property mappers, `input`, `output`. |
| `{ type: 'greet', message: 'hi' }` | `{ type: 'greet', params: { message: 'hi' } }` | Extra props must move under `params`. `params` may be a function `({ context, event }) => ...`. |
| `import { actions } from 'xstate'; actions.assign` | `import { assign } from 'xstate'` | Named imports. |
| `pure(() => [...])` | `enqueueActions(({ enqueue }) => { enqueue('a'); })` | |
| `choose([{ cond, actions }])` | `enqueueActions(({ enqueue, check }) => { if (check('g')) enqueue('a'); })` | |
| `stop('child')` | `stopChild('child')` | `stop` is a deprecated alias in 5.x; removed in v6. |
| `start('child')` | removed | Use `invoke` or `spawnChild`. |
| `import { spawn } from 'xstate'` | `spawnChild(src, opts)` action, or `assign({ ref: ({ spawn }) => spawn(src, opts) })` | `spawn` is only available inside `assign` / context factory args. |
| `activities` | `invoke` (e.g. `fromCallback` with cleanup) | |
| `onEntry` / `onExit` | `entry` / `exit` | |
| `predictableActionArguments: true` | delete | Ordered by default (see §3). |
| `preserveActionOrder: true` | delete | |
| Calling `assign()` inside a custom action | List `assign(...)` in `actions`, or use `enqueueActions` | It never ran; ≥ 5.13 warns. |
| `assign({ x: (ctx, e) => e.value })` | `assign({ x: ({ event }) => event.value })` | Property assigners and function assigners both take the args object; both merge into context. |

### Guards

| v4 | v5 | Notes |
| --- | --- | --- |
| `cond: 'isValid'` | `guard: 'isValid'` | |
| `cond: { type: 'gt', value: 5 }` | `guard: { type: 'gt', params: { value: 5 } }` | Impl: `gt: ({ context }, params) => context.n > params.value`. |
| `(ctx, ev, { cond }) => ...` | `({ context, event }, params) => ...` | |
| `in: '#machine.form.submitting'` | `guard: stateIn('#form.submitting')` or `stateIn({ form: 'submitting' })` | `stateIn`, `and`, `or`, `not` import from `'xstate'`. |
| custom combinator functions | `and([...])`, `or([...])`, `not(g)` | Accept named guard strings, objects, or inline fns. |

### Transitions and state config

| v4 | v5 | Notes |
| --- | --- | --- |
| `internal: false` | `reenter: true` | |
| implicit external transitions (`target: 'self'`, `'#id'`, `'parent.child'`) | internal by default; add `reenter: true` to re-run entry/exit | Target syntax no longer affects transition type (see §3). |
| `on: { '': ... }` | `always: ...` | |
| `on: [{ event: 'X', target }]` | `on: { X: target }` | Array-form `on` removed. |
| `after: [{ delay: 1000, target }]` | `after: { 1000: target }` | Array-form `after` removed. |
| root `on: { X: 'sibling' }` | `on: { X: '.child' }` | Root has no siblings. |
| target getters `target: () => node` | string targets / `#id` | |
| compound state without `initial` | add `initial` | Throws at creation. |
| `strict: true` | `'*': { actions: ({ event }) => { throw new Error(...) } }` | |
| `parallel: true` / `history: true` | `type: 'parallel'` / `type: 'history'` | v3 leftovers, removed. |
| final state `data: {...}` | `output: ...` on the final state and/or root `output` | Root `output` receives `({ context, event })`; `event.output` is the final state's output. |
| `invoke: 'src'` shorthand | `invoke: { src: 'src' }` | |
| `invoke.src: (ctx, ev) => promise` | `src: fromPromise(async ({ input, signal }) => ...)` + `input: ({ context, event }) => ...` | Also `fromCallback`, `fromObservable`, `fromEventObservable`, `fromTransition`, `createMachine`. |
| `invoke.src: { type: 'x', ...params }` | `src: 'x'` + `input` | |
| `invoke.data: {...}` / property mappers | `invoke.input: ({ context, event }) => ({...})` | Child reads it via `context: ({ input }) => input`. Property mappers removed everywhere. |
| `services: {...}` | `actors: {...}` | |
| `sync: true` on invoke/spawn | `invoke: { onSnapshot: {...} }` | |
| `fromReducer` | `fromTransition` | |
| callback `(sendBack, receive) => ...` | `fromCallback(({ sendBack, receive, input, self, system, emit }) => cleanup)` | Returning a promise is not supported; return a cleanup function. |

### Events generated by XState

| v4 event type | v5 event type | Payload change |
| --- | --- | --- |
| `done.invoke.<id>` | `xstate.done.actor.<id>` | `event.data` → `event.output`; `event.actorId` (≥ 5.14) |
| `error.platform.<id>` | `xstate.error.actor.<id>` | `event.data` → `event.error`; `event.actorId` (≥ 5.14) |
| `done.state.<id>` | `xstate.done.state.<id>` | `event.output` |
| `xstate.after(1000)#machine.state` | `xstate.after.1000.machine.state` | |
| `xstate.init` | `xstate.init` | Now carries `input` |
| null event `{ type: '' }` | none | `always` actions/guards receive the event that triggered the macrostep |
| `error.execution` | actor `status: 'error'` + `snapshot.error` / parent `onError` | |

### Snapshots (`State` → `MachineSnapshot`)

| v4 | v5 | Notes |
| --- | --- | --- |
| `state.value`, `matches`, `hasTag`, `context`, `children` | same | |
| `state.done` | `snapshot.status === 'done'` | `snapshot.output` holds the output. |
| `state.meta` | `snapshot.getMeta()` | Keys typed by state id with `setup` (≥ 5.17). |
| `state.configuration` | `snapshot._nodes` | Underscore-private; renamed `snapshot.nodes` in v6. The 5.0.0 changelog says `nodes`; source is `_nodes`. |
| `state.nextEvents` | `getNextTransitions(snapshot).map((t) => t.eventType)` (≥ 5.26) | Or `__unsafe_getAllOwnEventDescriptors(snapshot)`. Prefer `snapshot.can(event)` for UI enablement. |
| `state.toStrings()` | write a helper over `snapshot.value` | Removed with no replacement export. |
| `state.history` | keep `prev` in a `subscribe` closure | |
| `state.changed` | `next !== prev` | v5 returns the same snapshot object when no transition matched. |
| `state.event` / `state._event` | `inspect` option (`@xstate.event`) or store the event in context | |
| `state.actions` / `state.transitions` | `inspect` (`@xstate.action`, ≥ 5.7) or `transition()` return value | Actions are never persisted or replayed. |
| `state.historyValue` | shape changed (SCXML algorithm) | Do not hand-edit. |
| `matchState(...)` | `snapshot.matches(...)`, or `mapState(snapshot, mapper)` (≥ 5.31) | 5.0 removed `mapState`; 5.31 re-added it with a new signature. |

### TypeScript

| v4 | v5 | Notes |
| --- | --- | --- |
| `schema: {} as {...}` | `types: {} as {...}` (inside `setup({ types })` preferred) | Keys: `context`, `events`, `input`, `output`, `actors`, `actions`, `guards`, `delays`, `tags`, `emitted`, `children`, `meta` (5.12), `transitionMeta` (5.33). |
| `tsTypes: {} as import('./x.typegen').Typegen0` | delete; delete `*.typegen.ts` | Typegen types removed from core in 5.15. |
| `createModel()` (`xstate/lib/model`) | `setup({ types })` | Deep imports blocked by `exports` map. |
| `Typestate` generic | removed | Narrow with `snapshot.matches()` + `assertEvent`. |
| `EmittedFrom<T>` (snapshot type) | `SnapshotFrom<T>` | v5 reuses the name `EmittedFrom` for *emitted events*. |
| `AnyState` | `AnyMachineSnapshot` | `AnyState` is a deprecated alias. |
| `StateSchema` generic | removed | |
| `context: 'string'` | object only | `Record<string, any>`; missing context defaults to `{}`. |

---

## 3. Semantic changes that compile but behave differently

These survive a typecheck. Review them by hand.

1. **Action order.** v4 (without `predictableActionArguments`) ran all `assign`s first, so every custom action saw
   the final context. v5 runs actions in listed order; a custom action listed before `assign` sees the old context.
   Fix: reorder, or read the new value from the event.
2. **Transitions are internal by default.** v4 treated `target: 'thisState'`, `'#id'`, and absolute targets as
   external (exit + re-enter, restarting `invoke`, `after`, `entry`). v5 does not re-enter unless `reenter: true`.
   Watch for timers that no longer restart and invoked actors that no longer restart on "self" transitions.
3. **Child targets are always re-entered.** A transition on a compound parent targeting `'.child'` re-enters
   `child` even when already active. Guard with `not(stateIn(...))` if that is unwanted.
4. **`subscribe` does not replay.** v4 `subscribe`/`onTransition` emitted the current state immediately. v5 emits
   only on change; read `actor.getSnapshot()` first.
5. **`always` is not re-checked after a no-op.** Eventless transitions are selected only after a transition that
   changed state, which removes many accidental loops but can leave v4 code that relied on re-evaluation stuck.
6. **Errors propagate.** A throwing action, guard, or actor puts the actor in `status: 'error'` and reaches the
   nearest `error` observer or parent `onError`. Unobserved errors are reported as unhandled. React ≥ 6.1 hooks
   rethrow to error boundaries.
7. **Stopping does not run exit actions.** `actor.stop()` stops children and sets `status: 'stopped'`; exit
   actions run only on transitions and on reaching a final state.
8. **Restored snapshots do not replay actions.** `createActor(m, { snapshot })` restores state, restarts
   invocations, and restores spawned children with referenced (named) sources; inline-spawned logic cannot be
   persisted.
9. **`waitFor` default timeout** changed from 10 s to `Infinity`. Pass `{ timeout }` explicitly in tests.
10. **Delayed event ids.** `cancel(...)` needs the explicit `id` given at send time.
11. **Wildcards.** `'*'` matches any event but explicit descriptors win; partial `'feedback.*'` descriptors are
    supported. Since 5.32.2, if every guard of an exact descriptor fails, matching wildcard transitions are tried.
12. **`createActor` without required `input`** throws at runtime (≥ 5.6) and is a type error.

---

## 4. Framework packages: v4-era → v5-era hooks

| Package | v4-era | v5-era (current) |
| --- | --- | --- |
| `@xstate/react` | `useMachine(m, { actions, services, context, state })` | `useMachine(m.provide({ actions, actors }), { input, snapshot, inspect, id, systemId })` |
| | `useMachine(() => m.withConfig(...))` | `useMachine(m.provide(...))`: same-config machines are treated as the same machine; provided impls stay current |
| | `const [state, send, service] = useMachine(m)` | `const [snapshot, send, actorRef] = useMachine(m)` (`useMachine` is an alias of `useActor`) |
| | `useInterpret(m, opts, observer)` | `useActorRef(logic, opts, observer)` |
| | `useActor(existingRef)` | `useSelector(ref, (s) => s)` + `ref.send(...)`; `useActor(logic)` now takes **logic** |
| | `useSpawn(logic)` | `useActorRef(logic)` |
| | `@xstate/react/fsm` | removed |
| | `Ctx.useActor()` from `createActorContext` | `Ctx.useSelector(sel)`, `Ctx.useActorRef()` |
| | `<Ctx.Provider machine={m}>` | `<Ctx.Provider logic={m} options={...}>` (`machine` prop deprecated) |
| `@xstate/vue` | `const { state, send, service } = useMachine(m)` | `const { snapshot, send, actorRef } = useMachine(m)` |
| | `useInterpret`, `useSpawn` | `useActorRef` |
| `@xstate/svelte` | `{ state, send, service }` | `{ snapshot, send, actorRef }` (`snapshot` is a Svelte store) |
| `@xstate/solid` | `createService(m)` | `useActorRef(logic)`; `fromActorRef(ref)` for an existing ref |
| | `useActor(ref)` | `useActor(logic)` returns `[snapshot, send, actorRef]` |

Docs disagreement: the docs migration page says Vue returns `actor`; package source and the 3.0.0 changelog return
`actorRef`. Trust `actorRef`.

---

## 5. Before/after example

```ts
// v4 (stale)
import { createMachine, assign, interpret } from 'xstate';

const fetchMachine = createMachine(
  {
    id: 'fetch',
    predictableActionArguments: true,
    schema: {
      context: {} as { userId: string; user?: User; error?: string },
      events: {} as { type: 'FETCH' } | { type: 'RETRY' },
    },
    context: { userId: '' },
    initial: 'idle',
    states: {
      idle: { on: { FETCH: 'loading' } },
      loading: {
        invoke: {
          src: 'fetchUser',
          onDone: { target: 'success', actions: 'setUser' },
          onError: { target: 'failure', actions: assign({ error: (_, e) => String(e.data) }) },
        },
      },
      success: { type: 'final', data: (ctx) => ctx.user },
      failure: {
        after: { 3000: { target: 'loading', cond: 'canRetry' } },
        on: { RETRY: 'loading' },
      },
    },
  },
  {
    actions: { setUser: assign({ user: (_, e) => e.data }) },
    guards: { canRetry: (ctx) => ctx.userId !== '' },
    services: { fetchUser: (ctx) => fetch(`/users/${ctx.userId}`).then((r) => r.json()) },
  },
);

const service = interpret(fetchMachine.withContext({ userId: '42' }))
  .onTransition((state) => console.log(state.value))
  .start();
service.send('FETCH');
```

```ts
// v5
import { assign, createActor, fromPromise, setup } from 'xstate';

type User = { id: string; name: string };

export const fetchMachine = setup({
  types: {
    context: {} as { userId: string; user?: User; error?: string },
    events: {} as { type: 'FETCH' } | { type: 'RETRY' },
    input: {} as { userId: string },
    output: {} as User | null,
  },
  actors: {
    fetchUser: fromPromise<User, { userId: string }>(async ({ input, signal }) => {
      const res = await fetch(`/users/${input.userId}`, { signal });
      return (await res.json()) as User;
    }),
  },
  guards: {
    canRetry: ({ context }) => context.userId !== '',
  },
}).createMachine({
  id: 'fetch',
  context: ({ input }) => ({ userId: input.userId }),
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: {
      invoke: {
        src: 'fetchUser',
        input: ({ context }) => ({ userId: context.userId }),
        onDone: { target: 'success', actions: assign({ user: ({ event }) => event.output }) },
        onError: { target: 'failure', actions: assign({ error: ({ event }) => String(event.error) }) },
      },
    },
    success: { type: 'final' },
    failure: {
      after: { 3000: { target: 'loading', guard: 'canRetry' } },
      on: { RETRY: 'loading' },
    },
  },
  output: ({ context }) => context.user ?? null,
});

const actor = createActor(fetchMachine, { input: { userId: '42' } });
console.log(actor.getSnapshot().value); // subscribe does not replay the current snapshot
actor.subscribe((snapshot) => console.log(snapshot.value));
actor.start();
actor.send({ type: 'FETCH' });
```

What changed and why: `withContext` became `input` (context is owned by the machine); the service became actor
logic with `input` instead of reading parent context (actors are isolated); `e.data` split into `event.output` /
`event.error`; `cond` → `guard`; final `data` → root `output`; the string event became an object.

---

## 6. Step-by-step migration procedure

Migrate one machine (and its tests) at a time. For large codebases, run v4 and v5 side by side:

```bash
bun add xstate5@npm:xstate@5
# import { createMachine } from 'xstate5'
```

Integration packages pin their own `xstate` peer, so a side-by-side `@xstate/react` needs its nested `xstate`
resolved to the aliased v5 copy. Prefer migrating machine + its hooks together to avoid that.

1. **Pre-migrate on v4** (each change works on v4 and shrinks the v5 diff): send event objects only; replace
   `send` with `raise`/`sendTo`; move action/guard object props under `params`; use `always` instead of `''`;
   track history in `subscribe`; loop instead of `batch`.
2. **Upgrade packages:** `bun add xstate@^5 @xstate/react@^6` (or `@xstate/vue@^5`, `@xstate/svelte@^5`,
   `@xstate/solid@^2`). Remove `@xstate/inspect` (use `@statelyai/inspect`), `@xstate/test` (use `xstate/graph`,
   ≥ 5.20), and typegen tooling. Ensure TypeScript ≥ 5.0 with `strictNullChecks`.
3. **Run the grep sweep** (§7). Fix mechanical renames first: imports, `interpret`, `cond`, `services`, `schema`,
   `internal`, `withConfig`, `onTransition`, string sends.
4. **Convert machine definitions to `setup({ types, actions, guards, actors, delays }).createMachine(...)`.**
   Move the second `createMachine` argument into `setup`. Delete `predictableActionArguments`, `tsTypes`, `strict`.
5. **Convert implementation signatures** to `({ context, event }, params)`. Move inline params into `params`.
6. **Convert invoked/spawned sources** to actor logic creators. Replace parent-context reads with `input`.
   Replace `invoke.data` with `input`, `autoForward` with explicit `sendTo`, `sync` with `onSnapshot`.
7. **Rename generated event types** in `on` keys and in code that inspects `event.type` (`done.invoke.*`,
   `error.platform.*`, `xstate.after(...)`), and `event.data` → `event.output` / `event.error`.
8. **Replace action creators:** `pure`/`choose` → `enqueueActions`; `respond` → `sendTo` with a sender in the
   payload; `escalate` → `throw`; `stop` → `stopChild`; imported `spawn` → `spawnChild` or `assign` spawner.
9. **Audit semantics** (§3): action order, external vs internal transitions (`reenter: true`), child re-entry,
   `subscribe` replay, `cancel` ids, `waitFor` timeouts.
10. **Migrate snapshot consumers:** `state.done` → `status`, `meta` → `getMeta()`, `nextEvents`,
    `toStrings()`, `history`, `changed`, `event`.
11. **Migrate persistence:** restore via `createActor(m, { snapshot })`; persist with
    `actor.getPersistedSnapshot()`. v4 persisted states are not v5 snapshots; re-create from
    `machine.resolveState({ value, context })` or reset users to an initial state.
12. **Migrate framework hooks** (§4).
13. **Typecheck and test** (§8).

---

## 7. Grep patterns for stale usages

Run from the repo root. Requires ripgrep (`rg`); swap in `grep -rnE --include='*.ts' ...` if missing. Every hit
needs review: some patterns (`data:`, `.state`) also match unrelated code.

```bash
G=(-n --glob '!node_modules' --glob '!dist' -g '*.{ts,tsx,js,jsx,mts,cts,mjs,cjs,vue,svelte}')

# --- Construction / interpretation ---
rg "${G[@]}" -e '\bMachine\(' -e '\binterpret\(' -e '\bInterpreter\b' -e '\bAnyInterpreter\b'
rg "${G[@]}" -e '\.withConfig\(' -e '\.withContext\(' -e '\bservices\s*:' -e '\bmachine\.options\b'
rg "${G[@]}" -U -e '\}\s*,\s*\{\s*(actions|guards|services|actors|delays)\s*:'   # deprecated 2nd createMachine arg
rg "${G[@]}" -e '\bpredictableActionArguments\b' -e '\bpreserveActionOrder\b' -e '\bstrict\s*:\s*true'
rg "${G[@]}" -e '\btsTypes\b' -e '\.typegen\b' -e '\bschema\s*:\s*\{' -e '\bcreateModel\b' -e "xstate/lib/"
rg "${G[@]}" -e '\bdevTools\s*:' -e "@xstate/inspect" -e "@xstate/test\b" -e "@xstate/fsm\b"
rg "${G[@]}" -e '\bexecute\s*:\s*false' -e '\bdeferEvents\b' -e '\.execute\('

# --- Actor API ---
rg "${G[@]}" -e '\.onTransition\(' -e '\.onDone\(' -e '\.onStop\(' -e '\.onChange\(' -e '\.onEvent\(' -e '\.onSend\('
rg "${G[@]}" -e '\.batch\(' -e '\.nextState\(' -e '\.initialState\b' -e '\b(service|interpreter)\.(state|children|status|machine)\b'
rg "${G[@]}" -e '\.start\(\s*[^)\s]' -e '\bstate\s*:\s*(persisted|restored|saved)'   # start(state) / state option

# --- String events ---
rg "${G[@]}" -e "\.send\(\s*['\"\`]" -e "\bsend\(\s*['\"\`][^'\"\`]+['\"\`]\s*," -e "\.can\(\s*['\"\`]"

# --- Action creators ---
rg "${G[@]}" -e "import\s*\{[^}]*\b(send|respond|escalate|pure|choose|sendUpdate|start|spawn|actions|stop)\b[^}]*\}\s*from\s*['\"]xstate['\"]"
rg "${G[@]}" -e '\bactions\.(assign|send|raise|pure|choose|log|cancel|respond|escalate|forwardTo|sendParent|stop|start)\b'
rg "${G[@]}" -e '\bautoForward\b' -e '\bforward\s*:' -e '\bsync\s*:\s*true' -e '\bactivities\s*:' -e '\bonEntry\s*:' -e '\bonExit\s*:'
rg "${G[@]}" -e "\bcancel\(\s*['\"\`]"   # confirm the matching send has an explicit id

# --- Positional (context, event) implementations ---
rg "${G[@]}" -e '\(\s*(context|ctx|c|_ctx|_context|_)\s*,\s*(event|e|ev|evt|_e|_event)\s*[,)]'
rg "${G[@]}" -e '\(\s*(context|ctx)\s*\)\s*=>'   # single positional context arg (noisy; review machine files)

# --- Guards / transitions ---
rg "${G[@]}" -e '\bcond\s*:' -e "\bin\s*:\s*['\"\`]" -e '\binternal\s*:\s*(true|false)' -e '\bexternal\s*:'
rg "${G[@]}" -e "['\"]{2}\s*:" -e '\bon\s*:\s*\[' -e '\bafter\s*:\s*\[' -e '\bparallel\s*:\s*true' -e '\bhistory\s*:\s*true'
rg "${G[@]}" -e '\binvoke\s*:\s*[\x27"]'   # string invoke shorthand

# --- Invoke / output / events ---
rg "${G[@]}" -e '\bdata\s*:' -e '\bevent\.data\b' -e '\be\.data\b' -e '\bev\.data\b'
rg "${G[@]}" -e "done\.invoke\." -e "error\.platform" -e "['\"\`]done\.state\." -e "error\.execution" -e 'xstate\.after\('
rg "${G[@]}" -e '\bfromReducer\b' -e 'src\s*:\s*\(\s*(context|ctx)'

# --- Snapshot API ---
rg "${G[@]}" -e '\.nextEvents\b' -e '\.toStrings\(' -e '\.configuration\b' -e '\.changed\b' -e '\b(state|snapshot)\.(done|meta|history|event|_event|actions|transitions)\b'
rg "${G[@]}" -e '\bState\.(from|create)\b' -e 'instanceof\s+State\b' -e '\bmatchState\(' -e '\bisState\(' -e '\bAnyState\b' -e '\bTypestate\b' -e '\bEmittedFrom<'

# --- Framework packages ---
rg "${G[@]}" -e '\buseInterpret\b' -e '\buseSpawn\b' -e '\bcreateService\b' -e "@xstate/react/fsm"
rg "${G[@]}" -e 'useActor\(\s*\w*(Ref|ref|Service|service|Actor)\b' -e 'useMachine\([^)]*,\s*\{\s*(actions|guards|services|delays|context|state)\b'
rg "${G[@]}" -e 'const\s*\{\s*state\s*,\s*send\s*,\s*service\s*\}' -e 'Provider\s+machine='

# --- Deprecated within 5.x (v6 removes them) ---
rg "${G[@]}" -e '\bgetNextSnapshot\(' -e '\bgetInitialSnapshot\(' -e '\bstop\(' -e '\binterpret\(' -e '\bAnyInterpreter\b'
```

---

## 8. Verification checklist

- [ ] `bunx tsc --noEmit` passes with `strictNullChecks`; no `any` casts added to silence XState types.
- [ ] No hits remain from §7 (or each remaining hit is a confirmed false positive).
- [ ] Every machine with implementations uses `setup(...)`; no second `createMachine` argument.
- [ ] Every `invoke`/`spawn` source is actor logic; child data flows through `input`, not parent context.
- [ ] Every `onDone`/`onError` reads `event.output` / `event.error`.
- [ ] Each self/absolute-target transition that must restart timers or invocations has `reenter: true`.
- [ ] Custom actions listed before an `assign` do not expect the updated context.
- [ ] Code reading the initial snapshot calls `getSnapshot()` (not a replaying `subscribe`).
- [ ] Every delayed `raise`/`sendTo` that is cancelled has an explicit `id`.
- [ ] Every actor has an `error` observer or a parent `onError` path; React trees have error boundaries (≥ 6.1).
- [ ] Persisted state round-trips: `createActor(m, { snapshot: actor.getPersistedSnapshot() })`.
- [ ] `waitFor` calls in tests pass an explicit `timeout`.
- [ ] Tests updated: use `createActor` + `getSnapshot()`, `transition()` for pure checks, `SimulatedClock` for timers.
- [ ] No imports of `@xstate/inspect`, `@xstate/test`, typegen files, `xstate/lib/*`.

---

## 9. 5.x minor feature timeline (`xstate`)

Use these as minimum versions when emitting code. Only user-facing features are listed.

| Version | Feature |
| --- | --- |
| 5.0 | `setup()`, `input`/`output`, actor systems + `systemId`, `enqueueActions`, `spawnChild`, `stopChild`, higher-order guards (`and`/`or`/`not`/`stateIn`), partial wildcards `'a.*'`, `inspect` option, `onSnapshot`, deep persistence, `createEmptyActor`, `waitFor` default `Infinity` |
| 5.2 | `toPromise(actor)` resolves with output / rejects with error |
| 5.3 | `assertEvent(event, type \| types[])` narrows events in entry/exit/input |
| 5.4 | `context` factory receives `self` (pass parent ref into spawned children) |
| 5.5 | `getNextSnapshot(logic, snapshot, event)` (now deprecated in favor of `transition`) |
| 5.6 | `createActor` throws when required `input` is missing; 5.6.2 exports `getInitialSnapshot` (now deprecated) |
| 5.7 | Inspection of `@xstate.microstep` and `@xstate.action`; `resolveState` throws on incompatible values |
| 5.8 | `setup` rejects references to non-configured implementations (types) |
| 5.9 | `emit(...)` action + `actor.on(type, handler)`; `params` for `enqueueActions` |
| 5.10 | `clock` and `logger` from root `createActor` options propagate to the whole system |
| 5.11 | Inline actor logic allowed alongside named `setup` actors |
| 5.12 | `setup({ types: { meta } })` types state/transition meta |
| 5.13 | `fromPromise` receives `signal` (aborted when the invoking state exits); warning when built-in actions are called inside custom actions; 5.13.1 `actor.on('*', ...)` |
| 5.14 | Every logic creator can `emit`; `system.inspect(fn)` returns a subscription; `actorId` on done/error actor events |
| 5.15 | Exported `CallbackActorRef`, `ObservableActorRef`, `PromiseActorRef`, `TransitionActorRef`; typegen types removed |
| 5.16 | `SnapshotStatus` type; `enqueue.sendParent(...)` |
| 5.17 | `getMeta()` keys typed by state id; 5.17.2 `ActorRefFromLogic<T>` |
| 5.18 | `waitFor(..., { signal })`; precise state-value typings for `setup` machines |
| 5.19 | Pure `transition(logic, snapshot, event)` and `initialTransition(logic, input?)` → `[snapshot, actions]`; 5.19.1 `spawn` input required when typed |
| 5.20 | Graph and model-based testing moved into core: `import { getShortestPaths, createTestModel } from 'xstate/graph'` |
| 5.21 | `setup(...).createStateConfig({...})` for typed modular state configs |
| 5.22 | Setup-bound helpers: `createAction`, and `.assign/.sendTo/.raise/.log/.cancel/.stopChild/.enqueueActions/.emit/.spawnChild` on the setup object; 5.22.1 `actor.systemId` public |
| 5.23 | `system.getAll()` |
| 5.24 | `setup(...).extend({ actions, guards, delays })` |
| 5.25 | `assertEvent(event, 'FEEDBACK.*')` partial descriptors |
| 5.26 | `getNextTransitions(snapshot)` |
| 5.27 | `getMicrosteps(...)` / `getInitialMicrosteps(...)` |
| 5.28 | Routable states: `route: {}` + explicit `id`, navigate with `{ type: 'xstate.route', to: '#id' }`; route guards (5.31.1 resolves named `setup` guards) |
| 5.29 | `actor.select(selector, equalityFn?)` → `Readable` with `.get()` / `.subscribe()` |
| 5.30 | `filterEvents` option for `xstate/graph` traversals and `createTestModel` |
| 5.31 | `mapState(snapshot, mapper)`; `options: { maxIterations }` on machine config for infinite-loop detection (default `Infinity`) |
| 5.32 | `InspectedTransitionEvent` exported; 5.32.2 wildcard fallback when exact-descriptor guards fail; 5.32.4 history inside unvisited parallel state fixed |
| 5.33 | `types.transitionMeta` separate from `types.meta` |

Deprecated in current 5.x source (still work; removed in v6): `interpret`, `Interpreter`, `AnyInterpreter`, `stop`
(alias of `stopChild`), `getNextSnapshot`, `getInitialSnapshot`, `AnyState`, actor option `state`, the second
`createMachine` argument, `@xstate/react` `createActorContext` Provider `machine` prop.

---

## 10. Integration package majors and `@xstate/store`

### `@xstate/react`

| Version | Change |
| --- | --- |
| 4.0 | XState v5 support: `useActorRef` replaces `useInterpret`/`useSpawn`; `useActor` takes logic; implementations via `machine.provide`; `useMachine` = alias of `useActor`; FSM hooks removed |
| 4.1 | `useSelector(actor, ...)` accepts `undefined` actor |
| 4.1.2 | `input` required in hook options when the machine types `input` |
| 5.0 | Peer bump to `xstate` ≥ 5.19; React 19 peer |
| 6.0 | Peer bump to `xstate` ≥ 5.20 (no API change) |
| 6.1 | `useActor` / `useSelector` throw when the actor reaches `status: 'error'` → catch with error boundaries |

### `@xstate/vue`, `@xstate/svelte`, `@xstate/solid`

| Package | Version | Change |
| --- | --- | --- |
| vue | 3.0 | v5 support; `useMachine` returns `{ snapshot, send, actorRef }`; `useInterpret`/`useSpawn` removed → `useActorRef` |
| vue | 4.0 / 5.0 | Peer bumps to `xstate` 5.19 / 5.20 |
| svelte | 3.0 | v5 support; `{ snapshot, send, actorRef }`; `useActor(logic)`, `useActorRef(logic)` added |
| svelte | 4.0 / 5.0 | Peer bumps to `xstate` 5.19 / 5.20; Svelte 3–5 peer |
| solid | 0.2 | v5 support; `createService` removed → `useActorRef`; `useActor(logic)`; `fromActorRef(ref)` |
| solid | 1.0 / 2.0 | Peer bumps to `xstate` 5.19 / 5.20 |

When a hook package fails to resolve types after upgrading `xstate`, check that the hook major matches:
xstate ≥ 5.20 → react 6, vue 5, svelte 5, solid 2.

### `@xstate/store`

| Version | Change |
| --- | --- |
| 1.0 | First stable release: `createStore(context, transitions)` |
| 2.0 | React adapter uses native `useSyncExternalStore` (React ≥ 18), `getServerSnapshot`; `useSelector` requires a defined store |
| 2.x | 2.2 `store.inspect`; 2.3 Solid; 2.4 single-config form + emitted events; 2.6 `createStoreWithProducer` config form |
| 3.0 | Single config object only (`createStore({ context, on })`); transitions must return the **full** context (no partial assigners); `enq.effect(...)` and `enq.emit.name(...)`; emitted types declared via `emits: { name: (payload) => {} }`; `store.trigger.name(payload)` (3.0 minor) |
| 3.1–3.17 | 3.1 `createStoreConfig`, `useStore`; 3.2 selectors; 3.3 `store.transition`; 3.4 `createAtom`; 3.6 async atoms; 3.7 `useAtom`; 3.8 `undoRedo`; 3.9 `createStoreHook`; 3.10 effect-only transitions; 3.13 snapshot undo strategy; 3.14 `.with(extension)`; 3.15 `@xstate/store-react` / `-solid` packages (subpaths deprecated); 3.16 `store.on('*')`; 3.17 `persist`, `reset` extensions |
| 4.0 | Removed `createStoreWithProducer` (use `produce` inside handlers), `@xstate/store/react` and `/solid` subpaths (use `@xstate/store-react`, `-solid`, `-vue`, `-svelte`, `-preact`, `-angular`), `createStore(context, transitions)`, config form of `undoRedo`, `read` arg of computed atoms; `emits` → `schemas.emitted`; added Standard Schema `schemas` + `@xstate/store/validate`, `createStoreLogic`, `enq.trigger`, `store.can.event(...)`, `createReducerAtom`, `createAtomConfig`, broadcast storage helpers, async `persist` storage; inspection emits a single `@xstate.transition` shape |
| 4.1 / 4.2 / 4.3 | `store.schemas`; effects receive `{ trigger, send, getSnapshot }`; `createSourceAtom`; `xstate` peer is optional (only `fromStore` needs it) |

Subpaths in 4.x: `@xstate/store`, `/undo`, `/reset`, `/persist`, `/validate`.

---

## 11. XState v6 ALPHA preview

> **ALPHA. Do not use in production.** `xstate@6.0.0-alpha.65`, `@xstate/react@7.0.0-alpha.4`,
> `@xstate/store@5.0.0-alpha.6` (npm `alpha` dist-tag). APIs below come from the `next` branch's
> `docs/xstate-v5-to-v6.md` and changelogs and may still change. Write v5 for shipped code.

Install for experiments only: `bun add xstate@alpha`, or side by side: `bun add xstate-v6@npm:xstate@alpha`.

### Core model change: inline functions + `enq`

Every `entry`, `exit`, and transition is one function `(args, enq) => result`. Action creators are no longer exported.

```ts
// v6 ALPHA — illustrative only
import { createMachine } from 'xstate';
import { z } from 'zod';

const counter = createMachine({
  schemas: {
    context: z.object({ count: z.number() }),
    events: { INC: z.object({ by: z.number() }), RESET: z.object({}) },
  },
  context: { count: 0 },
  initial: 'active',
  states: {
    active: {
      on: {
        INC: ({ context, event }) => ({ context: { count: context.count + event.by } }),
        RESET: (_, enq) => {
          enq.emit({ type: 'reset' });
          return { context: { count: 0 } };
        },
      },
    },
  },
});
// actor.trigger.INC({ by: 2 })
```

Returning `undefined` without enqueueing means "event unhandled here" (inline guarding). Returned `context` is a
shallow patch.

### Planned breaking changes (v5 → v6)

| v5 | v6 ALPHA |
| --- | --- |
| `assign({...})` | return `{ context: patch }` |
| `raise`, `sendTo`, `sendParent`, `forwardTo`, `emit`, `log`, `cancel` | `enq.raise`, `enq.sendTo(ref, ev)` (parent: `enq.sendTo(parent, ev)`), `enq.emit`, `enq.log`, `enq.cancel` |
| `spawnChild`, `stopChild` / `stop` | `enq.spawn(logic, opts)`, `enq.stop(ref)` |
| `enqueueActions(...)` | plain inline function |
| `and`, `or`, `not`, `stateIn` | JS `&&`, `\|\|`, `!`; `checkStateIn(self.getSnapshot(), '#id')` |
| named guards `({ context }, params) => bool` | plain predicates called as `guards.name(value)`; transition args are no longer injected |
| `guard:` / `actions:` / `cond:` on transition objects, string or array `entry`/`exit` | throw (dev) — use one inline function |
| transition arrays in `on` / `always` | one function choosing a target; new `type: 'choice'` states |
| `types: {} as {...}` | `schemas: {...}` (Standard Schema/Zod, or `types<T>()` for type-only); `events`/`emitted` become **maps keyed by type** |
| `fromPromise` | `createAsyncLogic({ run, timeout?, id? })` with `signal` and durable `enq.step` |
| `fromCallback` / `fromObservable` / `fromEventObservable` | `createCallbackLogic` / `createObservableLogic` / `createEventObservableLogic` |
| `fromTransition` | `createLogic({ context, run })` |
| `interpret`, `Interpreter`, `getNextSnapshot`, `getInitialSnapshot` | removed; use `createActor`, `transition`, `initialTransition` |
| `systemId` | `registryKey`; `system.get(key)`; typed registries via `createSystem` |
| `machine.implementations`, `snapshot._nodes` | `machine.sources`, `snapshot.nodes` |
| `spawn('name')` in context factory | `spawn(actors.name)` |
| inspection `@xstate.event/.snapshot/.action/.microstep` | only `@xstate.actor` and `@xstate.transition` (microsteps nested) |
| `xstate.done.actor.<id>` style event types | stable `xstate.done.actor` + `actorId` payload; select with `matches: { actorId }` |
| `sendTo` missing target → actor error | dead letter `'missingTarget'`, sender stays active; `onRejectedEvent` |
| `maxIterations` default `Infinity` | default `1000`, throws `InfiniteTransitionError` |
| restart after `stop()` | actors are single-use; `start()` after `stop()` throws |
| final states | inert everywhere (no transitions, no invokes), SCXML-aligned |
| `devTools` option, `xstate/actions`, `xstate/guards`, `xstate/dev`, `xstate/scxml` subpaths | removed (`@xstate/scxml` package for SCXML) |
| `xstate/graph` `createTestModel` | removed; `xstate/graph` only generates paths; run with `@xstate/test` `testPaths()` |
| `@xstate/immer`, `@xstate/inspect` | removed |
| v5 persisted snapshots | **not compatible**; drain or migrate stored state |
| `createMachine(config, impl)` | one argument only |

### New in v6 ALPHA

Choice states, per-state `timeout`/`onTimeout`, duration strings (`'5s'`, `'PT1M30S'`), state `input` and
`initial: { target, input }`, `setup({ states })` state contracts and per-state context schemas (typestates),
`schemas.internalEvents` (raisable but rejected from outside), `actor.trigger.X()`, `enq.listen` /
`enq.subscribeTo`, machine `version` + `machineVersions()` snapshot migration, `serializeMachine` /
`createMachineFromConfig` (machine as JSON), durable timers and `xstate/durable`, `xstate/fsm` compact FSMs.

### Tooling and bindings

- Codemod: `bunx @xstate/codemod migrate "src/**/*.ts" --dry`. Transforms: `rename-imports`, `string-targets`,
  `types-to-schemas`, `report-removed-apis`. It does **not** rewrite action creators, guard combinators, or
  transition arrays — those are manual.
- `@xstate/react@7` alpha: hook signatures unchanged; the machine passed on the first render is used for the
  component's lifetime (vary via `input` / `.provide()`, switch machines via React `key`); Fast Refresh keeps state;
  `input` required when the machine's input schema requires it.
- `@xstate/store@5` alpha: `fromStore()` returns v6 actor logic and requires `xstate@6`. Keep `@xstate/store@4`
  with XState v5.

---

## 12. Write v5 code that migrates cleanly to v6

Each item is valid, idiomatic v5 today and shrinks the v6 diff.

| Prefer in v5 | Why it helps |
| --- | --- |
| `setup({ types, actions, guards, actors, delays })`, never the 2nd `createMachine` arg | `setup` survives in v6; the 2nd arg is ignored there |
| `types.events` written as an **inline union literal** | the `types-to-schemas` codemod converts only inline unions into the v6 event map |
| `createActor`, `transition`, `initialTransition` | `interpret`, `getNextSnapshot`, `getInitialSnapshot` are removed |
| `stopChild`, not `stop` | `stop` alias is removed |
| Named actors registered in `setup({ actors })`, referenced by string `src` | string sources still resolve in v6 and persist with stable identity |
| Guard implementations that delegate to pure value predicates (`({ context }) => isAdult(context.age)`) | v6 named guards are plain predicates; the body ports unchanged |
| Partial-object `assign({ key: ... })` returning only changed keys | maps 1:1 to a v6 shallow `{ context: patch }` |
| Simple, flat `enqueueActions` blocks | they become the body of a v6 inline function |
| `fromPromise` that honors `signal` | `createAsyncLogic` keeps `signal`; cancellation logic ports directly |
| Avoid `fromTransition` for new code; use a small machine or `@xstate/store` | `fromTransition` is removed (→ `createLogic`) |
| Check optional children before `sendTo` (`self.getSnapshot().children.worker`) | v6 turns missing targets into dead letters instead of errors |
| One guarded transition per decision point instead of long `always` / guard arrays | v6 rejects arrays; a single function or `choice` state replaces them |
| JSON-serializable `context` (no functions, `Map`, `Set`, class instances) | v6 dev builds warn/throw on non-JSON persisted context |
| Version persisted snapshots yourself and plan to drain them before v6 | v5 snapshots are not v6-compatible |
| `@statelyai/inspect` or `inspect` reading `@xstate.actor` / `@xstate.transition` | other inspection event types disappear |
| Do not read `snapshot._nodes`, `machine.implementations`, or private `_*` fields | renamed/removed |
| Avoid `@xstate/immer` and `@xstate/inspect` | removed in v6 |
| In React, pass a stable machine and vary it with `input` / `.provide()` | matches `@xstate/react@7` first-render semantics |

---

## 13. Pitfalls

- **Partial migrations that typecheck.** `(context, event) =>` implementations still compile in loosely typed
  code (`any`), but `context` is now the args object. Symptom: `context.count` is `undefined`. Fix: destructure
  `({ context, event })` everywhere; run the positional-args grep.
- **`data:` leftovers silently ignored.** A final state `data` key does nothing in v5. Fix: `output`.
- **Self-transitions that stopped restarting timers.** v4 `target: 'polling'` from inside `polling` re-entered;
  v5 does not. Fix: `reenter: true`.
- **`cancel('TIMER')` no-ops.** Ids are no longer derived from event types. Fix: pass `{ id }` on the delayed send.
- **First render shows stale state** because code waited for `subscribe` to emit. Fix: read `getSnapshot()`.
- **Invoked logic reading parent context.** v5 actors do not see parent context. Fix: pass `input`.
- **`EmittedFrom` type errors** after upgrade: the name now means emitted events. Fix: `SnapshotFrom`.
- **Hook major mismatch** (e.g. `@xstate/react@4` with `xstate@5.33`) causes duplicate type identities. Fix: align
  majors (§10).
- **Copying v6 alpha examples into v5 code.** `enq`, `schemas`, `createAsyncLogic`, `checkStateIn`, and
  `actor.trigger` do not exist in v5. Check the fingerprint table in §1 before emitting code.
- **Docs drift.** The 5.0.0 changelog lists `state.configuration → state.nodes`, but v5 source uses `_nodes`;
  the docs say Vue returns `actor`, source returns `actorRef`. When in doubt, read `packages/*/src`.
