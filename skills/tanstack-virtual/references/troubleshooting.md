# Troubleshooting: Symptom To Fix

Check the installed versions first (`@tanstack/react-virtual`, `@tanstack/virtual-core`). Many jump and chat bugs were fixed in 3.15 through 3.18.

## Contents

- Blank or empty list
- Everything renders (no virtualization)
- Wrong total height or scrollbar
- Jumping scroll
- Blank gaps and flicker
- Layout and positioning
- Scroll-to problems
- Render loops and warnings
- State, focus, and data problems
- Chat and infinite lists
- Environment-specific

## Blank Or Empty List

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| No rows at all | Scroller has height 0 (percent height on an auto-height parent, flex child without `min-height: 0`) | Give the scroller a fixed or bounded height. Check `virtualizer.scrollRect` in devtools. |
| No rows at all | `count` is 0, or `enabled: false` | Log `count`; remove `enabled: false` or fix the toggle. |
| No rows at all | `getScrollElement` returns a different element than the scrolling one, or `null` after mount | Return the same node that has `overflow: auto`. Use a ref, not `document.querySelector` during render. |
| No rows only on the server | No layout on the server | Pass `initialRect` (see production patterns). |
| Rows missing in tests | jsdom has no layout | Stub `observeElementRect` and `measureElement`, or `offsetHeight`/`offsetWidth` (see production patterns). |
| Rows render at (0,0) stacked | Items not `position: absolute` with `translateY(item.start)` | Apply the baseline markup. With `directDomUpdates`, do not set the main-axis style and do pass `containerRef`. |
| List vanishes after switching tabs | Hidden list measured 0 | `useCachedMeasurements` before hiding, or remount. |

## Everything Renders (No Virtualization)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| All N rows in the DOM | Scroller is unbounded (grows with content), so the visible rect is huge | Bound the scroller height. |
| All rows in the DOM, rows measure 0 | Measured items collapse (`display: contents`, `height: 0` while loading) | Ensure items have a real box; give a min height. |
| Rows mount for the whole list in a hidden panel | Panel hidden, rect 0 or stale | Render the list only when visible, or reset with `measure()` on show. |

## Wrong Total Height Or Scrollbar

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Scrollbar too short or too long, changes as you scroll | Estimates differ from real sizes | Make `estimateSize` match the average. Use known per-index sizes. For text, estimate by content. |
| Extra empty space at the bottom | `paddingEnd`, margins on rows, or inner container taller than `getTotalSize()` | Remove duplicate padding. Use `gap` or padding instead of row margins (margins are not measured). |
| Last rows cut off | Inner container height not set to `getTotalSize()`, or `contain`/`overflow` clips | Set height on the inner container (or use `containerRef` with `directDomUpdates`). |
| Total off by the header height | Content above the list in the same scroller (or window) with no `scrollMargin` | Set `scrollMargin` to the list offset and subtract it in item transforms. |
| Rows overlap or leave gaps | Fixed CSS `height` on a measured item, or CSS gap not equal to `gap` option | One sizing owner. Match gap. |
| Height wrong after resize | Cached sizes from the old width | Call `measure()` on width or font change. |
| Total keeps changing for tables | Table rows measured with borders in Firefox | Use the default measurer in Firefox, `getBoundingClientRect` elsewhere, as the Table example does. |
| Masonry total is short | Lane choice from poor estimates | `laneAssignmentMode: 'measured'`, better estimates. |

## Jumping Scroll

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Content jumps while scrolling up | Above-viewport rows re-measure after load (images, async content) | Upgrade to core 3.17.1 or newer (re-measures during backward scroll are not compensated). Reserve image space. Improve estimates. Add `overflow-anchor: none`. |
| Jump when a row above grows | Late layout (fonts, images, expanding rows) | Fix sizes up front or call `resizeItem`. Re-measure on `document.fonts.ready`. |
| One-frame jerk after resize | Old versions notified asynchronously after writing `scrollTop` | Upgrade to core 3.17.7 or newer. |
| Scroll position resets on data change | Index keys, or changed `getItemKey` | Use stable ids. Memoize `getItemKey`. |
| Jump when prepending (non-chat) | No end anchoring | Use `anchorTo: 'end'` with stable keys (core 3.16+). |
| Scroll fights the browser | Native scroll anchoring | `overflow-anchor: none` on the scroller. |
| iOS Safari scroll stops abruptly | Scroll writes during momentum | Upgrade to core 3.15 or newer, which defers writes. |
| Smooth `scrollToIndex` ends short | Content prepended mid-animation, or old version | Upgrade to core 3.17.11 or newer. |
| Viewport drifts down during streaming | Old compensation logic | Upgrade to core 3.17.6 or newer; use `anchorTo: 'end'`. |

## Blank Gaps And Flicker

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Blank band at the edge during fast scroll | Overscan too low or rows slow to render | Raise `overscan` (3 to 10). Memoize rows. Use placeholders while `isScrolling`. |
| Rows flash or remount while scrolling | Unstable React keys (index, random ids) | Use `item.key` or the data id. |
| Rows flicker on re-render | `getItemKey` or `rangeExtractor` recreated each render | Wrap in `useCallback`. |
| Images pop in | Rows mount and load on each scroll | Cache images, fixed boxes, `decoding="async"`, keep overscan modest. |
| Popovers or `position: fixed` content inside rows misplaced | `transform` on items creates a stacking context and containing block | Use `directDomUpdatesMode: 'position'` or `top`-based placement, or portal overlays. |
| Whole page stutters | Owner re-renders a heavy tree each scroll | Move the virtualizer down, memoize children, try `directDomUpdates`. |
| Lag spike every scroll tick in dev only | Dev build and StrictMode | Test in production. |

