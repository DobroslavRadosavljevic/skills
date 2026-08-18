# Setup And Core API

Snapshot: `@tanstack/charts@0.14.0` (pre-alpha). Pin and re-check when versions move.

## Installation

Install the grammar once. Add only the framework peers for the adapter subpath in use:

```sh
bun add @tanstack/charts
```

React:

```sh
bun add @tanstack/charts react react-dom
```

Do **not** add `@tanstack/react-charts` or `@tanstack/charts-scales` for new apps.

Declare every `d3-*` module the **application source** imports, plus matching `@types`:

```sh
bun add d3-scale
bun add -D @types/d3-scale
```

Do not install the umbrella `d3` package. Core already depends on the D3 modules it owns (`d3-array`, `d3-shape`, `d3-geo`, `d3-scale`, plus optional spatial/hierarchy/network/brush implementations). Bundlers drop unused algorithms. Strict package managers still require a direct dependency for **app** imports.

### Compact scales

```ts
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { scalePoint } from '@tanstack/charts/scales/point'
```

There is **no** `@tanstack/charts/scales` barrel. Prefer `d3-scale` for time, UTC, log, power, sequential/diverging/quantile/threshold, piecewise interpolation, or full D3 formatting.

### Adapter subpaths and peers

| Import | Framework peers |
| --- | --- |
| `@tanstack/charts/react` | `react` / `react-dom` `^19.0.0` |
| `@tanstack/charts/react-native` | React `^19.2.3`, RN `^0.86.0`, `react-native-svg` `>=15.15.4 <16` (experimental) |
| `@tanstack/charts/preact` | `preact` `>=10` |
| `@tanstack/charts/vue` | `vue` `>=3.5` |
| `@tanstack/charts/solid` | `solid-js` `>=1.8` |
| `@tanstack/charts/svelte` | `svelte` `^5.20.0` |
| `@tanstack/charts/angular` | Angular core + platform-browser `>=19` |
| `@tanstack/charts/lit` | `lit` `>=3.1.3` |
| `@tanstack/charts/alpine` | `alpinejs` `>=3.15` |
| `@tanstack/charts/octane` | `octane` `^0.1.13` |

Peers are optional at the package level. Install only the selected host's peers.

## Ownership Boundary

| Owner | Responsibility |
| --- | --- |
| Application | Fetch/clean, memoization, brush/zoom/scrubber state |
| Compact `/scales/*` or D3 | Scale semantics the app imports |
| `@tanstack/charts` | Marks, channels, eager transforms, ranges, guides, keyed scene, SVG/Canvas/motion, focus/tooltip host |
| Adapter subpath | Framework lifecycle, SSR shell, unmount |

## Minimal Definition

