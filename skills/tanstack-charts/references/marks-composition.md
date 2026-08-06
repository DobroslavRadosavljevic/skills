# Marks And Composition

## Task-First Selection

Start from the reader question, then pick marks:

| Reader task | First choice | Notes |
| --- | --- | --- |
| Change over ordered time | `lineY` | `areaY` for magnitude/bands; bars for discrete periods |
| Compare categories | `barY` / `barX` | Prefer zero baseline on quantitative axis |
| Relationship | `dot` | Add `r` + `rScale` (`scaleSqrt`) for bubble size |
| Interval / range | `areaY`/`rect`/`barY` with `y1`/`y2` | Candlestick = link + ranged rect pattern |
| Composition | Implicit stack or `layout: stack()` | Normalized: `offset: 'normalize'`; mosaic via `rect` |
| Side-by-side groups | `layout: group()` | Explicit; default length-channel geometry stacks |
| Distribution | `binX` / D3 bins → `rect`/`barY` | Box/violin via composed marks |
| Matrix | `cell` / `rect` | |
| Small multiples | `facet` / `facetChart` | |
| Pie / radar | `@tanstack/charts/polar` | Not a root Cartesian default |
| Maps | `@tanstack/charts/geo` (`geoShape`) | Projection factory is app/D3-owned |
| Focus decoration | `whenFocused(bandX(...), { match: 'x' })` | Shared focus-layer marks |

Prefer the smallest complete composition before facets, custom marks, or overlays.

## Built-In Families

| Visual task | Marks |
| --- | --- |
| Trend / path | `lineY` |
| Range / filled trend | `areaY`, `areaX` |
| Category comparison | `barY`, `barX` |
| Intervals / heatmap cells | `rect`, `cell` |
| Observations | `dot`, `hexagon` |
| References | `ruleX`, `ruleY` |
| Categorical band highlights | `bandX`, `bandY` |
| Labels | `text` |
| Directed relations | `arrow`, `link`, `vector` |
| Distribution glyphs | `tickX`, `tickY` |
| Frame | `frame` |
| Facets | `facet`, `facetChart` |
| Focus-gated layers | `whenFocused(mark, filter?)` |

`link` supports per-datum `strokeWidth` / `strokeOpacity` and line caps (useful with application-owned `d3-sankey` layouts).

## Layer Order

Marks earlier in the array paint behind later marks. Default escalation:

1. Background regions / filled areas
2. Reference bands and rules
3. Primary bars or lines
4. Highlight dots, ticks, vectors
5. Labels and annotations

Annotations are ordinary marks with their own data and identity—there is no separate overlay subsystem.

## Mark And Datum Identity

- Give marks an explicit `id` when they are conditional, reordered, or need stable reconciliation across definitions.
- Built-ins infer datum identity from unique top-level `id`, nested `data.id`, or mark-specific position (`barY`→`x`, `lineY`/`areaY`→`x`, etc.).
- Supply `key` when inferred identity is not the entity's stable identity.
- Avoid unstable array-index keys for live updating charts.
- Marks accept optional `states` for focus-driven presentation overrides.

```ts
lineY(rows, {
  id: 'actual-revenue',
  x: 'date',
  y: 'actual',
})
```

## Grouping, Color, And Stacking

`z` partitions connected geometry (independent lines/areas) and feeds default categorical color when `color` is omitted:

```ts
lineY(rows, { x: 'date', y: 'value', z: 'region' })
```

When `z` is omitted on a connected line/area, an authored `color` channel can also create path groups. Explicit `z` wins when fields differ.

### Bars And Areas (`0.3.x`+)

**Single length channels stack implicitly** at repeated categorical positions (positive/negative diverge from zero):

```ts
import { barY, group, stack } from '@tanstack/charts'

barY(rows, {
  x: 'quarter',
  y: 'revenue',
  color: 'region',
})
```

Side-by-side groups require an explicit layout:

```ts
barY(rows, {
  x: 'quarter',
  y: 'revenue',
  color: 'region',
  layout: group(), // or group({ padding: 0.2 }) / group({ scale })
})
```

Configure stack order/offset only when defaults are insufficient:

