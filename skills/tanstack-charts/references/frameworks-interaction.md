# Frameworks, Interaction, And SSR

## React Quick Pattern

```tsx
import { useMemo } from 'react'
import { scaleBand, scaleLinear } from 'd3-scale'
import { barY, defineChart } from '@tanstack/charts'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/react-charts'

interface AlphabetRow {
  letter: string
  frequency: number
}

export function LetterFrequencyChart({
  rows,
  accent,
}: {
  rows: readonly AlphabetRow[]
  accent: string
}) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: 'letter',
            y: 'frequency',
            fill: accent,
          }),
        ],
        x: { scale: () => scaleBand().padding(0.18) },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: 'Frequency' },
        },
        animate: true,
        tooltip,
      }),
    [rows, accent],
  )

  return (
    <Chart
      definition={definition}
      height={320}
      ariaLabel="English letter frequencies"
    />
  )
}
```

Keep fixed definitions at module scope. Memoize only when the definition captures component values. Do not add unnecessary component generics or casts—the definition infers datum and callback types.

## React Chart Props (Essentials)

Required:

- `definition`
- `ariaLabel`

Common:

- `height` (default `320` without aspect ratio)
- `width` (omit for responsive container width)
- `aspectRatio` (when height omitted)
- `initialWidth` (default `640` for SSR / first frame)
- `ariaDescription`, `className`, `style`, `tabIndex`
- `onFocusChange`, `onFocusGroupChange`, `onSelect`, `onRender`
- `idPrefix`, `renderSvg`, `measureText` for advanced SSR/resources

Definition-owned (not overridden by adapter props): `focus`, `maxFocusDistance`, `spatialIndex`, `animate`, `keyboard`, `tooltip`.

### React Entry Points

| Import | Use |
| --- | --- |
| `@tanstack/react-charts` | Default SVG `Chart` (native tooltip, no React body bridge) |
| `@tanstack/react-charts/canvas` | Optional Canvas `Chart` |
| `@tanstack/react-charts/core` | Application-supplied `renderer` |
| `@tanstack/react-charts/tooltip` | `Chart` / `CanvasChart` / `RendererChart` with `renderTooltipBody` |

Existing `renderTooltipBody` users must import from `/tooltip`, not the root.

## Sizing

| Props | Behavior |
| --- | --- |
| No `width`, fixed `height` | Host `width: 100%`; scene uses measured width × height |
| Fixed `width` + `height` | Fixed box and scene |
| `aspectRatio` without height | Measured width / ratio |
| Neither height nor aspect ratio | Default height `320` |

`initialWidth` drives server/hidden first paint when width is responsive. Fixed `height` wins over `aspectRatio`.

Outer structure: `.ts-chart-host` → `.ts-chart-surface` → `svg.ts-chart` or Canvas root. Adapter `className`/`style` apply to the outer host.

## Tooltips And Focus

Enable defaults:

```ts
import { tooltip } from '@tanstack/charts/tooltip'

defineChart({
  marks,
  x,
  y,
  tooltip,
})
```

Focus modes:

| Mode | Result |
| --- | --- |
| omitted | Nearest point in 2D (`maxFocusDistance` default 48) |
| `nearest-x` / `nearest-y` | Axis-prioritized nearest |
| `group-x` / `group-y` | One point per group at nearest axis value |

Grouped multi-series tooltips:

```ts
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'

defineChart({
  marks,
  x,
  y,
  focus: 'group-x',
  tooltip: {
    use: tooltip,
    portal,
    anchor: 'group-center',
    placement: ['top', 'right', 'left', 'bottom'],
    sort: 'color-domain',
  },
})
```

Anchors: `'point'` (default), `'pointer'`, `'group-center'`, coordinate objects (`{ x: 'value', y: 'plot-top' }`), or a custom resolver. Use `portal` to escape `overflow: hidden` / stacking contexts (Popover top-layer when available; fixed body fallback otherwise)—not `portal: true`.

Custom row order / formatters:

```ts
tooltip: {
  use: tooltip,
  items: [
    { channel: 'y', label: 'Revenue', text: (point) => currency(point.yValue) },
    { field: 'status', label: 'Status' },
    'x',
  ],
  // or format / formatGroup / content
}
```

