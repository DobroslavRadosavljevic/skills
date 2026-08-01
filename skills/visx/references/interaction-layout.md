# visx Interaction & Layout

Packages: `@visx/responsive`, `@visx/bounds`, `@visx/event`, `@visx/drag`, `@visx/brush`, `@visx/zoom`, `@visx/tooltip`.

## `@visx/responsive`

| Export | Pattern | Provides |
| --- | --- | --- |
| `ParentSize` | render-prop | `{ width, height, top, left, ref, resize }` |
| `useParentSize` | hook | `{ parentRef, node, width, height, … }` |
| `withParentSize` | HOC | `parentWidth` / `parentHeight` |
| `useScreenSize` / `withScreenSize` | window | screen dimensions |
| `ScaleSVG` | viewBox wrapper | stretch fixed-coordinate SVG |
| `debounce` | util | local debounce (lodash removed in v4) |

Defaults: `debounceTime` **300ms**, `enableDebounceLeadingCall` **true**. Measurement via **ResizeObserver** (`resizeObserverPolyfill` optional).

**v4 DOM:** two nested divs (outer 100% + absolute measurement inner). Prefer returned `node` over `parentRef.current`.

**`ParentSizeModern`:** removed since visx 3 — do not use.

```tsx
import { ParentSize } from '@visx/responsive';

<ParentSize debounceTime={150}>
  {({ width, height }) => (width > 10 ? <Chart width={width} height={height} /> : null)}
</ParentSize>
```

SSR: initial size often `0` — pass `initialWidth`/`initialHeight` or guard small widths. Prefer fixed sizes in tests.

Docs: https://visx.airbnb.tech/docs/responsive

## `@visx/bounds`

Only public export: **`withBoundingRects`** (+ `WithBoundingRectsProps`).

Injects `nodeRef`, `rect`, `parentRect`, `getRects()`. **v4:** attach `nodeRef` to the measured DOM node (no `findDOMNode`).

Used by `TooltipWithBounds`. SVG clipping uses `@visx/clip-path` (`RectClipPath`), not this package.

There is **no** `useRect` helper.

Docs: https://visx.airbnb.tech/docs/bounds

## `@visx/event`

```ts
import { localPoint } from '@visx/event';

localPoint(event);           // uses event.target
localPoint(svgNode, event);  // preferred
```

Returns `{ x, y }` or `null`. Touch uses `changedTouches[0]`. Prefer passing the SVG node when targets may be nested non-SVG elements.

**Misnomers:** `getXAndYFromContainer` does not exist; `getXAndYFromEvent` exists in source but is **not** a package-root export.

Docs: https://visx.airbnb.tech/docs/event

## `@visx/drag`

`useDrag(options)` and `<Drag>` (render-prop; needs `width`/`height`).

State: `x`, `y`, `dx`, `dy`, `isDragging`. Handlers: `dragStart`, `dragMove`, `dragEnd`.

Options: `resetOnStart`, `snapToPointer` (default true), `restrict` / `restrictToPath`, controlled coords, callbacks.

`<Drag captureDragArea>` (default true) draws a full-size transparent rect while dragging so events continue off-shape.

`raise(items, index)` — reorder array for SVG paint order.

Docs: https://visx.airbnb.tech/docs/drag

## `@visx/brush`

`<Brush>` maps a pixel selection to **domain** `Bounds`:

```ts
type Bounds = {
  x0: number; x1: number; xValues?: unknown[];
  y0: number; y1: number; yValues?: unknown[];
};
```

Key props: `xScale`, `yScale`, `width`, `height`, `brushDirection` (`'horizontal'|'vertical'|'both'`), `brushRegion`, `margin`, `initialBrushPosition` (**pixel** space), `resizeTriggerAreas`, `handleSize`, `onChange` / `onBrushEnd`, `onClick`, `resetOnEnd`, `useWindowMoveEvents`, `selectedBoxStyle`, `innerRef` (`.reset()`, `.updateBrush()`, `.getExtent()`).

Continuous scales → `x0/x1`/`y0/y1` via invert. Ordinal/band → use `xValues`/`yValues`.

### Overview → detail recipe

1. Full dataset drives overview brush scales.
2. `onBrushChange` filters detail series by domain bounds.
3. Seed `initialBrushPosition` from scale-mapped pixels.
4. Clear with `brushRef.current.reset()` / `onClick`.

```tsx
const onBrushChange = (domain: Bounds | null) => {
  if (!domain) return;
  const { x0, x1, y0, y1 } = domain;
  setFiltered(
    stock.filter((s) => {
      const x = getDate(s).getTime();
      const y = getStockValue(s);
      return x > x0 && x < x1 && y > y0 && y < y1;
    }),
  );
};

<Brush
  xScale={brushDateScale}
  yScale={brushStockScale}
  width={xBrushMax}
  height={yBrushMax}
  margin={brushMargin}
  handleSize={8}
  innerRef={brushRef}
  resizeTriggerAreas={['left', 'right']}
  brushDirection="horizontal"
  initialBrushPosition={initialBrushPosition}
  onChange={onBrushChange}
  onClick={() => setFiltered(stock)}
  selectedBoxStyle={selectedBrushStyle}
  useWindowMoveEvents
/>
```

