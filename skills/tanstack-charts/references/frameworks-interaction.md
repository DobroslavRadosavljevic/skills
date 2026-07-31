# Frameworks, Interaction, And SSR

## React Quick Pattern

```tsx
import { useMemo } from 'react'
import { scaleBand, scaleLinear } from 'd3-scale'
import { barY, defineChart } from '@tanstack/charts'
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
        y: { scale: scaleLinear, nice: true, grid: true },
        animate: true,
        tooltip: true,
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
- `renderTooltipBody` for React content inside the native tooltip surface
- `idPrefix`, `renderSvg`, `measureText` for advanced SSR/resources

Definition-owned (not overridden by adapter props): `focus`, `maxFocusDistance`, `spatialIndex`, `animate`, `keyboard`, `tooltip`.

## Sizing

| Props | Behavior |
| --- | --- |
| No `width`, fixed `height` | Host `width: 100%`; scene uses measured width × height |
| Fixed `width` + `height` | Fixed box and scene |
| `aspectRatio` without height | Measured width / ratio |
| Neither height nor aspect ratio | Default height `320` |

`initialWidth` drives server/hidden first paint when width is responsive.

## Tooltips And Focus

Enable defaults:

```ts
defineChart({
  marks,
  x,
  y,
  tooltip: true,
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
defineChart({
  marks,
  x,
  y,
  focus: 'group-x',
  tooltip: {
    anchor: 'group-center',
    placement: ['top', 'right', 'left', 'bottom'],
    sort: 'color-domain',
    portal: true,
  },
})
```

Use `portal: true` to escape `overflow: hidden` / stacking contexts.

React tooltip body composition:

```tsx
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

Keep interactive controls behind `pinned`. Transient tooltips are inert to pointer input.

Keyboard (when enabled): focus enters first point; arrows navigate; Home/End extremes; Enter/Space select/pin; Escape dismisses sticky tooltip. Pointer and keyboard must expose the same semantic state.

## Themes

Charts inherit `currentColor` and `--ts-chart-1` … `--ts-chart-6` from the container. Prefer CSS variables for branding:

```css
.revenue-chart {
  color: var(--foreground);
  --ts-chart-1: #2563eb;
  --ts-chart-2: #f97316;
}
```

Use definition `theme` only when a chart needs explicit scene colors. Semantic status should remain distinguishable without color alone.

## SSR And Hydration

- SVG adapters emit complete accessible SVG at `initialWidth` on the server, then adopt/reconcile on the client.
- Canvas adapters emit an accessible shell (no pixel paint on server); client paints after mount.
- Keep definitions, transformed data, formatters, and dimensions deterministic across server and client.
- Do not branch to a different chart component tree solely because code is on the server.
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

Same definition works across adapters. Mounting APIs differ (component, directive, custom element). React and Octane currently provide `/canvas` and `/core` entries; other adapters are SVG-first at `0.0.2`.

Tooltip body composition surfaces:

| Adapter | Surface |
| --- | --- |
| React, Preact, Solid, Octane | `renderTooltipBody` |
| Vue | `#tooltipBody` slot |
| Svelte | `tooltipBody` snippet |
| Angular | tooltip body template binding |
| Lit / Alpine | `renderTooltipBody` in options |

## Callbacks

`ChartPoint` carries original `datum`, keys, group label, typed `xValue`/`yValue`, optional interval hints, pixel `x`/`y`, and resolved color. Product logic should read `point.datum`; use pixels only for overlay positioning.
