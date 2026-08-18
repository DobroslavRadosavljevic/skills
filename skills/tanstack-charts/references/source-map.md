# TanStack Charts Source Map

Snapshot date: 2026-08-18.

## Current Package Evidence

TanStack Charts is a **pre-alpha** release. API may change between versions. Official docs and README state it is **not ready for production use**.

| Package | Version (latest) | Role |
| --- | --- | --- |
| `@tanstack/charts` | `0.14.0` | **Canonical install.** Grammar, compact `/scales/*`, adapters (`/react`, `/vue`, …), transforms, scene, SVG, optional Canvas/export/motion/spatial/hierarchy/network/interaction |
| `@tanstack/react-charts` | `0.14.0` | Compatibility shim. New apps: `@tanstack/charts/react` |
| `@tanstack/charts-scales` | `0.14.0` | Compatibility shim. New apps: `@tanstack/charts/scales/{linear,band,point,ordinal}` |
| `@tanstack/react-native-charts` | `0.14.0` | Compatibility shim. New apps: `@tanstack/charts/react-native` |
| Other `@tanstack/{vue,solid,svelte,angular,lit,alpine,preact,octane}-charts` | `0.14.0` | Compatibility shims. New apps: `@tanstack/charts/<framework>` |

Repository: `https://github.com/TanStack/charts`. Docs: `https://tanstack.com/charts`. npm `latest` is `0.14.0` (published 2026-08-15). Pin narrative to tag `v0.14.0`. Site `latest` may track unreleased `main`; use release-source docs when they disagree.

Measured comparison workspace for the published line: `91e2eef`. Bundle baseline date: `2026-08-15`. Controlled TanStack cold-page gzip **37.60–43.56 KiB**.

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

Earlier `0.0.2`–`0.6.5` history (tooltip extensions, composable axes, implicit stack, RN host, `motion()`) still applies; do not copy those older **names** (`animate`, `window`, `@tanstack/react-charts` in new code).

## Naming Trap: Archived React Charts

| | New TanStack Charts | Archived React Charts |
| --- | --- | --- |
| Packages | `@tanstack/charts` (+ optional compatibility `@tanstack/react-charts`) | Unscoped `react-charts` (`2.x` / `3.0.0-beta.*`) |
| Docs | `https://tanstack.com/charts` | `https://react-charts.tanstack.com` |
| API | `defineChart` + marks + scales | `<Chart options={{ data, primaryAxis, secondaryAxes }}>` |
| Status | Active pre-alpha (`0.14.0`) | Archived |

### Context7 / Search Caveats

- Prefer `/tanstack/charts` or `/websites/tanstack_charts`.
- `/tanstack/react-charts` still indexes **archived** React Charts—do not use it for this skill.
- Indexes may show `animate`, `window`, `groupScale`, `tooltip: true`, `@tanstack/charts-scales`, `@tanstack/react-charts`. Prefer site `latest` or GitHub `v0.14.0`.

## Official Docs

Getting started:

- Overview: `https://tanstack.com/charts/latest/docs/overview`
- Compare: `https://tanstack.com/charts/latest/docs/comparison`
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

Release-source docs: `https://github.com/TanStack/charts/tree/v0.14.0/docs`

## Refresh Triggers

- `@tanstack/charts` version changes or the library exits pre-alpha.
- Search still returns archived `react-charts`, `primaryAxis`, `tooltip: true`, `animate`, `window`, `groupScale`, `/portable`, or separate adapter packages as the **new** path.
- Task mentions motion, RN, Canvas, polar, geo, spatial, hierarchy, network, brush/zoom, SSR, or migration.
- Bundle or React 19 / RN peer ranges change.