Gallery: https://visx.airbnb.tech/brush · [Example.tsx](https://github.com/airbnb/visx/blob/v4.0.0/packages/visx-demo/src/sandboxes/visx-brush/Example.tsx)

## `@visx/zoom`

Affine **transform matrix** (not D3 `scaleExtent`/`translateExtent` names). Gestures via `@use-gesture/react` when `zoom.containerRef` is attached.

Props: `width`/`height` (required), `scaleXMin`/`scaleXMax`, `scaleYMin`/`scaleYMax`, `constrain(next, prev)`, `initialTransformMatrix`, `wheelDelta`, `pinchDelta`, `children`.

Children API: `transformMatrix`, `scale`, `translate`, `translateTo`, `setTransformMatrix`, `reset`, `clear`, `center`, drag/wheel/pinch handlers, `containerRef`, `toString()` → SVG matrix, `applyToPoint` / `applyInverseToPoint`.

```tsx
<Zoom width={width} height={height} scaleXMin={0.5} scaleXMax={4}>
  {(zoom) => (
    <svg
      ref={zoom.containerRef}
      width={width}
      height={height}
      style={{ touchAction: 'none', cursor: zoom.isDragging ? 'grabbing' : 'grab' }}
    >
      <RectClipPath id="zoom-clip" width={width} height={height} />
      <g transform={zoom.toString()} clipPath="url(#zoom-clip)">
        {/* marks */}
      </g>
    </svg>
  )}
</Zoom>
```

Clip with `@visx/clip-path`. Prefer an **untransformed overview brush** when combining brush + zoom (avoids coordinate fights).

Docs: https://visx.airbnb.tech/docs/zoom

## `@visx/tooltip`

### State

`useTooltip` / `withTooltip` expose: `showTooltip`, `hideTooltip`, `updateTooltip`, `tooltipOpen`, `tooltipLeft`, `tooltipTop`, `tooltipData`.

In-flow tooltips need a **`position: relative`** wrapper (`withTooltip` adds one; `useTooltip` does not).

### Render

| Component | Notes |
| --- | --- |
| `Tooltip` | Absolute HTML; not bounds-aware |
| `TooltipWithBounds` | Flips when overflowing (uses bounds HOC) |
| `Portal` | `document.body`; supply page coords |
| `TooltipInPortal` from `useTooltipInPortal` | Portal + local→page conversion |

**Cannot** nest HTML tooltips inside `<svg>` — render as siblings.

```tsx
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { localPoint } from '@visx/event';

const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
  useTooltip<Datum>();
const { containerRef, TooltipInPortal } = useTooltipInPortal({
  detectBounds: true,
  scroll: true,
  zIndex: 10,
});

const onMove = (event: React.PointerEvent<SVGElement>) => {
  const pt = localPoint(event);
  if (!pt) return;
  showTooltip({ tooltipLeft: pt.x, tooltipTop: pt.y, tooltipData: nearest });
};

<svg ref={containerRef} onPointerMove={onMove} onPointerLeave={hideTooltip}>
  {/* chart */}
</svg>
{tooltipOpen && (
  <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
    {/* content */}
  </TooltipInPortal>
)}
```

`defaultStyles` applied when `unstyled` is false (v4 source default is **`unstyled = false`** — docs sometimes disagree).

### Floating UI (`@visx/tooltip/floating`)

Documented for **4.1+**. On npm `@visx/tooltip@4.0.0`, package `exports` map only `"."`. Do not teach floating APIs for 4.0.0 until verified on the installed version.

Docs: https://visx.airbnb.tech/docs/tooltip

## Combination patterns

| Pattern | Guidance |
| --- | --- |
| ParentSize → chart | Guard small width; pass numeric size into scales |
| Tooltip + localPoint | Attach `containerRef` to SVG; prefer portal under overflow/modals |
| Zoom + clip | `RectClipPath` + `transform={zoom.toString()}` |
| Brush + zoom | Overview brush untransformed; detail chart separately |
| Zoom + tooltip | Decide root SVG coords vs `applyInverseToPoint` for data space |

## Gotchas

1. Portal z-index — set `zIndex` on portal options.
2. `event.target` quirks — prefer `localPoint(svg, event)`.
3. Brush `onChange(null)` means clear/invalid.
4. `TooltipWithBounds` uses CSS `transform` for flipping — don’t fight it with only `left`/`top`.
5. Zoom needs `touchAction: 'none'` to avoid scroll fights.
6. ResizeObserver required for ParentSize and portal measure.
