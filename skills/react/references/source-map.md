# React Source Map

Snapshot date: 2026-09-18.

Use this file to orient future React work and decide when to refresh docs. React releases and canary APIs change; verify again for high-risk migrations or when the user explicitly asks for the latest state.

## Captured Latest Versions

- `react` npm `latest`: `19.3.0` (published 2026-09-09).
- `react-dom` npm `latest`: `19.3.0` (published 2026-09-09).
- `@types/react` / `@types/react-dom` npm `latest`: `19.3.0` (published 2026-09-09).
- Both `react` and `react-dom` had these npm tags at capture time:
  - `latest`: `19.3.0`
  - `backport`: `19.0.8`
  - `canary`: `19.3.0-canary-2b19aecd-20260916`
  - `experimental`: `0.0.0-experimental-2b19aecd-20260916`
  - `next`: `19.3.0-canary-d5736f09-20260507`
  - `rc`: `19.0.0-rc.1`
  - `beta`: `19.0.0-beta-26f2496093-20240514`

Related tooling at capture time (not React core):

- `babel-plugin-react-compiler` `latest`: `1.0.0`
- `react-compiler-runtime` `latest`: `1.0.0` (React 17/18 compiler target)
- `eslint-plugin-react-hooks` `latest`: `7.1.1`

The last 19.2 patch was `react@19.2.8` (2026-07-21). Default to stable `latest` (`19.3.0`) unless the repository already opts into canary or experimental.

`react-dom@19.3.0` peers `react@^19.3.0`. Install them together.

## Primary Docs Used

- Context7 selected library: `/websites/react_dev` (current react.dev; `/react/react` still listed `v19.2.7` as a versioned ID at capture time).
- Latest docs index: https://react.dev/llms.txt
- Versions page: https://react.dev/versions (latest documented major/minor: 19.3)
- API reference: https://react.dev/reference/react
- React 19.3 release notes: https://react.dev/blog/2026/09/09/react-19-3
- React 19.2 release notes: https://react.dev/blog/2025/10/01/react-19-2
- React 19 upgrade guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- Changelog: https://github.com/facebook/react/blob/main/CHANGELOG.md
- GitHub release: https://github.com/facebook/react/releases/tag/v19.3.0
- React Compiler: https://react.dev/learn/react-compiler
- React Compiler installation: https://react.dev/learn/react-compiler/installation
- Rules of React: https://react.dev/reference/rules
- Server Components: https://react.dev/reference/rsc/server-components
- Server Functions: https://react.dev/reference/rsc/server-functions
- `<ViewTransition>`: https://react.dev/reference/react/ViewTransition
- `addTransitionType`: https://react.dev/reference/react/addTransitionType
- `<Fragment>` / Fragment refs: https://react.dev/reference/react/Fragment
- `browser()`: https://react.dev/reference/react-dom/browser
- React DOM form: https://react.dev/reference/react-dom/components/form
- React DOM client APIs: https://react.dev/reference/react-dom/client
- React DOM server APIs: https://react.dev/reference/react-dom/server
- React DOM static APIs: https://react.dev/reference/react-dom/static

## Docs Navigation Notes

The current react.dev documentation is organized around:

- Learn React: quick start, setup, React Compiler, UI description, interactivity, state management, and escape hatches.
- React API: Hooks, components (`<Activity>`, `<ViewTransition>`, `<Fragment>`, `<Suspense>`), APIs (`addTransitionType`, `cache`, `cacheSignal`, `use`), directives, and rules.
- React DOM API: components, hooks, `browser`, client APIs, server APIs (including `onBrowserBailout`), static APIs, and resource preloading/preinitialization helpers.
- React Compiler: configuration, directives, gating, logging, panic threshold, target versions, troubleshooting, and library compilation.
- React Server Components: Server Components, Server Functions, and directives.

Stable APIs through React 19.3 include `use`, `useActionState`, `useOptimistic`, `useEffectEvent`, `<Activity>`, `<ViewTransition>`, `addTransitionType`, Fragment refs, `browser()`, `cache`, `cacheSignal`, `ref` as a prop, form Actions, and `react-dom` form/status integration.

## Release Channel Cautions

- React docs can include canary or experimental pages. Confirm the page banner and the repository dependency before using those APIs.
- `<ViewTransition>` and `addTransitionType` are **stable in React 19.3**. They were canary/experimental in 19.2 docs. Do not use them in apps still on `19.2.x`.
- `experimental_taintObjectReference` and `experimental_taintUniqueValue` remain experimental.
- React Server Components and Server Functions are stable for app usage in React 19, but the low-level bundler/framework implementation APIs do not follow semver across React 19.x minors. Framework authors should pin an exact React version or use Canary.
- The React docs at react.dev track the latest major docs. Previous major docs live on versioned hosts such as `18.react.dev`.

## Refresh Triggers

Refresh official docs before answering or implementing when:

- The user asks for latest/current behavior.
- The task targets canary, experimental, React Compiler, RSC internals, hydration, View Transitions, `browser()`, or migration behavior.
- The installed React version differs from `19.3.x`.
- A framework owns the integration surface, for example Next.js, Remix/React Router, Expo, Vite, Rspack, or React Native.
