# Timeline and Animation

Frame model, hooks, timing props, `<Sequence>` / `<Series>` / `<Loop>` / `<Freeze>`, premounting, `interpolate`, `spring`, `Easing`, `random`. Snapshot: `remotion@4.0.532`.

## Contents

1. The frame model
2. Hooks
3. Timing props (shared contract)
4. Timeline components
5. Premounting and postmounting
6. `interpolate` and `interpolateColors`
7. `spring`, `measureSpring`, `Easing`
8. `random`
9. Recipes

---

## 1. The frame model

A video is a pure function `(frame, props) → pixels`. The renderer opens many browser tabs, renders frames out of order, may render a frame twice, and takes a screenshot of each one. Tabs share no state. Everything below follows from that.

- Frames start at `0`. The last frame is `durationInFrames - 1`.
- Every moving value must derive from `useCurrentFrame()` (plus props and `useVideoConfig()`).
- Wall-clock motion does not render: CSS `transition`, CSS `animation`/`@keyframes`, Tailwind `animate-*`/`transition-*`, `setTimeout`/`setInterval`/`requestAnimationFrame` loops, Motion/Framer Motion animations, GSAP timelines played in real time, R3F `useFrame`, Lottie autoplay. They flicker or freeze in output. Drive libraries from the frame instead (`@remotion/gsap`, `@remotion/lottie`, `@remotion/three`).
- Write times as `n * fps` from `useVideoConfig()`, so the video stays correct if fps changes. Pass `fps` to `spring()`.
- Later siblings paint on top. Prefer DOM order over `z-index` (the browser renderer ignores `z-index`).
- A component must render the same output for the same frame, independent of render order, and must not animate while paused.

## 2. Hooks (`remotion`)

### `useCurrentFrame(): number`

- Returns the frame relative to the nearest timed parent: `trimBefore + (absoluteFrame - from) * playbackRate`, cumulative through nested parents. With `loop`: `trimBefore + ((frame - from) * playbackRate) % durationInFrames`.
- Returns a fraction when any ancestor has `playbackRate !== 1`. `Math.floor()` it before using it as an array index or image-sequence number.
- To read the absolute frame inside a nested child, read it in the top component and pass it down.
- Throws outside a composition or Player.

### `useVideoConfig()`

Returns `{width, height, fps, durationInFrames, id, defaultProps, props, defaultCodec, defaultOutName, defaultVideoImageFormat, defaultPixelFormat, defaultProResProfile, defaultSampleRate}`.

- `width`/`height` come from the nearest `<Sequence width height>` if set.
- Inside a sequence, `durationInFrames` is the end of that sequence in its local frame space (accounts for `trimBefore` and `playbackRate`).
- "No video config found" means: hook outside Remotion, misuse inside Player, or two copies of `remotion` installed (version mismatch).

### Other hooks

| Hook | Since | Purpose |
| --- | --- | --- |
| `useCurrentScale({dontThrowIfOutsideOfRemotion?})` | 4.0.125 | Studio zoom / Player fit scale. Divide `getBoundingClientRect()` values by it. |
| `usePixelDensity()` | 4.0.472 | `devicePixelRatio` in preview, `scale` option in render. Pass to `pixelDensity` on `<Solid>` / `<HtmlInCanvas>`. |
| `useRemotionEnvironment()` | 4.0.342 | `{isStudio, isRendering, isPlayer, isReadOnlyStudio, isClientSideRendering}`. Prefer over global `getRemotionEnvironment()`. |
| `useBufferState()` | 4.0.111 | `delayPlayback()` → `{unblock()}`. Pauses preview playback while loading. Call in `useEffect`, unblock in cleanup. No effect on rendering. |
| `useDelayRender()` | 4.0.342 | Scoped `delayRender`/`continueRender`/`cancelRender`. See the assets reference. |
| `Loop.useLoop()` | 4.0.142 | `{durationInFrames, iteration} \| null` inside `<Loop>`. |

## 3. Timing props (shared contract)

Supported on `<Sequence>`, `<Series.Sequence>` (no `from`/`loop`), `<AbsoluteFill>` (4.0.501), `Interactive.*` (4.0.475), `<Img>` (4.0.465), `<CanvasImage>`, `<AnimatedImage>`, `<Solid>`, `<HtmlInCanvas>`, `@remotion/media` `<Video>`/`<Audio>` (4.0.446), `<Gif>`, `<Lottie>`, `<ThreeCanvas>`, Rive canvas, `@remotion/shapes`, `@remotion/rough-notation`, `<MacOSCursor>`, and components made with `Interactive.withSchema({wrapInSequence: true})`.

