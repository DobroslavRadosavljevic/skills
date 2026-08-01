---
name: mantine-hooks
description: "Build, review, debug, migrate, or plan React code with @mantine/hooks only (standalone React hooks package). Use for useDisclosure, useToggle, useListState, useLocalStorage, useSessionStorage, useHotkeys, getHotkeyHandler, useClickOutside, useDebouncedValue, useDebouncedState, useDebouncedCallback, useThrottledValue, useMediaQuery, useColorScheme, useReducedMotion, useMergedRef, useMove, useDrag, useMask, useCollapse, useHorizontalCollapse, useRovingIndex, useSplitter, useFloatingWindow, useUncontrolled, useFocusTrap, useIntersection, useResizeObserver, useFetch, clamp, randomId, and Mantine 8→9 hooks migrations. Do not use for @mantine/core components, @mantine/form, themes, or other Mantine packages."
---

# Mantine Hooks

Use this skill for **`@mantine/hooks` only** — the standalone React hooks package. Do not pull in `@mantine/core`, `@mantine/form`, or other `@mantine/*` packages unless the user explicitly asks for them outside this skill.

Prefer current docs over memory. Pin narrative to **`@mantine/hooks@9.x`** (npm `latest` snapshot: **9.5.0**, peer **`react@^19.2.0`**).

## Workflow

1. Inspect the project before changing code:
   - Installed `@mantine/hooks` version and React peer version.
   - Whether the app is SPA-only or SSR/hydrated (affects `getInitialValueInEffect` and media/storage hooks).
   - Which hook families are in play: state, storage, events, observers, timing, or interaction builders.
2. Refresh versions and doc URLs from [source-map.md](references/source-map.md) when behavior or migration matters.
3. For install, imports, utils, SSR defaults, types, and package boundaries, use [setup-core.md](references/setup-core.md).
4. For boolean/list/object/Map/Set state, uncontrolled values, storage, queue, pagination, and history, use [state-storage.md](references/state-storage.md).
5. For click-outside, hotkeys, focus, hover/mouse, clipboard, fullscreen, long-press, and window/document events, use [ui-events.md](references/ui-events.md).
6. For media queries, observers, debounce/throttle, timers, idle/network/OS, and fetch, use [observers-timing.md](references/observers-timing.md).
7. For move/drag/radial, collapse, mask, roving index, splitter, floating window, selection, and scroll helpers, use [advanced-interaction.md](references/advanced-interaction.md).
8. For a full hook index with doc links, use [catalog.md](references/catalog.md).

## Implementation Judgment

- **Import only from `@mantine/hooks`.** Prefer named imports: `import { useDisclosure, clamp } from '@mantine/hooks'`.
- Package is **standalone**: React peer only. Safe in any React web app without other Mantine packages. State-management hooks (e.g. `usePagination`, `useQueue`) also work in React Native; DOM/window hooks do not.
- **React 19.2+** is required for 9.x. Several hooks use React 19 `useEffectEvent` (`usePageLeave`, `useWindowEvent`, `useHotkeys`, `useClickOutside`, `useCollapse`) — do not force `useCallback` wrappers just to keep listeners stable.
- Prefer **exported option/return types** (`UseDisclosureOptions`, or namespace forms like `useDisclosure.Options`) over reinventing shapes.
- **SSR-sensitive hooks** (`useMediaQuery`, `useColorScheme`, `useReducedMotion`, `useLocalStorage` / `useSessionStorage`, viewport size): default path calculates after mount via `getInitialValueInEffect: true`. Pass an explicit `initialValue` / `defaultValue` for the server render; set `getInitialValueInEffect: false` only for CSR-only apps that need the real value on first paint.
- Combine ref-returning hooks with **`useMergedRef` / `mergeRefs`** (e.g. `useClickOutside` + `useFocusTrap` + local ref).
- Debounce triad:
  - `useDebouncedValue` — controlled source value stays immediate; debounced copy for effects/search.
  - `useDebouncedState` — setter itself is debounced (uncontrolled-style).
  - `useDebouncedCallback` — debounce a function (`flush` / `cancel` / `isPending`).
- Same split for throttle: `useThrottledValue` / `useThrottledState` / `useThrottledCallback`.
- **Fullscreen:** use `useFullscreenDocument` or `useFullscreenElement` — there is no single `useFullscreen` export in 9.x.
- **Mouse:** `useMouse` is element-ref based; `useMousePosition` tracks document-level position.
- Callback-ref hooks (`useResizeObserver`, `useMouse`, `useMutationObserver`, many interaction hooks) tolerate dynamic node swaps — prefer the returned ref callback over stale `useRef` assignment patterns.
- `useFetch` is a thin fetch helper, not a server-state library — fine for small one-off loads; do not treat it as Query/SWR.
- Keep examples and generated code **free of other Mantine packages** unless the surrounding project already depends on them and the user asked for that surface.

## Migration traps (8 → 9)

- Peer React **19.2+**.
- `useFullscreen` → `useFullscreenDocument` / `useFullscreenElement`.
- `useMouse` split → `useMouse` + `useMousePosition`.
- `useResizeObserver` / `useMutationObserver` → callback-ref APIs; `useMutationObserverTarget` for external nodes.
- `useDisclosure` gains `handlers.set(boolean)`.
- Renamed types: `UseScrollSpyReturnType` → `UseScrollSpyReturnValue`, `StateHistory` → `UseStateHistoryValue`, `OS` → `UseOSReturnValue`.
- `useMediaQuery` dropped very-old Safari `matchMedia` fallbacks.

## Verification

Prefer the repo's existing checks. For meaningful `@mantine/hooks` work, include the relevant subset:

- Typecheck against installed `@mantine/hooks` declarations and exported option/return types.
- Confirm imports resolve only from `@mantine/hooks` (no accidental `@mantine/core` for hook-only tasks).
- SSR/hydration: assert server HTML uses intended initial values for media/storage hooks; no flash regressions when changing `getInitialValueInEffect`.
- Interaction tests: outside-click nodes (use state callbacks for multi-node lists), hotkey `mod` cross-platform, focus trap + merged refs, debounce `cancel`/`flush` on unmount.
- Migration scan for removed `useFullscreen`, old mouse/observer ref patterns, and renamed types.
