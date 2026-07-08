# TanStack Store Source Map

Snapshot date: 2026-07-08.

## Current Package Evidence

Npm evidence from this snapshot:

- `@tanstack/store`: `0.11.0`
- `@tanstack/react-store`: `0.11.0`
- `@tanstack/solid-store`: `0.11.0`
- `@tanstack/vue-store`: `0.11.0`
- `@tanstack/angular-store`: `0.11.0`
- `@tanstack/svelte-store`: `0.12.0`
- `@tanstack/preact-store`: `0.13.1`
- `@tanstack/lit-store`: `0.14.0`

Package notes:

- `@tanstack/react-store` depends on `@tanstack/store@0.11.0` and `use-sync-external-store`.
- React peer range is React and ReactDOM `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`.
- The installation docs say the React adapter is currently ReactDOM-only, not React Native.
- No published `@tanstack/store-devtools` or `@tanstack/react-store-devtools` package was found during this snapshot.

Context7 resolved official TanStack Store docs:

- `/tanstack/store`: official repository docs, high reputation, stronger benchmark score during research.
- `/websites/tanstack_store`: official website docs, high reputation.

## Official Current Docs

Core:

- Overview: `https://tanstack.com/store/latest/docs/overview`
- Installation: `https://tanstack.com/store/latest/docs/installation`
- Core quick start: `https://tanstack.com/store/latest/docs/quick-start`
- API reference: `https://tanstack.com/store/latest/docs/reference`

React:

- React quick start: `https://tanstack.com/store/latest/docs/framework/react/quick-start`
- React API reference: `https://tanstack.com/store/latest/docs/framework/react/reference`
- `useSelector`: `https://tanstack.com/store/latest/docs/framework/react/reference/functions/useSelector`
- `useAtom`: `https://tanstack.com/store/latest/docs/framework/react/reference/functions/useAtom`
- `useCreateAtom`: `https://tanstack.com/store/latest/docs/framework/react/reference/functions/useCreateAtom`
- `useCreateStore`: `https://tanstack.com/store/latest/docs/framework/react/reference/functions/useCreateStore`
- `createStoreContext`: `https://tanstack.com/store/latest/docs/framework/react/reference/functions/createStoreContext`
- `useStore`: `https://tanstack.com/store/latest/docs/framework/react/reference/functions/useStore`

Core reference:

- `createStore`: `https://tanstack.com/store/latest/docs/reference/functions/createStore`
- `Store`: `https://tanstack.com/store/latest/docs/reference/classes/Store`
- `ReadonlyStore`: `https://tanstack.com/store/latest/docs/reference/classes/ReadonlyStore`
- `createAtom`: `https://tanstack.com/store/latest/docs/reference/functions/createAtom`
- `createAsyncAtom`: `https://tanstack.com/store/latest/docs/reference/functions/createAsyncAtom`
- `batch`: `https://tanstack.com/store/latest/docs/reference/functions/batch`
- `flush`: `https://tanstack.com/store/latest/docs/reference/functions/flush`
- `shallow`: `https://tanstack.com/store/latest/docs/reference/functions/shallow`
- `StoreActionsFactory`: `https://tanstack.com/store/latest/docs/reference/type-aliases/StoreActionsFactory`

Framework adapters:

- React: `https://tanstack.com/store/latest/docs/framework/react/quick-start`
- Preact: `https://tanstack.com/store/latest/docs/framework/preact/quick-start`
- Solid: `https://tanstack.com/store/latest/docs/framework/solid/quick-start`
- Vue: `https://tanstack.com/store/latest/docs/framework/vue/quick-start`
- Svelte: `https://tanstack.com/store/latest/docs/framework/svelte/quick-start`
- Angular: `https://tanstack.com/store/latest/docs/framework/angular/quick-start`
- Lit: `https://tanstack.com/store/latest/docs/framework/lit/quick-start`

## Raw Docs

Use GitHub raw docs when the website is hard to fetch:

- `https://raw.githubusercontent.com/TanStack/store/main/docs/overview.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/installation.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/quick-start.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/framework/react/quick-start.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/framework/react/reference/functions/<functionName>.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/framework/react/reference/interfaces/<InterfaceName>.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/reference/functions/<functionName>.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/reference/classes/<ClassName>.md`
- `https://raw.githubusercontent.com/TanStack/store/main/docs/reference/interfaces/<InterfaceName>.md`

Refresh this source map when package versions drift, when React docs rename hooks, when `useStore` deprecation status changes, or when devtools packages appear.
