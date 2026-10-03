# Effects, Shaders, WebGL, and 3D

`@remotion/effects` (the `effects` prop), the full effect catalog, custom effects with `createEffect`, `<HtmlInCanvas>` shaders, GL backends, `@remotion/three`, `@remotion/skia`. Snapshot: 4.0.532.

## Contents

1. How effects work
2. Components that accept `effects`
3. Render requirement: the GL backend
4. Stacked, animated example
5. Effect catalog
6. Custom effects (`createEffect`)
7. `<HtmlInCanvas>` shaders
8. React Three Fiber (`@remotion/three`)
9. Skia (`@remotion/skia`)
10. GL backend table
11. Pitfalls

---

## 1. How effects work

An effect is a descriptor created by a factory (`blur({radius: 20})`). Pass an array to the `effects` prop of a canvas-based component. Each frame the component paints its content to a canvas, runs the chain **in array order**, and holds a delayRender until the GPU work finishes.

- Effects never animate by themselves. Compute every changing parameter from `useCurrentFrame()` (inline `interpolate`), e.g. `noise({seed: frame})`, `lightLeak({progress})`.
- Import from subpaths: `import {blur} from '@remotion/effects/blur'`. The package root re-exports only 11 effects; `xyTranslate`/`uvTranslate` come from `@remotion/effects/translate`. Install: `bunx remotion add @remotion/effects`.
- Each factory accepts `disabled` to skip a pass without changing the array shape (keeps Studio editing intact).
- Parameters are validated when the factory is called; bad values throw during render.
- 11 effects run on Canvas 2D (brightness, contrast, grayscale, hue, invert, saturation, tint, xyTranslate, uvTranslate, scale, tile) and read pixels on the CPU. Everything else is WebGL2. Switching backends inside a chain costs a GPU readback — group same-backend effects, and prefer one `colorCorrection()` over brightness + contrast + saturation.
- Pixel-unit params (blur radius, grid sizes) are in backing pixels: when you raise `pixelDensity`, multiply them by it.
- Each component with WebGL effects holds 2 WebGL contexts; Chrome keeps ~16 live contexts. Unmount off-screen layers (timing props) instead of hiding them with opacity.
- Order: generators first (they replace pixels), then color, then geometric warps, then grain/vignette/overlays.

## 2. Components that accept `effects`

| Component | Since | Notes |
| --- | --- | --- |
| `<Solid width height color>` (`remotion`) | 4.0.464 | Host for generators/backgrounds. |
| `<Video>` (`@remotion/media`) | 4.0.464 | Not `<OffthreadVideo>`/`<Html5Video>`. |
| `<Img>` / `<CanvasImage>` (`remotion`) | 4.0.469 / 4.0.466 | `<Img effects>` renders through `<CanvasImage>`; numeric width/height; CORS for remote. |
| `<AnimatedImage>`, `<Gif>`, `<RemotionRiveCanvas>` | 4.0.464 | |
| `@remotion/shapes` components | 4.0.474 | Wrapped in `<HtmlInCanvas>` → preview needs the Chrome flag. |
| `<HtmlInCanvas>` (`remotion`) | 4.0.464 | Effects on arbitrary DOM; preview needs Chrome ≥149 + `chrome://flags/#canvas-draw-element`. |
| HTML-in-canvas transitions | — | See transitions reference. |

## 3. Render requirement: the GL backend

In 4.0.532 the default `gl` is `null`: headless Chrome has no WebGL, so WebGL effects, Three.js, Skia, maps, and shader transitions fail with "Failed to acquire WebGL2 context".

- Local machine with a GPU: `--gl=angle` (or `Config.setChromiumOpenGlRenderer('angle')`).
- No GPU (CI, most Docker): `--gl=swangle` (software, slow).
- Node SSR / Lambda / Vercel: `chromiumOptions: {gl: 'angle'}` — the config file is ignored there.
- Studio render dialog: Advanced → OpenGL render backend.
- Lambda always uses `swangle` (it rewrites `angle` with a warning) → WebGL-heavy renders are CPU-bound there.
- Docs pages describing "angle by default" describe the unreleased v5 behavior.

## 4. Stacked, animated example

