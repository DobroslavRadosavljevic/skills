# TanStack Table Source Map

Snapshot date: 2026-07-08.

## Current Package Evidence

Use the beta dist-tag for v9:

- `@tanstack/react-table@beta`: `9.0.0-beta.36`
- `@tanstack/table-core@beta`: `9.0.0-beta.36`
- `@tanstack/react-table` dist-tags: `latest` is `8.21.3`, `alpha` is `9.0.0-alpha.54`, `beta` is `9.0.0-beta.36`

Important: `npm install @tanstack/react-table` installs stable v8. v9 beta APIs such as `useTable`, `tableFeatures`, `createTableHook`, feature slots, and external atoms require the `@beta` tag.

## Research Notes

- Context7 selected official TanStack Table docs, but general "latest" snippets can still reflect stable v8 APIs. Use beta docs for v9 beta work.
- Official beta docs and the TanStack `table` repository beta branch were used as the primary source for v9 details.
- Exa search surfaced the beta docs paths under `https://tanstack.com/table/beta/docs`.
- Package evidence was checked through npm.

## Official Beta Docs

Core:

- Overview: `https://tanstack.com/table/beta/docs/overview`
- Installation: `https://tanstack.com/table/beta/docs/installation`
- Devtools: `https://tanstack.com/table/beta/docs/devtools`
- Tables: `https://tanstack.com/table/beta/docs/guide/tables`
- Data: `https://tanstack.com/table/beta/docs/guide/data`
- Column definitions: `https://tanstack.com/table/beta/docs/guide/column-defs`
- Columns: `https://tanstack.com/table/beta/docs/guide/columns`
- Headers: `https://tanstack.com/table/beta/docs/guide/headers`
- Header groups: `https://tanstack.com/table/beta/docs/guide/header-groups`
- Rows: `https://tanstack.com/table/beta/docs/guide/rows`
- Cells: `https://tanstack.com/table/beta/docs/guide/cells`
- Helpers: `https://tanstack.com/table/beta/docs/guide/helpers`
- Row models: `https://tanstack.com/table/beta/docs/guide/row-models`
- Table and column meta: `https://tanstack.com/table/beta/docs/guide/table-and-column-meta`
- Worker row models: `https://tanstack.com/table/beta/docs/guide/worker-row-models`

React:

- Quick start: `https://tanstack.com/table/beta/docs/framework/react/quick-start`
- Migration: `https://tanstack.com/table/beta/docs/framework/react/guide/migrating`
- Legacy table: `https://tanstack.com/table/beta/docs/framework/react/guide/use-legacy-table`
- Table state: `https://tanstack.com/table/beta/docs/framework/react/guide/table-state`
- Composable tables: `https://tanstack.com/table/beta/docs/framework/react/guide/composable-tables`
- Sorting: `https://tanstack.com/table/beta/docs/framework/react/guide/sorting`
- Column filtering: `https://tanstack.com/table/beta/docs/framework/react/guide/column-filtering`
- Global filtering: `https://tanstack.com/table/beta/docs/framework/react/guide/global-filtering`
- Fuzzy filtering: `https://tanstack.com/table/beta/docs/framework/react/guide/fuzzy-filtering`
- Column faceting: `https://tanstack.com/table/beta/docs/framework/react/guide/column-faceting`
- Pagination: `https://tanstack.com/table/beta/docs/framework/react/guide/pagination`
- Row selection: `https://tanstack.com/table/beta/docs/framework/react/guide/row-selection`
- Row pinning: `https://tanstack.com/table/beta/docs/framework/react/guide/row-pinning`
- Column visibility: `https://tanstack.com/table/beta/docs/framework/react/guide/column-visibility`
- Column ordering: `https://tanstack.com/table/beta/docs/framework/react/guide/column-ordering`
- Column pinning: `https://tanstack.com/table/beta/docs/framework/react/guide/column-pinning`
- Column sizing: `https://tanstack.com/table/beta/docs/framework/react/guide/column-sizing`
- Column resizing: `https://tanstack.com/table/beta/docs/framework/react/guide/column-resizing`
- Grouping: `https://tanstack.com/table/beta/docs/framework/react/guide/grouping`
- Expanding: `https://tanstack.com/table/beta/docs/framework/react/guide/expanding`
- Virtualization: `https://tanstack.com/table/beta/docs/framework/react/guide/virtualization`
- Custom features: `https://tanstack.com/table/beta/docs/framework/react/guide/custom-features`

## Raw Docs

The beta branch raw source is useful when the website is slow or indexed poorly:

- `https://raw.githubusercontent.com/TanStack/table/beta/docs/overview.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/installation.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/devtools.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/framework/react/quick-start.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/framework/react/guide/migrating.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/framework/react/guide/table-state.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/framework/react/guide/composable-tables.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/framework/react/guide/<guide-name>.md`
- `https://raw.githubusercontent.com/TanStack/table/beta/docs/guide/<guide-name>.md`

## Refresh Triggers

Refresh docs before using this skill when:

- v9 beta version changes or the package exits beta.
- The task mentions migration, devtools, worker row models, external atoms, or custom features.
- A local codebase uses `useReactTable`, `getCoreRowModel`, or `/legacy`.
- Type errors mention feature maps, row model slots, `table.state`, atoms, or missing instance APIs.
- You are authoring new examples for public docs or reusable project templates.
