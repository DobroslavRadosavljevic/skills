# D3 Shapes, Axis, Contour & Quadtree

Modules: `d3-shape`, `d3-path`, `d3-polygon`, `d3-axis`, `d3-contour`, `d3-quadtree`.

## `d3-shape`

Docs: https://d3js.org/d3-shape

Generators return an SVG path **`d` string** (default) or draw to a Canvas **`context`**.

### Line / area

```js
const line = d3
  .line()
  .x((d) => x(d.date))
  .y((d) => y(d.value))
  .defined((d) => d.value != null)
  .curve(d3.curveMonotoneX);

path.attr("d", line(data));

const area = d3
  .area()
  .x((d) => x(d.date))
  .y0(y(0))
  .y1((d) => y(d.value))
  .curve(d3.curveMonotoneX);
```

Radial: `lineRadial`, `areaRadial` (angle/radius accessors). Deprecated aliases: `radialLine`, `radialArea`.

### Curves

| Curve | Notes |
| --- | --- |
| `curveLinear` | Default |
| `curveMonotoneX` / `Y` | Smooth; input must be **monotonic** in that dimension |
| `curveStep` / `After` / `Before` | Step charts |
| `curveBasis` / `Cardinal` / `CatmullRom` / `Natural` | Smooth families |
| `curveBundle` | **Line-only** — not for areas |
| `curveBumpX` / `BumpY` | Smooth links / bumps |

### Arc / pie

Angles: **0 at 12 o’clock, positive clockwise** (SVG polar convention).

```js
const pie = d3.pie().value((d) => d.value).sort(null); // preserve input order
const arc = d3.arc().innerRadius(inner).outerRadius(outer);
pie(data).forEach((a) => path.attr("d", arc(a)));
```

### Stack

```js
const series = d3
  .stack()
  .keys(keys)
  .order(d3.stackOrderNone)
  .offset(d3.stackOffsetNone)(data);
// series[i][j] = [y0, y1] for key i, point j; .data holds original row
```

Orders: `Appearance`, `Ascending`, `Descending`, `InsideOut`, `None`, `Reverse`.  
Offsets: `Expand`, `Diverging`, `None`, `Silhouette`, `Wiggle`.

### Symbols / links

`symbol().type(d3.symbolCircle).size(64)` — **size is area in px²**.  
Links: `link`, `linkHorizontal`, `linkVertical`, `linkRadial` for hierarchy edges.

## `d3-path`

```js
const p = d3.path();
p.moveTo(0, 0);
p.lineTo(100, 50);
p.toString(); // SVG d
```

`pathRound(digits)` for rounded serialization. Used when building paths without SVG or when implementing custom generators.

## `d3-polygon`

`polygonArea`, `polygonCentroid`, `polygonHull`, `polygonContains`, `polygonLength` — planar `[x,y][]` helpers (not spherical; use `d3-geo` for geo).

## `d3-axis`

Docs: https://d3js.org/d3-axis

```js
const gx = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
gx.call(d3.axisBottom(x).ticks(6).tickSizeOuter(0));
```

`axisTop` / `axisRight` / `axisBottom` / `axisLeft`. Configure: `ticks`, `tickValues`, `tickFormat`, `tickSize`, `tickSizeInner`/`Outer`, `tickPadding`, `tickArguments`.

**React:** axes mutate the DOM via `selection.call` — use a ref + `useEffect` ([getting started](https://d3js.org/getting-started)). Alternatively render ticks yourself in JSX from `scale.ticks()`.

## `d3-contour`

```js
const density = d3
  .contourDensity()
  .x((d) => x(d[0]))
  .y((d) => y(d[1]))
  .size([width, height])
  .bandwidth(30)(points);

const path = d3.geoPath(); // contours are GeoJSON-like MultiPolygons
density.forEach((c) => ctx.fill(new Path2D(path(c))));
```

Also `contours()` for marching-squares on a grid values array. This is the KDE-style density path — not a statistical “kernel” package name collision with other libs.

## `d3-quadtree`

```js
const tree = d3
  .quadtree()
  .x((d) => d.x)
  .y((d) => d.y)
  .addAll(points);

const nearest = tree.find(mx, my, radius);
tree.visit((node, x0, y0, x1, y1) => { /* … */ });
```

Use for hover hit-testing and neighbor search at scale (alternative/complement to delaunay).

## Recipes

### Line chart path (SVG)

```js
svg
  .append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "currentColor")
  .attr("d", line);
```

### Declarative React (no selection for the path)

```jsx
const d = line(data);
return <path fill="none" stroke="currentColor" d={d} />;
```

## Gotchas

1. `curveMonotoneX` on unsorted x → artifacts; sort first.
2. `curveBundle` on `area` → invalid.
3. Pie default sort is descending by value — use `.sort(null)` to keep input order.
4. Symbol `size` is area, not radius.
5. Axis requires a selection (or manual tick rendering).
6. Stack keys must match row fields; missing values become holes / NaNs.
