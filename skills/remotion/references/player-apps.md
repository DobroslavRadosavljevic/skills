# Player and Apps Built on Remotion

`@remotion/player` (`<Player>`, `<Thumbnail>`, `PlayerRef`, events), app architecture (same component for preview and render), framework integrations, templates, and editor products. Snapshot: 4.0.532.

## Contents

1. `<Player>` props
2. `PlayerRef` methods and events
3. `<Thumbnail>`
4. Canonical app architecture
5. Performance and re-render rules
6. Custom controls and interactivity
7. Autoplay, buffering, premounting
8. Framework integrations
9. Templates
10. Editor products and authoring primitives
11. Pitfalls

---

## 1. `<Player>` props

Install `bunx remotion add @remotion/player`. In Next.js App Router, the file that imports `Player` needs `'use client'` (importing it in a Server Component throws "Remotion requires React.createContext").

Required: `component` (or `lazyComponent` → module with a default export, wrapped in `useCallback`), `durationInFrames` (integer), `fps`, `compositionWidth`, `compositionHeight`, `inputProps` (when the component has props). `defaultProps` is rejected — use `inputProps`. Never pass a `<Composition>` or your Root.

| Prop | Default | Notes |
| --- | --- | --- |
| `controls` | `false` | Seek bar, play/pause, volume, fullscreen. |
| `loop`, `autoPlay` | `false` | Avoid `autoPlay` with audio (policies); combine with `initiallyMuted`. |
| `initiallyMuted` | `false` | Guarantees autoplay. |
| `clickToPlay` | = `controls` | |
| `doubleClickToFullscreen`, `allowFullscreen`, `spaceKeyToPlayOrPause` | `false`, `true`, `true` | |
| `showVolumeControls`, `showPlaybackRateControl` | `true`, `false` | |
| `playbackRate` | `1` | −10…10, not 0. Media cannot play in reverse. |
| `inFrame` / `outFrame` | `null` | Restrict playback range. |
| `initialFrame` | `0` | Mount-only. |
| `moveToBeginningWhenEnded` | `true` | |
| `renderLoading`, `renderPoster` + `showPosterWhenUnplayed/Paused/Ended/Buffering` | — | Wrap render functions in `useCallback`. `posterFillMode`. |
| `renderPlayPauseButton`, `renderFullscreenButton`, `renderMuteButton`, `renderVolumeSlider`, `renderCustomControls` | — | Customize built-in controls. |
| `alwaysShowControls`, `hideControlsWhenPointerDoesntMove`, `initiallyShowControls` | `false`, `true` (3 s), `true` | |
| `errorFallback` | `'⚠️'` | Render errors only; remount with a new `key`. |
| `overflowVisible` | `false` | Allow selection handles outside the canvas. |
| `bufferStateDelayInMilliseconds` | `300` | Delay before buffering UI. |
| `numberOfSharedAudioTags` | `5` (v4), `0` (v5) | Mount-only; only matters for `<Html5Audio>`. |
| `sampleRate` | `48000` | Mount-only. |
| `initialVolume`, `volumePersistenceKey` | — | |
| `browserMediaControlsBehavior` | `{mode: 'prevent-media-session'}` | Only one Player per page should use `'register-media-session'`. |
| `acknowledgeRemotionLicense` | — | Silences the license console message. |
| `logLevel` | `'info'` | `'trace'` for playback debugging. |
| `style`, `className` | — | Size with inline `style` (Tailwind width classes lose to Player defaults). |

Sizing: default = composition size. Set `style={{width: '100%'}}` and the height follows the aspect ratio. To fit inside a box, wrap in an absolutely positioned container with `aspectRatio: `${w} / ${h}``, `maxWidth: '100%'`, `maxHeight: '100%'`, `margin: 'auto'`.

## 2. `PlayerRef` methods and events

```tsx
const playerRef = useRef<PlayerRef>(null);
```

Methods: `play(e?)`, `pause()`, `toggle(e?)`, `pauseAndReturnToPlayStart()`, `seekTo(frame)`, `getCurrentFrame()`, `isPlaying()`, `mute()`, `unmute()`, `isMuted()`, `getVolume()`, `setVolume(0..1)`, `requestFullscreen()`, `exitFullscreen()`, `isFullscreen()`, `getScale()`, `getContainerNode()`, `addEventListener()`, `removeEventListener()`. Pass the click event to `play(e)` / `toggle(e)` so browsers treat audio as user-initiated.

Events: `play`, `pause`, `ended` (not when looping), `seeked {frame}`, `timeupdate {frame}` (≤ every 250 ms), `frameupdate {frame}` (every frame), `ratechange`, `scalechange`, `volumechange`, `mutechange`, `fullscreenchange`, `error {error}`, `waiting` / `resume` (buffering).

