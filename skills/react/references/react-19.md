# React 19 And 19.2

## Table Of Contents

- [Version Baseline](#version-baseline)
- [Upgrade From React 18](#upgrade-from-react-18)
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

At capture time, stable React and React DOM latest were `19.2.7`.

Use React 19.2 stable APIs only when the repository depends on React 19.2 or a compatible range. For older projects, prefer compatible patterns or an explicit migration step.

## Upgrade From React 18

Recommended migration path from React 18:

1. Upgrade to React 18.3 first when possible so deprecation warnings reveal future React 19 issues.
2. Ensure the new JSX transform is configured. React 19 relies on it for improvements and will warn if the old transform is used.
3. Upgrade packages together: `react`, `react-dom`, and relevant `@types/react` / `@types/react-dom` packages.
4. Run official codemods where appropriate. The React 19 migration recipe covers changes such as replacing legacy `ReactDOM.render`, string refs, old `act` imports, `useFormState`, and prop-types-to-TypeScript cleanup.
5. Run app-specific tests, build, SSR/hydration checks, and browser smoke tests.

Breaking/removal highlights:

- `ReactDOM.render` is replaced by `createRoot`.
- Server-rendered HTML should use `hydrateRoot`, not `createRoot`.
- `propTypes` and `defaultProps` for function components are removed as runtime features. Prefer TypeScript and default parameters.
- Legacy context APIs are removed.
- String refs are removed.
- `React.createFactory`, module pattern factories, shallow renderer from `react-dom/test-utils`, and most `react-dom/test-utils` exports are removed. Import `act` from `react`.
- Render errors are no longer re-thrown in the same way. Use `createRoot` and `hydrateRoot` error callback options for root-level reporting.

## Activity

`<Activity>` is a React 19.2 component for hiding and restoring UI while preserving internal state.

- `mode="visible"` shows children and mounts Effects.
- `mode="hidden"` visually hides children with `display: none`, destroys Effects, and defers hidden updates to a lower priority.
- Hidden Activity state is preserved and restored when visible again.
- Use it for preserving draft UI, pre-rendering hidden parts of the app, faster back navigation, or background UI that should not keep subscriptions alive while hidden.
- Do not use it as a replacement for authorization, data privacy, or removing content from the tree; hidden content can still exist conceptually and state is retained.

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
- Multiple ongoing Transitions may be batched together.

Use optimistic UI only when:

- The intended final result is predictable.
- Revert or error states are clear.
- The optimistic value does not leak privileged or unconfirmed data.

## Refs

React 19 supports `ref` as a prop for function components.

- Prefer accepting `ref` directly in React 19 app code when the project is fully on React 19.
- Keep `forwardRef` in public libraries or mixed React 18/19 surfaces unless compatibility is explicitly handled.
- Avoid direct `element.ref`; use `element.props.ref` if inspecting elements is unavoidable.

## Server Components

React Server Components render ahead of time in a separate server environment, either at build time or per request.

- Server Components can access server data sources without exposing them to the browser.
- Server Components are not sent to the browser and cannot use client-only interactive APIs such as `useState`.
- Add interactivity by composing Client Components with the `"use client"` directive.
- Async Server Components can `await` during render.
- Server Components can pass serializable data and JSX to Client Components.
- There is no `"use server"` directive for Server Components; `"use server"` is for Server Functions.

Use framework support for RSC unless the task explicitly involves framework or bundler implementation. The underlying RSC implementation APIs are not semver-stable across React 19.x minors.

## Server Functions

Server Functions let Client Components call async functions executed on the server.

- Define with the `"use server"` directive where the framework supports it.
- Functions can be passed from Server Components to Client Components or imported by Client Components depending on framework support.
- When used as a form action or called inside an Action, a Server Function is a Server Action.
- Since September 2024, docs distinguish Server Functions from Server Actions; not every Server Function is an Action.
- Arguments and return values crossing the client/server boundary must be serializable.
- With `useActionState`, React can replay form submissions made before hydration finishes.

Framework authors should pin exact React versions or use Canary for implementation APIs.

## React Compiler

React Compiler automatically memoizes eligible React code.

Use it when the project opts into Compiler or the user asks to configure it:

- Install `babel-plugin-react-compiler` as a dev dependency.
- React 19 works with the default target. React 17/18 need the compiler runtime package and target configuration.
- The compiler Babel plugin must run first so it can analyze original source.
- Vite with `@vitejs/plugin-react` 6+ can use `reactCompilerPreset` with `@rolldown/plugin-babel`.
- React Router can use `vite-plugin-babel`.
- Next.js, Expo, Rspack, Rsbuild, Metro, and other stacks should follow their framework docs.
- Install or update `eslint-plugin-react-hooks`; use the `recommended-latest` preset when available.
- Compiler ESLint violations mean the compiler skips optimizing that component or hook. It is safe to fix gradually.
- Verify with React DevTools memo indicators or build output imports from `react/compiler-runtime`.
- Use `"use no memo"` as a temporary opt-out only while fixing the underlying issue.

Do not add broad manual `useMemo`, `useCallback`, and `memo` around code that Compiler can handle unless there is a measured issue or identity contract.

## Canary And Experimental APIs

Stable app work should avoid canary and experimental APIs unless the dependency graph already uses those channels.

At capture time, `ViewTransition` and `addTransitionType` were canary/experimental. If a task involves them:

- Confirm package versions and release channel.
- Check browser support and reduced-motion behavior.
- Prefer framework-provided transition support when available.
- Do not manually call browser `startViewTransition` for React-managed transitions unless the docs and project architecture explicitly call for it.
