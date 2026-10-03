# Maps and Geographic Animations

Choosing a map technique, MapLibre/Mapbox/MapTiler/Cesium patterns, camera choreography, and render stability. Snapshot: 4.0.532.

## Contents

1. Pick one technique
2. Shared rules
3. MapLibre recipe
4. Camera choreography
5. Render stability (map plates)
6. Provider notes
7. Verification

---

## 1. Pick one technique

| Technique | When | Notes |
| --- | --- | --- |
| Static map image | Location callouts, simple routes | Export an image at the final aspect ratio ≥ render size → `public/` → `<CanvasImage>`/`<Img>`; overlay Remotion elements. Smallest, fastest, deterministic. |
| MapLibre GL | Free vector maps, routes, labels | No API key with demo styles; no 3D buildings. |
| Mapbox GL | Polished styles, globe, 3D landmarks | Token via `REMOTION_MAPBOX_TOKEN`. |
| MapTiler | Annotated borders, rivers, labels | `REMOTION_MAPTILER_KEY`. `@remotion/maptiler` exists but is internal/undocumented. |
| CesiumJS | Terrain or photorealistic 3D flyovers | Google Photorealistic 3D Tiles need `REMOTION_GOOGLE_MAPS_API_KEY`. |

## 2. Shared rules

- Use Turf (`bun add @turf/turf`) for geo math: `greatCircle`, `lineSliceAlong`, `along`, `length`. Coordinates are `[lng, lat]`.
- Draw lines, markers, and labels with GeoJSON sources + map layers (not DOM markers) so they render in the same pass. DOM labels must be projected each frame with `map.project()`.
- Map options: `interactive: false`, `fadeDuration: 0`, `attributionControl: false` (keep provider attribution visible as the terms require), `canvasContextAttributes: {preserveDrawingBuffer: true}`.
- Initialize once. Wait for `load`, set the frame-0 camera, wait for `idle`, then release the delayRender handle.
- Per frame: create a handle → update data/paint/camera → `map.once('idle', () => continueRender(handle))` → `map.triggerRepaint()` (forces an idle event even when nothing changed).
- Never call `map.remove()` in a cleanup — it breaks the render lifecycle.
- Do not install `@types/maplibre-gl` / `@types/mapbox-gl` (types ship with the packages).
- Keep line slices ≥0.001 km (Turf errors on zero length). Great circles crossing the antimeridian return a MultiLineString — take the longest part.
- Render with a GL backend: `--gl=angle` (or `swangle` without GPU), start with `--concurrency=1`.

## 3. MapLibre recipe

```tsx
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';

maplibregl.setWorkerUrl(
  URL.createObjectURL(new Blob([`import "https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl-worker.mjs";`], {type: 'text/javascript'})),
);

const LA: [number, number] = [-118.24, 34.05];
const NY: [number, number] = [-74.0, 40.71];
const route = turf.greatCircle(LA, NY, {npoints: 200});
const routeKm = turf.length(route);

export const FlightMap: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const {delayRender, continueRender} = useDelayRender();
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [initHandle] = useState(() => delayRender('Loading map'));

  useEffect(() => {
    const m = new maplibregl.Map({
      container: ref.current!,
      style: 'https://demotiles.maplibre.org/style.json',
      center: LA,
      zoom: 3,
      interactive: false,
      fadeDuration: 0,
      attributionControl: false,
      canvasContextAttributes: {preserveDrawingBuffer: true},
    });
    m.on('load', () => {
      m.addSource('route', {type: 'geojson', data: turf.lineString([LA, LA])});
      m.addLayer({id: 'route', type: 'line', source: 'route', paint: {'line-color': '#ff3b30', 'line-width': 8}});
      m.once('idle', () => {
        setMap(m);
        continueRender(initHandle);
      });
    });
  }, [continueRender, initHandle]);

  useEffect(() => {
    if (!map) return;
    const handle = delayRender(`Map frame ${frame}`);
    const progress = interpolate(frame, [0.2 * durationInFrames, 0.8 * durationInFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.645, 0.045, 0.355, 1),
    });
    const slice = turf.lineSliceAlong(route, 0, Math.max(0.001, routeKm * progress));
    (map.getSource('route') as maplibregl.GeoJSONSource).setData(slice);
    map.once('idle', () => continueRender(handle));
    map.triggerRepaint();
  }, [map, frame, durationInFrames, delayRender, continueRender]);

  return (
    <AbsoluteFill>
      <div ref={ref} style={{position: 'absolute', width, height}} />
    </AbsoluteFill>
  );
};
```

## 4. Camera choreography

- Separate the target route (where the line is, what the camera looks at) from the camera route.
- MapLibre: `map.jumpTo(map.calculateCameraOptionsFromTo(cameraLngLat, altitudeMeters, targetLngLat))`.
- Animate travel progress and altitude separately: zoom out → travel → zoom in. Example: travel over 20–82% of the timeline with `Easing.bezier(0.645, 0.045, 0.355, 1)`, altitude 180 km → 2,200 km → 180 km.
- Explainer beats: constant per-element timing from a trigger frame (border 2.5 s → fill 1 s → label 0.7 s). Label anchor = pole of inaccessibility, not centroid.
- Size markers and labels for the output resolution (at 1080p: ~12 px dots with 4 px stroke, ~28 px labels with a 3 px halo).

## 5. Render stability (map plates)

Moving the live map camera every frame (`jumpTo` per frame) makes hillshade/satellite tiles shimmer in headless renders. For camera moves:

1. Render the map once at the needed zoom into an oversized container (≤4096 px per side; 1920×1080 → ~3840×2160 plate).
2. Keep the map camera static.
3. Move and scale the plate with CSS `translate` + `scale` (scale ≤1), applying the same transform to overlays.
4. Split very large moves into two plates instead of one huge canvas.

Shimmer = the live camera is moving. Soft tiles = the plate is too small. Verify with a short rendered MP4, not only Studio.

## 6. Provider notes

- MapTiler: strip `symbol` layers and other-border layers on load; never pass `filter: undefined` to a layer (it silently hides fills); provider vector features are tile-split → bake ordered GeoJSON for directional draws.
- Cesium: `useDefaultRenderLoop = false`; call `viewer.render()` (never `scene.render()`); `preserveDrawingBuffer`; long delayRender timeouts (60–120 s) and `--timeout=180000`; wait until tiles report loaded for several ticks; keep Google-tile compositions ≤30 s. Slow, smooth cameras render faster (tiles stay cached): ~0.5 km/s at 4–5 km altitude feels cinematic.
- Mapbox: Standard style; globe projection when zoomed out.

## 7. Verification

Render a middle-frame still first (`bunx remotion still FlightMap out/mid.png --frame=150 --gl=angle`), then a short MP4 at each target aspect ratio. Check line endpoints, label legibility, and shimmer.
