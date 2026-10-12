# XState v5 TypeScript

Scope: strong typing for XState v5 (`xstate@5.33.x`). Covers compiler requirements, `setup({ types })`, event narrowing, typed params for actions, guards, and delays, typed actors and children, type helpers (all checked against the `xstate` exports), generic machine factories, and a catalog of common type errors with fixes.

## Contents

- Requirements
- Why typegen is gone
- `types` in `setup()`
- Event narrowing
- Typed params (actions, guards, delays)
- Typing actors, `invoke`, and `spawn`
- Typed `snapshot.children`
- Emitted events, tags, meta, input, output
- Implementations outside the config
- Type helpers
- Generic machine factories
- Common type errors and fixes
- Stale TypeScript API

## Requirements

- **TypeScript ≥ 5.0.** Use the latest version you can. XState relies on `const` type parameters (`setup().createMachine` infers the config as `const TConfig` to compute literal state values) and on newer inference fixes.
- **`strictNullChecks: true`** (or `strict: true`). This is not optional in practice. Without it, `undefined` is absorbed into every type. XState then cannot tell required from optional input, required from optional params, or `output` while done from `output` while active, and inference fails in confusing ways.
- **`skipLibCheck: true`** is recommended. It keeps compile time down for large generic declarations.
- `exactOptionalPropertyTypes` is supported (≥ 5.19.2).
- If `declaration: true` gives "inferred type cannot be named" errors on exported `setup()` machines, upgrade to xstate ≥ 5.28. That release exported the internal types that declaration emit needs.

```jsonc
// tsconfig.json
{ "compilerOptions": { "strict": true, "skipLibCheck": true } }
```

## Why typegen is gone

v4 typegen (`tsTypes: {} as import('./machine.typegen').Typegen0` plus a CLI or VS Code generator) existed because v4 types could not tie event types to the transitions that handle them. v5 drops it. All typegen types were removed from the package (5.15). The replacements:

- `setup({ types, actions, guards, actors, delays })` gives every string reference a literal type that the compiler checks.
- `on: { evt: ... }` narrows `event` to `evt` inside that transition.
- Where narrowing is impossible (entry, exit, `invoke.input`), use dynamic `params` or `assertEvent`.

Remove `tsTypes` and `*.typegen.ts` files when you migrate. They are not read.

## `types` in `setup()`

`types` is type-only. Its runtime values are ignored, so write `{} as T`. You can annotate each key, or cast the whole object (`types: {} as { context: C; events: E }`). Both forms work.

| Key | Types |
| --- | --- |
| `context` | `context` in every expression, `snapshot.context`. The machine's `context` must match it. A factory `({ input }) => ...` is checked too |
| `events` | Union of event objects with a literal `type`. It is the type of `actor.send`, and transitions are narrowed by it |
| `input` | `createActor(m, { input })`, the `context` factory `input`, and parent `invoke`/`spawn` input. A non-optional input makes `input` required everywhere |
| `output` | Root `output` mapper return type, `snapshot.output` when done, the parent's `onDone` `event.output`, and `toPromise` |
| `emitted` | `emit(...)` payloads and `actor.on(type, handler)` |
| `children` | `{ [childId]: 'actorKeyInSetupActors' }`. Gives typed `snapshot.children[childId]`. Requires `actors` that contain those keys |
| `tags` | Union of tag strings. Checks `tags: [...]` in states and `snapshot.hasTag` |
| `meta` | Type of state `meta`, and of transition `meta` unless `transitionMeta` is set. Values returned by `getMeta()` |
| `transitionMeta` | Separate type for transition `meta` (≥ 5.33) |

`setup()` does **not** accept `actions`, `guards`, `delays`, or `actors` inside `types`. You get `TS2353: ... 'actions' does not exist in type 'SetupTypes<...>'`. Some docs cheatsheets show those keys. They are valid only for bare `createMachine({ types })`. In `setup`, these types come from the implementation objects.

```ts
import { setup } from 'xstate';

type Ctx = { query: string; results: string[] };
type Ev =
  | { type: 'search.change'; query: string }
  | { type: 'search.submit' }
  | { type: 'search.clear' };

export const searchMachine = setup({
  types: {
    context: {} as Ctx,
    events: {} as Ev,
    input: {} as { initialQuery?: string },
    tags: {} as 'busy' | 'empty',
  },
}).createMachine({
  context: ({ input }) => ({ query: input.initialQuery ?? '', results: [] }),
  initial: 'idle',
  states: { idle: { tags: 'empty' } },
});
```

