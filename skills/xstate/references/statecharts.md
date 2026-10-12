# XState v5 statecharts reference

Complete reference for statechart features in `xstate` 5.x (verified against 5.33.2 source and runtime): state node types, initial/parent/parallel/final/history states, IDs and targets, state values and matching, tags/meta/descriptions, every transition form (event, eventless, delayed, done, route), guards, and the exact macrostep/microstep execution order. Ends with a set of statechart patterns and a pitfalls list. Actions, actors, and context are only covered where they affect statechart semantics.

## Contents

1. State node types and config keys
2. Initial states
3. Parent (compound) states
4. Parallel states
5. Final states, `onDone`, and output
6. History states
7. State IDs and target resolution
8. State values, `matches`, `hasTag`
9. Tags, meta, descriptions
10. Transitions: syntax, targets, self-transitions, `reenter`
11. Forbidden transitions and wildcards
12. Transition selection
13. Eventless transitions (`always`)
14. Delayed transitions (`after`)
15. Routes (`route`, `xstate.route`)
16. Guards
17. Execution model: macrosteps and microsteps
18. Statechart patterns
19. Pitfalls: do / don't
20. Stale API (v4 → v5)
21. Where the docs disagree with the source

---

## 1. State node types and config keys

Every state node has a `type` (read it from `machine.getStateNodeById(id).type`):

| Type | How it is created | Meaning |
|---|---|---|
| `atomic` | no `states` | leaf; no children |
| `compound` | has `states` (inferred) | exactly one child active (XOR); `initial` required |
| `parallel` | `type: 'parallel'` | all children ("regions") active at once (AND) |
| `final` | `type: 'final'` | completion of its parent; never has children |
| `history` | `type: 'history'`, or just `history: 'shallow' \| 'deep'` | pseudostate; never active, never in `snapshot.value` |

The machine itself is the root state node. It is always active and has no key in `snapshot.value`.

State node config keys (all optional unless noted):

