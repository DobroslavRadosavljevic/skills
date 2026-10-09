# Setup And Core API

## Contents

- Install and versions
- Hook choice
- Baseline markup
- Options reference
- Instance API
- Version timeline

## Install And Versions

```sh
bun add @tanstack/react-virtual
```

- `@tanstack/react-virtual` depends on an exact `@tanstack/virtual-core` and re-exports everything from it. Import `Virtualizer`, `VirtualItem`, `Range`, `defaultRangeExtractor`, and `elementScroll` from `@tanstack/react-virtual`. Add `@tanstack/virtual-core` directly only for non-React code.
- React peer range: `^16.8.0 || ^17 || ^18 || ^19`. The package ships ESM with `sideEffects: false`.
- Snapshot (2026-10-09): `@tanstack/react-virtual@3.14.14` depends on `@tanstack/virtual-core@3.18.0`. Other adapters (Vue, Solid, Svelte, Lit, Angular, Marko) share the core but have their own versions.
- No v4 is published. npm `dist-tags.latest` is still 3.x, and the `v4` git branch has not moved since February 2025 (3.12 era). Do not invent v4 migration steps. Re-check `npm view @tanstack/react-virtual dist-tags` before claiming otherwise.

## Hook Choice

| Need | Hook | Notes |
| --- | --- | --- |
| Scroll inside a fixed-height element | `useVirtualizer` | Pass `getScrollElement: () => ref.current`. |
| Scroll with the page | `useWindowVirtualizer` | No `getScrollElement`. Reads `window.scrollY`. Pass `scrollMargin` for content above the list. |
| Non-React or custom framework | `new Virtualizer(opts)` from core | Call `_didMount()` and `_willUpdate()` yourself. |

Both hooks return a stable `Virtualizer` instance (plus `containerRef`). They accept the React-only options `useFlushSync`, `directDomUpdates`, and `directDomUpdatesMode`. Generic order is `<TScrollElement, TItemElement>`.

## Baseline Markup

```tsx
import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

function List({ rows }: { rows: Array<{ id: string; label: string }> }) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    getItemKey: React.useCallback((index: number) => rows[index]!.id, [rows]),
    overscan: 6,
  })

  return (
    <div
      ref={parentRef}
      style={{ height: 480, overflow: 'auto', contain: 'strict', overflowAnchor: 'none' }}
    >
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
              transform: `translateY(${item.start}px)`,
            }}
          >
            {rows[item.index]!.label}
          </div>
        ))}
      </div>
    </div>
  )
}
```

Rules behind the baseline:

- The scroller needs a real, bounded size (fixed `height`, flex child with `min-height: 0`, or `max-height`). An unbounded parent makes the visible rect huge and renders every row.
- `contain: strict` needs an explicit width and height on the scroller. Drop it if layout depends on content size.
- `overflow-anchor: none` stops browser scroll anchoring from fighting the virtualizer. The maintainers recommend it.
- The inner element carries total size and `position: relative`. Items are absolute inside it.
- Use `transform: translateY` (or `translateX` for horizontal) for compositor-friendly moves. `top` also works.
- With measured rows, remove `height: item.size` and add `ref={virtualizer.measureElement}` plus `data-index={item.index}`.
- Use `item.key` as the React key. It equals `getItemKey(index)` and defaults to the index.

## Options Reference

Required: `count`, `getScrollElement`, `estimateSize(index)`. The adapters supply `scrollToFn`, `observeElementRect`, and `observeElementOffset`; override them only for custom scrollers or tests.