Naming events: prefer dot-namespaced literals (`'search.change'`). They read well in logs, and you can match a whole group with a wildcard transition (`'search.*'`) and with `assertEvent(event, 'search.*')` (≥ 5.25).

## Event narrowing

Inside `on: { 'search.change': { ... } }`, the `event` argument of that transition's `actions`, `guard`, and their dynamic `params` is narrowed to `{ type: 'search.change'; query: string }`. Everywhere else it is the full union:

| Location | `event` type |
| --- | --- |
| `on.<type>` actions, guards, params | Narrowed to that type (wildcards narrow to the matching members) |
| `entry`, `exit` | Full union. The state can be entered from many transitions |
| `invoke.input`, `spawnChild` input | Full union |
| `always`, `after` | Full union |
| `invoke.onDone` / `onError` | `DoneActorEvent<Output>` / `ErrorActorEvent` (`event.output` typed, `event.error` is `unknown`) |

There are two ways to get a narrow type where TS cannot infer it:

```ts
import { assertEvent, setup } from 'xstate';

setup({
  types: { events: {} as { type: 'greet'; name: string } | { type: 'wave' } },
  actions: {
    // 1. Preferred: implementation takes params, so it is not tied to the event shape
    sayHello: (_, params: { name: string }) => console.log(`hi ${params.name}`),
  },
}).createMachine({
  initial: 'idle',
  states: {
    idle: { on: { greet: 'greeting' } },
    greeting: {
      entry: [
        { type: 'sayHello', params: ({ event }) => ({ name: event.type === 'greet' ? event.name : 'you' }) },
        // 2. Assert: narrows the type, and throws at runtime if wrong
        ({ event }) => {
          assertEvent(event, 'greet');
          console.log(event.name.toUpperCase());
        },
      ],
    },
  },
});
```

Use `assertEvent` only when the event is certain by construction. It throws inside the action, which puts the actor in the error state. When an event can legitimately be another type, narrow with `event.type === '...'` instead.

## Typed params (actions, guards, delays)

The second argument of an implementation is its `params`. Annotate it, and XState enforces the reference shape:

- Params type includes `undefined` (or there is no second arg): `'name'`, `{ type: 'name' }`, and `{ type: 'name', params }` are all allowed.
- Params type is required: only `{ type: 'name', params: value | (({ context, event }) => value) }`. A plain string becomes `TS2322: Type 'string' is not assignable to type 'Actions<...>'`.

```ts
import { setup } from 'xstate';

export const cartMachine = setup({
  types: {
    context: {} as { items: number; limit: number },
    events: {} as { type: 'item.add'; qty: number },
  },
  actions: {
    track: (_, params: { name: string; value?: number }) => console.log(params),
  },
  guards: {
    fitsLimit: ({ context }, params: { qty: number }) => context.items + params.qty <= context.limit,
  },
  delays: {
    debounce: ({ context }) => (context.items > 5 ? 500 : 300),
  },
}).createMachine({
  context: { items: 0, limit: 10 },
  on: {
    'item.add': {
      guard: { type: 'fitsLimit', params: ({ event }) => ({ qty: event.qty }) },
      actions: { type: 'track', params: ({ event }) => ({ name: 'add', value: event.qty }) },
    },
  },
});
```

Delays are the exception. `after: { debounce: ... }` has no way to pass params. The `params` argument of a delay function is typed as the union of the *action* params of the setup, because it is filled when a delayed `raise`/`sendTo` action runs. Do not annotate it. Read `context` and `event` instead.

Why params beat reading `event` inside implementations: the implementation stays a plain function of its inputs. You can reuse it across events and states, test it without a machine, and `machine.provide()` can replace it without knowing the event union.

Guard combinators keep the typing: `and(['isAdmin', { type: 'fitsLimit', params: { qty: 1 } }])`, `not('isAdmin')`. Inside `setup().extend({ guards })`, string references to base guards are typed too (≥ 5.24).

## Typing actors, `invoke`, and `spawn`

Actor logic creators carry types. Annotate the creator argument or pass generics:

