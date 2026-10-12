# Modeling State Machines and Statecharts

How to design correct XState v5 machines (xstate 5.33.2): when a machine is the right tool, a repeatable modeling procedure, the state-vs-context and action-vs-actor decisions, naming, granularity, side-effect placement, async patterns (errors, retry, timeout, cancellation, races, debounce, polling, optimistic updates, persistence), a catalog of worked machines, anti-patterns, and a pre-merge checklist. Every example uses `setup({ types, actors, actions, guards, delays }).createMachine(...)` and was type-checked against xstate 5.33.2 with `strict: true`.

## Contents

1. When to reach for a machine
2. Modeling procedure
3. State or context?
4. Action or actor?
5. Naming conventions
6. Granularity: one machine or an actor system?
7. Side-effect placement and purity
8. Async behavior patterns
9. Example catalog (12 machines + 3 small patterns)
10. Anti-patterns
11. Stale API to catch in review
12. Pre-merge review checklist

---

## 1. When to reach for a machine

A state machine pays off when **the same event must mean different things depending on what the app is doing**, or when async work, timers, and cancellation interact. If every event always does the same thing, there are no modes, and a machine adds ceremony without removing bugs.

| Situation | Use | Why |
| --- | --- | --- |
| One independent value (input text, open/closed with no other rules) | `useState` / a signal | No modes, no transitions to guard. |
| Several values updated together by events, but every event is always valid | a reducer, or `@xstate/store` (4.3.0) | Event-driven updates without finite states. `@xstate/store` adds typed events, emitted effects, and selectors. |
| Server data: fetch, cache, dedupe, revalidate, paginate | a server-cache library (TanStack Query, SWR, Apollo, ...) | Caching and invalidation are its job. Do not rebuild a cache in `context`. |
| Behavior depends on mode ("submit is ignored while submitting", "escape closes only when idle") | XState machine | Finite states make invalid events no-ops by construction. |
| Async work that can be cancelled, retried, timed out, or raced by newer input | XState machine with invoked actors | Leaving a state stops its actors and drops late results. |
| Multi-step flows, wizards, checkout, onboarding, auth sessions | XState machine (hierarchical) | Parent states share transitions; history resumes steps. |
| Independent concurrent concerns (playback + volume + fullscreen) | XState parallel states | Avoids the cartesian product of flags. |
| Many dynamic entities each with a lifecycle (uploads, chat rooms, jobs) | Parent machine + spawned child actors | Each entity owns its state, timers, and cleanup. |
| Long-running backend workflows (approvals, provisioning, sagas) | XState machine + persisted snapshots | Explicit states survive restarts and are auditable. |
| You need a diagram stakeholders can review, or generated test paths | XState machine | The config is the diagram; `xstate/graph` generates paths. |

Signals that you already need a machine: three or more booleans that must stay consistent (`isLoading`, `isError`, `isSuccess`), `if (isSubmitting) return` guards scattered across handlers, `disabled={isLoading}` used as the only protection against double submit, or a `useEffect` that "fixes up" state after another update.

You can mix: keep server data in a query cache, keep form field values in a form library, and use a machine for the flow that orchestrates them. A machine that only mirrors another library's state is a smell.

---

## 2. Modeling procedure

Model on paper (or in a visual editor) before writing code. Work through these steps in order; each step feeds the next.

1. **Write the behaviors as stories.** "When the user submits a valid form, send it; while sending, ignore further submits; on failure, show the error and let them edit." Include unhappy paths: cancel, timeout, offline, retry, logout mid-flow.
2. **List the events the machine cares about.** Only events that change behavior or data. Group them by source: user (`form.submit`), actors (`socket.opened`, `xstate.done.actor.*`), time (`after`), parent/system. Note natural sequences ("change, change, submit").
3. **List the tasks and classify each.** Fire-and-forget → *action* (log, focus, toast, navigate, `assign`). Something you wait for, that can fail, or that needs cleanup → *actor* (fetch, subscription, socket, timer loop, child workflow). Each actor contributes `onDone`/`onError` (or `sendBack`) events to step 2.
4. **Find the finite states.** A finite state is a *mode*: a period of time in which the machine reacts to the same events in the same way. Ask "what is the app doing right now?" Start from the initial state; the initial state is static (if it depends on data, start in a checking state with an `always` transition, or pass `input`). Every invoked actor gets a state that represents "this work is running".
5. **Put quantitative data in context.** Values that are unbounded or continuous (text, lists, ids, counts, timestamps, errors, results) go in `context`. See section 3.
6. **Draw transitions per state.** For each state, go through the event list: does the event change state (new work starts, new UI appears, other events become valid, running work must stop)? Does it only update data (targetless transition with `assign`)? Or is it impossible here (leave it unhandled)? Unhandled events are ignored; that is the main feature, not a gap.
7. **Find hierarchy.** If several sibling states handle an event the same way (cancel, logout, exit, `query.change`), create a parent state and lift the transition to it. Children override parents when they handle the same event. Use parent states to share `invoke`s (one socket across `connecting` and `open`) and `entry`/`exit`.
8. **Find orthogonal regions.** If two groups of states change independently (playback vs mute, form validity vs network), use `type: 'parallel'`. The test: "can region A change while region B stays the same, in every combination?" If yes, they are orthogonal.
9. **Add guards, delays, and actors.** Guards choose between transitions for the same event (first passing guard wins; put the unguarded fallback last). Delays (`after`) model timeouts, debounce, backoff, polling. Actors model async work owned by a state.
10. **Define completion.** Which states end the flow? Mark them `type: 'final'`, give them `output`, and define root `output` if the caller needs a result. A parent state completes when its final child is reached (`onDone` on the parent).
11. **Review for impossible states and dead ends.** For each state: Can the user always get out (cancel/back/retry)? Is every `invoke` paired with `onError`? Can an event arrive in a state that does not expect it, and is ignoring it correct? Is any state unreachable? Generate paths with `xstate/graph` (`getShortestPaths`, `getSimplePaths`, `createTestModel`) to check reachability.

Name things as you go (section 5), and keep implementations out of the diagram: reference actions, guards, actors, and delays by name and implement them in `setup` or `.provide()`.

---

## 3. State or context?

**Rule:** if a value changes *which events are accepted* or *which work is running*, it is finite state. If it is data the machine carries around, it is context.

| Put in finite state | Put in context |
| --- | --- |
| `idle` / `loading` / `success` / `failure` | the fetched data, the error object |
| `editing` / `submitting` / `submitted` | field values, validation messages |
| `closed` / `open` / `closing` | which item is open (an id) |
| `online` / `offline` | retry count, last-seen timestamp |
| `signedOut` / `signedIn` | user profile, token, `expiresAt` |

Why prefer states for modes:

- **Impossible combinations vanish.** Three booleans allow 8 combinations; a 3-state machine allows 3. You cannot be `loading` and `failure` at once.
- **Events are gated by structure.** `form.submit` is not handled in `submitting`, so double submission cannot happen no matter how many buttons, keys, or retries trigger it. A disabled button is UI; the machine is the logic.
- **The diagram documents the behavior.** Logic hidden in `assign` conditionals (`if (!context.isOpen) return {}`) is invisible in a visualizer and in generated test paths.

Why keep data in context:

- Finite states must be finite. Do not create one state per item, per field, or per number.
- Context is serializable data that `assign` updates immutably; it travels with persisted snapshots.

### Booleans: bad vs good

A **bad boolean** stores state (`isLoading` set and cleared by hand). A **good boolean** is derived from state. Derive in the view or a selector, never store:

```ts
const isLoading = snapshot.hasTag('loading'); // derived from finite state
const canSubmit = snapshot.can({ type: 'form.submit' }); // derived from transitions + guards
const isPlaying = snapshot.matches({ playback: 'playing' });
```

- Use **tags** to group several states under one UI condition (`loading` on `debouncing` and `searching`; `visible` on `open` and `closing`). Type them with `types: { tags: {} as 'loading' | 'visible' }`. Tags survive refactors that rename or nest states; `matches()` checks break.
- Use `snapshot.can(event)` for "is this action available?" It evaluates guards, so guards must be pure (section 7).
- Do not store derived values in context (`itemCount`, `isValid`, `total`). Compute them from context in a selector or a pure function. Stored copies drift.

### Context rules

- Initialize all keys (use `undefined` explicitly) so the context type is stable.
- Use `context: ({ input }) => ...` for per-instance data; do not hard-code it and patch it later.
- Keep context serializable when the machine may be persisted, inspected, or sent across a boundary: no DOM nodes, class instances, functions, or `File` objects. Hold those in a closure passed via `.provide()` (see the media player example) or in an actor.
- One source of truth: if a query cache or form library owns a value, pass it in as event payload or `input` when needed instead of mirroring it.

---

## 4. Action or actor?

Actions are points in time: the machine fires them and forgets them. Actors are lines in time: they run while a state is active (or until stopped), can report back with events, and are cleaned up automatically.

