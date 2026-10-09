# Sizing, Measurement, Padding, And Scrolling

## Contents

- Pick a sizing strategy
- Dynamic heights with measureElement
- Spacing: gap, padding, scroll padding, scroll margin
- scrollToIndex and scrollToOffset
- Smooth scrolling
- Scroll adjustment rules
- Scroll state and isScrolling
- Remeasure triggers
- Text-height estimates
- Scroll restoration

## Pick A Sizing Strategy

| Strategy | When | How |
| --- | --- | --- |
| Fixed | All rows share one height | `estimateSize: () => 36`, CSS height 36, no `measureElement`. |
| Known per index | Heights come from data (headers vs rows, image ratios) | `estimateSize: (i) => rows[i].kind === 'header' ? 48 : 36`, set matching CSS height. |
| Measured | Wrapped text, variable content, expanding rows | `measureElement` ref plus `data-index`. `estimateSize` is only the first guess. |
| Hybrid | Mostly known, some rows load late | Known sizes, then `resizeItem(index, size)` when content resolves. |

Rules:

- `estimateSize` should be close to the real average. For measured rows, the docs advise estimating the largest comfortable size. A good estimate keeps the scrollbar length and `scrollToIndex` accurate and cuts correction work.
- Never mix a fixed CSS `height: item.size` with `measureElement`. The element then always measures to the estimate and cannot grow.
- Use one sizing owner per item. Do not call `resizeItem` on an index that `measureElement` also observes.

## Dynamic Heights With measureElement

```tsx
{virtualizer.getVirtualItems().map((item) => (
  <div
    key={item.key}
    ref={virtualizer.measureElement}
    data-index={item.index}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      transform: `translateY(${item.start}px)`,
    }}
  >
    <Row row={rows[item.index]!} />
  </div>
))}
```

How it works:

- The ref registers the node in a ResizeObserver and reads the index from `data-index`. A missing attribute logs ``Missing attribute name 'data-index={index}' on measured element.`` and measures index `-1`.
- The default measurer uses the observer's border-box size (rounded). Margins are not included; use padding or `gap` for spacing.
- On first attach it measures synchronously, while idle or during a programmatic scroll. During user scrolling the observer delivers sizes asynchronously.
- Pass `virtualizer.measureElement` directly. An inline `(node) => virtualizer.measureElement(node)` makes a new ref each render (React calls it with null, then the node). It works, but costs extra work.
- Custom measurer: `measureElement: (el, entry, instance) => el.getBoundingClientRect().height` (use width when `instance.options.horizontal`). The Table virtualized-rows example uses `getBoundingClientRect().height` for table rows and keeps the default in Firefox, because Firefox reports table border height incorrectly.
- Horizontal lists measure width. A grid cell measured by two virtualizers needs separate `indexAttribute` values (see layouts).
- If rows hold images or lazy content, reserve space with `aspect-ratio`, explicit width and height, or `resizeItem` after metadata loads. Late growth above the viewport forces scroll corrections.
- Expand and collapse: the observer picks up the new height and the virtualizer re-flows. When a custom transition knows the final height up front, `resizeItem(index, size)` can set it directly; the docs warn that mixing it with `measureElement` on the same index gives unpredictable results.

## Spacing

| Option | Effect | Typical use |
| --- | --- | --- |
| `gap` | Space between items along the scroll axis. | Replaces item margins (which are not measured). |
| `paddingStart`, `paddingEnd` | Empty space inside the scrollable content before the first and after the last item. Included in `getTotalSize()`. | List padding, floating footer room. |
| `scrollPaddingStart`, `scrollPaddingEnd` | Inset applied when `scrollToIndex` aligns an item. Not part of the total size. | Keep the target clear of a sticky header or footer. |
| `scrollMargin` | Offset of the list start from the scroll origin. | Window virtualizer, headers inside the scroller, several virtualizers in one scroller. |

`scrollMargin` rules:

- Item `start` values include `scrollMargin`. Position items with `item.start - virtualizer.options.scrollMargin`.
- `getTotalSize()` already subtracts it.
- Measure it, do not guess: `listRef.current.offsetTop` for a static header, or `getBoundingClientRect().top + window.scrollY` for the window. Use a ResizeObserver if content above changes height, and store the value in state so the virtualizer re-reads it.
- The official window example reads `offsetTop` in a layout effect into a ref and passes `scrollMargin: listOffsetRef.current`. The first render uses 0. Prefer state when the first frame must be exact.

## scrollToIndex And scrollToOffset

```tsx
virtualizer.scrollToIndex(120)                              // align 'auto'
virtualizer.scrollToIndex(120, { align: 'center' })
virtualizer.scrollToIndex(rows.length - 1, { align: 'end' })
virtualizer.scrollToOffset(0)                               // top
virtualizer.scrollToEnd()                                   // true bottom, includes paddingEnd
virtualizer.scrollBy(300, { behavior: 'smooth' })
```

