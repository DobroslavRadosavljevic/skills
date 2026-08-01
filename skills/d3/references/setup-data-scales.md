# D3 Data Prep, Scales & Color

Stable target: **`d3@7.9.x`** with module majors under the umbrella (see [source-map.md](source-map.md)).

## Mental model

```text
raw data → coerce types → summarize/group/bin/sort (d3-array)
  → choose scale from data kind → domain from data → range = visual channel
  → map datum through scale → format ticks/labels
```

| Kind | Domain | Range | Typical scales |
| --- | --- | --- | --- |
| Continuous quantitative | numbers / dates | pixels, sizes, continuous color | `linear`, `pow`, `sqrt`, `log`, `symlog`, `time`, `utc`, `sequential` |
| Continuous → discrete | continuous | discrete colors/bins | `quantize`, `quantile`, `threshold` |
| Categorical | categories | colors or banded positions | `ordinal`, `band`, `point` |

## Install

```bash
bun add d3
# or
bun add d3-array d3-scale d3-scale-chromatic d3-format d3-time d3-time-format d3-fetch
```

## `d3-array`

Docs: https://d3js.org/d3-array

### Summaries

`extent`, `min`, `max`, `sum`, `mean`, `median`, `mode`, `count`, `deviation`, `variance`, `quantile`, `cumsum`, `fsum` / `Adder`, `least` / `greatest` (+ Index variants).

Pitfalls: `min`/`max` use natural order and **do not coerce strings to numbers**; ignore nullish/NaN; empty extent → `[undefined, undefined]`.

### Group / rollup

```js
d3.group(data, (d) => d.category);
d3.rollup(data, (v) => v.length, (d) => d.category);
d3.groups(data, (d) => d.category); // [key, values][]
d3.flatRollup(data, (v) => d3.sum(v, (d) => d.value), (d) => d.a, (d) => d.b);
d3.groupSort(data, (g) => -d3.sum(g, (d) => d.value), (d) => d.category);
```

`index` / `indexes` require unique keys (throw on duplicates). **No `d3.nest`.**

### Bin

```js
const bin = d3
  .bin()
  .value((d) => d.x)
  .domain(x.domain())
  .thresholds(x.ticks(20));
const bins = bin(data); // each bin: array + x0 (inclusive) + x1 (exclusive except last)
```

Thresholds: Sturges (default), `thresholdScott`, `thresholdFreedmanDiaconis`. Alias `histogram` is deprecated.

### Bisect / ticks / sort

- `bisectLeft` / `bisectRight` / `bisectCenter` / `bisector` — **sorted** arrays only (tooltip nearest-x).
- `ticks(start, stop, count)`, `nice(start, stop, count)`, `range`.
- `d3.sort(iterable, …)` — **non-mutating**; prefer over `Array.sort` for numeric data.

## `d3-dsv` / `d3-fetch`

```js
import { csv } from "d3-fetch";
import { autoType } from "d3-dsv";

const rows = await csv("data.csv", autoType); // or custom row function
```

Also: `tsv`, `json`, `text`, `xml`, `html`, `svg`, `blob`, `image`. String-only parse: `csvParse` / `tsvParse` from `d3-dsv`.

## `d3-format` / `d3-time` / `d3-time-format`

```js
d3.format(".2f")(3.14159);
d3.format("$.2s")(1500);

d3.timeDay.offset(new Date(), -7);
d3.timeMonth.every(3);

const parse = d3.timeParse("%Y-%m-%d");
const format = d3.timeFormat("%b %d");
```

Use **`utc*`** intervals/formatters when data is UTC; local `time*` follows the environment timezone. Locales via `formatLocale` / `timeFormatLocale`.

## `d3-random`

`randomUniform`, `randomNormal`, `randomInt`, … plus `randomLcg(seed)` and `.source(lcg)` for deterministic demos/tests.

## `d3-scale`

Docs: https://d3js.org/d3-scale

D3 7 constructors accept `(domain, range)` or range-only (domain defaults).

```js
const x = d3.scaleLinear([0, 100], [0, width]);
const y = d3.scaleLinear(d3.extent(data, (d) => d.value), [height - margin.bottom, margin.top]);
const xc = d3.scaleBand(categories, [0, width]).padding(0.1);
```

| Scale | Use |
| --- | --- |
| `scaleLinear` | Default continuous position/size |
| `scalePow` / `scaleSqrt` | Nonlinear magnitude; sqrt for area→radius |
| `scaleLog` | Log axes — domain must not include/cross **0** |
| `scaleSymlog` | Near-zero continuous |
| `scaleTime` / `scaleUtc` | Temporal position |
| `scaleRadial` | Radial bars |
| `scaleSequential` / `scaleSequentialLog`/… | Continuous → color via interpolator |
| `scaleDiverging` | Diverging color around a pivot |
| `scaleQuantize` | Equal-interval bins |
| `scaleQuantile` | Equal-count bins |
| `scaleThreshold` | Explicit thresholds |
| `scaleOrdinal` | Category → discrete (colors) |
| `scaleBand` | Category → bars (`.bandwidth()`, `.padding`, `.paddingInner`/`Outer`, `.align`) |
| `scalePoint` | Category → points (no bandwidth) |

Common methods: `domain`, `range`, `rangeRound`, `clamp`, `nice`, `ticks`, `tickFormat`, `invert` (continuous), `unknown`, `copy`.

Ordinal domains use **InternMap** (D3 7) — uniqued via `valueOf`.

## `d3-scale-chromatic`

| Kind | Examples | Use |
| --- | --- | --- |
| Categorical schemes | `schemeCategory10`, `schemeTableau10`, `schemeSet2` | `scaleOrdinal().range(scheme…)` |
| Sequential interpolators | `interpolateBlues`, `interpolateViridis`, `interpolateTurbo` | `scaleSequential(interpolator)` |
| Diverging | `interpolateRdBu`, `interpolatePiYG` | `scaleDiverging` |
| Cyclical | `interpolateRainbow`, `interpolateSinebow` | Periodic / angle |

Prefer perceptually uniform ramps (viridis/cividis) for quantitative maps; categorical schemes for unordered categories.

## `d3-color` / `d3-interpolate`

```js
d3.rgb("#ff0000").brighter(1);
d3.hsl("steelblue");
d3.interpolateRgb("red", "blue")(0.5);
d3.piecewise(d3.interpolateRgb, ["red", "white", "blue"]);
d3.interpolateZoom([x0, y0, w0], [x1, y1, w1]);
```

Spaces: `rgb`, `hsl`, `lab`, `hcl`/`lch`, `cubehelix`, `gray`. Interpolators power scale ranges and transitions.

## Minimal CSV → scale → map

```js
import * as d3 from "d3";

const data = await d3.csv("a.csv", d3.autoType);
const width = 640;
const height = 400;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const x = d3
  .scaleUtc()
  .domain(d3.extent(data, (d) => d.date))
  .range([margin.left, width - margin.right]);
const y = d3
  .scaleLinear()
  .domain([0, d3.max(data, (d) => d.value)])
  .nice()
  .range([height - margin.bottom, margin.top]);

const points = data.map((d) => ({ cx: x(d.date), cy: y(d.value), d }));
```

## Gotchas

1. String domains in `min`/`max`/`extent` without numeric coercion.
2. Log scale with 0 / negatives.
3. Forgetting inverted y range.
4. Using `scalePoint` when bar width is needed (or vice versa).
5. Mutating a shared scale’s domain/range across renders without copying.
6. Relying on `d3.nest`.
7. Assuming `autoType` is enough for custom date formats — use `timeParse`.
