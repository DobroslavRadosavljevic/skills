# visx Production Patterns & Migration

## v3 → v4 checklist

Source: [MIGRATION.md](https://github.com/airbnb/visx/blob/master/MIGRATION.md)

1. Upgrade **all** `@visx/*` together to `^4.0.0` (do not mix majors).
2. React **18 or 19** required. React 16/17 → stay on v3 or upgrade React first. Preact: `preact/compat` + satisfy peer range.
3. TypeScript: install `@types/react` (and `@types/react-dom` when needed) matching React major.
4. Replace deep imports (`@visx/shape/lib/...`) with package-root imports. Prefer root type exports (`AxisProps`, …).
5. IE11 unsupported — stay on v3 if required.
6. ESM: published `esm/` has `.js` extensions + nested `"type":"module"` (Vite SSR / Deno / edge).
7. `@visx/vendor`: d3-shape/path v3 via vendor. Declare direct `d3-*` deps yourself if previously transitive-only.
8. `withBoundingRects`: attach injected **`nodeRef`** (no `findDOMNode`).
9. `@visx/responsive`: ParentSize is **two nested divs**; use `useParentSize`’s `node` (not `parentRef.current`).
10. XYChart: axes wait for registered non-empty series data.
11. Removed: internal `withRegisteredData` deep import; runtime PropTypes.
12. Lodash no longer transitive from responsive/text/xychart/shape — declare lodash yourself if needed.
13. Avoid broken alphas `4.0.0-alpha.10/12/13` — use stable `4.0.0`.

```bash
bun add @visx/shape@^4 @visx/scale@^4
# upgrade every other @visx/* dependency the same way
```

## Decision guide (quick)

| Situation | Path |
| --- | --- |
| Standard cartesian dashboard charts | `@visx/xychart` |
| Custom marks / polar / geo / hierarchy | Primitives |
| Org-wide reusable chart kit | Primitives → thin wrappers |
| Need Recharts-like one-liner | Consider another library — visx is intentional DIY |
| Want shadcn copy-in starters | Wait for 4.1 registry / verify npm |

## Production patterns

### Bundle size

- Install only needed packages (`sideEffects: false` on packages).
- Avoid `@visx/visx` umbrella in tight bundles.
- Prefer static series over `Animated*` when motion unused.
- Import geo TopoJSON / large mocks carefully.

### SSR / hydration

- Charts need numeric width/height. Measure with `ParentSize` **client-side**, or pass fixed sizes.
- Guard `width < 10` / `height < 10`.
- Tooltip portals: avoid assuming `document` during SSR.
- v4 ESM fixes help Vite SSR imports; measurement still needs ResizeObserver in the browser.

### Performance

- Memoize scales and expensive layouts (`voronoi`, hierarchy `.sum()`, wordcloud config) against size/data.
- Limit SVG node counts for large heatmaps/networks — consider canvas elsewhere if needed.
- XYChart: use `pointerEventsDataKey` / event capture thoughtfully on dense series.

### Accessibility (4.0.0)

- `accessibilityLabel` on XYChart.
- Series `onFocus`/`onBlur` + tooltip keyboard patterns via providers.
- Mark decorative grids/axes/backgrounds `aria-hidden`.
- Provide an HTML data table fallback for critical charts.
- Upcoming `@visx/a11y` (4.1) — do not install yet.

### Theming

- XYChart: `buildChartTheme` / light/dark themes.
- Primitive charts: pass stroke/fill props explicitly (4.1 `@visx/theme` will help when published).

### Testing

- Supply fixed `width`/`height`; mock `ResizeObserver`.
- Assert SVG structure / roles; for XYChart wait for series registration before expecting axes.
- Do not assert single-wrapper ParentSize DOM (now two divs).
- Visual regression: gallery uses Happo; mirror with your own snapshots for theme/mark changes.

### Canvas vs SVG

- Primary model is **SVG**. XYChart “canvas dimensions” means drawing area, not `<canvas>`.
- Wordcloud may use canvas for text metrics; that is not a canvas chart engine.

## AI authoring checklist (common wrong APIs)

1. Treating visx like Recharts (`<LineChart data={…}>`) — wrong model.
2. Installing `@visx/chart` / `@visx/theme` / `@visx/a11y` / `@visx/kernel` on **4.0.0**.
3. Importing `@visx/demo` or `@visx/registry` in apps.
4. Deep imports under `@visx/*/lib/...`.
5. Mixing v3 + v4 packages.
6. Peer package name: use `@react-spring/web` for Animated* peers.
7. Using `Animated*` without spring peer.
8. Forgetting unique `dataKey` + accessors on every XYChart series.
9. Expecting XYChart axes before data registers (v4).
10. Passing live d3 scales into XYChart `xScale`/`yScale` instead of `{ type: '…' }` configs.
11. Using `x0Accessor`/`y0Accessor` inside `AreaStack`.
12. Assuming umbrella includes `chord`, `stats`, `react-spring`, `vendor`.
13. `parentRef.current` after v4 `useParentSize` — use `node`.
14. `withBoundingRects` without `nodeRef`.
15. Package name `@visx/annotations` (plural) — correct is `@visx/annotation`.
16. Non-inverted y range.
17. `AreaClosed` without `yScale`.
18. `curveBundle` on areas; `curveMonotoneX` on unsorted x.
19. Teaching `ParentSizeModern`, `useRect`, or `getXAndYFromContainer`.
20. Claiming `@visx/network` runs force layout.
21. Treating `@visx/kernel` as KDE.
22. Preferring legacy `@visx/voronoi` over `@visx/delaunay` for new work without reason.
23. Documenting IE11 support on v4.
24. Duplicate SVG ids for gradients/patterns/clips across multiple charts.
25. Nesting HTML `Tooltip` inside `<svg>`.

## Refresh procedure

When behavior or versions matter:

1. Confirm installed `@visx/*` versions and React peers.
2. Check [source-map.md](source-map.md) and npm for whether 4.1 packages exist yet.
3. Prefer GitHub raw at the installed tag + `visx.airbnb.tech` docs over memory.
4. Cross-check Context7 `/airbnb/visx` snippets against package-root exports at that tag.
