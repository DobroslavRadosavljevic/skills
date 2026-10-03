# Visual Helper Libraries

Shapes, paths, noise, motion blur, cursors, GIF, Lottie, Rive, GSAP, animated emoji, and 3D SVG extrusion. Snapshot: 4.0.532. Install Remotion packages with `bunx remotion add @remotion/<pkg>` (third-party peers with `bun add`).

## Contents

1. Package map
2. `@remotion/shapes`
3. `@remotion/paths`
4. `@remotion/noise`
5. `@remotion/motion-blur`
6. `@remotion/mac-cursors`
7. `@remotion/gif` and `<AnimatedImage>`
8. `@remotion/lottie`
9. `@remotion/rive`
10. `@remotion/gsap`
11. `@remotion/animated-emoji`
12. Other packages
13. Pitfalls

---

## 1. Package map

| Need | Package |
| --- | --- |
| Geometric shapes (rect, star, arrow, callout, pie, heart…) | `@remotion/shapes` |
| SVG path drawing, morphing, measuring | `@remotion/paths` |
| Organic movement, particles, grain | `@remotion/noise` |
| Motion blur | `@remotion/motion-blur` |
| Product demo cursors | `@remotion/mac-cursors` |
| GIFs | `@remotion/gif` (or core `<AnimatedImage>`) |
| After Effects / LottieFiles | `@remotion/lottie` + `lottie-web` |
| Rive state machines | `@remotion/rive` |
| GSAP timelines | `@remotion/gsap` + `gsap` |
| Hand-drawn highlights, text boxes, fonts, Tailwind | see the fonts reference |
| Shader effects, light leaks, 3D | see the effects reference |
| Transitions | see the transitions reference |

## 2. `@remotion/shapes`

Components `Rect, Circle, Ellipse, Triangle, Star, Polygon, Pie, Heart, Arrow, Callout, Spark` and matching `make*()` functions returning `{path, width, height, transformOrigin, instructions}`.

```tsx
import {Star, makeStar} from '@remotion/shapes';

<Star points={5} innerRadius={60} outerRadius={140} cornerRadius={8} fill="#ffd60a" name="Star" from={15} premountFor={30} />;
const {path} = makeStar({points: 5, innerRadius: 60, outerRadius: 140}); // for clip paths, morphing, measuring
```

- SVG path props (`fill`, `stroke`, `strokeWidth`, `strokeDasharray`…) go to the `<path>`; `style` to the `<svg>`; `pathStyle` to the path (rotate around center: `pathStyle={{transform: 'rotate(45deg)'}}`).
- Shapes are sequences: they accept timing and premount props, and are invisible before `from`.
- `effects` + `pixelDensity` (4.0.474) paint the shape to a canvas (uses HTML-in-canvas → preview needs the Chrome flag).
- `Pie` with animated `progress` makes progress rings and pie reveals.

## 3. `@remotion/paths`

Pure functions (work in Node too).

| Function | Use |
| --- | --- |
| `evolvePath(progress, d)` → `{strokeDasharray, strokeDashoffset}` | Draw a stroke on. Clamp progress (>1 starts erasing). |
| `getLength(d)`, `getPointAtLength(d, l)`, `getTangentAtLength(d, l)` | Move objects along paths. Point/tangent return `null` past the end — clamp `l` or use `?? fallback`. |
| `interpolatePaths(frame, inputRange, paths, options)` (4.0.529) | Multi-keyframe morphing; Studio-editable with `<Interactive.Path>`. |
| `interpolatePath(t, a, b)` | Two-path morph. |
| `cutPath(d, length)` | Partial path. |
| `getBoundingBox`, `translatePath`, `scalePath` (origin top-left), `centerPath`, `resetPath`, `reversePath`, `normalizePath`, `warpPath`, `getSubpaths`, `parsePath`, `serializeInstructions`, `reduceInstructions`, `extendViewBox` | Transform and inspect paths. |

```tsx
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

const d = 'M 100 500 C 400 100 800 900 1100 400';
const length = getLength(d);

export const DrawRoute: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const {strokeDasharray, strokeDashoffset} = evolvePath(p, d);
  const dot = getPointAtLength(d, Math.min(p * length, length)) ?? {x: 0, y: 0};
  return (
    <svg viewBox="0 0 1280 720" style={{width: '100%', height: '100%'}}>
      <path d={d} fill="none" stroke="#0b84f3" strokeWidth={12} strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      <circle cx={dot.x} cy={dot.y} r={16} fill="#0b84f3" />
    </svg>
  );
};
```

## 4. `@remotion/noise`

`noise2D(seed, x, y)`, `noise3D(seed, x, y, z)`, `noise4D(seed, x, y, z, w)` → −1…1, deterministic per seed. Pattern: space in x/y, time in z (`frame * 0.02`), different seed per channel, map with `interpolate(n, [-1, 1], [min, max])`. Small per-frame steps give smooth drift.

```tsx
const x = interpolate(noise3D('x', i / 10, 0, frame * 0.01), [-1, 1], [-40, 40]);
```

## 5. `@remotion/motion-blur`

| Component | Use |
| --- | --- |
| `<HtmlInCanvasMotionBlur width height samples={8} shutterAngle={180}>` (4.0.529) | Recommended true motion blur. Preview needs the Chrome HTML-in-canvas flag; renders work. |
| `<CameraMotionBlur samples={6} shutterAngle={180}>` | Older; layers copies, can wash out colors; children must be absolutely positioned. |
| `<Trail layers lagInFrames trailOpacity>` | Ghost trail effect. |

