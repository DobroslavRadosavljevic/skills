# Transforms And Layouts

Snapshot: `@tanstack/charts@0.6.5` (transform surface stable since `0.3.0`).

Transforms are ordinary eager functions: rows in, rows out. They do not rewrite mark options, cache results, or own framework reactivity.

```text
source rows → data transforms → mark channels → mark layout
```

Use a channel accessor for a one-row calculation, a data transform for reusable cross-row work, and `layout: stack()` / `layout: group()` when geometry belongs only to one mark.

## Transform Catalog

| Export | Result |
| --- | --- |
| `groupBy` | Named group fields, reducer outputs, lineage |
| `binX`, `binY` | Numeric intervals on one axis |
| `binXY` | Numeric cells with x and y intervals |
| `binTimeX`, `binTimeY` | Calendar-aligned intervals (supply a time interval) |
| `window` | Flat rows extended with rolling outputs |
| `cumulative` | Flat rows extended with running outputs |
| `rank` | Flat rows extended with ranks |
| `normalize` | Flat rows extended with normalized values |
| `select` | Selected original rows |
| `stackRowsX`, `stackRowsY` | Flat rows extended with stack endpoints |
| `quantile` | Reusable quantile reducer factory |

Granular entry points (prefer these in bundle-sensitive code):

- `@tanstack/charts/transform`
- `@tanstack/charts/transform/bin`
- `@tanstack/charts/transform/bin-time`
- `@tanstack/charts/transform/bin-xy`
- `@tanstack/charts/transform/cumulative`
- `@tanstack/charts/transform/group`
- `@tanstack/charts/transform/normalize`
- `@tanstack/charts/transform/rank`
- `@tanstack/charts/transform/reduce`
- `@tanstack/charts/transform/select`
- `@tanstack/charts/transform/stack`
- `@tanstack/charts/transform/window`

Root also re-exports the common transform functions for ordinary apps.

## Group Fields And Reducers

`by: 'region'` preserves the field name. Compound groups use a named object:

```ts
import { groupBy, quantile, window } from '@tanstack/charts'
import { utcDay } from 'd3-time'

const daily = groupBy(orders, {
  by: {
    region: 'region',
    day: ({ datum }) => utcDay.floor(datum.createdAt),
  },
  outputs: {
    revenue: { value: 'amount', reduce: 'sum' },
    orders: { reduce: 'count' },
    averageOrder: { value: 'amount', reduce: 'mean' },
    p90: { value: 'latency', reduce: quantile(0.9) },
  },
})
```

Compact reducers: `count`, `sum`, `mean`, `min`, `max`. Tree-shakeable helpers: `median`, `variance`, `deviation`, `first`, `last`, `difference`, `ratio`, `quantile`.

Custom reducers receive `{ values, data, indexes, group }`. Empty `count`/`sum` → `0`; other empty numeric results → `NaN`.

Results expose lineage via `source` / `sourceIndexes` for tooltips, drill-down, and further transforms. Structural names `source` and `sourceIndexes` are reserved.

## Rolling And Ranking

```ts
const trends = window(daily, {
  by: 'region',
  orderBy: 'day',
  size: 28,
  partial: false,
  outputs: {
    revenue28d: { value: 'revenue', reduce: 'sum' },
    averageOrder28d: { value: 'averageOrder', reduce: 'mean' },
  },
})

lineY(trends, { x: 'day', y: 'revenue28d', color: 'region' })
```

One-to-one transforms spread the input row and add named outputs—no nested `datum.datum` path. `rank` orders by its `value` and supports competition, dense, and ordinal ties.

## Binning

```ts
import { binX } from '@tanstack/charts'

const histogram = binX(observations, {
  value: 'latency',
  thresholds: 24, // count, boundary array, or D3-compatible callback
})

rect(histogram, {
  x1: 'x1',
  x2: 'x2',
  y1: () => 0,
  y2: 'count',
  inset: 1,
})
```

Numeric, calendar, and 2D bins are separate entry points so specialized binning does not enlarge an ordinary histogram.

## Escape Hatch

Field names and object-bag callbacks are interchangeable. For anything outside built-ins, use ordinary functions:

```ts
const active = rows.filter((row) => row.active)
const enriched = active.map(enrichRow)
const summaries = groupBy(enriched, options)
```

There is no pipeline protocol to learn.

## Memoize At The Owner

```tsx
const histogram = useMemo(
  () => binX(observations, { value: 'latency', thresholds: 24 }),
  [observations],
)
```

Use `computed`, `createMemo`, `$derived`, or the equivalent application primitive. Charts does not add a cache or reactive graph. Memoize transforms beside the definition that consumes them when both capture the same inputs.

## Mark Layout Vs Data Transforms

| Need | Prefer |
| --- | --- |
| Stack geometry for one bar/area mark | Implicit stack or `layout: stack()` |
| Side-by-side bars | `layout: group()` |
| Stack endpoints reused elsewhere | `stackRowsY` / `stackRowsX` then marks with `y1`/`y2` |
| Aggregation, bins, rolling stats | `groupBy` / `bin*` / `window` / … |
| Specialized statistics or spatial algorithms | Application D3 / SQL / server |

```ts
// geometry only — stack on the mark
barY(rows, { x: 'quarter', y: 'revenue', color: 'product' })

// explicit grouped geometry
barY(rows, {
  x: 'quarter',
  y: 'revenue',
  color: 'product',
  layout: group(),
})
```

## Stacked Composition Choices

| Reader question | Start with |
| --- | --- |
| Contributions to a changing total | Stacked area / bars |
| Proportional mix (ignore magnitude) | `layout: stack({ offset: 'normalize' })` |
| Broad shape of many positive series | `offset: 'center'` or `'wiggle'` |
| Two categorical part-to-whole dims | Mosaic via `rect` endpoints |
| Precise subgroup comparison | `layout: group()` or aligned small multiples |
| Positive and negative contributions | Default diverging stack around zero |

Keep series order and colors stable across updates. Preserve raw values for tooltips even when geometry is normalized.
