# React 19 Through 19.3

## Table Of Contents

- [Version Baseline](#version-baseline)
- [Upgrade From React 18](#upgrade-from-react-18)
- [View Transitions](#view-transitions)
- [addTransitionType](#addtransitiontype)
- [Fragment Refs](#fragment-refs)
- [Activity](#activity)
- [useEffectEvent](#useeffectevent)
- [Actions And Forms](#actions-and-forms)
- [use](#use)
- [cache And cacheSignal](#cache-and-cachesignal)
- [Transitions And Optimistic UI](#transitions-and-optimistic-ui)
- [Refs](#refs)
- [Server Components](#server-components)
- [Server Functions](#server-functions)
- [React Compiler](#react-compiler)
- [Canary And Experimental APIs](#canary-and-experimental-apis)

## Version Baseline

At capture time, stable React and React DOM latest were `19.3.0`.

Use React 19.3 APIs only when the repository depends on React 19.3 or a compatible range. For 19.2 apps, keep `<Activity>`, `useEffectEvent`, and `cacheSignal`, and do not add `<ViewTransition>`, `addTransitionType`, Fragment refs, or `browser()`. For older projects, prefer compatible patterns or an explicit migration step.

19.3 ships the following as **stable**:

- `<ViewTransition>` and `addTransitionType`
- Fragment refs (`ref` on `<Fragment>`)
- `browser()` / `use(browser())` in `react-dom`
- Server Components rendering Context imported from a `"use client"` module
- Trusted Types pass-through (see [react-dom.md](react-dom.md))
- Independent Transition renders (a slow Transition no longer holds up unrelated ones)

## Upgrade From React 18

Recommended migration path from React 18:

1. Upgrade to React 18.3 first when possible so deprecation warnings reveal future React 19 issues.
2. Ensure the new JSX transform is configured. React 19 relies on it for improvements and will warn if the old transform is used.
3. Upgrade packages together: `react`, `react-dom`, and relevant `@types/react` / `@types/react-dom` packages.

```bash
bun add --exact react@19.3.0 react-dom@19.3.0
bun add --exact -d @types/react@19.3.0 @types/react-dom@19.3.0
```

4. Run official codemods where appropriate. The React 19 migration recipe covers changes such as replacing legacy `ReactDOM.render`, string refs, old `act` imports, `useFormState`, and prop-types-to-TypeScript cleanup:

```bash
bunx codemod@latest react/19/migration-recipe
bunx types-react-codemod@latest preset-19 ./path-to-your-react-ts-files
```

5. Run app-specific tests, build, SSR/hydration checks, and browser smoke tests.

Breaking/removal highlights:

- `ReactDOM.render` is replaced by `createRoot`.
- Server-rendered HTML should use `hydrateRoot`, not `createRoot`.
- `propTypes` and `defaultProps` for function components are removed as runtime features. Prefer TypeScript and default parameters.
- Legacy context APIs are removed.
- String refs are removed.
- `React.createFactory`, module pattern factories, shallow renderer from `react-dom/test-utils`, and most `react-dom/test-utils` exports are removed. Import `act` from `react`.
- Render errors are no longer re-thrown in the same way. Use `createRoot` and `hydrateRoot` error callback options for root-level reporting.

## View Transitions

`<ViewTransition>` is a React **19.3** component that animates enter, exit, move, and resize using the browser View Transition API. It is DOM-only; React Native support is not shipped.

```jsx
import { ViewTransition, startTransition } from 'react';

startTransition(() => {
  setShow(true);
});

{show && (
  <ViewTransition>
    <Page />
  </ViewTransition>
)}
```

Activation:

- Urgent `setState` does **not** animate.
- Updates inside `startTransition` / `useTransition`, a `<Suspense>` reveal, or `useDeferredValue` do animate.
- React calls `document.startViewTransition` itself. Do not call the browser API for React-managed updates; a competing View Transition is interrupted.
- `flushSync` during the View Transition sequence skips the animation.

Kinds of animation:

- `enter`: the `<ViewTransition>` is added (must be the first thing in its subtree, before any DOM node).
- `exit`: the `<ViewTransition>` is removed (same first-in-subtree rule).
- `update`: children change style/content, or the boundary resizes/moves because of an immediate sibling.
- `share`: a named `<ViewTransition>` is removed in one place and added in another in the same Transition.

Customize with View Transition Class props (`enter`, `exit`, `update`, `share`, `default`) using `"auto"`, `"none"`, a CSS class, or a map of transition types. `default="none"` turns off unlisted triggers. Style with `::view-transition-old(.class)`, `::view-transition-new(.class)`, and `::view-transition-group(.class)` — not ad-hoc `view-transition-name` selectors.

Assign `name` only for shared-element pairs. Names must be unique across the mounted tree. Leave `name` unset otherwise so React generates unique names.

Suspense:

- Wrapping `<Suspense>` in `<ViewTransition>` treats fallback → content as an **update**.
- Prefer `<ViewTransition update="auto" default="none">` so already-cached UI appears without animation and only the fallback-to-content swap animates.
- Images or fonts inside `<ViewTransition>` can opt into waiting (fonts wait up to 500ms) so they do not flicker in after the animation.

Events `onEnter`, `onExit`, `onShare`, and `onUpdate` receive an instance (`old`, `new`, `name`, `group`, `imagePair`) plus an array of transition types. Return a cleanup function (for example `() => anim.cancel()`). Only one event fires per boundary per Transition; `onShare` wins over enter/exit.

Pair with `<Activity>` to animate show/hide while preserving state:

```jsx
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <ViewTransition enter="auto" exit="auto">
    <Panel />
  </ViewTransition>
</Activity>
```

React does **not** honor `prefers-reduced-motion` automatically. Add `@media (prefers-reduced-motion)` CSS.

Popstate/back-button Transitions skip View Transition animations so scroll/form restoration can finish synchronously. Routers that use the Navigation API avoid that skip.

If another React View Transition is running, React waits, then batches intervening updates (A→B, then C and D while animating, continues as B→D).

## addTransitionType

`addTransitionType(type)` is a React **19.3** API. Call it inside `startTransition` to record why a Transition happened:

```jsx
import { addTransitionType, startTransition } from 'react';

startTransition(() => {
  addTransitionType('next');
  setSlide((c) => c + 1);
});
```

Then map types on `<ViewTransition>`:

```jsx
<ViewTransition
  enter={{ next: 'from-right', previous: 'from-left' }}
  exit={{ next: 'to-left', previous: 'to-right' }}
>
  <Page />
</ViewTransition>
```

Rules:

- Multiple types on one Transition are collected; combined Transitions merge types.
- Types reset after each commit. A Suspense fallback can see types from `startTransition`; revealing content later does not keep them.
- If several types match a class map, classes are joined. A `"none"` value disables that boundary.
- React also exposes types as browser view-transition types for CSS `:active-view-transition-type(...)`.
- Event callbacks receive the types array for imperative Web Animations.

## Fragment Refs

React **19.3** lets `<Fragment>` take a `ref`. Use the explicit import; `<>...</>` cannot take `ref` or `key`.

```jsx
import { Fragment, useRef, useLayoutEffect } from 'react';

function InView({ onChange, children }) {
  const fragmentRef = useRef(null);

  useLayoutEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      onChange(entries.some((e) => e.isIntersecting));
    });
    const inst = fragmentRef.current;
    inst.observeUsing(observer);
    return () => inst.unobserveUsing(observer);
  }, [onChange]);

  return <Fragment ref={fragmentRef}>{children}</Fragment>;
}
```

`FragmentInstance` methods:

- First-level host children: `addEventListener`, `removeEventListener`, `dispatchEvent`, `observeUsing`, `unobserveUsing`, `getClientRects`.
- Nested, depth-first: `focus`, `focusLast`; `blur` if the active element is inside the Fragment.
- Position/scroll: `getRootNode`, `compareDocumentPosition`, `scrollIntoView(alignToTop?)`.

`scrollIntoView` accepts only a boolean (`true`/omitted = first child to top, `false` = last child to bottom). Passing a `ScrollIntoViewOptions` object throws.

Listeners and observers apply to first-level DOM children, looking through component wrappers but not into nested DOM. `observeUsing` does not work on text-only Fragments (DEV warning). Listeners are not applied inside hidden `<Activity>` trees; they attach when the Activity becomes visible.

Each first-level DOM child of a referenced Fragment gets `element.reactFragments`: a `Set` of owning `FragmentInstance`s, useful for a shared `IntersectionObserver`.

Use Fragment refs when a group of siblings has no wrapper you can attach to, or when a child does not forward `ref`. Do not add a wrapper `<div>` only to hold a ref if layout would change.

## Activity

`<Activity>` is a React 19.2 component (still the current API in 19.3) for hiding and restoring UI while preserving internal state.

- `mode="visible"` (default) shows children and mounts Effects.
- `mode="hidden"` visually hides children with `display: none`, destroys Effects, and defers hidden updates to a lower priority.
- Hidden Activity state is preserved and restored when visible again.
- Use it for preserving draft UI, pre-rendering hidden parts of the app, faster back navigation, Selective Hydration, or background UI that should not keep subscriptions alive while hidden.
- Do not use it as a replacement for authorization, data privacy, or removing content from the tree; hidden content can still exist conceptually and state is retained.
- A hidden Activity that renders only text produces no DOM, because there is no host node to hide.

19.3 behavior around Activity:

- Hidden Activity hides portal contents, does not hoist document metadata, and does not let thrown errors escape into visible UI.
- `useSyncExternalStore` now sees store mutations that happened while the Activity was hidden.
- Flight/RSC can transport `<Activity>`.
- Visibility changes inside `startTransition` can drive a nested `<ViewTransition>` enter/exit.

Pause media/iframe side effects in `useLayoutEffect` cleanup; hiding does not destroy the DOM node.

## useEffectEvent

`useEffectEvent(callback)` creates an Effect Event for non-reactive logic called from an Effect.

Use it when:

- An Effect must react to one dependency, but logic inside it needs the latest value of another prop/state without re-synchronizing the Effect.
- You are tempted to suppress Effect dependencies only because part of the logic should be non-reactive.

Caveats:

- Call `useEffectEvent` at the top level of a component.
- Call the returned function only from Effects, layout Effects, insertion Effects, or other Effect Events.
- Do not pass Effect Events to children.
- Do not use Effect Events to hide genuinely reactive dependencies.
- The function identity is intentionally not stable for ordinary prop passing or memoization.
- 19.3: `useEffectEvent` reads latest values correctly inside `forwardRef` and `memo()` components.

## Actions And Forms

Actions are async transitions around mutations. React DOM integrates Actions with forms.

Use a function in `<form action={fn}>` when the submit behavior is a mutation that can be modeled as an Action:

- React passes `FormData` to the function.
- The function can be async.
- The action runs in a Transition.
- React handles the submit without manual `preventDefault`.
- If the Action succeeds, uncontrolled form fields reset automatically.
- A function action submits with POST semantics even if a `method` prop says otherwise.

Use `useActionState(action, initialState, permalink?)` when an Action needs state and pending status:

- Returns `[state, dispatchAction, isPending]`.
- The action receives previous state plus the submitted payload.
- Calls are queued sequentially.
- `dispatchAction` is stable.
- It should be passed to an action prop or called inside an Action/Transition.
- With Server Functions, state and payloads must be serializable.
- The optional `permalink` supports progressive enhancement before JavaScript loads.

Use `useFormStatus()` from `react-dom` inside a component rendered within a parent form:

- Returns form status such as `pending`, `data`, `method`, and `action`.
- Tracks only the parent form, not a form rendered by the same component and not nested child forms.

Use `useOptimistic(value, updateFn?)` for local optimistic UI during Actions:

- Returns `[optimisticState, addOptimistic]`.
- The optimistic update must be scheduled inside an Action, Transition, or action prop.
- The update reducer must be pure.
- Failed Actions revert to the real value unless the parent source value changed.

19.3 form DOM details (`onReset` after automatic reset, `submitter` on submit events) live in [react-dom.md](react-dom.md).

## use

`use` reads a Promise or Context during render.

- `use(promise)` suspends until the Promise resolves and returns the resolved value.
- `use(context)` reads Context and may be useful inside conditions or loops.
- Unlike ordinary Hooks, `use` may be called conditionally or in loops.
- `use` still must be called inside a component or Hook.
- Do not wrap `use(promise)` in `try/catch`; use an Error Boundary for rejections.
- Pass cached/stable Promises when possible to avoid repeated suspension.
- Client Components can use Promises passed from Server Components when resolved values are serializable.
- Reading Context with `use` is not a Server Component substitute for server data access.
- 19.3 DEV warns when a component appears to have been unblocked by calling `use()` conditionally.

`use(browser())` is a React DOM 19.3 pattern. See [react-dom.md](react-dom.md).

## cache And cacheSignal

`cache` memoizes async work in server rendering contexts supported by React.

`cacheSignal()` returns an `AbortSignal` associated with the lifetime of cached render work:

- It is currently for React Server Components.
- It returns an AbortSignal during rendering and `null` outside cached render scope.
- Use it to abort in-flight work that is no longer needed when React is done with the cached work.
- Do not assume it is always `null` on the client forever; docs note future client cache use.
- When a request is aborted, distinguish cancellation from real failures before logging or surfacing errors.

## Transitions And Optimistic UI

Use `startTransition(action)` to mark updates as non-urgent:

- Transition updates can be interrupted by urgent updates such as typing.
- Use `useTransition` when the UI needs a pending indicator.
- Updates after an `await` currently need another `startTransition` call to stay in the Transition.
- Transition updates cannot control text inputs.
- 19.3: Transitions render independently instead of being entangled into a single render. A slow Transition no longer holds up unrelated ones.

Use optimistic UI only when:

- The intended final result is predictable.
- Revert or error states are clear.
- The optimistic value does not leak privileged or unconfirmed data.

## Refs

React 19 supports `ref` as a prop for function components.

- Prefer accepting `ref` directly in React 19 app code when the project is fully on React 19.
- Keep `forwardRef` in public libraries or mixed React 18/19 surfaces unless compatibility is explicitly handled.
- Avoid direct `element.ref`; use `element.props.ref` if inspecting elements is unavoidable.

Fragment refs are 19.3-only; see [Fragment Refs](#fragment-refs).

## Server Components

React Server Components render ahead of time in a separate server environment, either at build time or per request.

- Server Components can access server data sources without exposing them to the browser.
- Server Components are not sent to the browser and cannot use client-only interactive APIs such as `useState`.
- Add interactivity by composing Client Components with the `"use client"` directive.
- Async Server Components can `await` during render.
- Server Components can pass serializable data and JSX to Client Components.
- There is no `"use server"` directive for Server Components; `"use server"` is for Server Functions.

React **19.3**: Server Components still cannot *create* Context, but they can *render* a Context imported from a `"use client"` module. A dedicated Provider wrapper is no longer required when the wrapper only forwarded `value` and `children`:

```jsx
// user-context.js
'use client';
import { createContext } from 'react';
export const UserContext = createContext(null);

// server-component.js
import { UserContext } from './user-context';

export async function Layout({ children }) {
  const currentUser = await getCurrentUser();
  return <UserContext value={currentUser}>{children}</UserContext>;
}
```

Client descendants read with `use` or `useContext`.

Use framework support for RSC unless the task explicitly involves framework or bundler implementation. The underlying RSC implementation APIs are not semver-stable across React 19.x minors.

## Server Functions

Server Functions let Client Components call async functions executed on the server.

- Define with the `"use server"` directive where the framework supports it.
- Functions can be passed from Server Components to Client Components or imported by Client Components depending on framework support.
- When used as a form action or called inside an Action, a Server Function is a Server Action.
- Since September 2024, docs distinguish Server Functions from Server Actions; not every Server Function is an Action.
- Arguments and return values crossing the client/server boundary must be serializable.
- With `useActionState`, React can replay form submissions made before hydration finishes.

19.3 Flight transports `Error.cause` and `AggregateError.errors` to the client.

Framework authors should pin exact React versions or use Canary for implementation APIs.

## React Compiler

React Compiler automatically memoizes eligible React code. The Babel plugin `latest` at capture time is `1.0.0`.

Use it when the project opts into Compiler or the user asks to configure it:

```bash
bun add -d babel-plugin-react-compiler@latest
bun add -d eslint-plugin-react-hooks@latest
```

- React 19 works with the default `target: '19'`. React 17/18 need `react-compiler-runtime` and `target: '17' | '18'`.
- The compiler Babel plugin must run first so it can analyze original source.
- Vite with `@vitejs/plugin-react` 6+ can use `reactCompilerPreset` with `@rolldown/plugin-babel`. Older plugin-react versions still pass `babel.plugins: ['babel-plugin-react-compiler']`.
- React Router can use `vite-plugin-babel`.
- Next.js, Expo, Rspack, Rsbuild, Metro, and other stacks should follow their framework docs.
- Compiler ESLint rules ship in `eslint-plugin-react-hooks` `recommended-latest`.
- Compiler ESLint violations mean the compiler skips optimizing that component or hook. It is safe to fix gradually.
- Verify with React DevTools "Memo ✨" badges or build output imports from `react/compiler-runtime`.
- Use `"use no memo"` as a temporary opt-out only while fixing the underlying issue.

Do not add broad manual `useMemo`, `useCallback`, and `memo` around code that Compiler can handle unless there is a measured issue or identity contract.

## Canary And Experimental APIs

Stable app work should avoid canary and experimental APIs unless the dependency graph already uses those channels.

Still experimental in the 19.3 docs:

- `experimental_taintObjectReference`
- `experimental_taintUniqueValue`

`<ViewTransition>` and `addTransitionType` are **not** experimental in 19.3.

If a task involves canary/experimental APIs:

- Confirm package versions and release channel.
- Check browser support and reduced-motion behavior.
- Prefer framework-provided integration when available.
- Do not treat post-19.3.0 `19.3.0-canary-*` tags as the stable latest.
