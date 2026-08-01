# Setup and Core Patterns

## Install

```bash
bun add @mantine/hooks
```

9.x requires **React 19.2+**. The package has no other runtime dependencies.

## Imports

```tsx
import {
  useDisclosure,
  useHotkeys,
  useMergedRef,
  clamp,
  randomId,
} from '@mantine/hooks';

import type {
  UseDisclosureOptions,
  UseDisclosureHandlers,
  UseStorageOptions,
} from '@mantine/hooks';
```

Namespace types (9.x) are also available on many hooks:

```tsx
import { useDisclosure } from '@mantine/hooks';

const options: useDisclosure.Options = {
  onOpen: () => {},
  onClose: () => {},
};
```

Always import hooks and utils from `@mantine/hooks`. Do not invent subpath imports unless the installed package documents them (current export is `.` only).

## Standalone Usage

- Works in any React web app without installing other Mantine packages.
- State helpers (`usePagination`, `useQueue`, `useListState`, `useCounter`, …) can run in React Native.
- DOM / `window` / `document` hooks require a browser (or test) environment.

## Utils (non-hook exports)

| Export | Role |
| --- | --- |
| `clamp(value, min, max)` | Bound a number |
| `lowerFirst` / `upperFirst` | String case helpers |
| `randomId()` | Generate an id string |
| `range(start, end)` | Inclusive number array |
| `shallowEqual(a, b)` | Shallow compare |
| `useCallbackRef` | Stable callback ref helper |
| `mergeRefs` / `assignRef` | Ref composition without the hook |
| `getHotkeyHandler` | Element-level hotkey `onKeyDown` handler |
| `readLocalStorageValue` / `readSessionStorageValue` | Read storage outside React |
| `clampUseMovePosition` | Clamp `{ x, y }` to 0–1 for `useMove` |
| `normalizeRadialValue` | Normalize angle for `useRadialMove` |
| `formatMask` / `unformatMask` / `isMaskComplete` / `generatePattern` | Mask helpers |

## Ref Composition

Many hooks return a ref object or ref callback. Merge them:

```tsx
import { useRef } from 'react';
import {
  useClickOutside,
  useFocusTrap,
  useMergedRef,
} from '@mantine/hooks';

function Panel({ onClose }: { onClose: () => void }) {
  const localRef = useRef<HTMLDivElement>(null);
  const outsideRef = useClickOutside(onClose);
  const trapRef = useFocusTrap();
  const ref = useMergedRef(localRef, outsideRef, trapRef);

  return <div ref={ref}>…</div>;
}
```

## SSR / Hydration Defaults

Hooks that read browser APIs typically defer the real value until after mount:

| Pattern | Default | When to change |
| --- | --- | --- |
| `useMediaQuery(query, initialValue?, options?)` | Effect-based | Pass SSR `initialValue`; set `getInitialValueInEffect: false` only for CSR-first paint |
| `useColorScheme(initialValue?, options?)` | `'light'` until effect | Pass `'dark'`/`'light'` for server HTML |
| `useReducedMotion(initialValue?, options?)` | Same media-query pattern | Match design-system reduced-motion SSR policy |
| `useLocalStorage` / `useSessionStorage` | `getInitialValueInEffect: true` | Use `false` only when there is no SSR and you need storage on first render |
| `useViewportSize` / resize observers | `0` sizes until measured | Treat first paint as unknown size |

```tsx
import { useMediaQuery, useLocalStorage } from '@mantine/hooks';

// SSR-safe: server + first client paint use `false`, then update
const isMobile = useMediaQuery('(max-width: 48em)', false);

// CSR-only: read storage immediately
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>({
  key: 'color-scheme',
  defaultValue: 'light',
  getInitialValueInEffect: false,
});
```

## React 19 Listener Stability

These hooks use React 19 `useEffectEvent`, so latest callbacks are used without re-binding listeners on every render: `usePageLeave`, `useWindowEvent`, `useHotkeys`, `useClickOutside`, `useCollapse`. Do not add `useCallback` solely for listener identity.

## Package Boundary

This skill stops at `@mantine/hooks`. When generating samples, prefer plain DOM elements over Mantine UI components so the guidance stays package-accurate.