| Option | Default | Purpose |
| --- | --- | --- |
| `overscan` | `1` | Extra items rendered before and after the visible range. |
| `horizontal` | `false` | Virtualize columns. Sizes become widths. |
| `gap` | `0` | Space between items along the scroll axis, in pixels. |
| `paddingStart`, `paddingEnd` | `0` | Space at the start and end of the scrollable content. Counts toward `getTotalSize()`. |
| `scrollPaddingStart`, `scrollPaddingEnd` | `0` | Inset used when `scrollToIndex` aligns an item, to clear sticky bars. |
| `scrollMargin` | `0` | Distance between the scroll origin and the list start. |
| `getItemKey` | index | Stable key per item. Keys the measurement cache. |
| `rangeExtractor` | `defaultRangeExtractor` | Choose which indexes render (sticky items, pinned focus). |
| `measureElement` | border-box size | Custom measurement `(element, entry, instance) => number`. |
| `indexAttribute` | `'data-index'` | Attribute that maps an element to its index. Change it when two virtualizers measure one element. |
| `lanes` | `1` | Number of columns (vertical) or rows (horizontal) for grids and masonry. |
| `laneAssignmentMode` | `'estimate'` | `'measured'` defers lane choice until items are measured. |
| `initialRect` | `{0,0}` | First scroller size, for SSR. Replaced on mount by observation. |
| `initialOffset` | `0` | Starting scroll offset (number or function). |
| `initialMeasurementsCache` | `[]` | Seed from `takeSnapshot()`. Consumed once. |
| `enabled` | `true` | `false` disconnects observers and resets state. |
| `isScrollingResetDelay` | `150` | Milliseconds of scroll silence before `isScrolling` turns false. |
| `useScrollendEvent` | `false` | Use native `scrollend` instead of the debounce. |
| `isRtl` | `false` | Invert horizontal scrolling for right-to-left locales. |
| `anchorTo` | `'start'` | `'end'` for chat and logs. |
| `followOnAppend` | `false` | With `anchorTo: 'end'`, follow appended items when pinned. `true` equals `'auto'`; or a scroll behavior. |
| `scrollEndThreshold` | `1` | Pixels from the end that count as pinned. |
| `useCachedMeasurements` | `false` | Default `measureElement` returns cached sizes. For hidden lists. |
| `useAnimationFrameWithResizeObserver` | `false` | Defers measurement one frame. Rarely helpful; adds about 16 ms lag. |
| `onChange` | noop | `(instance, sync)` after state changes. `sync` is true while scrolling is in progress. |
| `debug` | `false` | Logs internals. |
| `useFlushSync` (React) | `true` | Use `flushSync` for synchronous updates. |
| `directDomUpdates` (React) | `false` | Skip scroll-only re-renders. See the production reference. |
| `directDomUpdatesMode` (React) | `'transform'` | `'position'` writes `top` and `left`. |

Notes:

- `options` is read-only on the instance and is replaced each render by the adapter.
- `shouldAdjustScrollPositionOnItemSizeChange` is an instance property, not an option. Assign it after creation.
- A change to `count`, `paddingStart`, `scrollMargin`, `getItemKey` (identity), `enabled`, `lanes`, `laneAssignmentMode`, or `gap` recomputes all item positions. Cached item sizes stay (keyed by `getItemKey`); `measure()` is what drops them.

## Instance API

| Member | Use |
| --- | --- |
| `getVirtualItems()` | Items to render: `{ key, index, start, end, size, lane }`. |
| `getVirtualIndexes()` | Only the indexes. |
| `getTotalSize()` | Pixel size for the inner container. Excludes `scrollMargin`, includes `paddingEnd`. |
| `scrollToIndex(i, { align, behavior })` | Align `'start' \| 'center' \| 'end' \| 'auto'` (default `'auto'`). Behavior `'auto' \| 'smooth' \| 'instant'`. |
| `scrollToOffset(px, { align, behavior })` | Absolute scroll. |
| `scrollBy(delta, { behavior })` | Relative scroll. |
| `scrollToEnd({ behavior })` | Scroll to the true end, including `paddingEnd`. |
| `cancelScroll()` | Stop an in-flight programmatic scroll so a user gesture takes over. |
| `isAtEnd(threshold?)`, `getDistanceFromEnd()` | Pinned-to-bottom checks. |
| `measure()` | Drop all cached sizes. Call after width, font, or column size changes. |
| `measureElement(node)` | Ref callback that observes and measures an item. |
| `resizeItem(index, size)` | Set a size manually. Do not mix with `measureElement` on the same index. |
| `takeSnapshot()` | Measured items for scroll restoration. |
| `scrollOffset`, `scrollRect`, `scrollDirection`, `isScrolling` | Live scroll state. `scrollDirection` is `'forward' \| 'backward' \| null`. |
| `range` | `{ startIndex, endIndex }` of the visible range, or null. |
| `containerRef` | Ref for the inner container. Only used with `directDomUpdates`. |

## Version Timeline

| Version | Date | Change |
| --- | --- | --- |
| core 3.15.0 | 2026-05-20 | iOS momentum-scroll handling. Scroll adjustment skipped for re-measures during backward scroll. `takeSnapshot()`. Faster mount and measurement. |
| core 3.16.0 | 2026-05-25 | `anchorTo`, `followOnAppend`, `scrollEndThreshold`, `scrollToEnd()`, `getDistanceFromEnd()`, `isAtEnd()`. |
| react 3.14.0 | 2026-06-01 | `directDomUpdates`, `directDomUpdatesMode`, `containerRef`. |
| core 3.17.0 | 2026-06-02 | `useCachedMeasurements`. |
| react 3.14.13 | 2026-09-14 | `measureElement` ref notifications no longer call `flushSync` (it warns during commit). |
| core 3.18.0 | 2026-10-09 | `cancelScroll()`. `scrollToIndex(last, { align: 'end' })` respects `scrollPaddingEnd`, not `paddingEnd`; use `scrollToEnd()` to reach the very bottom. Unattached nodes no longer cache size 0. |
| react 3.14.14 | 2026-10-09 | `directDomUpdates` rows that mount without the owner re-rendering are positioned. |

If the app is on an older 3.x, upgrade first: several jump and chat bugs were fixed between 3.15 and 3.18. There is no breaking migration inside 3.x; stay on the `^3` range.
