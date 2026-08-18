# Production Patterns

## Pre-Alpha Caution

`@tanstack/charts@0.14.0` is pre-alpha. Official docs state it is not ready for production use. Pin versions. Re-check signatures before shipping public APIs or large migrations.

## Breaking Migration Notes

### Package unification (`0.9.0+`)

New applications install **only** `@tanstack/charts`.

| Previous | Current |
| --- | --- |
| `@tanstack/charts-scales/linear` | `@tanstack/charts/scales/linear` |
| `@tanstack/react-charts` | `@tanstack/charts/react` |
| `@tanstack/react-charts/tooltip` | `@tanstack/charts/react/tooltip` |
| `@tanstack/react-native-charts` | `@tanstack/charts/react-native` |
| `@tanstack/{vue,solid,…}-charts` | `@tanstack/charts/{vue,solid,…}` |

Compatibility packages remain published for existing apps. Do not mix old adapter packages with new subpath imports in the same chart without a reason.

### API harmonization (`0.8.0`)

| Before | After |
| --- | --- |
| `animate` | `svgAnimation` |
| `window` / `/transform/window` | `rollingWindow` / `/transform/rolling-window` |
| `behaviors` | `controls` |
| `color.type` | `color.resolver` |
| `focusX` / `focusY` | `focusGroupX` / `focusGroupY` |
| reduce `difference` | `delta` |
| `isDynamicChartDefinition` | `isResponsiveChartDefinition` |
| builder `{ theme }` | `{ defaultTheme }` |
| accessors `(datum, index, data)` or `(context)` | `(datum, { index, data })` |
| facet `chart(data, key)` | `chart(data, { key })` |
| spatial index `(points, scene)` | `(points, { scene })` |
| legend `height(itemCount, width, colors)` | `height(itemCount, context)` (`context.chart.width`) |

Tooltip tokens are host-branded (`dom` vs React Native). Compact linear domains and band ranges need exactly two finite values.

### From `0.0.x`–`0.6.x`

| Old | Current |
| --- | --- |
| `tooltip: true` | `tooltip` from `@tanstack/charts/tooltip` |
| Flat `label` / `ticks` / `tickRotate` on axes | Nested `axis: { label, ticks, tickLabels }` |
| `groupScale` | `layout: group()` |
| `/portable` | `/universal` |
| React `renderTooltipBody` on root `Chart` | `@tanstack/charts/react/tooltip` |
| `focus: false` / `focusRing: false` | Still valid (`0.6.3`–`0.6.5`) |

## AI Authoring Sequence

1. State the analytical question in one sentence.
2. Identify field semantic types (quantitative, temporal, ordinal, identifier).
3. Choose the smallest mark composition (and stack/group/transform ownership).
4. Compact scales first; nest guides under `axis`.
5. Decide TanStack transform vs D3 vs SQL vs server.
6. Add `ariaLabel` and the `tooltip` extension (plus focus mode if multi-series).
7. Verify a static scene before animation or rich interaction.
8. Extend only at documented boundaries (`createMark`, `decorative`, `compositeMark`, focus strategy, spatial index, `motion()`, `/interaction/*`, custom renderer).

Generated code must include exact imports/subpaths, datum interfaces, scale construction, complete definition, adapter usage, `ariaLabel`, tooltip imports when interactive, and stable identity. Do not invent undeclared variables, casts, private source imports, unreleased `main`-only APIs, archived `react-charts`, or `animate` / `window` / `@tanstack/react-charts` in **new** code.

Request template:

```text
Question:
Data shape and semantic field types:
Required encodings:
Transforms vs mark layout:
Interaction and selection:
Responsive container:
Accessibility summary:
Expected update behavior:
Bundle constraints:
Acceptance checks:
```

Ask before inventing aggregations or selection semantics. Use documented presentation defaults when information is missing.

## Testing Layers

