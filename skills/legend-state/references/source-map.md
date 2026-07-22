# Source Map

## Version Boundary

This skill targets Legend-State v3. Re-check the channel before every version-sensitive task:

```sh
bun info @legendapp/state
```

Research snapshot on 2026-07-10:

- npm `latest`: `2.1.15`
- npm `beta`: `3.0.0-beta.47`
- v3 tag source commit: `31dac24a6e196c272b8968fff6a1debcc97c86a6`

Version 3 is therefore prerelease, even though the project recommends v3 for new projects. Never infer v3 from an unqualified install command. Inspect the lockfile and installed declarations.

## Primary Documentation

- [Introduction](https://legendapp.com/open-source/state/v3/intro/introduction/): v3 beta status and conceptual model.
- [Getting started](https://legendapp.com/open-source/state/v3/intro/getting-started/): installation and introductory store example.
- [Observable](https://legendapp.com/open-source/state/v3/usage/observable/): observable methods, computed and linked values, promises, arrays, and mutability.
- [Reactivity](https://legendapp.com/open-source/state/v3/usage/reactivity/): tracking, `observe`, `when`, `onChange`, and batching.
- [Configuring](https://legendapp.com/open-source/state/v3/usage/configuring/): optional observable syntax and React tracking warnings.
- [Helper functions](https://legendapp.com/open-source/state/v3/usage/helper-functions/): hints, deep merge, history, and undo/redo.
- [React API](https://legendapp.com/open-source/state/v3/react/react-api/): `useValue`, `observer`, hooks, context, Suspense, and lifecycle helpers.
- [Fine-grained reactivity](https://legendapp.com/open-source/state/v3/react/fine-grained-reactivity/): `Memo`, `$React`, React Native bindings, control flow, and reactive wrappers.
- [React helpers and hooks](https://legendapp.com/open-source/state/v3/react/helpers-and-hooks/): time, URL, hover, measure, and hook adapters.
- [Tracing](https://legendapp.com/open-source/state/v3/react/tracing/): listener and render diagnostics.
- [Performance](https://legendapp.com/open-source/state/v3/guides/performance/): batching, proxies, arrays, identifiers, and `For`.
- [Patterns](https://legendapp.com/open-source/state/v3/guides/patterns/): atoms, large stores, and local store organization.
- [Persist and sync](https://legendapp.com/open-source/state/v3/sync/persist-sync/): sync engine, persistence plugins, status, transforms, retries, and local-first flow.
- [CRUD plugin](https://legendapp.com/open-source/state/v3/sync/crud/): generic list/get/create/update/delete integration.
- [Fetch plugin](https://legendapp.com/open-source/state/v3/sync/fetch/): fetch-backed synced state.
- [TanStack Query plugin](https://legendapp.com/open-source/state/v3/sync/tanstack-query/): Query integration inside and outside React.
- [Supabase plugin](https://legendapp.com/open-source/state/v3/sync/supabase/): PostgreSQL/Supabase integration.
- [Keel plugin](https://legendapp.com/open-source/state/v3/sync/keel/): Keel integration.
- [Migrating](https://legendapp.com/open-source/state/v3/other/migrating/): beta-to-beta and v2-to-v3 changes.

## Package And Source Evidence

- [npm package](https://www.npmjs.com/package/@legendapp/state): published versions and dist-tags.
- [GitHub repository](https://github.com/LegendApp/legend-state): source, changelog, exports, and tests.
- [v3.0.0-beta.47 tag](https://github.com/LegendApp/legend-state/tree/v3.0.0-beta.47): exact source for the snapshot above.
- [Core exports](https://github.com/LegendApp/legend-state/blob/v3.0.0-beta.47/index.ts): public core API.
- [React exports](https://github.com/LegendApp/legend-state/blob/v3.0.0-beta.47/react.ts): public React API.
- [Sync exports](https://github.com/LegendApp/legend-state/blob/v3.0.0-beta.47/sync.ts): public sync API.
- [Package exports](https://github.com/LegendApp/legend-state/blob/v3.0.0-beta.47/package.json): supported subpath imports and peer dependencies.
- [React tests](https://github.com/LegendApp/legend-state/blob/v3.0.0-beta.47/tests/react.test.tsx): subscription, Strict Mode, Suspense, control-flow, reactive component, and tracing behavior.
- [Persistence tests](https://github.com/LegendApp/legend-state/blob/v3.0.0-beta.47/tests/persist.test.ts): pending writes, out-of-order completion, transforms, reset, multiple syncs, and status behavior.
- [CRUD tests](https://github.com/LegendApp/legend-state/blob/v3.0.0-beta.47/tests/crud.test.ts): object, Map, array, paging, update, delete, timestamps, and realtime behavior.

## Source Selection Rules

1. Prefer the v3 documentation for intended usage.
2. Verify exact exports and types against the installed package or matching git tag.
3. Use tests to resolve behavior that prose docs leave ambiguous.
4. Use changelog and migration docs before crossing beta versions.
5. Treat open issues as problem reports, not API contracts.
6. Do not copy v2 pages returned by search when the path contains `/state/v2/`.