| Key | Purpose |
|---|---|
| `id` | Global unique ID for `#id` targets, `getMeta()` keys, and done-event names. Default: `<machineId>.<path>` |
| `type` | `'atomic' \| 'compound' \| 'parallel' \| 'final' \| 'history'` |
| `initial` | Required for compound states: child key, or `{ target, actions?, description?, meta? }` |
| `states` | Child state nodes |
| `on` | Event transitions |
| `always` | Eventless transitions |
| `after` | Delayed transitions |
| `onDone` | Taken when this compound/parallel state is done (`xstate.done.state.<id>`) |
| `entry` / `exit` | Actions run on enter / exit |
| `invoke` | Actors started on entry and stopped on exit |
| `tags` | String or array; aggregated into `snapshot.tags` |
| `meta` | Static metadata; read via `snapshot.getMeta()` |
| `description` | Text (Markdown in Stately tools) for docs/visualization |
| `output` | Only on `final` states (and the root): data sent with the done event |
| `history` | History type for a history node (`true` = `'shallow'`) |
| `target` | History node default target (child key of the history node's parent) |
| `route` | Makes the state routable via `xstate.route` (xstate ≥ 5.28.0); needs `id` |

Machine-only keys: `context`, `output` (machine output), `version`, `options` (`{ maxIterations }`, xstate ≥ 5.31.0).

The constructor drops `output` on any node that is not `final` and not the root, so `output` on a normal state does nothing.

---

## 2. Initial states

A compound state without `initial` throws at machine creation: `No initial state specified for compound state node "#<id>". Try adding { initial: "<firstKey>" }`. A misspelled `initial` throws `Initial state node "<x>" not found on parent state node #<id>`.

```ts
import { setup } from 'xstate';

const machine = setup({}).createMachine({
  id: 'player',
  initial: 'idle',            // string form
  states: {
    idle: {},
    loaded: {
      // object form: run actions on default entry of this compound state
      initial: { target: 'paused', actions: () => console.log('default entry') },
      states: { paused: {}, playing: {} }
    }
  }
});
```

- `initial` actions run only when the parent is entered *by default* (targeted directly, or as part of initial resolution). They do not run when a transition targets a specific descendant such as `'loaded.playing'`.
- On start, the machine performs an initial macrostep with the event `{ type: 'xstate.init', input }`. Entry actions and `always` guards that run during start see that event.
- Initial resolution recurses: entering a compound state enters its initial child, and so on down to atomic states; entering a parallel state enters every region.

---

## 3. Parent (compound) states

Use a parent state when several states share transitions, entry/exit work, invoked actors, or timers. Events bubble: the deepest active state is checked first, then its ancestors (see section 12).

```ts
const machine = setup({}).createMachine({
  id: 'fetcher',
  initial: 'active',
  states: {
    active: {
      initial: 'idle',
      // shared by every child of `active`
      on: { cancel: { target: '#fetcher.cancelled' } },
      states: {
        idle: { on: { fetch: 'loading' } },
        loading: { on: { resolve: 'done' } },
        done: { type: 'final' }
      },
      onDone: { target: 'finished' }
    },
    cancelled: {},
    finished: {}
  }
});
```

Rules that matter:

- Targeting a parent enters its initial child (recursively).
- A transition from a child to its own ancestor (e.g. `target: '#parent'`) exits and re-enters that ancestor and resets it to its initial child. Entry/exit actions of the ancestor run.
- A transition on a parent that targets one of its descendants (`'.child'`) does not exit the parent (unless `reenter: true`), but it always exits the active child subtree and enters the target, even when the target is the currently active child.

---

## 4. Parallel states

All regions are active at once. Each region is usually a compound state.

```ts
const player = setup({}).createMachine({
  id: 'player',
  type: 'parallel',
  states: {
    playback: {
      initial: 'paused',
      states: {
        paused: { on: { play: 'playing' } },
        playing: { on: { pause: 'paused' } }
      }
    },
    volume: {
      initial: 'normal',
      states: {
        normal: { on: { mute: 'muted' } },
        muted: { on: { unmute: 'normal' } }
      }
    }
  }
});
// snapshot.value → { playback: 'paused', volume: 'normal' }
```

- Entering a parallel state enters all regions in document order; exiting exits all regions (children first).
- One event can enable transitions in several regions; all of them are taken in the same microstep (see conflict rules in section 12).
- Multiple targets in one transition must be in different regions: `target: ['.playback.playing', '.volume.muted']`.
- A transition whose source is the parallel state (or an ancestor) and whose target is inside one region exits and re-enters **all** regions of that parallel state, so other regions reset to their initial states. Put the transition on the region instead when other regions must keep their state:

```ts
// ❌ resets `volume` to 'normal' every time
on: { 'playback.reset': { target: '.playback.paused' } } // on the parallel/root node

// ✅ only touches the playback region
playback: {
  initial: 'paused',
  on: { 'playback.reset': { target: '.paused' } },
  states: { /* ... */ }
}
```

- A parallel state is "done" when every region is in a final state (section 5).
- Do not transition from one region into another region's children. Coordinate with shared events (both regions handle `x`), `raise`, or a `stateIn` guard.

When to choose what:

| Situation | Model |
|---|---|
| Independent dimensions that can change separately (playback × volume, bold × italic) | parallel regions |
| One mode at a time, shared behavior | compound parent |
| Fully separate lifecycle, own context, reusable | invoked/spawned child machine |
| Plain data with no behavior difference | `context`, not states |

---

## 5. Final states, `onDone`, and output

```ts
import { setup, assign, createActor, toPromise } from 'xstate';

const checkout = setup({
  types: {
    context: {} as { orderId: string | null },
    events: {} as { type: 'confirm'; orderId: string } | { type: 'abort' },
    output: {} as { orderId: string | null; status: 'placed' | 'aborted' }
  }
}).createMachine({
  id: 'checkout',
  context: { orderId: null },
  initial: 'form',
  states: {
    form: {
      initial: 'editing',
      states: {
        editing: { on: { confirm: 'confirmed' } },
        confirmed: {
          type: 'final',
          output: ({ event }) => ({
            orderId: event.type === 'confirm' ? event.orderId : null
          })
        }
      },
      onDone: {
        target: 'placed',
        // event: { type: 'xstate.done.state.checkout.form', output: { orderId } }
        // DoneStateEvent['output'] is `unknown`: narrow it
        actions: assign({
          orderId: ({ event }) => (event.output as { orderId: string | null }).orderId
        })
      }
    },
    placed: { type: 'final', output: { status: 'placed' as const } },
    aborted: { type: 'final', output: { status: 'aborted' as const } }
  },
  on: { abort: { target: '.aborted' } },
  // machine output: `event` is the done event of the top-level final state;
  // `event.output` is that final state's `output`
  output: ({ context, event }) => ({
    orderId: context.orderId,
    status: (event.output as { status: 'placed' | 'aborted' }).status
  })
});

const actor = createActor(checkout).start();
actor.send({ type: 'confirm', orderId: 'o1' });
await toPromise(actor); // { orderId: 'o1', status: 'placed' }
```

Facts (verified at runtime):

- Entering a final child of compound parent `P` raises `{ type: 'xstate.done.state.<P.id>', output }`, where `output` is the final state's `output` (static value or `({ context, event, self }) => value`). `P.onDone` handles it. `onDone` accepts the same forms as any transition (string, object, guarded array).
- A parallel state is done when all regions are in a final state. It raises `xstate.done.state.<parallelId>` with **`output: undefined`**; region final outputs are not combined. Store region results in `context` before they finish.
- Done events are internal (raised) events: they are processed in the same macrostep, after eventless transitions are settled.
- Reaching a **top-level** final state: `snapshot.status` becomes `'done'`, the root `output` is evaluated, then the exit actions of every still-active state run (deepest first, root last), all children are stopped, and the actor completes (`subscribe({ complete })`, `toPromise`, parent's `xstate.done.actor.<id>`). Later events are ignored.
- A top-level final state's `output` is **not** the machine output on its own. Only the root `output` sets `snapshot.output`; forward it explicitly: `output: ({ event }) => event.output`.
- `onDone` on a state with no final child never fires.
- Do not use v4 property mappers in `output` (`{ a: ({ context }) => … }`): an object is treated as a static value. Use a function.
- Final states should not declare `on`/`always`/`after`; a top-level final ends the actor and a nested final is only a completion marker.

---

## 6. History states

A history state remembers which children of its parent were active when the parent was exited. Targeting it re-enters that configuration.

```ts
const settings = setup({}).createMachine({
  id: 'app',
  initial: 'settings',
  states: {
    settings: {
      initial: 'general',
      states: {
        general: { on: { next: 'privacy' } },
        privacy: {
          initial: 'basic',
          states: { basic: { on: { more: 'advanced' } }, advanced: {} }
        },
        hist: { type: 'history', history: 'deep' } // or 'shallow' (default)
      },
      on: { openHelp: 'help' }
    },
    help: { on: { back: 'settings.hist' } } // sibling-relative path to the history node
  }
});
```

| Kind | Records on exit of the parent | Re-entry |
|---|---|---|
| `shallow` (default, `history: true`) | the active **direct children** | that child, then its own initial descendants |
| `deep` | all active **atomic descendants** | the exact nested configuration |

Verified: `settings.privacy.advanced` → `help` → `back` yields `{ settings: { privacy: 'basic' } }` with shallow and `{ settings: { privacy: 'advanced' } }` with deep.

- No recorded history yet → enter the history node's `target` (a child key of the history node's parent, e.g. `target: 'privacy'`), otherwise the parent's `initial`.
- History directly inside a `parallel` state with no record and no `target` enters the parallel state's initial configuration (fixed in xstate 5.32.4; earlier versions did nothing).
- History is recorded in `snapshot.historyValue` (internal; keyed by history node ID) and survives `getPersistedSnapshot()`/restore (fixed in 5.19.3).
- Give the history node an `id` when you target it from far away: `hist: { type: 'history', id: 'settingsHistory' }` → `target: '#settingsHistory'`.

---

## 7. State IDs and target resolution

- Default ID: `<machine id>.<key path>`, e.g. `checkout.form.confirmed`. Machine `id` defaults to `'(machine)'`, so done events look like `xstate.done.state.(machine).p`. Always set a machine `id` so IDs and event names are readable.
- A custom `id` replaces the whole ID (it is not prefixed). It must be unique in the machine. It does not change `snapshot.value`.
- `#id` targets accept a path after the ID: `'#checkout.form.editing'` resolves ID `checkout`, then child path `form.editing`. Because `.` splits paths, a literal period in a key or ID must be escaped (`'Loading\\.\\.\\.'`, xstate ≥ 5.5.2).
- `machine.getStateNodeById('id')` (leading `#` optional) returns the `StateNode` (with `.type`, `.on`, `.meta`, `.tags`, `.description`, `.states`, `.parent`). It throws for unknown IDs.

Target string resolution, relative to the **source** state node:

| Target | Resolves to | Example |
|---|---|---|
| `'b'` | sibling `b` (child of the source's parent) | `a: { on: { go: 'b' } }` |
| `'b.c'` | descendant of sibling `b` | `target: 'b.c'` |
| `'.c'` | child `c` of the source itself | parent `on: { reset: '.c' }` |
| `'.c.d'` | descendant of the source | |
| `'#id'` / `'#id.child'` | any node by ID (+ path) | `target: '#app.help'` |
| `['.r1.x', '.r2.y']` | multiple targets (parallel regions only) | |
| `undefined` / omitted | targetless | |

On the root (`on` at machine level) a bare key throws: `Invalid target: "b" is not a valid target from the root node. Did you mean ".b"?` Use `'.b'`.

---

## 8. State values, `matches`, `hasTag`

```ts
// atomic child of root           → 'idle'
// nested                         → { loaded: 'paused' }
// parallel                       → { playback: 'paused', volume: 'normal' }
// parallel with nested regions   → { r1: { a: 'x' }, r2: 'b' }
// machine with no child states   → {}   (not null)
```

`snapshot.matches(partialValue)` checks whether `partialValue` is a prefix of the current value:

```ts
// value = { r1: { a: 'x' }, r2: 'b' }
s.matches('r1');                       // true  (top-level key)
s.matches({ r1: 'a' });                // true
s.matches({ r1: { a: 'x' }, r2: 'b' }); // true
s.matches({ r1: 'x' });                // false — must give the full path from the root
```

- With `setup(...).createMachine(...)`, `snapshot.value` and `matches(...)` arguments are typed from the config (xstate ≥ 5.18), so invalid paths are type errors.
- Never compare `snapshot.value === 'x'` for nested/parallel machines; use `matches`.
- `snapshot.hasTag('loading')` checks whether any active state node has the tag. Prefer `hasTag` for UI concerns ("is busy", "can edit") because it survives refactors that move or rename states; use `matches` when the exact position in the hierarchy is the point.
- `snapshot.can(event)` returns true when some transition is enabled and is not forbidden (it evaluates guards; see section 16).
- `mapState(snapshot, mapper)` (xstate ≥ 5.31.0) maps active state nodes to values with a mapper that mirrors the state tree; results come leaf to root.

Transient states (entered and left by `always` in one macrostep) never appear in an emitted snapshot, so `matches`/`hasTag`/`waitFor` never see them (section 13).

---

## 9. Tags, meta, descriptions

```ts
const machine = setup({
  types: {
    tags: {} as 'busy' | 'editable',
    meta: {} as { view: string },                 // state meta (xstate ≥ 5.12)
    transitionMeta: {} as { analytics?: string }  // separate transition meta (xstate ≥ 5.33)
  }
}).createMachine({
  id: 'doc',
  initial: 'editing',
  states: {
    editing: {
      tags: ['editable'],
      meta: { view: 'editor' },
      description: 'User edits the draft',
      on: {
        save: {
          target: 'saving',
          description: 'Persist the draft',
          meta: { analytics: 'doc_save' }
        }
      }
    },
    saving: { tags: 'busy', meta: { view: 'spinner' } }
  }
});

const s = createActor(machine).start().getSnapshot();
s.tags;          // Set { 'editable' }
s.hasTag('busy'); // false (typed: 'busy' | 'editable')
s.getMeta();     // { 'doc.editing': { view: 'editor' } } — keyed by state node ID
```

- `snapshot.tags` is a `Set<string>` of tags from all active nodes, including ancestors.
- `snapshot.getMeta()` returns `{ [stateNodeId]: meta }` for every active node that has `meta`, including the root (key = machine ID). Keys are typed (xstate ≥ 5.17). There is no `snapshot.meta` property in v5.
- Without `transitionMeta`, `types.meta` types both state and transition meta.
- Transition `meta`/`description` live on transition definitions, not on snapshots. Read them with `getNextTransitions(snapshot)` (xstate ≥ 5.26; returns all potential transitions from active nodes, each with `eventType`, `source`, `target`, `guard`, `meta`, `description`), or statically via `machine.getStateNodeById('doc.editing').on.save`.
- `description` is a string on state nodes and transitions. It appears in `stateNode.description`, `machine.toJSON()`, and Stately visualizations. It has no runtime effect.

---

## 10. Transitions: syntax, targets, self-transitions, `reenter`

Transition config forms (valid in `on`, `always`, `after`, `onDone`, `invoke.onDone/onError/onSnapshot`):

```ts
on: {
  // 1. string target shorthand
  next: 'b',
  // 2. object
  submit: {
    target: 'submitting',
    guard: 'isValid',
    actions: ['track', assign({ submitted: true })],
    reenter: false,          // default
    description: 'Submit the form',
    meta: { analytics: 'submit' }
  },
  // 3. array of candidates: first enabled wins; last unguarded is the default
  rate: [
    { guard: 'isHappy', target: 'thanks' },
    { guard: 'isAngry', target: 'escalate' },
    { target: 'form' }
  ],
  // 4. targetless: run actions, stay put
  type: { actions: assign({ text: ({ event }) => event.text }) },
  // 5. forbidden: handled here, never bubbles to ancestors
  cancel: undefined
}
```

In `setup()` machines, event types narrow per transition: inside `on: { rate: … }` the `event` argument is the `rate` event. `always` and `after` transitions see the union of all events.

### Self-transitions and `reenter`

v5 transitions are "internal" by default: a transition does not exit and re-enter its source unless the target is outside the source or `reenter: true` is set. `reenter: true` replaces v4 `internal: false` / external transitions.

| Form on state `s` | `s` exit/entry | Children of `s` | `s`'s invokes and `after` timers |
|---|---|---|---|
| targetless `{ actions }` | not run | preserved | kept running |
| `target: 's'` (from a sibling key) | not run | exited, re-entered at initial | kept (not restarted) |
| `target: 's', reenter: true` | run (exit, then entry) | re-entered at initial | stopped and restarted |
| targetless + `reenter: true` | not run (`reenter` is ignored without a target) | preserved | kept |
| on parent: `target: '.child'` | parent not re-entered | active child exited, `child` entered (even if already active) | parent's kept |
| on parent: `target: '.child', reenter: true` | parent exit + entry run | `child` entered | parent's restarted |
| child → ancestor (`'#parent'`) | ancestor exit + entry run | reset to initial | restarted |

Rule of thumb: omit `target` to "handle the event without moving"; add `reenter: true` when you need entry/exit actions, invoked actors, or `after` timers to restart.

---

## 11. Forbidden transitions and wildcards

**Forbidden transitions.** `EVENT: undefined` (or `EVENT: {}`) on a state is selected for that event and stops the search, so ancestors' handlers for that event are blocked while this state is active. `snapshot.can({ type: 'EVENT' })` returns `false` for it.

```ts
editing: {
  initial: 'clean',
  on: { close: '#doc.closed' },
  states: {
    clean: {},
    dirty: { on: { close: undefined } } // cannot close while dirty
  }
}
```

**Wildcards.** Event descriptors (keys of `on`) support:

- `'*'` — matches any event.
- `'prefix.*'` — matches `prefix` itself and any `prefix.<anything>` (including deeper tokens like `prefix.a.b`).
- Invalid (never match; dev-mode warning): `'mouse*'`, `'*.click'`, `'mouse.*.click'`, `'mouse.click*'`.

Precedence within one state node: exact descriptor first; if every exact candidate's guard fails, partial wildcards are tried longest prefix first, then `'*'` (wildcard fallback after a failed exact guard needs xstate ≥ 5.32.2; before that an exact match blocked the fallback). Sending `{ type: '*' }` throws in development.

Use dot-namespaced event names (`feedback.good`, `feedback.bad`) so partial wildcards and `assertEvent(event, 'feedback.*')` (xstate ≥ 5.25) work.

---

## 12. Transition selection

For an incoming event:

1. For each active atomic state (parallel regions in document order), check the atomic state, then its parent, then grandparent, up to the root ("deepest first").
2. At each state node, collect candidates for the event (exact, then wildcards as above) and take the **first** whose guard passes (or has no guard). Stop climbing for this region.
3. If no candidate passes at that node, continue to the parent. A failed guard at a child does not block the parent's handler.
4. Collect the selected transitions from all regions, then remove conflicts: when two transitions would exit overlapping states, the one whose source is a descendant of the other's source wins; otherwise the earlier one (document order) wins.
5. If nothing was selected, the snapshot does not change (no microstep, but eventless transitions are still checked).

Guards in step 2 see the snapshot from **before** the macrostep's current microstep, so regions in the same microstep cannot see each other's changes.

---

## 13. Eventless transitions (`always`)

```ts
checking: {
  always: [
    { guard: 'isAdmin', target: 'admin' },
    { guard: 'isMember', target: 'member' },
    { target: 'guest' }
  ]
}
```

- Checked after **every** microstep (including the initial one on start) for all active states, deepest first, until none is enabled. They take priority over raised events waiting in the internal queue.
- The guard and actions receive the event that started the current macrostep (e.g. the external event, or `xstate.init` on start). TypeScript types it as the union of all events.
- An `always` transition on a parent applies while any of its children is active.
- Infinite loops: an unguarded `always` whose `actions` change context (e.g. `assign`) loops forever, and so does an unguarded `always` with `target` + `reenter: true` to itself or a cycle A → B → A. A targetless `always` whose actions do not change the snapshot runs once and stops. The loop limit `options.maxIterations` defaults to `Infinity`, so a loop hangs the thread. Set a limit in development:

```ts
setup({ /* ... */ }).createMachine({
  options: { maxIterations: 1000 }, // xstate ≥ 5.31.0: throws "Infinite loop detected…" → actor status 'error'
  // ...
});
```

- Safe forms: `target` (different from the current state), `guard + target`, `guard + actions` where the actions make the guard false.
- Transient states are invisible to `subscribe`, `waitFor`, `matches`, `hasTag`; their entry/exit actions still run. To observe them, use the inspection API (`@xstate.microstep` events), `getMicrosteps(machine, snapshot, event)` (xstate ≥ 5.27), or replace `always` with `after: { 0: 'next' }` (asynchronous, emits a snapshot).

---

## 14. Delayed transitions (`after`)

```ts
import { setup, assign } from 'xstate';

const toast = setup({
  types: { context: {} as { attempts: number } },
  delays: {
    short: 3000,                                                  // number
    backoff: ({ context }) => Math.min(30_000, 2 ** context.attempts * 500) // function
  }
}).createMachine({
  context: { attempts: 0 },
  initial: 'visible',
  states: {
    visible: {
      after: {
        short: 'hidden',            // named delay
        10_000: { target: 'hidden' } // inline milliseconds
      },
      on: { hover: 'pinned' }
    },
    pinned: { on: { leave: 'visible' } },
    hidden: {}
  }
});
```

How it works (source: `getDelayedTransitions`): for each delay key, entering the state schedules a raised event `xstate.after.<delay>.<stateNodeId>` (ID = event type), and exiting the state cancels it. Consequences:

- Leaving the state before the timer fires cancels it; coming back restarts the full delay.
- A self-transition **without** `reenter: true` does not restart the timer. A retry loop must re-enter:

```ts
retrying: {
  after: {
    backoff: {
      target: 'retrying',
      reenter: true, // required; without it the timer fires only once
      actions: assign({ attempts: ({ context }) => context.attempts + 1 })
    }
  }
}
```

- Each delay key may hold a guarded candidate array, like `on`. Multiple keys create independent timers; the first to fire usually exits the state and cancels the rest.
- Delay functions receive `({ context, event, self, system }, params)`, where `event` is the event that caused the state to be entered. They are evaluated once, on entry.
- Named delays must exist in `setup({ delays })` or `.provide({ delays })`. An unknown delay name resolves to a non-number and the event is raised **immediately** (no timer). `setup()` makes typos a type error.
- Test with a simulated clock instead of real time:

```ts
import { createActor, SimulatedClock } from 'xstate';

const clock = new SimulatedClock();
const actor = createActor(toast, { clock }).start();
clock.increment(3000);
actor.getSnapshot().value; // 'hidden'
```

---

## 15. Routes (`route`, `xstate.route`)

Added in xstate 5.28.0; named guards in `route.guard` are resolved since 5.31.1. A state with `route: {}` **and** an explicit `id` can be entered from anywhere by sending `{ type: 'xstate.route', to: '#<id>' }`.

```ts
const app = setup({
  types: { context: {} as { role: 'viewer' | 'admin' } },
  guards: { isAdmin: ({ context }) => context.role === 'admin' }
}).createMachine({
  id: 'app',
  context: { role: 'viewer' },
  initial: 'home',
  states: {
    home: { id: 'home', route: {} },
    dashboard: {
      initial: 'overview',
      states: {
        overview: { id: 'overview', route: {} },
        settings: { id: 'settings', route: { guard: 'isAdmin' } }
      }
    },
    contact: {} // no route → ignores xstate.route
  }
});

actor.send({ type: 'xstate.route', to: '#overview' }); // { dashboard: 'overview' }
```

What it is in the source (`formatRouteTransitions`): at machine creation, every descendant with `config.route && config.id` adds one transition to the **root** node's `xstate.route` handlers: `{ ...route, target: '#<id>', guard: and([event.to === '#<id>', route.guard]) }`. The route config accepts `guard`, `actions`, `meta`, `description` (no `target`, no `reenter`).

Consequences:

- `to` must be exactly `'#<id>'`. `'#dashboard.overview'` and bare `'overview'` do nothing. In `setup()` machines, `to` is typed as the union of routable IDs.
- A state with `route` but no `id` is not routable.
- Routes follow normal selection: a deeper active state with its own `on: { 'xstate.route': … }` or a forbidden `'xstate.route': undefined` handles the event first; `'*'` handlers deeper in the tree also see route events.
- Because the transition's source is the root, its domain is the root: **every active state is exited and re-entered**, including shared ancestors and other parallel regions. Verified: routing from `dashboard.overview` to `#settings` runs `dashboard`'s exit and entry (and restarts its invokes/timers); routing inside one parallel region resets the other regions to their initial states. Routing to the current state re-enters it.
- Do not use routes for in-feature navigation that must keep ancestor actors or sibling regions alive; use normal transitions there. Routes fit URL → state synchronization at the top of an app.

---

## 16. Guards

Guards are synchronous predicates `({ context, event }, params) => boolean`. They get no `self`/`system`.

```ts
import { setup, and, or, not, stateIn } from 'xstate';

const editor = setup({
  types: {
    context: {} as { ownerId: string; userId: string; locked: boolean; length: number },
    events: {} as { type: 'edit' } | { type: 'save'; force?: boolean } | { type: 'sync' }
  },
  guards: {
    isOwner: ({ context }) => context.ownerId === context.userId,
    isLocked: ({ context }) => context.locked,
    // params are typed by the second argument
    longerThan: ({ context }, params: { min: number }) => context.length > params.min
  }
}).createMachine({
  id: 'editor',
  context: { ownerId: 'u1', userId: 'u1', locked: false, length: 0 },
  type: 'parallel',
  states: {
    mode: {
      initial: 'viewing',
      states: {
        viewing: {
          on: {
            edit: {
              guard: and(['isOwner', not('isLocked')]),
              target: 'editing'
            }
          }
        },
        editing: {
          on: {
            save: [
              {
                // static params, or a function of ({ context, event })
                guard: or([
                  ({ event }) => event.force === true,
                  { type: 'longerThan', params: { min: 0 } }
                ]),
                target: 'viewing'
              },
              { actions: () => console.warn('nothing to save') } // default
            ]
          }
        }
      }
    },
    network: {
      initial: 'online',
      states: { online: {}, offline: {} }
    }
  },
  on: {
    // cross-region condition: stateIn takes '#id' or a state value from the root
    sync: { guard: stateIn({ network: 'online' }), actions: () => {} }
  }
});
```

Forms:

| Form | Example | Notes |
|---|---|---|
| named | `guard: 'isOwner'` | implementation in `setup({ guards })` or `.provide({ guards })` |
| named + params | `guard: { type: 'longerThan', params: { min: 3 } }` | `params` may be `({ context, event }) => params` |
| inline | `guard: ({ context }) => context.ok` | fine for prototypes; not visible/overridable by name |
| higher-order | `and([...])`, `or([...])`, `not(g)` | accept names, objects, inline functions, and nest |
| state check | `stateIn('#id')`, `stateIn({ region: 'child' })` | checks the whole machine snapshot |

- Higher-order guards can be named guards themselves. For type-checked references to other named guards, build them with `setup(...).extend({ guards: { canEdit: and(['isOwner', not('isLocked')]) } })` (xstate ≥ 5.24).
- A referenced guard that is not implemented makes the actor error: `Unable to evaluate guard 'x' in transition for event 'E' in state node '…': Guard 'x' is not implemented.` A guard that throws is wrapped the same way, and the actor goes to `status: 'error'`.
- `stateIn` replaces v4 `in: '#id'`. Prefer events and region-local transitions; reach for `stateIn` when a transition in one region truly depends on another region.

Purity rules (why they matter): guards are evaluated during selection, by `snapshot.can()`, and by the pure `transition()`/`getNextSnapshot()` helpers, possibly more than once. So guards must not mutate anything, call APIs, read the clock/random/global mutable state, or be async. Put time or external facts into `context` or the event payload first. Side effects belong in actions; async work belongs in invoked actors.

---

## 17. Execution model: macrosteps and microsteps

A **macrostep** processes one external event (`actor.send`, delayed events, events from other actors) to completion. It is made of **microsteps**, each of which takes a set of transitions. Subscribers receive one snapshot per macrostep.

One microstep (SCXML algorithm):

1. **Select** transitions for the event (section 12) and remove conflicts.
2. **Exit** states in the exit set in reverse document order (children before parents). Before exiting, history nodes of exiting states record their configuration. For each state: run `exit` actions, then stop its invoked actors.
3. Run **transition actions** (all selected transitions, in order).
4. **Enter** states in document order (parents before children). For each state: run `entry` actions, start its invoked actors, run `initial` actions if entered by default. Entering a final state queues `xstate.done.state.<parentId>` (and done events of completed parallel ancestors).
5. If a top-level final state was entered: status `'done'`, compute `output`, run exit actions of all remaining active states.

Macrostep loop:

1. Take the external event's microstep (on start, the initial microstep with `xstate.init`).
2. While the actor is active: if any `always` transition is enabled, take it (a microstep) and repeat; otherwise, if the internal queue has events (`raise(...)` without delay, done-state events), dequeue one and take its microstep; otherwise stop.
3. Emit the final snapshot; stop children if the status is not `'active'`.

Verified order for `a --GO--> b` where `b` raises `R` on entry and has `always → c`:

```
exit a → transition GO actions → entry b (raise R queued)
→ always guard (sees event GO) → entry c → R handled in c
```

Consequences:

- `assign` actions run in order and later actions see earlier results; a transition action sees context changed by `exit` actions of the same microstep, and `entry` actions see context changed by transition actions.
- `raise` (no delay) is processed in the same macrostep after eventless transitions settle; `raise` with `delay`, `sendTo(self)`, and `after` events are processed in later macrosteps.
- Run-to-completion: an event sent from inside an action is queued; it never interrupts the current macrostep.
- For pure, side-effect-free stepping (tests, servers), use `initialTransition(machine, input?)` and `transition(machine, snapshot, event)` (xstate ≥ 5.19), which return `[snapshot, actions]` without executing actions; `getMicrosteps`/`getInitialMicrosteps` (xstate ≥ 5.27) return each microstep.

---

## 18. Statechart patterns

All examples are `setup()`-typed and compile against xstate 5.33.

### 18.1 Load → success / failure with bounded retry and backoff

```ts
import { setup, assign, fromPromise } from 'xstate';

type User = { id: string; name: string };

export const userMachine = setup({
  types: {
    context: {} as { userId: string; user: User | null; error: unknown; attempts: number },
    events: {} as { type: 'retry' } | { type: 'refresh' },
    input: {} as { userId: string },
    tags: {} as 'busy'
  },
  actors: {
    fetchUser: fromPromise<User, { userId: string }>(async ({ input, signal }) => {
      const res = await fetch(`/api/users/${input.userId}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  },
  guards: {
    canAutoRetry: ({ context }) => context.attempts < 3
  },
  delays: {
    backoff: ({ context }) => 2 ** context.attempts * 500
  }
}).createMachine({
  id: 'user',
  context: ({ input }) => ({ userId: input.userId, user: null, error: null, attempts: 0 }),
  initial: 'loading',
  states: {
    loading: {
      tags: 'busy',
      invoke: {
        src: 'fetchUser',
        input: ({ context }) => ({ userId: context.userId }),
        onDone: {
          target: 'success',
          actions: assign({ user: ({ event }) => event.output, error: null, attempts: 0 })
        },
        onError: [
          {
            guard: 'canAutoRetry',
            target: 'waitingToRetry',
            actions: assign({ error: ({ event }) => event.error })
          },
          { target: 'failure', actions: assign({ error: ({ event }) => event.error }) }
        ]
      }
    },
    waitingToRetry: {
      tags: 'busy',
      after: {
        backoff: {
          target: 'loading',
          actions: assign({ attempts: ({ context }) => context.attempts + 1 })
        }
      }
    },
    success: { on: { refresh: 'loading' } },
    failure: { on: { retry: { target: 'loading', actions: assign({ attempts: 0 }) } } }
  }
});
// UI: snapshot.hasTag('busy'), snapshot.matches('failure')
```

Why: one state per behavior, so "loading and error at the same time" is impossible; `hasTag('busy')` covers both busy states; leaving `loading` cancels the request (the invoked promise's `signal` aborts).

### 18.2 Nested auth flow

```ts
import { setup, assign, fromPromise } from 'xstate';