Read the current frame outside the composition (hooks like `useCurrentFrame()` do not work there):

```tsx
import {useCallback, useSyncExternalStore} from 'react';
import type {CallbackListener, PlayerRef} from '@remotion/player';

export const useCurrentPlayerFrame = (ref: React.RefObject<PlayerRef | null>) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const player = ref.current;
      if (!player) return () => undefined;
      const listener: CallbackListener<'frameupdate'> = () => onStoreChange();
      player.addEventListener('frameupdate', listener);
      return () => player.removeEventListener('frameupdate', listener);
    },
    [ref],
  );
  return useSyncExternalStore(subscribe, () => ref.current?.getCurrentFrame() ?? 0, () => 0);
};
```

## 3. `<Thumbnail>`

Renders one frame without playback: `component`, `frameToDisplay`, `compositionWidth`, `compositionHeight`, `durationInFrames`, `fps`, `inputProps`, `style`, `errorFallback`, `renderLoading`, `noSuspense`. Use for galleries, template pickers, and unit tests (`renderToString(<Thumbnail …/>)`).

## 4. Canonical app architecture

One component tree serves three consumers: the app's `<Player>` (preview), the Remotion Studio (authoring), and the renderer (server, Lambda, Vercel, or browser).

```
src/remotion/
  schema.ts       # Zod schema + constants (fps, size, duration) shared by app and Remotion
  Promo.tsx       # the composition component
  Root.tsx        # <Composition id="Promo" component={Promo} schema={promoSchema} … />
  index.ts        # registerRoot(RemotionRoot)
app/
  editor/page.tsx # 'use client'; <Player component={Promo} inputProps={…} />
  api/render/…    # validates inputProps with promoSchema, triggers the render
```

```tsx
'use client';
import {Player} from '@remotion/player';
import {useMemo, useState} from 'react';
import {Promo} from '@/remotion/Promo';
import {PROMO_FPS, PROMO_HEIGHT, PROMO_WIDTH, promoDuration, type PromoProps} from '@/remotion/schema';

export default function Editor() {
  const [title, setTitle] = useState('Launch day');
  const inputProps: PromoProps = useMemo(() => ({title, accent: '#0b84ff'}), [title]);
  return (
    <Player
      component={Promo}
      inputProps={inputProps}
      durationInFrames={promoDuration(inputProps)}
      fps={PROMO_FPS}
      compositionWidth={PROMO_WIDTH}
      compositionHeight={PROMO_HEIGHT}
      style={{width: '100%'}}
      controls
      acknowledgeRemotionLicense
    />
  );
}
```

Rules:

- The props sent to the render API must equal the Player's `inputProps` and be JSON-serializable (no functions; Dates become strings).
- Validate render requests server-side with the same Zod schema.
- `calculateMetadata` does not run in the Player. Call the same function in the app (`await calculatePromoMetadata({props, defaultProps, abortSignal, compositionId, isRendering: false})`), map `width → compositionWidth`, `height → compositionHeight`, `props → inputProps`, and render a placeholder until it resolves.
- Bundler customizations (Tailwind, SCSS, aliases) must be configured for both the app bundler and Remotion's bundler.
- Downloading "the video from the Player" is not possible without a render (server, Lambda, Vercel, or `@remotion/web-renderer`).
- Add Studio to an existing Player app: `bun add @remotion/cli`, create `remotion/Root.tsx` + `remotion/index.ts`, add a `"remotion": "remotion studio src/remotion/index.ts"` script.

## 5. Performance and re-render rules

- Memoize `inputProps` with `useMemo`. A new object every parent render re-renders the whole video tree.
- Wrap `renderLoading`, `renderPoster`, `render*Button`, `errorFallback`, `lazyComponent` in `useCallback`.
- Keep fast-changing state (current time) out of the component that renders `<Player>`. Put time displays and seek bars in siblings that subscribe via `frameupdate`.
- Isolate global CSS by portaling the Player into an iframe when the host app's styles leak in.

## 6. Custom controls and interactivity

- External controls: omit `controls`, drive with `PlayerRef`. Seek bar: on pointer down → `pause()` + `seekTo()`; track pointer moves on `document`; on pointer up restore the previous play state. Frame = `Math.round(interpolate(x, [0, width], [0, durationInFrames - 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))`.
- Feature-detect fullscreen inside `useEffect` (avoids hydration mismatch).
- Drag-and-drop editors: disable `controls`, set `overflowVisible`, pass setters via `inputProps` or context, `stopPropagation()` in pointer handlers, ignore non-primary buttons, set `touchAction: 'none'`, and divide pointer deltas by `useCurrentScale()`.
- Timelines: model tracks as JSON (`{tracks: [{items: [{type, from, durationInFrames, …}]}]}`), map items to timed components, and render with the same JSON as `inputProps`.