```ts
import { fromCallback, fromObservable, fromPromise, fromTransition } from 'xstate';
import { interval, map } from 'rxjs';

// fromPromise<TOutput, TInput>: or annotate { input }
const loadUser = fromPromise(async ({ input }: { input: { id: string } }) => ({ id: input.id, name: 'Ada' }));

// fromCallback<TEventReceived, TInput, TEmitted?>
const ticker = fromCallback<{ type: 'ticker.stop' }, { ms: number }>(({ input, sendBack, receive }) => {
  const id = setInterval(() => sendBack({ type: 'tick' }), input.ms);
  receive((e) => e.type === 'ticker.stop' && clearInterval(id));
  return () => clearInterval(id);
});

// fromObservable<TContext (emitted value), TInput>
const clock = fromObservable<number, { period: number }>(({ input }) =>
  interval(input.period).pipe(map((n) => n * input.period)),
);

// fromTransition(reducer, initialContext | ({ input }) => context)
const counter = fromTransition(
  (state: { count: number }, event: { type: 'inc' }) => (event.type === 'inc' ? { count: state.count + 1 } : state),
  { count: 0 },
);
```

When you register these in `setup({ actors })`:

- `invoke.src` and `spawn`/`spawnChild` strings must be keys of `actors` (TS2322 with the list of allowed keys).
- `invoke.input` is checked against the actor's input. It is **required** when the input type does not include `undefined`.
- `onDone` `event.output` is the promise result or machine output. `onError` `event.error` is `unknown`, so narrow it (`event.error instanceof Error`).
- `spawn('key', { input })` requires `input` when the actor needs it (≥ 5.19.1). A missing input shows up as a misleading `Argument of type 'string' is not assignable to parameter of type 'AnyActorLogic'`.
- Inline logic (`src: fromPromise(...)`) is allowed even when named actors exist (≥ 5.11). It is typed, but it cannot be persisted or overridden with `provide`. Prefer named actors.

Store spawned refs in context with `ActorRefFrom<typeof logic>`:

```ts
import { assign, setup, type ActorRefFrom } from 'xstate';

const todoMachine = setup({ types: { input: {} as { title: string } } }).createMachine({
  context: ({ input }) => ({ title: input.title, done: false }),
});

export const listMachine = setup({
  types: {
    context: {} as { todos: ActorRefFrom<typeof todoMachine>[] },
    events: {} as { type: 'todo.add'; title: string },
  },
  actors: { todoMachine },
}).createMachine({
  context: { todos: [] },
  on: {
    'todo.add': {
      actions: assign({
        todos: ({ context, event, spawn }) => [
          ...context.todos,
          spawn('todoMachine', { input: { title: event.title } }),
        ],
      }),
    },
  },
});
```

`sendTo` type-checks the event against the target only when the target is a typed ref (`sendTo(({ context }) => context.ref, {...})`). A string target id (`sendTo('timer', {...})`) is not checked against the child's events. Prefer refs, or declare `types.children` and read the ref from `system` or `children` when the payload matters.

## Typed `snapshot.children`

`snapshot.children` is a record of `ActorRef | undefined`, because a child exists only while its invoking state is active or until it is stopped. Types come from:

1. **`types.children`**: `{ [childId]: 'actorKey' }`. Each listed id gets the exact ref type. If every actor has an id, there is no index signature, so a typo in `children.someId` is an error.
2. **Root-level `invoke` with a literal `id` and `src` string**: inferred automatically (5.32.1 fixed union pollution between children). Only the root node's `invoke` is scanned. Nested states need `types.children`.
3. Otherwise: an index signature typed as the union of refs of actors that have no literal id.

```ts
import { createActor, fromPromise, setup } from 'xstate';

const fetchStats = fromPromise(async () => ({ visits: 3 }));

const dashboard = setup({
  types: { children: {} as { stats: 'fetchStats' } },
  actors: { fetchStats },
}).createMachine({
  initial: 'loading',
  states: { loading: { invoke: { id: 'stats', src: 'fetchStats' } } },
});

const statsRef = createActor(dashboard).getSnapshot().children.stats; // ActorRef<PromiseSnapshot<...>> | undefined
statsRef?.getSnapshot().output?.visits;
```

Declaring `types.children` makes `actors` required and forces every mapped key to be present (`Property 'actors' is missing ...` or `Property 'fetchStats' is missing ...`).

## Emitted events, tags, meta, input, output

