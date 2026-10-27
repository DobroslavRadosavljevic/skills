# Candidate Signals

Match on behavior, not only on names. Confirm each hit by reading the code.

| Custom pattern | Mantine replacement |
| --- | --- |
| `useState(false)` + `open`/`close`/`toggle` helpers, `useBoolean`, `useModal` | `useDisclosure` |
| Cycle through a list of values | `useToggle` |
| Array state with add/remove/reorder helpers | `useListState` |
| `useState` + `localStorage`/`sessionStorage` sync, `storage` event | `useLocalStorage`, `useSessionStorage` |
| `useDebounce`, `setTimeout` in effect to delay a value | `useDebouncedValue` / `useDebouncedState` |
| Debounced function with `lodash.debounce` in `useMemo`/`useRef` | `useDebouncedCallback` |
| Throttled value or callback | `useThrottledValue` / `useThrottledState` / `useThrottledCallback` |
| `mousedown`/`touchstart` on `document` and `ref.contains(target)` | `useClickOutside` |
| `keydown` listener that checks key combos | `useHotkeys`, `getHotkeyHandler` |
| `window.matchMedia` in effect | `useMediaQuery`, `useColorScheme`, `useReducedMotion` |
| `window` `resize` listener for width/height | `useViewportSize`, `useWindowEvent` |
| `ResizeObserver` on a ref | `useResizeObserver`, `useElementSize` |
| `IntersectionObserver` on a ref | `useIntersection`, `useInViewport` |
| `MutationObserver` | `useMutationObserver` |
| `navigator.clipboard.writeText` + "copied" timeout | `useClipboard` |
| `requestFullscreen` / `fullscreenchange` | `useFullscreenDocument`, `useFullscreenElement` |
| Focus trapping, focus return | `useFocusTrap`, `useFocusReturn` |
| `setInterval` / `setTimeout` lifecycle hooks | `useInterval`, `useTimeout` |
| `usePrevious`, `useIsFirstRender`, `useMounted` | `usePrevious`, `useIsFirstRender`, `useMounted` |
| `useIsomorphicLayoutEffect` | `useIsomorphicEffect` |
| Merge several refs | `useMergedRef`, `mergeRefs` |
| Controlled/uncontrolled value prop logic | `useUncontrolled` |
| `online`/`offline` listeners | `useNetwork` |
| Idle detection | `useIdle` |
| Page visibility, page leave | `useDocumentVisibility`, `usePageLeave` |
| Document title / favicon effects | `useDocumentTitle`, `useFavicon` |
| Scroll position, scroll to top, scroll spy | `useWindowScroll`, `useScrollIntoView`, `useScrollSpy` |
| Hover state via `mouseenter`/`mouseleave` | `useHover` |
| Pointer drag/move/slider math | `useMove`, `useDrag`, `useRadialMove` |
| Pagination math | `usePagination` |
| Undo/redo state | `useStateHistory` |
| Queue with limit | `useQueue` |
| `clamp`, `randomId`, `range`, `upperFirst`, `lowerFirst` utils | same names from `@mantine/hooks` |

Check the full list in the companion skill's catalog. Do not invent hooks that are not exported by the installed version.
