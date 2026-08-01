# TanStack Charts Source Map

Snapshot date: 2026-08-01.

## Current Package Evidence

TanStack Charts is a **pre-alpha** release. API may change between versions.

| Package | Version (latest) | Role |
| --- | --- | --- |
| `@tanstack/charts` | `0.3.1` | Framework-agnostic grammar, marks, transforms, scene, SVG, optional Canvas/export |
| `@tanstack/charts-scales` | `0.3.1` | Compact `/linear`, `/band`, `/point`, `/ordinal` scales (no root export) |
| `@tanstack/react-charts` | `0.3.1` | React lifecycle/SSR adapter; peers `react`/`react-dom` `^19.0.0` |
| `@tanstack/preact-charts` | `0.3.1` | Preact adapter (`preact` `>=10`) |
| `@tanstack/vue-charts` | `0.3.1` | Vue adapter (`vue` `>=3.5`) |
| `@tanstack/solid-charts` | `0.3.1` | Solid adapter (`solid-js` `>=1.8`) |
| `@tanstack/svelte-charts` | `0.3.1` | Svelte adapter (`svelte` `^5.20.0`) |
| `@tanstack/angular-charts` | `0.3.1` | Angular adapter (`>=19`) |
| `@tanstack/lit-charts` | `0.3.1` | Lit adapter (`lit` `>=3.1.3`) |
| `@tanstack/alpine-charts` | `0.3.1` | Alpine adapter (`alpinejs` `>=3.15`) |
| `@tanstack/octane-charts` | `0.3.1` | Octane adapter (`octane` `^0.1.13`) |

Repository: `https://github.com/TanStack/charts` (docs site `https://tanstack.com/charts`). Measured docs/comparison revision for `0.3.1`: workspace/`c422a2c` / tag `v0.3.1`.

### Notable Release Line

| Version | Highlights |
| --- | --- |
| `0.0.2` | Initial public pre-alpha grammar |
| `0.1.0` | Tooltip/`portal` extensions; `/portable`+`/types`; `@tanstack/charts-scales`; React `/tooltip` entry |
| `0.2.0` | `/portable` → `/universal`; link stroke channels for Sankey-style composition |
| `0.3.0` | Composable axes; implicit stack + `layout: group/stack`; data transforms; `whenFocused`; tooltip anchors |
| `0.3.1` | Drop incidental `d3-array` from nearest-point/legend/compact ticks; scales package has no production D3 dep |

## Naming Trap: Archived React Charts

Do **not** confuse with the archived library:

| | New TanStack Charts | Archived React Charts |
| --- | --- | --- |
| Packages | `@tanstack/charts`, `@tanstack/react-charts` | Unscoped `react-charts` (`2.x` / `3.0.0-beta.*`) |
| Docs | `https://tanstack.com/charts` | `https://react-charts.tanstack.com` / archived GitHub |
| API shape | `defineChart` + marks + D3 scales | `<Chart options={{ data, primaryAxis, secondaryAxes }}>` |
| Status | Active pre-alpha (`0.3.1`) | Archived / unmaintained |

### Context7 / Search Caveats

- Prefer library ID `/tanstack/charts` or `/websites/tanstack_charts` for the **new** library.
- `/tanstack/react-charts` currently indexes the **archived** React Charts docs—do not use it for this skill.
- Even `/tanstack/charts` may surface stale snippets (`groupScale`, flat axis labels, `tooltip: true`). Prefer official site pages or GitHub raw at the installed tag (`v0.3.1` / newer).

## Research Notes

- Primary sources: official docs at `tanstack.com/charts`, GitHub raw `v0.3.1`, npm package metadata, and `CHANGELOG.md`.
- npm confirmed `0.3.1` across core, `charts-scales`, and adapters (published 2026-07-31).
- Competitors measured in the official comparison: Chart.js `4.5.1`, ECharts `6.1.0`, Recharts `3.10.1`, Observable Plot `0.6.17`.
- Exa + Context7 used for this refresh; GitHub raw at `v0.3.1` was the source of truth when indexes disagreed.

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
- Transforms and reactivity: `https://tanstack.com/charts/latest/docs/guides/transforms-and-reactivity`
- Tooltips and focus: `https://tanstack.com/charts/latest/docs/guides/tooltips-and-focus`
- Interactions and selections: `https://tanstack.com/charts/latest/docs/guides/interactions-and-selections`
- Dynamic data and animation: `https://tanstack.com/charts/latest/docs/guides/dynamic-data-and-animation`
- Legends and color: `https://tanstack.com/charts/latest/docs/guides/legends-and-color`
- Accessibility: `https://tanstack.com/charts/latest/docs/guides/accessibility`
- SSR and hydration: `https://tanstack.com/charts/latest/docs/guides/ssr-and-hydration`
- Migrating: `https://tanstack.com/charts/latest/docs/guides/migrating`
- Testing and debugging: `https://tanstack.com/charts/latest/docs/guides/testing-and-debugging`
- Themes and styling: `https://tanstack.com/charts/latest/docs/guides/themes-and-styling`
- Large data: `https://tanstack.com/charts/latest/docs/guides/large-data`
- Custom marks and renderers: `https://tanstack.com/charts/latest/docs/guides/custom-marks-and-renderers`
- TypeScript: `https://tanstack.com/charts/latest/docs/guides/typescript`
- Bundle size and performance: `https://tanstack.com/charts/latest/docs/guides/bundle-size-and-performance`
- Responsive charts: `https://tanstack.com/charts/latest/docs/guides/responsive-charts`
- Exporting: `https://tanstack.com/charts/latest/docs/guides/exporting`
- Faceting and composition: `https://tanstack.com/charts/latest/docs/guides/faceting-and-composition`

API:

- API overview: `https://tanstack.com/charts/latest/docs/reference`
- Chart definition API: `https://tanstack.com/charts/latest/docs/reference/chart-definitions`
- Scales, guides, and color: `https://tanstack.com/charts/latest/docs/reference/scales-guides-and-color`
- Focus and interaction: `https://tanstack.com/charts/latest/docs/reference/focus-and-interaction`
- Data transforms: `https://tanstack.com/charts/latest/docs/reference/transforms`
- Mark reference index: under `https://tanstack.com/charts/latest/docs/reference/marks/`

Examples gallery: `https://tanstack.com/charts/latest/docs/examples`

Changelog: `https://github.com/TanStack/charts/blob/v0.3.1/CHANGELOG.md`

## Raw Docs

Useful when the website is slow or poorly indexed:

- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/docs/overview.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/docs/installation.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/docs/config.json`
- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/docs/guides/<guide-name>.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/docs/concepts/<concept-name>.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/docs/framework/react/<page>.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/docs/reference/<page>.md`
- `https://raw.githubusercontent.com/TanStack/charts/v0.3.1/CHANGELOG.md`

Pin to a newer tag or `main` when packages move past `0.3.1`.

## Refresh Triggers

Refresh docs before using this skill when:

- `@tanstack/charts`, `@tanstack/charts-scales`, or an adapter version changes, or the library exits pre-alpha.
- Context7 or search results still return archived `react-charts`, `primaryAxis`, `tooltip: true`, flat axis labels, `groupScale`, or `/portable`.
- The task mentions transforms, Canvas, polar, geo, custom marks, SSR, legends, or migration parity.
- Type errors mention definition identity, scale factories, channels, axis options, tooltip extensions, or missing positional scales.
- Bundle size or peer dependency ranges change (especially React 19 peers).