- `align: 'auto'` (default) does nothing if the item is already visible; otherwise it picks `'start'` or `'end'` by direction.
- `'center'` centers the item. `'end'` puts the item bottom at the viewport bottom, offset by `scrollPaddingEnd`.
- With measured rows, the virtualizer keeps correcting toward the target for a short time while items near it are measured, then settles. A user scroll away from a reached target ends the correction.
- Call `virtualizer.cancelScroll()` from `wheel`, `touchstart`, or `keydown` handlers so a long jump does not fight the user (core 3.18+). It does not move the viewport.
- On mount, call it from `useLayoutEffect` or `useEffect` after the scroller exists. The official dynamic example does `scrollToIndex(count - 1, { align: 'end' })` in an effect.
- Since core 3.18.0, `scrollToIndex(lastIndex, { align: 'end' })` stops `paddingEnd` from overshooting. To reach the very bottom including padding, use `scrollToEnd()`.
- Indexes are clamped to `0..count - 1`.
- For "scroll to item by id", map the id to the current index of the rendered array first.

## Smooth Scrolling

- `behavior: 'smooth'` lets the browser animate. During the animation the virtualizer measures only items near the target, so far items cannot shift the target.
- Because of that, use block translation for smooth scrolling lists: translate one wrapper by the first visible item's `start`, and lay items out in normal flow inside it, rather than absolutely positioning every item. The docs prefer this layout for smooth scrolling.

```tsx
const items = virtualizer.getVirtualItems()
<div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      transform: `translateY(${(items[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
    }}
  >
    {items.map((item) => (
      <div key={item.key} ref={virtualizer.measureElement} data-index={item.index}>
        <Row row={rows[item.index]!} />
      </div>
    ))}
  </div>
</div>
```

- Items in normal flow are not positioned by the virtualizer, so any CSS spacing between them must equal the `gap` option. Prefer padding inside rows so no mismatch can exist.
- `behavior: 'instant'` skips animation and is the choice for restoring position.

## Scroll Adjustment Rules

When an item above the viewport changes size, the virtualizer writes `scrollTop` to keep visible content still. Current defaults (core 3.17.x and 3.18.0):

- First measurement of an above-viewport item (estimate to actual): always compensated, even while scrolling backward.
- Re-measurement: compensated only when the whole item is above the viewport and the user is not scrolling backward. This avoids the old "items jump while scrolling up" cascade.
- A streaming item that spans the viewport edge no longer drags the viewport.
- During smooth scrolls, no compensation is applied.
- On iOS WebKit, writes are deferred while a finger is down, during momentum, and during bounce, then flushed once.
- Override with an instance property:

```tsx
virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (item, delta, instance) =>
  item.start < (instance.scrollOffset ?? 0) + instance.scrollAdjustments
```

Assign it once after creation (for example in a layout effect keyed on the instance). Return `true` to compensate and `false` to skip. The callback replaces the default predicate entirely.

## Scroll State And isScrolling

- `isScrolling` becomes false `isScrollingResetDelay` ms (default 150) after the last scroll event. Set `useScrollendEvent: true` to use native `scrollend` where supported.
- Use it to swap heavy rows for light placeholders, pause animations, or defer image decoding during fast scroll. Read it from the instance in render; the owner re-renders when it flips.
- `scrollDirection` is `'forward'`, `'backward'`, or null. Use it to prefetch in the travel direction.
- `onChange(instance, sync)` fires on any state change. Use it for imperative side effects (analytics, "jump to latest" visibility) instead of effects that depend on `getVirtualItems()`.

## Remeasure Triggers

Call `virtualizer.measure()` (in a layout effect) when all measured sizes may be wrong:

- The scroller or content width changed and text rewraps (when estimates depend on width).
- Font loaded or changed (`document.fonts.ready`).
- Table column sizes changed (column virtualizers).
- Density, zoom, or theme changed row height globally.

Do not call `measure()` per scroll or per data append; it drops every cached size.

When only data changes, keep stable `getItemKey` values. Cached sizes follow the key, so reordered or filtered rows keep their measurements.

## Text-Height Estimates

For text-heavy rows (chat, comments, logs) the docs describe computing `estimateSize` from the text with the Pretext library (`prepare` once per text and font, `layout` per width), then calling `virtualizer.measure()` when width or fonts change. Use it only when height depends on text, font, width, and line height. Keep `measureElement` for rows with images, embeds, or arbitrary layout, and pick one sizing owner per row. Pretext needs `Intl.Segmenter` and Canvas 2D text measurement, so keep a fallback estimate.

## Scroll Restoration

```tsx
// on leave
const saved = { snapshot: virtualizer.takeSnapshot(), offset: virtualizer.scrollOffset }
// on return
useVirtualizer({
  /* ... */
  initialMeasurementsCache: saved?.snapshot,
  initialOffset: saved?.offset ?? 0,
})
```

- `takeSnapshot()` returns only measured items. Unmeasured items fall back to `estimateSize`.
- The cache is consumed once on the first measurement pass after mount.
- Persist in router state, `sessionStorage`, or a store. Keep `getItemKey` stable so keys match.
- Data must be available at mount so the same `count` and keys exist; if data loads later, restore with `scrollToOffset` after load.
