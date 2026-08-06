# TanStack Store Source Map

Snapshot date: 2026-08-06.

## Current Package Evidence

Npm evidence from this snapshot (`dist-tags.latest`):

- `@tanstack/store`: `0.11.1`
- `@tanstack/react-store`: `0.11.1`
- `@tanstack/solid-store`: `0.11.1`
- `@tanstack/vue-store`: `0.11.1`
- `@tanstack/angular-store`: `0.11.1`
- `@tanstack/svelte-store`: `0.12.1`
- `@tanstack/preact-store`: `0.13.2`
- `@tanstack/lit-store`: `0.14.1`
- `@tanstack/octane-store`: `0.12.2`

Package notes:

- `@tanstack/store@0.11.1` (2026-08-05) is a patch that inlines reactive flag constants in generated builds for better tree-shaking (`#350`). No public API changes from `0.11.0`.
- Adapter packages at this snapshot depend on `@tanstack/store@0.11.1`.
- `@tanstack/react-store` also depends on `use-sync-external-store@^1.6.0`.
- React peer range is React and ReactDOM `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`.
- The installation docs say the React adapter is currently ReactDOM-only, not React Native.
- Official site still labels Store as **alpha**; packages remain on the `0.x` line.
- No published `@tanstack/store-devtools` or `@tanstack/react-store-devtools` package was found during this snapshot.
- `@tanstack/store` still publishes a `beta` dist-tag (`0.0.1-beta.174`); prefer `latest` unless a project deliberately tracks beta.

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
- `_useStore` (experimental): `https://tanstack.com/store/latest/docs/framework/react/reference/functions/useStore`
- `useStore` (deprecated alias): `https://tanstack.com/store/latest/docs/framework/react/reference/functions/useStore-1`

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
- Octane: `https://tanstack.com/store/latest/docs/framework/octane/quick-start`

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
