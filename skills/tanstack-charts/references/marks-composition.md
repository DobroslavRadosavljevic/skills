# Marks And Composition

## Task-First Selection

| Reader task | First choice | Notes |
| --- | --- | --- |
| Change over ordered time | `lineY` | `areaY` for magnitude; `differenceY` for two series; bars for discrete periods |
| Least-squares trend | `linearRegressionY` | Confidence band from the same family |
| Compare categories | `barY` / `barX` | Zero baseline on the quantitative axis |
| Relationship | `dot` | `r` + `rScale` (`scaleSqrt`) for bubbles; `hexbin` / `contour` when dense |
| Interval / range | `areaY`/`rect`/`barY` with `y1`/`y2` | Candlestick = `link` + ranged `rect` |
| Composition | Implicit stack or `layout: stack()` | Normalized offset; mosaic via `mosaicY` + `rect`; `waffleY` for unit charts |
| Side-by-side groups | `layout: group()` | Default length-channel geometry stacks |
| Distribution | `binX` → `rect`; `boxY`; `violinY`; `ridgelineY` | Prefer first-party `boxY` over hand-composed fences |
| Matrix | `cell` / `rect` | |
| Small multiples | `facet` / `facetChart` / `composeViews` | |
| Hierarchy | `treemap`, `sunburst`, `treeLayout` + marks | Exact `/hierarchy/*` entries |
| Flow | `sankeyDiagram` | `@tanstack/charts/network/sankey` |
| Network | `forceLayout` then `dot`/`link` | Static settlement only; drag is app-owned |
| Pie / radar | `@tanstack/charts/polar` | Not a root Cartesian default |
| Maps | `@tanstack/charts/geo` (`geoShape`) | Projection factory is app/D3-owned |
| Focus decoration | `crosshair`, `whenFocused`, `focusGuideX/Y` | `decorative(...)` for non-interactive siblings |

Prefer the smallest complete composition before facets, custom marks, or overlays.

## Built-In Families

| Visual task | Marks |
| --- | --- |
| Trend / path | `lineY`, `lineX` |
| Difference of two paths | `differenceY`, `differenceX` |
| Regression | `linearRegressionY`, `linearRegressionX` |
| Range / filled trend | `areaY`, `areaX` |
| Category comparison | `barY`, `barX`, `waffleY`, `waffleX` |
| Intervals / heatmap | `rect`, `cell` |
| Observations | `dot`, `hexagon` |
| Dodge / beeswarm-style | `dodgeX`, `dodgeY`, `createDotLayout` |
| Tukey summary | `boxY`, `boxX` (`boxRows` for reusable stats) |
| Density ridges | `ridgelineY`, `ridgelineX`, `violinY`, `violinX` |
| References | `ruleX`, `ruleY` |
| Categorical bands | `bandX`, `bandY` |
| Labels / frame | `text`, `frame` |
| Directed relations | `arrow`, `link`, `vector` |
| Glyphs | `tickX`, `tickY` |
| Facets | `facet`, `facetChart` |
| Views | `composeViews`, `viewGrid` from `@tanstack/charts/view` |
| Focus-gated layers | `whenFocused(mark, filter?)` |
| Data-less cursor | `crosshair` from `@tanstack/charts/crosshair` |
| Hierarchy / network / spatial | exact subpaths — not assumed on the root |

`link` supports per-datum `strokeWidth` / `strokeOpacity` (Sankey-style composition). Polar/geo/spatial/hierarchy/network stay on capability subpaths so Cartesian charts stay lean.

## Layer Order

Marks earlier in the array paint behind later marks. Default: background → reference bands/rules → primary geometry → highlight dots → labels.

### Decorative layers

When two marks describe the same observations, one layer should own hit-testing:

```ts
import { decorative } from '@tanstack/charts/mark/decorative'

const marks = [
  decorative(lineY(rows, { x: 'date', y: 'value' })),
  dot(rows, { x: 'date', y: 'value' }),
]
```

`decorative(mark)` keeps scale channels, layout, motion, and paint. It removes interaction points. Input must be an always-painted mark without focus/state behavior.

Reusable units of ordinary marks: `compositeMark` from `@tanstack/charts/mark/composite`.

## Mark And Datum Identity

- Explicit `id` when marks are conditional, reordered, or must reconcile across definitions.
- Infer datum identity from unique `id`, nested `data.id`, or mark-specific position.
- Supply `key` when inferred identity is not stable. Avoid array-index keys.
- Optional `states` for focus-driven presentation overrides.

## Grouping, Color, And Stacking

`z` partitions connected geometry. Authored `color` can also create path groups when `z` is omitted; explicit `z` wins.

**Single length channels stack implicitly** at repeated categorical positions:

```ts
barY(rows, { x: 'quarter', y: 'revenue', color: 'region' })
```

Side-by-side:

```ts
barY(rows, {
  x: 'quarter',
  y: 'revenue',
  color: 'region',
  layout: group(),
})
```

`layout: group()` groups by `z` when present, otherwise by discrete `color`.

Explicit stack policy:

```ts
layout: stack({
  order: ['Core', 'Services'],
  offset: 'normalize',
  reverse: false,
})
```

`y1`/`y2` (or `x1`/`x2`) **opts out** of implicit stacking. Prefer `stackRowsY` / `stackRowsX` when endpoints are reused outside the mark. Do not use obsolete `groupScale`.

## Gaps, Curves, Style

`lineY` / `areaY` split at missing positional values. Treat breaks as evidence.

Straight paths need no `d3-shape`. Opt in:

```ts
import { curveMonotoneX } from 'd3-shape'
import { d3Curve, lineY } from '@tanstack/charts'

lineY(rows, { x: 'date', y: 'value', curve: d3Curve(curveMonotoneX) })
```

Horizontal `areaX` uses `d3AreaXCurve` from `@tanstack/charts/d3/area-x`.

`fill`/`stroke` bypass the color scale. Dot `r` is pixels unless `rScale` is provided; use `scaleSqrt` for quantitative area.

## Polar And Geo

```ts
import { pie, polar, radialArc, focusGroupAngle } from '@tanstack/charts/polar'
import { geoShape } from '@tanstack/charts/geo'
```

Ordinary pies can keep default nearest focus (`radialArc` attaches slice geometry, including the donut hole). Multi-series radial charts: `focus: focusGroupAngle`.

## Escalation Order

1. One built-in or first-party composite (`boxY`, `waffleY`, `sankeyDiagram`, …)
2. Several built-ins sharing scales
3. Implicit stack / `layout: group()` / `layout: stack()`
4. Facets, `composeViews`, or linked views
5. TanStack or D3-prepared rows into built-ins
6. `compositeMark`
7. `createMark`
8. Application overlay / gesture controller

## Misleading Defaults To Avoid

- Bars without a zero baseline when magnitude is the task
- Lines connecting unordered categories
- Dual unrelated quantitative axes — prefer small multiples
- Stacks when interior-layer comparison matters (`group()` or facets)
- Essential state encoded with color alone
- Jumping to 3D or decorative effects for analytical marks
