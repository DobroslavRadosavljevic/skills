# Core React Patterns

## Table Of Contents

- [Operating Checklist](#operating-checklist)
- [Components And JSX](#components-and-jsx)
- [Render Purity](#render-purity)
- [State](#state)
- [Effects](#effects)
- [Hooks](#hooks)
- [Context And External Stores](#context-and-external-stores)
- [Refs](#refs)
- [Performance](#performance)
- [Accessibility And Testing](#accessibility-and-testing)
- [Review Smells](#review-smells)

## Operating Checklist

Use this checklist before making React changes:

1. Identify the React version and framework.
2. Match local component, routing, data-fetching, styling, and test conventions.
3. Decide whether the code runs during render, in an event handler, in an Effect, on the server, or during hydration.
4. Keep state minimal and derive values during render when possible.
5. Keep dependencies honest instead of suppressing lint rules.
6. Verify with the smallest useful project command and a browser/story check for visible UI.

## Components And JSX

- Components are functions that return React nodes. Keep them deterministic for the same props, state, and context.
- Component names must be capitalized. Lowercase JSX tags map to DOM elements or custom elements.
- Use JSX expressions for values and children. Avoid building HTML strings unless an explicit sanitizer and `dangerouslySetInnerHTML` boundary already exist.
- Prefer composition and children over prop explosions when nested UI is owned by callers.
- Split components around responsibilities, not around every visual element. A component should usually own either behavior, layout, or a reusable semantic unit.
- Use keys for stable identity in lists. A key should identify the item, not the item's current index, unless the list is append-only and never reorders.
- Use keys intentionally to reset state when an entity changes, such as switching from one profile form to another user profile.

## Render Purity

React render code must be pure enough to run, pause, discard, replay, or double-invoke without externally visible consequences.

- Do not mutate props, state, context values, module-level caches, DOM, or external objects during render.
- Local mutation of freshly created values is fine, such as pushing into an array created in the same render.
- Do not call non-idempotent APIs like `new Date()` or `Math.random()` directly in rendering logic when the value is visible or semantically meaningful. Initialize state lazily or update in an Effect/event instead.
- Browser-only APIs such as `window`, `document`, local storage, media queries, and layout reads are not safe during SSR render. Use framework utilities, client boundaries, or Effects.
- Keep data normalization and pure calculations in render when they are cheap and derived from existing props/state.

## State

- Store only the minimal representation of changing UI state.
- Do not store a value that can be calculated from props or other state during render.
- Avoid duplicated state that can get out of sync. If a value is derived, derive it.
- Treat state as immutable snapshots. Replace arrays and objects instead of mutating them.
- Use functional state updates when the next value depends on the previous value.
- Prefer local state. Lift state only when another component genuinely needs to coordinate with it.
- Use `useReducer` when transitions are complex, related fields update together, or action names make the logic easier to test.
- Use form libraries or framework/server Actions when form state spans validation, pending state, optimistic updates, and server round trips.

## Effects

Effects are an escape hatch for synchronizing React with external systems.

Use an Effect for:

- Subscriptions, sockets, timers, observers, imperative widgets, media playback, manual DOM integration, analytics, browser APIs, and non-framework network synchronization.
- Cleanup that reverses setup, such as disconnecting, unsubscribing, aborting, or removing listeners.

Avoid an Effect for:

- Deriving render data from props/state.
- Handling a user event after the fact.
- Resetting all state on identity changes when a key can reset the subtree.
- Chaining internal state updates that could be handled in one reducer or event.
- Fetching data in a framework that already provides route loaders, Server Components, or mutations.

Dependency rules:

- Include every reactive value read by the Effect.
- To remove a dependency, change the code so the value is no longer reactive: move constants outside the component, move event-specific logic into an event handler, or use `useEffectEvent` for non-reactive logic that is called from an Effect.
- Do not disable the hooks dependency lint rule to quiet a design problem.
- Avoid object and function dependencies by moving construction inside the Effect, memoizing only when justified, or moving non-reactive code out.

## Hooks

- Call Hooks at the top level of a component or another Hook.
- Do not call ordinary Hooks in conditions, loops, callbacks, async functions, class components, module scope, or after early returns.
- `use` is special: it can read Promises or Context during render and may be called conditionally or in loops, but it still must be called inside a component or Hook.
- Keep custom Hooks focused on reusable behavior, not just a wrapper around a single `useState` unless it clarifies an API boundary.
- Name custom Hooks with `use` and return a stable, understandable API.
- Use `useLayoutEffect` only when a DOM read/write must happen before paint. Use `useEffect` for ordinary synchronization.
- Use `useInsertionEffect` only for CSS-in-JS insertion libraries.

## Context And External Stores

- Use Context for values that many descendants need, such as theme, locale, authenticated user, feature flags, or service clients.
- Avoid putting frequently changing large objects into broad Context providers unless consumers are intentionally re-rendered together.
- Split providers by update frequency and ownership.
- Prefer props for explicit local data flow.
- Use `useSyncExternalStore` for subscriptions to external stores so React can read a consistent snapshot across concurrent rendering and hydration.

## Refs

- Use refs for mutable values that should not trigger a render and for imperative DOM/component handles.
- Do not read or write refs during render except for safe lazy initialization patterns.
- In React 19, function components can receive `ref` as a prop. For public libraries or mixed-version code, check version support before removing `forwardRef`.
- Use `useImperativeHandle` to expose a small imperative API rather than the whole DOM node.

## Performance

- Start from correctness and measure before adding manual memoization.
- React Compiler can automatically memoize many calculations and component outputs. Do not scatter `memo`, `useMemo`, and `useCallback` just to silence re-render worries.
- Use `useMemo` for expensive pure calculations, stable object identity required by a dependency, or cases not covered by Compiler.
- Use `useCallback` when a stable function identity is part of an API contract or materially reduces work in memoized children.
- Use `memo` for expensive components with stable props or library boundaries, not for every component.
- Use `startTransition` or `useTransition` for non-urgent state updates that should not block input.
- Use `useDeferredValue` when a derived view can lag behind urgent input.
- Use `Suspense` for data/code boundaries only when the framework or data layer supports it correctly.

## Accessibility And Testing

- Prefer semantic HTML and accessible names over div/button imitations.
- Keep form labels, input names, validation messages, pending states, and error summaries explicit.
- Do not hide focus outlines unless replacing them with an accessible visible focus indicator.
- Test user-visible behavior through roles, labels, text, and stable product test IDs rather than implementation details.
- Wrap React updates in `act` when testing without a higher-level testing library that already does it.
- Verify hydration and SSR surfaces in a real browser when changing markup, roots, framework boundaries, or browser-only logic.

## Review Smells

- Effect used to derive state from props.
- Empty dependency array while reading props/state.
- Disabled hooks lint rule without a structural explanation.
- State object mutated and then set to the same reference.
- Index keys in reorderable lists.
- Browser globals in render for a server-rendered app.
- `useMemo` or `useCallback` around cheap logic with no identity contract.
- Suspense or Server Components added without framework support.
- Canary APIs introduced into a stable app.
