# React And React Native Integration

## Table Of Contents

- Primary Read API
- Observer And React Compiler
- Local State And Context
- Fine-Grained Rendering
- Reactive Components
- Control Flow And Lists
- Effects And Lifecycle
- Suspense And SSR
- Tracing
- React Review Checklist

## Primary Read API

Use `useValue` from `@legendapp/state/react`:

```tsx
import { useValue } from '@legendapp/state/react'

function AccountName({ id }: { id: string }) {
  const name = useValue(accounts$[id].name)
  const selected = useValue(() => selectedId$.get() === id)

  return <span aria-current={selected}>{name}</span>
}
```

It accepts an observable or selector function, tracks every `get()` used by the selector, and re-renders only if the selector result changes.

`useSelector` and `use$` are current aliases but are migration APIs. Prefer `useValue` in new v3 code.

Use narrow reads. A whole-object `useValue(store$)` subscribes to the full object; a leaf read limits the render boundary.

## Observer And React Compiler

Current v3 guidance changed at beta.20:

- `useValue` is the primary React read API.
- `observer` is an optional optimization that can combine many observable reads into one internal hook.
- Direct `.get()` inside `observer` is discouraged and should be migrated.
- Automatic React tracking is deprecated and broken with React 19.

React Compiler can memoize ordinary function calls, which makes render-time `.get()` unsafe as a subscription mechanism. Hooks are treated differently, so `useValue` is the compiler-safe boundary.

```tsx
import { observer, useValue } from '@legendapp/state/react'

const Dashboard = observer(function Dashboard() {
  const name = useValue(user$.name)
  const theme = useValue(settings$.theme)
  const canEdit = useValue(() => permissions$.edit.get())

  return <DashboardView name={name} theme={theme} canEdit={canEdit} />
})
```

Do not add `observer` to every component automatically. Use it when conditional consumption or a large number of `useValue` calls makes the optimization useful, then verify render behavior.

## Local State And Context

Use `useObservable` for component-lifetime state:

```tsx
import { useObservable, useValue } from '@legendapp/state/react'

function Editor({ initialTitle }: { initialTitle: string }) {
  const draft$ = useObservable({ title: initialTitle, dirty: false })
  const title = useValue(draft$.title)

  return (
    <input
      value={title}
      onChange={(event) => {
        draft$.title.set(event.target.value)
        draft$.dirty.set(true)
      }}
    />
  )
}
```

A function passed to `useObservable` is reactive in v3. Use `peek()` inside it when a value should only seed initialization.

An observable is a stable Context value, so Context itself does not re-render consumers. Consumers must still use `useValue`, `Memo`, or another reactive boundary for the fields they display.

Choose lifetime deliberately:

- Module singleton: public application-wide state.
- Provider scoped: tenant, workspace, feature, or test-injected state.
- Component local: transient drafts and widget state.
- Request scoped: SSR user/session data.

Avoid module singletons for private request data on the server.

## Fine-Grained Rendering

`Memo` renders an observable or selector in a small self-updating boundary without re-rendering its parent:

```tsx
import { Memo } from '@legendapp/state/react'

function CounterLabel() {
  return <span>Count: <Memo>{count$}</Memo></span>
}
```

Use `Memo` when the parent is expensive or should remain render-once. A normal `useValue` read is simpler when parent rendering is cheap and conventional React composition is clearer.

Fine-grained components add React nodes. Do not split every prop into a reactive wrapper without measuring; the docs explicitly note the possible overhead.

## Reactive Components

For web DOM elements use `$React` from the web entrypoint:

```tsx
import { $React } from '@legendapp/state/react-web'

<$React.input
  $value={form$.name}
  $className={() => (form$.valid.get() ? 'valid' : 'invalid')}
/>
```

For React Native import reactive primitives from `@legendapp/state/react-native`, such as `$View`, `$Text`, and `$TextInput`.

