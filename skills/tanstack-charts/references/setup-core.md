# Setup And Core API

Snapshot: `@tanstack/charts@0.6.5` (pre-alpha). Pin and re-check when versions move.

## Installation

Install the core and compact scales in every app that authors definitions, then one adapter:

```sh
bun add @tanstack/charts @tanstack/charts-scales @tanstack/react-charts
```

Also declare every `d3-*` module the chart **application source** imports, plus matching `@types`:

```sh
bun add d3-scale
bun add -D @types/d3-scale
```

Add modules only when imported:

```sh
bun add d3-shape
bun add -D @types/d3-shape
```

Do not install the umbrella `d3` package just because one capability is needed. Do not install unscoped `react-charts` for this library.

The core declares `d3-array`, `d3-shape`, `d3-geo`, and (as of `0.6.5`) `d3-scale` for its own features. Those are normal dependencies (tree-shaken when unused), not an application import contract—still declare any `d3-*` the **app source** imports so strict package managers resolve them.

### Compact scales

For common numeric/categorical mappings (preferred starting path):

```sh
bun add @tanstack/charts-scales
```

```ts
import { scaleLinear } from '@tanstack/charts-scales/linear'
import { scaleBand } from '@tanstack/charts-scales/band'
import { scalePoint } from '@tanstack/charts-scales/point'
import { scaleOrdinal } from '@tanstack/charts-scales/ordinal'
```

There is **no** `@tanstack/charts-scales` root export. Use exact `/linear`, `/band`, `/point`, or `/ordinal`. Prefer `d3-scale` for time, UTC, log, power, sequential/diverging/quantile/threshold, piecewise interpolation, or full D3 formatting.

### Adapters And Peers

Same version line as core (`0.6.5`):

| Adapter | Framework peers |
| --- | --- |
| `@tanstack/react-charts` | `react` / `react-dom` `^19.0.0` |
| `@tanstack/react-native-charts` | React `^19.2.3`, React Native `^0.86.0`, `react-native-svg` `>=15.15.4 <16` (experimental) |
| `@tanstack/preact-charts` | `preact` `>=10` |
| `@tanstack/vue-charts` | `vue` `>=3.5` |
| `@tanstack/solid-charts` | `solid-js` `>=1.8` |
| `@tanstack/svelte-charts` | `svelte` `^5.20.0` |
| `@tanstack/angular-charts` | `@angular/core` + `platform-browser` `>=19` |
| `@tanstack/lit-charts` | `lit` `>=3.1.3` |
| `@tanstack/alpine-charts` | `alpinejs` `>=3.15` |
| `@tanstack/octane-charts` | `octane` `^0.1.13` |

Adapters do not replace the core. Definitions and marks still come from `@tanstack/charts` (or `/universal` for React Native shared definitions).

## Ownership Boundary

| Owner | Responsibility |
| --- | --- |
| Application | Data fetch/clean, D3 or TanStack transforms, scale choice/domains, brush/zoom/scrubber state |
| `@tanstack/charts-scales` / D3 modules | Scales, bins, stacks, curves, geo, spatial algorithms (as imported) |
| `@tanstack/charts` | Marks, channels, transforms helpers, responsive ranges, guides, keyed scene, SVG/Canvas/motion, focus/tooltip host |
| Adapter | Framework lifecycle, SSR shell, unmount cleanup |

## Minimal Definition

```ts
import { barY, defineChart } from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts-scales/band'
import { scaleLinear } from '@tanstack/charts-scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'

interface LetterFrequency {
  letter: string
  frequency: number
}

const alphabet: readonly LetterFrequency[] = [
  { letter: 'E', frequency: 0.12702 },
  { letter: 'T', frequency: 0.09056 },
  { letter: 'A', frequency: 0.08167 },
]

const chart = defineChart({
  marks: [barY(alphabet, { x: 'letter', y: 'frequency' })],
  x: { scale: () => scaleBand<string>().padding(0.18) },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: 'Frequency' },
  },
  tooltip,
})
```