| Prop | Default | Meaning |
| --- | --- | --- |
| `from` | `0` | Where the item starts in the parent timeline. May be negative. |
| `trimBefore` | `0` | First child frame to show (skips the start of the child's own timeline). |
| `durationInFrames` | `Infinity` | How many child frames to show, counted from `trimBefore`. |
| `playbackRate` | `1` | Constant speed. Item occupies `durationInFrames / playbackRate` parent frames. Animating it throws. |
| `loop` | `false` | Repeat the range until the parent ends. Needs a finite duration (media, Gif, AnimatedImage, Lottie use their intrinsic length). |
| `freeze` | `null` | Hold one child frame (like `<Freeze>` without remounting). |
| `hidden` | `false` | Hide (Studio eye toggle writes this). |
| `name` | — | Label in the Studio timeline. |
| `showInTimeline` | `true` | Hide noisy items from the timeline. |

Order of operations: `from` → `trimBefore` → `durationInFrames` → `playbackRate` → `loop`. Since 4.0.530, `durationInFrames` applies before `playbackRate` (small breaking change).

Prefer timing props directly on the component (`<LowerThird from={30} durationInFrames={90} />`) over a wrapping `<Sequence>`. Keep `<Sequence>` for: a shared clock across siblings, a dimension override, or children that do not accept timing props. Remember: inside the component, `useCurrentFrame()` is local; styles computed at the call site use the caller's frame.

## 4. Timeline components

### `<Sequence>`

Still fully supported, though the docs now call direct use "legacy" in favor of timing props on components.

Extra props beyond timing props: `layout` (`'absolute-fill'` default | `'none'`), `style`, `className`, `ref` (HTMLDivElement), `width`/`height` (override `useVideoConfig()` for children), crop props `cropLeft/Right/Top/Bottom` (0–1, animatable, `absolute-fill` only, 4.0.500), `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted`.

- Default layout wraps children in an `<AbsoluteFill>`. Children unmount outside the range. Nested sequences add their `from` values.
- `layout="none"`: no wrapper div. Then `style`, `className`, `ref`, premount/postmount, and crop are not allowed (they throw). Use `layout="none"` inside `<ThreeCanvas>` (no DOM divs in R3F).
- Never combine crop props with `clipPath`.

### `<Series>` / `<Series.Sequence>`

- Plays children back to back. Only `<Series.Sequence>` children are allowed (fragments are flattened).
- `<Series.Sequence>` props: `durationInFrames` (required except the last, which may be `Infinity`), `offset` (integer; positive = gap, negative = overlap; shifts all later items), `trimBefore`, `playbackRate`, `freeze`, `layout`, `style`, `className`, `name`, `showInTimeline`, `premountFor`, `ref`. No `from`, no `loop` (nest a looping `<Sequence>` inside).
- `<Series>` itself is a `<Sequence layout="none">` (4.0.443) and accepts sequence props, for example `playbackRate` for the whole series.
- Total duration = sum of durations (+ positive offsets, − overlaps).

### `<Loop durationInFrames times? layout? style? name?>`

Repeats children every `durationInFrames` parent frames, `times` defaults to `Infinity`. Use the `loop` timing prop when you want to loop a trimmed range of the child's own timeline instead.

### `<Freeze frame active?>`

Children see `frame` as the current frame; videos pause and audio mutes. `active` may be a boolean or `(f) => boolean`. For new code prefer `freeze={n}` on the component.

### `<AbsoluteFill>`

`position: absolute; inset: 0; display: flex; flex-direction: column`. Accepts all div props, `ref`, timing props (4.0.501), and premount props (4.0.528). Tailwind classes that conflict (for example `flex-row`) override the inline default.

### `Interactive.*`

HTML and SVG elements (`Interactive.Div`, `.H1`–`.H6`, `.P`, `.Span`, `.Img`-like, `.Svg`, `.Path`, `.Circle`, `.Rect`, …) that the Studio can select and edit. They accept timing props and keep normal document flow (no absolute wrapper). See the Studio reference for the editability rules.

## 5. Premounting and postmounting

- `premountFor={n}` mounts an item `n` frames early, hidden (`opacity: 0` / `display: none`) and frozen at its first frame, so fonts, images, and media decode before it appears. `postmountFor` keeps it mounted after the end (for frequent backward seeking).
- Only matters in Player and Studio. Rendering ignores it.
- Put `premountFor={fps}` on every timed component that supports it: media, `<Sequence>`, `<Series.Sequence>`, `<TransitionSeries.Sequence>`, `<TransitionSeries.Overlay>`, interactive components, images. Even items at frame 0 (it keeps working if the item moves). A child can only premount if its parent is mounted, so premount the outer scene too.
- Planned v5: sequences premount `fps` frames by default; opt out with `premountFor={0}`.

## 6. `interpolate` and `interpolateColors`

### `interpolate(input, inputRange, outputRange, options?)`

- `inputRange` must be strictly increasing and the same length as `outputRange`. Guard short durations: `[0, 20, d - 20, d]` needs `d ≥ 41`.
- **Default extrapolation is `'extend'`** — values keep going past the last keyframe. Almost always add `{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}`. Other modes: `'wrap'`, `'identity'`.
- Output kinds (all keyframes must be the same kind): numbers; numeric tuples (4.0.473); CSS strings for `translate` (`'0px 40px'`), `rotate` (`'20deg'`, rad, grad, turn), `scale` (`'1'`, `'1 2'`), `transform-origin` (4.0.472+); discrete strings (4.0.509) and booleans (4.0.530) — these need `Easing.step1` on every segment; font weights with `outputType: 'font-weight'`.
- `easing`: one function, or an array with one easing per segment (4.0.462).
- `output: 'perceptual-scale'` (4.0.490): use for every scale animation. Linear scale looks like it slows down as it grows.
- `posterize: n` (4.0.470): quantize time to steps of `n` frames for a deliberate low-fps or stop-motion look.
- `outputType` (4.0.526): `'font-weight' | 'scale' | 'translate' | 'rotate' | 'transform-origin'`.
- Pure function; usable outside Remotion.

### `interpolateColors(input, inputRange, colors, options?)`

Returns `rgba(...)`. Accepts named, hex, rgb(a), hsl(a), and (4.0.439) `oklch`, `oklab`, `lab`, `lch`, `hwb`. Options: `easing` (single or per segment), `posterize`.

## 7. `spring`, `measureSpring`, `Easing`

### `spring({frame, fps, config?, from = 0, to = 1, durationInFrames?, durationRestThreshold?, delay = 0, reverse = false})`

- `config` defaults `{mass: 1, damping: 10, stiffness: 100, overshootClamping: false}` — this bounces. `{damping: 200}` is smooth with no overshoot.
- `durationInFrames` stretches the curve to exactly that length. `delay` holds `from` until the delay passes. `reverse` plays backwards. Order: stretch → reverse → delay.
- Map to real values with `interpolate(s, [0, 1], [a, b])`.

### `measureSpring({fps, config?, threshold = 0.005})`

Frames until the spring settles. Use it to size sequences around a spring.

### `Easing`

`linear, ease, quad, cubic, poly(n), sin, circle, exp, elastic(b), back(s), bounce, bezier(x1, y1, x2, y2), in(e), out(e), inOut(e), step0, step1, spring({damping, mass, stiffness, overshootClamping, durationRestThreshold, allowTail})`.

- `Easing.spring(...)` (4.0.476) is a spring normalized to an interpolation segment — no `frame`/`fps` needed. `allowTail: true` lets it run past the segment end.
- Prefer `Easing.bezier(...)` (same numbers as CSS `cubic-bezier`) and `Easing.spring({damping: 200})` over hand-composed easing chains. A good default entrance curve is `Easing.bezier(0.16, 1, 0.3, 1)`; for camera travel use `Easing.bezier(0.645, 0.045, 0.355, 1)`.

## 8. `random(seed)`

`random(seed: number | string | null): number` in `[0, 1)`, deterministic per seed. Never use `Math.random()` (each tab would get different values). `random(null)` opts into true randomness on purpose. Derive per-item seeds: `random(`particle-${i}-x`)`.

## 9. Recipes

Entrance with spring + fade:

```tsx
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Title: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200}, durationInFrames: Math.round(0.8 * fps)});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <h1
        style={{
          fontSize: 140,
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
          scale: interpolate(enter, [0, 1], [0.9, 1], {output: 'perceptual-scale'}),
        }}
      >
        {text}
      </h1>
    </AbsoluteFill>
  );
};
```

Enter and exit in one value:

```tsx
const {fps, durationInFrames} = useVideoConfig();
const enter = spring({frame, fps, config: {damping: 200}});
const exit = spring({frame, fps, config: {damping: 200}, durationInFrames: 20, delay: durationInFrames - 20});
const progress = enter - exit; // 0 → 1 → 0
```

Scenes back to back:

```tsx
import {Series, useVideoConfig} from 'remotion';

export const Main: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <Series>
      <Series.Sequence name="Intro" durationInFrames={3 * fps} premountFor={fps}>
        <Intro />
      </Series.Sequence>
      <Series.Sequence name="Demo" durationInFrames={5 * fps} offset={-10} premountFor={fps}>
        <Demo />
      </Series.Sequence>
      <Series.Sequence name="Outro" durationInFrames={2 * fps} premountFor={fps}>
        <Outro />
      </Series.Sequence>
    </Series>
  );
};
```

Staggered list (deterministic):

```tsx
{items.map((item, i) => {
  const s = spring({frame, fps, delay: i * 4, config: {damping: 200}});
  return (
    <div key={item.id} style={{opacity: s, translate: `0px ${interpolate(s, [0, 1], [24, 0])}px`}}>
      {item.label}
    </div>
  );
})}
```

Counter that ticks up:

```tsx
const value = Math.round(
  interpolate(frame, [0, 2 * fps], [0, target], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}),
);
```

Typewriter: slice by frame, not by timers: `text.slice(0, Math.floor(interpolate(frame, [0, 2 * fps], [0, text.length], {extrapolateRight: 'clamp'})))`.

Transform notes:

- Prefer the individual CSS properties `translate`, `scale`, `rotate`, `opacity` over `transform` strings. They are independent and Studio can edit them.
- Use `transform` only for `skew()`, `perspective()`, or order-sensitive chains (`makeTransform()` from `@remotion/animation-utils` builds them).
- SVG rotation around its own center: add `transformBox: 'fill-box', transformOrigin: 'center'`.
- Subpixel text jitter in slow moves: add `willChange: 'transform'` (or `transform: 'perspective(100px)'`).
