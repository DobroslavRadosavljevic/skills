# visx Guides, Annotation & Theming

Stable: **4.0.0** packages below. Theme/a11y sections mark **4.1 preview** clearly.

## `@visx/axis`

Exports: `Axis`, `AxisBottom`, `AxisTop`, `AxisLeft`, `AxisRight`, `Orientation`.

| Component | Default label offset | Default tick label anchors |
| --- | --- | --- |
| `AxisBottom` | `8` | `textAnchor: 'middle'`, `dy: '0.25em'` |
| `AxisTop` | `8` | `textAnchor: 'middle'`, `dy: '-0.75em'` |
| `AxisLeft` | `36` | `textAnchor: 'end'`, `dx: '-0.25em'`, `dy: '0.25em'` |
| `AxisRight` | `36` | `textAnchor: 'start'`, `dx: '0.25em'`, `dy: '0.25em'` |

Key props: **`scale` (required)**, `top`/`left`, `numTicks`, `tickValues`, `tickFormat`, `tickLabelProps` (object or function), `tickLength`, `tickStroke`, `hideTicks`, `hideAxisLine`, `hideZero`, `label`, `labelOffset`, `labelProps`, `axisLineClassName`, `stroke`/`strokeWidth`, `children` render-prop.

```tsx
import { AxisBottom, AxisLeft } from '@visx/axis';

<AxisBottom
  top={yMax}
  scale={xScale}
  numTicks={width > 520 ? 10 : 5}
  tickFormat={(v) => String(v)}
  label="Month"
/>
<AxisLeft scale={yScale} tickFormat={(v) => `$${v}`} hideZero />
```

Place axes inside the margin `Group`. Sync ticks with grids via shared `tickValues` / `numTicks`.

Animated primitive axes: `AnimatedAxis` from `@visx/react-spring` (or XYChart wrappers).

Docs: https://visx.airbnb.tech/docs/axis

## `@visx/grid`

| Component | Required | Role |
| --- | --- | --- |
| `GridRows` | `scale` (y), **`width`** | Horizontal lines |
| `GridColumns` | `scale` (x), **`height`** | Vertical lines |
| `Grid` | `xScale`, `yScale`, **`width`**, **`height`** | Both |
| `GridAngle` / `GridRadial` / `GridPolar` | polar scales + radii | Polar grids |

Common: `numTicks`, `tickValues`, `stroke` (default `#eaf0f6`), `strokeWidth`, `strokeDasharray`, `top`/`left`, `children({ lines })`.

```tsx
import { GridRows, GridColumns } from '@visx/grid';

<GridRows scale={yScale} width={xMax} stroke="#e0e0e0" />
<GridColumns scale={xScale} height={yMax} stroke="#e0e0e0" />
```

Band scales offset lines to band centers. Do not swap required dimensions.

Docs: https://visx.airbnb.tech/docs/grid

## `@visx/legend`

HTML **flex** legends (usually **outside** `<svg>`), bound to scales.

| Component | Scale |
| --- | --- |
| `LegendOrdinal` | Ordinal / categorical |
| `LegendLinear` | Continuous (`steps` default 5) |
| `LegendQuantile` | Quantile |
| `LegendThreshold` | Threshold (`labelDelimiter` default `'to'`) |
| `LegendSize` | Size scale |
| `Legend` | Generic base |

Layout props use flex vocabulary: `direction` (default `'column'`), `itemDirection` (default `'row'`), `shape` (`'rect'|'circle'|'line'|component`), `shapeWidth`/`shapeHeight`, `labelFormat`, `domain`, `children(labels)`.

Primitives: `LegendItem`, `LegendLabel`, `LegendShape`, `RectShape`, `CircleShape`, `LineShape`.

Do not confuse legend `direction` with axis `orientation`.

Docs: https://visx.airbnb.tech/docs/legend

## `@visx/annotation`

Inspired by Susie Lu / react-annotation patterns.

| Export | Role |
| --- | --- |
| `Annotation` | Context `{ x, y, dx, dy }` for children |
| `EditableAnnotation` | Drag subject/label; needs **`width`/`height`** |
| `CircleSubject` / `LineSubject` | Subjects |
| `Connector` | `'elbow' | 'line'` |
| `Label` | SVG label (ResizeObserver) |
| `HtmlLabel` | HTML via `foreignObject` |
| `AnnotationContext` | Context object |

