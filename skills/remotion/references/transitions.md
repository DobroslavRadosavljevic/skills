# Transitions (`@remotion/transitions`)

`<TransitionSeries>`, presentations, timings, overlays, duration math, custom presentations, and shader transitions. Snapshot: 4.0.532. Install: `bunx remotion add @remotion/transitions`.

## Contents

1. `<TransitionSeries>` parts
2. Duration math
3. Timings
4. Presentations
5. `useTransitionProgress`
6. Multi-scene recipe
7. Custom presentation
8. Custom shader presentation
9. Pitfalls

---

## 1. `<TransitionSeries>` parts

| Part | Props | Notes |
| --- | --- | --- |
| `<TransitionSeries>` | Sequence-like: `from`, `name`, `style`, `className`, `playbackRate`, `freeze`, `hidden` | Children: only the parts below. Do not use `layout="none"` (deprecated, throws in v5). |
| `<TransitionSeries.Sequence>` | `durationInFrames` (required), `name`, `premountFor`, `postmountFor`, `trimBefore`, `playbackRate`, `freeze`, `hidden`, `style`, `className`, `offset` | No `from`, no `loop` (nest a looping `<Sequence>` inside). |
| `<TransitionSeries.Transition>` | `timing` (required), `presentation` (default `slide()`) | Both scenes render during it; shortens the total. May be first (enter) or last (exit). |
| `<TransitionSeries.Overlay>` (4.0.415) | `durationInFrames`, `offset`, premount props, `hidden` | Content over the cut (centered on it). Does not shorten the total. Use for light leaks, flashes, whooshes. |

Enforced rules (throw): a transition may not be longer than either neighbour; no two adjacent transitions; no two adjacent overlays; no transition next to an overlay; a transition or overlay needs a sequence next to it.

## 2. Duration math

```
total = Σ sequence durations − Σ transition durations    (overlays add 0)
```

Example: scenes 90 + 120 + 150 with transitions of 20 and 23 frames → 360 − 43 = 317. Compute the composition duration with the same timing objects (`timing.getDurationInFrames({fps})`), either in `calculateMetadata` or a literal. Otherwise the video cuts off or ends with a blank tail.

Inside each scene, `useCurrentFrame()` starts at 0 when the scene starts — which for the entering scene is the transition start. Delay intro animations of an entering scene by roughly the transition length if they must be seen.

## 3. Timings

```ts
import {linearTiming, springTiming} from '@remotion/transitions';

linearTiming({durationInFrames: 20, easing?: Easing.bezier(0.65, 0, 0.35, 1)});
springTiming({config: {damping: 200}, durationInFrames?: 25, durationRestThreshold: 0.001, reverse?: false});
```

- `springTiming` without `durationInFrames` lasts `measureSpring(...)` frames, which depends on fps. Use `durationRestThreshold: 0.001` — the default 0.005 can pop at the end.
- Custom timing: `{getDurationInFrames({fps}), getProgress({frame, fps})}` — deterministic, duration matching the curve.

## 4. Presentations

Import from subpaths: `import {fade} from '@remotion/transitions/fade'`.

CSS presentations (work in every browser, Player, and the web renderer except `flip`):

| Presentation | Props (defaults) |
| --- | --- |
| `fade()` | `shouldFadeOutExitingScene` (false), `enterStyle`, `exitStyle`. Fades the entering scene in over the exiting one → the entering scene needs an opaque background. |
| `slide({direction})` | `'from-left'` (default) \| `'from-right'` \| `'from-top'` \| `'from-bottom'` |
| `wipe({direction})` | 8 directions incl. diagonals |
| `flip({direction, perspective})` | 3D CSS (perspective 1000); not in client-side rendering |
| `clockWipe({width, height})` | Dimensions required (`useVideoConfig()`) |
| `iris({width, height})` | Dimensions required |
| `pushCut({...})` (4.0.500) | Zoom-push cut with a short flash; tunable scales and flash color |
| `none()` | No layer motion; animate inside scenes with `useTransitionProgress()` |