```ts
import { createActor, emit, setup } from 'xstate';

const uploader = setup({
  types: {
    input: {} as { file: string },
    output: {} as { url: string },
    emitted: {} as { type: 'progress'; pct: number } | { type: 'warning'; message: string },
    tags: {} as 'busy',
    meta: {} as { title: string },
  },
}).createMachine({
  id: 'upload',
  initial: 'sending',
  states: {
    sending: {
      tags: 'busy',
      meta: { title: 'Uploading' },
      entry: emit({ type: 'progress', pct: 0 }),
      always: 'done',
    },
    done: { type: 'final' },
  },
  output: ({ self }) => ({ url: `https://cdn.example/${self.id}` }),
});

const actor = createActor(uploader, { input: { file: 'a.png' } }); // input required
actor.on('progress', (e) => e.pct.toFixed()); // e narrowed to { type: 'progress'; pct: number }
actor.getSnapshot().getMeta()['upload.sending']?.title; // keys are typed state ids
```

`snapshot.value` with `setup()` is a literal union (`'sending' | 'done'`, or nested objects for compound and parallel states, ≥ 5.18). `matches()` only accepts valid partial values. Bare `createMachine` types it as `StateValue`.

Machines with routable states (`route: {}`, ≥ 5.28) add `{ type: 'xstate.route'; to: '#id' }` to the machine's event union. `EventFromLogic` includes it.

## Implementations outside the config

Contextual typing reaches only functions written inline in `setup({...})` or `createMachine({...})`. A standalone function has no context:

```ts
// TS7031: Binding element 'context' implicitly has an 'any' type
const logCount = ({ context }) => console.log(context.count);
```

Fixes, in order of preference:

1. Use the setup's bound helpers (≥ 5.22): `const s = setup({...}); const inc = s.assign({...}); const log = s.createAction(({ context }) => ...)`. Use `s.createStateConfig({...})` (≥ 5.21) for whole state nodes.
2. Annotate only what the function uses: `({ context }: { context: { count: number } }) => ...`. It is assignable because implementation args are contravariant.
3. Define it inline in `setup({ actions })` and reference it by name.

## Type helpers

All of these are exported from `xstate` (5.33.x).

| Helper | Input | Result / note |
| --- | --- | --- |
| `ActorRefFrom<T>` | machine, any actor logic, or a function returning one | `ActorRef<Snapshot, Event, Emitted>`. Use for refs in context and props |
| `ActorRefFromLogic<T extends AnyActorLogic>` | actor logic only | Stricter `ActorRefFrom` (≥ 5.17.2) |
| `SnapshotFrom<T>` | logic, ref, `Actor`, or factory function | Snapshot type. Use for selector parameters |
| `EventFromLogic<T extends AnyActorLogic>` | logic | Event union the logic accepts |
| `EventFrom<T, K?>` | machine, snapshot, or ref | Event union, or the member with `type` `K` (`EventFrom<typeof m, 'item.add'>`) |
| `ContextFrom<T>` | machine, snapshot, or `Actor` | Context type |
| `InputFrom<T>` / `OutputFrom<T>` | logic (`OutputFrom` also takes refs) | Input / done output |
| `EmittedFrom<T extends AnyActorLogic>` | logic | Emitted event union |
| `StateValueFrom<T extends AnyStateMachine>` | machine | Partial state values accepted by `matches` |
| `TagsFrom<T extends AnyStateMachine>` | machine | Tag union |
| `StateFrom<T>` | machine or factory | Machine snapshot type (older alias. Prefer `SnapshotFrom`) |
| `ActorLogicFrom<T>` | machine, or a function returning a machine or promise | The logic type. Gives `never` for non-machine logic objects such as `fromPromise(...)` |
| `MachineImplementationsFrom<T>` | machine | The `provide()` argument shape. Use to type implementation modules |
| `ExecutableActionsFrom<T>` | machine | Element type of the actions returned by `transition`/`initialTransition` |
| `StateSchemaFrom<T>` | machine | State-tree schema |
| `Actor<T>` | logic | Class type returned by `createActor` |
| `MachineSnapshot<...>` | – | Snapshot union type, usually derived via `SnapshotFrom` |
| `AnyStateMachine`, `AnyActorLogic`, `AnyActorRef`, `AnyMachineSnapshot`, `AnyActor` | – | Constraints for generic utilities |
| `UnknownActorRef` (≥ 5.14), `UnknownActorLogic` | – | `ActorRef<Snapshot<unknown>, EventObject>`. Refs whose events have required payload fields are not assignable to it (`send` is contravariant). Use `AnyActorRef` or `ActorRef<S, any>` as a constraint |
| `PromiseActorRef`, `CallbackActorRef`, `ObservableActorRef`, `TransitionActorRef` (≥ 5.15) | – | Type of `self` / refs for each logic kind |
| `PromiseActorLogic`, `CallbackActorLogic`, `ObservableActorLogic`, `TransitionActorLogic`, `CallbackLogicFunction` (≥ 5.18) | – | Logic types for library code |
| `DoneActorEvent<Output, Id>`, `ErrorActorEvent<Err, Id>`, `SnapshotEvent`, `DoneStateEvent` | – | Built-in event shapes |
| `SnapshotStatus` (≥ 5.16), `StateValue`, `EventObject`, `AnyEventObject`, `MachineContext` | – | Primitives |
| `InspectionEvent` and `Inspected*Event` | – | `inspect` callbacks (`InspectedTransitionEvent` exported ≥ 5.32) |
| `InterpreterFrom<T>` | – | Deprecated. Use `Actor<T>` |

Pass the machine type (`typeof machine`), not an actor, to `EventFromLogic`, `EmittedFrom`, `InputFrom`, `StateValueFrom`, and `TagsFrom`. They are constrained to logic.

```ts
import type { ActorRefFrom, EventFrom, SnapshotFrom } from 'xstate';
import type { cartMachine } from './cartMachine';

