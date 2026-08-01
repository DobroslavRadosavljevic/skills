---
name: d3
description: "Build, review, debug, migrate, or plan D3.js visualizations with current docs (d3@7.9.x and modular d3-*). Use for d3-array, d3-scale, d3-scale-chromatic, d3-shape, d3-selection, d3-axis, d3-transition, d3-ease, d3-timer, d3-brush, d3-drag, d3-zoom, d3-force, d3-hierarchy, d3-geo, d3-delaunay, d3-chord, d3-contour, d3-quadtree, d3-fetch, d3-dsv, d3-format, d3-time, d3-time-format, d3-color, d3-interpolate, d3-path, d3-polygon, d3-random, d3-dispatch, data join, scaleLinear/band/time/ordinal, line/area/arc/stack, geoPath, forceSimulation, and D3 in React/Svelte (declarative math vs refs+effects)."
---

# D3

Use this skill when work touches D3.js (`d3` or modular `d3-*`) — data prep, scales, shapes, selections/joins, axes, transitions, brush/drag/zoom, force, hierarchy, geo, delaunay, or framework interop.

Treat **`d3@7.9.x`** as the current umbrella line ([getting started](https://d3js.org/getting-started), [API index](https://d3js.org/api)). Prefer official `d3js.org` module pages and npm-resolved majors over memory. D3 is a **toolbox of ~30 modules**, not a chart library — compose encodings yourself (or choose a higher-level chart stack when bespoke D3 is unnecessary).

## Workflow

1. Confirm the local surface before changing code:
   - Umbrella `d3` version vs modular `d3-*` installs; TypeScript via `@types/d3` / `@types/d3-*` (DefinitelyTyped).
   - Whether the task needs **DOM modules** (selection, transition, axis-via-call, brush, drag, zoom) or **pure math** (array, scale, shape, interpolate, format, …).
   - Rendering target: SVG, Canvas (`generator.context`), or declarative JSX path/`cx`/`cy` attributes.
2. Refresh package evidence and docs URLs from [source-map.md](references/source-map.md).
3. For install strategy, data prep, scales, chromatic schemes, color, and interpolate, use [setup-data-scales.md](references/setup-data-scales.md).
4. For line/area/arc/pie/stack/symbol/link, path, polygon, axis, contour/density, and quadtree, use [shapes-geometry.md](references/shapes-geometry.md).
5. For hierarchy, force, chord, geo, and delaunay/voronoi, use [layouts-geo.md](references/layouts-geo.md).
6. For selection/join, brush, drag, zoom, and dispatch — including React/Svelte DOM conflict rules — use [selection-interaction.md](references/selection-interaction.md).
7. For transitions/ease/timer, framework guidance, production/SSR/canvas, v6→v7 notes, and AI traps, use [animation-frameworks.md](references/animation-frameworks.md).

## Implementation Judgment

- Prefer the **smallest module set** that answers the job. Prototyping: `bun add d3`. Production React charts often need only `d3-scale` + `d3-shape` + `d3-array` (plus selection/axis when calling DOM APIs).
- **Invert continuous y ranges** (`[innerHeight, marginTop]`). SVG `y` grows downward.
- **Pure math in JSX is fine** (scale, array, shape path strings, format). **DOM mutators need refs + effects** in React: selection, `selection.call(axis)`, transition, brush, drag, zoom ([official React guidance](https://d3js.org/getting-started)).
- Prefer modern **`selection.data(data, key).join(...)`** over verbose enter/update/exit unless you need custom exit animations.
- Pass the **native event** to listeners (D3 6+); there is **no `d3.event`**.
- Prefer **`d3-delaunay`** (`Delaunay.from`) over deprecated `d3-voronoi`.
- Hierarchy layouts that encode value need **`.sum()`** (and usually `.sort()`) before `treemap`/`pack`/`partition`.
- Force simulations **mutate** `node.x`/`node.y` each tick — drive renders from `"tick"` (or React state), and `stop()` when unmounting.
- Band bars use `.bandwidth()`; categorical lines/scatter often use `scalePoint`. Sort data before `curveMonotoneX`.
- Do not use `d3.nest` (removed); use `group` / `rollup` / `groups` / `rollups`.
- Unique SVG `id`s for clips/gradients/markers when multiple charts share a document.

## Verification

Prefer the repo's existing checks. For meaningful D3 changes, include the relevant subset:

- Package/version check for `d3@7` or aligned modular majors; `@types/d3` when TypeScript.
- Typecheck for accessors, scale domains, and join key types.
- Deterministic SVG/Canvas assertions with fixed width/height (mock timers for transitions; stop force sims in tests).
- Interaction tests for brush domain filter, zoom transform, and drag when those APIs change.
- Bundle audit when adding geo, force, hierarchy, contour, or the full umbrella.
- Migration scan for `d3.event`, `d3.nest`, `d3.voronoi`, and React 16-era patterns if upgrading from older D3.
