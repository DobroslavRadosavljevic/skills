# D3 Animation, Frameworks & Production

## Positioning

D3 is a **low-level module suite**, not a chart library ([What is D3?](https://d3js.org/what-is-d3)). Official guidance: consider [Observable Plot](https://observablehq.com/plot/) for many standard charts; use D3 when you need bespoke marks, joins, and interaction.

## `d3-transition` / `d3-ease` / `d3-timer`

Docs: https://d3js.org/d3-transition · https://d3js.org/d3-ease · https://d3js.org/d3-timer

```js
selection
  .data(data, (d) => d.id)
  .join(
    (enter) =>
      enter
        .append("circle")
        .attr("r", 0)
        .call((enter) => enter.transition().duration(500).attr("r", 4)),
    (update) => update.call((u) => u.transition().attr("cx", (d) => x(d.v))),
    (exit) => exit.call((e) => e.transition().attr("r", 0).remove()),
  );
```

Key APIs: `selection.transition([name])`, `delay`, `duration`, `ease`, `attr`/`style`/`attrTween`/`styleTween`, `on("start"|"end"|"interrupt")`, `selection.interrupt(name)`.

Eases: `easeLinear`, `easeCubic`, `easeCubicInOut`, `easeElastic`, `easeBounce`, … (see ease docs).

Timers: `d3.timer(callback)`, `d3.timeout`, `d3.interval` — stop via return true / `.stop()`. Used by transitions and custom animation loops (including force tick bridges).

**React:** run transitions inside effects on refs; do not fight React by transitioning nodes React expects to own without coordination.

## Install patterns

```bash
# Full toolbox
bun add d3
bun add -d @types/d3

# Lean declarative chart
bun add d3-scale d3-shape d3-array
```

CDN / Observable / vanilla HTML patterns: [getting started](https://d3js.org/getting-started).

## Decision guide

| Choose | When |
| --- | --- |
| **Modular D3 (scale/shape/array)** | Custom SVG/Canvas in React/Svelte without selection |
| **D3 + selection/transition** | Imperative joins, complex interaction, Observable notebooks |
| **Observable Plot** | Grammar-of-graphics charts with less code |
| **Higher-level React chart libs** | Product dashboards with opinionated components |
| **Canvas + D3 math** | Tens of thousands of marks |

## Production patterns

### SSR

- Prefer computing path strings / positions on the server from pure modules.
- Do not run `select` / brush / zoom / force during SSR — gate on `typeof document`, `useEffect`, or client-only components.
- `d3-fetch` needs a fetch implementation in the environment.

### SVG vs Canvas

- SVG: DOM joins, CSS, accessibility easier.
- Canvas: set `generator.context(ctx)` or draw manually from scales; use quadtree/delaunay for picking.
- Hybrid: Canvas marks + SVG axes/overlays.

### Performance

- Keyed joins; avoid destroying the whole chart each update.
- Aggregate with `rollup` before binding thousands of groups.
- Prefer Canvas or WebGL for huge point clouds; downsample when possible.
- Stop force simulations and timers on teardown.

### Testing

- Fixed width/height; inject known data.
- Mock `requestAnimationFrame` / use `d3.timer` flush strategies carefully.
- Assert path `d` strings or scaled coordinates from pure functions.
- For selection charts, use a real DOM (jsdom / browser runner).

### Accessibility

- Provide text alternatives / data tables for critical charts.
- Ensure keyboard access if interaction is required (brush/zoom are pointer-first — add affordances).
- Sufficient color contrast; don’t rely on chromatic schemes alone.

## Migration notes (v5/v6 → v7)

1. **No `d3.event`** — listeners receive `(event, d)`.
2. **No `d3.nest`** — use `group` / `rollup`.
3. **`d3-delaunay` replaces `d3-voronoi`**.
4. **ESM-first** (v7) — use `import` / bundlers; UMD CDN still available.
5. Iterables accepted widely; prefer modern array helpers.
6. Ordinal domains use InternMap/`valueOf` uniquing.

## AI authoring checklist

1. Treating D3 like `<LineChart data={…}>` — wrong abstraction.
2. Mixing selection updates with React render of the same nodes.
3. Using `d3.event` or `d3.nest`.
4. Forgetting inverted y range.
5. Log scale domain including 0.
6. `curveMonotoneX` without sorted x; `curveBundle` on areas.
7. Hierarchy layout without `.sum()` for valued layouts.
8. Force sim without `stop()` on unmount.
9. Brush/zoom without event filtering when composed.
10. Importing deprecated `d3-voronoi`.
11. Assuming umbrella tree-shakes perfectly — prefer modular installs for lean apps.
12. Parsing dates with `autoType` when format is custom — use `timeParse`.
13. Symbol `size` as radius.
14. Axis in JSX without either manual ticks or ref+`call`.
15. Mutating scale domains globally across concurrent charts without `copy()`.

## Framework cheatsheet

| Task | React approach |
| --- | --- |
| Scales / line path / colors | Compute in render; bind to SVG attributes |
| Axes | `useRef` + `useEffect` + `selection.call(axis)` **or** map `ticks()` to JSX |
| Join animation | Imperative D3 in effect **or** animation library on React-owned nodes |
| Brush / zoom / drag | Refs + behaviors in effects; sync derived domain to React state |
| Force | Run sim in effect; write positions to attrs or state on tick |

## Official URL map (bookmark set)

- Getting started: https://d3js.org/getting-started
- API index: https://d3js.org/api
- What is D3: https://d3js.org/what-is-d3
- Module docs: `https://d3js.org/d3-<name>`
- Gallery: https://observablehq.com/@d3/gallery
- CHANGES: https://github.com/d3/d3/blob/main/CHANGES.md
