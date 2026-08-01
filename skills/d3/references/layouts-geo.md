# D3 Layouts: Hierarchy, Force, Chord, Geo, Delaunay

## Decision matrix

| Need | Module | Primary API |
| --- | --- | --- |
| Tidy tree | hierarchy | `hierarchy`/`stratify` + `tree()` |
| Dendrogram | hierarchy | `cluster()` |
| Treemap | hierarchy | `treemap()` + tile (`treemapSquarify`, …) |
| Circle pack | hierarchy | `pack()` |
| Icicle / sunburst | hierarchy | `partition()` (+ `arc` for sunburst) |
| Force network | force | `forceSimulation` + forces |
| Chord diagram | chord | `chord` / `chordDirected` + `ribbon` |
| Choropleth / maps | geo | projection + `geoPath` + color scale |
| Voronoi hover / triangulation | delaunay | `Delaunay.from` → `find` / `voronoi` |

## `d3-hierarchy`

Docs: https://d3js.org/d3-hierarchy

```js
const root = d3
  .hierarchy(data)
  .sum((d) => d.value ?? 0)
  .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

d3.treemap().size([width, height]).padding(2)(root);
// leaves: node.x0,y0,x1,y1

d3.tree().size([height, width])(root); // often swap for horizontal
// nodes: x,y ; edges: root.links()
```

Tabular → `d3.stratify().id(d => d.id).parentId(d => d.parent)(rows)`.

| Layout | Fields |
| --- | --- |
| `tree` / `cluster` | `x`, `y` |
| `treemap` / `partition` | `x0`, `y0`, `x1`, `y1` |
| `pack` | `x`, `y`, `r` |

**Gotcha:** forgetting `.sum()` → empty/zero-area treemap/pack/partition. Radial tree: treat `x` as angle degrees and `y` as radius (`size([360, radius])` pattern).

Draw edges with `d3.linkHorizontal` / `linkVertical` / `linkRadial` from `d3-shape`.

## `d3-force`

Docs: https://d3js.org/d3-force

```js
const simulation = d3
  .forceSimulation(nodes)
  .force(
    "link",
    d3.forceLink(links).id((d) => d.id).distance(40),
  )
  .force("charge", d3.forceManyBody().strength(-30))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collide", d3.forceCollide(8))
  .on("tick", ticked);

function ticked() {
  // read node.x / node.y (mutated in place)
}
// cleanup: simulation.stop();
```

Forces: `forceCenter`, `forceCollide`, `forceLink`, `forceManyBody`, `forceX`, `forceY`, `forceRadial`. Control: `alpha`, `alphaTarget`, `alphaDecay`, `velocityDecay`, `tick(iterations)`, `randomSource`, `stop` / `restart`.

Links reference nodes by object or id accessor. Fix positions with `fx`/`fy`.

## `d3-chord`

Docs: https://d3js.org/d3-chord

```js
const chords = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
const ribbon = d3.ribbon().radius(innerRadius);
const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
// chords.groups → arcs; chords → ribbons
```

Also `chordDirected`, `chordTranspose`, `ribbonArrow`. Input: square nonnegative `number[][]`.

## `d3-geo`

Docs: https://d3js.org/d3-geo

```js
const projection = d3.geoMercator().fitSize([width, height], featureCollection);
const path = d3.geoPath(projection);

svg
  .selectAll("path")
  .data(featureCollection.features)
  .join("path")
  .attr("d", path)
  .attr("fill", (d) => color(d.properties.value));
```

Common projections: `geoMercator`, `geoEqualEarth`, `geoNaturalEarth1`, `geoOrthographic`, `geoAlbers`, `geoAlbersUsa`, plus many azimuthal/conic/cylindrical variants.

Helpers: `geoGraticule`, `geoCircle`, `geoContains`, `geoCentroid`, `geoBounds`, `fitExtent` / `fitSize` / `fitWidth` / `fitHeight`.

**Gotchas:** Mercator distorts area — prefer equal-area for choropleth comparisons. Don’t treat lon/lat as Euclidean for delaunay without projecting first. TopoJSON needs `topojson-client` (not bundled).

## `d3-delaunay`

Docs: https://d3js.org/d3-delaunay

```js
const delaunay = d3.Delaunay.from(
  points,
  (d) => d.x,
  (d) => d.y,
);
const voronoi = delaunay.voronoi([0, 0, width, height]);

const i = delaunay.find(mx, my);
const cell = voronoi.renderCell(i);
```

Prefer this over deprecated **d3-voronoi**. APIs: `find`, `neighbors`, `render`, `renderPoints`, voronoi `renderCell` / `cellPolygons`.

## Composition notes

1. Hierarchy + shape links for trees; partition + arc for sunburst.
2. Force + selection join on tick for networks; or push positions into React state sparingly.
3. Geo path strings work in SVG or Canvas (`path.context(ctx)`).
4. Delaunay overlay + `pointer` from selection for hover.