1. **Scene** — `createChartScene(definition, { width, height })` (DOM-free).
2. **SVG string** — `renderChartSvg` for aria, IDs, element kinds, finite coordinates.
3. **DOM host** — resize, pointer/keyboard, sticky tooltips, selection, destroy.
4. **Visual** — screenshots for overlap/themes; pair with semantic asserts.
5. **A11y** — name, keyboard parity, reduced motion, table when exact values matter.

Diagnose: prepared rows → channels → scale domains/ranges → `scene.chart` bounds → nodes/points → renderer → mounted CSS.

Always `destroy()` hosts. For compact-scale charts, confirm the bundle does **not** retain `d3-scale` unless the app imported it.

## Large Data And Spatial Marks

Prefer bounded encodings (`bin*`, `groupBy`, `hexbin`, `densityContour`, `contour`, sampling) over indexing every raw point. Spatial marks live on `@tanstack/charts/spatial/{hexbin,contour,density,delaunay,voronoi}`. Add a `ChartSpatialIndexFactory` only when many independently focusable points remain necessary.

## Canvas, Motion, Custom Surfaces

```tsx
import { Chart as CanvasChart } from '@tanstack/charts/react/canvas'
import { Chart as RendererChart } from '@tanstack/charts/react/core'
import { motion } from '@tanstack/charts/motion'
```

Canvas: no server pixel paint. Gradients: definition-declared; SVG needs `renderChartSvgWithResources` when serializing resources.

## Custom Marks And Interaction Ownership

Use `createMark` only when geometry cannot be composed from built-ins (including first-party `boxY`, `waffleY`, `sankeyDiagram`, `treemap`, `sunburst`). Custom marks must materialize scale channels, emit stable keyed nodes, and optionally typed interaction points.

Brush, zoom, and playback: prefer `/interaction/brush` and `/interaction/zoom` bound to application state, then rebuild definitions with configured domains. Disable native nearest-point focus with `focusDisabled` (or `focus: false`) when it conflicts.

## Export

`@tanstack/charts/export` for SVG serialization/download and browser image export (`RenderChartImageOptions`, not `RenderChartPngOptions`).

## Migrating From Another Library

Do not translate component names. Inventory semantics first.

Order: static fixed-size → scales/marks/guides → responsive/margins → tooltip/keyboard → selection/viewport → memoized live definitions → animation (`svgAnimation` or `motion()`) → bundle gates → remove old renderer.

Preserve proven transforms initially.

### Archived `react-charts`

Old API: `options.data` series wrappers, `primaryAxis` / `secondaryAxes`. New API: mark-local arrays, explicit compact/D3 scales, mark functions, implicit stack or `layout: stack()`.

Reject any solution that reintroduces the archived option object into `@tanstack/charts`.

## Bundle Discipline

- Import only needed marks, transforms, and D3 modules.
- Root imports for ordinary apps; exact subpaths for isolation (required for RN/Metro).
- Keep polar/geo/Canvas/export/motion/spatial/hierarchy/network/tooltip-portal off the critical path until required.
- Official comparison (workspace `91e2eef`, baseline `2026-08-15`): TanStack **37.60–43.56 KiB** gzip vs Chart.js ~44.7–58.2, Plot ~83–92, Recharts/ECharts ~153–173. Re-measure the app's actual charts.

## Production Checklist

- `@tanstack/charts` on a coherent `0.14.x` line; new code uses package subpaths
- No stale names: `animate`, `window`, `tooltip: true`, `groupScale`, `/portable`, `behaviors`, `color.type`, `difference` reducer, archived `react-charts`
- Question, encodings, scales, transform/layout ownership are explicit
- Accessors use `(datum, { index, data })`
- Definition memoization matches captured values
- Empty, constant-domain, and missing-value policies are intentional
- `ariaLabel` present; keyboard/pointer parity verified
- Light and dark readable via inheritance or theme
- Update/reorder/resize preserve keys and selection
- Destroy/unmount cleans host resources
- Migration parity gates green before deleting the previous renderer
