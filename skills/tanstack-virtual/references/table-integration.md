# TanStack Table Integration

## Contents

- Division of labor
- Virtualized rows with sticky header
- Native table spacer-row variant
- Column virtualization
- Table state interactions
- Infinite loading with a table
- Accessibility for virtualized tables

## Division Of Labor

TanStack Table owns data, columns, and row models. TanStack Virtual owns which rows and columns are in the DOM. Virtualization is not a Table feature and needs no feature registration. The only link is `rows.length` (or the visible column count) as `count`, and the virtual index mapped back to `rows[item.index]`.

Version naming:

| Concept | Table v9 (current `9.2.x`) | Table v8 |
| --- | --- | --- |
| Create | `useTable({ features, columns, data })` | `useReactTable({ ..., getCoreRowModel })` |
| Rows | `table.getRowModel().rows` | same |
| Visible columns | `table.getVisibleLeafColumns()` | same |
| Render cell | `<table.FlexRender cell={cell} />` | `flexRender(cell.column.columnDef.cell, cell.getContext())` |
| Column sizing state | `table.state.columnSizing` | `table.getState().columnSizing` |

Match the installed Table version; do not mix APIs. The Virtual calls are identical in both.

## Virtualized Rows With Sticky Header

This follows the official Table virtualized-rows example. Real table elements are kept but switched to CSS grid and flex so rows can be absolutely positioned and measured.

```tsx
function UsersTable() {
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const table = useTable({ features, columns, data, getRowId: (row) => String(row.id) })

  return (
    <div
      ref={tableContainerRef}
      style={{ overflow: 'auto', position: 'relative', height: 800, overflowAnchor: 'none' }}
    >
      <table style={{ display: 'grid' }}>
        <thead style={{ display: 'grid', position: 'sticky', top: 0, zIndex: 1 }}>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} style={{ display: 'flex', width: '100%' }}>
              {hg.headers.map((header) => (
                <th key={header.id} style={{ display: 'flex', width: header.getSize() }}>
                  <table.FlexRender header={header} />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <TableBody table={table} tableContainerRef={tableContainerRef} />
      </table>
    </div>
  )
}

function TableBody({ table, tableContainerRef }: Props) {
  const { rows } = table.getRowModel()

  // Keep the virtualizer in the lowest component that needs it.
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 33,
    getScrollElement: () => tableContainerRef.current,
    getItemKey: React.useCallback((index: number) => rows[index]!.id, [rows]),
    overscan: 5,
    // official example: getBoundingClientRect() height everywhere except Firefox,
    // where the default measurer is used because Firefox misreports table border height
    measureElement:
      typeof window !== 'undefined' && !navigator.userAgent.includes('Firefox')
        ? (element) => element.getBoundingClientRect().height
        : undefined,
  })

  return (
    <tbody style={{ display: 'grid', position: 'relative', height: rowVirtualizer.getTotalSize() }}>
      {rowVirtualizer.getVirtualItems().map((item) => {
        const row = rows[item.index]!
        return (
          <tr
            key={row.id}
            data-index={item.index}
            ref={rowVirtualizer.measureElement}
            style={{
              display: 'flex',
              position: 'absolute',
              width: '100%',
              transform: `translateY(${item.start}px)`,
            }}
          >
            {row.getAllCells().map((cell) => (
              <td key={cell.id} style={{ display: 'flex', width: cell.column.getSize() }}>
                <table.FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        )
      })}
    </tbody>
  )
}
```

Points:

- Fixed-height rows: drop `measureElement`, `data-index`, and the ref; set the row height in CSS to match `estimateSize`.
- The example calls `rowVirtualizer.measure()` once after mount. Do that when the first paint used estimates and columns may change widths.
- Cell width comes from `column.getSize()`; flex or grid cells do not auto-size to content the way native table cells do, so every column needs an explicit size.
- Keys: use `row.id` (set `getRowId` to a business id) for both the React key and `getItemKey`. Index keys break measurement caching after sorting.
- Header height: if the sticky header has a fixed height, set `scrollPaddingStart` to it so `scrollToIndex` does not hide the target under it. Set `scrollMargin` to the header height if you want exact range math (the official example omits it and relies on overscan).
- Row selection, expansion, and pinning state live in Table. Unmounted rows keep their state because it is not in the DOM.
- The row component should be `React.memo`'d if cells are costly. Pass `row` and `item` (or just `start`) as props; avoid creating inline style objects for static parts.
- Table v9 nested components that only receive `row` and `cell` objects must subscribe to the state they render; follow Table's own guidance. Virtualization does not change that rule.

## Native Table Spacer-Row Variant

Keep default `display: table` layout and absolute-free rows by padding the body with two spacer rows. Use this when you need native column auto-sizing.

```tsx
const items = rowVirtualizer.getVirtualItems()
const paddingTop = items.length ? items[0]!.start : 0
const paddingBottom = items.length ? rowVirtualizer.getTotalSize() - items[items.length - 1]!.end : 0

<tbody>
  {paddingTop > 0 && <tr><td style={{ height: paddingTop }} colSpan={columns.length} /></tr>}
  {items.map((item) => { /* rows in normal flow, ref={rowVirtualizer.measureElement}, data-index */ })}
  {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} colSpan={columns.length} /></tr>}
</tbody>
```

