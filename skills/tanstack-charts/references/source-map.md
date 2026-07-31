# TanStack Charts Source Map

Snapshot date: 2026-07-31.

## Current Package Evidence

TanStack Charts is a **pre-alpha** release. API may change between versions.

| Package | Version (latest) | Role |
| --- | --- | --- |
| `@tanstack/charts` | `0.0.2` | Framework-agnostic grammar, marks, scene, SVG, optional Canvas/export |
| `@tanstack/react-charts` | `0.0.2` | React lifecycle/SSR adapter; peers `react`/`react-dom` `^19.0.0` |
| `@tanstack/preact-charts` | `0.0.2` | Preact adapter |
| `@tanstack/vue-charts` | `0.0.2` | Vue adapter |
| `@tanstack/solid-charts` | `0.0.2` | Solid adapter |
| `@tanstack/svelte-charts` | `0.0.2` | Svelte adapter |
| `@tanstack/angular-charts` | `0.0.2` | Angular adapter |
| `@tanstack/lit-charts` | `0.0.2` | Lit adapter |
| `@tanstack/alpine-charts` | `0.0.2` | Alpine adapter |
| `@tanstack/octane-charts` | `0.0.2` | Octane adapter |

Repository: `https://github.com/TanStack/charts` (homepage `https://tanstack.com/charts`). Measured docs revision for the comparison suite at release: workspace `5c36a38` / tag `v0.0.2`.

## Naming Trap: Archived React Charts

Do **not** confuse with the archived library:

| | New TanStack Charts | Archived React Charts |
| --- | --- | --- |
| Packages | `@tanstack/charts`, `@tanstack/react-charts` | Unscoped `react-charts` (`2.x` / `3.0.0-beta.*`) |
| Docs | `https://tanstack.com/charts` | `https://react-charts.tanstack.com` / archived GitHub |
| API shape | `defineChart` + marks + D3 scales | `<Chart options={{ data, primaryAxis, secondaryAxes }}>` |
| Status | Active pre-alpha | Archived / unmaintained |

Context7 library ID `/tanstack/react-charts` currently indexes the **archived** React Charts docs. Prefer the official TanStack Charts site and GitHub raw docs for this skill.

## Research Notes

- Official docs and the `TanStack/charts` `v0.0.2` tag were the primary sources.
- npm package metadata confirmed `0.0.2` across core and adapters.
- Competitors measured in the official comparison: Chart.js `4.5.1`, ECharts `6.1.0`, Recharts `3.10.1`, Observable Plot `0.6.17`.
- Exa MCP was unavailable in the authoring session; docs were fetched directly from `tanstack.com` and GitHub raw.

## Official Docs

Getting started:

- Overview: `https://tanstack.com/charts/latest/docs/overview`
- Compare libraries: `https://tanstack.com/charts/latest/docs/comparison`
- Installation: `https://tanstack.com/charts/latest/docs/installation`
- Quick start: `https://tanstack.com/charts/latest/docs/quick-start`
- React quick start: `https://tanstack.com/charts/latest/docs/framework/react/quick-start`
- React adapter: `https://tanstack.com/charts/latest/docs/framework/react/adapter`
- React Chart reference: `https://tanstack.com/charts/latest/docs/framework/react/reference/chart`

Core concepts:

- Grammar of graphics: `https://tanstack.com/charts/latest/docs/concepts/grammar-of-graphics`
- Chart definitions: `https://tanstack.com/charts/latest/docs/concepts/chart-definitions`
- Data and channels: `https://tanstack.com/charts/latest/docs/concepts/data-and-channels`
- Scales and D3: `https://tanstack.com/charts/latest/docs/concepts/scales-and-d3`
- Marks and layering: `https://tanstack.com/charts/latest/docs/concepts/marks-and-layering`
- Layout, axes, and coordinates: `https://tanstack.com/charts/latest/docs/concepts/layout-axes-and-coordinates`

High-value guides:

- Choosing a chart: `https://tanstack.com/charts/latest/docs/guides/choosing-a-chart`
- AI authoring: `https://tanstack.com/charts/latest/docs/guides/ai-authoring`
- Tooltips and focus: `https://tanstack.com/charts/latest/docs/guides/tooltips-and-focus`
- SSR and hydration: `https://tanstack.com/charts/latest/docs/guides/ssr-and-hydration`
- Migrating: `https://tanstack.com/charts/latest/docs/guides/migrating`
- Testing and debugging: `https://tanstack.com/charts/latest/docs/guides/testing-and-debugging`
- Themes and styling: `https://tanstack.com/charts/latest/docs/guides/themes-and-styling`
- Large data: `https://tanstack.com/charts/latest/docs/guides/large-data`
- Custom marks and renderers: `https://tanstack.com/charts/latest/docs/guides/custom-marks-and-renderers`
- TypeScript: `https://tanstack.com/charts/latest/docs/guides/typescript`
- Bundle size and performance: `https://tanstack.com/charts/latest/docs/guides/bundle-size-and-performance`

API:

- API overview: `https://tanstack.com/charts/latest/docs/reference`
- Chart definition API: `https://tanstack.com/charts/latest/docs/reference/chart-definitions`
- Mark reference index (line/area, bar/rect, dot, rules, text/facet, geo, polar): under `https://tanstack.com/charts/latest/docs/reference/marks/`

Examples gallery: `https://tanstack.com/charts/latest/docs/examples`

## Raw Docs

Useful when the website is slow or poorly indexed:

- `https://raw.githubusercontent.com/TanStack/charts/v0.0.2/docs/overview.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.0.2/docs/installation.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.0.2/docs/config.json`
- `https://raw.githubusercontent.com/TanStack/charts/v0.0.2/docs/guides/<guide-name>.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.0.2/docs/concepts/<concept-name>.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.0.2/docs/framework/react/<page>.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.0.2/docs/reference/<page>.md`

Pin to a newer tag or `main` when packages move past `0.0.2`.

## Refresh Triggers

Refresh docs before using this skill when:

- `@tanstack/charts` or an adapter version changes, or the library exits pre-alpha.
- Context7 or search results still return archived `react-charts` / `primaryAxis` APIs.
- The task mentions Canvas, polar, geo, custom marks, SSR, or migration parity.
- Type errors mention definition identity, scale factories, channels, or missing positional scales.
- Bundle size or peer dependency ranges change (especially React 19 peers).
