# TanStack Table Source Map

Snapshot date: 2026-10-01.

## Current Package Evidence

v9 is stable. The `latest` dist-tag points at v9.2:

- `@tanstack/react-table@latest`: `9.2.4` (peer `react >=18`, depends on `@tanstack/react-store ^0.11.1`)
- `@tanstack/table-core@latest`: `9.2.4`
- `@tanstack/react-table-devtools@latest`: `9.2.0`
- `@tanstack/table-devtools@latest`: `9.2.0`
- `@tanstack/match-sorter-utils@latest`: `9.1.2`
- `@tanstack/react-table` dist-tags: `latest` is `9.2.4`; stale `beta` (`9.0.0-beta.80`) and `alpha` (`9.0.0-alpha.54`) tags remain but should not be installed
- Other v9 adapters at `9.2.4`: vue, solid, svelte, angular, lit, preact, plus new `alpine-table`, `ember-table`, and `octane-table` adapters. `@tanstack/qwik-table` is still v8 on `latest` (`8.21.3`).

Install without a dist-tag:

```sh
bun add @tanstack/react-table
```

`bun add @tanstack/react-table` installs stable v9. v9 APIs such as `useTable`, `tableFeatures`, `createTableHook`, feature slots, and external atoms are on the default package. Do not install `@beta` or `@alpha`; those tags point at pre-stable builds.

Changes since 9.0.0 (all non-breaking):

- 9.0.1: `legacyCreateColumnHelper` column defs accept built-in `filterFn`, `sortFn`, and `aggregationFn` names; devtools panel hotfix for standalone use.
- 9.1.0: `pageSize: Infinity` is supported (for "All" page-size options) and `table.getCanLastPage()` was added; `lastPage()` is guarded for unknown or non-finite page counts.
- 9.1.1: `getSortedRowModel().flatRows` lists parents before sub-rows again (v8 order).
- 9.1.2: state writes go through a shared `setStateSlice` util with structural no-op guards, which removes render loops where auto resets (for example `autoResetExpanded`) fired change handlers with equal-but-new values.
- 9.2.0 (devtools): table devtools support the latest `@tanstack/devtools` plugin theme props.
- 9.2.3 / 9.2.4: filtered, grouped, and worker row models emit parent-first `flatRows`; worker payload rebuilds skip missing core rows.

Previous skill snapshots: 2026-08-06 targeted `9.0.0`; 2026-07-08 targeted `@beta` at `9.0.0-beta.36` while `latest` was still v8 (`8.21.3`).

## Research Notes

- Official announcement: TanStack Table V9 became stable on 2026-08-04.
- Prefer Context7 (`/tanstack/table`) and official docs under `/table/latest/docs` for current APIs.
- Official docs and the TanStack `table` repository `main` branch were used as the primary source for v9 details.
- The 2026-10-01 refresh used package CHANGELOGs, GitHub releases, and `docs/` on `main` (pagination, React Compiler, table context, FlexRender guides).
- Package evidence was checked through `npm view` for `@tanstack/react-table`, `@tanstack/table-core`, and table/react-table-devtools.

## Official Docs

Core:

- Overview: `https://tanstack.com/table/latest/docs/overview`
- Installation: `https://tanstack.com/table/latest/docs/installation`
- Devtools: `https://tanstack.com/table/latest/docs/devtools`
- Tables: `https://tanstack.com/table/latest/docs/guide/tables`
- Data: `https://tanstack.com/table/latest/docs/guide/data`
- Column definitions: `https://tanstack.com/table/latest/docs/guide/column-defs`
- Columns: `https://tanstack.com/table/latest/docs/guide/columns`
- Headers: `https://tanstack.com/table/latest/docs/guide/headers`
- Header groups: `https://tanstack.com/table/latest/docs/guide/header-groups`
- Rows: `https://tanstack.com/table/latest/docs/guide/rows`
- Cells: `https://tanstack.com/table/latest/docs/guide/cells`
- Helpers: `https://tanstack.com/table/latest/docs/guide/helpers`
- Row models: `https://tanstack.com/table/latest/docs/guide/row-models`
- Table and column meta: `https://tanstack.com/table/latest/docs/guide/table-and-column-meta`
- Worker row models: `https://tanstack.com/table/latest/docs/guide/worker-row-models`
- Client-side vs server-side: `https://tanstack.com/table/latest/docs/guide/client-side-vs-server-side`
- Features: `https://tanstack.com/table/latest/docs/guide/features`
- Announcement: `https://tanstack.com/blog/announcing-tanstack-table-v9`

