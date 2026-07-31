---
name: tanstack-charts
description: "Build, review, debug, migrate, or plan TanStack Charts pre-alpha charting with current docs. Use for @tanstack/charts, @tanstack/react-charts, defineChart, createChartScene, mountChart, lineY, areaY, areaX, barY, barX, rect, cell, dot, hexagon, ruleX, ruleY, text, frame, facet, polar, geoShape, d3Curve, Chart, SVG/Canvas renderers, grammar-of-graphics marks/channels/scales, D3 scale ownership, tooltips, focus, selection, SSR hydration, themes, legends, export, custom marks, and migrations from Recharts, Chart.js, ECharts, Observable Plot, or archived react-charts."
---

# TanStack Charts

Use this skill when work touches TanStack Charts (`@tanstack/charts` and framework adapters), especially mark composition, D3 scale ownership, React `Chart`, SSR, tooltips/focus, Canvas, or migrations from other chart libraries.

Treat the library as **pre-alpha** (`0.0.2` at skill authoring). Verify current docs and package versions before relying on edge APIs.

## Workflow

1. Confirm the local stack is the **new** TanStack Charts, not the archived library:
   - Correct: `@tanstack/charts` plus one adapter such as `@tanstack/react-charts`.
   - Wrong: unscoped `react-charts`, or docs/examples that use `options`/`primaryAxis`/`secondaryAxes`/`UserSerie` from the old React Charts API.
   - Also check React peer (`^19` for the React adapter), installed `d3-*` modules the chart imports, and SVG vs `@tanstack/react-charts/canvas`.
2. Refresh current docs and package evidence when behavior or versions matter. Start from [source-map.md](references/source-map.md).
3. For installation, package boundaries, `defineChart`, D3 ownership, scales, and vanilla mounting, use [setup-core.md](references/setup-core.md).
4. For marks, channels, layering, stacking/grouping, and choosing a composition, use [marks-composition.md](references/marks-composition.md).
5. For React (and other) adapters, sizing, tooltips, focus, selection, themes, and SSR/hydration, use [frameworks-interaction.md](references/frameworks-interaction.md).
6. For testing scenes, large data, Canvas/custom marks, migration parity, and AI authoring checks, use [production-patterns.md](references/production-patterns.md).

## Implementation Judgment

- A chart is a **composition of marks**, not a monolithic chart-type component. Prefer the smallest mark set that answers the analytical question.
- Keep data in its natural row shape. Pass mark-local iterables; do not invent a library-owned series wrapper.
- Import and declare every `d3-*` module the application source uses. Pass D3 scale factories for inferred domains, or configured instances for fixed domains. Never assign pixel ranges to positional scales the chart owns.
- Both positional scales are required when marks materialize those dimensions. A missing scale is an authoring error, not a silent fallback.
- Memoize the complete `defineChart(...)` against every captured value (`rows`, filters, accents, domains). Definition identity is the update boundary.
- Stacking, binning, pie layouts, and statistics stay in application/D3/SQL code. Feed prepared intervals (`y1`/`y2`, `x1`/`x2`) or rows to marks. Do not expect automatic dodge/stack guessing from `z` alone.
- Supply `ariaLabel` on every mounted chart. Enable `tooltip: true` for the default path; use focus modes (`group-x`, etc.) deliberately.
- Default to SVG. Import Canvas or polar/geo only through their explicit subpaths so ordinary Cartesian charts stay lean.
- Prefer built-in mark composition before `createMark`, custom focus strategies, spatial indexes, or custom renderers.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Charts changes, include the relevant subset:

- Package/version check proving `@tanstack/charts` (not archived `react-charts`) and matching adapter versions.
- Typecheck for datum fields, channels, scale domains, definition generics, and callback `ChartPoint` types—no unexpected casts.
- Deterministic `createChartScene` / `renderChartSvg` assertions for domains, geometry, keys, and accessible markup.
- Focused interaction tests for focus, keyboard, tooltip, selection, resize, reorder, empty data, and destroy cleanup.
- Light/dark visual smoke when theme tokens or mark paint change.
- SSR/hydration smoke when changing `initialWidth`, definitions, formatters, Canvas shells, or `idPrefix`.
- Narrow bundle measurement when adding polar, geo, Canvas, export, or new D3 modules.
