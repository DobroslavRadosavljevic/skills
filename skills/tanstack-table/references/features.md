# Feature Matrix

## Feature Imports

Common feature names:

- Sorting: `rowSortingFeature`
- Column filtering: `columnFilteringFeature`
- Global filtering: `globalFilteringFeature`
- Faceting: `columnFacetingFeature`
- Pagination: `rowPaginationFeature`
- Row selection: `rowSelectionFeature`
- Cell selection: `cellSelectionFeature`
- Cell spanning: `cellSpanningFeature`
- Row pinning: `rowPinningFeature`
- Row expanding: `rowExpandingFeature`
- Column pinning: `columnPinningFeature`
- Column visibility: `columnVisibilityFeature`
- Column ordering: `columnOrderingFeature`
- Column sizing: `columnSizingFeature`
- Column resizing: `columnResizingFeature`
- Aggregation: `rowAggregationFeature`
- Grouping: `columnGroupingFeature`

Kitchen-sink shortcut: `stockFeatures` registers every stock feature. Prefer explicit registration for production bundles.

## Sorting

Setup:

```tsx
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
  },
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

Built-in sort functions (`sortFn_*`):

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
  filterFn_includesString,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
})
```

Global filtering depends on column filtering:

```tsx
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
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

Built-in filter functions (`filterFn_*`):

- `includesString`
- `includesStringSensitive`
- `equalsString`
- `equalsStringSensitive`
- `equals`
- `weakEquals`
- `arrIncludes`
- `arrIncludesAll`
- `arrIncludesSome`
- `arrHas`
- `inNumberRange`
- `inDateRange`
- `between`
- `betweenInclusive`
- `empty`
- `notEmpty`
- `startsWith`
- `endsWith`
- `greaterThan`
- `greaterThanOrEqualTo`
- `lessThan`
- `lessThanOrEqualTo`

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
  filterFn_includesString,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  filterFns: {
    includesString: filterFn_includesString,
  },
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

## Cell Selection

Spreadsheet-style rectangular cell ranges:

```tsx
import { cellSelectionFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ cellSelectionFeature })
```

Bind mouse handlers on cells:

```tsx
<td
  onMouseDown={cell.getSelectionStartHandler()}
  onMouseEnter={cell.getSelectionExtendHandler()}
>
  <table.FlexRender cell={cell} />
</td>
```

State is an ordered array of range operations with anchor/focus corners. Prefer stable `getRowId`. Useful APIs include `table.getSelectedCellCount()`, `table.getSelectedCellIds()`, `table.getSelectedCellRangesData()`, `table.setCellSelection()`, and `cell.getCanSelect()`.

## Cell Spanning

Merge adjacent body cells with `cellSpanningFeature`:

```tsx
import { cellSpanningFeature, tableFeatures } from '@tanstack/react-table'

const features = tableFeatures({ cellSpanningFeature })
```

Opt columns into row spanning with `spanRows`, and declare horizontal spans with `spanColumns`. Skip covered cells (`rowSpan === 0` or `colSpan === 0`, or `cell.getIsCovered()`). Spans are derived from the rendered row model, not stored state.

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

1. Column pinning splits columns into start, center, and end regions.
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

State uses logical start/end regions (LTR usually maps start→left, end→right; RTL reverses that):

```ts
type ColumnPinningState = {
  start: string[]
  end: string[]
}
```

APIs:

- `column.getCanPin()`
- `column.pin('start')`
- `column.pin('end')`
- `column.pin(false)`
- `column.getIsPinned()`
- `column.getPinnedIndex()`
- `column.getStart()`
- `column.getAfter()`
- `table.getStartHeaderGroups()`
- `table.getCenterHeaderGroups()`
- `table.getEndHeaderGroups()`
- `row.getStartVisibleCells()`
- `row.getCenterVisibleCells()`
- `row.getEndVisibleCells()`

Implementation choices:

- Use sticky CSS with one table for most cases.
- Use split start, center, and end table regions when the design requires independent pinned areas.

Do not use the old v8/beta `left` / `right` pinning terminology or `getLeft*` / `getRight*` helpers.

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
- `table.getStartTotalSize()`
- `table.getCenterTotalSize()`
- `table.getEndTotalSize()`
- `header.getResizeHandler()`
- `column.getCanResize()`
- `column.getIsResizing()`
- `table.setColumnResizing()`

Resizing options:

- `columnResizeMode: 'onEnd'` is the default and avoids rerendering every drag frame.
- `columnResizeMode: 'onChange'` updates during drag and can need extra performance work.
- `columnResizeDirection: 'rtl'` supports right-to-left layouts.

For large tables, prefer CSS variables plus narrow atom subscriptions so column width updates do not rerender the whole body.

## Aggregation

Aggregation is independent from grouping. Register `rowAggregationFeature` whenever columns calculate totals or aggregated values:

```tsx
import {
  aggregationFn_count,
  aggregationFn_mean,
  aggregationFn_sum,
  rowAggregationFeature,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowAggregationFeature,
  aggregationFns: {
    count: aggregationFn_count,
    mean: aggregationFn_mean,
    sum: aggregationFn_sum,
  },
})
```

A column accepts one aggregation or an array. Multiple entries return an object keyed by name or descriptor `id`. Read with `column.getAggregationValue()`.

Built-in aggregation functions (`aggregationFn_*`):

- `sum`
- `count`
- `min`
- `max`
- `extent`
- `mean`
- `median`
- `unique`
- `uniqueCount`
- `first`
- `last`

## Grouping

Setup:

```tsx
import {
  columnGroupingFeature,
  createGroupedRowModel,
  tableFeatures,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
})
```

When grouped rows should also calculate aggregate values, register both features:

```tsx
const features = tableFeatures({
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  aggregationFns: {
    sum: aggregationFn_sum,
  },
})
```

Grouping state is `string[]` of column IDs. `groupedColumnMode` can be `'reorder'`, `'remove'`, or `false`.

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
- `cell.getIsPlaceholder()`
- `cell.getIsAggregated()` (from `rowAggregationFeature`)

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
- `table.getMaxSubRowDepth()`
- `row.getDisplayIndex()`

Filtering hierarchical rows:

- Default filtering starts at parent rows.
- `filterFromLeafRows: true` lets matching child rows include parents.
- `maxLeafRowFilterDepth` limits search depth.