- Column widths in auto layout can change as different rows mount. Use `table-layout: fixed` and explicit widths to prevent horizontal jitter.
- Row striping with `:nth-child` shifts as rows mount and unmount; stripe by `item.index` in code.
- Spacer rows have no `data-index`, so they are never measured.
- This variant is a classic community pattern, not the current official example. Prefer the grid and flex layout above unless native layout is required.

## Column Virtualization

Follows the official virtualized-columns example: spacer cells instead of absolute positioning, which keeps dynamic row heights working.

```tsx
const visibleColumns = table.getVisibleLeafColumns()

const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
  count: visibleColumns.length,
  estimateSize: (index) => visibleColumns[index]!.getSize(),
  getScrollElement: () => tableContainerRef.current,
  getItemKey: (index) => visibleColumns[index]!.id,
  horizontal: true,
  overscan: 3,
})

const columnSizing = table.state.columnSizing
React.useEffect(() => {
  columnVirtualizer.measure()
}, [columnVirtualizer, columnSizing])

const virtualColumns = columnVirtualizer.getVirtualItems()
const padLeft = virtualColumns[0]?.start ?? 0
const padRight = virtualColumns.length
  ? columnVirtualizer.getTotalSize() - virtualColumns[virtualColumns.length - 1]!.end
  : 0
```

Render in every header row and body row:

```tsx
{padLeft > 0 && <th style={{ display: 'flex', width: padLeft }} />}
{virtualColumns.map((vc) => {
  const cell = row.getVisibleCells()[vc.index]! // v9 example uses getAllCells(); use the accessor your Table version documents for visible cells
  return <td key={cell.id} style={{ display: 'flex', width: cell.column.getSize() }}>{/* ... */}</td>
})}
{padRight > 0 && <th style={{ display: 'flex', width: padRight }} />}
```

- The column virtualizer's `getItemKey` should be the column id so hiding or reordering columns does not reuse stale sizes.
- Always index into the current visible leaf columns. After visibility, order, pinning, or grouping changes, the array changes, and stale arrays render wrong cells.
- Call `columnVirtualizer.measure()` when column sizes change (resize end or live resize). Without it, spacer widths and scroll math drift from rendered widths.
- Header groups with `colSpan` complicate column virtualization. Virtualize leaf headers only, or flatten headers.
- Pinned (sticky) columns must always render. Add their indexes through `rangeExtractor` on the column virtualizer and use `position: sticky; left: 0` (or `right: 0`) for them, as in the sticky-items pattern. With pinned columns in a different region, compute virtual indexes only over the scrolling region.
- Row virtualizer and column virtualizer can share one scroller. Column virtualization pays off from roughly dozens of columns; for under 20, skip it.

## Table State Interactions

- Client sorting and filtering: `rows` changes length and order. Keep `count: rows.length`. Scroll to top on sort or filter change: `rowVirtualizer.scrollToOffset(0)` in an effect keyed on the state.
- Server-side sorting, filtering, or pagination: pass the returned rows as `data`, set the Table `manual*` options, and virtualize the loaded page or the accumulated pages.
- Client pagination plus virtualization is rarely useful unless the page size is in the thousands.
- Expanding rows or grouping changes `rows.length` and may change heights. Key by `row.id`. Measured rows re-measure on their own.
- Row selection range (shift-click) works on the row model, not on mounted rows, so it is safe with virtualization. Do not read selection from the DOM.
- "Scroll to row by id": find the index in the current `rows` array, then `rowVirtualizer.scrollToIndex(index, { align: 'center' })`. If a filter hides it, the index is -1; handle that.
- Cell spanning: a row-span anchor scrolled out of the virtual window can leave the visible part of the span unrendered. Use Table's span helpers to clamp the visible span, and render the spanning cell's visible remainder.
- Column resizing live (`onChange` mode) re-renders the whole table; use `columnResizeMode: 'onEnd'` for large tables, or write widths to CSS variables.

## Infinite Loading With A Table

The official Table infinite example (v9) combines `useInfiniteQuery`, a flattened `data` array, a scroll handler on the container that fetches when less than about 500 px remain, and an extra check on mount. Use `placeholderData: keepPreviousData` so sorting changes keep rows visible. The scrollbar length comes from the virtualizer `count`, not from Table's `rowCount`; when the API returns a total, use it for `count` and render skeleton rows for unloaded indexes. See [chat-and-infinite.md](chat-and-infinite.md) for the trigger patterns.

## Accessibility For Virtualized Tables

Because rows and columns are absent from the DOM, assistive tech cannot know the real size. Add:

- `aria-rowcount` on the table (total rows plus header rows) and `aria-colcount` when columns are virtualized.
- `aria-rowindex` on every rendered row (1-based, header row is 1) and `aria-colindex` on cells when columns are virtualized.
- Explicit `role="table"`, `row`, `columnheader`, `cell` (or `grid` and `gridcell` for interactive grids) when CSS `display: grid` or `flex` may strip native table semantics in some browsers. Check the accessibility tree in browser devtools.

See [production-patterns.md](production-patterns.md) for keyboard focus handling.
