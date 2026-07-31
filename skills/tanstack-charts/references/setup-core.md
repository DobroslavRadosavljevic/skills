# Setup And Core API

## Installation

Install the core in every app that authors definitions, then one adapter:

```sh
bun add @tanstack/charts @tanstack/react-charts
```

Also declare every `d3-*` module the chart source imports, plus matching `@types`:

```sh
bun add d3-array d3-scale
bun add -D @types/d3-array @types/d3-scale
```

Add modules only when imported:

```sh
bun add d3-shape
bun add -D @types/d3-shape
```

Do not install the umbrella `d3` package just because one capability is needed. Do not install unscoped `react-charts` for this library.

Other adapters (same version line as core): `@tanstack/vue-charts`, `@tanstack/solid-charts`, `@tanstack/svelte-charts`, `@tanstack/angular-charts`, `@tanstack/lit-charts`, `@tanstack/alpine-charts`, `@tanstack/preact-charts`, `@tanstack/octane-charts`.

React adapter peers: `react` and `react-dom` `^19.0.0`.

## Ownership Boundary

| Owner | Responsibility |
| --- | --- |
| Application | Data fetch/clean, D3 transforms, scale choice/domains, brush/zoom/scrubber state |
| D3 modules | Scales, bins, stacks, curves, geo, spatial algorithms |
| `@tanstack/charts` | Marks, channels, responsive ranges, guides, keyed scene, SVG/Canvas, focus/tooltip host |
| Adapter | Framework lifecycle, SSR shell, unmount cleanup |

Adapters do not replace the core. Definitions and marks still come from `@tanstack/charts`.

## Minimal Definition

```ts
import { scaleBand, scaleLinear } from 'd3-scale'
import { barY, defineChart } from '@tanstack/charts'

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
  x: { scale: scaleBand },
  y: { scale: scaleLinear, nice: true, grid: true },
  tooltip: true,
})
```

Both positional scales are required when marks materialize those dimensions. Positionless charts (for example frame-only or some polar setups) may omit unused axes deliberately.

## Scales

Pass a **factory** when the domain should follow mark channels:

```ts
x: { scale: scaleUtc, nice: true, label: 'Date' }
y: { scale: scaleLinear, nice: true, label: 'Close (USD)', grid: true }
```

Return a configured factory when options are needed before inference:

```ts
x: { scale: () => scaleBand<string>().padding(0.18) }
```

Pass a **configured instance** when the domain is application-owned:

```ts
y: { scale: scaleLinear().domain([0, 1]) }
x: { scale: scaleUtc().domain([windowStart, windowEnd]) }
```

Never assign pixel ranges to positional scales used by the chart. TanStack Charts copies the scale and assigns the responsive range per scene.

Use axis guide options (`label`, `format`, `ticks`, `grid`, `reverse`, `tickRotate`, `labelOffset`) for presentation; they do not replace scale semantics.

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

## Static Vs Responsive Definitions

Static object definition when layout does not depend on size:

```ts
const definition = defineChart({
  marks: [...],
  x: { scale: scaleLinear },
  y: { scale: scaleLinear },
})
```

Responsive builder when tick density or composition depends on surface size:

```ts
const definition = defineChart({
  tooltip: true,
  chart: ({ width }) => ({
    marks: [barX(ranked, { x: 'value', y: 'product' })],
    x: { scale: scaleLinear, nice: true, ticks: width < 480 ? 4 : 7 },
    y: { scale: () => scaleBand<string>().padding(0.1) },
  }),
})
```

Memoize the complete definition against every captured application value. Preserve identity until those values change.

## Vanilla Host

```ts
import { defineChart, lineY, mountChart } from '@tanstack/charts'
import { scaleLinear, scaleUtc } from 'd3-scale'

const definition = defineChart({
  marks: [lineY(rows, { x: 'Date', y: 'Close', stroke: '#2563eb' })],
  x: { scale: scaleUtc, nice: true },
  y: { scale: scaleLinear, nice: true, grid: true },
  tooltip: true,
})

const host = mountChart(container, {
  definition,
  height: 360,
  initialWidth: 640,
  ariaLabel: 'Closing price',
})

host.update({ definition: nextDefinition, height: 360, initialWidth: 640, ariaLabel: 'Closing price' })
host.destroy()
```

## Import Boundaries

Ordinary app authoring uses the package root:

```ts
import { defineChart, lineY, mountChart } from '@tanstack/charts'
```

Use subpaths when a library needs hard capability isolation (`@tanstack/charts/line`, `/dom`, `/svg`, `/canvas`, `/polar`, `/geo`, `/export`, `/focus`, `/d3/shape`, etc.). Polar and geo are intentionally absent from the default mental model of the root for tree-shaking; import them from their subpaths when needed.

Optional React renderer entries:

```tsx
import { Chart } from '@tanstack/react-charts'
import { Chart as CanvasChart } from '@tanstack/react-charts/canvas'
import { Chart as RendererChart } from '@tanstack/react-charts/core'
```

Default `Chart` is SVG-based and does not pull Canvas into its module graph.

## Verify Installation

```ts
import { scaleLinear } from 'd3-scale'
import { createChartScene, defineChart, lineY } from '@tanstack/charts'

const chart = defineChart({
  marks: [lineY([2, 5, 3])],
  x: { scale: scaleLinear },
  y: { scale: scaleLinear },
})

const scene = createChartScene(chart, { width: 640, height: 320 })
```