Use `reactive(Component)` to add `$prop` selector inputs to a custom or third-party component. Use `reactiveObserver` only when the same component needs both reactive props and observer optimization. Use `reactiveComponents(namespace)` for a namespaced component family.

Reactive wrappers forward ordinary resolved props to the target. Test refs, event handlers, controlled inputs, styling, and third-party component assumptions.

## Control Flow And Lists

Legend-State offers small reactive boundaries:

- `Computed` and `Memo`: render a selector result.
- `Show`: conditional content with optional `else` and wrapper support.
- `Switch`: select a case from an observable value.
- `For`: render arrays, objects, or Maps using observable items.

```tsx
import { For, Show, useValue } from '@legendapp/state/react'

function TodoRow({ item$ }: { item$: Observable<Todo> }) {
  const title = useValue(item$.title)
  return <li>{title}</li>
}

function TodoList() {
  return (
    <Show if={() => todos$.length > 0} else={() => <p>No todos</p>}>
      {() => <For each={todos$} item={TodoRow} />}
    </Show>
  )
}
```

For arrays of objects:

- Provide stable `id` or `key` fields, or the documented custom key extractor.
- Let the row subscribe to its own item fields.
- If mapping manually, use `peek()` for the React key to avoid making the parent observe every item field.
- Use `For optimized` only after verifying animations, external DOM manipulation, and node reuse behavior.

The Babel plugin can transform inline children for `Computed`, `Memo`, and `Show`, but is optional. Confirm the project bundler and TypeScript reference before enabling it.

## Effects And Lifecycle

`useObserve` creates a reactive observer during render. `useObserveEffect` starts after mount.

Use `useObserveEffect` for DOM, network, telemetry, subscription, or other post-commit effects unless render-time execution is explicitly safe.

```tsx
import { useObserveEffect } from '@legendapp/state/react'

useObserveEffect(() => {
  document.title = `${profile$.name.get()} - Profile`
})
```

Use hook versions of readiness helpers (`useWhen`, `useWhenReady`) when lifecycle ownership belongs to the component. `useMount`, `useUnmount`, and `useEffectOnce` are conveniences; prefer the project's established React effect policy.

Strict Mode can invoke render paths more than once. Ensure effects and subscriptions are idempotent and covered by tests.

## Suspense And SSR

`useValue(selector, { suspense: true })` integrates promise-backed observables with React Suspense. The value suspends while unresolved or `undefined`.

Be careful when `undefined` is a valid resolved value. Model a distinct loaded state when necessary.

For SSR:

- Create user, session, and tenant observables per request.
- Seed server and client with equivalent initial values to avoid hydration drift.
- Do not activate browser persistence on the server.
- Keep synced reads lazy or explicitly preloaded according to the framework data-flow contract.
- Test concurrent requests for state leakage.

These are application-lifetime requirements; the React adapter cannot infer safe server ownership for you.

## Tracing

Development tracing APIs live at `@legendapp/state/trace`:

- `useTraceListeners(name?)`: list tracked observables.
- `useTraceUpdates(name?)`: show which observable caused a render.
- `useVerifyNotTracking(name?)`: fail loudly when a render-once component tracks state.
- `useVerifyOneRender(name?)`: fail loudly after a second render.

Also enable `enableReactTracking({ warnMissingUse: true })` during migration to find unwrapped render-time `.get()` calls.

Remove or gate noisy diagnostics before production.

## React Review Checklist

- Render reads use `useValue`, `Memo`, a reactive prop, or a control-flow boundary.
- Direct `.get()` is not used as the subscription mechanism inside `observer`.
- `observer` is applied for a measured or clear reason.
- Local and request-scoped observable lifetimes are correct.
- `useObserve` does not perform unsafe render-time effects.
- Reactive wrappers preserve accessibility, refs, controlled behavior, and events.
- Lists use stable identifiers and item-level subscriptions.
- Suspense distinguishes unresolved data from valid empty or undefined data.
- Strict Mode, SSR isolation, and hydration behavior are tested where relevant.
