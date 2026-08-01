# D3 Selection, Brush, Drag, Zoom & Dispatch

## Critical framework rule

From [Getting started — D3 in React](https://d3js.org/getting-started):

- **Non-DOM modules** (`d3-scale`, `d3-array`, `d3-shape`, `d3-interpolate`, `d3-format`, …) work declaratively in JSX.
- **DOM modules** (`d3-selection`, `d3-transition`, `d3-axis` via `call`, `d3-brush`, `d3-drag`, `d3-zoom`) compete with the virtual DOM — attach a **ref** and run D3 inside **`useEffect`** (or equivalent).

Same idea in Svelte: pure math in the template; bind elements and call selection APIs in reactive statements / `onMount` carefully.

## `d3-selection`

Docs: https://d3js.org/d3-selection

### Select

```js
d3.select(svgRef.current);
d3.selectAll("circle");
selection.select("title"); // preserves groups; inherits data
selection.selectAll("tspan"); // regroups by parent; does NOT inherit data
```

### Data join (prefer modern `join`)

```js
svg
  .selectAll("circle")
  .data(data, (d) => d.id)
  .join(
    (enter) => enter.append("circle").attr("fill", "green"),
    (update) => update.attr("fill", "blue"),
    (exit) => exit.remove(),
  )
  .attr("cx", (d) => x(d.v))
  .attr("cy", (d) => y(d.v));
```

Shorthand: `.join("circle")`. Key function enables object constancy. Classic `enter`/`exit`/`merge` still valid for custom control.

### Modify / events

`attr`, `style`, `property`, `classed`, `text`, `html`, `append`, `insert`, `remove`, `raise`, `lower`, `each`, `call`, `on`, `datum`.

```js
selection.on("click", (event, d) => {
  // D3 6+: event is the first argument — no d3.event
});
d3.pointer(event, container); // local coords
```

## `d3-brush`

Docs: https://d3js.org/d3-brush

```js
const brush = d3
  .brushX()
  .extent([
    [margin.left, margin.top],
    [width - margin.right, height - margin.bottom],
  ])
  .on("brush end", ({ selection }) => {
    if (!selection) return;
    const [x0, x1] = selection.map(x.invert);
    // filter domain / update focus chart
  });

gBrush.call(brush);
// programatic: brush.move(gBrush, [x(a), x(b)]); brush.clear(gBrush);
```

`brush` (2D), `brushX`, `brushY`. Read with `d3.brushSelection(node)`.

**Recipe:** overview chart with brush → filter detail chart domain (same pattern as many gallery examples).

## `d3-drag`

Docs: https://d3js.org/d3-drag

```js
const drag = d3
  .drag()
  .subject((event, d) => d) // or {x,y}
  .on("start", (event, d) => { … })
  .on("drag", (event, d) => {
    d.x = event.x;
    d.y = event.y;
  })
  .on("end", (event, d) => { … });

selection.call(drag);
```

Options: `clickDistance`, `container`, `filter`, `touchable`. Works with SVG/HTML/Canvas.

## `d3-zoom`

Docs: https://d3js.org/d3-zoom

```js
const zoom = d3
  .zoom()
  .scaleExtent([0.5, 8])
  .translateExtent([
    [0, 0],
    [width, height],
  ])
  .on("zoom", ({ transform }) => {
    g.attr("transform", transform);
    // or: x = transform.rescaleX(x0); y = transform.rescaleY(y0);
  });

svg.call(zoom);
svg.call(zoom.transform, d3.zoomIdentity);
const t = d3.zoomTransform(svg.node());
```

`transform` has `x`, `y`, `k`, plus `apply`/`invert`/`rescaleX`/`rescaleY`. Prefer rescaling axes/scales over double-transforming data marks when drawing axes.

## `d3-dispatch`

```js
const dispatch = d3.dispatch("start", "end");
dispatch.on("start.foo", (…args) => { … });
dispatch.call("start", that, …args);
```

Used internally by brush/drag/zoom; useful when building reusable chart components.

## Combining interactions

| Combo | Guidance |
| --- | --- |
| Zoom + brush | Prefer brush on a separate overview; or filter brush events vs zoom via `.filter` |
| Drag + zoom | Drag subjects inside a zoomed layer; account for transform when interpreting coordinates |
| Zoom + axes | `transform.rescaleX(originalScale)` then re-call axis |

Set `touch-action: none` (CSS) when zoom/drag fight browser scrolling.

## React sketch (axes via effect)

```jsx
import * as d3 from "d3";
import { useEffect, useRef } from "react";

export function LinePlot({ data, width = 640, height = 400, marginLeft = 40, marginBottom = 30 }) {
  const gx = useRef(null);
  const gy = useRef(null);
  const x = d3.scaleLinear([0, data.length - 1], [marginLeft, width - 20]);
  const y = d3.scaleLinear(d3.extent(data), [height - marginBottom, 20]);
  const line = d3.line((d, i) => x(i), y);

  useEffect(() => void d3.select(gx.current).call(d3.axisBottom(x)), [x]);
  useEffect(() => void d3.select(gy.current).call(d3.axisLeft(y)), [y]);

  return (
    <svg width={width} height={height}>
      <g ref={gx} transform={`translate(0,${height - marginBottom})`} />
      <g ref={gy} transform={`translate(${marginLeft},0)`} />
      <path fill="none" stroke="currentColor" strokeWidth="1.5" d={line(data)} />
    </svg>
  );
}
```

Adapted from [getting started](https://d3js.org/getting-started).

## Gotchas

1. Using `d3.event` (removed) — take `event` from the listener.
2. Nesting `selectAll` without understanding group structure / data functions.
3. Joining without a key → index identity thrash on reorder.
4. Putting brush and zoom on the same element without filters.
5. Forgetting to detach listeners / `simulation.stop` / zoom on unmount in React.
6. Reading pointer coordinates without `d3.pointer(event, container)`.
