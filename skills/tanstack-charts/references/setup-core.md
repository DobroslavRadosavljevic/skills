# Setup And Core API

Snapshot: `@tanstack/charts@0.18.0` (official Alpha since `0.16.0`). Pin an exact version and re-check when versions move; minors may break APIs.

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
| `@tanstack/charts/react` | React and React DOM 18 or 19 (since `0.17.0`) |
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
  scales: {
    x: { scale: () => scaleBand<string>().padding(0.18) },
    y: {
      scale: scaleLinear,
      nice: true,
      grid: true,
      axis: { label: 'Frequency' },
    },
  },
  tooltip,
})
```

Since `0.16.0`, Cartesian scale and axis options live in the `scales` registry. Every definition must provide both reserved entries `scales.x` and `scales.y`; set one to `null` only when no mark uses that dimension (for example a `ruleY`-only chart: `scales: { x: null, y: { scale: yScale } }`). Root `x` / `y` options were removed and now fail through TypeScript or an actionable runtime error.

`defineChart(existingDefinition, { tooltip, svgAnimation: true })` attaches behavior without rewriting marks.

## Scales

Factory when the domain should follow channels:

```ts
scales: {
  x: { scale: scaleUtc, nice: true, axis: { label: 'Date' } },
  y: { scale: scaleLinear, nice: true, grid: true },
}
```

Configured factory for options before inference:

```ts
scales: { x: { scale: () => scaleBand<string>().padding(0.18) }, y: { scale: scaleLinear } }
```

Configured instance when the domain is application-owned:

```ts
scales: { x: { scale: scaleUtc }, y: { scale: scaleLinear().domain([0, 1]) } }
```

Never assign pixel ranges to chart-owned positional scales.

Compact linear domains and band ranges require exactly two finite values. Ordinal scales return `undefined` when no range value resolves.

### Axis options

```ts
scales: {
  x: { scale: scaleUtc },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: { stroke: '#e5e7eb', strokeDasharray: '2 4' }, // or true
    axis: {
      line: { strokeWidth: 1.5 }, // or true
      label: { text: 'Revenue', fontSize: 14, fontWeight: 500 }, // or a string
      ticks: {
        count: 7,
        format: (value) => currency.format(value),
      },
      tickLabels: {
        rotate: -35,
        thin: { minGap: 8, priority: 'ends', keep: [launchDate] },
      },
    },
  },
}
```

`grid` and `axis.line` accept `true` or a `ChartGuideLineStyle` (`stroke`, `strokeOpacity`, `strokeWidth`, `strokeDasharray`, `lineCap`) since `0.18.0`; authored widths join automatic margins and zero widths hide the line. `axis.label` accepts a string or `{ text, fontSize, fontWeight, fill, opacity }` (`0.18.0`). Axis `side` stays physical in right-to-left containers; tick anchors follow the inline direction.

### Named scales and multiple axes (`0.15.0+`)

Add a registry entry with `channel: 'x' | 'y'` and bind marks with `xScale` / `yScale`:

```ts
defineChart({
  marks: [
    lineY(revenue, { x: 'date', y: 'value' }),
    lineY(conversion, { x: 'date', y: 'rate', yScale: 'conversion' }),
  ],
  scales: {
    x: { scale: scaleUtc },
    y: { scale: scaleLinear, grid: true, axis: { label: 'Revenue' } },
    conversion: {
      channel: 'y',
      scale: scaleLinear,
      side: 'right',
      axis: { label: 'Conversion' },
    },
  },
})
```

Every non-null scale draws an axis unless `axis: false`. Axes on one side stack outward. `color` is reserved and cannot name a position scale. Prefer small multiples over unrelated dual axes.

| Control | Use |
| --- | --- |
| `axis: false` | Hide the guide; keep the scale |
| `scales.x: null` / `scales.y: null` | No mark uses that dimension (the entry itself is still required) |
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
  scales: { x: { scale: xScale }, y: { scale: yScale } },
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

Compact or styled categorical legends (`0.18.0`): pass `items: colorLegendItems({ justify, gap, rowGap, indicator: { shape, width, height, gap }, label: { fontSize, fill } })` to `colorLegend`. Indicator shapes are `dot`, `square`, `line`, and `line-dot`; `indicator.render` draws custom symbols.

Gradients are declared on the definition (`gradients: [{ id, x1, y1, x2, y2, stops }]`, linear or radial since `0.18.0`) and referenced with `fill: 'url(#id)'`. Canvas supports linear fills/strokes and radial fills only.

## Static Vs Responsive Definitions

```ts
const definition = defineChart({
  svgAnimation: true,
  tooltip,
  chart: ({ width, height, defaultTheme }) => ({
    marks: [barX(ranked, { x: 'value', y: 'product' })],
    scales: {
      x: {
        scale: scaleLinear,
        nice: true,
        axis: { ticks: { count: width < 480 ? 4 : 7 } },
      },
      y: { scale: () => scaleBand<string>().padding(0.1) },
    },
  }),
})
```

Builder context: `width`, `height`, `defaultTheme` (not `theme`). Memoize the complete definition against captured values.

Definition-owned options (hosts do not override): `focus`, `focusRing` (boolean or `{ radius, strokeWidth, fill, stroke }` since `0.18.0`; also settable as `theme.focusRing`), `selection`, `controls`, `cursor`, `maxFocusDistance`, `spatialIndex`, `svgAnimation`, `pointer`, `keyboard`, `tooltip`, `motion`.

## Tooltip Extensions

```ts
import { tooltip } from '@tanstack/charts/tooltip'
import { portal } from '@tanstack/charts/tooltip/portal'

defineChart({
  marks,
  scales,
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

Grouped tooltip rows default to visual mark order (`visual`) and highlight the active series (`0.16.1`). `format` / `formatGroup` receive a second `ChartTooltipContentContext` (`{ pinned, primaryPoint, … }`); custom content can read `context.primaryPoint` and `row.active`. Pinned tooltips dismiss on an outside pointer press (`0.16.0`). Add `className` to the tooltip options to style the DOM surface.

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
  scales: {
    x: { scale: scaleLinear },
    y: { scale: scaleLinear },
  },
})

const scene = createChartScene(chart, { width: 640, height: 320 })
```