Precedence: `content` → `formatGroup` → `format` → automatic. Bars/areas with explicit baselines report interval length (segment value), not cumulative endpoint.

React tooltip body composition:

```tsx
import { Chart } from '@tanstack/react-charts/tooltip'

<Chart
  definition={definition}
  ariaLabel="Revenue"
  renderTooltipBody={({ defaultBody, pinned, dismiss }) => (
    <div>
      {defaultBody}
      {pinned ? (
        <button type="button" onClick={dismiss}>
          Close
        </button>
      ) : null}
    </div>
  )}
/>
```

Keep interactive controls behind `pinned`. Transient tooltips are inert to pointer input. Context also exposes `points` and `content`.

Keyboard (when enabled): focus enters first point; arrows navigate; Home/End extremes; Enter/Space select/pin; Escape dismisses sticky tooltip. Pointer and keyboard must expose the same semantic state. `tabIndex` defaults to `0`; `keyboard: false` forces `-1`.

### Application-Owned Gestures

Brush, zoom, scrubbers, and editors are application-owned. Invert pixels through a copied chart scale from `onRender` / `host.getScene()`, then rebuild the definition with a configured domain. Disable native focus when it conflicts:

```ts
import { focusDisabled } from '@tanstack/charts/focus/disabled'

defineChart(definition, {
  focus: focusDisabled,
  keyboard: false,
})
```

## Themes

Charts inherit `currentColor` and `--ts-chart-1` … `--ts-chart-6` from the container. Prefer CSS variables for branding:

```css
.revenue-chart {
  color: var(--foreground);
  --ts-chart-1: #2563eb;
  --ts-chart-2: #f97316;
}
```

Use definition `theme` only when a chart needs explicit scene colors. Semantic status should remain distinguishable without color alone. Legends are visual guidance and hidden from the SVG a11y tree—also expose meaning via labels, HTML, or a table.

## Animation

```ts
defineChart({
  marks,
  x,
  y,
  animate: true,
  // or { duration: 280, easing: 'ease-out', respectReducedMotion: true, resize: false }
})
```

`respectReducedMotion` defaults to `true`. `resize: false` (default) avoids restarting animation on responsive relayout. Static SVG / SSR / `createChartScene` do not animate. Stable keys preserve continuity.

## SSR And Hydration

- SVG adapters emit complete accessible SVG at `initialWidth` on the server, then adopt/reconcile on the client.
- Canvas adapters emit an accessible shell (no pixel paint on server); client paints after mount.
- Keep definitions, transformed data, formatters, and dimensions deterministic across server and client.
- Do not branch to a different chart component tree solely because code is on the server.
- React generates a sanitized `idPrefix` from `useId()` when omitted.
- Angular/Lit/Alpine SSR contracts are weaker or browser-oriented—verify the selected adapter docs.

Deterministic server SVG without a framework:

```ts
import { createChartRuntime, renderChartSvg } from '@tanstack/charts'

const runtime = createChartRuntime()
const scene = runtime.render(definition, { width: 720, height: 400 })
const svg = renderChartSvg(scene, {
  ariaLabel: 'Daily traffic',
  idPrefix: 'traffic',
})
runtime.destroy()
```

## Other Framework Adapters

Same definition works across adapters. Mounting APIs differ (component, directive, custom element). React and Octane currently provide `/canvas` and `/core` entries; other adapters are SVG-first at `0.3.1`.

Tooltip body composition surfaces:

| Adapter | Surface |
| --- | --- |
| React / Preact / Solid / Octane | `renderTooltipBody` (React: via `/tooltip` entry) |
| Vue | `#tooltipBody` slot |
| Svelte | `tooltipBody` snippet |
| Angular | tooltip body template binding |
| Lit / Alpine | `renderTooltipBody` in options |

## Callbacks

`ChartPoint` carries original `datum`, keys, group label, typed `xValue`/`yValue`, optional interval hints, pixel `x`/`y`, and resolved color. Product logic should read `point.datum`; use pixels only for overlay positioning.