| Use an action when | Use an actor when |
| --- | --- |
| The effect is instant and you do not care about its result | You must react to success or failure |
| `assign`, `raise`, `sendTo`, `emit`, `log` | HTTP requests, DB calls, file reads |
| Analytics ping, toast, navigation, focus, scroll | Subscriptions and listeners that need cleanup (`addEventListener`, WebSocket, observables) |
| Notifying a parent or sibling | Work that must be cancelled when the user leaves the state |
| | Child workflows with their own states (another machine) |

Consequences you must design for:

- An `async` action implementation is still fire-and-forget. Its rejection is never seen by the machine. If you need the result, make it an actor.
- An action that **throws synchronously** puts the whole actor into `status: 'error'` (verified in 5.33.2): the machine stops processing events. Wrap risky effects in an actor, or catch inside the action.
- A throwing guard also errors the actor.
- Invoked actors are owned by the state that invokes them. Leaving the state stops the actor (promise actors get their `signal` aborted, callback actors run their cleanup), and any late result is dropped. This is how races disappear.
- Root-level `invoke` runs for the machine's lifetime (listeners for `online`/`offline`, global subscriptions).

Choosing the actor kind:

| Logic creator | Use for | Talks back via |
| --- | --- | --- |
| `fromPromise(async ({ input, signal, self, system, emit }) => ...)` | One request/response; pass `signal` (≥ 5.13) to `fetch` so leaving the state aborts it | `onDone` (`event.output`) / `onError` (`event.error`) |
| `fromCallback(({ input, sendBack, receive, self, system, emit }) => cleanup)` | Subscriptions, sockets, DOM listeners, imperative APIs, intervals | `sendBack(event)`; receives parent events via `receive`; return a cleanup function |
| `fromObservable` / `fromEventObservable` | RxJS-style streams | `onSnapshot` / events |
| `fromTransition(reducer, initial)` | A small reducer-style child | snapshot |
| `setup(...).createMachine(...)` | A child with its own modes | `onDone` (`output`), `sendParent`, `emit`, snapshot |

`sendBack` is typed as any event object. Funnel it through a typed helper (`const report = (e: UploadEvent) => sendBack(e)`) or use `satisfies`.

---

## 5. Naming conventions

Pick one convention per codebase and apply it everywhere. The conventions below match the XState v5 docs and enable wildcard matching.

**Events: lowercase, dot-namespaced `domain.verb`.**

- Intents from the UI or callers are present-tense commands: `form.submit`, `query.change`, `dialog.dismiss`, `wizard.back`, `auth.logout`. The machine may refuse them (unhandled in the current state).
- Facts reported by actors, the network, or the system are past tense: `socket.opened`, `socket.closed`, `upload.succeeded`, `payment.failed`, `media.ended`. Facts cannot be refused, only reacted to; past tense makes that visible in the diagram.
- Why dots: partial descriptors match a namespace (`'socket.*': { actions: 'logSocket' }`), `assertEvent(event, 'socket.*')` narrows by prefix (≥ 5.25), and XState's own events follow the same shape (`xstate.done.actor.<id>`, `xstate.error.actor.<id>`, `xstate.after.<delay>.<stateId>`, `xstate.done.state.<id>`). Since 5.32.2, an exact descriptor is tried first and a matching wildcard is used only if all exact transitions' guards fail.
- Avoid `SHOUTY_CASE` in new code (v4 habit) and avoid UI words that bind logic to a widget (`button.click`); name the intent (`order.submit`), so Enter, a button, and a test all send the same event.

**States: camelCase keys, never containing `.`** (dots are path separators in targets).

- Adjectives or participles for resting conditions: `idle`, `open`, `paused`, `signedIn`, `paid`, `failed`.
- Gerunds for states where work runs: `loading`, `submitting`, `refreshing`, `uploading`, `placingOrder`. A gerund state should usually `invoke` something or have an `after`.
- Nouns for parent states that group a phase: `steps`, `payment`, `playback`, `live`.
- Final states describe outcomes: `completed`, `cancelled`, `paid`, `abandoned`.

**Implementations in `setup`:**

| Kind | Style | Examples |
| --- | --- | --- |
| Actions | verb phrase, camelCase | `assignUser`, `resetAttempts`, `trackOpened`, `focusInput`, `pump` |
| Guards | predicate | `isValid`, `hasQuery`, `canRetry`, `deadlinePassed`, `autoApprovable` |
| Actors | the job (verb phrase) or the resource (noun) | `fetchUser`, `submitForm`, `socket`, `payout`, `mediaElement` |
| Delays | the reason, not the number | `debounce`, `backoff`, `requestTimeout`, `untilRefresh`, `pollInterval` |
| Tags | UI condition | `loading`, `busy`, `visible`, `spinner` |

**Ids:**

- Give the root machine an `id` (`'checkout'`) so deep targets read as `'#checkout.placingOrder'`. Add explicit state `id`s only where you need `#id` targets from far away or routable states (≥ 5.28, see `statecharts.md`).
- Give an invoke an `id` when you `sendTo` it or need stable `snapshot.children[id]` access. Spawned children get the entity id (`spawnChild('upload', { id: fileId })`).
- Use `systemId` only for app-wide singletons that unrelated actors must find: `system.get('auth')`. Each `systemId` must be unique in the system; do not use it for per-entity actors.

---

## 6. Granularity: one machine or an actor system?

Start with one machine per **feature lifecycle** (a dialog, a form, a checkout, a session). Split when one of these holds:

- **Independent lifecycles.** Each upload, each chat room, each job starts and ends on its own. Spawn one child actor per entity (`spawnChild` or `spawn` inside `assign`) and keep only a summary in the parent context. The parent removes them with `stopChild(id)`.
- **Reusable behavior.** A retrying request, a socket connection, a media element bridge: write it once as child logic and invoke it in many machines.
- **Different owners or lifetimes.** An app-wide auth session vs a page-local form. The session is a root actor (often with `systemId: 'auth'`); the form is created by its component and reads auth data through input or events.
- **The diagram stops fitting on a screen**, and a region only talks to the rest through 2–3 events. That region is a child actor.

Do not split when the pieces share most events and data; a parallel state is cheaper than two actors that constantly sync.

Communication rules:

- Parent → child: `sendTo('childId', event)` or `sendTo(({ context }) => context.ref, event)`.
- Child → parent: `onDone`/`onError` for completion; `sendBack` (callback actors) or `sendParent` (child machines) for progress; `emit` for decoupled listeners (`actor.on('type', ...)`).
- Keep the message graph a tree. If siblings start calling each other with `sendTo`, route through the parent or lift the shared logic. Webs of `sendTo` calls hide the real flow.
- Children own their own data. The parent stores ids and summaries, not copies of every child's context; read a child's live state through its ref (`useSelector(ref, ...)` in UI, `ref.getSnapshot()` elsewhere).

Avoid:

- **God machines** that model the whole app in one chart. They couple unrelated features and every change touches everything.
- **Global actors holding per-request server data.** On a server, create one actor per request or per workflow instance and persist its snapshot; never share one machine instance across users. In UI, server data belongs in a query cache, keyed by params.
- **Duplicating server state** in context "just in case". Fetch it through the cache or pass it in.

---

## 7. Side-effect placement and purity

The machine config should be a pure, serializable description of behavior. Effects are named and implemented elsewhere.

- **Declare by name, implement in `setup`, override with `.provide()`.** The config references `'trapFocus'`, `'fetchUser'`, `'isValid'`, `'debounce'`. `setup({ actions, actors, guards, delays })` supplies defaults (or no-op placeholders), and the UI, tests, or stories inject real implementations with `machine.provide({ actions, actors, guards, delays })`. Named implementations also show up by name in visualizers and inspectors.
- **`assign` is pure.** Return new objects; never mutate `context` in place. `assign` runs while XState computes the next snapshot, including in pure helpers (`transition()`, `getNextSnapshot()`, graph traversal). Side effects inside `assign` would fire during tests and path generation. Mutation breaks change detection in selectors.
- **Guards are pure and cheap.** `snapshot.can(event)` evaluates guards, and UIs call it on every render. A guard that fetches, logs, or reads `Date.now()` makes `can()` lie or misbehave. Pass time in events (`{ type: 'deadline.check', now }`) or compute it in an action.
- **No DOM in the machine.** Pass a bridge actor that owns the element (see the media player), or provide DOM actions from the component.
- **Keep the machine framework-agnostic.** No React hooks, router objects, or stores imported into the machine module. The machine module should run in Node, tests, and the browser.
- **Order of actions:** XState v5 runs `exit` actions of exited states, then transition `actions`, then `entry` actions of entered states. `assign` results are visible to later actions in the same step. Use `enqueueActions` when actions must be chosen conditionally (it replaces v4 `choose`/`pure`).

---

## 8. Async behavior patterns

### Errors

Every `invoke` of something that can fail needs `onError`. Without it, the child's error escalates: the **parent actor itself goes to `status: 'error'`** and stops processing events (verified in 5.33.2 with a rejecting `fromPromise`). One failed request kills the whole feature machine. Route to a state that shows the error and offers a way out (`retry`, `edit`, `cancel`), and store `event.error` in context.

### Retry and backoff

Count attempts in context; a guarded `onError` picks between a backoff state (`after: { backoff: 'loading' }`) and a terminal failure state. Compute the delay with a named delay function from context. Reset the counter on user-initiated retries. See the fetch example.