```tsx
import {Video} from '@remotion/media';
import {colorCorrection} from '@remotion/effects/color-correction';
import {noise} from '@remotion/effects/noise';
import {starburst} from '@remotion/effects/starburst';
import {vignette} from '@remotion/effects/vignette';
import {zoomBlur} from '@remotion/effects/zoom-blur';
import {AbsoluteFill, Easing, interpolate, Solid, useCurrentFrame, useVideoConfig} from 'remotion';

export const GradedClip: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Solid
        name="Background"
        width={width}
        height={height}
        color="black"
        effects={[
          starburst({rays: 18, colors: ['#0b84f3', '#1d3557'], rotation: interpolate(frame, [0, durationInFrames], [0, 90])}),
          vignette({amount: 0.7, radius: 0.5}),
        ]}
      />
      <Video
        name="Footage"
        src="https://remotion.media/video.mp4"
        effects={[
          colorCorrection({
            exposure: interpolate(frame, [0, 30], [-1, 0.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            contrast: 1.1,
            temperature: 0.15,
            vibrance: 0.25,
          }),
          zoomBlur({
            amount: interpolate(frame, [0, 20], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}),
            disabled: frame >= 20,
          }),
          noise({amount: 0.08, seed: frame}),
          vignette({amount: 0.5}),
        ]}
      />
    </AbsoluteFill>
  );
};
// v4 render: bunx remotion render GradedClip out/graded.mp4 --gl=angle
```

## 5. Effect catalog

`(req)` = required. UV coordinates are `[x, y]` in 0–1 from the top-left. All effects also take `disabled`.

### Color and tone

| Effect (subpath) | Params (defaults) |
| --- | --- |
| `brightness` (2D) | `amount` −1..1 (0) |
| `contrast` (2D) | `amount` (1) |
| `saturation` (2D) | `amount` (1; 0 = gray) |
| `grayscale` (2D) | `amount` 0..1 (1) |
| `hue` (2D) | `degrees` (0) |
| `invert` (2D) | `amount` 0..1 (1) |
| `tint` (2D) | `color` (req), `amount` (0.5) |
| `exposure` | `stops` −5..5 (0) |
| `levels` | `blackPoint` (0), `whitePoint` (1), `gamma` (1) |
| `shadows-highlights` → `shadowsHighlights` | `shadows`, `highlights` −1..1 (0) |
| `vibrance` | `amount` −1..1 (0) |
| `white-balance` → `whiteBalance` | `temperature`, `tint` −1..1 (0) |
| `color-correction` → `colorCorrection` | `exposure`, `contrast` (1), `pivot` (0.5), `shadows`, `highlights`, `whites`, `blacks`, `temperature`, `tint`, `saturation` (1), `vibrance` |
| `lut` | `content` (req: full 3D `.cube` text; no 1D LUTs) |
| `duotone` | `darkColor` (black), `lightColor` (white), `threshold` (0.5) |
| `thermal-vision` → `thermalVision` | `amount` (1), `palette` |
| `linear-gradient-tint` → `linearGradientTint` | `start`, `end`, `startColor`, `endColor`, `amount` (0.5) |
| `color-key` → `colorKey` | `keyColor` ('#00ff00'), `similarity` (0.18), `smoothness` (0.08), `spillSuppression` (0.25) — greenscreen |

### Blur and light

| Effect | Params (defaults) |
| --- | --- |
| `blur` | `radius` (req, px), `horizontal`, `vertical` (true) |
| `linear-progressive-blur` | `start`, `end`, `startBlur` (0), `endBlur` (50) |
| `radial-progressive-blur` | `center`, `width`, `height`, `rotation`, `start`, `startBlur`, `endBlur` |
| `region-blur` → `regionBlur` | `topLeft`, `bottomRight` (req UV), `blurRadius` (40), `feather`, `roundness` — blur faces, plates |
| `zoom-blur` → `zoomBlur` | `amount` (40), `center`, `samples` (24) |
| `drop-shadow` → `dropShadow` | `radius` (12), `offsetX`/`offsetY` (8), `opacity` (0.5), `color` |
| `glow` | `radius` (20), `intensity` (1), `threshold` (0), `color` |
| `light-trail` → `lightTrail` | `direction` (180), `distance` (80), `intensity`, `decay` (0.9), `threshold`, `samples`, `color` |
| `shine` | `progress` (0.5), `angle` (30), halo/core sigma and intensity — glossy sweep |
| `light-leak` → `lightLeak` | `progress` 0..1 (0.5; reveal then retract), `seed` (0), `hueShift` (0 orange, 120 green, 240 blue) |
| `vignette` | `amount` (0.5), `radius` (0.65), `feather` (0.35), `roundness` (1), `color`, `mode` (`'color'` \| `'alpha'`), `center` |

### Geometry and distortion

