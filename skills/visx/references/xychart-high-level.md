# visx XYChart, Animation & Meta Packages

## Philosophy → when to use XYChart

visx primitives let you build a custom chart kit. **`@visx/xychart`** is the high-level **cartesian** API when boilerplate for scales, series registry, tooltips, theme, and annotations dominates.

| Choose | When |
| --- | --- |
| `@visx/xychart` | Line/area/bar/glyph/stack/group, shared tooltip/theme, linked small multiples via providers |
| Primitive composition | Polar/geo/hierarchy/network/stats, custom SVG, minimal deps |
| Custom library on visx | Org design-system charts that hide scales/D3 |
| 4.1 registry / `@visx/chart` | Shadcn-style copy-in starters — **not published** on 4.0.0 |

## `@visx/xychart`

Docs: https://visx.airbnb.tech/docs/xychart · Gallery: https://visx.airbnb.tech/xychart

### Install

```bash
bun add @visx/xychart@^4
# Animated* components also need:
bun add @react-spring/web
```

Peer is `@react-spring/web` (^9.7.5 || ^10), not the older `react-spring` package name alone — install what peers declare. Static series work without spring.

### Basic animated line chart

```tsx
import {
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  XYChart,
  Tooltip,
} from '@visx/xychart';

const accessors = {
  xAccessor: (d: { x: string; y: number }) => d.x,
  yAccessor: (d: { x: string; y: number }) => d.y,
};

export function Chart() {
  return (
    <XYChart height={300} xScale={{ type: 'band' }} yScale={{ type: 'linear' }}>
      <AnimatedAxis orientation="bottom" />
      <AnimatedGrid columns={false} numTicks={4} />
      <AnimatedLineSeries dataKey="Line 1" data={data1} {...accessors} />
      <AnimatedLineSeries dataKey="Line 2" data={data2} {...accessors} />
      <Tooltip
        snapTooltipToDatumX
        snapTooltipToDatumY
        showVerticalCrosshair
        showSeriesGlyphs
        renderTooltip={({ tooltipData, colorScale }) => (
          <div>
            <div style={{ color: colorScale?.(tooltipData?.nearestDatum?.key) }}>
              {tooltipData?.nearestDatum?.key}
            </div>
            {/* format datum */}
          </div>
        )}
      />
    </XYChart>
  );
}
```

### Series types

| Component | Role |
| --- | --- |
| `(Animated)LineSeries` | Path through points; `curve`, `colorAccessor` |
| `(Animated)AreaSeries` | Fill to baseline; `x0`/`y0` accessors (not for AreaStack) |
| `(Animated)AreaStack` | Stacked areas (children series) |
| `(Animated)BarSeries` | One bar per datum |
| `(Animated)BarGroup` / `(Animated)BarStack` | Group / stack child bars |
| `(Animated)GlyphSeries` | Scatter / custom glyphs (`renderGlyph`, `size`) |

Common props: `dataKey` (unique), `data`, `xAccessor`, `yAccessor`, pointer/focus handlers, `enableEvents`. Missing/`null` data supported. Horizontal via chart `horizontal` / scale inference.

### Scale config (not live d3 scales)

Pass **`ScaleConfig` objects**:

```tsx
<XYChart xScale={{ type: 'band' }} yScale={{ type: 'linear', nice: true, zero: true }} />
```

Types include `linear | log | pow | sqrt | symlog | radial | time | utc | quantile | quantize | threshold | ordinal | point | band`. Domains usually inferred from registered series.

### Providers / contexts

| Layer | Provider | Use |
| --- | --- | --- |
| Data + scales + dims | `DataProvider` / `DataContext` | Series registry |
| Theme | `ThemeProvider` / `ThemeContext` | Visual tokens |
| Events | `EventEmitterProvider` + `useEventEmitter` | Linked events |
| Tooltip | `TooltipProvider` / `TooltipContext` | Programmatic tooltips |

`XYChart` auto-wraps missing providers. Hoist providers above multiple charts for linked tooltips / shared theme.

### Tooltip content

`renderTooltip` receives `tooltipData.nearestDatum` (global nearest), `tooltipData.datumByKey` (per-series nearest for shared tooltips), and `colorScale`.

### Annotations

Use XYChart’s `Annotation` / `AnimatedAnnotation` with `AnnotationLabel`, `AnnotationConnector`, `AnnotationCircleSubject`, `AnnotationLineSubject` (theme/dimension-aware wrappers).

### Events

Chart- or series-level: `onPointerMove|Out|Up|Down`. Series also: `onFocus` / `onBlur`. Disable with `enableEvents={false}`.

### XYChart gotchas (v4)

- Axes render **null** until a non-empty series registers (no more `[0,1]` tick flash). Placeholder: raw `@visx/axis` until data ready.
- Pass numeric `width`/`height` or rely on ResizeObserver; polyfill via `resizeObserverPolyfill`.
- Prefer static series when animation unused (bundle).

### Theming

`lightTheme`, `darkTheme`, `buildChartTheme` — see [guides-decoration.md](guides-decoration.md).

## `@visx/react-spring`

Narrow primitive animation: `AnimatedAxis`, `AnimatedTicks`, `AnimatedGridRows`, `AnimatedGridColumns`. Trajectory type: `'outside' | 'center' | 'min' | 'max'`.

Use when composing primitives (not XYChart). XYChart’s `Animated*` series/axis/grid are the higher-level path.

Docs: https://visx.airbnb.tech/docs/react-spring

## `@visx/mock-data`

Generators: `genDateValue`, `genRandomNormalPoints`, `genBin`, `genBins`, `genPhyllotaxis`, `genStats`, `getSeededRandom`, `getRandomNormal`.

Static: `appleStock`, `bitcoinPrice`, `letterFrequency`, `browserUsage`, `groupDateValue`, `cityTemperature`, `lesMiserables`, `exoplanets`, `planets`, `shakespeare`.

Demos/tests only.

## `@visx/visx` umbrella

One install; re-exports namespaces (`Scale`, `Shape`, `XYChart`, …).

**Not included:** `@visx/chord`, `@visx/stats`, `@visx/react-spring`, `@visx/vendor`.

Prefer individual packages in production bundles. Still need spring peer for animated XYChart.

## `@visx/chart` / registry (4.1 preview)

- `@visx/chart`: chart-level hooks (`useChartDimensions`, …) — **not on npm** at 4.0.0.
- `@visx/registry`: private distribution for shadcn-style chart starters — not a runtime import.
- Do not instruct installs until published.
