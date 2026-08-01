---
name: visx
description: "Build, review, debug, migrate, or plan Airbnb visx React+D3 visualization primitives and XYChart with current docs. Use for @visx/scale, @visx/shape, @visx/curve, @visx/axis, @visx/grid, @visx/legend, @visx/annotation, @visx/threshold, @visx/tooltip, @visx/responsive, @visx/brush, @visx/zoom, @visx/drag, @visx/event, @visx/bounds, @visx/xychart, @visx/react-spring, @visx/glyph, @visx/marker, @visx/text, @visx/clip-path, @visx/pattern, @visx/gradient, @visx/group, @visx/stats, @visx/heatmap, @visx/hierarchy, @visx/network, @visx/sankey, @visx/chord, @visx/geo, @visx/voronoi, @visx/delaunay, @visx/wordcloud, @visx/vendor, @visx/mock-data, @visx/visx, ParentSize, LinePath, AreaClosed, Bar, Pie, ScaleConfig, buildChartTheme, AnimatedLineSeries, and visx v3→v4 migration. Also covers upcoming 4.1 packages (@visx/theme, @visx/a11y, @visx/chart, @visx/kernel, registry) as preview-only until published."
---

# visx

Use this skill when work touches Airbnb visx (`@visx/*`) — low-level React visualization primitives, `@visx/xychart`, interaction packages, specialized layouts, or v3→v4 migration.

Treat **4.0.0** as the published stable line (React 18/19). Prefer package-root imports, gallery sandboxes at the installed tag, and GitHub/`visx.airbnb.tech` over stale deep-import snippets. Mark **4.1** packages (`@visx/theme`, `@visx/a11y`, `@visx/chart`, `@visx/kernel`, registry) as **not installable** until they appear on npm.

## Workflow

1. Confirm the local surface before changing code:
   - All `@visx/*` versions aligned on the same major (prefer `^4.0.0`); do not mix v3 and v4.
   - React peers `^18 || ^19` (and matching `@types/react` / `@types/react-dom` when using TypeScript).
   - Whether the task is **XYChart**, **primitive composition**, or a **specialized** layout (geo/hierarchy/network/stats/…).
   - Animation peers: `@react-spring/web` only when importing `Animated*` from `@visx/xychart` or `@visx/react-spring`.
2. Refresh package evidence and docs URLs from [source-map.md](references/source-map.md).
3. For install strategy, mental model, scales, shapes, curves, glyphs, markers, text, defs (clip/pattern/gradient), and `@visx/vendor`, use [setup-core.md](references/setup-core.md).
4. For axes, grids, legends, annotations, threshold bands, and theming/a11y (4.0 XYChart + 4.1 preview), use [guides-decoration.md](references/guides-decoration.md).
5. For ParentSize, bounds, `localPoint`, drag, brush, zoom, and tooltips/portals, use [interaction-layout.md](references/interaction-layout.md).
6. For stats, heatmap, hierarchy, network, sankey, chord, geo, voronoi/delaunay, wordcloud, and kernel clarifications, use [specialized-viz.md](references/specialized-viz.md).
7. For XYChart series/providers/themes, react-spring, mock-data, and the `@visx/visx` umbrella, use [xychart-high-level.md](references/xychart-high-level.md).
8. For v3→v4 migration, decision guide, production/SSR/a11y/perf, and AI authoring traps, use [production-migration.md](references/production-migration.md).

## Implementation Judgment

- visx is **not** a batteries-included charting library. Compose SVG: dimensions → scales → marks/guides → interaction. Prefer the smallest `@visx/*` set that answers the job.
- **D3 computes; React owns the DOM.** Scales and shape factories produce numbers/path `d` strings; components render SVG. Do not mix d3 selections/`enter`/`exit` into visx mark trees.
- Invert continuous **y** ranges (`[innerHeight, 0]`). SVG `y` grows downward.
- Use **named package-root imports** (`import { Bar } from '@visx/shape'`). Never deep-import `@visx/*/lib/...` under v4 `exports`.
- Prefer `@visx/vendor/d3-*` (or declare your own `d3-*`) over accidental transitive D3 imports. Do not duplicate vendor + bare `d3-shape`/`d3-scale` without intent.
- **XYChart** for standard cartesian line/area/bar/glyph/stack/group with shared tooltip/theme/annotations. Pass **`ScaleConfig` objects** (`{ type: 'band' }`), not live d3 scale instances, into `xScale`/`yScale`.
- **Primitives** for polar, geo, hierarchy, network, stats, custom SVG structure, or minimal bundles.
- Prefer **`@visx/delaunay`** over legacy `@visx/voronoi` for new Voronoi/hit-target work.
- `@visx/network` does **not** run force layout — supply `x`/`y` (e.g. via external `d3-force`).
- `@visx/kernel` is **not** KDE. Density → `@visx/stats` bins/`ViolinPlot` or external KDE + `@visx/shape`.
- Wrap responsive charts in `ParentSize` / `useParentSize`; guard `width < 10` before rendering. Supply fixed sizes in tests/SSR.
- Memoize scale configs and expensive layouts against width/height/data. Treat mutable d3 scales carefully across renders.
- Unique SVG `id`s for gradients, patterns, markers, clipPaths, and Threshold clips — especially with multiple charts on one page.
- Keep decorative chrome (`Grid*`, `Axis*`, backgrounds) `aria-hidden` when adding chart semantics; use XYChart `accessibilityLabel` / series focus handlers on 4.0.0.

## Verification

Prefer the repo's existing checks. For meaningful visx changes, include the relevant subset:

- Package/version check proving aligned `@visx/*@^4` and React 18/19 peers (plus `@react-spring/web` when `Animated*` is used).
- Typecheck for accessors, `ScaleInput`, series `Datum`/`dataKey`, axis/grid props, and tooltip state — no deep-import types.
- Deterministic SVG assertions with fixed `width`/`height` (mock `ResizeObserver` when ParentSize/tooltip portal is involved).
- Interaction tests for tooltip show/hide, brush domain filter, zoom reset, and keyboard focus when those APIs change.
- Visual smoke for theme tokens, stacked/grouped bars, and annotation placement.
- Bundle/import audit when adding umbrella `@visx/visx`, animation, geo TopoJSON, or large hierarchy/network demos.
- Migration scan for deep imports, React 16/17 peers, missing `nodeRef` on `withBoundingRects`, and `parentRef.current` after `useParentSize`.