Both positional scales are required when marks materialize those dimensions. Positionless charts (for example frame-only) may omit unused axes deliberately.

## Scales

Pass a **factory** when the domain should follow mark channels:

```ts
x: { scale: scaleUtc, nice: true, axis: { label: 'Date' } }
y: {
  scale: scaleLinear,
  nice: true,
  grid: true,
  axis: { label: 'Close (USD)' },
}
```

Return a configured factory when options are needed before inference:

```ts
x: { scale: () => scaleBand<string>().padding(0.18) }
```

Pass a **configured instance** when the domain is application-owned (including union-valued axes as of `0.6.4`):

```ts
y: { scale: scaleLinear().domain([0, 1]) }
x: { scale: scaleUtc().domain([windowStart, windowEnd]) }
```

Never assign pixel ranges to positional scales used by the chart. TanStack Charts copies the scale and assigns the responsive range per scene.

### Axis Options (`0.3.x`+)

Flat `0.0.x` guide fields (`label`, `ticks`, `tickRotate`, `labelOffset` on the axis object) were replaced by composable options:

```ts
y: {
  scale: scaleLinear,
  nice: true,
  grid: true,
  reverse: false,
  axis: {
    line: true,
    label: 'Revenue', // or { text: 'Revenue', offset: 'auto' }
    ticks: {
      count: 7, // mutually exclusive with spacing / values
      format: (value) => currency.format(value),
    },
    tickLabels: {
      rotate: -35,
      thin: { minGap: 8, priority: 'ends', keep: [launchDate] },
    },
  },
}
```

| Control | Use |
| --- | --- |
| `axis: false` | Hide the guide; keep the scale |
| Axis set to `null` | No mark uses that positional dimension |
| `grid` | Independent of axis visibility |
| `nice` | Axis option; runs after domain inference |

Default tick-candidate targets (when no explicit policy): roughly `clamp(2, floor(width/92), 8)` for x and `clamp(2, floor(height/48), 7)` for y. Tick labels are collision-thinned by default; set `thin: false` to keep every candidate.

## Channels

Prefer field names when types match:

```ts
lineY(rows, { x: 'date', y: 'revenue', z: 'region' })
```

Use accessors for derived values; they receive `(datum, index, data)`:

```ts
dot(rows, {
  x: (row) => row.revenue / row.accounts,
  y: 'retention',
})
```

Return `null` from a positional accessor to create intentional gaps in lines/areas. Do not substitute zero unless zero is semantically correct.

## Color

- Mark `color` contributes to the chart-level color scale/legend.
- `z` partitions series/groups and supplies color only when `color` is omitted.
- `fill` / `stroke` are final paint overrides and do **not** feed the scale/legend.

```ts
import { colorLegend, defineChart, lineY } from '@tanstack/charts'
import { scaleOrdinal } from '@tanstack/charts-scales/ordinal'

const color = scaleOrdinal(
  ['North', 'South', 'West'],
  ['#2563eb', '#f97316', '#10b981'],
)

defineChart({
  marks: [lineY(rows, { x: 'date', y: 'value', z: 'region' })],
  x: { scale: xScale },
  y: { scale: yScale },
  color: {
    scale: color,
    legend: colorLegend({ label: 'Region' }),
  },
})
```

Use `colorGradientLegend` only when intentionally showing a discrete scale as a sampled ramp. Prefer direct labels for a few series; legends when the same category appears in many places.

## Static Vs Responsive Definitions

Static object definition when layout does not depend on size:

```ts
const definition = defineChart({
  marks: [...],
  x: { scale: scaleLinear },
  y: { scale: scaleLinear },
})
```

Responsive builder when tick density or composition depends on surface size. Outer options (tooltip, animate, motion, …) are retained with the builder:

```ts
import { tooltip } from '@tanstack/charts/tooltip'

const definition = defineChart({
  tooltip,
  chart: ({ width }) => ({
    marks: [barX(ranked, { x: 'value', y: 'product' })],
    x: {
      scale: scaleLinear,
      nice: true,
      axis: { ticks: { count: width < 480 ? 4 : 7 } },
    },
    y: { scale: () => scaleBand<string>().padding(0.1) },
  }),
})
```

