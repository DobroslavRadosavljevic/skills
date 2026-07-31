# Marks And Composition

## Task-First Selection

Start from the reader question, then pick marks:

| Reader task | First choice | Notes |
| --- | --- | --- |
| Change over ordered time | `lineY` | `areaY` for magnitude/bands; bars for discrete periods |
| Compare categories | `barY` / `barX` | Prefer zero baseline on quantitative axis |
| Relationship | `dot` | Add `r` + `rScale` (`scaleSqrt`) for bubble size |
| Interval / range | `areaY`/`rect`/`barY` with `y1`/`y2` | Candlestick = link + ranged rect pattern |
| Composition | Prepared stacked intervals | Normalized stacks for proportions |
| Distribution | Prepared bins → `rect`/`barY` | Box/violin via composed marks |
| Matrix | `cell` / `rect` | |
| Small multiples | `facet` / `facetChart` | |
| Pie / radar | `@tanstack/charts/polar` | Not a root Cartesian default |
| Maps | `@tanstack/charts/geo` (`geoShape`) | Projection factory is app/D3-owned |

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
| Labels | `text` |
| Directed relations | `arrow`, `link`, `vector` |
| Distribution glyphs | `tickX`, `tickY` |
| Frame | `frame` |
| Facets | `facet`, `facetChart` |

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
- Built-ins infer datum identity from unique top-level `id`, nested `data.id`, or mark-specific position.
- Supply `key` when inferred identity is not the entity's stable identity.
- Avoid unstable array-index keys for live updating charts.

```ts
lineY(rows, {
  id: 'actual-revenue',
  x: 'date',
  y: 'actual',
})
```

## Grouping, Color, And Stacking

`z` partitions connected geometry (independent lines/areas) and feeds default categorical color when appropriate:

```ts
lineY(rows, { x: 'date', y: 'value', z: 'region' })
```

When `z` is omitted on a connected line/area, an authored `color` channel can also create path groups. Explicit `z` wins when fields differ.

**Bars do not auto-dodge or auto-stack from `z` alone.**

- Side-by-side groups: pass a configured D3 `groupScale` (band within band).
- Stacks: prepare explicit `y1`/`y2` or `x1`/`x2` intervals in application/D3 code, then map them on the mark.

```ts
barY(stackedRows, {
  x: 'category',
  y1: 'start',
  y2: 'end',
  z: 'segment',
})
```

When `y1`/`x1` is omitted, bar and area baselines default to zero where supported. Supply both endpoints to make interval semantics explicit.

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

Radius on `dot` is pixels unless `rScale` is provided; use an area-preserving scale such as `scaleSqrt` for quantitative bubble size.

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
import { scaleLinear, scaleUtc } from 'd3-scale'
import { areaY, defineChart, lineY } from '@tanstack/charts'

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
  x: { scale: scaleUtc, label: 'Day' },
  y: {
    scale: scaleLinear,
    nice: true,
    label: 'Temperature (°F)',
    grid: true,
  },
})
```

## Misleading Defaults To Avoid

- Bars without a zero baseline when magnitude comparison is the task.
- Connecting unordered categories with lines.
- Dual unrelated quantitative axes that imply false correlation—prefer aligned small multiples.
- Stacks when interior-layer comparison matters more than totals.
- Encoding essential state with color alone.
- Jumping to 3D or decorative effects for analytical marks.

## Escalation Order

1. One built-in mark
2. Several built-ins sharing scales
3. Facets or linked views
4. D3-prepared rows into built-ins
5. `createMark` for new geometry
6. Application-owned overlay / gesture controller
