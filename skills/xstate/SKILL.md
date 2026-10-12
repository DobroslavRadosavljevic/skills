---
name: xstate
description: "Design, build, review, debug, test, migrate, or plan XState v5 (xstate 5.33) state machines, statecharts, and actor systems, plus all official Stately libraries. Use for setup(), createMachine, createActor, context/input/output, assign, raise, sendTo, emit, enqueueActions, guards, parallel/final/history states, always, after, invoke, spawnChild, fromPromise, fromCallback, actor system, waitFor, transition(), persistence, inspection (@statelyai/inspect), @xstate/react 6 (useActor, useActorRef, useSelector, createActorContext), @xstate/vue, svelte, solid, @xstate/store 4 and its adapters, xstate/graph model-based testing, Stately Studio, statelyai CLI/MCP, @statelyai/agent, v4-to-v5 migration, and the v6 alpha. Also use when modeling a complex UI or backend flow (wizard, auth, checkout, upload, websocket, workflow) as a state machine, or replacing boolean-flag state with finite states, even if XState is not named."
---

# XState

Use this skill for any work that touches XState, Stately tooling, or `@xstate/store`, and for designing explicit state machines in TypeScript apps. Target stable XState v5 (`xstate@5.33.x`) unless the repo pins something else.

## Workflow

1. Inspect the local setup before changing code:
   - Versions of `xstate`, `@xstate/react` (or `vue`/`svelte`/`solid`), `@xstate/store` and its adapter, `@statelyai/inspect`, TypeScript, and the framework.
   - Stale v4 signals: `interpret(`, `Machine(`, `cond:`, `services:`, `tsTypes`, `schema:`, `predictableActionArguments`, `send(` action creator, `withConfig`, `state.nextEvents`. If you find them, read [migration.md](references/migration.md) before editing.
   - Where machines live, how actors are created (module scope, component hook, context provider, per request), and how implementations are injected (`setup` vs `.provide`).
   - Existing tests, inspection setup, and persistence of snapshots.
2. Refresh versions and docs when behavior matters. Start from [source-map.md](references/source-map.md). When docs and package source disagree, trust the source and changelog.
3. Before you write a new machine, model it. Follow [modeling.md](references/modeling.md): list behaviors, find the finite states, events, hierarchy, parallel regions, then context, actions, and actors. Write the state list and event list down (in chat or in a code comment) before the code.
4. Route to the focused reference:

| Task | Read |
| --- | --- |
| Install, package map, `setup`, `createActor`, actor lifecycle, snapshot API, pure `transition` helpers | [setup-core.md](references/setup-core.md) |
| Types in `setup({ types })`, inference, type helpers, type errors | [typescript.md](references/typescript.md) |
| States, transitions, `always`, `after`, guards, history, final, parallel, tags, meta, execution order | [statecharts.md](references/statecharts.md) |
| Context, input, output, `assign`, `raise`, `sendTo`, `emit`, `enqueueActions`, action params | [actions-context.md](references/actions-context.md) |
| Actor logic creators, `invoke` vs `spawn`, actor system, `waitFor`, errors, actor architecture | [actors.md](references/actors.md) |
| Persisting and restoring actors, backend workflows, inspection and `@statelyai/inspect` | [persistence-inspection.md](references/persistence-inspection.md) |
| How to design a good machine, worked examples, anti-patterns, review checklist | [modeling.md](references/modeling.md) |
| React hooks, context, SSR, re-renders, error boundaries, React testing | [react.md](references/react.md) |
| Vue, Svelte, Solid, vanilla, Node, Angular | [other-frameworks.md](references/other-frameworks.md) |
| `@xstate/store`, atoms, store adapters, persist/undo/reset, store vs machine | [store.md](references/store.md) |
| Unit and actor tests, mocks with `.provide`, `xstate/graph` paths, model-based tests | [testing-graph.md](references/testing-graph.md) |
| Stately Studio, VS Code extension, CLI, MCP, SDK, ESLint plugin, `@statelyai/agent`, legacy packages | [tooling-ecosystem.md](references/tooling-ecosystem.md) |
| v4 → v5 upgrades, 5.x feature timeline, adapter majors, v6 alpha | [migration.md](references/migration.md) |