Memoize the complete definition against every captured application value. Preserve identity until those values change.

## Tooltip Extensions

Native tooltips are explicit extensions (breaking vs `0.0.2`):

```ts
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'

// default
defineChart({ marks, x, y, tooltip })

// configured
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
    sort: 'color-domain', // default grouped order is visual mark position
  },
})
```

| `0.0.2` | `0.1.0+` |
| --- | --- |
| `tooltip: true` | `tooltip` |
| `tooltip: enabled` | `enabled ? tooltip : false` |
| `tooltip: { … }` | `{ use: tooltip, … }` |
| `portal: true` | `portal` (inside tooltip options) |
| `portal: false` | omit |

From `0.4.0`, grouped tooltip rows default to rendered mark position (top-to-bottom for x groups, left-to-right for y groups). Explicit policies: `visual`, `color-domain`, `focus`, or a typed comparator.

## Vanilla Host

```ts
import { defineChart, lineY, mountChart } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts-scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { scaleUtc } from 'd3-scale'

const definition = defineChart({
  marks: [lineY(rows, { x: 'Date', y: 'Close', stroke: '#2563eb' })],
  x: { scale: scaleUtc, nice: true, axis: { label: 'Date' } },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: 'Close (USD)' },
  },
  tooltip,
})

const host = mountChart(container, {
  definition,
  height: 360,
  initialWidth: 640,
  ariaLabel: 'Closing price',
})

host.update({
  definition: nextDefinition,
  height: 360,
  initialWidth: 640,
  ariaLabel: 'Closing price',
})
host.destroy()
```

`mountChart` is also available from `@tanstack/charts/dom`. Canvas: `mountCanvasChart` from `@tanstack/charts/canvas`. Optional motion SVG: `mountChartRenderer` from `@tanstack/charts/renderer` with `motion()` from `@tanstack/charts/motion`.

## Import Boundaries

Ordinary app authoring uses the package root:

```ts
import { defineChart, lineY, mountChart } from '@tanstack/charts'
```

Use subpaths when a library needs hard capability isolation:

```ts
import { lineY } from '@tanstack/charts/line'
import { mountChart } from '@tanstack/charts/dom'
import { renderChartSvg } from '@tanstack/charts/svg'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'
import { mountCanvasChart } from '@tanstack/charts/canvas'
import { motion } from '@tanstack/charts/motion'
import { createChartSpring } from '@tanstack/charts/spring'
import { polar, radialArc } from '@tanstack/charts/polar'
import { geoShape } from '@tanstack/charts/geo'
import { focusDisabled } from '@tanstack/charts/focus/disabled'
```

Environment-safe authoring (no browser host reachable)—required for React Native shared definitions:

```ts
import { createChartRuntime, defineChart, lineY } from '@tanstack/charts/universal'
import type { ChartDefinition } from '@tanstack/charts/types'
```

`/portable` from `0.1.0` was renamed to `/universal` in `0.2.0`.

Optional React renderer entries:

```tsx
import { Chart } from '@tanstack/react-charts'
import { Chart as CanvasChart } from '@tanstack/react-charts/canvas'
import { Chart as RendererChart } from '@tanstack/react-charts/core'
import { Chart as TooltipChart } from '@tanstack/react-charts/tooltip'
```

Default `Chart` is SVG-based and does not pull Canvas into its module graph. Use `/tooltip` when passing `renderTooltipBody`. Use `/core` when supplying `renderer: motion()` or another custom renderer.

## Verify Installation

```ts
import { createChartScene, defineChart, lineY } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts-scales/linear'

const chart = defineChart({
  marks: [lineY([2, 5, 3])],
  x: { scale: scaleLinear },
  y: { scale: scaleLinear },
})

const scene = createChartScene(chart, { width: 640, height: 320 })
```