type CartRef = ActorRefFrom<typeof cartMachine>;
type CartSnapshot = SnapshotFrom<typeof cartMachine>;
type AddItem = EventFrom<typeof cartMachine, 'item.add'>;

export const selectCount = (s: CartSnapshot) => s.context.items;
export function addItem(ref: CartRef, qty: number) {
  ref.send({ type: 'item.add', qty } satisfies AddItem);
}
```

## Generic machine factories

A function that returns `setup(...).createMachine(...)` keeps full inference for each type argument. Use it when the machine shape is fixed and only the data type or implementations vary.

```ts
import { assertEvent, assign, createActor, fromPromise, setup, type ActorRefFrom } from 'xstate';

export function createFetchMachine<TData>(fetcher: (id: string) => Promise<TData>) {
  return setup({
    types: {
      context: {} as { data: TData | undefined; error: unknown },
      events: {} as { type: 'fetch'; id: string },
    },
    actors: {
      fetcher: fromPromise(({ input }: { input: { id: string } }) => fetcher(input.id)),
    },
  }).createMachine({
    context: { data: undefined, error: undefined },
    initial: 'idle',
    states: {
      idle: { on: { fetch: 'loading' } },
      loading: {
        invoke: {
          src: 'fetcher',
          input: ({ event }) => {
            assertEvent(event, 'fetch');
            return { id: event.id };
          },
          onDone: { target: 'idle', actions: assign({ data: ({ event }) => event.output }) },
          onError: { target: 'idle', actions: assign({ error: ({ event }) => event.error }) },
        },
      },
    },
  });
}

const numberMachine = createFetchMachine(async (id) => Number(id));
createActor(numberMachine).getSnapshot().context.data; // number | undefined

