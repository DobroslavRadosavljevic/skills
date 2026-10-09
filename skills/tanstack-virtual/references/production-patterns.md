# Production Patterns

## Contents

- SSR and hydration
- React 19, StrictMode, and useFlushSync
- React Compiler
- directDomUpdates
- Hidden and conditionally rendered lists
- Performance checklist
- Accessibility and keyboard focus
- Testing in jsdom
- Testing in a browser

## SSR And Hydration

The server has no layout, so the scroller size is unknown and the first render would be empty. Give the virtualizer a believable viewport:

```tsx
useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
  initialRect: { width: 800, height: 600 }, // server and first client render
  initialOffset: 0,
})
```

- `initialRect` makes the server render roughly `height / estimate + overscan` items. The client's first render uses the same value, so hydration matches. After mount the real rect replaces it.
- Dynamic heights render at their estimates on the server and settle after hydration. Expect a small layout shift; a good `estimateSize` minimizes it.
- `initialOffset` restores a known scroll position, as a number or a function. Pair with `initialMeasurementsCache` from `takeSnapshot()` for exact restoration.
- `useWindowVirtualizer` uses `window.scrollY` as `initialOffset` on the client and `0` on the server. If a scroll-restored page shows hydration mismatches, pass `initialOffset: 0` or render the list after mount.
- When no good estimate exists, render a skeleton on the server and mount the list in a client-only boundary.
- Never read `window` or `document` during render. `getScrollElement` returning `null` before mount is expected; the virtualizer binds in a layout effect.

## React 19, StrictMode, And useFlushSync

- React 16.8 through 19 are the declared peers. A jsdom run with React 19.3 and react-virtual 3.14.14 rendered and scrolled correctly.
- `useFlushSync` (default `true`) wraps synchronous notifications in `flushSync`. React 19 can warn `flushSync was called from inside a lifecycle method`. React-virtual 3.14.13 removed the case raised from `measureElement` ref callbacks. If the warning persists on a newer version, set `useFlushSync: false`; updates then batch normally, with a small risk of a one-frame lag during fast scroll.
- StrictMode double-invokes effects in development. The virtualizer's mount and cleanup are idempotent. Do not treat duplicated dev logs as a bug.
- Do not call `scrollToIndex` during render. Use an effect or event handler.
- Prefer `useLayoutEffect` for initial `scrollToEnd()` or `scrollToIndex()` so the first paint is already positioned.

## React Compiler

`useVirtualizer` returns a mutable object whose methods read changing internal state. The compiler memoizes calls such as `getVirtualItems()` and `getTotalSize()`, so output can go stale. React's own list marks `@tanstack/react-virtual` as an incompatible library; ESLint (`react-hooks/incompatible-library`) reports "Compilation Skipped", and the compiler skips memoizing that component.

Options, in order of preference:

1. Let the compiler skip the component and suppress the lint warning (state why in the comment).
2. Add `'use no memo'` at the top of the component that calls `useVirtualizer` to opt out explicitly.
3. Use `directDomUpdates` (react 3.14.0+). The maintainers say it makes the hook compatible because scroll-only changes no longer depend on re-renders. The incompatible-library lint warning may remain, so keep the suppression.

Do not memoize the virtual item array in `useMemo` by hand: it goes stale.

## directDomUpdates

Skips React renders for scroll-only updates. The virtualizer writes item positions and the container size to the DOM, and re-renders only when the visible index range or `isScrolling` changes.

```tsx
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  directDomUpdates: true, // set once at mount
  // directDomUpdatesMode: 'position', // default is 'transform'
})

<div ref={parentRef} style={{ overflow: 'auto', height: 400, overflowAnchor: 'none' }}>
  {/* no height/width in style: the virtualizer writes the main-axis size */}
  <div ref={virtualizer.containerRef} style={{ position: 'relative' }}>
    {virtualizer.getVirtualItems().map((item) => (
      <div
        key={item.key}
        ref={virtualizer.measureElement}
        data-index={item.index}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%' }} // no transform/top for the main axis
      />
    ))}
  </div>
</div>
```

Rules (from the react-virtual docs):

