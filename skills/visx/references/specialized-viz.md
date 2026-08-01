# visx Specialized Visualizations

Cross-cutting: you own `<svg>`, margins, scales, and interaction. Layout packages usually expose default glyphs **or** a children render function with the computed layout.

## Decision matrix

| Need | Package | Primary API | Notes |
| --- | --- | --- | --- |
| Boxplot | `@visx/stats` | `BoxPlot`, `computeStats` | Glyphs, not a full chart |
| Violin | `@visx/stats` | `ViolinPlot`, `binData` | Binned density, not true KDE |
| Heatmap | `@visx/heatmap` | `HeatmapRect` / `HeatmapCircle` | Scales map **indices** |
| Treemap | `@visx/hierarchy` | `Treemap` + `hierarchy`/`stratify` | Need `.sum()` |
| Pack | `@visx/hierarchy` | `Pack` | Circle packing |
| Tree | `@visx/hierarchy` | `Tree` + `Link*` | `size` or `nodeSize` |
| Dendrogram | `@visx/hierarchy` | `Cluster` + `Link*` | Equal leaf depth |
| Force network | `@visx/network` + external layout | `Graph` / `Nodes` / `Links` | **No force built-in** |
| Sankey | `@visx/sankey` | `Sankey`, `sankey*` | DAG flows |
| Chord | `@visx/chord` | `Chord` + `Ribbon` + `Arc` | Square matrix |
| Choropleth | `@visx/geo` | `Mercator` / `AlbersUsa` / … | Join values to features |
| Voronoi hover | Prefer `@visx/delaunay` | `voronoi` + polygons / `find` | Legacy: `@visx/voronoi` |
| Density / KDE | No dedicated pkg | stats bins or external KDE | `@visx/kernel` ≠ KDE |
| Word cloud | `@visx/wordcloud` | `Wordcloud` / `useWordcloud` | Async layout |
| Sunburst | `@visx/hierarchy` | `Partition` + arcs | `size={[360, radius]}` |

## `@visx/stats`

Exports: `BoxPlot`, `ViolinPlot`, `computeStats`.

`computeStats(number[])` → `{ boxPlot, binData }` (Tukey fences, FD-ish bins).

```tsx
import { BoxPlot, ViolinPlot, computeStats } from '@visx/stats';

const { boxPlot, binData } = computeStats(samples);
<ViolinPlot data={binData} left={left} width={w} valueScale={yScale} />
<BoxPlot left={left} boxWidth={w * 0.4} valueScale={yScale} {...boxPlot} container />
```

Memoize `computeStats` per series. Horizontal via `horizontal`.

Docs: https://visx.airbnb.tech/docs/stats · Gallery: https://visx.airbnb.tech/statsplot

## `@visx/heatmap`

Exports: `HeatmapRect`, `HeatmapCircle`.

Default data nest:

```js
[{ bin: 1, bins: [{ bin: 23, count: 20 }] }]
```

`xScale`/`yScale` take **columnIndex** / **rowIndex**, not bin IDs. Always provide `colorScale`. README `step` prop is stale — not in v4 API.

Docs: https://visx.airbnb.tech/docs/heatmap · Gallery: https://visx.airbnb.tech/heatmaps

## `@visx/hierarchy`

Components: `Tree`, `Cluster`, `Treemap`, `Pack`, `Partition`. Defaults: `HierarchyDefaultLink` / `Node` / `RectNode`. Re-exports `hierarchy`, `stratify`, treemap tile functions from `d3-hierarchy`.

```tsx
import { Tree, hierarchy } from '@visx/hierarchy';
import { LinkHorizontal } from '@visx/shape';

const root = hierarchy(data);
<Tree root={root} size={[yMax, xMax]}>
  {(tree) => (
    <>
      {tree.links().map((link, i) => (
        <LinkHorizontal key={i} data={link} stroke="#999" fill="none" />
      ))}
      {tree.descendants().map((node) => (
        <circle key={node.data.name} cx={node.y} cy={node.x} r={4} />
      ))}
    </>
  )}
</Tree>
```

Weighted layouts need `.sum()`. Radial: `size={[360, radius]}`. Prefer children over default nodes.

