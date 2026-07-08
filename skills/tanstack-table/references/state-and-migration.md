# State And Migration

## v9 Migration Checklist

Use this when a codebase has v8 patterns such as `useReactTable`, `getCoreRowModel`, or `getSortedRowModel`.

1. Install v9 beta packages explicitly with `@beta`.
2. Replace `useReactTable` with `useTable`.
3. Add a required `features` option from `tableFeatures()`.
4. Move row model factories and function registries into `tableFeatures()`.
5. Replace `table.getState()` render reads with `table.state`, `table.store`, `table.atoms`, or a `useTable` selector.
6. Replace `onStateChange`; it is removed. Use individual `onXChange` callbacks, external atoms, or `table.store.subscribe`.
7. Update types to include `typeof features`, especially `ColumnDef<typeof features, TData>` and `createColumnHelper<typeof features, TData>()`.
8. Replace broad `flexRender` patterns with `table.FlexRender` or v9 `FlexRender` where appropriate.
9. Remove method destructuring from row, cell, column, and header instances.
10. Use `useLegacyTable` only as a temporary bridge if the migration must be staged.

## Key API Changes

| v8 pattern | v9 beta pattern |
| --- | --- |
| `useReactTable` | `useTable` |
| No required `features` option | `features: tableFeatures(...)` |
| `getCoreRowModel()` option | Core row model is automatic |
| `getFilteredRowModel()` option | `filteredRowModel: createFilteredRowModel()` in `tableFeatures()` |
| `getSortedRowModel()` option | `sortedRowModel: createSortedRowModel()` in `tableFeatures()` |
| `getPaginationRowModel()` option | `paginatedRowModel: createPaginatedRowModel()` in `tableFeatures()` |
| `filterFns`, `sortingFns`, `aggregationFns` on table options | `filterFns`, `sortFns`, `aggregationFns` slots in `tableFeatures()` |
| `table.getState()` | `table.state`, `table.store.state`, `table.atoms.<slice>.get()`, or selector |
| `onStateChange` | Individual `onXChange`, external atoms, or `table.store.subscribe` |
| Global meta declaration merging | Per-feature `metaHelper` preferred |

The v9 docs mention a beta.10 breaking change: row models and function registries moved into `features`, and row model factories no longer receive arguments.

## `useLegacyTable`

The legacy adapter lives under `@tanstack/react-table/legacy`:

```tsx
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  legacyCreateColumnHelper,
  useLegacyTable,
} from '@tanstack/react-table/legacy'
```

Use it only when a staged migration is necessary:

- It accepts v8-style table options while running on v9 internals.
- It is deprecated and temporary.
- It includes all features by default, so bundles are larger.
- It subscribes to full table state, so it misses v9 fine-grained subscription benefits.
- It cannot use `createTableHook`.
- Custom sorting code should account for the v9 `sortFn` naming, even if built-ins are adapted.

Preferred staged path:

1. Make the existing v8-style table compile under `useLegacyTable`.
2. Replace `useLegacyTable` with `useTable`.
3. Define a real `features` object.
4. Move row models and registries into `tableFeatures`.
5. Replace Legacy types with v9 types.

## State Surfaces

v9 state is backed by TanStack Store and signals.

- `table.state`: selected reactive state returned by `useTable`.
- `table.store`: readonly store for the full table state.
- `table.atoms.<slice>`: readonly per-slice atoms.
- `table.baseAtoms.<slice>`: internal writable atoms.
- `options.atoms`: external writable atoms you own.

Read patterns:

```tsx
table.state.sorting
table.store.state.sorting
table.atoms.sorting.get()
```

Use `table.state` or `table.Subscribe` in render code that should update. Use `table.atoms.<slice>.get()` for event handlers or snapshots that do not need a subscription.

## `useTable` Selector

The second `useTable` argument selects which table state should re-render the component that owns the table:

```tsx
const table = useTable(
  {
    features,
    columns,
    data,
  },
  (state) => ({
    sorting: state.sorting,
    pagination: state.pagination,
  }),
)
```

Use `useTable(options, () => null)` or a constant selector when the table owner should not re-render for table state changes. Then render subscribed islands with `table.Subscribe`.

```tsx
<table.Subscribe source={table.atoms.rowSelection}>
  {(rowSelection) => <SelectionSummary rowSelection={rowSelection} />}
</table.Subscribe>
```

React Compiler note: nested components that call builder methods such as `row.getIsSelected()`, `column.getIsPinned()`, or `header.column.getCanSort()` can go stale if they are not subscribed to the right source. Wrap reactive islands in `table.Subscribe` or the standalone `Subscribe` component from the adapter.

## External Atoms

External atoms are the preferred v9 ownership model when table state is needed outside the table, especially for server-side query keys, persistence, user preferences, or cross-component controls.

```tsx
import { useCreateAtom, useSelector } from '@tanstack/react-store'
import type { PaginationState, SortingState } from '@tanstack/react-table'

const sortingAtom = useCreateAtom<SortingState>([])
const paginationAtom = useCreateAtom<PaginationState>({
  pageIndex: 0,
  pageSize: 25,
})

const sorting = useSelector(sortingAtom)
const pagination = useSelector(paginationAtom)

const table = useTable({
  features,
  columns,
  data,
  atoms: {
    sorting: sortingAtom,
    pagination: paginationAtom,
  },
})
```

Precedence:

1. External atoms in `options.atoms`.
2. External values in `options.state`.
3. Internal base atoms initialized from `initialState`.

External atoms win over `state`. `table.reset()` resets internal base atoms, not external atoms. Reset external atoms yourself when needed.

## Classic Controlled State

The v8-style state pattern still works:

```tsx
const [sorting, setSorting] = useState<SortingState>([])

const table = useTable({
  features,
  columns,
  data,
  state: {
    sorting,
  },
  onSortingChange: setSorting,
})
```

This is convenient for simple migration work, but it is less fine-grained than external atoms. Do not provide the same slice in `initialState` and `state` unless the override is intentional.

## Initial State And Resets

- `initialState` applies only to state slices from registered features.
- Controlled values from `atoms` or `state` override `initialState`.
- `table.reset()` resets internal base atoms to `table.initialState`.
- `resetX(true)` usually resets the slice to the feature default or a blank/default value.
- External atoms are not cleared by table reset APIs.

## Composable Tables

Use `createTableHook` when multiple tables should share features, row models, defaults, or standardized rendering components.

```tsx
import {
  createSortedRowModel,
  createTableHook,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
})

const { useAppTable, createAppColumnHelper } = createTableHook({
  features,
  debugTable: true,
  enableSortingRemoval: false,
})

const columnHelper = createAppColumnHelper<Person>()

const table = useAppTable({
  key: 'people-table',
  columns,
  data,
})
```

Use the optional component registry only when the project benefits from standardized table, header, cell, or context components.