| Effect | Params (defaults) |
| --- | --- |
| `translate` → `xyTranslate` / `uvTranslate` (2D) | `x`, `y` px / `u`, `v` |
| `scale` (2D) | `scale` (req), `horizontal`, `vertical` |
| `tile` (2D) | `horizontal`, `vertical` |
| `mirror` | `direction`, `position` (0.5), `invert` |
| `skew` | `x` (20°), `y` (0), `origin` |
| `corner-pin` → `cornerPin` | four UV corners — screen replacement |
| `barrel-distortion` → `barrelDistortion` | `amount` (0.25) |
| `fisheye` | `fieldOfView` (2.5 rad), `center`, `radius`, `zoom` |
| `chromatic-aberration` → `chromaticAberration` | `amount` (8 px), `angle` |
| `wave` | `phase`, `direction`, `amplitude` (60), `wavelength` (240) |
| `noise-displacement` → `noiseDisplacement` | `center`, `radius` (req), `strength` (36), `seed`, … |
| `pattern` | `scale` (0.1), gaps, offsets — tiles a scaled copy |
| `tear` | `progress` (0.5), `angle`, `rotation`, `jaggedness` |

### Reveals (drive `progress` 0→1)

`evolve` (`direction`, `feather`), `venetian-blinds` (`direction`, `slats`), `pixel-dissolve` (`columns`, `rows`, `seed`, `feather`).

### Stylize and texture

`pixelate` (`blockSize` 20), `linear-progressive-pixelate`, `radial-progressive-pixelate`, `halftone` (`shape`, `dotSize`, `colorMode`, `dotColor`), `halftone-linear-gradient`, `dot-grid`, `scanlines` (`amount`, `spacing`, `offset` — animate to scroll), `noise` (`amount` 0.15, `seed` — animate for grain), `white-noise`, `tv-signal-off`, `speckle`, `roughen-edges`, `outline` (`width`, `color`, `outlineOnly`), `emboss`, `burlap`, `flannel`, `paper`, `shrinkwrap`.

### Generators (use on a `<Solid>`)

`linear-gradient` (replaces source), `starburst` (`rays` 2–100 req, `colors` ≥2 req, `rotation`, `smoothness`, `origin`; replaces source), `liquid-contours` (replaces source), `contour-lines`, `lines`, `waves`, `zigzag`, `rings` (animate `offset` to expand), `checkerboard`, `gridlines` (with `perspective` for retro floors). Pattern generators take `maskToSourceAlpha` to clip to the source shape.

## 6. Custom effects (`createEffect`)

```ts
import {createEffect, type InteractivitySchema} from 'remotion';

type PosterizeParams = {readonly levels?: number};
const resolve = (p: PosterizeParams) => ({levels: p.levels ?? 4});

const schema = {
  levels: {type: 'number', min: 2, max: 32, step: 1, default: 4, description: 'Levels'},
} as const satisfies InteractivitySchema;

export const posterizeColors = createEffect<PosterizeParams, null>({
  type: 'com.example.posterize-colors', // stable reverse-DNS id
  label: 'posterizeColors()',
  documentationLink: null,
  backend: '2d', // '2d' | 'webgl2' | 'webgpu'
  calculateKey: (p) => `posterize-${resolve(p).levels}`, // include every output-affecting param
  setup: () => null,
  apply: ({source, target, width, height, params}) => {
    const ctx = target.getContext('2d');
    if (!ctx) throw new Error('posterizeColors(): no 2D context');
    const {levels} = resolve(params);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    const img = ctx.getImageData(0, 0, width, height);
    const step = 255 / (levels - 1);
    for (let i = 0; i < img.data.length; i += 4) {
      for (let c = 0; c < 3; c++) img.data[i + c] = Math.round(img.data[i + c] / step) * step;
    }
    ctx.putImageData(img, 0, 0);
  },
  cleanup: () => undefined,
  schema, // `disabled` is added automatically
  validateParams: ({levels = 4}) => {
    if (!Number.isInteger(levels) || levels < 2) throw new TypeError('levels must be an integer >= 2');
  },
});
// usage: <Img src={staticFile('photo.jpg')} width={1920} height={1080} effects={[posterizeColors({levels: 5})]} />
```

Rules:

- Prefer `'2d'` (cheap tricks: `ctx.filter = 'sepia(1)'` before `drawImage`). Use WebGL2 only when needed.
- 2D: always clear and draw the source first (targets are reused); reset `filter`, `globalAlpha`, transforms, composite mode; preserve alpha.
- WebGL2: create the context on `target` in `setup()` with `{premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true}`; allocate programs/buffers/textures in `setup`, never in `apply`; call `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipSourceY)` before uploading the source; keep colors premultiplied; free resources in `cleanup` (also runs after context loss); pass time as a param derived from the frame, never `performance.now()`.
- Prefer a custom effect over `<HtmlInCanvas onPaint>` when it should be reusable, stackable, or Studio-editable.

