---
name: tanstack-table
description: "Build, review, debug, migrate, or plan TanStack Table v9 beta React tables with current docs. Use for @tanstack/react-table@beta, @tanstack/table-core@beta, useTable, tableFeatures, createTableHook, createColumnHelper, ColumnDef, table state, external atoms, sorting, filtering, faceting, grouping, aggregation, expanding, pagination, row selection, row and column pinning, column visibility, column ordering, column sizing, column resizing, virtualization, devtools, worker row models, and v8-to-v9 migrations."
---

# TanStack Table

Use this skill when work touches TanStack Table v9 beta, especially `@tanstack/react-table@beta`, table feature composition, complex data-grid behavior, or migration from v8 APIs.

## Workflow

1. Confirm the local version and target API before changing code:
   - `@tanstack/react-table`, `@tanstack/table-core`, optional devtools, optional `@tanstack/react-store`, optional `@tanstack/react-virtual`, and React version.
   - Whether the app is intentionally on v9 beta. The `latest` dist-tag is still v8; v9 requires the `@beta` tag.
   - Current table creation style: `useTable`, `createTableHook`, or temporary `useLegacyTable`.
   - Which features are registered in `tableFeatures()` and which row model factories are actually needed.
2. Refresh current docs for beta churn, migrations, new feature APIs, or package mismatches. Start from [source-map.md](references/source-map.md).
3. For installation, core setup, columns, rendering, and row models, use [setup-core.md](references/setup-core.md).
4. For v8-to-v9 migrations, `useLegacyTable`, state ownership, external atoms, selectors, and React Compiler concerns, use [state-and-migration.md](references/state-and-migration.md).
5. For sorting, filtering, faceting, pagination, selection, pinning, sizing, grouping, and expanding, use [features.md](references/features.md).
6. For server-side patterns, TanStack Query, virtualization, devtools, worker row models, performance, accessibility, and testing, use [production-patterns.md](references/production-patterns.md).

## Implementation Judgment

- Treat v9 as beta. Verify names and options before relying on memory, especially around row model slots, devtools, and experimental worker row models.
- Prefer `useTable` plus explicit `tableFeatures()` for one-off tables. Use `createTableHook` when multiple tables share features, defaults, or standardized components.
- Register only the features the table needs. The core row model is automatic; client-side filtering, sorting, grouping, expanding, faceting, and pagination need matching row model factories.
- Keep `data`, `columns`, and reusable column helpers stable across renders.
- Do not destructure methods from row, cell, column, or header instances. Call them on the instance.
- Use `table.FlexRender` or the v9 `FlexRender` component for cells and headers.
- Prefer external atoms for state that powers server queries, persistence, or cross-component UI. The classic `state` plus `onXChange` pattern remains useful for simple migration work.
- Use `manualSorting`, `manualFiltering`, `manualPagination`, and `manualGrouping` when the server already returns processed data. Keep all table operations consistent at the same data scope.
- Treat `useLegacyTable` as a temporary migration bridge only. It bundles all features, keeps full-state subscriptions, and does not support the main v9 composability benefits.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Table changes, include the relevant subset:

- Package/version check proving v9 beta APIs are available when used.
- Typecheck for feature registration, column definitions, state slices, and row model slots.
- Focused interaction tests for sorting, filtering, pagination, selection, expansion, pinning, resizing, and server-query integration.
- Browser smoke for rendered markup, keyboard/focus behavior, sticky or virtualized layouts, and resize/scroll performance.
- Production build or profiling pass for large tables, virtualization, or column resizing changes.