- Items are `position: absolute`. In `'transform'` mode they also need `top: 0` and `left: 0`.
- Items must not set the main-axis position (`transform` in transform mode, `top`/`left` in position mode).
- The inner container takes `virtualizer.containerRef` and no `height` or `width`.
- Multi-lane layouts still set the cross-axis position (`left` percent) in JSX.
- Without `containerRef`, the virtualizer makes no direct DOM writes. You then position items and size the container yourself, for example in `onChange`.
- Do not toggle `directDomUpdates` or its mode at runtime. Inline styles can go stale.
- `'transform'` mode creates a stacking context per item and can interfere with `position: fixed` descendants (popovers, tooltips inside rows). Use `'position'` or portal overlays.
- Values derived from scrolling (a jump button, a header shadow) will not re-render on every scroll. Mirror them into state from `onChange`.
- Reach for it when profiling shows React render work during scroll is the bottleneck, or for chat lists. It is not a default.

## Hidden And Conditionally Rendered Lists

- A measured list inside `display: none` (inactive tab, collapsed panel) sees every item resize to 0 and loses sizes. Set `useCachedMeasurements: true` before hiding and back to `false` when shown. It only affects the default `measureElement`; custom measurers must handle it.
- `enabled: false` disconnects observers and resets state. Use it for lists that are truly inactive and can restart from the top.
- Unmounting the list loses state. Persist with `takeSnapshot()` plus `scrollOffset` if the position matters.
- A virtualizer created before its scroller exists is fine: `getScrollElement` can return `null` until mount.

## Performance Checklist

1. Fixed row heights where possible; no `measureElement`, no observers.
2. Stable `getItemKey` and `rangeExtractor` references (`useCallback`).
3. Stable keys on rendered items: `item.key`, not a fresh id and not an index when data reorders.
4. Memoize the row component. Pass `row` data and `item.index`; keep `item.start` in a thin wrapper style.
5. No per-row inline closures that defeat `memo`; hoist handlers or use event delegation with `data-index`.
6. Do not read layout (`offsetHeight`, `getBoundingClientRect`) in render or per-row effects. Let the virtualizer's observer do it. A custom `measureElement` using `getBoundingClientRect` is fine because it runs from the observer.
7. Images get fixed or aspect-ratio boxes. Late layout growth causes correction work.
8. `overscan` 3 to 10; larger only with cheap rows.
9. Use `transform` for item placement. Use `contain: strict` on the scroller when sized explicitly. Use `overflow-anchor: none`.
10. Swap heavy rows for placeholders while `virtualizer.isScrolling` if rows are expensive.
11. Keep the virtualizer in the lowest component. Parent re-renders on each scroll update re-render everything below unless children are memoized.
12. Avoid `useFlushSync` costs on low-end devices: set `useFlushSync: false` and compare.
13. `useAnimationFrameWithResizeObserver` adds latency; enable it only to work around a measured ResizeObserver loop error.
14. Profile a production build. The dev build and StrictMode inflate scroll cost.
15. Do not use `debug: true` in committed code.

## Accessibility And Keyboard Focus

Virtualized content is partly absent from the DOM, so state its true size and keep the active element mounted. The ARIA Authoring Practices grid and listbox patterns are the reference; TanStack Virtual ships no accessibility helpers.

List semantics:

```tsx
<div role="list" aria-label="Messages">
  {virtualizer.getVirtualItems().map((item) => (
    <div
      key={item.key}
      role="listitem"
      aria-setsize={rows.length}
      aria-posinset={item.index + 1}
      /* ref, data-index, style */
    />
  ))}
</div>
```

Table or grid semantics: `role="grid"` (or `table`) with `aria-rowcount={total + headerRows}` and `aria-colcount={totalColumns}`; each row `role="row"` with `aria-rowindex={item.index + 1 + headerRows}`; each cell with `aria-colindex` when columns are virtualized. Set `aria-busy` while a page loads and announce load progress in a polite live region.

Roving focus that survives unmounting:

```tsx
const [active, setActive] = React.useState(0)

const rangeExtractor = React.useCallback(
  (range: Range) => {
    const indexes = new Set(defaultRangeExtractor(range))
    indexes.add(Math.min(active, range.count - 1)) // keep the focused row mounted
    return [...indexes].sort((a, b) => a - b)
  },
  [active],
)

const virtualizer = useVirtualizer({ /* ... */, rangeExtractor })

const onKeyDown = (e: React.KeyboardEvent) => {
  const page = Math.max(1, (virtualizer.range?.endIndex ?? 10) - (virtualizer.range?.startIndex ?? 0))
  const next =
    e.key === 'ArrowDown' ? active + 1
    : e.key === 'ArrowUp' ? active - 1
    : e.key === 'PageDown' ? active + page
    : e.key === 'PageUp' ? active - page
    : e.key === 'Home' ? 0
    : e.key === 'End' ? rows.length - 1
    : null
  if (next === null) return
  e.preventDefault()
  const clamped = Math.max(0, Math.min(rows.length - 1, next))
  setActive(clamped)
  virtualizer.scrollToIndex(clamped) // 'auto' scrolls only when needed
}

React.useEffect(() => {
  parentRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.focus({ preventScroll: true })
}, [active])
```

