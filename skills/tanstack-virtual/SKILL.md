---
name: tanstack-virtual
description: "Build, review, debug, migrate, or plan TanStack Virtual list, grid, table, and chat virtualization for React (@tanstack/react-virtual 3.14.x on @tanstack/virtual-core 3.18.x; no v4 is published). Use for useVirtualizer, useWindowVirtualizer, getScrollElement, estimateSize, measureElement, data-index, dynamic row heights, ResizeObserver, overscan, horizontal and grid virtualization (row plus column virtualizers, indexAttribute), lanes and masonry, gap, paddingStart, scrollPaddingStart, scrollMargin, sticky headers, rangeExtractor, getVirtualItems, getTotalSize, scrollToIndex, scrollToOffset, scrollToEnd, cancelScroll, anchorTo end, followOnAppend, reverse and chat lists, infinite scroll with useInfiniteQuery, TanStack Table virtualized rows and columns, SSR initialRect and initialOffset, takeSnapshot scroll restoration, isScrollingResetDelay, useFlushSync, directDomUpdates, containerRef, React 19 and React Compiler behavior, accessibility (aria-rowcount, aria-rowindex, roving focus), jsdom testing, and symptoms like jumping scroll, blank rows, wrong total height, and flicker."
---

# TanStack Virtual

Use this skill when work touches windowed rendering of long lists, grids, tables, feeds, or chat logs with `@tanstack/react-virtual`, or its framework-agnostic core `@tanstack/virtual-core`.

## Workflow

1. Confirm the target before changing code:
   - Installed `@tanstack/react-virtual` and `@tanstack/virtual-core` versions (latest: `3.14.14` / `3.18.0`, 2026-10-09), React version, and whether React Compiler is on. Older apps on 3.13.x lack `anchorTo`, `directDomUpdates`, and `cancelScroll`.
   - The scroller: inner element (`useVirtualizer`) or the page (`useWindowVirtualizer`).
   - Item sizing: fixed, known per index, or measured from the DOM.
   - Data shape: static array, paged or infinite query, prepend-able history, or grouped with sticky headers.
2. Refresh docs when versions or behavior matter. Start from [source-map.md](references/source-map.md). Check for a v4 only through npm `dist-tags`; the `v4` git branch is stale.
3. For install, hook choice, base markup, the options table, and the instance API, use [setup-core.md](references/setup-core.md).
4. For `estimateSize`, `measureElement`, dynamic heights, padding, gap, `scrollMargin`, and every `scrollTo*` method, use [sizing-and-scrolling.md](references/sizing-and-scrolling.md).
5. For horizontal lists, 2D grids, lanes and masonry, sticky items, window scrolling, and `rangeExtractor`, use [layouts.md](references/layouts.md).
6. For chat, logs, reverse feeds, streaming output, `useInfiniteQuery`, and scroll restoration, use [chat-and-infinite.md](references/chat-and-infinite.md).
7. For TanStack Table rows, columns, and sticky headers, use [table-integration.md](references/table-integration.md).
8. For SSR, React 19, React Compiler, `directDomUpdates`, performance, accessibility, and tests, use [production-patterns.md](references/production-patterns.md).
9. For a symptom to fix lookup, use [troubleshooting.md](references/troubleshooting.md).

## Implementation Judgment

- The virtualizer only computes numbers (`start`, `size`, `index`, `key`). You own markup and CSS. A scroller with a fixed or bounded height, an inner element sized to `getTotalSize()`, and items placed with `position: absolute` plus `translateY(item.start)` is the baseline.
- Prefer fixed row heights when design allows. Set the height in CSS, return it from `estimateSize`, and skip `measureElement`. This removes measurement jank entirely.
- For dynamic heights, put `ref={virtualizer.measureElement}` and `data-index={item.index}` on the item root, and never put a fixed `height` on it. Make `estimateSize` close to the average real size.
- Always pass `getItemKey` when data can reorder, filter, or prepend. Index keys tie cached measurements to positions, not rows.
- Use stable references: memoize `getItemKey` and `rangeExtractor` with `useCallback`. Do not rebuild them per render.
- Raise `overscan` (default `1`) to 3 to 10 for heavy rows or fast scrolling. Do not set it to hundreds.
- Subtract `scrollMargin` from `translateY` whenever it is set. Use it for content above the list inside the scroller and for every window virtualizer whose list does not start at page top.
- For chat and logs use `anchorTo: 'end'`, `followOnAppend`, `scrollToEnd()`, and stable keys. Do not use `column-reverse`, inverted transforms, or manual `scrollTop` math.
- `useVirtualizer` returns a stable, mutable instance and re-renders its owner on scroll. Keep it in the lowest component that owns the list. React Compiler marks it as an incompatible library; see the production reference.
- Keep row state outside rows when it must survive scrolling. Off-screen rows unmount.
- Virtualization breaks native find-in-page and can hurt screen reader navigation. Add `aria-rowcount` and `aria-rowindex` (or `aria-setsize` and `aria-posinset`) and keep the focused row mounted via `rangeExtractor`.
- Use `useCachedMeasurements` when a measured list is hidden with `display: none`, or its rows will collapse to size 0.
- Use `useFlushSync: false` when React 19 warns about `flushSync` inside a lifecycle method and upgrading to react-virtual 3.14.13 or newer does not remove it.
- Treat `directDomUpdates` as an opt-in optimization with strict markup rules. Set it once at mount; do not toggle it.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Virtual changes, include the relevant subset:

- Package check proving the used options exist in the installed version (`anchorTo`, `cancelScroll`, `directDomUpdates`, `useCachedMeasurements`).
- Typecheck for generics: `useVirtualizer<HTMLDivElement, HTMLDivElement>` and the row or table element types.
- A test that renders a window of items. In jsdom, stub `observeElementRect` and `measureElement` (see the production reference); never assert that all rows exist.
- Browser smoke on a production build: scroll fast up and down, jump with `scrollToIndex`, resize the window, change data, and watch for jumps, blank gaps, and a wrong scrollbar length.
- Accessibility check of row and column indexes, keyboard movement through unmounted rows, and focus retention.
- Profile with real row components. Dev builds and StrictMode double renders make virtualized lists look slower than production.
