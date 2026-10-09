# Layouts: Horizontal, Grid, Lanes, Sticky, Window

## Contents

- Horizontal lists
- Two-axis grids (row plus column virtualizers)
- Lane grids and masonry
- Sticky items and rangeExtractor
- Window virtualizer
- Several virtualizers in one scroller
- RTL

## Horizontal Lists

```tsx
const columnVirtualizer = useVirtualizer({
  horizontal: true,
  count: columns.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (i) => columns[i].width,
  overscan: 3,
})

<div ref={parentRef} style={{ width: 600, overflow: 'auto' }}>
  <div style={{ width: columnVirtualizer.getTotalSize(), height: '100%', position: 'relative' }}>
    {columnVirtualizer.getVirtualItems().map((col) => (
      <div
        key={col.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: col.size,
          transform: `translateX(${col.start}px)`,
        }}
      />
    ))}
  </div>
</div>
```

- `horizontal: true` swaps the axis for sizes, offsets, padding, gap, and the default measurer (width, not height).
- Total size is a width. The inner element needs an explicit height or fill.
- For dynamic widths add `ref={virtualizer.measureElement}` and `data-index`.

## Two-Axis Grids

Use one row virtualizer and one column virtualizer on the same scroller. Render the cross product of their virtual items.

```tsx
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
  overscan: 5,
})
const columnVirtualizer = useVirtualizer({
  horizontal: true,
  count: columns.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (i) => columns[i].width,
  overscan: 3,
})

<div ref={parentRef} style={{ height: 500, width: 800, overflow: 'auto' }}>
  <div
    style={{
      height: rowVirtualizer.getTotalSize(),
      width: columnVirtualizer.getTotalSize(),
      position: 'relative',
    }}
  >
    {rowVirtualizer.getVirtualItems().map((row) => (
      <React.Fragment key={row.key}>
        {columnVirtualizer.getVirtualItems().map((col) => (
          <div
            key={col.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: col.size,
              height: row.size,
              transform: `translate(${col.start}px, ${row.start}px)`,
            }}
          >
            {cell(row.index, col.index)}
          </div>
        ))}
      </React.Fragment>
    ))}
  </div>
</div>
```

- Fixed cell sizes are the norm. The official padding example does measure cells with both virtualizers: it sets `data-row-index` and `data-column-index`, passes `indexAttribute: 'data-row-index'` to one and `'data-column-index'` to the other, and calls both `measureElement` functions in one ref callback. If you measure one axis only, one `data-index` attribute is enough.
- Row keys and column keys are separate. Use `getItemKey` per virtualizer when either axis can reorder or filter.
- Both virtualizers re-render the owner on scroll. For spreadsheets with thousands of visible cells, memoize the cell component and pass primitives.
- Re-measure columns with `columnVirtualizer.measure()` when column widths change (resize, visibility, pinning).

## Lane Grids And Masonry

`lanes: N` splits one virtualizer into N columns (vertical) or N rows (horizontal). Each item gets `item.lane` and is placed in the shortest lane.

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 180,
  lanes: 4,
  gap: 12,
})

{virtualizer.getVirtualItems().map((item) => (
  <div
    key={item.key}
    ref={virtualizer.measureElement}
    data-index={item.index}
    style={{
      position: 'absolute',
      top: 0,
      left: `${(item.lane * 100) / 4}%`,
      width: `${100 / 4}%`,
      transform: `translateY(${item.start}px)`,
    }}
  />
))}
```

- Equal-sized items fill lanes in row-major order, so `lanes` is the simplest responsive card grid. Derive the lane count from the container width (a ResizeObserver stored in state) and pass it to both `lanes` and the CSS.
- Changing `lanes` recomputes all positions and lane assignments. Expect a one-time re-layout on breakpoint change.
- `laneAssignmentMode: 'estimate'` (default) caches each lane at estimate time, so items never hop lanes but placement can be uneven when estimates are poor. `'measured'` waits for measurements, which gives tighter masonry and then stays stable.
- `gap` spaces items along the scroll axis. For cross-axis spacing, use padding inside each lane cell (the percent width includes it).
- `getTotalSize()` takes the longest lane end.
- With `directDomUpdates`, the cross-axis position (`left` percent) is still your responsibility in JSX. Only the main axis is automated.
- Prefer the lane approach over a 2D virtualizer when columns are equal width and only rows scroll.

## Sticky Items And rangeExtractor

`rangeExtractor` receives `{ startIndex, endIndex, overscan, count }` and returns the indexes to render. Always compose with `defaultRangeExtractor` so overscan keeps working.

Sticky group headers (matches the official sticky example):

```tsx
const activeStickyRef = React.useRef(0)