## Modeling Judgment

- Use a machine when behavior depends on mode: the same event must do different things (or nothing) depending on what happened before. For plain value storage use framework state or `@xstate/store`. For server data caching use the app's query library; let the machine own the flow around it.
- Finite states hold the *mode* (`idle`, `submitting`, `failed`). Context holds *data* (values, counts, errors, refs). If two booleans can be true at once when they never should be, replace them with states.
- Do not store what you can derive. Derive in selectors, `snapshot.matches`, `snapshot.hasTag`, or `snapshot.can(event)`.
- Put a transition on the deepest state where it is valid, and lift a transition to a parent only when every child handles it the same way. Root-level `on` handlers that should not fire in every state are a common bug source.
- Use parallel states only for truly independent regions. If one region constantly checks the other with `stateIn`, it is likely one region with more states.
- Model async work as actors (`invoke` with `fromPromise`/`fromCallback`), not as actions that fire promises. An invoked actor is cancelled when its state exits, which removes most race conditions.
- Always handle `onError` for invoked promises. An unhandled child error moves the parent (and up to the root) to `status: 'error'`. Since `@xstate/react` 6.1, `useActor` and `useSelector` throw that error into React error boundaries.
- Guard every `always` transition. `options.maxIterations` defaults to `Infinity`, so an unguarded `always` that changes context hangs the actor.
- Keep side effects out of `assign` and guards. Guards are pure checks; `assign` only computes the next context.
- Name actions, guards, actors, and delays in `setup()` and refer to them by string. This keeps the machine serializable, visual in Stately Studio, and easy to override in tests with `.provide()`.
- Prefer `setup({ types })` for typing. Typegen is a v4 tool and does not apply to v5.

## Implementation Judgment

- Build machines with `setup({...}).createMachine({...})`. Define `types` first, then named `actions`, `guards`, `actors`, `delays`.
- Use event objects with a `type` (`{ type: 'form.submit' }`). Use dot-namespaced event names so wildcards like `'form.*'` work.
- Use `assertEvent(event, 'type')` inside implementations that read event-specific fields when TypeScript cannot narrow the union.
- Pass external data through `input`. Input is read once at start; send events to sync values that change later.
- Use `enqueueActions` for conditional or multiple actions. `pure` and `choose` are gone in v5.
- To debounce with a delayed `raise` or `sendTo` plus an `id`, `cancel(id)` first. A new delayed event with the same id does not replace the pending one.
- A `sendTo` target function that returns `undefined` sends the event to the machine itself. Check that the target exists, especially with `system.get(...)`.
- Use `emit` and `actor.on(...)` to notify outside code. Do not reach into machine internals from UI callbacks.
- Use `systemId` and `system.get(id)` for actors that many parts of the system must reach; pass refs through `input` for local parent–child links.
- In React, read state with `useSelector` and a narrow selector, and create shared actors with `useActorRef` or `createActorContext`. Do not create actors during render or at module scope for per-user server state.
- Persist with `actor.getPersistedSnapshot()` and restore with `createActor(machine, { snapshot })`. Pending `after` timers are not persisted, and invoked actors restart on restore, so make restarted work idempotent. Version persisted shapes when the machine changes.
- Inspect while you debug: `createActor(machine, { inspect })` with `@statelyai/inspect` or a custom inspection observer.
- Do not use the v6 alpha in production code. Write v5 code that follows the patterns in [migration.md](references/migration.md) so the later upgrade stays small.

## Verification

Use the repo's existing checks first. For meaningful XState changes, run the relevant subset:

- Typecheck. XState v5 types need `strictNullChecks` (preferably `strict`) and a current TypeScript.
- Pure-logic tests with `initialTransition`/`transition` for transition tables, and actor tests with `createActor`, `waitFor`, and `.provide()` mocks for async flows.
- Path coverage with `xstate/graph` (`getShortestPaths`, `getSimplePaths`) for machines with many states.
- Component or E2E tests for UI flows the machine drives, in the repo's existing test setup.
- An inspection pass (`@statelyai/inspect` or `inspect` callback) for unexpected transitions, dropped events, or leaked actors.
- A review against the checklist at the end of [modeling.md](references/modeling.md).
