# React DOM

## Table Of Contents

- [Choose The Integration Surface](#choose-the-integration-surface)
- [Client Roots](#client-roots)
- [Hydration](#hydration)
- [Root Error Callbacks](#root-error-callbacks)
- [Forms](#forms)
- [Server And Static Rendering](#server-and-static-rendering)
- [Resource Hints](#resource-hints)
- [Escape Hatches](#escape-hatches)
- [Testing](#testing)

## Choose The Integration Surface

Use framework APIs when a framework owns routing, data loading, SSR, static generation, Server Components, or hydration. Reach for direct React DOM APIs when:

- Building a client-only app root.
- Embedding React into a non-React page.
- Building framework infrastructure.
- Writing a focused test harness.
- Migrating legacy roots.

Do not mix framework hydration/root ownership with manual `createRoot` or `hydrateRoot` unless the framework docs explicitly permit it.

## Client Roots

`createRoot(domNode, options?)` creates a client React root.

Typical use:

```jsx
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);
```

Guidelines:

- Use `createRoot` for client-rendered containers.
- Use one root for most applications.
- Multiple roots are acceptable for progressively adding React to isolated parts of a non-React page.
- Call `root.unmount()` when an external system removes the container or the React subtree must release subscriptions and DOM resources.
- `root.render` is not a general synchronous DOM flush point. If code immediately after render must observe DOM updates, reconsider the design or use `flushSync` sparingly.
- If the container contains server-rendered or static React HTML, use `hydrateRoot`.

## Hydration

`hydrateRoot(domNode, reactNode, options?)` attaches React to existing server-rendered HTML.

Guidelines:

- The server and client initial render output must match. Treat mismatches as bugs.
- Use `hydrateRoot(document, <App />)` when the server rendered the whole document.
- Do not call `root.render` before hydration completes unless intentionally switching to client rendering and clearing server HTML.
- Use `identifierPrefix` consistently on server and client when multiple roots need stable `useId` values.
- Use `suppressHydrationWarning` only as a one-level escape hatch for unavoidable text/attribute differences.

Common mismatch causes:

- Extra whitespace around the root node.
- Conditional render branches like `typeof window !== 'undefined'` in render.
- Browser-only APIs or local storage reads during render.
- Time, randomness, locale, or data differences between server and client.
- Invalid HTML nesting repaired differently by the browser.

## Root Error Callbacks

React 19 root options can report different error classes:

- `onCaughtError`: an error was caught by an Error Boundary.
- `onUncaughtError`: an error was not caught by an Error Boundary.
- `onRecoverableError`: React recovered from an error, often during hydration.

Use these callbacks for root-level reporting. Keep app-level user messaging in Error Boundaries and route/framework error surfaces.

## Forms

React DOM form Actions integrate mutation flows with React state and pending UI.

`<form action={fn}>`:

- Calls `fn(formData)` on submit.
- Runs the function as an Action in a Transition.
- Does not require manual `preventDefault`.
- Resets uncontrolled fields after successful action completion.
- Uses POST semantics for function actions.
- Can call a Server Function when the framework supports `"use server"`.

Use `useFormStatus` from `react-dom`:

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}
```

Rules:

- `useFormStatus` must be in a component rendered inside the form.
- It tracks the nearest parent form, not a form rendered by the same component.
- It pairs naturally with `useActionState` and Server Functions for progressive enhancement.

Use hidden inputs or function binding for extra action arguments. Prefer binding when the extra value should not be visible in HTML.

## Server And Static Rendering

React DOM has separate APIs for streaming server rendering and static pre-rendering.

Server rendering APIs are for dynamic HTML generation:

- Node streams: `renderToPipeableStream`.
- Web streams: `renderToReadableStream`.
- Legacy string/static markup APIs exist but do not support all modern streaming patterns.

Static APIs are for SSG and partial pre-rendering workflows:

- Web streams: `prerender`.
- Node streams: `prerenderToNodeStream`.
- `prerender` waits for data before returning the prelude stream.
- It can return postponed data for resume workflows.
- Do not use static nonce values for scripts/styles; static nonces are insecure.

Prefer framework SSG/SSR primitives unless implementing infrastructure.

## Resource Hints

React DOM exposes resource hint APIs for careful performance work:

- `prefetchDNS`
- `preconnect`
- `preload`
- `preloadModule`
- `preinit`
- `preinitModule`

Use them when the app has measured network bottlenecks or framework integration requires explicit hints. Avoid speculative hints that waste bandwidth or compete with critical resources.

## Escape Hatches

- `createPortal` renders children into a different DOM node while keeping React ownership.
- `flushSync` forces React to flush updates synchronously. Use only for integration with imperative browser or third-party APIs that require the DOM to be updated before the next statement.
- `unstable_batchedUpdates` is usually unnecessary in modern React because automatic batching covers normal event and async flows.
- `findDOMNode` is legacy. Prefer refs.

## Testing

- Import `act` from `react`, not old `react-dom/test-utils` APIs.
- Prefer user-level testing utilities that wrap updates in `act`.
- Hydration, Suspense, form Actions, and Server Component boundaries need integration or browser-level verification, not only shallow component tests.
- When changing roots or hydration, verify console warnings and recoverable error reporting in development mode.
