# Advanced Interaction Hooks

## `useMove`

Normalized scrubbing inside an element (`x`/`y` in 0–1). Ideal for custom sliders/color areas.

```tsx
import { clamp, useMove } from '@mantine/hooks';

const [value, setValue] = useState(0.3);
const { ref, active } = useMove(({ x }) => setValue(clamp(x, 0, 1)));
```

Helpers: `clampUseMovePosition`. Optional scrub start/end handlers and `dir: 'ltr' | 'rtl'`.

## `useRadialMove`

Angular scrubbing for knobs/dials. Use `normalizeRadialValue` when mapping angles.

## `useDrag`

Pointer drag gestures (mouse + touch via Pointer Events).

```tsx
const { ref, active } = useDrag(
  (state) => {
    if (state.first) {
      /* capture start */
    }
    // state.movement, delta, velocity, direction, elapsedTime, first/last/active/tap
  },
  {
    axis: 'x', // 'x' | 'y' | 'lock'
    threshold: 5,
    filterTaps: true,
    tapThreshold: 3,
    enabled: true,
  }
);
```

- Set CSS `touch-action: none` (or `pan-y` / `pan-x`) so touch dragging is not stolen by scroll.
- Use `filterTaps` + `threshold` to distinguish click vs drag.
- Types: `UseDragState`, `UseDragOptions`, `UseDragReturnValue`.

## `useCollapse` / `useHorizontalCollapse`

Hook form of height/width collapse animation (`0` ↔ `auto`).

```tsx
const [expanded, { toggle }] = useDisclosure(false);
const { state, getCollapseProps } = useCollapse({
  expanded,
  transitionDuration: undefined, // auto from content size when omitted
  keepMounted: false,
  onTransitionStart: () => {},
  onTransitionEnd: () => {},
});

return <div {...getCollapseProps()}>…</div>;
```

- Always pass the `ref` from `getCollapseProps` to the collapsible node.
- `useHorizontalCollapse` animates width instead.
- Uses React 19 `useEffectEvent` for stable callbacks.

## `useMask`

Attach input masking via ref callback. Tokens: `9` digit, `a` letter, `A` upper, `*` alnum, `#` digit/sign; `?` starts optional tail; `\Token` escapes.

```tsx
const { ref, value, rawValue, isComplete, reset } = useMask({
  mask: '(999) 999-9999',
  onComplete: (masked, raw) => {},
  onChangeRaw: (raw, masked) => {},
});

return <input ref={ref} />;
```

Also: `modify` for dynamic masks, custom `tokens`, regex-array masks, `formatMask` / `unformatMask` / `isMaskComplete` / `generatePattern`.

## `useRovingIndex`

Roving tabindex for toolbars/menus/grids.

```tsx
const { getItemProps, focusedIndex, setFocusedIndex } = useRovingIndex({
  total: items.length,
  orientation: 'horizontal', // 'vertical' | 'both'
  loop: true,
  columns: undefined, // set for 2D grid
  activateOnFocus: false,
  isItemDisabled: (index) => false,
  dir: 'ltr',
});

items.map((item, index) => (
  <button key={item} type="button" {...getItemProps({ index })}>
    {item}
  </button>
));
```

## `useSplitter`

Resizable panels with keyboard steps, collapse, redistribute modes (`nearest` | `equal` | custom), and double-click reset.

```tsx
const splitter = useSplitter({
  orientation: 'horizontal',
  panels: [
    { defaultSize: 30, min: 15, collapsible: true },
    { defaultSize: 70, min: 20 },
  ],
});

// Container: ref={splitter.ref} + flex/grid layout
// Panels: size from splitter.sizes[i] (apply as width/height %)
// Handles: {...splitter.getHandleProps({ index })} between panels
// Also: sizes, collapsed, activeHandle, setSizes, collapse, expand, toggleCollapse, reset
```

Sizes accept `%` / `px` / `rem` / bare numbers (flexible %). `getHandleProps` already sets `role="separator"`, ARIA value attrs, and keyboard handlers — keep `touch-action: none` on handles.

## Scroll helpers

| Hook | Role |
| --- | --- |
| `useScrollIntoView` | Imperative scroll target into view with axis/offset/easing |
| `useScrollSpy` | Active heading/section from scroll position |
| `useScroller` | Programmatic container scrolling + scroll state |
| `useHeadroom` | Pin/hide chrome from scroll |
| `useScrollDirection` | Up/down (and related) direction signal |
| `useWindowScroll` | Window scroll position + `scrollTo` |

## Floating window

```tsx
const { ref, setPosition, isDragging } = useFloatingWindow({
  enabled: true,
  constrainToViewport: true,
  dragHandleSelector: '[data-drag-handle]',
  axis: undefined, // or 'x' | 'y'
  onPositionChange: ({ x, y }) => {},
});
```

Returns a root `ref`, `setPosition`, and `isDragging`. Optional drag-handle / exclude selectors control which subtree starts a drag.

## File dialog

`useFileDialog(options?)` — open native file picker and read selected files without wiring hidden `<input type="file">` manually.
