# @mantine/hooks Catalog

Snapshot aligned with **9.5.0** exports. Doc URL pattern: `https://mantine.dev/hooks/<kebab-name>/` (LLM: `https://mantine.dev/llms/hooks-<kebab-name>.md`).

## State

| Hook | Summary |
| --- | --- |
| `useDisclosure` | Boolean open/close/toggle/set + callbacks |
| `useToggle` | Cycle values |
| `useCounter` | Number with min/max handlers |
| `useListState` | Array + mutation handlers |
| `useSetState` | Shallow object merge state |
| `useMap` / `useSet` | Reactive Map/Set |
| `useQueue` | Limited visible state + overflow queue |
| `usePagination` | Pagination model for custom UI |
| `useSelection` | Selection collection helpers |
| `useStateHistory` | Undo/redo value history |
| `useUncontrolled` | Controlled/uncontrolled bridge |
| `useInputState` | Input event-or-value setter |
| `useValidatedState` | Current + last valid value |
| `usePrevious` | Previous render value |
| `useForceUpdate` | Force re-render |

## Storage / document

| Hook / util | Summary |
| --- | --- |
| `useLocalStorage` | State synced to `localStorage` |
| `useSessionStorage` | State synced to `sessionStorage` |
| `readLocalStorageValue` | Non-React localStorage read |
| `readSessionStorageValue` | Non-React sessionStorage read |
| `useHash` | URL hash state |
| `useDocumentTitle` | Set document title |
| `useDocumentVisibility` | Page visibility |
| `useFavicon` | Set favicon |

## Events / focus / pointer

| Hook | Summary |
| --- | --- |
| `useClickOutside` | Outside click/touch handler + ref |
| `useHotkeys` | Global hotkey registrations |
| `getHotkeyHandler` | Element `onKeyDown` hotkeys |
| `useFocusTrap` | Focus trap ref |
| `useFocusReturn` | Restore focus on close |
| `useFocusWithin` | Focus within element tree |
| `useHover` | Hover state + ref |
| `useMouse` | Mouse position relative to element |
| `useMousePosition` | Document mouse position |
| `useLongPress` | Long-press gesture |
| `useTextSelection` | Current text selection |
| `usePageLeave` | Document mouse leave |
| `useClipboard` | Copy helper + `copied` flag |
| `useFullscreenDocument` | Fullscreen `documentElement` |
| `useFullscreenElement` | Fullscreen specific element |
| `useWindowEvent` | Window event listener |
| `useEventListener` | Element event listener ref |
| `useEyeDropper` | EyeDropper API wrapper |

## Observers / environment

| Hook | Summary |
| --- | --- |
| `useMediaQuery` | `matchMedia` subscription |
| `useColorScheme` | Prefers color scheme |
| `useReducedMotion` | Prefers reduced motion |
| `useResizeObserver` | Element content rect |
| `useElementSize` | Width/height convenience |
| `useViewportSize` | Window size |
| `useIntersection` | IntersectionObserver entry |
| `useInViewport` | Boolean in-viewport |
| `useMutationObserver` | MutationObserver on ref |
| `useMutationObserverTarget` | Observe external target |
| `useNetwork` | Online/connection info |
| `useOs` | OS detection |
| `useOrientation` | Screen orientation |
| `useIdle` | Idle timeout |

## Timing / async

| Hook | Summary |
| --- | --- |
| `useDebouncedValue` | Debounce a changing value |
| `useDebouncedState` | Debounced state setter |
| `useDebouncedCallback` | Debounced callback |
| `useThrottledValue` | Throttle a changing value |
| `useThrottledState` | Throttled state setter |
| `useThrottledCallback` | Throttled callback |
| `useTimeout` | Timeout controls |
| `useInterval` | Interval controls |
| `useFetch` | Thin fetch + abort/refetch |

## Interaction builders

| Hook | Summary |
| --- | --- |
| `useMove` | 0–1 scrub inside element |
| `useRadialMove` | Angular scrub |
| `useDrag` | Pointer drag gesture |
| `useCollapse` | Animate height 0↔auto |
| `useHorizontalCollapse` | Animate width 0↔auto |
| `useMask` | Input mask via ref |
| `useRovingIndex` | Roving tabindex navigation |
| `useSplitter` | Resizable panels |
| `useFloatingWindow` | Draggable floating panel |
| `useFileDialog` | Native file picker |
| `useScrollIntoView` | Scroll element into view |
| `useScrollSpy` | Active section from scroll |
| `useScroller` | Programmatic scroller |
| `useHeadroom` | Header show/hide on scroll |
| `useScrollDirection` | Scroll direction |
| `useWindowScroll` | Window scroll position |

## Lifecycle / ids / refs

| Hook / util | Summary |
| --- | --- |
| `useId` | Stable id |
| `useMergedRef` / `mergeRefs` / `assignRef` | Compose refs |
| `useIsomorphicEffect` | SSR-safe layout effect |
| `useDidUpdate` | Effect skip mount |
| `useShallowEffect` | Shallow dep effect |
| `useIsFirstRender` | First render flag |
| `useMounted` | Mounted flag |
| `useLogger` | Dev logger |
| `useCallbackRef` | Stable callback ref util |

## Pure utils

`clamp`, `lowerFirst`, `upperFirst`, `randomId`, `range`, `shallowEqual`, `clampUseMovePosition`, `normalizeRadialValue`, `formatMask`, `unformatMask`, `isMaskComplete`, `generatePattern`.
