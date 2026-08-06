---
name: tanstack-charts
description: "Build, review, debug, migrate, or plan TanStack Charts pre-alpha charting with current docs. Use for @tanstack/charts, @tanstack/react-charts, @tanstack/react-native-charts, @tanstack/charts-scales, defineChart, createChartScene, mountChart, mountChartRenderer, motion(), createChartSpring, tooltip/portal extensions, layout stack/group, groupBy/binX/window/rank/normalize transforms, lineY, areaY, areaX, barY, barX, rect, cell, dot, hexagon, ruleX, ruleY, text, frame, bandX, bandY, whenFocused, focus:false, focusRing, facet, polar, geoShape, d3Curve, colorLegend, Chart, SVG/Canvas renderers, grammar-of-graphics marks/channels/scales, D3 scale ownership, tooltips, focus, selection, SSR hydration, themes, legends, export, custom marks, and migrations from Recharts, Chart.js, ECharts, Observable Plot, archived react-charts, or TanStack Charts 0.0.x–0.5.x."
---

# TanStack Charts

Use this skill when work touches TanStack Charts (`@tanstack/charts` and framework adapters), especially mark composition, transforms, D3/compact scale ownership, React `Chart`, SSR, tooltips/focus, Canvas, optional `motion()`, React Native, or migrations from other chart libraries / older `0.0.x`–`0.5.x` APIs.

Treat the library as **pre-alpha** (`0.6.5` at skill refresh). Official docs say it is not ready for production use. Verify current docs and package versions before relying on edge APIs. Prefer official docs / npm-packaged docs / GitHub raw at the nearest tag over stale search or archived `react-charts` results.

## Workflow

1. Confirm the local stack is the **new** TanStack Charts, not the archived library:
   - Correct: `@tanstack/charts` plus one adapter such as `@tanstack/react-charts` (same version line). Optional `@tanstack/charts-scales` for the common numeric/categorical path.
   - Wrong: unscoped `react-charts`, or docs/examples that use `options`/`primaryAxis`/`secondaryAxes`/`UserSerie` from the old React Charts API.
   - Also check React peer (`^19` for the React adapter), React Native peers when using `@tanstack/react-native-charts`, installed `d3-*` modules the chart imports, and SVG vs `@tanstack/react-charts/canvas` / `/tooltip` / `/core` (for `motion()` or custom renderers).
2. Refresh current docs and package evidence when behavior or versions matter. Start from [source-map.md](references/source-map.md).
3. For installation, package boundaries, `defineChart`, scale ownership, axis/color options, and vanilla mounting, use [setup-core.md](references/setup-core.md).
4. For marks, channels, layering, stack/group layouts, and choosing a composition, use [marks-composition.md](references/marks-composition.md).
5. For data transforms (`groupBy`, bins, window, etc.) and when to use them vs mark layout, use [transforms-layouts.md](references/transforms-layouts.md).
6. For React (and other) adapters, sizing, tooltips, focus, selection, themes, motion, and SSR/hydration, use [frameworks-interaction.md](references/frameworks-interaction.md).
7. For testing scenes, large data, Canvas/custom marks, animation, a11y, migration parity, and AI authoring checks, use [production-patterns.md](references/production-patterns.md).

## Implementation Judgment

- A chart is a **composition of marks**, not a monolithic chart-type component. Prefer the smallest mark set that answers the analytical question.
- Keep data in its natural row shape. Pass mark-local iterables; do not invent a library-owned series wrapper.
- Start with `@tanstack/charts-scales/<family>` for common numeric/categorical axes. Import and declare every `d3-*` module the application source uses for time, log, power, sequential, or other specialized scales. Pass scale factories for inferred domains, or configured instances for fixed domains. Never assign pixel ranges to positional scales the chart owns. As of `0.6.5`, core declares `d3-scale` as a runtime dependency—still declare app-imported modules for strict package managers.
- Both positional scales are required when marks materialize those dimensions. A missing scale is an authoring error, not a silent fallback.
- Put axis presentation under composable `axis` / `axis.ticks` / `axis.tickLabels` (not the flat `0.0.x` `label`/`ticks`/`tickRotate` fields). Use `axis: false` to hide a guide while keeping the scale; set the axis to `null` only when no mark uses that dimension.
- Memoize the complete `defineChart(...)` against every captured value (`rows`, filters, accents, domains). Definition identity is the update boundary. Responsive `chart: ({ width }) => …` builders retain outer definition options (tooltip, motion, etc.).
- Bars/areas with a single length channel **stack implicitly** at repeated positions. Use `layout: group()` for side-by-side bars; use `layout: stack({ order, offset })` only when order/offset must be explicit; supply `y1`/`y2` or `x1`/`x2` to opt out with authored intervals. Prefer TanStack transforms for reusable cross-row prep; keep geometry-only stacking on the mark.
- Enable native tooltips with the `tooltip` extension from `@tanstack/charts/tooltip` (not `tooltip: true`). Escape clipping with `portal` from `@tanstack/charts/tooltip/portal`. React `renderTooltipBody` requires `@tanstack/react-charts/tooltip`. Grouped tooltip rows default to visual mark order (`sort: 'visual'` is explicit); override with `color-domain`, `focus`, or a comparator.
- Supply `ariaLabel` on every mounted chart. Use focus modes (`group-x`, etc.) deliberately. Use `focus: false` to omit generated focus geometry; `focusRing: false` when authored focus marks replace the built-in ring; `focusDisabled` when an application gesture owns the surface.
- Default to SVG. Import Canvas, polar, geo, export, motion, or tooltip portals only through their explicit subpaths so ordinary Cartesian charts stay lean. Each host has one animation owner: default SVG uses `animate`; `motion()` ignores `animate` and reads definition-level motion.
- Prefer built-in mark composition and transforms before `createMark`, custom focus strategies, spatial indexes, or custom renderers.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Charts changes, include the relevant subset:

- Package/version check proving `@tanstack/charts` (not archived `react-charts`) and matching adapter versions on the `0.6.x` line (or the project's pinned line).
- Typecheck for datum fields, channels, scale domains, definition generics, axis options, tooltip extensions, motion options, and callback `ChartPoint` types—no unexpected casts.
- Deterministic `createChartScene` / `renderChartSvg` assertions for domains, geometry, keys, and accessible markup.
- Focused interaction tests for focus, keyboard, tooltip, selection, resize, reorder, empty data, and destroy cleanup.
- Light/dark visual smoke when theme tokens or mark paint change.
- SSR/hydration smoke when changing `initialWidth`, definitions, formatters, Canvas shells, or `idPrefix`.
- Narrow bundle measurement when adding polar, geo, Canvas, export, motion, transforms families, or new D3 modules.