type Session = { token: string };

export const authMachine = setup({
  types: {
    context: {} as { session: Session | null; error: string | null },
    events: {} as
      | { type: 'login'; email: string; password: string }
      | { type: 'logout' }
      | { type: 'expired' }
  },
  actors: {
    signIn: fromPromise<Session, { email: string; password: string }>(async ({ input }) => {
      // call your API with input.email / input.password
      return { token: 't' };
    })
  }
}).createMachine({
  id: 'auth',
  context: { session: null, error: null },
  initial: 'signedOut',
  states: {
    signedOut: {
      initial: 'idle',
      states: {
        idle: { on: { login: 'submitting' } },
        submitting: {
          invoke: {
            src: 'signIn',
            input: ({ event }) => {
              if (event.type !== 'login') throw new Error('unexpected event');
              return { email: event.email, password: event.password };
            },
            onDone: {
              target: '#auth.signedIn',
              actions: assign({ session: ({ event }) => event.output, error: null })
            },
            onError: {
              target: 'failed',
              actions: assign({ error: 'Invalid email or password' })
            }
          }
        },
        failed: { on: { login: 'submitting' } }
      }
    },
    signedIn: {
      initial: 'active',
      states: { active: {}, sessionExpired: { type: 'final' } },
      on: {
        logout: { target: 'signedOut', actions: assign({ session: null }) },
        expired: { target: '.sessionExpired' }
      },
      onDone: { target: 'signedOut', actions: assign({ session: null, error: 'Session expired' }) }
    }
  }
});
```

Why: `logout` is defined once on `signedIn`, so every current and future child inherits it; the final child + `onDone` expresses "this sub-flow finished" without the parent knowing which child ended it. Invoke `input` runs with the event that entered the state, so narrow it (or use `assertEvent(event, 'login')`).

### 18.3 Parallel regions: text formatting toolbar

```ts
import { setup } from 'xstate';