React:

- Quick start: `https://tanstack.com/table/latest/docs/framework/react/quick-start`
- Migration: `https://tanstack.com/table/latest/docs/framework/react/guide/migrating`
- Legacy table: `https://tanstack.com/table/latest/docs/framework/react/guide/use-legacy-table`
- React Compiler: `https://tanstack.com/table/latest/docs/framework/react/guide/react-compiler`
- Table context: `https://tanstack.com/table/latest/docs/framework/react/guide/table-context`
- FlexRender: `https://tanstack.com/table/latest/docs/framework/react/guide/flex-render`
- Table state: `https://tanstack.com/table/latest/docs/framework/react/guide/table-state`
- Composable tables: `https://tanstack.com/table/latest/docs/framework/react/guide/composable-tables`
- Sorting: `https://tanstack.com/table/latest/docs/framework/react/guide/sorting`
- Column filtering: `https://tanstack.com/table/latest/docs/framework/react/guide/column-filtering`
- Global filtering: `https://tanstack.com/table/latest/docs/framework/react/guide/global-filtering`
- Fuzzy filtering: `https://tanstack.com/table/latest/docs/framework/react/guide/fuzzy-filtering`
- Column faceting: `https://tanstack.com/table/latest/docs/framework/react/guide/column-faceting`
- Pagination: `https://tanstack.com/table/latest/docs/framework/react/guide/pagination`
- Row selection: `https://tanstack.com/table/latest/docs/framework/react/guide/row-selection`
- Cell selection: `https://tanstack.com/table/latest/docs/framework/react/guide/cell-selection`
- Cell spanning: `https://tanstack.com/table/latest/docs/framework/react/guide/cell-spanning`
- Row pinning: `https://tanstack.com/table/latest/docs/framework/react/guide/row-pinning`
- Column visibility: `https://tanstack.com/table/latest/docs/framework/react/guide/column-visibility`
- Column ordering: `https://tanstack.com/table/latest/docs/framework/react/guide/column-ordering`
- Column pinning: `https://tanstack.com/table/latest/docs/framework/react/guide/column-pinning`
- Column sizing: `https://tanstack.com/table/latest/docs/framework/react/guide/column-sizing`
- Column resizing: `https://tanstack.com/table/latest/docs/framework/react/guide/column-resizing`
- Grouping: `https://tanstack.com/table/latest/docs/framework/react/guide/grouping`
- Aggregation: `https://tanstack.com/table/latest/docs/framework/react/guide/aggregation`
- Expanding: `https://tanstack.com/table/latest/docs/framework/react/guide/expanding`
- Virtualization: `https://tanstack.com/table/latest/docs/framework/react/guide/virtualization`
- Custom features: `https://tanstack.com/table/latest/docs/framework/react/guide/custom-features`

## Raw Docs

The `main` branch raw source is useful when the website is slow or indexed poorly:

- `https://raw.githubusercontent.com/TanStack/table/main/docs/overview.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/installation.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/devtools.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/framework/react/quick-start.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/framework/react/guide/migrating.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/framework/react/guide/table-state.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/framework/react/guide/composable-tables.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/framework/react/guide/<guide-name>.md`
- `https://raw.githubusercontent.com/TanStack/table/main/docs/guide/<guide-name>.md`

## Refresh Triggers

Refresh docs before using this skill when:

- The `latest` dist-tag moves past `9.2.x` or a new major appears.
- The task mentions migration, cell selection, cell spanning, aggregation vs grouping, start/end pinning, devtools, worker row models, external atoms, or custom features.
- A local codebase uses `useReactTable`, `getCoreRowModel`, `/legacy`, `'use no memo'` around a table, or still installs `@beta`.
- Type errors mention feature maps, row model slots, `table.state`, atoms, or missing instance APIs.
- You are authoring new examples for public docs or reusable project templates.
