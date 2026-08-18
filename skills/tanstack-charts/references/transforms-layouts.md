# Transforms And Layouts

Snapshot: `@tanstack/charts@0.14.0`.

Transforms are eager functions: rows in, rows out. They do not rewrite mark options, cache results, or own framework reactivity.

```text
source rows → data transforms → mark channels → mark layout
```

Use a channel accessor for a one-row calculation, a data transform for reusable cross-row work, and `layout: stack()` / `layout: group()` when geometry belongs only to one mark.

## Transform Catalog

| Export | Result |
| --- | --- |
| `fold` | Wide fields → long key/value rows |
| `groupBy` | Named group fields, reducer outputs, lineage |
| `binX`, `binY` | Numeric intervals on one axis |
| `binXY` | Numeric cells |
| `binTimeX`, `binTimeY` | Calendar-aligned intervals (supply a time interval) |
| `rollingWindow` | Flat rows + rolling outputs (**not** `window`) |
| `cumulative` | Running outputs |
| `rank` | Ranks (competition, dense, ordinal ties) |
| `normalize` | Normalized values |
| `select` | Selected original rows |
| `stackRowsX`, `stackRowsY` | Stack endpoints |
| `mosaicX`, `mosaicY` | Two proportional interval dimensions |
| `boxRows` | Tukey summary + outliers |
| `linearRegressionRowsX/Y` | Sampled fits and confidence bounds |
| `waterfall` | Signed contributions as cumulative intervals |
| `quantile` | Quantile reducer factory |
| `treeLayout` | Tidy-tree nodes/links (`/hierarchy/tree`) |
| `forceLayout` | Stopped force settlement (`/network/force`) |

Granular entries: `@tanstack/charts/transform`, `/transform/bin`, `/bin-time`, `/bin-xy`, `/cumulative`, `/fold`, `/group`, `/mosaic`, `/normalize`, `/rank`, `/reduce`, `/select`, `/stack`, `/waterfall`, `/rolling-window`, plus `@tanstack/charts/box`, `/regression`, `/hierarchy/tree`, `/network/force`.

Root re-exports common helpers for ordinary apps.

## Group Fields And Reducers

Accessors are `(datum, { index, data })` (not a single `context` object):

```ts
import { groupBy, quantile, rollingWindow } from '@tanstack/charts'
import { utcDay } from 'd3-time'

const daily = groupBy(orders, {
  by: {
    region: 'region',
    day: (datum) => utcDay.floor(datum.createdAt),
  },
  outputs: {
    revenue: { value: 'amount', reduce: 'sum' },
    orders: { reduce: 'count' },
    p90: { value: 'latency', reduce: quantile(0.9) },
  },
})
```

Compact reducers: `count`, `sum`, `mean`, `min`, `max`. Tree-shakeable: `median`, `variance`, `deviation`, `first`, `last`, **`delta`**, `ratio`, `quantile`. (`difference` was renamed to `delta` in `0.8.0`.)

Custom reducers receive `{ values, data, indexes, group }`. Empty `count`/`sum` → `0`; other empty numeric results → `NaN`.

Results expose `source` / `sourceIndexes`. Those names are reserved.

## Fold, Rolling, Mosaic, Waterfall

```ts
import { fold } from '@tanstack/charts/transform/fold'

const points = fold(rows, {
  fields: ['R90_10_1980', 'R90_10_2015'] as const,
  as: { key: 'periodField', value: 'inequality' },
})
```

```ts
const trends = rollingWindow(daily, {
  by: 'region',
  orderBy: 'day',
  size: 28,
  partial: false,
  outputs: {
    revenue28d: { value: 'revenue', reduce: 'sum' },
  },
})
```

`mosaicY` allocates outer category totals across x, then normalizes y within each x category. Aggregate with `groupBy` first; duplicate x/y pairs throw.

`waterfall` turns **already computed** signed contributions into `start`/`end` intervals. `total: true` appends a synthetic total row. Pair with `barY` + `y1`/`y2`.

## Hierarchy And Force

```ts
import { treeLayout } from '@tanstack/charts/hierarchy/tree'
import { forceLayout } from '@tanstack/charts/network/force'
```

`treeLayout` accepts either `path` + `delimiter` or `id`/`parentId` (mutually exclusive). Output `x`/`y` are semantic; positional scales still own pixels. Uncached — memoize.

`forceLayout` ticks a **stopped** simulation synchronously and returns nodes/links plus `xDomain`/`yDomain`. It does not run live physics or own drag. Keep live simulation in application state.

## Memoize At The Owner

```tsx
const histogram = useMemo(
  () => binX(observations, { value: 'latency', thresholds: 24 }),
  [observations],
)
```

Charts does not add a cache. Numeric `thresholds` may be a count, boundary array, or D3-compatible callback.

## Mark Layout Vs Data Transforms

| Need | Prefer |
| --- | --- |
| Stack geometry for one bar/area | Implicit stack or `layout: stack()` |
| Side-by-side bars | `layout: group()` |
| Reused stack endpoints | `stackRowsY` / `stackRowsX` then `y1`/`y2` |
| Aggregation, bins, rolling stats | `groupBy` / `bin*` / `rollingWindow` |
| Specialized statistics or spatial algorithms | Application D3 / SQL / server, or exact `/spatial/*` marks |

Keep series order and colors stable. Preserve raw values for tooltips when geometry is normalized.