## 7. `<HtmlInCanvas>` shaders

`<HtmlInCanvas width height effects={[fisheye({fieldOfView: 2.5})]}>…DOM…</HtmlInCanvas>` applies effects to any HTML. Custom drawing: `onInit` (create GL resources, return cleanup) + `onPaint({canvas, element, elementImage})` — 2D `ctx.drawElementImage(elementImage, 0, 0)`, WebGL `texElementSubImage2D`. Preview needs Chrome ≥149 with the flag; server renders work everywhere. Nesting needs Chrome ≥157 and does not work in server renders yet.

## 8. React Three Fiber (`@remotion/three`)

`bunx remotion add @remotion/three && bun add three @react-three/fiber && bun add -d @types/three`.

```tsx
import {ThreeCanvas} from '@remotion/three';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Cube: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 12}});
  return (
    <ThreeCanvas width={width} height={height} camera={{fov: 75, position: [0, 0, 470]}}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[200, 200, 300]} intensity={1.2} />
      <mesh rotation={[frame * 0.03, frame * 0.035, 0]} scale={interpolate(pop, [0, 1], [0.2, 1])}>
        <boxGeometry args={[100, 100, 100]} />
        <meshStandardMaterial color="#0b84f3" />
      </mesh>
    </ThreeCanvas>
  );
};
```

- `width`/`height` are required. Add explicit lights.
- Animate only from `useCurrentFrame()`. R3F `useFrame()` runs on wall-clock deltas and breaks renders. During render the frameloop is `'never'` and Remotion advances once per frame.
- `<Sequence>` inside the canvas needs `layout="none"`.
- Suspense loaders (`useGLTF`, `useTexture`) are awaited automatically.
- Video on a mesh: `<Video headless muted onVideoFrame={…} />` from `@remotion/media` draws into an `OffscreenCanvas` + `CanvasTexture`; in `onVideoFrame` call `advance(performance.now())` when rendering, `invalidate()` in preview. `useVideoTexture`/`useOffthreadVideoTexture` are deprecated.
- `<ThreeWebGPUCanvas>` (`@remotion/three/webgpu`, 4.0.503, experimental): needs three ≥0.167, R3F ≥9, React 19.
- Render with `--gl=angle` (GPU) or `swangle`.

## 9. Skia (`@remotion/skia`)

`bunx remotion add @remotion/skia && bun add @shopify/react-native-skia`. Config: `Config.overrideBundlerConfig((c, ctx) => enableSkia(c, ctx))` (from `@remotion/skia/enable`) + `--gl=angle`. Entry must `await LoadSkia()` (from `@shopify/react-native-skia/src/web`) before importing Root and calling `registerRoot`. Draw inside `<SkiaCanvas width height>`, animated from the frame. Scaffold: `--skia` template.

## 10. GL backend table

| `gl` | Use |
| --- | --- |
| `null` (v4 default) | No WebGL content |
| `angle` | Machine with a GPU (desktop). Long renders may leak memory → split. |
| `swangle` | No GPU (CI, Docker, Lambda forced) — slow |
| `angle-egl` | Linux cloud GPU (Docker GPU guide) |
| `vulkan` + `--chrome-mode=chrome-for-testing` | EC2 GPU guide |
| `egl`, `swiftshader` | Legacy |

Check with `bunx remotion gpu --gl=angle`.

## 11. Pitfalls

| Symptom | Fix |
| --- | --- |
| "Failed to acquire WebGL2 context" | `--gl=angle`/`swangle`; `chromiumOptions.gl` in Node/Lambda |
| Three.js canvas blank only in renders | Same; config file does not apply to Node APIs |
| "WebGL context was lost" / random blank layers | Fewer simultaneous WebGL hosts, unmount off-screen layers, lower concurrency, more Lambda memory |
| Very slow effects | Software GL; 2D CPU effects at 4K; many backend switches → GPU machine, `colorCorrection()`, group effects |
| Effect static over time | Drive params from `frame` |
| Generator wipes content | Put it on its own `<Solid>` layer |
| Glow/shadow clipped | Add transparent padding inside the host canvas |
| Studio cannot edit effect values | Inline literal array, stable shape, `disabled` instead of conditionals |
| Custom WebGL effect upside down | Honor `flipSourceY` |
| Halos in custom effect | Keep premultiplied alpha |
| 3D differs preview vs render | Remove `useFrame`; derive from the frame |
| `import {blur} from '@remotion/effects'` fails | Use the subpath |