```ts
barY(rows, {
  x: 'quarter',
  y: 'revenue',
  color: 'segment',
  layout: stack({
    order: ['Core', 'Services'], // or 'input' | 'ascending' | 'descending'
    offset: 'normalize', // 'diverging' | 'normalize' | 'center' | 'wiggle'
    reverse: false,
  }),
})
```

Supplying `y1`/`y2` (or `x1`/`x2` on `barX`) **opts out** of implicit stacking and treats channels as authored endpoints:

```ts
barY(stackedRows, {
  x: 'category',
  y1: 'start',
  y2: 'end',
  z: 'segment',
})
```

Do not expect `groupScale` from older docs/snippets—use `layout: group(...)`. Prefer `stackRowsY` / `stackRowsX` transforms when stack endpoints must be reused outside one mark (tables, exports, linked views).

When `y1`/`x1` is omitted on interval-capable marks, baselines default to zero where supported.

## Gaps And Missing Values

`lineY` and `areaY` split geometry at missing/invalid positional values. Treat breaks as evidence, not as zeros:

```ts
lineY(rows, {
  x: 'date',
  y: (row) => (row.Date.getUTCMonth() < 3 ? null : row.Close),
})
```

## Curves

Straight lines/areas need no `d3-shape`. Opt in explicitly:

```ts
import { curveMonotoneX } from 'd3-shape'
import { d3Curve, lineY } from '@tanstack/charts'

lineY(rows, {
  x: 'date',
  y: 'value',
  curve: d3Curve(curveMonotoneX),
})
```

Horizontal `areaX` uses `d3AreaXCurve` from `@tanstack/charts/d3/area-x`.

## Style Vs Encoding

- Constants (`stroke: '#2563eb'`, `fillOpacity: 0.2`) are fixed paint.
- Semantic color across observations: use `z`/`color` channels plus `color.scale` / theme palette / `colorLegend`.
- Local highlight styling can use visual accessors without inventing a shared scale.
- `fill`/`stroke` bypass the color scale and legend.

Radius on `dot` is pixels unless `rScale` is provided; use an area-preserving scale such as `scaleSqrt` for quantitative bubble size.

## Focus-Layer Marks

```ts
import { bandX, whenFocused } from '@tanstack/charts'

whenFocused(
  bandX(rows, {
    x: 'category',
    fill: '#64748b',
    fillOpacity: 0.14,
    inset: -6,
  }),
  { match: 'x' },
)
```

Use these instead of renderer-specific focus decoration when migrating.

## Clipping

```ts
defineChart({
  marks,
  x: { scale: xScale },
  y: { scale: yScale },
  clip: true,
})
```

Clipping applies to the mark group, not axes/legends. Leave it off when annotations should extend past the plot.

## Composed Example

```ts
import { scaleUtc } from 'd3-scale'
import { areaY, defineChart, lineY } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts-scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'

interface DailyTemperature {
  date: Date
  high: number
  low: number
}

const temperatureChart = defineChart({
  marks: [
    areaY(rows, {
      id: 'daily-range',
      x: 'date',
      y1: 'low',
      y2: 'high',
      fill: '#60a5fa',
      fillOpacity: 0.24,
    }),
    lineY(rows, {
      id: 'daily-low',
      x: 'date',
      y: 'low',
      stroke: '#2563eb',
    }),
    lineY(rows, {
      id: 'daily-high',
      x: 'date',
      y: 'high',
      stroke: '#dc2626',
    }),
  ],
  x: { scale: scaleUtc, axis: { label: 'Day' } },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: 'Temperature (°F)' },
  },
  tooltip,
})
```

## Misleading Defaults To Avoid

- Bars without a zero baseline when magnitude comparison is the task.
- Connecting unordered categories with lines.
- Dual unrelated quantitative axes that imply false correlation—prefer aligned small multiples.
- Stacks when interior-layer comparison matters more than totals (prefer `layout: group()` or small multiples).
- Encoding essential state with color alone.
- Jumping to 3D or decorative effects for analytical marks.

## Escalation Order

1. One built-in mark
2. Several built-ins sharing scales
3. Implicit stack / `layout: group()` / `layout: stack()`
4. Facets or linked views
5. TanStack or D3-prepared rows into built-ins
6. `createMark` for new geometry
7. Application-owned overlay / gesture controller
