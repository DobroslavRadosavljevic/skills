---
name: tanstack-charts
description: "Build, review, debug, migrate, or plan TanStack Charts pre-alpha charting with current docs. Use for @tanstack/charts, @tanstack/charts/react, @tanstack/charts/react-native, @tanstack/charts/scales/*, defineChart, svgAnimation, motion(), tooltip/portal, layout stack/group, groupBy/binX/rollingWindow/rank/normalize/fold/waterfall/mosaic, lineY, areaY, barY, boxY, violinY, waffleY, ridgelineY, differenceY, linearRegressionY, rect, cell, dot, hexagon, crosshair, whenFocused, decorative, facet, polar, geoShape, treemap, sunburst, sankeyDiagram, hexbin, contour, brushX, zoomX, keyedSelection, Chart, Canvas, grammar-of-graphics marks/channels/scales, and migrations from Recharts, Chart.js, ECharts, Observable Plot, archived react-charts, @tanstack/react-charts, @tanstack/charts-scales, or TanStack Charts 0.0.x–0.13.x."
---

# TanStack Charts

Use this skill when work touches TanStack Charts, especially mark composition, transforms, compact vs D3 scales, React `Chart`, SSR, tooltips/focus, Canvas, optional `motion()`, React Native, spatial/hierarchy/network entries, or migrations.

Treat the library as **pre-alpha** (`0.14.0` at skill refresh). Official docs say it is not ready for production use. Verify current docs and the npm `latest` version before relying on edge APIs. Prefer official docs / GitHub tag `v0.14.0` over stale search or archived `react-charts`.

## Workflow

1. Confirm the stack is the **new** TanStack Charts on the unified package:
   - Correct: `bun add @tanstack/charts` plus framework peers. Import `Chart` from `@tanstack/charts/react`, scales from `@tanstack/charts/scales/linear` (and `/band`, `/point`, `/ordinal`).
   - Compatibility only: `@tanstack/react-charts`, `@tanstack/charts-scales`, and other `@tanstack/*-charts` adapter packages still exist for existing apps. Do not add them to new code.
   - Wrong: unscoped `react-charts`, or `options` / `primaryAxis` / `secondaryAxes` / `UserSerie`.
2. Refresh versions and URLs from [source-map.md](references/source-map.md).
3. Installation, `defineChart`, scales, axes, tooltip extensions: [setup-core.md](references/setup-core.md).
4. Marks, `decorative`, polar/geo, composites: [marks-composition.md](references/marks-composition.md).
5. Eager transforms vs mark layout: [transforms-layouts.md](references/transforms-layouts.md).
6. Adapters, sizing, focus, crosshair, brush/zoom/cursor/selection, motion, SSR: [frameworks-interaction.md](references/frameworks-interaction.md).
7. Testing, large data, Canvas, custom marks, AI checks, migrations: [production-patterns.md](references/production-patterns.md).

## Implementation Judgment

- A chart is a **composition of marks**, not a chart-type component. Prefer the smallest mark set that answers the question.
- Keep rows in their natural shape. Do not invent a library-owned series wrapper.
- Install **one** package: `@tanstack/charts`. Compact scales: exact `@tanstack/charts/scales/*` (no `/scales` barrel). Import and declare every `d3-*` the **application source** uses. Pass factories for inferred domains, or configured instances for fixed domains. Never assign pixel ranges to positional scales the chart owns.
- Both positional scales are required when marks materialize those dimensions.
- Axis presentation lives under `axis` / `axis.ticks` / `axis.tickLabels`. `axis: false` hides a guide and keeps the scale. Set the axis to `null` only when no mark uses that dimension.
- Memoize the complete `defineChart(...)` against every captured value. Definition identity is the update boundary. Responsive `{ chart: ({ width }) => …, svgAnimation, tooltip, … }` retains outer options.
- Default SVG animation option is **`svgAnimation`**, not `animate`. `motion()` ignores `svgAnimation` and reads definition-level `motion`.
- Bars/areas with a single length channel **stack implicitly**. Use `layout: group()` for side-by-side bars; `layout: stack({ order, offset })` only when order/offset must be explicit; `y1`/`y2` or `x1`/`x2` opts out.
- Native tooltips: `tooltip` from `@tanstack/charts/tooltip`. Escape clipping with `portal` from `@tanstack/charts/tooltip/portal`. React `renderTooltipBody` requires `@tanstack/charts/react/tooltip`. Grouped rows default to visual mark order.
- Channel and transform accessors use `(datum, { index, data })`, not `(datum, index, data)`.
- Rolling transforms: **`rollingWindow`**, not `window`. Reducer helper: **`delta`**, not `difference`.
- Supply `ariaLabel` on every mounted chart. Use `focus: false` to omit generated focus geometry; `focusRing: false` when authored focus marks replace the ring; `focusDisabled` when an app gesture owns the surface. Radial grouped focus: `focusGroupAngle` from `@tanstack/charts/polar`.
- Default to SVG. Import polar, geo, Canvas, export, motion, spatial, hierarchy, network, brush/zoom only through **exact subpaths**.
- Prefer built-in marks (`boxY`, `waffleY`, `violinY`, composites) before `createMark`. Wrap a sibling layer with `decorative(...)` when only one layer should own hit-testing.

## Verification

Prefer the repo's existing checks. For meaningful Charts work, include the relevant subset:

- Package check: `@tanstack/charts` on `0.14.x` (or the project's pin). New code imports adapters/scales from that package, not `@tanstack/react-charts` / `@tanstack/charts-scales`.
- Typecheck for channels, scales, axis options, tooltip host brands, motion, `ChartPoint` callbacks—no unexpected casts.
- `createChartScene` / `renderChartSvg` for domains, geometry, keys, a11y markup.
- Interaction tests: focus, keyboard, tooltip, selection, brush/zoom, resize, empty data, destroy.
- Light/dark smoke when theme tokens or tooltip surface CSS change.
- SSR/hydration smoke for `initialWidth`, formatters, Canvas shells, `idPrefix`.
- Bundle measurement when adding polar, geo, Canvas, export, motion, spatial, hierarchy, network, or extra D3 modules.
