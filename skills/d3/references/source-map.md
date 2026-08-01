# D3 Source Map

Snapshot date: 2026-08-01.

## Current Package Evidence

Umbrella **`d3@7.9.0`** (docs site shows 7.9.0). Pure ESM; Node 12+. Sites: [d3js.org](https://d3js.org/), [Getting started](https://d3js.org/getting-started), [API index](https://d3js.org/api), [What is D3?](https://d3js.org/what-is-d3).

Repo: [d3/d3](https://github.com/d3/d3) · Context7: `/websites/d3js` (preferred), `/d3/d3`.

### Modules shipping with `d3@7.9.0`

| Module | Semver in umbrella | Resolved (typical) | Role | Docs |
| --- | --- | --- | --- | --- |
| `d3-array` | 3 | 3.2.4 | Stats, bin, group/rollup, bisect, ticks | https://d3js.org/d3-array |
| `d3-axis` | 3 | 3.0.0 | SVG axes | https://d3js.org/d3-axis |
| `d3-brush` | 3 | 3.0.0 | Brush selection | https://d3js.org/d3-brush |
| `d3-chord` | 3 | 3.0.1 | Chord + ribbon | https://d3js.org/d3-chord |
| `d3-color` | 3 | 3.1.0 | Color spaces | https://d3js.org/d3-color |
| `d3-contour` | 4 | 4.0.2 | Contours + density | https://d3js.org/d3-contour |
| `d3-delaunay` | 6 | 6.0.4 | Delaunay / Voronoi | https://d3js.org/d3-delaunay |
| `d3-dispatch` | 3 | 3.0.1 | Named callbacks | https://d3js.org/d3-dispatch |
| `d3-drag` | 3 | 3.0.0 | Drag | https://d3js.org/d3-drag |
| `d3-dsv` | 3 | 3.0.1 | CSV/TSV parse | https://d3js.org/d3-dsv |
| `d3-ease` | 3 | 3.0.1 | Easing | https://d3js.org/d3-ease |
| `d3-fetch` | 3 | 3.0.1 | Fetch + parse | https://d3js.org/d3-fetch |
| `d3-force` | 3 | 3.0.0 | Force simulation | https://d3js.org/d3-force |
| `d3-format` | 3 | 3.1.2 | Number format | https://d3js.org/d3-format |
| `d3-geo` | 3 | 3.1.1 | Projections / paths | https://d3js.org/d3-geo |
| `d3-hierarchy` | 3 | 3.1.2 | Tree/treemap/pack/… | https://d3js.org/d3-hierarchy |
| `d3-interpolate` | 3 | 3.0.1 | Interpolators | https://d3js.org/d3-interpolate |
| `d3-path` | 3 | 3.1.0 | Path serialization | https://d3js.org/d3-path |
| `d3-polygon` | 3 | 3.0.1 | Polygon ops | https://d3js.org/d3-polygon |
| `d3-quadtree` | 3 | 3.0.1 | 2D spatial index | https://d3js.org/d3-quadtree |
| `d3-random` | 3 | 3.0.1 | RNG / distributions | https://d3js.org/d3-random |
| `d3-scale` | 4 | 4.0.2 | Scales | https://d3js.org/d3-scale |
| `d3-scale-chromatic` | 3 | 3.1.0 | Color schemes | https://d3js.org/d3-scale-chromatic |
| `d3-selection` | 3 | 3.0.0 | Select / join / events | https://d3js.org/d3-selection |
| `d3-shape` | 3 | 3.2.0 | Line/area/arc/stack/… | https://d3js.org/d3-shape |
| `d3-time` | 3 | 3.1.0 | Time intervals | https://d3js.org/d3-time |
| `d3-time-format` | 4 | 4.1.0 | Time parse/format | https://d3js.org/d3-time-format |
| `d3-timer` | 3 | 3.0.1 | Animation timers | https://d3js.org/d3-timer |
| `d3-transition` | 3 | 3.0.1 | Animated selections | https://d3js.org/d3-transition |
| `d3-zoom` | 3 | 3.0.0 | Pan/zoom | https://d3js.org/d3-zoom |

**Count:** 30 modules. Notable transitives: `internmap`, `delaunator`, `robust-predicates`.

### Install

```bash
bun add d3
# TypeScript
bun add -d @types/d3

# or modular
bun add d3-scale d3-shape d3-array
```

```js
import * as d3 from "d3";
import { scaleLinear, extent } from "d3"; // named from umbrella
import { mean, median } from "d3-array"; // modular
```

CDN ESM: `https://cdn.jsdelivr.net/npm/d3@7/+esm` ([getting started](https://d3js.org/getting-started)).

### Bundle notes

Umbrella ~279 KB min / ~92 KB gzip (approximate). Drop first when trimming: `d3-geo`, `d3-scale-chromatic`, `d3-hierarchy`, `d3-force`, `d3-contour`.

### Deprecated / replaced

| Avoid | Prefer |
| --- | --- |
| `d3.nest` | `group` / `rollup` / `groups` / `rollups` |
| `d3.event` global | Native event argument (D3 6+) |
| `d3-voronoi` / `d3.voronoi` | `d3-delaunay` (`Delaunay`) |
| `histogram` alias | `bin` |

### Notable release line

| Version | Highlights |
| --- | --- |
| 6.0 | Native Map/Set + iterables; `group`/`rollup`; events passed directly; `d3-delaunay` replaces voronoi |
| 7.0 | Pure ESM; InternMap ordinal domains; `bin` ignores nulls |
| 7.9.0 | Current stable umbrella as of skill refresh |

## Research Notes

- Prefer [d3js.org](https://d3js.org/) module pages + GitHub `d3/*` README/export indexes.
- Context7 `/websites/d3js` indexes the docs site well; still verify against installed majors.
- Official stance ([What is D3?](https://d3js.org/what-is-d3)): for many charts prefer [Observable Plot](https://observablehq.com/plot/) unless low-level control is required — still teach D3 when the user asks for D3.

## Gallery / examples

- Observable D3 gallery: https://observablehq.com/@d3/gallery
- Getting started templates: area, bar, donut, histogram, line (linked from getting-started)