export const formatMachine = setup({
  types: {
    events: {} as
      | { type: 'bold.toggle' }
      | { type: 'italic.toggle' }
      | { type: 'list.bullets' }
      | { type: 'list.numbers' }
      | { type: 'list.none' }
      | { type: 'format.clear' }
  }
}).createMachine({
  id: 'format',
  type: 'parallel',
  states: {
    bold: {
      initial: 'off',
      states: { off: { on: { 'bold.toggle': 'on' } }, on: { on: { 'bold.toggle': 'off' } } }
    },
    italic: {
      initial: 'off',
      states: { off: { on: { 'italic.toggle': 'on' } }, on: { on: { 'italic.toggle': 'off' } } }
    },
    list: {
      initial: 'none',
      on: {
        'list.bullets': '.bullets',
        'list.numbers': '.numbers',
        'list.none': '.none'
      },
      states: { none: {}, bullets: {}, numbers: {} }
    }
  },
  // resetting every region is exactly what a root-level target does
  on: { 'format.clear': { target: ['.bold.off', '.italic.off', '.list.none'] } }
});
// snapshot.matches({ bold: 'on' }), snapshot.value.list
```

Why: three independent dimensions as regions give 2 × 2 × 3 combinations without a combinatorial flat state list. Region-local events keep regions independent; the root-level `format.clear` intentionally re-enters all regions.

### 18.4 History: resume where the user left off

```ts
import { setup } from 'xstate';