### Timeout

Put an `after` next to the `invoke` in the same state. Whichever event arrives first wins, and leaving the state stops the other.

```ts
loading: {
  invoke: { src: 'fetchUser', onDone: 'success', onError: 'failure' },
  after: { requestTimeout: 'timedOut' }, // stops fetchUser (aborts its signal)
},
```

### Cancellation and stale results

Cancellation is "leave the state". The invoked actor is stopped, its `signal` aborts, and a result that arrives later is ignored (the promise actor checks that it is still active before reporting, verified in 5.33.2). There is no `if (cancelled) return` code to write. To restart work with new parameters, re-enter the invoking state:

- From an ancestor: a parent/root transition to a child (`target: '.debouncing'`) exits and re-enters the active child even without `reenter` (verified: the transition domain is the source, and all its active descendants are exited).
- From the state itself: a self-targeting transition (`target: 'debouncing'` inside `debouncing`) does **not** exit/re-enter unless `reenter: true`.

When several concurrent requests of the same kind are legitimately in flight (spawned per entity), include an id in their events and guard or key updates by that id.

### Debounce and throttle

- Debounce: a `debouncing` state with `after: { debounce: 'searching' }`, re-entered on every change (restarts the timer). See the search example.
- Throttle: act on the first event, then enter `coolingDown` with `after: { cooldown: 'ready' }`; the event is unhandled while cooling down, so extras are dropped. See section 9 patterns.
- Alternative for ad-hoc timers: `raise(event, { delay, id })` with `cancel(id)`. Prefer `after` + states: the timer is visible in the diagram and cancelled automatically on exit.

### Polling

Alternate `fetching` (invoke) and `waiting` (`after: { pollInterval: 'fetching' }`) inside a parent. Pause by leaving the parent (`page.hidden` → `paused`), and resume by re-entering it. See section 9 patterns.

### Offline

Listen to `online`/`offline` with a root-level callback actor and treat connectivity as an event source. Either route to an `offline` state that waits for `network.online` (socket example), or, if the rest of the machine must keep working, add a parallel `network` region and read it with `snapshot.matches(...)` / `stateIn(...)` sparingly.

### Optimistic updates

Apply the change in context immediately, store the last confirmed value, invoke the save, and roll back in `onError`. Re-enter the saving state on new input so only the latest intent is in flight. See section 9 patterns.

### Infinite `always` loops

Eventless (`always`) transitions re-run after every microstep. An `always` whose guard stays true and whose target is the same state (or an `assign` that never flips the guard) loops forever. Since 5.31, `options: { maxIterations: 1000 }` in the machine config turns the hang into an error; the default is `Infinity`. Prefer explicit events over `always` chains.

### Persistence and long-running workflows

- Persist `actor.getPersistedSnapshot()` (JSON-safe if context is) and restore with `createActor(machine, { snapshot, input })`. If the machine declares `types.input`, the types still require an `input` key when restoring; it is ignored at runtime when `snapshot` is given (5.33.2).
- On restore, **actions are not re-executed, but invoked and spawned actors are restarted**. A promise that was in flight when you persisted runs again. Make every invoked side effect idempotent (idempotency keys) or persist only at rest (no `working` tag).
- **Delayed transitions are not persisted** (verified in 5.33.2: `after` timers and delayed `raise` live in the system scheduler, which is not part of the persisted snapshot, and entry actions are not replayed on restore). For deadlines longer than a request, store the deadline in context and let an external scheduler send an event (`deadline.check` with `now`), guarded by a pure comparison.
- Version machines that have persisted instances. Renaming or removing a state breaks old snapshots; migrate snapshots or keep old state names until instances drain.

---

## 9. Example catalog

All examples compile under `strict` TypeScript with xstate 5.33.2.

### 9.1 Toggle

The smallest useful machine. Two modes, one event, no context.

```ts
import { setup, createActor } from 'xstate';

export const toggleMachine = setup({
  types: {
    events: {} as { type: 'toggle' },
  },
}).createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { toggle: 'active' } },
    active: { on: { toggle: 'inactive' } },
  },
});

const actor = createActor(toggleMachine).start();
actor.send({ type: 'toggle' });
actor.getSnapshot().matches('active'); // true
```

If nothing else ever depends on the mode, a `useState` boolean is fine (section 1). Use the machine when other events must be gated by it.

### 9.2 Fetch with retry, exponential backoff, and cancel

Auto-retries up to 3 attempts with growing delay; the user can cancel at any point, which aborts the request.

```ts
import { setup, assign, fromPromise } from 'xstate';

type User = { id: string; name: string };

export const userFetchMachine = setup({
  types: {
    context: {} as {
      userId: string;
      user: User | undefined;
      error: unknown;
      attempt: number;
    },
    input: {} as { userId: string },
    events: {} as
      | { type: 'user.fetch' }
      | { type: 'user.retry' }
      | { type: 'user.cancel' },
    tags: {} as 'busy',
  },
  actors: {
    fetchUser: fromPromise<User, { userId: string }>(async ({ input, signal }) => {
      const res = await fetch(`/api/users/${input.userId}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as User;
    }),
  },
  actions: {
    resetAttempts: assign({ attempt: 0 }),
  },
  guards: {
    canAutoRetry: ({ context }) => context.attempt < 3,
  },
  delays: {
    // 500ms, 1s, 2s, ... capped at 8s
    backoff: ({ context }) => Math.min(500 * 2 ** (context.attempt - 1), 8_000),
  },
}).createMachine({
  id: 'userFetch',
  context: ({ input }) => ({
    userId: input.userId,
    user: undefined,
    error: undefined,
    attempt: 0,
  }),
  initial: 'idle',
  states: {
    idle: {
      on: { 'user.fetch': { target: 'loading', actions: 'resetAttempts' } },
    },
    loading: {
      tags: 'busy',
      entry: assign({ attempt: ({ context }) => context.attempt + 1 }),
      invoke: {
        src: 'fetchUser',
        input: ({ context }) => ({ userId: context.userId }),
        onDone: {
          target: 'success',
          actions: assign({ user: ({ event }) => event.output, error: undefined }),
        },
        onError: [
          {
            guard: 'canAutoRetry',
            target: 'backingOff',
            actions: assign({ error: ({ event }) => event.error }),
          },
          {
            target: 'failure',
            actions: assign({ error: ({ event }) => event.error }),
          },
        ],
      },
      // Leaving `loading` stops the promise actor and aborts `signal`.
      on: { 'user.cancel': 'idle' },
    },
    backingOff: {
      tags: 'busy',
      after: { backoff: 'loading' },
      on: { 'user.cancel': 'idle' },
    },
    success: {
      on: { 'user.fetch': { target: 'loading', actions: 'resetAttempts' } },
    },
    failure: {
      on: { 'user.retry': { target: 'loading', actions: 'resetAttempts' } },
    },
  },
});
```

Notes: `user.fetch` is unhandled in `loading`/`backingOff`, so repeated clicks cannot start parallel requests. The `busy` tag lets the UI show one spinner for two states. In an app with a query cache, let the cache fetch and use a machine only for the surrounding flow.

### 9.3 Form with validation and submit

Validation is a pure function. Errors are shown only after the first submit attempt, then kept fresh while typing.

```ts
import { setup, assign, fromPromise } from 'xstate';

type Values = { email: string; message: string };
type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!/^\S+@\S+$/.test(values.email)) errors.email = 'Enter a valid email';
  if (values.message.trim().length < 10) errors.message = 'At least 10 characters';
  return errors;
}

