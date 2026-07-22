# Setup And Core API

## Install

React v9 beta:

```sh
bun add @tanstack/react-table@beta
```

React adapter requirements:

- React 18 or newer.
- `@beta` dist-tag required while v9 is in beta.
- For framework-agnostic core work, use `@tanstack/table-core@beta`.

TanStack Table is headless. It supplies row models, state, APIs, and render helpers, not a styled table component. You own markup, styling, keyboard behavior, accessibility, loading states, empty states, and responsive layout.

## Minimal React Table

```tsx
import { tableFeatures, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

type Person = {
  firstName: string
  lastName: string
  age: number
}

const features = tableFeatures({})

const columns: Array<ColumnDef<typeof features, Person>> = [
  {
    accessorKey: 'firstName',
    header: 'First name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
]

function PeopleTable({ data }: { data: Person[] }) {
  const table = useTable({
    key: 'people-table',
    features,
    columns,
    data,
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getAllCells().map((cell) => (
              <td key={cell.id}>
                <table.FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

Notes:

- `features` is required in v9.
- The core row model is automatic.
- `key` is optional for normal rendering but required for devtools registration.
- Use `row.getVisibleCells()` instead of `row.getAllCells()` when column visibility is enabled.
- Header group APIs are already visibility-aware.

## Feature Registration

Features are opt-in. Register the feature object to get related table, row, column, cell, or header APIs. Add row model factories only when the table should process that stage client-side.

```tsx
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
})

const table = useTable({
  features,
  columns,
  data,
})
```

Common mapping from v8-style row model options to v9 feature slots:

| Client-side processing | Feature slot |
| --- | --- |
| Core rows | Automatic |
| Filtering | `filteredRowModel: createFilteredRowModel()` |
| Sorting | `sortedRowModel: createSortedRowModel()` |
| Pagination | `paginatedRowModel: createPaginatedRowModel()` |
| Expanding | `expandedRowModel: createExpandedRowModel()` |
| Grouping | `groupedRowModel: createGroupedRowModel()` |
| Faceted rows | `facetedRowModel: createFacetedRowModel()` |
| Faceted min/max | `facetedMinMaxValues: createFacetedMinMaxValues()` |
| Faceted unique values | `facetedUniqueValues: createFacetedUniqueValues()` |

Row model execution order:

```txt
core -> filtered -> grouped -> sorted -> expanded -> paginated -> final row model
```

Manual server-side options skip the matching processing stage and use the pre-stage row model.

## Columns

Column definition types include the feature set:

```tsx
import { createColumnHelper, tableFeatures } from '@tanstack/react-table'

type Person = {
  firstName: string
  lastName: string
  age: number
  status: 'single' | 'relationship' | 'complicated'
}

const features = tableFeatures({})
const columnHelper = createColumnHelper<typeof features, Person>()

const columns = columnHelper.columns([
  columnHelper.accessor('firstName', {
    header: 'First name',
  }),
  columnHelper.accessor((row) => row.lastName, {
    id: 'lastName',
    header: 'Last name',
  }),
  columnHelper.accessor('age', {
    header: 'Age',
  }),
])
```

Column categories:

- Accessor columns read data and can participate in sorting, filtering, grouping, and aggregation.
- Display columns render UI such as actions, selection checkboxes, or expand toggles.
- Grouping columns organize nested headers.

Accessor patterns:

- Object key: `accessorKey: 'firstName'`
- Deep key: `accessorKey: 'name.first'`
- Array index string: `accessorKey: '0'`
- Accessor function: `accessorFn: (row) => row.firstName`

Accessor functions need a unique `id` or a string header. Accessed values are used by sorting, filtering, grouping, and aggregation; return primitives unless custom functions handle the value shape.

## Function Registries

Feature function registries make string references type-safe:

```tsx
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    ...sortFns,
    byLastSeen,
  },
})

const columns = columnHelper.columns([
  columnHelper.accessor('lastSeenAt', {
    header: 'Last seen',
    sortFn: 'byLastSeen',
  }),
])
```

Equivalent registries:

- Sorting: `sortFns`
- Filtering: `filterFns`
- Grouping and aggregation: `aggregationFns`

## Dynamic Columns

For dynamic records:

- Infer column IDs from a representative sample or server schema.
- Memoize generated columns by schema, not by every render.
- Choose sensible defaults by value type: text filters for strings, range filters for numbers, date sorting for dates.
- Use column `meta` for renderer and filter variants rather than spreading UI concerns across table code.

## Meta

Use table and column meta for app-owned context:

```tsx
table.options.meta?.updateData(rowIndex, columnId, value)
column.columnDef.meta?.filterVariant
```

In v9, prefer per-feature-set typing with `metaHelper`:

```tsx
import { metaHelper, tableFeatures } from '@tanstack/react-table'

interface TableMeta {
  updateData: (rowIndex: number, columnId: string, value: unknown) => void
}

interface ColumnMeta {
  filterVariant?: 'text' | 'range' | 'select'
}

const features = tableFeatures({
  tableMeta: metaHelper<TableMeta>(),
  columnMeta: metaHelper<ColumnMeta>(),
})
```

## Rendering Details

- Render headers from `table.getHeaderGroups()`.
- Use `header.colSpan` and skip `header.isPlaceholder`.
- Render rows from `table.getRowModel().rows`.
- Render cells from `row.getVisibleCells()` when visibility is enabled.
- Use `cell.getValue()` for the current column and `cell.row.getValue('columnId')` for another column.
- Use `cell.row.original` when the raw source object is needed.
- Avoid destructuring row, cell, column, or header methods. Instance methods depend on their instance receiver.
