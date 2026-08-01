# UI and Event Hooks

## Outside click

```tsx
import { useClickOutside } from '@mantine/hooks';

const ref = useClickOutside(() => onClose(), ['mousedown', 'touchstart'], nodes?, enabled?);
```

- Default events: `mousedown`, `touchstart`.
- Pass `events` as `null` when using the third `nodes` argument without changing events.
- Multi-node lists must use **callback refs / `useState`**, not `useRef`, so nodes update on render.
- Fourth arg `enabled` toggles the listener (default `true`).

## Hotkeys

```tsx
import { useHotkeys, getHotkeyHandler } from '@mantine/hooks';

useHotkeys([
  ['mod+K', (event) => openSearch()],
  ['mod+S', save, { preventDefault: true }],
  ['ArrowLeft', back, { usePhysicalKeys: true }],
]);

// Element-scoped
<input
  onKeyDown={getHotkeyHandler([
    ['mod+Enter', submit],
    ['Escape', cancel],
  ])}
/>
```

- `mod` → ⌘ on macOS, Ctrl on Windows/Linux.
- Whitespace in hotkey strings is allowed (`mod + Shift + X`).
- Use `[plus]` for the `+` key.
- Defaults: `preventDefault: true`; ignores input-like tags unless configured; `triggerOnContentEditable` defaults `false`.
- Types: `HotkeyItem`, `HotkeyItemOptions`.

## Focus

| Hook | Role |
| --- | --- |
| `useFocusTrap(active?)` | Trap focus inside ref element |
| `useFocusReturn({ opened, shouldReturnFocus? })` | Restore focus when overlay closes |
| `useFocusWithin()` | `{ focused, ref }` for element or descendants |
| `useMergedRef` | Combine trap + outside + local refs |

## Pointer / hover

```tsx
const { hovered, ref } = useHover();
const { x, y, ref } = useMouse({ resetOnExit: true }); // element-relative callback ref
const { x, y } = useMousePosition(); // document-level (9.x split)
```

- `useLongPress(handler, options?)` — press-and-hold.
- `useTextSelection()` — current `Selection` / text.
- `usePageLeave(handler)` — mouse leaves document.

## Clipboard and fullscreen

```tsx
const clipboard = useClipboard({ timeout: 1000 });
clipboard.copy('text');
clipboard.copied; // boolean until timeout

const { toggle, fullscreen } = useFullscreenDocument();
const { ref, toggle, fullscreen } = useFullscreenElement();
```

No `useFullscreen` export in 9.x — migrate to the document/element pair. Mobile Safari may only fullscreen media elements.

## Window / document listeners

| Hook | Role |
| --- | --- |
| `useWindowEvent(type, listener, options?)` | `window` listener with Effect Event stability |
| `useEventListener(type, listener, options?)` | Listener ref to attach to an element |
| `useWindowScroll()` | `[scroll, scrollTo]` for `window` |
| `useHeadroom({ fixedAt? })` | Show/hide on scroll direction (headers) |
| `useScrollDirection()` | Current scroll direction enum |
| `useIdle(timeout, options?)` | User idle detection |
| `useNetwork()` | Online/offline + connection info when available |
| `useOs(options?)` | OS detection (`UseOSReturnValue`) |
| `useOrientation(options?)` | Screen orientation |

## Eye dropper

`useEyeDropper()` wraps the EyeDropper API when available (`open`, supported flag). Feature-detect before relying on it in production UI.
