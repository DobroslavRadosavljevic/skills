# React DOM

## Table Of Contents

- [Choose The Integration Surface](#choose-the-integration-surface)
- [Client Roots](#client-roots)
- [Hydration](#hydration)
- [Root Error Callbacks](#root-error-callbacks)
- [browser()](#browser)
- [Forms](#forms)
- [Trusted Types](#trusted-types)
- [Server And Static Rendering](#server-and-static-rendering)
- [Resource Hints](#resource-hints)
- [DOM Events And Attributes](#dom-events-and-attributes)
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
- 19.3 Strict Mode double-invokes Effects during hydration, matching client-rendered roots.

Common mismatch causes:

- Extra whitespace around the root node.
- Conditional render branches like `typeof window !== 'undefined'` in render.
- Browser-only APIs or local storage reads during render.
- Time, randomness, locale, or data differences between server and client.
- Invalid HTML nesting repaired differently by the browser.

On React 19.3, prefer `use(browser())` for Client Components that cannot produce matching HTML instead of branching on `window` during render.

## Root Error Callbacks

React 19 root options can report different error classes:

- `onCaughtError`: an error was caught by an Error Boundary.
- `onUncaughtError`: an error was not caught by an Error Boundary.
- `onRecoverableError`: React recovered from an error, often during hydration.

Use these callbacks for root-level reporting. Keep app-level user messaging in Error Boundaries and route/framework error surfaces.

`use(browser())` recoveries do **not** fire `onRecoverableError`. Report them with server `onBrowserBailout` instead.

## browser()

`browser()` is a React DOM **19.3** API. It returns an opaque value for `use`. During server rendering, `use(browser())` suspends and leaves the nearest `<Suspense>` fallback in the HTML. In the browser it returns `undefined` and does not suspend.

```jsx
import { Suspense, use } from 'react';
import { browser } from 'react-dom';

function SavedDraft() {
  use(browser('The draft is stored in localStorage.'));
  const [draft, setDraft] = useState(() => localStorage.getItem('draft') ?? '');
  return <textarea value={draft} onChange={...} />;
}

export default function App() {
  return (
    <Suspense fallback={<p>Loading draft...</p>}>
      <SavedDraft />
    </Suspense>
  );
}
```

Rules:

- Import `browser` from `react-dom`. Pass its return value to `use`. Calling `browser()` alone, or throwing it, does nothing useful.
- Must run in a Client Component (`"use client"` in RSC apps). Server Components cannot call it.
- Must be inside a `<Suspense>` boundary during server rendering. Without one, the server render fails.
- Like other `use` calls, it may sit behind a condition or early return.
- Optional `reason` is a string or a function. React calls a reason function only on the server. Returning `() => new Error(...)` gives `error.cause` a stack without allocating the Error in the browser. The reason is not serialized into HTML.

Use it for Client Components that cannot produce meaningful SSR HTML (localStorage, device timezone, browser-only queries without `initialData`). Prefer passing server/loader `initialData` and calling `use(browser())` only when that data is missing.

Server renderers (`renderToPipeableStream`, `renderToReadableStream`, and related APIs) accept `onBrowserBailout(error, errorInfo)`:

- Fires when React leaves a Suspense fallback for the browser instead of `onError` / `hydrateRoot` `onRecoverableError`.
- `error.cause` is the `reason` when one was passed.
- `errorInfo.componentStack` shows where the bailout occurred.

Abort pending server work for the browser without treating it as a crash:

```js
import { browser } from 'react-dom';
import { renderToPipeableStream } from 'react-dom/server';

const { pipe, abort } = renderToPipeableStream(<App />, {
  onShellReady() {
    pipe(response);
    setTimeout(() => {
      abort(browser('The server render timed out.'));
    }, 10000);
  },
  onBrowserBailout(error, errorInfo) {
    logBrowserBailout(error, errorInfo);
  },
});
```

Pass `browser()` as the reason to `AbortController.abort` when the renderer takes an `AbortSignal`.

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

19.3 form behavior:

- Automatic reset after a successful Action fires `onReset`.
- Submit events include `submitter`. React uses the `FormData` submitter parameter.
- Form status no longer resets incorrectly when unrelated component state updates.

## Trusted Types

React 19.3 integrates with the browser Trusted Types API. With `Content-Security-Policy: require-trusted-types-for 'script'`, injection sinks such as `innerHTML` must receive `TrustedHTML` / `TrustedScript` / `TrustedScriptURL` from a sanitizer policy, not raw strings.

Previously React coerced values with `'' + value`, which stripped Trusted Types objects back to strings the browser rejected. 19.3 passes those objects through so CSP policies work.

This is not an app-level API. Keep using a sanitizer that returns Trusted Types when the site enforces them. Do not string-concatenate values destined for `dangerouslySetInnerHTML` or similar sinks.

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
- It can return postponed data for resume workflows (`resume`, `resumeToPipeableStream`, `resumeAndPrerender`, `resumeAndPrerenderToNodeStream`).
- Do not use static nonce values for scripts/styles; static nonces are insecure.

19.3 server options of note:

- `onBrowserBailout` on server renderers (see [browser()](#browser)).
- `nonce` on rendered import maps.
- Aborting with `browser()` leaves pending Suspense fallbacks for the client without `onError`.

Prefer framework SSG/SSR primitives unless implementing infrastructure.

## Resource Hints

React DOM exposes resource hint APIs for careful performance work:

- `prefetchDNS`
- `preconnect`
- `preload`
- `preloadModule`
- `preinit`
- `preinitModule`

19.3: `preloadModule` forwards `nonce`; module resources support `fetchPriority`. Explicit stylesheet preloads are tracked so they do not suspend again unnecessarily.

Use them when the app has measured network bottlenecks or framework integration requires explicit hints. Avoid speculative hints that waste bandwidth or compete with critical resources.

## DOM Events And Attributes

19.3 React DOM additions that matter for markup and listeners:

- `onFullscreenChange` and `onFullscreenError`.
- SVG `maskType`.
- `credentialless` is a recognized boolean iframe attribute.
- `resize` event updates batch until the next frame.
- `defaultValue` for `type="number"` inputs matches other input types.
- Synthetic `toggle` events copy `source`.

## Escape Hatches

- `createPortal` renders children into a different DOM node while keeping React ownership. Portals inside a hidden `<Activity>` are hidden in 19.3.
- `flushSync` forces React to flush updates synchronously. Use only for integration with imperative browser or third-party APIs that require the DOM to be updated before the next statement. `flushSync` during a View Transition sequence skips the animation.
- `unstable_batchedUpdates` is usually unnecessary in modern React because automatic batching covers normal event and async flows.
- `findDOMNode` is legacy. Prefer refs.

## Testing

- Import `act` from `react`, not old `react-dom/test-utils` APIs.
- Prefer user-level testing utilities that wrap updates in `act`.
- Hydration, Suspense, form Actions, `browser()`, View Transitions, and Server Component boundaries need integration or browser-level verification, not only shallow component tests.
- When changing roots or hydration, verify console warnings and recoverable error reporting in development mode. Do not expect `onRecoverableError` for intentional `browser()` bailouts.