## Layout And Positioning

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Console: ``Missing attribute name 'data-index={index}'`` | Measured element has no `data-index` | Add it to the same element as `measureElement`. With a custom `indexAttribute`, add that attribute. |
| Items offset by a constant | `scrollMargin` set but not subtracted | `item.start - virtualizer.options.scrollMargin`. |
| Table rows drift or overlap | Native table layout plus absolute rows | Use grid and flex layout from the Table example, or spacer rows. |
| Table rows shift left or right | Auto column widths change as rows mount | `table-layout: fixed` and explicit widths. |
| Sticky header covers the target row | `scrollToIndex` ignores the sticky bar | `scrollPaddingStart` equal to the bar height. |
| Sticky group header jumps | Active header uses absolute at the wrong time | Compute the active index in `rangeExtractor`; apply `position: sticky` to it only. |
| Grid cells misaligned | Row and column virtualizers measured the same element with one attribute | Use `indexAttribute` per virtualizer, or fixed sizes. |
| Horizontal list direction wrong in RTL | `isRtl` missing | Set `isRtl: true` and verify in browser. |

## Scroll-To Problems

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `scrollToIndex` lands a few rows off | Dynamic sizes still being measured | The virtualizer corrects while items near the target measure. Keep the scroller mounted. Improve estimates. |
| Programmatic scroll fights the user | In-flight correction | `cancelScroll()` on `wheel`, `touchstart`, `keydown` (core 3.18). |
| `scrollToIndex(last, { align: 'end' })` stops above the padding | `paddingEnd` is not part of an item-aligned scroll since 3.18 | Use `scrollToEnd()`. |
| Nothing happens | Item already visible with `align: 'auto'` | Pass `'start'` or `'center'`. |
| Called before mount | Scroller not set yet | Call in a layout effect or event handler. |
| Smooth scroll stutters | Items measured mid-flight | Use block-translation layout (see sizing reference). |
| Window scroll lands under a sticky site bar | No scroll padding | `scrollPaddingStart`. |

## Render Loops And Warnings

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Maximum update depth exceeded` | Measured items report size 0 (jsdom, hidden, `display: none`) so the range keeps growing | Stub measurement in tests; `useCachedMeasurements` or `enabled: false` when hidden. |
| Infinite re-renders with `getItemKey` | Reported on react-virtual 3.13.13 when `getItemKey` changed identity every render | Upgrade, and memoize `getItemKey` with `useCallback`. |
| `flushSync was called from inside a lifecycle method` | React 19 plus synchronous notify | Upgrade react-virtual to 3.14.13 or newer; else `useFlushSync: false`. |
| `ResizeObserver loop completed with undelivered notifications` | Layout that feeds item size back into itself | Fix the layout feedback. Last resort: `useAnimationFrameWithResizeObserver: true` (adds about a frame of lag). |
| React Compiler "Compilation Skipped: Use of incompatible library" | Known incompatibility | See production patterns. |
| Duplicate key warnings | `getItemKey` not unique | Return ids unique across the whole set. |
| Stale rows with React Compiler | Memoized `getVirtualItems()` results | `'use no memo'` in the component, or `directDomUpdates`. |

## State, Focus, And Data Problems

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Input text or toggles reset on scroll | Row unmounted, local state lost | Lift state to the list owner or a store keyed by row id. |
| Focus lost when the active row scrolls out | Row unmounted | Pin the active index in `rangeExtractor`. |
| Screen reader announces wrong row counts | Missing ARIA counts | `aria-rowcount`, `aria-rowindex`, or `aria-setsize` and `aria-posinset`. |
| Ctrl+F cannot find rows | Rows are not in the DOM | Provide in-app search and `scrollToIndex`. |
| Measurements wrong after filter or sort | Index keys, or same keys with new content | Stable ids; `measure()` if content under the same key changed shape. |
| Lists with different data share sizes | Same keys across datasets | Key the list component by dataset so each owns a virtualizer, or prefix keys. |
| Selection or expansion lost | State tied to index | Key state by row id. |

## Chat And Infinite Lists

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Prepending older messages jumps the view | Missing `anchorTo: 'end'` or index keys | `anchorTo: 'end'` and `getItemKey` by id. |
| New messages do not follow | `followOnAppend` unset, or user is above `scrollEndThreshold` | Set `followOnAppend`; tune `scrollEndThreshold` (50 to 100). |
| New messages pull the user down while reading | Manual `scrollToEnd()` on every append | Remove it; let `followOnAppend` decide, or check `isAtEnd()` first. |
| Fetch fires repeatedly at the end | No fetching guard, or dependency is the `getVirtualItems()` array | Depend on `lastIndex` and guard with `isFetchingNextPage`. |
| Bottom is not reached after streaming | Old clamp bug, `paddingEnd` | Upgrade to core 3.17.9 or newer; use `scrollToEnd()`. |
| "Jump to latest" never updates with `directDomUpdates` | No renders on scroll | Mirror `isAtEnd()` into state from `onChange`. |
| Empty gap above the list after a prepend with `directDomUpdates` | Old react-virtual | Upgrade to 3.14.8 or newer. |

## Environment-Specific

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Hydration mismatch | Server and client first render differ | Same `initialRect`, `initialOffset` on both; avoid reading `window` in render. |
| Firefox table row heights wrong | Border-box quirk | Default measurer for Firefox. |
| Safari overscroll bounce glitch | Writes during bounce | Core 3.15 or newer defers them. |
| Hidden accordion collapses measurements | `display: none` zeroing | `useCachedMeasurements`. |
