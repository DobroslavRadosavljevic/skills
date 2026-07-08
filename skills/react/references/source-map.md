# React Source Map

Snapshot date: 2026-07-08.

Use this file to orient future React work and decide when to refresh docs. React releases and canary APIs change; verify again for high-risk migrations or when the user explicitly asks for the latest state.

## Captured Latest Versions

- `react` npm `latest`: `19.2.7`.
- `react-dom` npm `latest`: `19.2.7`.
- Both packages had these npm tags at capture time:
  - `latest`: `19.2.7`
  - `backport`: `19.1.8`
  - `canary`: `19.3.0-canary-12a4baec-20260707`
  - `experimental`: `0.0.0-experimental-12a4baec-20260707`
  - `next`: `19.3.0-canary-d5736f09-20260507`
  - `rc`: `19.0.0-rc.1`
  - `beta`: `19.0.0-beta-26f2496093-20240514`

Default to stable `latest` unless the repository already opts into canary or experimental.

## Primary Docs Used

- Context7 selected library: `/react/react/v19.2.7`.
- Latest docs index: https://react.dev/llms.txt
- Versions page: https://react.dev/versions
- API reference: https://react.dev/reference/react
- React 19.2 release notes: https://react.dev/blog/2025/10/01/react-19-2
- React 19 upgrade guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- React Compiler: https://react.dev/learn/react-compiler
- React Compiler installation: https://react.dev/learn/react-compiler/installation
- Rules of React: https://react.dev/reference/rules
- Server Components: https://react.dev/reference/rsc/server-components
- Server Functions: https://react.dev/reference/rsc/server-functions
- React DOM form: https://react.dev/reference/react-dom/components/form
- React DOM client APIs: https://react.dev/reference/react-dom/client
- React DOM server APIs: https://react.dev/reference/react-dom/server
- React DOM static APIs: https://react.dev/reference/react-dom/static

## Docs Navigation Notes

The current react.dev documentation is organized around:

- Learn React: quick start, setup, React Compiler, UI description, interactivity, state management, and escape hatches.
- React API: Hooks, components, APIs, directives, and rules.
- React DOM API: components, hooks, client APIs, server APIs, static APIs, and resource preloading/preinitialization helpers.
- React Compiler: configuration, directives, gating, logging, panic threshold, target versions, troubleshooting, and library compilation.
- React Server Components: Server Components, Server Functions, and directives.

Important stable APIs in React 19/19.2 include `use`, `useActionState`, `useOptimistic`, `useEffectEvent`, `<Activity>`, `cache`, `cacheSignal`, `ref` as a prop, form Actions, and `react-dom` form/status integration.

## Release Channel Cautions

- React docs can include canary or experimental pages. Confirm the page banner and the repository dependency before using those APIs.
- `ViewTransition` and `addTransitionType` appeared in the docs as canary/experimental at capture time. Do not treat them as stable React 19.2 APIs unless the project uses the canary or experimental channel.
- React Server Components and Server Functions are stable for app usage in React 19, but the low-level bundler/framework implementation APIs do not follow semver across React 19.x minors. Framework authors should pin an exact React version or use Canary.
- The React docs at react.dev track the latest major docs. Previous major docs live on versioned hosts such as `18.react.dev`.

## Refresh Triggers

Refresh official docs before answering or implementing when:

- The user asks for latest/current behavior.
- The task targets canary, experimental, React Compiler, RSC internals, hydration, or migration behavior.
- The installed React version differs from `19.2.x`.
- A framework owns the integration surface, for example Next.js, Remix/React Router, Expo, Vite, Rspack, or React Native.