Docs: https://visx.airbnb.tech/docs/hierarchy

## `@visx/network`

`Graph`, `Links`, `Nodes`, `DefaultLink`, `DefaultNode`.

Nodes need `{ x, y }`. Links use **object references** (`source`/`target` nodes), not indices. Run `d3-force` (or similar) outside the package.

Docs: https://visx.airbnb.tech/docs/network

## `@visx/sankey`

`Sankey` + `sankey`, `sankeyLinkHorizontal`, `sankeyLeft`/`Right`/`Center`/`Justify`.

```tsx
import { Sankey, sankeyCenter } from '@visx/sankey';
import { Bar } from '@visx/shape';

<Sankey root={data} nodeAlign={sankeyCenter} size={[innerW, innerH]} nodeWidth={12} nodePadding={10}>
  {({ graph, createPath }) => (
    <>
      {graph.links.map((link, i) => (
        <path key={i} d={createPath(link) ?? ''} fill="none" strokeWidth={link.width} />
      ))}
      {graph.nodes.map((n, i) => (
        <Bar key={i} x={n.x0} y={n.y0} width={n.x1 - n.x0} height={n.y1 - n.y0} />
      ))}
    </>
  )}
</Sankey>
```

Validate DAG. Draw nodes with `@visx/shape` (not `@visx/group`).

Docs: https://visx.airbnb.tech/docs/sankey

## `@visx/chord`

`Chord` + `Ribbon`. Compose group arcs with `@visx/shape` `Arc`. Input: square nonnegative `number[][]`. Children **required** in practice (`{ chords }`).

Docs: https://visx.airbnb.tech/docs/chord

## `@visx/geo`

Projections: `Albers`, `AlbersUsa`, `Mercator`, `Orthographic`, `NaturalEarth`, `EqualEarth`, `CustomProjection`, plus `Graticule`.

Typical: `topojson-client` → features → projection children `{ features, path, projection }` → `<path d={path} fill={colorScale(...)} />`.

Not a tile basemap. Simplify heavy TopoJSON for interaction.

Docs: https://visx.airbnb.tech/docs/geo

## Voronoi: `@visx/delaunay` (prefer) vs `@visx/voronoi` (legacy)

### `@visx/delaunay` (d3-delaunay via vendor)

```ts
import { voronoi, Polygon, delaunay } from '@visx/delaunay';

const diagram = voronoi({ data: points, x: (d) => d.x, y: (d) => d.y, width, height });
Array.from(diagram.cellPolygons());
```

### `@visx/voronoi` (d3-voronoi)

```ts
import { voronoi, VoronoiPolygon } from '@visx/voronoi';

const layout = voronoi({ x: (d) => d.x, y: (d) => d.y, width, height });
const diagram = layout(data);
diagram.polygons();
diagram.find(x, y, radius?);
```

APIs are **not** drop-in compatible. Memoize layouts; use `localPoint` for hover hit-testing.

Docs: https://visx.airbnb.tech/docs/delaunay · https://visx.airbnb.tech/docs/voronoi

## `@visx/wordcloud`

`Wordcloud` (owns `<svg>`) and `useWordcloud` (embed in existing SVG). Layout is **async**. Pass stable `random` to avoid jumpiness. `width/height === 0` → `null`.

```tsx
import { Wordcloud } from '@visx/wordcloud';
import { Text } from '@visx/text';

<Wordcloud words={words} width={width} height={height} fontSize={(d) => Math.sqrt(d.value) * 4} random={() => 0.5}>
  {(cloudWords) =>
    cloudWords.map((w, i) => (
      <Text key={i} x={w.x} y={w.y} fontSize={w.size} textAnchor="middle" transform={`rotate(${w.rotate}, ${w.x}, ${w.y})`}>
        {w.text}
      </Text>
    ))
  }
</Wordcloud>
```

Docs: https://visx.airbnb.tech/docs/wordcloud

## `@visx/kernel` (4.1 preview — not KDE)

Shared hook primitives (memoization, accessors, domains, Path2D helpers). **Not on npm** at 4.0.0. Not a statistical kernel / density package.

For density: `@visx/stats` bins/`ViolinPlot`, or external KDE + `@visx/shape` areas.