- The active row gets `tabIndex={0}` and the others `tabIndex={-1}`.
- Pinning the active index through `rangeExtractor` means its element exists in the same commit, so focus works even before the scroll event arrives. `active` in the callback deps changes the function identity, which recomputes the visible indexes.
- Add `aria-activedescendant` on the container as an alternative to moving DOM focus; the active descendant must stay mounted too.
- Home and End should scroll with `scrollToIndex(0)` and `scrollToIndex(last)`. Do not rely on the browser, which only sees mounted rows.
- Native find-in-page cannot see unmounted rows. Provide an in-app search that scrolls to a match.
- Honor `prefers-reduced-motion`: use `behavior: 'auto'` instead of `'smooth'` when set.
- Give the scroller `tabIndex={0}` and a label when it has no focusable children, so keyboard users can scroll.

## Testing In jsdom

jsdom has no layout. Everything the virtualizer reads is 0: the scroller rect comes from `offsetWidth` and `offsetHeight`, and measured items report `offsetHeight` 0. An un-stubbed test renders zero rows. Worse, a measured list with a stubbed rect but zero item sizes grows its range until React throws `Maximum update depth exceeded`. `initialRect` alone does not help, because the observer overwrites it on mount.

Verified recipe A, per component: expose the options and stub the observers in the test.

```tsx
const options = {
  observeElementRect: (_instance, cb) => {
    cb({ width: 300, height: 400 })
    return () => {}
  },
  measureElement: () => 50, // skip DOM reads; return the known row size
}
// pass `options` into the component under test, spread into useVirtualizer({ ..., ...testOptions })
```

Verified recipe B, global, no component changes: define `offsetHeight` and `offsetWidth` getters on `HTMLElement.prototype`, returning the scroller size for the scroller and the row size for elements with `data-index`.

```ts
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() { return this.hasAttribute('data-index') ? 50 : 400 },
})
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 300 })
```

With either recipe, a 1000-row list with 50 px rows and a 400 px scroller rendered 9 rows (8 visible plus 1 overscan) in a React 19.3 and jsdom run.

Scrolling in tests:

```ts
scroller.scrollTop = 500
await act(async () => {
  scroller.dispatchEvent(new Event('scroll'))
  await new Promise((r) => setTimeout(r, 50))
})
// rendered indexes after this run: 9 through 18
```

- Wrap scroll in `act`. The debounced `isScrolling` reset fires after `isScrollingResetDelay` (150 ms default) and triggers a React update; flush it inside `act` or use fake timers advanced inside `act`, or you get "not wrapped in act" warnings.
- ResizeObserver does not exist in jsdom; the virtualizer tolerates that. Stub it only when testing resize-driven re-measurement.
- Assert on the window of rendered items (first and last `data-index`, count within a range), `getTotalSize()` as the inner element's height, and that off-screen content is absent. Do not assert on all rows.
- The built-in scroller calls `element.scrollTo?.({ top, behavior })`. Assign a fake `scrollTo` on the scroller that sets `scrollTop` and dispatches a `scroll` event, then assert on the rendered window. Or inject `scrollToFn` in options and assert on the offset it receives.
- Unit tests prove wiring only. Real measurement, jumping, and sticky behavior need a browser.

## Testing In A Browser

Use browser-mode component tests or end-to-end tests on a production build for:

- Fast scroll up and down with variable heights, checking that the first visible row's `getBoundingClientRect().top` does not jump between frames when content above resizes.
- `scrollToIndex` to far indexes with dynamic rows, ending on the right row.
- Resize of the window and container; font load; zoom.
- Chat: prepend keeps the same message in place, append follows only when pinned, streaming growth stays pinned.
- Sticky headers and pinned columns stay fixed through scroll.
- Keyboard navigation reaches rows that start unmounted, and focus remains after scrolling.
- iOS Safari momentum scroll with content that resizes above the viewport (real device or emulation; the virtualizer defers scroll writes there).
- Screenshot or trace of the final state as the repeatable artifact.
