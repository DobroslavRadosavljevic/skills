# Feature Matrix

## Feature Imports

Common feature names:

- Sorting: `rowSortingFeature`
- Column filtering: `columnFilteringFeature`
- Global filtering: `globalFilteringFeature`
- Faceting: `columnFacetingFeature`
- Pagination: `rowPaginationFeature`
- Row selection: `rowSelectionFeature`
- Row pinning: `rowPinningFeature`
- Row expanding: `rowExpandingFeature`
- Column pinning: `columnPinningFeature`
- Column visibility: `columnVisibilityFeature`
- Column ordering: `columnOrderingFeature`
- Column sizing: `columnSizingFeature`
- Column resizing: `columnResizingFeature`
- Grouping and aggregation: `columnGroupingFeature`

## Sorting

Setup:

```tsx
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
})
```

State shape:

```ts
type ColumnSort = {
  id: string
  desc: boolean
}
type SortingState = ColumnSort[]
```

Use `manualSorting: true` for server-side sorting. If manual sorting is on, the table assumes incoming `data` is already sorted. Do not combine client-side sorting with server-side pagination or filtering unless intentionally sorting only the loaded page.

Built-in sort functions:

- `alphanumeric`
- `alphanumericCaseSensitive`
- `text`
- `textCaseSensitive`
- `datetime`
- `basic`

UI APIs:

- `header.column.getToggleSortingHandler()`
- `header.column.getIsSorted()`
- `header.column.getCanSort()`
- `column.toggleSorting()`
- `table.setSorting()`
- `table.resetSorting()`

## Column And Global Filtering

Column filtering setup:

```tsx
import {
  columnFilteringFeature,
  createFilteredRowModel,
  filterFns,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns,
})
```

Global filtering depends on column filtering:

```tsx
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns,
})
```

Use `manualFiltering: true` for server-side column or global filtering. If manual filtering is on, the table assumes incoming `data` is already filtered.

Column filter state:

```ts
interface ColumnFilter {
  id: string
  value: unknown
}
type ColumnFiltersState = ColumnFilter[]
```

Global filter state is `globalFilter` and is commonly a string, though custom filter functions can use other shapes.

Built-in filter functions:

- `includesString`
- `includesStringSensitive`
- `equalsString`
- `equals`
- `weakEquals`
- `arrIncludes`
- `arrIncludesAll`
- `arrIncludesSome`
- `arrHas`
- `inNumberRange`
- `between`
- `betweenInclusive`

UI APIs:

- `column.getFilterValue()`
- `column.setFilterValue()`
- `table.setColumnFilters()`
- `table.resetColumnFilters()`
- `table.state.globalFilter`
- `table.setGlobalFilter()`
- `column.getCanGlobalFilter()`

## Faceting

Faceting powers unique-value lists, min/max ranges, and autocomplete or range filter UIs.

```tsx
import {
  columnFacetingFeature,
  columnFilteringFeature,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  filterFns,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  filterFns,
})
```

Practical notes:

- `facetedRowModel` is the base faceting row model.
- Add `facetedUniqueValues` for value lists.
- Add `facetedMinMaxValues` for range filters.
- Register `columnFilteringFeature` and a filtered row model when facet values should react to other filters.
- For server facets, provide custom `facetedUniqueValues` or `facetedMinMaxValues` factories, or bypass table APIs and feed fetched facet lists directly to filter UI.

APIs:

- `column.getFacetedUniqueValues()`
- `column.getFacetedMinMaxValues()`
- `table.getGlobalFacetedRowModel()`
- `table.getGlobalFacetedUniqueValues()`
- `table.getGlobalFacetedMinMaxValues()`

## Pagination

Client-side setup:

```tsx
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})
```

Server-side setup:

```tsx
const features = tableFeatures({ rowPaginationFeature })

const table = useTable({
  features,
  columns,
  data,
  manualPagination: true,
  rowCount: query.data?.rowCount,
})
```

Provide `rowCount` or `pageCount` for manual pagination. If page count is unknown, `pageCount: -1` keeps `getCanNextPage()` and `getCanPreviousPage()` returning `true`.

Pagination state:

```ts
type PaginationState = {
  pageIndex: number
  pageSize: number
}
```