const rangeExtractor = React.useCallback(
  (range: Range) => {
    activeStickyRef.current =
      [...stickyIndexes].reverse().find((i) => range.startIndex >= i) ?? 0
    const next = new Set([activeStickyRef.current, ...defaultRangeExtractor(range)])
    return [...next].sort((a, b) => a - b)
  },
  [stickyIndexes],
)

// in render
const isActiveSticky = (i: number) => activeStickyRef.current === i
<div
  key={item.key}
  style={
    isActiveSticky(item.index)
      ? { position: 'sticky', top: 0, zIndex: 1, height: item.size }
      : {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: item.size,
          transform: `translateY(${item.start}px)`,
        }
  }
/>
```

Rules:

- Memoize `rangeExtractor` with `useCallback` and stable inputs (`stickyIndexes` from `useMemo`). The visible index list is memoized on it.
- The active header switches from absolute to `position: sticky; top: 0`. Give headers a background and `zIndex`.
- Sticky headers are known indexes in the flat item array, so build `stickyIndexes` from the grouped data once.
- The same hook pins other items: footers, the focused row for keyboard navigation, a row being edited, or a drag source. Add the pinned index to the set.
- Pinned indexes that are far from the viewport render out of order in the DOM. Sort ascending to keep DOM order logical for assistive tech.
- A fixed header above the list (not part of the data) belongs outside the virtualizer: a sticky element before the sized container in the same scroller. Set `scrollPaddingStart` to its height so `scrollToIndex` does not park rows underneath it.

## Window Virtualizer

```tsx
function PageList({ rows }: { rows: Array<Row> }) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [margin, setMargin] = React.useState(0)

  React.useLayoutEffect(() => {
    setMargin(listRef.current?.offsetTop ?? 0)
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 35,
    overscan: 5,
    scrollMargin: margin,
  })

  return (
    <div ref={listRef}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: item.size,
              transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

- `useWindowVirtualizer` needs no `getScrollElement`, and `initialOffset` defaults to `window.scrollY`. It observes window resize and scroll.
- `offsetTop` is relative to the offset parent. If the list sits inside positioned ancestors, compute `getBoundingClientRect().top + window.scrollY` instead. Re-measure on resize or when content above changes (ResizeObserver on the preceding element).
- `scrollToIndex` on a window virtualizer scrolls the page. Pair it with `scrollPaddingStart` equal to a sticky site header height.
- Page layout shift above the list (banners, ads) changes `scrollMargin`; update state so range math stays right.
- Horizontal window virtualization is supported with `horizontal: true`, but is rare.

## Several Virtualizers In One Scroller

Stacked sections (a feed of independent lists) can share one scroll element. Give each virtualizer a `scrollMargin` equal to its section's offset from the scroller top, and subtract it in each transform. Each section's total size excludes its margin. Alternatively, flatten all sections into one virtualized list with header items; this is simpler and supports sticky headers.

## RTL

Set `isRtl: true` on horizontal virtualizers in right-to-left locales. The built-in offset observer then negates `scrollLeft` (browsers report negative values in RTL). There is no official RTL example, so verify item anchoring (`left` or `right`) and the `translateX` sign in a real browser for each target engine before shipping.