The animated content must call `useCurrentFrame()` in a **child** component inside the blur wrapper — each sample renders the child at a sub-frame time.

## 6. `@remotion/mac-cursors` (4.0.513)

`<MacOSCursor cursor="default" | "pointer" | "text" | … style={{left, top, scale}} />` — the hotspot sits at the component origin. Animate position with `interpolate`/`spring` and add click feedback (scale dip + `mouseClick` from `@remotion/sfx`). Accepts timing and premount props.

## 7. `@remotion/gif` and `<AnimatedImage>`

- `<Gif src width height fit loopBehavior playbackRate effects />` — frame-synced GIF, works in Safari, `onLoad` gives frames/delays. `getGifDurationInSeconds(src)` for sizing; `preloadGif(src)` for Player.
- Core `<AnimatedImage>` also handles APNG/WebP/AVIF (Chrome/Firefox).
- Remote files need CORS.

## 8. `@remotion/lottie`

```tsx
import {Lottie, type LottieAnimationData} from '@remotion/lottie';
import {useEffect, useState} from 'react';
import {staticFile, useDelayRender} from 'remotion';

export const Confetti: React.FC = () => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender('Loading Lottie JSON'));
  const [data, setData] = useState<LottieAnimationData | null>(null);
  useEffect(() => {
    fetch(staticFile('confetti.json'))
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle, continueRender, cancelRender]);
  return data ? <Lottie animationData={data} style={{width: '100%', height: '100%'}} /> : null;
};
```

- `animationData` must be an object with stable identity (keep it in state or memoize).
- Frames map by index, not time: a 60 fps Lottie in a 30 fps composition plays at half speed. Match the composition fps to `getLottieMetadata(data).fps` or set `playbackRate = lottieFps / fps`.
- `getLottieMetadata()` → `{fps, durationInFrames, durationInSeconds, width, height}` for `calculateMetadata`.
- Props: `loop`, `direction`, `playbackRate`, `renderer` (`svg` default, `canvas`, `html`), `assetsPath`, timing and premount props.
- After Effects: export with Bodymovin to JSON in `public/`.

## 9. `@remotion/rive`

`<RemotionRiveCanvas src fit="contain" alignment="center" artboard animation onLoad effects />` + timing props. Change text runs in a memoized `onLoad(file)`: `file.defaultArtboard().textRun('title').text = 'Tokyo'`.

## 10. `@remotion/gsap` (4.0.517)

```tsx
import {useGsapTimeline} from '@remotion/gsap';
import {AbsoluteFill} from 'remotion';

export const Intro: React.FC<{dx: number}> = ({dx}) => {
  const scope = useGsapTimeline<HTMLDivElement>(
    ({timeline, selector}) => {
      timeline
        .from(selector('[data-title]'), {y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'})
        .to(selector('[data-box]'), {x: dx, rotation: 360, duration: 2, ease: 'none'}, '-=0.2')
        .from(selector('[data-item]'), {opacity: 0, y: 20, stagger: 0.1, duration: 0.4});
    },
    {dependencies: [dx]},
  );
  return (
    <AbsoluteFill ref={scope}>
      <h1 data-title>Hello</h1>
      <div data-box style={{width: 80, height: 80, background: '#b8ff5a'}} />
      {[1, 2, 3].map((i) => (
        <p key={i} data-item>{i}</p>
      ))}
    </AbsoluteFill>
  );
};
```

The hook owns a paused timeline and seeks it to `frame / fps` seconds each frame. It throws on playback calls (`play`, `seek`, `reverse`…), callbacks, async builders, plain-object targets, unseeded randomness, and stray `gsap.to()` outside the timeline. GSAP durations are seconds; make the composition at least `timeline.duration() * fps` frames.

## 11. `@remotion/animated-emoji`

`<AnimatedEmoji emoji="fire" scale="1" />` — assets are not bundled: copy the videos from `remotion-dev/animated-emoji` into `public/`. Uses `<OffthreadVideo>` (not client-side renderable). `scale` is a string (`'0.5' | '1' | '2'`). `getAvailableEmojis()` lists names.

## 12. Other packages

- `@remotion/svg-3d-engine` (internal, undocumented): extrude SVG paths into 3D faces (`extrudeElement`, matrix helpers). API may change.
- `@remotion/maptiler` (internal, undocumented): MapTiler components. Prefer the documented MapLibre recipe (maps reference).
- `@remotion/light-leaks`, `@remotion/starburst`: deprecated — use `lightLeak()` / `starburst()` from `@remotion/effects` on a `<Solid>`.
- Third-party animation libraries: drive everything from the frame. CSS animations can be frozen with `animation-play-state: paused` + negative `animation-delay` computed from the frame; physics engines must be simulated deterministically ("baked") per frame; Framer Motion has no integration.

## 13. Pitfalls

| Symptom | Fix |
| --- | --- |
| Path erases at the end | Clamp progress (spring overshoot) |
| `getPointAtLength` returns `null` | Clamp length to `getLength(d)` |
| `scalePath` moves the shape | Origin is top-left: translate → scale → translate back, or `centerPath` |
| Motion blur has no effect | Call `useCurrentFrame()` in a child inside the wrapper |
| Lottie too slow/fast | Match fps or set `playbackRate` |
| Lottie restarts every render | Stable `animationData` identity |
| GSAP throws "not allowed" | Keep tweens on the provided timeline, target elements, no callbacks/random |
| Shape invisible early | It is a sequence — check `from` |
| `Circle` name clash | Alias the rough-notation import |
| AnimatedEmoji 404 | Copy assets into `public/` |