APIs:

- `table.getCanPreviousPage()`
- `table.getCanNextPage()`
- `table.previousPage()`
- `table.nextPage()`
- `table.firstPage()`
- `table.lastPage()`
- `table.setPageIndex()`
- `table.setPageSize()`
- `table.setPagination()`
- `table.getPageCount()`
- `table.getRowCount()`

`pageIndex` resets to `0` when client-side row models recompute. This is automatically disabled with `manualPagination`. Use `autoResetPageIndex: false` for editable client-side tables where data changes should not jump back to the first page.

## Row Selection

Setup:

```tsx
import { rowSelectionFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ rowSelectionFeature })
```

Use stable row IDs:

```tsx
const table = useTable({
  features,
  columns,
  data,
  getRowId: (row) => row.uuid,
})
```

Selection state is keyed by row ID. With `manualPagination`, selected row state can include IDs not present in the current `data`, but `getSelectedRowModel()` only returns rows available in the current page data.

APIs:

- `table.state.rowSelection`
- `table.getSelectedRowModel()`
- `table.getFilteredSelectedRowModel()`
- `table.getGroupedSelectedRowModel()`
- `row.getToggleSelectedHandler()`
- `row.toggleSelected()`
- `row.getCanSelect()`
- `row.getIsSelected()`
- `table.getToggleAllRowsSelectedHandler()`
- `table.getToggleAllPageRowsSelectedHandler()`
- `table.setRowSelection()`

Options:

- `enableRowSelection`
- `enableMultiRowSelection`
- `enableSubRowSelection`

## Row Pinning

Setup:

```tsx
import { rowPinningFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ rowPinningFeature })
```

State:

```ts
type RowPinningState = {
  top: string[]
  bottom: string[]
}
```

APIs:

- `row.getCanPin()`
- `row.getIsPinned()`
- `row.getPinnedIndex()`
- `row.pin('top')`
- `row.pin('bottom')`
- `row.pin(false)`
- `table.getTopRows()`
- `table.getCenterRows()`
- `table.getBottomRows()`
- `table.setRowPinning()`
- `table.resetRowPinning()`

`keepPinnedRows` defaults to `true`, so pinned rows remain visible in pinned regions even if filtered or paginated out of the center rows. Set `keepPinnedRows: false` to require the row to exist in the current row model.

## Column Visibility

Setup:

```tsx
import { columnVisibilityFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ columnVisibilityFeature })
```

State is a map of column IDs to booleans. A column is hidden if its ID is present with `false`.

APIs:

- `column.getCanHide()`
- `column.getIsVisible()`
- `column.toggleVisibility()`
- `column.getToggleVisibilityHandler()`
- `table.getVisibleLeafColumns()`
- `row.getVisibleCells()`

Use visible variants when rendering body cells. Header groups already account for visibility.

## Column Ordering

Setup:

```tsx
import { columnOrderingFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ columnOrderingFeature })
```

Column reorder order:

1. Column pinning splits columns into left, center, and right regions.
2. Manual column ordering applies to unpinned center columns.
3. Grouping can move or remove grouped columns when `groupedColumnMode` is active.

State is an array of column IDs:

```ts
type ColumnOrderState = string[]
```

APIs:

- `table.setColumnOrder()`
- `table.resetColumnOrder()`
- `column.getIndex()`
- `column.getIsFirstColumn()`
- `column.getIsLastColumn()`

For drag and drop, connect your DnD library's drop result to `table.setColumnOrder`. The official examples use DnD Kit, but TanStack Table is library-agnostic.

## Column Pinning

Setup:

```tsx
import { columnPinningFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ columnPinningFeature })
```

State has left and right column ID arrays:

```ts
type ColumnPinningState = {
  left?: string[]
  right?: string[]
}
```

APIs:

- `column.getCanPin()`
- `column.pin('left')`
- `column.pin('right')`
- `column.pin(false)`
- `column.getIsPinned()`
- `column.getPinnedIndex()`
- `column.getStart()`
- `column.getAfter()`
- `table.getLeftHeaderGroups()`
- `table.getCenterHeaderGroups()`
- `table.getRightHeaderGroups()`
- `row.getLeftVisibleCells()`
- `row.getCenterVisibleCells()`
- `row.getRightVisibleCells()`