export const contactFormMachine = setup({
  types: {
    context: {} as { values: Values; errors: Errors; submitError: string | undefined },
    events: {} as
      | { type: 'field.change'; name: keyof Values; value: string }
      | { type: 'form.submit' }
      | { type: 'form.reset' },
  },
  actors: {
    submitForm: fromPromise<void, Values>(async ({ input, signal }) => {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(input),
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
  },
  actions: {
    assignField: assign({
      values: ({ context }, params: { name: keyof Values; value: string }) => ({
        ...context.values,
        [params.name]: params.value,
      }),
    }),
    // Revalidate while typing only if errors are already shown.
    refreshErrors: assign({
      errors: ({ context }) =>
        Object.keys(context.errors).length > 0 ? validate(context.values) : context.errors,
    }),
    showErrors: assign({ errors: ({ context }) => validate(context.values) }),
  },
  guards: {
    isValid: ({ context }) => Object.keys(validate(context.values)).length === 0,
  },
}).createMachine({
  id: 'contactForm',
  context: {
    values: { email: '', message: '' },
    errors: {},
    submitError: undefined,
  },
  initial: 'editing',
  states: {
    editing: {
      on: {
        'field.change': {
          actions: [
            {
              type: 'assignField',
              params: ({ event }) => ({ name: event.name, value: event.value }),
            },
            'refreshErrors',
          ],
        },
        'form.submit': [{ guard: 'isValid', target: 'submitting' }, { actions: 'showErrors' }],
        'form.reset': {
          actions: assign({ values: { email: '', message: '' }, errors: {} }),
        },
      },
    },
    submitting: {
      // `form.submit` and `field.change` are not handled here:
      // no double submit, no edits racing the request.
      entry: assign({ submitError: undefined }),
      invoke: {
        src: 'submitForm',
        input: ({ context }) => context.values,
        onDone: 'submitted',
        onError: {
          target: 'editing',
          actions: assign({ submitError: 'Could not send. Try again.' }),
        },
      },
    },
    submitted: { type: 'final' },
  },
});
```

Notes: `isValid` is derived from values, not stored. Parameterized actions (`params`) keep `assignField` reusable and visible by name. For large forms, let a form library own field values and send only `form.submit` with the values as payload.

### 9.4 Multi-step wizard with back, exit confirmation, and history

`wizard.exit` is lifted to the parent; cancelling the exit dialog resumes the exact step through a history state.

```ts
import { setup, assign, fromPromise } from 'xstate';

type Account = { email: string };
type Profile = { displayName: string };
type Plan = 'free' | 'pro';
type Draft = { account?: Account; profile?: Profile; plan?: Plan };

export const signupWizardMachine = setup({
  types: {
    context: {} as Draft,
    events: {} as
      | { type: 'account.submit'; account: Account }
      | { type: 'profile.submit'; profile: Profile }
      | { type: 'plan.select'; plan: Plan }
      | { type: 'wizard.back' }
      | { type: 'wizard.exit' }
      | { type: 'exit.confirm' }
      | { type: 'exit.cancel' }
      | { type: 'review.edit' }
      | { type: 'review.confirm' },
  },
  actors: {
    createAccount: fromPromise<void, Required<Draft>>(async ({ input, signal }) => {
      const res = await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify(input),
        signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
  },
}).createMachine({
  id: 'signupWizard',
  context: {},
  initial: 'steps',
  states: {
    steps: {
      initial: 'account',
      // Lifted to the parent: every step is abandoned the same way.
      on: { 'wizard.exit': 'confirmingExit' },
      states: {
        account: {
          on: {
            'account.submit': {
              target: 'profile',
              actions: assign({ account: ({ event }) => event.account }),
            },
          },
        },
        profile: {
          on: {
            'wizard.back': 'account',
            'profile.submit': {
              target: 'plan',
              actions: assign({ profile: ({ event }) => event.profile }),
            },
          },
        },
        plan: {
          on: {
            'wizard.back': 'profile',
            'plan.select': {
              target: '#signupWizard.review',
              actions: assign({ plan: ({ event }) => event.plan }),
            },
          },
        },
        // Remembers which step was active when `steps` was exited.
        hist: { type: 'history', history: 'shallow' },
      },
    },
    confirmingExit: {
      on: {
        'exit.cancel': 'steps.hist', // resume the exact step the user left
        'exit.confirm': 'abandoned',
      },
    },
    review: {
      on: {
        'wizard.back': 'steps.plan',
        'review.edit': 'steps.account',
        'review.confirm': 'submitting',
      },
    },
    submitting: {
      invoke: {
        src: 'createAccount',
        input: ({ context }) => ({
          account: context.account!,
          profile: context.profile!,
          plan: context.plan!,
        }),
        onDone: 'completed',
        onError: 'review',
      },
    },
    completed: { type: 'final' },
    abandoned: { type: 'final' },
  },
});
```

Notes: one event per step payload (`account.submit`, `profile.submit`) keeps payloads typed without guards. Draft data lives in context, so going back keeps what the user typed. Use `history: 'deep'` when steps have nested substates to restore.

### 9.5 Auth session: restore, login, scheduled refresh, logout

```ts
import { setup, assign, assertEvent, fromPromise } from 'xstate';

type Session = { userId: string; accessToken: string; expiresAt: number };
type Credentials = { email: string; password: string };

export const authMachine = setup({
  types: {
    context: {} as { session: Session | undefined; error: string | undefined },
    events: {} as
      | { type: 'auth.login'; credentials: Credentials }
      | { type: 'auth.logout' }
      | { type: 'auth.expired' }, // e.g. a 401 reported by the API layer
    tags: {} as 'pending',
  },
  actors: {
    restoreSession: fromPromise<Session | null>(async () => {
      const res = await fetch('/api/session');
      return res.ok ? ((await res.json()) as Session) : null;
    }),
    login: fromPromise<Session, Credentials>(async ({ input, signal }) => {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(input),
        signal,
      });
      if (!res.ok) throw new Error('Invalid credentials');
      return (await res.json()) as Session;
    }),
    refresh: fromPromise<Session>(async ({ signal }) => {
      const res = await fetch('/api/refresh', { method: 'POST', signal });
      if (!res.ok) throw new Error('Refresh failed');
      return (await res.json()) as Session;
    }),
    logout: fromPromise<void>(async () => {
      await fetch('/api/logout', { method: 'POST' });
    }),
  },
  delays: {
    // Refresh 30s before expiry; never negative.
    untilRefresh: ({ context }) =>
      Math.max(0, (context.session?.expiresAt ?? 0) - Date.now() - 30_000),
  },
}).createMachine({
  id: 'auth',
  context: { session: undefined, error: undefined },
  initial: 'restoring',
  states: {
    restoring: {
      tags: 'pending',
      invoke: {
        src: 'restoreSession',
        onDone: [
          {
            guard: ({ event }) => event.output !== null,
            target: 'signedIn',
            actions: assign({ session: ({ event }) => event.output ?? undefined }),
          },
          { target: 'signedOut' },
        ],
        onError: 'signedOut',
      },
    },
    signedOut: {
      entry: assign({ session: undefined }),
      initial: 'idle',
      states: {
        idle: {
          on: { 'auth.login': 'loggingIn' },
        },
        loggingIn: {
          tags: 'pending',
          invoke: {
            src: 'login',
            input: ({ event }) => {
              // `input` sees the event that caused entry; narrow it explicitly.
              assertEvent(event, 'auth.login');
              return event.credentials;
            },
            onDone: {
              target: '#auth.signedIn',
              actions: assign({ session: ({ event }) => event.output, error: undefined }),
            },
            onError: {
              target: 'idle',
              actions: assign({ error: 'Invalid email or password' }),
            },
          },
        },
      },
    },
    signedIn: {
      initial: 'active',
      // Logout is valid in every signed-in substate; leaving `refreshing` cancels the refresh.
      on: { 'auth.logout': '.signingOut' },
      states: {
        active: {
          after: { untilRefresh: 'refreshing' },
          on: { 'auth.expired': 'refreshing' },
        },
        refreshing: {
          tags: 'pending',
          invoke: {
            src: 'refresh',
            onDone: {
              target: 'active', // re-entering `active` restarts the timer
              actions: assign({ session: ({ event }) => event.output }),
            },
            onError: '#auth.signedOut',
          },
        },
        signingOut: {
          tags: 'pending',
          on: { 'auth.logout': {} }, // swallow repeated clicks instead of re-entering
          invoke: { src: 'logout', onDone: '#auth.signedOut', onError: '#auth.signedOut' },
        },
      },
    },
  },
});
```

Notes: the refresh timer is a named delay computed from context, visible in the diagram. `auth.expired` is only handled in `active`, so a burst of 401s during `refreshing` triggers one refresh. Without the empty `'auth.logout': {}` in `signingOut`, the parent's `.signingOut` transition would exit and re-enter `signingOut` and restart the request (a child's handler, even an empty one, wins over the parent's). Run this as an app-wide root actor (optionally `systemId: 'auth'`); feature machines receive the token through input or events.

### 9.6 Confirm dialog with async confirm and exit animation

Implementations are placeholders in `setup` and injected with `.provide()` at the edge.

```ts
import { setup, fromPromise, createActor } from 'xstate';

export const confirmDialogMachine = setup({
  types: {
    events: {} as
      | { type: 'dialog.open' }
      | { type: 'dialog.dismiss' } // Escape, backdrop click, close button
      | { type: 'dialog.confirm' },
    tags: {} as 'visible',
  },
  actors: {
    // Placeholder; the real work is injected with `.provide()`.
    onConfirm: fromPromise<void>(async () => {}),
  },
  actions: {
    // Declared, not implemented: the UI layer provides DOM behavior.
    trapFocus: () => {},
    restoreFocus: () => {},
  },
  delays: { exitAnimation: 150 },
}).createMachine({
  id: 'confirmDialog',
  initial: 'closed',
  states: {
    closed: {
      on: { 'dialog.open': 'open' },
    },
    open: {
      tags: 'visible',
      initial: 'idle',
      entry: 'trapFocus',
      exit: 'restoreFocus',
      states: {
        idle: {
          on: {
            'dialog.dismiss': '#confirmDialog.closing',
            'dialog.confirm': 'confirming',
          },
        },
        confirming: {
          // Dismiss is not handled here: the dialog cannot close mid-request.
          invoke: {
            src: 'onConfirm',
            onDone: '#confirmDialog.closing',
            onError: 'idle',
          },
        },
      },
    },
    closing: {
      tags: 'visible',
      after: { exitAnimation: 'closed' },
      on: { 'dialog.open': 'open' }, // re-open interrupts the exit animation
    },
  },
});

// Inject implementations at the edge (component, test, or story).
const dialog = createActor(
  confirmDialogMachine.provide({
    actors: {
      onConfirm: fromPromise(async () => {
        await fetch('/api/items/42', { method: 'DELETE' });
      }),
    },
    actions: {
      trapFocus: () => document.querySelector<HTMLElement>('[role=dialog] button')?.focus(),
    },
  }),
).start();
dialog.getSnapshot().hasTag('visible');
```

Notes: a plain open/close dialog with no async work and no animation state is a `useState` boolean. The machine earns its place here because `confirming` blocks dismissal and `closing` must stay mounted.

### 9.7 Debounced search with cancellation

Every keystroke restarts the debounce from any state; a newer query cancels an in-flight search.

```ts
import { setup, assign, fromPromise } from 'xstate';

type Hit = { id: string; title: string };

export const searchMachine = setup({
  types: {
    context: {} as { query: string; results: Hit[]; error: unknown },
    events: {} as { type: 'query.change'; query: string } | { type: 'query.clear' },
    tags: {} as 'loading',
  },
  actors: {
    search: fromPromise<Hit[], { query: string }>(async ({ input, signal }) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(input.query)}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Hit[];
    }),
  },
  guards: {
    hasQuery: ({ context }) => context.query.trim().length >= 2,
  },
  delays: { debounce: 300 },
}).createMachine({
  id: 'search',
  context: { query: '', results: [], error: undefined },
  initial: 'idle',
  // Root-level: a root transition to a child exits the active child (even
  // `debouncing` itself), so the `after` timer and any in-flight search restart.
  on: {
    'query.change': {
      target: '.debouncing',
      actions: assign({ query: ({ event }) => event.query }),
    },
    'query.clear': {
      target: '.idle',
      actions: assign({ query: '', results: [], error: undefined }),
    },
  },
  states: {
    idle: {},
    debouncing: {
      tags: 'loading',
      after: {
        debounce: [{ guard: 'hasQuery', target: 'searching' }, { target: 'idle' }],
      },
    },
    searching: {
      tags: 'loading',
      invoke: {
        src: 'search',
        input: ({ context }) => ({ query: context.query }),
        onDone: {
          target: 'idle',
          actions: assign({ results: ({ event }) => event.output, error: undefined }),
        },
        onError: {
          target: 'idle',
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
  },
});
```

Notes: stale responses cannot overwrite newer results, because the old search actor is stopped (and its fetch aborted) before the new one starts. Results stay in context while a new search runs, so the UI can show old results with a spinner (`hasTag('loading')`).

### 9.8 WebSocket connection with reconnect (callback actor)

One socket lives across `connecting` and `open` by invoking it on their parent. Reconnect uses jittered backoff; a root-level actor reports connectivity.

```ts
import { setup, assign, fromCallback, sendTo } from 'xstate';

type ServerMessage = { kind: string; payload: unknown };

// Events the socket actor sends to its parent.
type SocketEvent =
  | { type: 'socket.opened' }
  | { type: 'socket.closed'; code: number }
  | { type: 'socket.message'; message: ServerMessage };

// Events the socket actor accepts from its parent.
type SocketCommand = { type: 'socket.send'; data: string };

const socketLogic = fromCallback<SocketCommand, { url: string }>(
  ({ input, sendBack, receive }) => {
    const ws = new WebSocket(input.url);
    ws.onopen = () => sendBack({ type: 'socket.opened' } satisfies SocketEvent);
    ws.onclose = (e) => sendBack({ type: 'socket.closed', code: e.code } satisfies SocketEvent);
    ws.onmessage = (e) =>
      sendBack({ type: 'socket.message', message: JSON.parse(e.data) } satisfies SocketEvent);
    receive((command) => ws.send(command.data));
    // Cleanup runs whenever the invoking state is exited or the machine stops.
    return () => {
      ws.onclose = null; // a deliberate close must not report `socket.closed`
      ws.close();
    };
  },
);

const networkLogic = fromCallback(({ sendBack }) => {
  const online = () => sendBack({ type: 'network.online' });
  const offline = () => sendBack({ type: 'network.offline' });
  window.addEventListener('online', online);
  window.addEventListener('offline', offline);
  return () => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
  };
});

export const connectionMachine = setup({
  types: {
    context: {} as { url: string; retries: number; inbox: ServerMessage[] },
    input: {} as { url: string },
    events: {} as
      | SocketEvent
      | { type: 'network.online' }
      | { type: 'network.offline' }
      | { type: 'message.send'; data: string }
      | { type: 'connection.close' },
  },
  actors: { socket: socketLogic, network: networkLogic },
  guards: { canRetry: ({ context }) => context.retries < 10 },
  delays: {
    reconnect: ({ context }) =>
      Math.min(1_000 * 2 ** context.retries, 30_000) * (0.5 + Math.random() / 2), // jitter
  },
}).createMachine({
  id: 'connection',
  context: ({ input }) => ({ url: input.url, retries: 0, inbox: [] }),
  // Root-level invoke lives as long as the machine.
  invoke: { src: 'network' },
  initial: 'live',
  on: {
    'network.offline': '.offline',
    'connection.close': '.closed',
  },
  states: {
    live: {
      // Invoked on the parent so ONE socket survives `connecting` -> `open`.
      invoke: { id: 'socket', src: 'socket', input: ({ context }) => ({ url: context.url }) },
      initial: 'connecting',
      on: {
        'socket.closed': [{ guard: 'canRetry', target: 'waiting' }, { target: 'failed' }],
      },
      states: {
        connecting: {
          on: {
            'socket.opened': { target: 'open', actions: assign({ retries: 0 }) },
          },
        },
        open: {
          on: {
            'message.send': {
              actions: sendTo('socket', ({ event }) => ({
                type: 'socket.send' as const,
                data: event.data,
              })),
            },
            'socket.message': {
              actions: assign({ inbox: ({ context, event }) => [...context.inbox, event.message] }),
            },
          },
        },
      },
    },
    waiting: {
      entry: assign({ retries: ({ context }) => context.retries + 1 }),
      after: { reconnect: 'live' },
    },
    offline: {
      on: {
        'network.online': { target: 'live', actions: assign({ retries: 0 }) },
        'network.offline': {}, // already offline; do not re-enter
      },
    },
    failed: {
      on: { 'network.online': { target: 'live', actions: assign({ retries: 0 }) } },
    },
    closed: { type: 'final' },
  },
});
```

Notes: `message.send` outside `open` is dropped by design; if messages must not be lost, append them to an outbox in context and flush on `socket.opened`. The `delays.reconnect` function reads `Math.random()`; that is fine for a delay (an implementation detail), but never put randomness or time in guards.

### 9.9 Media player (parallel regions, DOM bridge actor)

Playback and sound change independently: 5 + 2 states instead of a flat product. The machine never touches the DOM; a callback actor bound to the element is provided by the view.

```ts
import { setup, assign, fromCallback, sendTo } from 'xstate';

type MediaCommand =
  | { type: 'media.play' }
  | { type: 'media.pause' }
  | { type: 'media.seek'; time: number }
  | { type: 'media.mute'; muted: boolean };

// Owns the HTMLMediaElement, so the machine stays DOM-free and serializable.
export const createMediaElementLogic = (element: HTMLMediaElement) =>
  fromCallback<MediaCommand>(({ sendBack, receive }) => {
    const handlers: Record<string, () => void> = {
      canplay: () => sendBack({ type: 'media.ready', duration: element.duration }),
      timeupdate: () => sendBack({ type: 'media.timeUpdated', time: element.currentTime }),
      waiting: () => sendBack({ type: 'media.buffering' }),
      playing: () => sendBack({ type: 'media.resumed' }),
      ended: () => sendBack({ type: 'media.ended' }),
      error: () => sendBack({ type: 'media.failed' }),
    };
    for (const [name, fn] of Object.entries(handlers)) element.addEventListener(name, fn);
    receive((command) => {
      if (command.type === 'media.play')
        void element.play().catch(() => sendBack({ type: 'media.failed' }));
      if (command.type === 'media.pause') element.pause();
      if (command.type === 'media.seek') element.currentTime = command.time;
      if (command.type === 'media.mute') element.muted = command.muted;
    });
    return () => {
      for (const [name, fn] of Object.entries(handlers)) element.removeEventListener(name, fn);
    };
  });

export const playerMachine = setup({
  types: {
    context: {} as { duration: number; time: number },
    events: {} as
      | { type: 'media.ready'; duration: number }
      | { type: 'media.timeUpdated'; time: number }
      | { type: 'media.buffering' }
      | { type: 'media.resumed' }
      | { type: 'media.ended' }
      | { type: 'media.failed' }
      | { type: 'user.play' }
      | { type: 'user.pause' }
      | { type: 'user.seek'; time: number }
      | { type: 'user.toggleMute' },
    tags: {} as 'spinner',
  },
  actors: {
    // Typed placeholder; the view provides the real one bound to its element.
    mediaElement: fromCallback<MediaCommand>(() => {}),
  },
}).createMachine({
  id: 'player',
  context: { duration: 0, time: 0 },
  invoke: { id: 'media', src: 'mediaElement' },
  on: {
    'media.timeUpdated': { actions: assign({ time: ({ event }) => event.time }) },
  },
  type: 'parallel',
  states: {
    playback: {
      initial: 'loading',
      states: {
        loading: {
          tags: 'spinner',
          on: {
            'media.ready': {
              target: 'paused',
              actions: assign({ duration: ({ event }) => event.duration }),
            },
            'media.failed': 'failed',
          },
        },
        paused: {
          on: {
            'user.play': { target: 'playing', actions: sendTo('media', { type: 'media.play' }) },
            'user.seek': {
              actions: sendTo('media', ({ event }) => ({
                type: 'media.seek' as const,
                time: event.time,
              })),
            },
          },
        },
        playing: {
          initial: 'running',
          states: {
            running: { on: { 'media.buffering': 'buffering' } },
            buffering: { tags: 'spinner', on: { 'media.resumed': 'running' } },
          },
          on: {
            'user.pause': { target: 'paused', actions: sendTo('media', { type: 'media.pause' }) },
            'user.seek': {
              actions: sendTo('media', ({ event }) => ({
                type: 'media.seek' as const,
                time: event.time,
              })),
            },
            'media.ended': 'ended',
            'media.failed': 'failed',
          },
        },
        ended: {
          on: {
            'user.play': {
              target: 'playing',
              actions: [
                sendTo('media', { type: 'media.seek', time: 0 }),
                sendTo('media', { type: 'media.play' }),
              ],
            },
          },
        },
        failed: {},
      },
    },
    sound: {
      initial: 'unmuted',
      states: {
        unmuted: {
          on: {
            'user.toggleMute': {
              target: 'muted',
              actions: sendTo('media', { type: 'media.mute', muted: true }),
            },
          },
        },
        muted: {
          on: {
            'user.toggleMute': {
              target: 'unmuted',
              actions: sendTo('media', { type: 'media.mute', muted: false }),
            },
          },
        },
      },
    },
  },
});

// In the view:
// createActor(playerMachine.provide({ actors: { mediaElement: createMediaElementLogic(videoEl) } }))
```

Notes: `snapshot.matches({ playback: 'playing', sound: 'muted' })` reads both regions. High-frequency `media.timeUpdated` events update context only; if this causes too many renders, select narrowly in the view (`useSelector`, or `actor.select(...)` ≥ 5.29) or keep time outside the machine.

### 9.10 File upload queue (one spawned actor per file, concurrency limit)

```ts
import { setup, assign, enqueueActions, fromCallback, stopChild, type EventObject } from 'xstate';

const MAX_CONCURRENT = 3;

type UploadEvent =
  | { type: 'upload.progressed'; id: string; percent: number }
  | { type: 'upload.succeeded'; id: string; url: string }
  | { type: 'upload.failed'; id: string; error: string };

// One actor per file: its own lifetime, progress, and cancellation.
const uploadLogic = fromCallback<EventObject, { id: string; file: File }>(
  ({ input, sendBack }) => {
    const xhr = new XMLHttpRequest();
    const report = (e: UploadEvent) => sendBack(e); // sendBack is untyped; funnel it
    xhr.upload.onprogress = (e) =>
      report({
        type: 'upload.progressed',
        id: input.id,
        percent: Math.round((e.loaded / e.total) * 100),
      });
    xhr.onload = () =>
      report(
        xhr.status < 300
          ? { type: 'upload.succeeded', id: input.id, url: xhr.responseText }
          : { type: 'upload.failed', id: input.id, error: `HTTP ${xhr.status}` },
      );
    xhr.onerror = () => report({ type: 'upload.failed', id: input.id, error: 'Network error' });
    xhr.open('POST', '/api/upload');
    xhr.send(input.file);
    return () => xhr.abort(); // runs on stopChild(...) or when the parent stops
  },
);

type Item = {
  id: string;
  file: File; // not serializable: keep files outside if this machine must be persisted
  status: 'queued' | 'uploading' | 'done' | 'error';
  percent: number;
  url?: string;
  error?: string;
};

type Ctx = { items: Record<string, Item> };

const patch = (context: Ctx, id: string, changes: Partial<Item>): Ctx['items'] => ({
  ...context.items,
  [id]: { ...context.items[id], ...changes },
});

export const uploadQueueMachine = setup({
  types: {
    context: {} as Ctx,
    events: {} as
      | UploadEvent
      | { type: 'files.add'; files: { id: string; file: File }[] }
      | { type: 'upload.cancel'; id: string }
      | { type: 'upload.retry'; id: string },
  },
  actors: { upload: uploadLogic },
  actions: {
    // Start queued uploads until the concurrency limit is reached.
    pump: enqueueActions(({ context, enqueue }) => {
      const items = Object.values(context.items);
      const free = MAX_CONCURRENT - items.filter((i) => i.status === 'uploading').length;
      for (const item of items.filter((i) => i.status === 'queued').slice(0, Math.max(0, free))) {
        enqueue.spawnChild('upload', { id: item.id, input: { id: item.id, file: item.file } });
        enqueue.assign(({ context }) => ({ items: patch(context, item.id, { status: 'uploading' }) }));
      }
    }),
  },
}).createMachine({
  id: 'uploadQueue',
  context: { items: {} },
  on: {
    'files.add': {
      actions: [
        assign({
          items: ({ context, event }) => {
            const items = { ...context.items };
            for (const { id, file } of event.files) {
              items[id] = { id, file, status: 'queued', percent: 0 };
            }
            return items;
          },
        }),
        'pump',
      ],
    },
    'upload.progressed': {
      actions: assign({
        items: ({ context, event }) => patch(context, event.id, { percent: event.percent }),
      }),
    },
    'upload.succeeded': {
      actions: [
        stopChild(({ event }) => event.id), // callback actors never finish on their own
        assign({
          items: ({ context, event }) =>
            patch(context, event.id, { status: 'done', percent: 100, url: event.url }),
        }),
        'pump',
      ],
    },
    'upload.failed': {
      actions: [
        stopChild(({ event }) => event.id),
        assign({
          items: ({ context, event }) =>
            patch(context, event.id, { status: 'error', error: event.error }),
        }),
        'pump',
      ],
    },
    'upload.retry': {
      actions: [
        assign({
          items: ({ context, event }) => patch(context, event.id, { status: 'queued', percent: 0 }),
        }),
        'pump',
      ],
    },
    'upload.cancel': {
      actions: [
        stopChild(({ event }) => event.id), // no-op if it was still queued
        assign({
          items: ({ context, event }) => {
            const { [event.id]: _removed, ...rest } = context.items;
            return rest;
          },
        }),
        'pump',
      ],
    },
  },
});
```

Notes: per-item `status` lives in context because items are unbounded data; the queue itself has no modes, so the parent has no finite states. Each child is addressable as `snapshot.children[id]`. Verified at runtime: with 5 files, 3 start, the rest start as slots free, retry reuses the id after `stopChild`, and cancel frees a slot. If each upload needed its own modes (pause/resume, chunk retry), make the child a machine and report with `sendParent`.

### 9.11 Checkout and payment with final output

Final states carry outcome data; the root `output` exposes it to whoever awaits the actor.

```ts
import { setup, assign, assertEvent, fromPromise, createActor, toPromise } from 'xstate';

type Address = { line1: string; city: string; country: string };
type CheckoutOutput =
  | { status: 'paid'; orderId: string }
  | { status: 'failed'; paymentIntentId: string }
  | { status: 'cancelled' };

export const checkoutMachine = setup({
  types: {
    input: {} as { cartId: string },
    context: {} as {
      cartId: string;
      address: Address | undefined;
      paymentIntentId: string | undefined;
      orderId: string | undefined;
      error: string | undefined;
    },
    events: {} as
      | { type: 'address.submit'; address: Address }
      | { type: 'payment.submit'; paymentMethodId: string }
      | { type: 'payment.actionCompleted' } // e.g. 3-D Secure finished in the UI
      | { type: 'checkout.back' }
      | { type: 'checkout.cancel' },
    output: {} as CheckoutOutput,
  },
  actors: {
    authorizePayment: fromPromise<
      { paymentIntentId: string; requiresAction: boolean },
      { cartId: string; paymentMethodId: string }
    >(async ({ input, signal }) => {
      const res = await fetch('/api/payments/authorize', {
        method: 'POST',
        body: JSON.stringify(input),
        signal,
      });
      if (!res.ok) throw new Error('Payment declined');
      return res.json();
    }),
    placeOrder: fromPromise<{ orderId: string }, { cartId: string; paymentIntentId: string }>(
      async ({ input }) => {
        // No `signal`: once started, placing an order must not be aborted by the UI.
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Idempotency-Key': input.paymentIntentId },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error('Order failed');
        return res.json();
      },
    ),
  },
}).createMachine({
  id: 'checkout',
  context: ({ input }) => ({
    cartId: input.cartId,
    address: undefined,
    paymentIntentId: undefined,
    orderId: undefined,
    error: undefined,
  }),
  initial: 'shipping',
  states: {
    shipping: {
      on: {
        'address.submit': {
          target: 'payment',
          actions: assign({ address: ({ event }) => event.address }),
        },
        'checkout.cancel': 'cancelled',
      },
    },
    payment: {
      initial: 'editing',
      states: {
        editing: {
          on: {
            'payment.submit': 'authorizing',
            'checkout.back': '#checkout.shipping',
            'checkout.cancel': '#checkout.cancelled',
          },
        },
        authorizing: {
          invoke: {
            src: 'authorizePayment',
            input: ({ context, event }) => {
              assertEvent(event, 'payment.submit'); // the only way into this state
              return { cartId: context.cartId, paymentMethodId: event.paymentMethodId };
            },
            onDone: [
              {
                guard: ({ event }) => event.output.requiresAction,
                target: 'awaitingAction',
                actions: assign({ paymentIntentId: ({ event }) => event.output.paymentIntentId }),
              },
              {
                target: '#checkout.placingOrder',
                actions: assign({ paymentIntentId: ({ event }) => event.output.paymentIntentId }),
              },
            ],
            onError: {
              target: 'editing',
              actions: assign({ error: ({ event }) => (event.error as Error).message }),
            },
          },
        },
        awaitingAction: {
          on: {
            'payment.actionCompleted': '#checkout.placingOrder',
            'checkout.cancel': 'editing',
          },
        },
      },
    },
    // Point of no return: no cancel/back handlers here.
    placingOrder: {
      invoke: {
        src: 'placeOrder',
        input: ({ context }) => ({
          cartId: context.cartId,
          paymentIntentId: context.paymentIntentId!,
        }),
        onDone: {
          target: 'paid',
          actions: assign({ orderId: ({ event }) => event.output.orderId }),
        },
        onError: 'orderFailed',
      },
    },
    // Each final state describes its own outcome...
    paid: {
      type: 'final',
      output: ({ context }) => ({ status: 'paid', orderId: context.orderId! }),
    },
    orderFailed: {
      // Money may be authorized: the caller must compensate (void/refund).
      type: 'final',
      output: ({ context }) => ({ status: 'failed', paymentIntentId: context.paymentIntentId! }),
    },
    cancelled: { type: 'final', output: { status: 'cancelled' } },
  },
  // ...but the actor only has output if the ROOT defines `output`. It receives the
  // final state's output as `event.output` (typed `unknown`, hence the cast).
  output: ({ event }) => event.output as CheckoutOutput,
});

// A parent or a server handler can await the outcome:
export async function runCheckout(cartId: string) {
  const actor = createActor(checkoutMachine, { input: { cartId } }).start();
  return toPromise(actor); // resolves with CheckoutOutput when a top-level final state is reached
}
```

Notes: the absence of `checkout.cancel` in `placingOrder` is the business rule "you cannot cancel after the order is submitted". Without root `output`, `snapshot.output` is `undefined` even when final states define `output` (verified in source: `getMachineOutput` returns early). A parent that invokes this machine gets the same value as `event.output` in `onDone`.

### 9.12 Backend workflow with persistence

A long-running approval workflow. One request loads the snapshot, applies one event, waits until no step is running, persists, and stops. Deadlines are data, not timers.

```ts
import {
  setup,
  assign,
  fromPromise,
  createActor,
  waitFor,
  type EventFromLogic,
  type SnapshotFrom,
} from 'xstate';

// Storage port (Postgres row, KV entry, ...). Persist JSON, keyed by workflow id.
declare const store: {
  load(id: string): Promise<unknown | undefined>;
  save(id: string, snapshot: unknown, version: number): Promise<void>; // optimistic concurrency
};

type ExpenseOutput = { expenseId: string; outcome: 'paid' | 'denied' };

export const expenseWorkflow = setup({
  types: {
    input: {} as { expenseId: string; amount: number; submittedAt: number },
    context: {} as {
      expenseId: string;
      amount: number;
      approveBy: number; // deadline stored as data, not as a pending timer
      payoutId: string | undefined;
    },
    events: {} as
      | { type: 'approval.granted'; approver: string }
      | { type: 'approval.denied'; reason: string }
      | { type: 'deadline.check'; now: number }, // sent by a cron/queue, not a timer
    tags: {} as 'working',
    output: {} as ExpenseOutput,
  },
  actors: {
    payout: fromPromise<{ payoutId: string }, { expenseId: string; amount: number }>(
      async ({ input }) => {
        // MUST be idempotent: restoring a snapshot persisted mid-invoke restarts it.
        const res = await fetch('https://payments.internal/payouts', {
          method: 'POST',
          headers: { 'Idempotency-Key': `expense-${input.expenseId}` },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`payout failed: ${res.status}`);
        return res.json();
      },
    ),
  },
  guards: {
    autoApprovable: ({ context }) => context.amount <= 100,
    deadlinePassed: ({ context, event }) =>
      event.type === 'deadline.check' && event.now >= context.approveBy,
  },
}).createMachine({
  id: 'expense',
  context: ({ input }) => ({
    expenseId: input.expenseId,
    amount: input.amount,
    approveBy: input.submittedAt + 3 * 24 * 60 * 60 * 1000,
    payoutId: undefined,
  }),
  initial: 'triage',
  states: {
    triage: {
      always: [{ guard: 'autoApprovable', target: 'paying' }, { target: 'awaitingApproval' }],
    },
    awaitingApproval: {
      initial: 'withManager',
      on: {
        'approval.granted': 'paying',
        'approval.denied': 'denied',
      },
      states: {
        withManager: {
          on: { 'deadline.check': { guard: 'deadlinePassed', target: 'escalated' } },
        },
        escalated: {},
      },
    },
    paying: {
      tags: 'working',
      invoke: {
        src: 'payout',
        input: ({ context }) => ({ expenseId: context.expenseId, amount: context.amount }),
        onDone: {
          target: 'paid',
          actions: assign({ payoutId: ({ event }) => event.output.payoutId }),
        },
        onError: 'payoutFailed',
      },
    },
    payoutFailed: {
      on: { 'approval.granted': 'paying' }, // an operator re-approves to retry
    },
    paid: {
      type: 'final',
      output: ({ context }) => ({ expenseId: context.expenseId, outcome: 'paid' }),
    },
    denied: {
      type: 'final',
      output: ({ context }) => ({ expenseId: context.expenseId, outcome: 'denied' }),
    },
  },
  output: ({ event }) => event.output as ExpenseOutput,
});

type ExpenseSnapshot = SnapshotFrom<typeof expenseWorkflow>;
type ExpenseEvent = EventFromLogic<typeof expenseWorkflow>;

// One request = load -> restore -> send -> settle -> persist -> stop.
export async function handleExpenseEvent(id: string, version: number, event: ExpenseEvent) {
  const persisted = await store.load(id);
  if (!persisted) throw new Error('not found');
  const actor = createActor(expenseWorkflow, {
    snapshot: persisted as ExpenseSnapshot,
    input: undefined, // required by the types when `types.input` is set; ignored on restore
  });
  actor.start(); // restarts in-flight invocations; does NOT re-run entry actions or timers
  actor.send(event);
  // Wait until no async step is running so the persisted snapshot is at rest.
  const settled = await waitFor(actor, (s) => !s.hasTag('working'), { timeout: 30_000 });
  await store.save(id, actor.getPersistedSnapshot(), version + 1);
  actor.stop();
  return settled.value;
}
```

Notes: verified at runtime that a snapshot persisted during `paying` re-runs `payout` when restored (hence the idempotency key), and that an `after` timer in a restored snapshot never fires. Save with a version check so two concurrent requests for the same workflow cannot overwrite each other. Log every applied event with the workflow id for an audit trail.

### 9.13 Small patterns: optimistic update, polling, throttle

```ts
import { setup, assign, fromPromise } from 'xstate';

// Optimistic update with rollback
export const likeMachine = setup({
  types: {
    context: {} as { liked: boolean; confirmed: boolean },
    input: {} as { liked: boolean },
    events: {} as { type: 'like.toggle' },
  },
  actors: {
    saveLike: fromPromise<boolean, { liked: boolean }>(async ({ input, signal }) => {
      const res = await fetch('/api/like', { method: 'PUT', body: JSON.stringify(input), signal });
      if (!res.ok) throw new Error('save failed');
      return input.liked;
    }),
  },
}).createMachine({
  context: ({ input }) => ({ liked: input.liked, confirmed: input.liked }),
  initial: 'idle',
  on: {
    // Apply instantly; (re)enter `saving` so only the latest intent is in flight.
    'like.toggle': {
      target: '.saving',
      actions: assign({ liked: ({ context }) => !context.liked }),
    },
  },
  states: {
    idle: {},
    saving: {
      invoke: {
        src: 'saveLike',
        input: ({ context }) => ({ liked: context.liked }),
        onDone: { target: 'idle', actions: assign({ confirmed: ({ event }) => event.output }) },
        onError: { target: 'idle', actions: assign({ liked: ({ context }) => context.confirmed }) },
      },
    },
  },
});

// Polling that pauses while the tab is hidden
export const pollMachine = setup({
  types: {
    context: {} as { data: unknown },
    events: {} as { type: 'page.hidden' } | { type: 'page.visible' },
  },
  actors: { load: fromPromise<unknown>(async () => (await fetch('/api/status')).json()) },
  delays: { pollInterval: 5_000 },
}).createMachine({
  context: { data: undefined },
  initial: 'active',
  states: {
    active: {
      initial: 'fetching',
      on: { 'page.hidden': 'paused' },
      states: {
        fetching: {
          invoke: {
            src: 'load',
            onDone: { target: 'waiting', actions: assign({ data: ({ event }) => event.output }) },
            onError: 'waiting', // keep polling; expose staleness with a timestamp if needed
          },
        },
        waiting: { after: { pollInterval: 'fetching' } },
      },
    },
    paused: { on: { 'page.visible': 'active' } }, // re-entering `active` fetches immediately
  },
});

// Throttle: the first event acts, the rest are dropped during the cooldown
export const throttleMachine = setup({
  types: { events: {} as { type: 'save.request' } },
  actions: { save: () => {} },
  delays: { cooldown: 1_000 },
}).createMachine({
  initial: 'ready',
  states: {
    ready: { on: { 'save.request': { target: 'coolingDown', actions: 'save' } } },
    coolingDown: { after: { cooldown: 'ready' } }, // `save.request` unhandled here = dropped
  },
});
```

The optimistic pattern aborts the previous request on rapid toggles, but an aborted request may still have reached the server. If ordering matters server-side, send a client sequence number and let the server ignore older writes. For server-cached data, prefer the cache library's optimistic mutation API and keep the machine for the flow.

---

## 10. Anti-patterns

| Symptom | Why it hurts | Fix |
| --- | --- | --- |
| `isLoading`, `isError`, `isSuccess` in context | Boolean explosion; impossible combinations; flags drift | Finite states; derive booleans with `hasTag`/`matches`/`can` |
| One state per form field, per list item, or per numeric value | States must be finite; the chart explodes | Data in context; states only for modes |
| Every event handled at the root with `assign` conditionals | Logic invisible in the diagram; no gating; the machine is a reducer | Put transitions in the states where they are valid; lift only truly shared ones |
| Logic in `assign` that checks state (`if (!context.isOpen) return {}`) | Hidden guard; untestable via paths | A guard on the transition, or handle the event only in the right state |
| Storing derived data (`total`, `isValid`, `itemCount`) | Copies drift from the source | Compute in selectors or a pure function; guards may call the same function |
| Mutating `context` inside `assign` or actions | Breaks snapshot immutability, change detection, and time-travel | Return new objects/arrays |
| Side effects inside `assign` or guards (fetch, log, `Date.now()`, random) | They run during `can()`, `transition()`, graph traversal, and tests | Effects in named actions or actors; pass time/randomness in events |
| `always` transitions that ping-pong or never settle | Infinite microstep loop; hangs (default `maxIterations` is `Infinity`) | Explicit events; guards that become false; `options: { maxIterations }` (≥ 5.31) as a safety net |
| `invoke` without `onError` | The child's error escalates and the parent actor enters `status: 'error'`; the feature is dead | Always route `onError` to a recoverable state |
| `async` function used as an action to fetch data | Result and errors are lost; no cancellation | `fromPromise` actor invoked in a state |
| Using the machine as a data cache (lists of server entities, refetch logic) | Rebuilds a query cache badly; duplicates server state | Server-cache library for data; machine for flow |
| One global actor for per-request or per-user server data | Cross-request leaks and races | One actor per request/workflow instance; persist snapshots |
| Deep `sendTo` webs between sibling actors | Hidden control flow; ordering bugs | Tree-shaped messaging through the parent; `emit` for observers; lift shared logic |
| A god machine for the whole app | Every change touches everything; huge types | One machine per feature lifecycle; spawn children for entities |
| Spawned actors never stopped (callback actors that finished their job) | Leaks listeners, timers, and sockets | `stopChild(id)` when done; prefer `invoke` when lifetime equals a state |
| Persisting a snapshot mid-invoke with non-idempotent effects | Restore re-runs the effect (double charge) | Idempotency keys; persist at rest (tags); outbox pattern |
| Relying on `after` for multi-day deadlines in persisted workflows | Delayed events are not in the persisted snapshot | Deadline in context + external scheduler event |
| UI-only ephemeral state (hover, a single open/closed toggle) in a machine | Ceremony without bug prevention | `useState`/CSS; promote to a machine when modes appear |
| `disabled={isLoading}` as the only double-submit protection | Other triggers (Enter key, retries) bypass it | Leave the event unhandled in `submitting`; derive `disabled` from `can()` |
| Event names tied to widgets (`button.click`, `SUBMIT_BUTTON_CLICKED`) | Multiple triggers need multiple events; logic tied to UI | Intent names (`order.submit`) |
| DOM nodes, class instances, or `File` objects in context of a persisted machine | Not serializable; breaks persistence and inspection | Bridge actor via `.provide()`; ids in context, objects outside |
| Inline anonymous actions/guards everywhere | Visualizers show `inline:...`; implementations cannot be swapped in tests | Named implementations in `setup`, overrides via `.provide()` |

---

## 11. Stale API to catch in review

Flag these when they appear in code that claims to be v5. See `migration.md` for the full table.

| v4 / stale | v5 |
| --- | --- |
| `createMachine(config, { actions, services })` | `setup({ actions, actors, guards, delays }).createMachine(config)` or `.provide(...)` |
| `interpret(machine)` | `createActor(machine)` (`interpret` is a deprecated alias) |
| `cond: 'isValid'` | `guard: 'isValid'` |
| `services`, `invoke.src` returning a function | `actors` with `fromPromise` / `fromCallback` / machines |
| `(context, event) =>` | `({ context, event }) =>` |
| `internal: false` | `reenter: true` |
| `send(...)`, `respond`, `escalate` | `raise`, `sendTo`, `sendParent`, `emit`; throw for errors |
| `choose`, `pure` | `enqueueActions` |
| `in: 'someState'` | `guard: stateIn('#id')` |
| `spawn` imported from `xstate` | `spawn` argument inside `assign`, or `spawnChild` action |
| `stop(...)` | `stopChild(...)` |
| `event.data` on done/error events | `event.output` / `event.error` |
| `done.invoke.x`, `error.platform.x` | `xstate.done.actor.x`, `xstate.error.actor.x` |
| `schema`, `tsTypes` (typegen) | `types` in `setup` |
| `machine.withContext(...)` | `input` + `context: ({ input }) => ...` |
| `state.nextEvents` | `snapshot.can(event)`; `getNextTransitions(snapshot)` (≥ 5.26) |
| `predictableActionArguments`, `preserveActionOrder` | removed (always on) |

---

## 12. Pre-merge review checklist

Behavior

- [ ] Every finite state is a real mode: events are handled differently there. No state per data item.
- [ ] No boolean flags in context that duplicate finite state; UI booleans are derived via `hasTag`, `matches`, or `can`.
- [ ] Each event is handled only where it is valid; double submits and duplicate starts are impossible by structure.
- [ ] Shared transitions (cancel, logout, exit, reset) are lifted to the nearest common parent; child overrides are intentional.
- [ ] Independent concerns use parallel regions, not combined flags or duplicated states.
- [ ] Every state has a way out that the user or system can trigger (no dead ends except final states).
- [ ] Every `invoke` that can fail has `onError` leading to a recoverable state.
- [ ] Async work that should stop when the user leaves is invoked in that state (and uses `signal` for fetch).
- [ ] Timers use named `delays` and `after`; long deadlines in persisted machines are data + external events.
- [ ] `always` transitions settle; consider `options.maxIterations` for complex eventless chains.
- [ ] Final states and root `output` exist when a caller needs a result.

Data and effects

- [ ] Context holds only data that cannot be finite; it is serializable if persisted or inspected.
- [ ] No derived values stored in context.
- [ ] `assign` is pure and immutable; guards are pure (no time, randomness, I/O).
- [ ] Actions are fire-and-forget; anything awaited is an actor.
- [ ] Implementations are named in `setup` and swappable via `.provide()`; the machine module has no framework or DOM imports.
- [ ] Persisted machines: invoked effects are idempotent; snapshots are saved at rest; concurrent writes are version-checked.

Structure and naming

- [ ] Events are dot-namespaced; intents present tense, facts past tense; no widget names.
- [ ] States are camelCase without dots; gerund states run work; final states name outcomes.
- [ ] Granularity: one machine per feature lifecycle; per-entity actors are spawned and stopped; no sibling `sendTo` webs; no global actor for per-request data; no server data duplicated from a cache.
- [ ] `systemId` only for true singletons; invoke `id`s set where `sendTo` targets them.

Verification

- [ ] Types: `setup({ types })` declares context, events, input, output, tags (and emitted/children when used); no `any` event handling.
- [ ] Paths: `xstate/graph` (`getShortestPaths`/`getSimplePaths`/`createTestModel`) confirms every state is reachable and covered by tests, or a test walks each user story.
- [ ] Tests provide fake actors via `.provide()` and assert on `snapshot.value`, `context`, and `output`; timers use `SimulatedClock` or fake timers.
- [ ] No stale v4 APIs (section 11).