HTML-in-canvas shader presentations (WebGL; preview needs Chrome with `chrome://flags/#canvas-draw-element`; fail in Firefox/Safari preview; server renders work): `blurSlide`, `bookFlip`, `crossZoom`, `crosswarp`, `dissolve`, `dreamyZoom`, `filmBurn`, `linearBlur`, `ripple`, `swap`, `zoomBlur`, `zoomInOut`. Avoid them when the result must play in a `<Player>` on arbitrary browsers. They need a WebGL backend in renders (`--gl=angle`/`swangle`).

`cube()` is a paid separate package (`@remotion-dev/cube-presentation`).

## 5. `useTransitionProgress()`

Returns `{entering, exiting, isInTransitionSeries}`. In the entering scene `entering` goes 0→1; in the exiting scene `exiting` goes 0→1. Combine with `none()` to stagger elements out/in inside scenes instead of moving whole layers.

## 6. Multi-scene recipe

```tsx
import {linearTiming, springTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {Audio} from '@remotion/media';
import {whoosh} from '@remotion/sfx';

export const Launch: React.FC = () => (
  <TransitionSeries name="Launch">
    <TransitionSeries.Sequence name="Hook" durationInFrames={90} premountFor={30}>
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 20})} />
    <TransitionSeries.Sequence name="Feature" durationInFrames={120} premountFor={30}>
      <Feature />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({direction: 'from-right'})}
      timing={springTiming({config: {damping: 200}, durationInFrames: 23})}
    />
    <TransitionSeries.Sequence name="CTA" durationInFrames={150} premountFor={30}>
      <Cta />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
// Composition durationInFrames = 90 + 120 + 150 - 20 - 23 = 317
```

Light leak over a cut without changing the timeline:

```tsx
import {lightLeak} from '@remotion/effects/light-leak';
import {interpolate, Solid, useCurrentFrame, useVideoConfig} from 'remotion';

const LeakOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig(); // overlay-local
  return (
    <Solid
      width={width}
      height={height}
      effects={[lightLeak({progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})]}
    />
  );
};
// <TransitionSeries.Overlay durationInFrames={24}><LeakOverlay /></TransitionSeries.Overlay>  (needs --gl=angle in v4 renders)
```

Sound on transitions: add an `<Audio>` (for example `whoosh`) inside the overlay or a few frames before the cut in the parent.

## 7. Custom presentation

```tsx
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill} from 'remotion';

type ZoomProps = {maxScale: number};

const ZoomPresentation: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = presentationProgress; // 0 → 1 for both scenes
  const style: React.CSSProperties =
    presentationDirection === 'entering'
      ? {opacity: p, scale: String(passedProps.maxScale - (passedProps.maxScale - 1) * p)}
      : {opacity: 1 - p};
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const zoom = (props: ZoomProps): TransitionPresentation<ZoomProps> => ({component: ZoomPresentation, props});
```

The component wraps each scene once (`presentationDirection` = `'entering'` or `'exiting'`) and must always render `children`. Pass width/height as props if you need them.

## 8. Custom shader presentation

`makeHtmlInCanvasPresentation(shader)` turns a WebGL2 draw function into a presentation. The shader receives `{prevImage, nextImage, width, height, time, passedProps}`. **`time` is 1 at the transition start and 0 at the end** (one docs page says the opposite). Porting from gl-transitions: `getFromColor` → prev texture, `getToColor` → next texture, `progress = 1.0 - u_time`. Provide `clear` and `cleanup`.

## 9. Pitfalls

| Symptom | Fix |
| --- | --- |
| Video ends early or has a blank tail | Recompute total = Σ scenes − Σ transitions |
| "must not be shorter than … transition" | Shorten the transition or lengthen the scene |
| Spring transition pops at the end | `durationRestThreshold: 0.001` |
| Background shows through during `fade()` | Opaque entering scene |
| Shader transition blank in preview | Enable the Chrome HTML-in-canvas flag or use a CSS presentation |
| Shader transition plays backwards | Use `1.0 - time` |
| `loop` on a `TransitionSeries.Sequence` throws | Nest a looping `<Sequence>` |
| Intro animation of next scene is hidden | It played during the transition; delay it |