Implementation choices:

- Use sticky CSS with one table for most cases.
- Use split left, center, and right table regions when the design requires independent pinned areas.

## Column Sizing And Resizing

Column sizing setup:

```tsx
import { columnSizingFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ columnSizingFeature })
```

Column resizing depends on column sizing:

```tsx
import {
  columnResizingFeature,
  columnSizingFeature,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnSizingFeature,
  columnResizingFeature,
})
```

Default sizing:

```ts
const defaultColumnSizing = {
  size: 150,
  minSize: 20,
  maxSize: Number.MAX_SAFE_INTEGER,
}
```

APIs:

- `column.getSize()`
- `header.getSize()`
- `cell.column.getSize()`
- `column.getStart()`
- `column.getAfter()`
- `table.getTotalSize()`
- `table.getLeftTotalSize()`
- `table.getCenterTotalSize()`
- `table.getRightTotalSize()`
- `header.getResizeHandler()`
- `column.getCanResize()`
- `column.getIsResizing()`

Resizing options:

- `columnResizeMode: 'onEnd'` is the default and avoids rerendering every drag frame.
- `columnResizeMode: 'onChange'` updates during drag and can need extra performance work.
- `columnResizeDirection: 'rtl'` supports right-to-left layouts.

Current beta note: the docs spell one table API as `table.setcolumnResizing` with lowercase `c`. Verify current types before using it.

For large tables, prefer CSS variables plus narrow atom subscriptions so column width updates do not rerender the whole body.

## Grouping And Aggregation

Setup:

```tsx
import {
  aggregationFns,
  columnGroupingFeature,
  createGroupedRowModel,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  aggregationFns,
})
```

If users should expand and collapse grouped rows, also register:

```tsx
const features = tableFeatures({
  columnGroupingFeature,
  rowExpandingFeature,
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  aggregationFns,
})
```

Grouping state is `string[]` of column IDs. `groupedColumnMode` can be `'reorder'`, `'remove'`, or `false`.

Built-in aggregation functions:

- `sum`
- `count`
- `min`
- `max`
- `extent`
- `mean`
- `median`
- `unique`
- `uniqueCount`

APIs:

- `table.setGrouping()`
- `table.resetGrouping()`
- `column.toggleGrouping()`
- `column.getToggleGroupingHandler()`
- `column.getCanGroup()`
- `column.getIsGrouped()`
- `row.getIsGrouped()`
- `row.getGroupingValue(columnId)`
- `cell.getIsGrouped()`
- `cell.getIsAggregated()`
- `cell.getIsPlaceholder()`

Use `manualGrouping: true` only when server-side grouping and aggregation are already represented in incoming data. The docs warn this usually needs substantial custom rendering.

## Expanding

Setup:

```tsx
import {
  createExpandedRowModel,
  rowExpandingFeature,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
})
```

Use `getSubRows` for hierarchical table rows:

```tsx
const table = useTable({
  features,
  columns,
  data,
  getSubRows: (row) => row.children,
})
```

`getSubRows` runs for every row and sub-row. Keep it synchronous and cheap.

Use `getRowCanExpand` for custom detail panels:

```tsx
const table = useTable({
  features,
  columns,
  data,
  getRowCanExpand: () => true,
})
```

Expanded state:

```ts
type ExpandedState = true | Record<string, boolean>
```

APIs:

- `row.getCanExpand()`
- `row.getIsExpanded()`
- `row.getIsAllParentsExpanded()`
- `row.getToggleExpandedHandler()`
- `row.toggleExpanded()`
- `table.getCanSomeRowsExpand()`
- `table.getIsAllRowsExpanded()`
- `table.getIsSomeRowsExpanded()`
- `table.getExpandedDepth()`
- `table.getToggleAllRowsExpandedHandler()`
- `table.toggleAllRowsExpanded()`
- `table.setExpanded()`
- `table.resetExpanded()`

Filtering hierarchical rows:

- Default filtering starts at parent rows.
- `filterFromLeafRows: true` lets matching child rows include parents.
- `maxLeafRowFilterDepth` limits search depth.