export const wizard = setup({
  types: {
    events: {} as { type: 'next' } | { type: 'back' } | { type: 'help' } | { type: 'resume' }
  }
}).createMachine({
  id: 'wizard',
  initial: 'steps',
  states: {
    steps: {
      initial: 'account',
      states: {
        account: { on: { next: 'profile' } },
        profile: {
          initial: 'basics',
          states: { basics: { on: { next: 'avatar' } }, avatar: { on: { back: 'basics' } } },
          on: { back: 'account' }
        },
        resumePoint: { type: 'history', history: 'deep', id: 'wizardResume' }
      },
      on: { help: 'help' }
    },
    help: { on: { resume: '#wizardResume' } }
  }
});
```

Why: deep history restores `steps.profile.avatar`, not just `steps.profile`. Use shallow history when re-entering a child at its own initial state is correct.

### 18.5 Timeouts with `after`: idle session

```ts
import { setup } from 'xstate';

export const session = setup({
  types: { events: {} as { type: 'activity' } | { type: 'logout' } },
  delays: { idle: 15 * 60_000, grace: 60_000 }
}).createMachine({
  id: 'session',
  initial: 'active',
  states: {
    active: {
      after: { idle: 'warning' },
      // restart the idle timer on activity: targetless would NOT restart it
      on: { activity: { target: 'active', reenter: true } }
    },
    warning: {
      after: { grace: 'expired' },
      on: { activity: 'active' }
    },
    expired: { type: 'final' }
  },
  on: { logout: '.expired' }
});
```

Why: timers are owned by states; leaving `warning` cancels the grace timer automatically; no manual `clearTimeout`.

### 18.6 Conditional routing with `always`

```ts
import { setup, assign } from 'xstate';

