# Production Patterns

## Server-Side Data With Query Keys

For server-side pagination, sorting, or filtering:

1. Register the state feature APIs you need.
2. Do not register the client-side row model factory for stages the server owns.
3. Set the matching `manual*` option.
4. Own query-relevant state with external atoms.
5. Feed the returned page rows into `data` and the returned totals into `rowCount` or `pageCount`.

```tsx
import { useCreateAtom, useSelector } from '@tanstack/react-store'
import {
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
})

const sortingAtom = useCreateAtom<SortingState>([])
const paginationAtom = useCreateAtom<PaginationState>({
  pageIndex: 0,
  pageSize: 25,
})

const sorting = useSelector(sortingAtom)
const pagination = useSelector(paginationAtom)

const query = useQuery({
  queryKey: ['people', sorting, pagination],
  queryFn: () => fetchPeople({ sorting, pagination }),
})

const table = useTable({
  features,
  columns,
  data: query.data?.rows ?? [],
  manualSorting: true,
  manualPagination: true,
  rowCount: query.data?.rowCount ?? 0,
  atoms: {
    sorting: sortingAtom,
    pagination: paginationAtom,
  },
})
```

Keep operations consistent:

- Server pagination plus client sorting sorts only the current page.
- Server filtering plus client faceting only facets currently loaded rows unless you provide server facet values.
- Infinite scrolling plus server sorting should reset the loaded dataset and scroll to top when sorting changes.

## Client-Side Scale

TanStack Table can handle thousands of rows client-side, and the beta docs cite examples tested at much higher counts. Do not assume server-side processing is required for a few thousand rows. Check:

- Query cost and total payload size.
- Number of columns and cell renderer cost.
- Browser memory pressure.
- Need for offline/local-first data.
- User expectation for instant local filtering or sorting.

Use server-side operations when the full dataset is too large to load, data access must be authorized per query, or filtering/sorting semantics must match backend indexes.

## Virtualization

Virtualization is not a TanStack Table feature and does not need a `tableFeatures()` entry. Use `@tanstack/react-virtual` or another virtualizer.

Install:

```sh
npm install @tanstack/react-virtual
```

Basic row virtualization pattern:

```tsx
const rows = table.getRowModel().rows

const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 33,
  overscan: 5,
})
```

Render `rowVirtualizer.getVirtualItems()`, map `virtualRow.index` back to `rows[virtualRow.index]`, and preserve full scroll geometry with the virtualizer total size.

Column virtualization pattern:

```tsx
const visibleColumns = table.getVisibleLeafColumns()

const columnVirtualizer = useVirtualizer({
  count: visibleColumns.length,
  estimateSize: (index) => visibleColumns[index].getSize(),
  getScrollElement: () => tableContainerRef.current,
  horizontal: true,
  overscan: 3,
})
```

For horizontal virtualization, official examples use left and right spacer cells rather than absolutely positioning columns. Always map virtual indexes against the current visible columns after sorting, filtering, pagination, grouping, and visibility changes.

Common pitfalls:

- No fixed-height scroll container.
- Rendering all rows instead of virtual items.
- Using stale row or column arrays after table state changes.
- Forgetting left and right spacer cells for horizontal virtualization.
- Using dynamic measurement for fixed-height rows.
- Expecting TanStack Table to ship virtualization APIs.
- Mixing client virtualization with server-side sorting/filtering inconsistently.

Use the experimental React virtualization examples only after profiling shows React render work during scroll is the bottleneck. Keep imperative DOM updates scoped to scroll-position styles, not table data or business state.

## Column Resizing Performance

For large React tables, `columnResizeMode: 'onEnd'` is the safest default.

If immediate resizing is needed:

- Avoid subscribing the whole table owner to resize state.
- Use a constant `useTable` selector for the table owner when appropriate.
- Subscribe imperatively to `table.atoms.columnSizing`.
- Write column widths to CSS variables on the table element.
- Let cells read widths from CSS variables.
- Use `table.Subscribe` only for small reactive islands such as active resize handles.

The beta docs describe this as replacing the older "memoize the body while resizing" strategy.

## Devtools

Install beta table devtools explicitly:

```sh
npm install @tanstack/react-devtools @tanstack/react-table-devtools@beta
```

React setup:

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  tableDevtoolsPlugin,
  useTanStackTableDevtools,
} from '@tanstack/react-table-devtools'

function App() {
  const table = useTable({
    key: 'users-table',
    features,
    columns,
    data,
  })

  useTanStackTableDevtools(table)

  return <UsersTable table={table} />
}

function Root() {
  return (
    <>
      <App />
      <TanStackDevtools plugins={[tableDevtoolsPlugin()]} />
    </>
  )
}
```

Devtools require a unique table `key`. In production builds, framework adapters default to no-op implementations unless using production entrypoints.

## Worker Row Models

The experimental worker row model plugin lives under:

```ts
@tanstack/react-table/experimental-worker-plugin
```

Use only for extreme client-side workloads, roughly 100,000+ rows or expensive custom filter/sort/group stages where the full dataset must live on the client. Prefer server-side processing, pagination, and virtualization first.

What it can offload:

- Filtering
- Grouping with aggregation
- Sorting
- Expanding, technically, but the docs discourage offloading it because it changes on each toggle

Constraints:

- Experimental API can change or disappear.
- Flat source data only for now.
- Shared table config must be imported by both app and worker.
- Worker-portable code only: no closures over app state.
- Offloaded stages must form a contiguous prefix of the row model pipeline.
- Keep pagination on the main thread.
- Worker lifecycle currently needs explicit care if termination matters.

## Custom Features

v9 supports custom features through `tableFeatures()`. Reach for this only when repeated app-specific state and APIs need to be attached to table, row, column, header, or cell instances.

Custom feature building blocks:

- `getInitialState`
- `getDefaultTableOptions`
- `getDefaultColumnDef`
- `constructTableAPIs`
- `assignHeaderPrototype`
- `assignColumnPrototype`
- `assignRowPrototype`
- `assignCellPrototype`
- `initRowInstanceData`

Custom features require TypeScript declaration merging into exported feature maps such as `Plugins`, `TableState_FeatureMap`, `TableOptions_FeatureMap`, and related instance feature maps. Prefer wrapper hooks or normal React composition when type-level table plugins would be overkill.

## Accessibility And Markup

TanStack Table is headless. The app owns accessible UI:

- Prefer semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` when the layout allows it.
- For sortable headers, use real buttons or equivalent keyboard-accessible controls inside headers.
- Reflect sort state with visible affordances and appropriate ARIA attributes where useful.
- Ensure selection checkboxes, expansion toggles, pagination controls, column visibility toggles, and resize handles are keyboard reachable.
- For virtualized tables, verify screen reader and keyboard behavior. Virtualization can remove DOM nodes that assistive technologies or browser find-in-page would otherwise use.
- Preserve focus when sorting, filtering, paging, expanding, or virtualizing.

## Testing

Useful tests by risk:

- Typecheck feature and column definitions after migrations.
- Unit tests for custom sort, filter, aggregation, and accessor functions.
- Interaction tests for sorting, filtering, pagination, selection, expansion, grouping, pinning, resizing, and visibility.
- Server-query tests proving query keys include owned state slices and `manual*` flags match backend behavior.
- Browser tests for sticky headers, pinned columns, virtualized rows/columns, resize handles, focus, and keyboard controls.
- Production build/profiling for large tables, virtualized views, and `columnResizeMode: 'onChange'`.

For beta upgrades, include a focused smoke of the highest-value table because feature names, slots, and experimental APIs may shift before v9 stable.
