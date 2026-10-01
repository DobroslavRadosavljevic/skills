# TanStack Charts Source Map

Snapshot date: 2026-10-01.

## Current Package Evidence

TanStack Charts is in official **Alpha** since `0.16.0` (2026-08-26). Alpha uses regular `0.x` versions on the normal `latest` tag (no `-alpha` suffix or separate channel). It is ready for evaluation and early application integration, not a stable API promise: minor releases may break APIs. Pin an exact version in production. See `https://tanstack.com/charts/latest/docs/stability`.

| Package | Version (latest) | Role |
| --- | --- | --- |
| `@tanstack/charts` | `0.18.0` | **Canonical install.** Grammar, compact `/scales/*`, adapters (`/react`, `/vue`, …), transforms, scene, SVG, optional Canvas/export/motion/spatial/hierarchy/network/interaction |
| `@tanstack/react-charts` | `0.18.0` | Compatibility shim. New apps: `@tanstack/charts/react` |
| `@tanstack/charts-scales` | `0.18.0` | Compatibility shim. New apps: `@tanstack/charts/scales/{linear,band,point,ordinal}` |
| `@tanstack/react-native-charts` | `0.18.0` | Compatibility shim. New apps: `@tanstack/charts/react-native` |
| Other `@tanstack/{vue,solid,svelte,angular,lit,alpine,preact,octane}-charts` | `0.18.0` | Compatibility shims. New apps: `@tanstack/charts/<framework>` |
| `@tanstack/react-charts-catalog` | `0.7.2` | Server-renderable catalog components; not updated since 2026-08-07 and not part of the fixed release group |

Repository: `https://github.com/TanStack/charts`. Docs: `https://tanstack.com/charts`. npm `latest` is `0.18.0` (published 2026-09-10). Pin narrative to tag `v0.18.0`. The site `latest` docs follow unreleased `main`; use release-source docs when they disagree.

Measured comparison workspace for the `0.18.0` line: `8bab934`. Bundle baseline date: `2026-09-10`. Controlled TanStack cold-page gzip **41.56–47.68 KiB** (up from 37.60–43.56 KiB at `0.14.0`).

### Notable Release Line (after `0.6.x`)

| Version | Highlights |
| --- | --- |
| `0.7.0` | Crosshair / cursor controllers; waffle; spatial hexbin, Delaunay, Voronoi, density, contour; rolling path transforms; tooltip `pinned` in formatters |
| `0.8.0` | Public API harmonization: `svgAnimation`, `rollingWindow`, `controls`, `delta`, accessor `(datum, { index, data })`, tooltip host brands |
| `0.9.0` | **Single package:** adapters and compact scales as `@tanstack/charts` subpaths |
| `0.10.0` | Inherited CSS theming of the built-in DOM tooltip surface |
| `0.11.0` | Controlled sunburst drill-down, bounded depth, polar sector motion |
| `0.12.0` | Angular grouped focus (`focusGroupAngle`), geometry-backed arc tooltips |
| `0.13.0` | ShadCN-compatible catalog; renderer-owned tooltip/entrance motion; `stagger`; polar presentation |
| `0.14.0` | Definition-driven inference for motion/raw specs/responsive factories/decorative marks; tooltip motion across split entrypoints |
| `0.15.0` | Named Cartesian and polar **scale registries** (`scales`), multiple axes (`channel`, `side`, mark `xScale`/`yScale`); per-mark Canvas via `renderer: canvasChartRenderer` |
| `0.16.0` | **Official Alpha. Breaking:** root `x`/`y` and polar root `angle`/`radius` removed; `scales.x`/`scales.y` and `polar({ scales: { angle, radius } })` required; `ChartMarkPointX`/`ChartMarkPointY`; strict built-in mark option literals; pinned tooltips dismiss on outside press |
| `0.16.1` / `0.16.2` | Active-series highlight in grouped tooltips (`context.primaryPoint`, `row.active`); faster mount and SVG serialization |
| `0.17.0` | Bar/rect/cell corner radii (`radius`, `{ end }`); relayout on CSS-owned height changes; React adapter supports React 18 and 19 |
| `0.18.0` | Radial gradients; axis title typography; `focusRing` style options; `lineCap`/`lineJoin`; `colorLegendItems` layouts; `grid` / `axis.line` stroke styles; `zoomX` `wheelActivation`; RTL axis gutters |