export const onboarding = setup({
  types: {
    context: {} as { plan: 'free' | 'pro' | null; verified: boolean },
    events: {} as { type: 'choose'; plan: 'free' | 'pro' } | { type: 'verified' }
  },
  guards: {
    needsVerification: ({ context }) => !context.verified,
    isPro: ({ context }) => context.plan === 'pro'
  }
}).createMachine({
  id: 'onboarding',
  context: { plan: null, verified: false },
  initial: 'choosePlan',
  states: {
    choosePlan: {
      on: { choose: { target: 'route', actions: assign({ plan: ({ event }) => event.plan }) } }
    },
    // transient decision node: never visible in snapshots
    route: {
      always: [
        { guard: 'needsVerification', target: 'verify' },
        { guard: 'isPro', target: 'proSetup' },
        { target: 'done' }
      ]
    },
    verify: { on: { verified: { target: 'route', actions: assign({ verified: true }) } } },
    proSetup: {},
    done: { type: 'final' }
  }
});
```

Why: the decision is defined once and reused by every path that reaches `route`. Always end the candidate list with an unguarded default so the machine cannot get stuck in a transient state.

### 18.7 Final-state composition: parallel sub-tasks feeding machine output

```ts
import { setup, assign, createActor, toPromise } from 'xstate';