## 7. Autoplay, buffering, premounting

- Mobile Safari is strict: start playback from a user gesture (`onClickCapture={(e) => ref.current?.play(e)}`), or use `initiallyMuted`.
- `@remotion/media` tags buffer automatically (Player shows a spinner while loading). For `<Img>` use `pauseWhenLoading`; for custom async work use `useBufferState().delayPlayback()` in an effect with cleanup.
- Flicker between scenes: add `premountFor={fps}` (most effective), keep buffering on, preload if needed. Do not `prefetch()` while the Player is mounted.

## 8. Framework integrations

- Next.js, React Router, Vite, TanStack Start: render `<Player>` client-side only. Rendering never happens inside the app bundle (see the rendering and cloud references).
- Angular, Svelte, Vue: official starters mount a React root (`createRoot(container).render(React.createElement(PlayerView, props))`) from a framework wrapper, unmount on destroy, and pass the `PlayerRef` back.
- React Native: not supported. `@remotion/skia` uses React Native Skia on the web only.
- Electron: render in the main process with a prebuilt bundle (see rendering reference).
- After Effects: export with Bodymovin → `@remotion/lottie`. Figma: copy as SVG, paste into Studio or convert with SVGR. Spline: export R3F code → `<ThreeCanvas>`.

## 9. Templates

`bunx create-video@latest --yes --<flag> <dir>` (Bun: `bun create video`). `--template <name>` is not a real flag.

| Flag | What you get |
| --- | --- |
| `--blank` | Empty project (best start for agents). |
| `--hello-world` | Animated playground with a Zod schema. |
| `--next` | Next.js App Router + Player + Lambda render routes + Tailwind. |
| `--vercel` | Next.js + Player + Vercel Sandbox rendering to Vercel Blob. |
| `--react-router` | React Router 8 + Player + Lambda. |
| `--render-server` | Express render queue server + Dockerfile. |
| `--electron` | Electron Forge desktop renderer. |
| `--recorder` | Remotion Recorder (screen/camera recording editor; Bun ≥1.2). |
| `--prompt-to-motion-graphics` | AI SaaS: prompt → generated code → Player → Lambda. |
| `--prompt-to-video` | Script + images + voiceover story videos. |
| `--three`, `--skia` | React Three Fiber / Skia starters. |
| `--still` | Dynamic image (OG card) server. |
| `--audiogram`, `--music-visualization`, `--tiktok` | Waveforms, captions, word-by-word captions. |
| `--overlay` | Transparent ProRes overlays for editors. |
| `--code-hike`, `--stargazer` | Code animations, GitHub stars video. |
| `--editor-starter` | Paid video editor starter. |

## 10. Editor products and authoring primitives

- Editor Starter (paid): React video editor (tracks, items, captions, uploads, Lambda or client-side render). Endpoints ship without auth — add it.
- Timeline (paid): copy-paste timeline component.
- `@remotion/canvas` (npm name in 4.0.532; renamed `@remotion/sdk` on main) — experimental `<Canvas>` that wraps `<Player>` with selection, outlines, drag-to-move, and keyframe helpers for building editors.
- `@remotion/codemods` (4.0.527+, draft) — in-memory source edits for Remotion code (`getNodes`, `updateNodeProps`, `addComposition`, `addEffect`, `applyCodemodChanges`, …). It is the engine behind Studio code edits, not a migration CLI.
- `@remotion/browser-bundler` (draft) — compile a virtual Remotion project in the browser (see AI reference).
- `@remotion/studio-protocol` — publish installable "Elements" into a running Studio (`createElementPayload`, `installInStudio`).

## 11. Pitfalls

| Symptom | Fix |
| --- | --- |
| "Remotion requires React.createContext" | `'use client'` in the importing file |
| `'component' should not be an instance of <Composition/>` | Pass the raw component + metadata |
| "does not accept defaultProps" | Use `inputProps` |
| Laggy page / constant re-renders | `useMemo` inputProps; move time state into siblings |
| `getInputProps()` throws in Player | Read component props |
| No audio on mobile | Start from a gesture, pass the event to `play(e)` |
| "More Html5Audio than shared audio tags" | Raise `numberOfSharedAudioTags` (remount) or use `@remotion/media` `<Audio>` |
| Player stuck buffering | A `delayPlayback()` handle never unblocked |
| Drag offsets wrong | Divide by `useCurrentScale()` |
| Changing `initialFrame`/`sampleRate`/`numberOfSharedAudioTags` does nothing or throws | Mount-only → remount with a new `key` |