Earlier `0.0.2`–`0.6.5` history (tooltip extensions, composable axes, implicit stack, RN host, `motion()`) still applies; do not copy those older **names** (`animate`, `window`, root `x`/`y` scales, `@tanstack/react-charts` in new code).

## Naming Trap: Archived React Charts

| | New TanStack Charts | Archived React Charts |
| --- | --- | --- |
| Packages | `@tanstack/charts` (+ optional compatibility `@tanstack/react-charts`) | Unscoped `react-charts` (`2.x` / `3.0.0-beta.*`) |
| Docs | `https://tanstack.com/charts` | `https://react-charts.tanstack.com` |
| API | `defineChart` + marks + scales | `<Chart options={{ data, primaryAxis, secondaryAxes }}>` |
| Status | Active Alpha (`0.18.0`) | Archived |

### Context7 / Search Caveats

- Prefer `/tanstack/charts` or `/websites/tanstack_charts`.
- `/tanstack/react-charts` still indexes **archived** React Charts—do not use it for this skill.
- Indexes may show root `x:` / `y:` scale options, `animate`, `window`, `groupScale`, `tooltip: true`, `@tanstack/charts-scales`, `@tanstack/react-charts`. Prefer GitHub `v0.18.0` docs or site `latest`.

## Official Docs

Getting started:

- Overview: `https://tanstack.com/charts/latest/docs/overview`
- Compare: `https://tanstack.com/charts/latest/docs/comparison`
- Alpha stability: `https://tanstack.com/charts/latest/docs/stability`
- Installation: `https://tanstack.com/charts/latest/docs/installation`
- Quick start: `https://tanstack.com/charts/latest/docs/quick-start`
- React quick start: `https://tanstack.com/charts/latest/docs/framework/react/quick-start`
- React adapter: `https://tanstack.com/charts/latest/docs/framework/react/adapter`
- React `Chart`: `https://tanstack.com/charts/latest/docs/framework/react/reference/chart`

Core concepts: `grammar-of-graphics`, `chart-definitions`, `data-and-channels`, `scales-and-d3`, `marks-and-layering`, `layout-axes-and-coordinates` under `https://tanstack.com/charts/latest/docs/concepts/`.

High-value guides under `https://tanstack.com/charts/latest/docs/guides/`: `choosing-a-chart`, `ai-authoring`, `transforms-and-reactivity`, `tooltips-and-focus`, `interactions-and-selections`, `dynamic-data-and-animation`, `legends-and-color`, `accessibility`, `ssr-and-hydration`, `migrating`, `testing-and-debugging`, `themes-and-styling`, `large-data`, `custom-marks-and-renderers`, `typescript`, `bundle-size-and-performance`, `responsive-charts`, `exporting`, `faceting-and-composition`.

API: `https://tanstack.com/charts/latest/docs/reference`

Examples: `https://tanstack.com/charts/latest/docs/examples`

Changelog: `https://github.com/TanStack/charts/blob/main/CHANGELOG.md`

Release-source docs: `https://github.com/TanStack/charts/tree/v0.18.0/docs`

Scale and axis reference (registry, named scales, guide styles): `https://tanstack.com/charts/latest/docs/reference/scales-guides-and-color`

## Refresh Triggers

- `@tanstack/charts` version changes (any minor may break while Alpha) or the library reaches `1.0`.
- Search still returns archived `react-charts`, `primaryAxis`, `tooltip: true`, `animate`, `window`, `groupScale`, `/portable`, root `x`/`y` scales, or separate adapter packages as the **new** path.
- Task mentions motion, RN, Canvas, polar, geo, spatial, hierarchy, network, brush/zoom, SSR, or migration.
- Bundle or React 19 / RN peer ranges change.
