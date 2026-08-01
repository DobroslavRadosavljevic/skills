# visx Source Map

Snapshot date: 2026-08-01.

## Current Package Evidence

visx **4.0.0** is the current stable release (published ~2026-06-11). React peers: `^18.0.0 || ^19.0.0`.

Repository: [airbnb/visx](https://github.com/airbnb/visx) · Docs/gallery: [visx.airbnb.tech](https://visx.airbnb.tech/) · Migration: [MIGRATION.md](https://github.com/airbnb/visx/blob/master/MIGRATION.md)

Prefer sources at tag [`v4.0.0`](https://github.com/airbnb/visx/tree/v4.0.0) for published APIs. `master` may document **4.1 (coming soon)** packages that are **not on npm** yet.

### Published consumer packages (`4.0.0`)

| Package | Umbrella `@visx/visx` | Role |
| --- | --- | --- |
| `@visx/annotation` | Y | Annotation subject / connector / label |
| `@visx/axis` | Y | Axes and ticks |
| `@visx/bounds` | Y | `withBoundingRects` (+ `nodeRef`) |
| `@visx/brush` | Y | Brush selection → domain bounds |
| `@visx/chord` | **N** | Chord + Ribbon |
| `@visx/clip-path` | Y | ClipPath helpers |
| `@visx/curve` | Y | d3 curve factories |
| `@visx/delaunay` | Y | Modern Voronoi / triangulation |
| `@visx/drag` | Y | Drag hook + component |
| `@visx/event` | Y | `localPoint` / touch helpers |
| `@visx/geo` | Y | Map projections + graticule |
| `@visx/glyph` | Y | Point symbols |
| `@visx/gradient` | Y | SVG gradients |
| `@visx/grid` | Y | Cartesian / polar grids |
| `@visx/group` | Y | Translated `<g>` |
| `@visx/heatmap` | Y | Rect / circle heatmaps |
| `@visx/hierarchy` | Y | Tree, cluster, treemap, pack, partition |
| `@visx/legend` | Y | HTML flex legends |
| `@visx/marker` | Y | SVG marker defs |
| `@visx/mock-data` | Y | Generators + static mocks |
| `@visx/network` | Y | Graph render (no force layout) |
| `@visx/pattern` | Y | SVG pattern fills |
| `@visx/point` | Y | `{x,y}` helpers |
| `@visx/react-spring` | **N** | Animated axis/grid (spring peer) |
| `@visx/responsive` | Y | ParentSize / screen size / ScaleSVG |
| `@visx/sankey` | Y | Sankey layout + component |
| `@visx/scale` | Y | Scale factories + createScale |
| `@visx/shape` | Y | Bars, lines, areas, pie, links, … |
| `@visx/stats` | **N** | BoxPlot / ViolinPlot / computeStats |
| `@visx/text` | Y | SVG text (wrap / verticalAnchor) |
| `@visx/threshold` | Y | Difference / banded areas |
| `@visx/tooltip` | Y | Tooltip state + portal |
| `@visx/vendor` | **N** | Vendored d3 subpath imports |
| `@visx/visx` | — | Meta install; namespace re-exports |
| `@visx/voronoi` | Y | Legacy d3-voronoi |
| `@visx/wordcloud` | Y | Word cloud layout |
| `@visx/xychart` | Y | High-level cartesian chart |
| `@visx/zoom` | Y | Affine pan/zoom matrix |

Umbrella dependency count at `v4.0.0`: **33** packages. Still install `@visx/chord`, `@visx/stats`, `@visx/react-spring`, and `@visx/vendor` separately when needed.

### Not for app consumers / not published at 4.0.0

| Name | Status |
| --- | --- |
| `@visx/demo` | Published gallery/Next sources — **do not install in apps** |
| `@visx/registry` | Private monorepo; shadcn-style chart **source** distribution (4.1) |
| `@visx/chart` | Monorepo hooks for registry charts — **npm 404** (4.1) |
| `@visx/theme` | Primitive theme tokens — **npm 404** (4.1) |
| `@visx/a11y` | Chart a11y helpers — **npm 404** (4.1) |
| `@visx/kernel` | Shared hook primitives — **npm 404** (4.1); **not** KDE |

### Notable release line

| Version | Highlights |
| --- | --- |
| `3.x` | React 16/17 era; deep `/lib` imports common; IE11-era targets |
| `4.0.0` | React 18/19; package `exports`; ESM fixes; `nodeRef` for bounds; ParentSize two-div; XYChart axes wait for series data |
| `4.1` (planned) | `@visx/theme`, `@visx/a11y`, `@visx/chart`, `@visx/kernel`, tooltip `/floating`, registry starters |

## Research Notes

- Primary sources: [visx.airbnb.tech](https://visx.airbnb.tech/), GitHub tag `v4.0.0`, package READMEs/`src/index.ts`, npm `4.0.0`, [MIGRATION.md](https://github.com/airbnb/visx/blob/master/MIGRATION.md).
- Context7 library ID: `/airbnb/visx` (High reputation). Index may mix older tags and `master` 4.1 material — filter for published `4.0.0` before recommending install.
- Site docs sometimes show outdated `Scale.scaleLinear` namespace style; use **named imports**.
- Some READMEs lag APIs (e.g. heatmap `step`, sankey wrong shape import path). Prefer `src` at `v4.0.0` when docs disagree.

## Official Docs

Site:

- Home / gallery hub: `https://visx.airbnb.tech/`
- Docs index: `https://visx.airbnb.tech/docs`
- Package docs pattern: `https://visx.airbnb.tech/docs/<package>` (e.g. `/docs/scale`, `/docs/xychart`)

High-value package docs:

- `https://visx.airbnb.tech/docs/scale`
- `https://visx.airbnb.tech/docs/shape`
- `https://visx.airbnb.tech/docs/axis`
- `https://visx.airbnb.tech/docs/grid`
- `https://visx.airbnb.tech/docs/tooltip`
- `https://visx.airbnb.tech/docs/responsive`
- `https://visx.airbnb.tech/docs/brush`
- `https://visx.airbnb.tech/docs/zoom`
- `https://visx.airbnb.tech/docs/xychart`
- `https://visx.airbnb.tech/docs/react-spring`

Gallery pages (examples):

- `/bars`, `/areas`, `/stacked-areas`, `/xychart`, `/brush`, `/zoom-i`, `/tooltip`, `/threshold`, `/glyphs`, `/curve`
- `/trees`, `/dendrograms`, `/treemap`, `/pack`, `/sankey`, `/chord`, `/network`
- `/geo-mercator`, `/geo-albers-usa`, `/heatmaps`, `/statsplot`, `/voronoi`, `/delaunay-voronoi`, `/wordcloud`

Sandbox sources:

- `https://github.com/airbnb/visx/tree/v4.0.0/packages/visx-demo/src/sandboxes`

npm:

- `https://www.npmjs.com/package/@visx/<name>`
- Meta: `https://www.npmjs.com/package/@visx/visx`