// Ref type for one instantiation (instantiation expression, TS >= 4.7)
export type FetchRef<T> = ActorRefFrom<ReturnType<typeof createFetchMachine<T>>>;
```

Guidelines:

- Prefer **one machine + `provide()`** when only implementations change. Factories create new logic objects per call, so do not call them per render or per request in hot paths.
- Prefer **`input`** when only initial data changes. Input is typed, persisted, and visible in the inspector.
- In generic utilities that accept any actor, constrain the snapshot and leave the event type open: `<TRef extends ActorRef<Snapshot<unknown> & { context: { id: string } }, any>>`. `EventObject` (and so `UnknownActorRef`) does **not** work there. `send` is contravariant, so a ref whose events carry required payload fields is not assignable to `ActorRef<..., EventObject>`.
- Do not annotate a machine variable as `AnyStateMachine`. That erases every type. Use `satisfies` or let it infer.

## Common type errors and fixes

| Error (abridged) | Cause | Fix |
| --- | --- | --- |
| `'actions' does not exist in type 'SetupTypes<...>'` | `types.actions`, `types.guards`, or `types.delays` in `setup` | Remove them. Type the implementation params instead |
| `Type 'string' is not assignable to type 'Actions<...>'` (or `Guard...`) | Referencing an implementation whose params are required, as a plain string | Use `{ type, params }` |
| `Property 'x' does not exist on type '{ type: 'a' } \| { type: 'b'; x: ... }'` | Reading event fields in `entry`/`exit`/`invoke.input`/`always` | Dynamic `params`, `assertEvent`, or `event.type` narrowing |
| `Binding element 'context' implicitly has an 'any' type` | Implementation defined outside the config | `setup().createAction` / bound helpers, annotate args, or define inline |
| `Argument of type '{ type: string; ... }' is not assignable` on `send` | Event object built earlier was widened to `string` | `as const`, `satisfies EventFrom<typeof m>`, or build it inline |
| `Expected 2 arguments, but got 1` on `createActor` | Machine `input` type is required | Pass `{ input }`, or make the input type optional |
| `Argument of type 'string' is not assignable to parameter of type 'AnyActorLogic'` on `spawn('key')` | Spawned actor requires input | `spawn('key', { input })` |
| `Type '"q"' is not assignable to type '"a" \| AnyActorLogic'` on `src` | Typo, or actor not registered | Add to `setup({ actors })` |
| `Property 'actors' is missing ...` / `Property 'k' is missing in type '{}'` | `types.children` without matching `actors` | Register every mapped actor key |
| `Object is possibly 'undefined'` on `snapshot.children.x` | Children are optional by design | `?.`, or check the state first |
| `output` is `undefined` in a type you expected to be the output | Snapshot not narrowed | `if (s.status === 'done') s.output`, or `toPromise(actor)` |
| `Property 'context' is missing` on `machine.resolveState` | Typed context must be given | Pass `context` |
| `Argument of type '"nope"' is not assignable` on `matches` / `hasTag` | Typo in a state value or tag | Fix the name. `types.tags` and `setup()` make these checks possible |
| `Property 'ms' is missing ...` on a `delays` entry | Delay `params` annotated with its own type | Delay params are typed as the action params union. Do not annotate them |
| `Types of property 'send' are incompatible` when passing a ref to a helper | Helper is typed with `UnknownActorRef` / `ActorRef<S, EventObject>` | Constrain with `ActorRef<S, any>` or `AnyActorRef` |
| Errors appear only with `strictNullChecks: false` | Optional/required detection breaks | Enable `strict` |
| `The inferred type of 'x' cannot be named` (declaration emit) | xstate < 5.28 | Upgrade to ≥ 5.28 |
| `Type 'undefined' is not assignable to type 'User'` on root `output` | `types.output` includes `undefined`; the output mapper type drops it | Use `null` for "no output" (`output: {} as User \| null`, `context.user ?? null`) |
| `Type '{}' is not assignable to type 'string'` on a promise actor's `output` | `fromPromise(async () => …)` inferred a loose output type | Give the generic: `fromPromise<string>(…)` or `fromPromise<Out, In>(…)` |
| Untyped `enqueue({ type: 'otherAction' })` inside an `enqueueActions` defined in `setup({ actions })` | Sibling named actions are not typed yet at that point | Keep named building blocks as plain functions; use `enqueueActions` inline in the machine config |

Notes:

- `as const` is rarely needed **inside** the machine config. `setup().createMachine` infers the config with a `const` type parameter, and `emit(({ context }) => ({ type: 'x', ... }))` is contextually typed. You need it for objects built outside and passed in later.
- Do not cast with `as any` to silence a transition error. It is almost always a real mismatch: wrong target name, missing params, or a typo in the event type. The cast hides it until runtime.
- Very large single configs slow the type checker down. Split them with `createStateConfig` and child machines instead of one huge object literal.

## Stale TypeScript API

| Stale | v5 |
| --- | --- |
| `tsTypes: {} as import('./x.typegen').Typegen0`, `@xstate/cli` typegen | Removed. Use `setup({ types })` |
| `schema: { context: {} as C, events: {} as E }` | `types: { context: {} as C, events: {} as E }` |
| `createMachine<Context, Event>(...)` generics | `setup({ types })`. Do not pass generics manually |
| `InterpreterFrom<typeof m>` | `Actor<typeof m>` |
| `State<C, E>` type | `SnapshotFrom<typeof m>` |
| `ActorRef<Event, State>` (v4 parameter order) | `ActorRef<Snapshot, Event, Emitted>`. Usually `ActorRefFrom<typeof logic>` |
| `cond` in transitions | `guard` |
| `(context, event) => ...` implementation args | `({ context, event }, params) => ...` |
