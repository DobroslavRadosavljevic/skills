# visx Setup & Core Primitives

Stable target: **`@visx/*@4.0.0`**, React **18/19**.

## Mental Model

1. visx is a **collection of low-level primitives**, not an opinionated charting library ([homepage](https://visx.airbnb.tech/)).
2. **D3 computes geometry; React owns the DOM.** No d3 selections / `enter`/`exit` for these marks.
3. Typical cartesian stack:

```text
<svg width height>
  <defs> gradients / patterns / clipPaths / markers </defs>
  <Group top={margin.top} left={margin.left}>
    grids / axes / shapes / glyphs
  </Group>
</svg>
```

4. SVG `y` increases **downward** → continuous y scales almost always use `range: [innerHeight, 0]`.
5. v4 supported surface = **package-root named imports** only.

## Install Strategy

Prefer individual packages (bundle control). Upgrade **all** `@visx/*` together.

```bash
bun add @visx/scale@^4 @visx/shape@^4 @visx/group@^4
# add as needed:
# @visx/curve @visx/axis @visx/grid @visx/legend @visx/tooltip
# @visx/responsive @visx/glyph @visx/text @visx/gradient @visx/pattern
# @visx/clip-path @visx/marker @visx/vendor
```

Umbrella (convenient, heavier):

```bash
bun add @visx/visx@^4
```

TypeScript: install `@types/react` (and `@types/react-dom` when using bounds/tooltip/xychart) matching the React major.

Do **not** install `@visx/theme`, `@visx/a11y`, `@visx/chart`, or `@visx/kernel` on 4.0.0 — they are not published yet (see [source-map.md](source-map.md)).

## `@visx/vendor`

Vendored dual ESM/CJS D3 packages. **No package-root index** — import subpaths:

```ts
import { extent, max } from '@visx/vendor/d3-array';
import { line } from '@visx/vendor/d3-shape';
```

Common subpaths: `d3-scale`, `d3-shape`, `d3-array`, `d3-time`, `d3-time-format`, `d3-interpolate`, `d3-color`, `d3-format`, `d3-geo`, `d3-path`, `d3-delaunay`, `internmap`.

Prefer vendor (or declare your own `d3-*`) instead of relying on transitive deps. v4 uses d3-shape/path **v3** through vendor.

## `@visx/scale`

Config-object wrappers around d3-scale.

```ts
import {
  scaleBand,
  scaleLinear,
  scaleTime,
  scaleOrdinal,
  createScale,
  getTicks,
  coerceNumber,
} from '@visx/scale';

const xScale = scaleBand({
  domain: cats,
  range: [0, xMax],
  padding: 0.4,
  round: true,
});

const yScale = scaleLinear({
  domain: [0, maxY],
  range: [yMax, 0],
  nice: true,
});

// equivalent
const y2 = createScale({ type: 'linear', domain: [0, maxY], range: [yMax, 0], nice: true });
```

### Scale types

| Factory | `createScale` type | Typical use |
| --- | --- | --- |
| `scaleBand` | `'band'` | Bars (`.bandwidth()`) |
| `scalePoint` | `'point'` | Categorical lines/scatter (no bandwidth) |
| `scaleLinear` | `'linear'` | Continuous default |
| `scaleTime` / `scaleUtc` | `'time'` / `'utc'` | Time axes |
| `scaleLog` | `'log'` | Log axes — domain must not include/cross **0** |
| `scalePower` / `scaleSqrt` | `'pow'` / `'sqrt'` | Power / sqrt |
| `scaleSymlog` | `'symlog'` | Near-zero continuous |
| `scaleRadial` | `'radial'` | Radial bars |
| `scaleOrdinal` | `'ordinal'` | Colors / discrete maps |
| `scaleQuantize` / `scaleQuantile` / `scaleThreshold` | `'quantize'` / `'quantile'` / `'threshold'` | Binned / choropleth color |

Shared config fields: `domain`, `range`, `reverse`, `round`, `clamp`, `nice`, `zero` (not for log/time/utc), `unknown`, `interpolate`. Band/point: `padding`, `paddingInner`, `paddingOuter`, `align`.

Helpers: `updateScale`, `inferScaleType`, `getTicks`, `coerceNumber`, `scaleCanBeZeroed`.

Type: `ScaleInput<Scale>` = parameter of the scale call.

### Scale pitfalls

- Forgetting inverted y `range`.
- Band/ordinal returning `undefined` → use `?? 0`.
- Using `scalePoint` when bar width is needed.
- Log domain with 0 / negatives.
- Mutating a module-level scale’s `.range()` across renders without memoization — prefer `useMemo` with full config from width/height.
- Assuming `@visx/scale/react` / `useScale` exist in 4.0.0 (4.1 only).

Colors: pair `scaleOrdinal` with `d3-scale-chromatic` schemes when needed.

Docs: https://visx.airbnb.tech/docs/scale

## `@visx/shape`

Core marks. Rest props accept SVG attributes (`stroke`, `fill`, `clipPath`, events, …).

### High-frequency marks

| Export | Notes |
| --- | --- |
| `Bar` | Thin `<rect>`; you compute `x/y/width/height` |
| `BarRounded` | Requires `radius` + corner flags |
| `Line` | Segment via `from` / `to` |
| `LinePath` | `data`, `x`, `y`, `defined`, `curve`; default `fill="transparent"` |
| `Area` / `AreaClosed` | `x|x0|x1`, `y|y0|y1`; **`AreaClosed` requires `yScale`** (baseline = `yScale.range()[0]`) |
| `AreaStack` / `BarStack` / `BarGroup` (+ horizontal variants) | Stacked/grouped layouts |
| `Arc` / `Pie` | Angles; pie **0 at 12 o'clock, clockwise**; default sort preserves input order |
| `Circle` / `Polygon` / `SplitLinePath` / `LineRadial` | Misc |
| `LinkHorizontal` / `LinkVertical` / `LinkRadial` (+ Curve/Line/Step) | Hierarchy edges; **LinkHorizontal defaults swap x/y** |

Also exports path factories (`arc`, `area`, `line`, `pie`, …) and utils (`getBandwidth`, accessors).

```tsx
import { Bar, LinePath, AreaClosed, Pie } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';

<LinePath
  data={data}
  x={(d) => xScale(d.date) ?? 0}
  y={(d) => yScale(d.value) ?? 0}
  stroke="#8921e0"
  strokeWidth={2}
  curve={curveMonotoneX}
/>

<AreaClosed
  data={data}
  x={(d) => xScale(d.date) ?? 0}
  y={(d) => yScale(d.value) ?? 0}
  yScale={yScale}
  fill="url(#area-fill)"
  curve={curveMonotoneX}
/>
```

Pie render-prop for full control: `children={({ arcs, path, pie }) => …}`.

Docs: https://visx.airbnb.tech/docs/shape

## `@visx/curve`

Re-exports from `@visx/vendor/d3-shape`:

`curveLinear`, `curveLinearClosed`, `curveMonotoneX`, `curveMonotoneY`, `curveBasis` (+Open/Closed), `curveCardinal` (+…), `curveCatmullRom` (+…), `curveNatural`, `curveStep` / `After` / `Before`, `curveBundle`.

| Curve | Use |
| --- | --- |
| `curveMonotoneX` | Time-series lines/areas — **x must be monotonic** (sort data) |
| `curveStep*` | Step charts |
| `curveBundle` | **Line-only** — do not pass to `Area` / `AreaClosed` |

```ts
import { curveMonotoneX } from '@visx/curve';
```

Docs: https://visx.airbnb.tech/docs/curve

## `@visx/group` / `@visx/point`

```tsx
import { Group } from '@visx/group';
<Group top={margin.top} left={margin.left}>{/* plot */}</Group>
```

`Point`, `sumPoints`, `subtractPoints` from `@visx/point` for small geometry helpers.

## Glyphs & markers

### `@visx/glyph`

`Glyph` (positioned group), `GlyphDot` (`r`/`cx`/`cy`), symbol glyphs (`GlyphCircle`, `GlyphCross`, `GlyphDiamond`, `GlyphStar`, `GlyphTriangle`, `GlyphWye`, `GlyphSquare`).

Symbol `size` is **area in px²** (d3 convention), not radius.

### `@visx/marker`

Defs: `Marker`, `MarkerArrow`, `MarkerCross`, `MarkerX`, `MarkerCircle`, `MarkerLine`. Unique `id`, then `markerEnd="url(#id)"` on paths.

## Text, clip, pattern, gradient

### `@visx/text`

SVG text with wrap (`width`), `verticalAnchor`, `angle`, `scaleToFit`. Implementation nests an inner `<svg>` — not HTML. For HTML overlays use tooltip/annotation HTML paths.

### `@visx/clip-path`

`ClipPath`, `RectClipPath`, `CircleClipPath` → `clipPath="url(#id)"` on marks (also used with zoom).

### `@visx/pattern`

`Pattern`, `PatternLines`, `PatternCircles`, `PatternWaves`, `PatternHexagons`, `PatternPath`, `PatternOrientation`. Fill with `url('#id')`.

### `@visx/gradient`

`LinearGradient`, `RadialGradient`, plus presets (`GradientPinkBlue`, `GradientTealBlue`, …). Reference with `fill="url('#id')"`.

## Minimal bar recipe

```tsx
import { letterFrequency } from '@visx/mock-data';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';

const data = letterFrequency;
const width = 500;
const height = 300;
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const xMax = width - margin.left - margin.right;
const yMax = height - margin.top - margin.bottom;
const getLetter = (d: (typeof data)[number]) => d.letter;
const getFrequency = (d: (typeof data)[number]) => d.frequency * 100;

const xScale = scaleBand({
  range: [0, xMax],
  round: true,
  domain: data.map(getLetter),
  padding: 0.4,
});
const yScale = scaleLinear({
  range: [yMax, 0],
  round: true,
  domain: [0, Math.max(...data.map(getFrequency))],
});

export function BarGraph() {
  return (
    <svg width={width} height={height}>
      <Group top={margin.top} left={margin.left}>
        {data.map((d) => {
          const letter = getLetter(d);
          const barHeight = yMax - (yScale(getFrequency(d)) ?? 0);
          return (
            <Bar
              key={letter}
              x={xScale(letter) ?? 0}
              y={yMax - barHeight}
              height={barHeight}
              width={xScale.bandwidth()}
              fill="#fc2e1c"
            />
          );
        })}
      </Group>
    </svg>
  );
}
```

Adapted from the [repo README](https://github.com/airbnb/visx/blob/master/README.md).