export const checkoutFlow = setup({
  types: {
    context: {} as { address: string | null; cardLast4: string | null },
    events: {} as
      | { type: 'address.saved'; address: string }
      | { type: 'payment.saved'; last4: string }
      | { type: 'place' },
    output: {} as { address: string; cardLast4: string }
  }
}).createMachine({
  id: 'checkout',
  context: { address: null, cardLast4: null },
  initial: 'collecting',
  states: {
    collecting: {
      type: 'parallel',
      states: {
        shipping: {
          initial: 'editing',
          states: {
            editing: {
              on: {
                'address.saved': {
                  target: 'done',
                  actions: assign({ address: ({ event }) => event.address })
                }
              }
            },
            done: { type: 'final' }
          }
        },
        payment: {
          initial: 'editing',
          states: {
            editing: {
              on: {
                'payment.saved': {
                  target: 'done',
                  actions: assign({ cardLast4: ({ event }) => event.last4 })
                }
              }
            },
            done: { type: 'final' }
          }
        }
      },
      // parallel done event carries no output → results are already in context
      onDone: 'review'
    },
    review: { on: { place: 'placed' } },
    placed: { type: 'final' }
  },
  output: ({ context }) => ({ address: context.address!, cardLast4: context.cardLast4! })
});

const actor = createActor(checkoutFlow).start();
actor.send({ type: 'address.saved', address: '1 Main St' });
actor.send({ type: 'payment.saved', last4: '4242' });
actor.send({ type: 'place' });
const result = await toPromise(actor); // { address: '1 Main St', cardLast4: '4242' }
```

Why: each region owns its completion; the parent only cares that all regions finished. The same machine invoked by a parent delivers `result` as `event.output` in the parent's `invoke.onDone`.

---

## 19. Pitfalls: do / don't

| Don't | Why | Do |
|---|---|---|
| `target: 'self'` to restart an `after` timer, invoke, or entry action | v5 transitions are internal; the state is not re-entered | `target: 'self', reenter: true` |
| `target: 'parent'` on a parent's own `on` just to run actions | resets children to initial | omit `target` |
| Root/parallel-level transition targeting one region when others must keep state | the domain is the parallel node; all regions re-enter | define the transition inside the region (`'.child'`) |
| Use `xstate.route` for navigation inside a feature with live child actors | route transitions re-enter every active ancestor | use normal transitions; keep routes for top-level URL sync |
| Unguarded `always` with `assign` or reentering self | infinite loop; default `maxIterations` is `Infinity` (hang) | guard it so the guard becomes false; set `options.maxIterations` in dev |
| Waiting/matching on a state only reached via `always` | transient states are never emitted | assert on the settled state, use inspection, or `after: { 0: … }` |
| Expect a parallel state's `onDone` event to carry region outputs | it is `undefined` | write region results to `context` before reaching `final` |
| Put `output` on a top-level final and read `snapshot.output` | only root `output` sets machine output | root `output: ({ event }) => event.output` |
| `matches({ region: 'leaf' })` when `leaf` is nested deeper | matching is path-based from the root | full path, or a tag |
| `snapshot.value === 'x'` in nested machines | value is an object | `snapshot.matches('x')` / `hasTag` |
| Side effects, async, `Date.now()` in guards | guards run during `can()`, pure `transition()`, possibly repeatedly | compute facts into context/event; effects in actions |
| Bare key target on root `on` (`'b'`) | throws at creation | `'.b'` |
| Named delay missing from `delays` | event fires immediately | declare in `setup({ delays })` |
| `stateIn` everywhere to sync regions | hidden coupling; hard to visualize | shared events handled by both regions |
| Deep nesting by default | harder to read and target | start flat; add parents when transitions/behavior are shared |
| IDs on every state | unnecessary global names | IDs only for far targets, history nodes, routes, `getMeta` keys you read |
| Booleans in context for modes (`isLoading`, `isError`) | allows impossible combinations | finite states; tags for UI grouping |

---

## 20. Stale API (v4 → v5)

| v4 | v5 |
|---|---|
| `cond: 'x'` | `guard: 'x'` (dev build throws on `cond`) |
| `in: '#id'` | `guard: stateIn('#id')` |
| `internal: false` / implicit external transitions | `reenter: true`; default is internal |
| `on: { '': … }` (null event) | `always: …` (`''` key throws) |
| `strict: true` | `'*'` wildcard transition to catch unknown events |
| final `data` / `event.data` | final `output` / `event.output` |
| `done.state.<id>`, `done.invoke.<id>`, `error.platform.<id>` | `xstate.done.state.<id>`, `xstate.done.actor.<id>`, `xstate.error.actor.<id>` |
| `xstate.after(1000)#id` | `xstate.after.1000.<id>` |
| `state.meta` | `snapshot.getMeta()` |
| `state.done` | `snapshot.status === 'done'` |
| `state.nextEvents` | `getNextTransitions(snapshot)` (≥ 5.26) or `snapshot.can(event)` |
| `state.can('EVENT')` | `snapshot.can({ type: 'EVENT' })` |
| `state.toStrings()` | removed; use `matches` / `mapState` |
| `state.configuration` | `snapshot._nodes` (internal) |
| `state.history`, `onTransition` | `actor.subscribe()` |
| `machine.transition(state, event)` | `transition(machine, snapshot, event)` (≥ 5.19) |
| `createMachine(config, { guards, delays })` | still works; prefer `setup({ guards, delays }).createMachine(config)` |
| property mappers in `output` | function `({ context, event }) => …` |
| `raise('EVENT')` string | `raise({ type: 'EVENT' })` |
| delayed event ID derived from event type | pass `{ id }` explicitly to cancel a delayed `raise`/`sendTo` |

---

## 21. Where the docs disagree with the source

Verified against xstate 5.33.2 runtime:

- `transitions.mdx` says a parallel-node transition `target: '.mode.light'` leaves the other region unchanged. It actually re-enters all regions; the other region resets to its initial state.
- `routes.mdx` says routing in one parallel region does not affect other regions. It does: route transitions are root-level and re-enter every active state, including shared ancestors.
- `delayed-transitions.mdx` "dynamic delays" retries with `target: 'attempting'` and no `reenter`; the timer fires once. Add `reenter: true`.
- `states.mdx` says a machine without child states has value `null`; it is `{}`. It also shows a `meta` property on the snapshot; v5 snapshots have no `meta`, only `getMeta()`.
- `eventless-transitions.mdx` says XState guards against most infinite loops; the default `maxIterations` is `Infinity`, so loops hang unless you set `options.maxIterations`.