```ts
import { barY, defineChart } from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'

interface LetterFrequency {
  letter: string
  frequency: number
}

const alphabet: readonly LetterFrequency[] = [
  { letter: 'E', frequency: 0.12702 },
  { letter: 'T', frequency: 0.09056 },
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

Both positional scales are required when marks materialize those dimensions.

`defineChart(existingDefinition, { tooltip, svgAnimation: true })` attaches behavior without rewriting marks.

## Scales

Factory when the domain should follow channels:

```ts
x: { scale: scaleUtc, nice: true, axis: { label: 'Date' } }
y: { scale: scaleLinear, nice: true, grid: true }
```

Configured factory for options before inference:

```ts
x: { scale: () => scaleBand<string>().padding(0.18) }
```

Configured instance when the domain is application-owned:

```ts
y: { scale: scaleLinear().domain([0, 1]) }
```

Never assign pixel ranges to chart-owned positional scales.

Compact linear domains and band ranges require exactly two finite values. Ordinal scales return `undefined` when no range value resolves.

### Axis options

```ts
y: {
  scale: scaleLinear,
  nice: true,
  grid: true,
  axis: {
    line: true,
    label: 'Revenue',
    ticks: {
      count: 7,
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
| Axis `null` | No mark uses that dimension |
| `grid` | Independent of axis visibility |
| `nice` | After domain inference |

Tick labels are collision-thinned by default; `thin: false` keeps every candidate.

## Channels

Prefer field names. Accessors receive `(datum, { index, data })`:

```ts
dot(rows, {
  x: (row) => row.revenue / row.accounts,
  y: 'retention',
})
```

Return `null` from a positional accessor for intentional gaps. Do not substitute zero unless zero is correct.

## Color

- Mark `color` feeds the chart-level color scale/legend.
- `z` partitions series and supplies color when `color` is omitted.
- `fill` / `stroke` are final paint and do **not** feed the scale/legend.
- Use `color.resolver` (not `color.type`) when configuring a custom resolver.

```ts
import { colorLegend, defineChart, lineY } from '@tanstack/charts'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'

defineChart({
  marks: [lineY(rows, { x: 'date', y: 'value', z: 'region' })],
  x: { scale: xScale },
  y: { scale: yScale },
  color: {
    scale: scaleOrdinal(
      ['North', 'South', 'West'],
      ['#2563eb', '#f97316', '#10b981'],
    ),
    legend: colorLegend({ label: 'Region' }),
  },
})
```

Interactive series toggling: `interactiveColorLegend` from `@tanstack/charts/legend`. Filter callbacks use `(value, { visible })`.

## Static Vs Responsive Definitions

```ts
const definition = defineChart({
  svgAnimation: true,
  tooltip,
  chart: ({ width, height, defaultTheme }) => ({
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

Builder context: `width`, `height`, `defaultTheme` (not `theme`). Memoize the complete definition against captured values.

Definition-owned options (hosts do not override): `focus`, `focusRing`, `selection`, `controls`, `cursor`, `maxFocusDistance`, `spatialIndex`, `svgAnimation`, `pointer`, `keyboard`, `tooltip`, `motion`.

## Tooltip Extensions

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

Grouped tooltip rows default to visual mark order (`visual`). `format` / `formatGroup` receive a second `ChartTooltipContentContext` (`{ pinned, … }`).

DOM vs React Native tooltip tokens are **host-branded**. Do not pass an RN tooltip definition into a DOM `Chart` (or the reverse). Environment-neutral policy lives on `@tanstack/charts/tooltip/model`.

## Vanilla Host

```ts
import { defineChart, lineY, mountChart } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { scaleUtc } from 'd3-scale'

const host = mountChart(container, {
  definition,
  height: 360,
  initialWidth: 640,
  ariaLabel: 'Closing price',
})
host.update({ definition: next, height: 360, initialWidth: 640, ariaLabel: 'Closing price' })
host.destroy()
```

Canvas: `mountCanvasChart` from `@tanstack/charts/canvas`. Motion SVG: `mountChartRenderer` from `@tanstack/charts/renderer` with `motion()` from `@tanstack/charts/motion`.

## Import Boundaries

Ordinary authoring:

```ts
import { defineChart, lineY, mountChart } from '@tanstack/charts'
```

Hard isolation / Metro (RN): prefer exact mark and scene entries rather than the large root barrel.

No browser host:

```ts
import { createChartRuntime, defineChart, lineY } from '@tanstack/charts/universal'
import type { ChartDefinition } from '@tanstack/charts/types'
```

`/portable` was renamed to `/universal` in `0.2.0`.

React:

```tsx
import { Chart } from '@tanstack/charts/react'
import { Chart as CanvasChart } from '@tanstack/charts/react/canvas'
import { Chart as RendererChart } from '@tanstack/charts/react/core'
import { Chart as TooltipChart } from '@tanstack/charts/react/tooltip'
```

## Verify Installation

```ts
import { createChartScene, defineChart, lineY } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'

const chart = defineChart({
  marks: [lineY([2, 5, 3])],
  x: { scale: scaleLinear },
  y: { scale: scaleLinear },
})

const scene = createChartScene(chart, { width: 640, height: 320 })
```