```tsx
import { Annotation, CircleSubject, Connector, Label, LineSubject } from '@visx/annotation';

<Annotation x={sx} y={sy} dx={40} dy={-20}>
  <Connector />
  <CircleSubject />
  <Label title="Peak" subtitle="Detail" showAnchorLine={false} />
</Annotation>

<Annotation x={xScale(cutoff) ?? 0} y={0}>
  <LineSubject orientation="vertical" min={0} max={yMax} />
  <Label title="Cutoff" dx={8} dy={12} />
</Annotation>
```

**Naming trap:** XYChart re-exports theme-aware wrappers as `AnnotationLabel`, `AnnotationConnector`, `AnnotationCircleSubject`, `AnnotationLineSubject` from **`@visx/xychart`**, not from `@visx/annotation`.

Pass `resizeObserverPolyfill` when needed for `Label` / `HtmlLabel`.

Docs: https://visx.airbnb.tech/docs/annotation

## `@visx/threshold`

Difference / banded region between two curves (dual clipped `Area`s). Not a substitute for a single `AreaClosed`.

Required: `id`, `data`, `x`, `y0`, `y1`, `clipAboveTo`, `clipBelowTo`. Optional: `curve`, `defined`, `aboveAreaProps`, `belowAreaProps`.

```tsx
import { Threshold } from '@visx/threshold';
import { curveBasis } from '@visx/curve';

<Threshold
  id="ny-sf"
  data={cityTemperature}
  x={(d) => timeScale(date(d)) ?? 0}
  y0={(d) => temperatureScale(ny(d)) ?? 0}
  y1={(d) => temperatureScale(sf(d)) ?? 0}
  clipAboveTo={0}
  clipBelowTo={yMax}
  curve={curveBasis}
  belowAreaProps={{ fill: 'violet', fillOpacity: 0.4 }}
  aboveAreaProps={{ fill: 'green', fillOpacity: 0.4 }}
/>
```

Stable unique `id`s (avoid `Math.random()` under SSR). Pair with `LinePath` overlays + axes/grid ([threshold sandbox](https://github.com/airbnb/visx/blob/v4.0.0/packages/visx-demo/src/sandboxes/visx-threshold/Example.tsx)).

Docs: https://visx.airbnb.tech/docs/threshold

## Theming (4.0.0 stable path)

### `@visx/xychart` themes

```ts
import { lightTheme, darkTheme, buildChartTheme } from '@visx/xychart';

const customTheme = buildChartTheme({
  backgroundColor: '#ffffff',
  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  tickLength: 4,
  gridColor: '#f3f4f6',
  gridColorDark: '#e5e7eb',
  // optional: svgLabelBig/Small, htmlLabel, axis/tick line styles, gridStyles
});
```

Pass via `<XYChart theme={customTheme}>` or `ThemeProvider`. Colors map to series via `dataKey`.

There is **no** `createTheme` export — use `buildChartTheme` for XYChart.

### `@visx/theme` (4.1 preview — not on npm)

Planned for primitive charts: `ThemeScope`, `defineTheme`, `createRuntimeTheme`, `lightTheme`/`darkTheme`, `fromXYChartTheme`, plus `@visx/theme/react` hooks (`useAxisStyle`, `useGridStyle`, `useColor`, …).

Primitives stay **prop-driven** — theme hooks return props you spread; axis/grid/shape do not auto-read context.

Do not `bun add @visx/theme` until published.

## Accessibility

### 4.0.0 without `@visx/a11y`

- XYChart: `accessibilityLabel` (SVG `aria-label`).
- Series: `onFocus` / `onBlur` (SVG 2.0 `tabIndex` support required).
- Manual: `<title>`/`<desc>`, HTML data table fallback, `aria-hidden="true"` on decorative grids/axes/backgrounds.

### `@visx/a11y` (4.1 preview — not on npm)

Planned entries: `@visx/a11y`, `/server`, `/react` with `getChartAriaProps`, `generateChartDescription`, `generateDataTableHTML`, `useChartA11y`, `useChartKeyboardNav`, `ChartA11yAnnouncer`, `ChartA11yDataTable`.

**Not** VisuallyHidden / ScreenReaderOnly. Decorative chrome must still be marked `aria-hidden` manually.

## Composition recipe (primitive)

```tsx
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { LegendOrdinal } from '@visx/legend';
import { Group } from '@visx/group';

<div>
  <svg width={width} height={height}>
    <Group left={margin.left} top={margin.top}>
      <GridRows scale={yScale} width={xMax} stroke="#f3f4f6" />
      <GridColumns scale={xScale} height={yMax} stroke="#f3f4f6" />
      {/* series marks */}
      <AxisBottom top={yMax} scale={xScale} />
      <AxisLeft scale={yScale} />
    </Group>
  </svg>
  <LegendOrdinal scale={colorScale} direction="row" shape="rect" />
</div>
```
