# Video, Audio, and Media Processing

Media tags, audio mixing, visualization, Mediabunny metadata, transparency, sound effects, video matting. Snapshot: `remotion@4.0.532`, Mediabunny `1.56.1`.

## Contents

1. Choosing a media tag
2. `@remotion/media` `<Video>` / `<Audio>`
3. `<OffthreadVideo>` and `<Html5Video>` / `<Html5Audio>`
4. Audio techniques
5. Audio visualization (`@remotion/media-utils`)
6. Mediabunny: metadata, validation, frames
7. Transparency, greenscreen, matting
8. Sound effects
9. Deprecated media packages
10. Pitfalls

---

## 1. Choosing a media tag

**Default: `import {Video, Audio} from '@remotion/media'`** (`bunx remotion add @remotion/media`).

`Video` and `Audio` exported from `remotion` still compile, but they are deprecated aliases of `Html5Video` / `Html5Audio`. Importing them silently gives the HTML5 tag.

| | `@remotion/media` `<Video>`/`<Audio>` | `<OffthreadVideo>` | `<Html5Video>`/`<Html5Audio>` |
| --- | --- | --- | --- |
| Engine | Mediabunny + WebCodecs → canvas | Rust/FFmpeg frame extraction (render), `<video>` (preview) | native `<video>`/`<audio>` |
| Frame-exact | yes | yes | no |
| Partial download (range requests) | yes | no (downloads whole file) | only when muted |
| Render speed | fastest | fast | medium |
| CORS required | **yes** (or `staticFile()`) | no | no |
| `loop` | yes | no (wrap in `<Loop>`) | yes |
| H.265 / AVI / FLV / AC-3 during SSR | no → automatic fallback to `<OffthreadVideo>` | yes | depends on Chrome |
| ProRes | yes with `@mediabunny/prores` | render only | no |
| HLS `.m3u8` (VOD) | yes (4.0.454) | preview only | preview only |
| `playbackRate` pitch | pitch changes with speed | preserved | preserved |
| Client-side rendering | yes (only option) | no | no |

Fallback (automatic, preview and SSR only): CORS failure, container/codec the WebCodecs decoder cannot handle (HEVC in Chrome Headless Shell), or alpha video without WebGL. It logs `Cannot decode <src>, falling back to <OffthreadVideo>`. Client-side rendering never falls back — the render fails.

Use different tags for preview and render only when you must:

```tsx
import {Video, type VideoProps} from '@remotion/media';
import {OffthreadVideo, useRemotionEnvironment} from 'remotion';

export const SafeVideo: React.FC<VideoProps> = (props) => {
  const {isRendering} = useRemotionEnvironment();
  return isRendering ? <OffthreadVideo src={props.src} /> : <Video {...props} />;
};
```

## 2. `@remotion/media` `<Video>` / `<Audio>`

`<Video>` props (source of truth: `packages/media/src/video/props.ts`):

| Prop | Default | Notes |
| --- | --- | --- |
| `src` | — | Remote URL with CORS, or `staticFile()`. `.m3u8` OK. |
| `from` | `0` | Start in the parent timeline (4.0.446). No `<Sequence>` wrapper needed. |
| `trimBefore` | `0` | Skip source frames (in composition fps). |
| `durationInFrames` | intrinsic | Source frames to play from `trimBefore`. Replaces deprecated `trimAfter`. |
| `volume` | `1` | Number or `(mediaFrame) => number`. Negative throws, ≥100 throws. |
| `muted` | `false` | May change per frame. |
| `playbackRate` | `1` | Constant, > 0. Changes pitch. No reverse. |
| `loop` | `false` | With `loopVolumeCurveBehavior: 'repeat' \| 'extend'`. |
| `toneFrequency` | `1` | Pitch, 0.01–2, constant. |
| `objectFit` | `'contain'` | A prop — CSS `object-fit` in `style` does not work (ESLint warns). |
| `style`, `className` | — | Applied to the canvas. |
| `effects` | `[]` | `@remotion/effects` chain on the frame (needs WebGL for most). |
| crop props | — | `cropLeft/Right/Top/Bottom` 0–1. |
| `premountFor`, `postmountFor`, `styleWhilePremounted` | — | Preview smoothness. |
| `freeze`, `hidden`, `name`, `showInTimeline` | — | Timing contract. |
| `onError` | → fallback | `(err) => 'fallback' \| 'fail' \| undefined`. |
| `disallowFallbackToOffthreadVideo` | `false` | Fail instead of falling back. |
| `fallbackOffthreadVideoProps` | — | Extra props for the fallback (`transparent`, `toneMapped`, …). |
| `onVideoFrame` | — | Receives each `ImageBitmap`/`VideoFrame` (pixel work, Three.js textures). |
| `headless` | `false` | No canvas mounted; still fires `onVideoFrame`. |
| `audioStreamIndex` | `0` | Pick an audio track. |
| `requestInit` | — | `cache`, `credentials`, `headers`, … captured on mount. `{cache: 'no-store'}` for CDNs with bad range responses. |
| `maxCanvasSinkFrameSize` | `null` | Preview-only downscale of decoded frames (4.0.530). |
| `delayRenderTimeoutInMilliseconds`, `delayRenderRetries`, `logLevel`, `debugOverlay` | — | |

`<Audio>` takes the audio subset: `src`, `from`, `trimBefore`, `durationInFrames`, `volume`, `loopVolumeCurveBehavior`, `playbackRate`, `muted`, `loop`, `toneFrequency`, `audioStreamIndex`, `onError`, `disallowFallbackToHtml5Audio`, `fallbackHtml5AudioProps`, `requestInit`, timing and premount props.

Decoded-media cache: shared per render, default 50% of RAM clamped 500 MB–20 GB. Override with `mediaCacheSizeInBytes` / `--media-cache-size-in-bytes`.

Extra codecs (register before `registerRoot()`):

```ts
// bunx remotion add @mediabunny/prores @mediabunny/ac3
import {registerProresDecoder} from '@mediabunny/prores';
import {registerAc3Decoder} from '@mediabunny/ac3';
registerProresDecoder();
registerAc3Decoder();
```

## 3. `<OffthreadVideo>` and HTML5 tags

`<OffthreadVideo>` — use for non-CORS remote sources, H.265/AVI/FLV during SSR, or as the fallback. Props: `src`, `trimBefore`, `durationInFrames` (4.0.530), `transparent` (PNG extraction, slower), `toneMapped` (HDR→sRGB, default true), `volume`, `playbackRate`, `muted`, `toneFrequency` (SSR only), `audioStreamIndex`, `acceptableTimeShiftInSeconds`, `pauseWhenBuffering`, `onError`, `onVideoFrame`, `crossOrigin`, `useWebAudioApi`, `delayRender*`. No `loop`: compute the duration with Mediabunny and wrap in `<Loop durationInFrames={Math.floor(seconds * fps)}>`.

`<Html5Video>` / `<Html5Audio>` — not frame-exact; avoid for new code. Useful only for odd preview cases. `muted` lets the renderer skip downloading the file for audio mixing.

Deprecated props: `startFrom`/`endAt` (renamed to `trimBefore`/`trimAfter` in 4.0.319; mixing old and new throws), `trimAfter` (use `durationInFrames`), `imageFormat` on OffthreadVideo (use `transparent`).

When `from`/`trimBefore`/`playbackRate` of an `<OffthreadVideo>`/`<Html5Video>` change over time, append a URL fragment such as `#disable` so the browser does not reload the media on every change.

## 4. Audio techniques

```tsx
import {Audio, Video} from '@remotion/media';
import {interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const Mix: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      <Audio
        name="Music"
        src={staticFile('music.mp3')}
        loop
        volume={interpolate(frame, [0, fps, 9 * fps, 10 * fps], [0, 0.5, 0.5, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })}
      />
      <Audio
        name="Voiceover"
        src={staticFile('voice.mp3')}
        from={2 * fps}
        trimBefore={1 * fps}
        durationInFrames={5 * fps}
        volume={(f) => interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'})}
      />
      <Video name="B-roll" src={staticFile('broll.mp4')} muted={frame >= 2 * fps && frame <= 4 * fps} />
    </>
  );
};
```

- Volume as a number computed inline from `frame` uses the composition frame and is editable as keyframes in Studio. A callback receives the media-relative frame (0 when the media starts).
- Always clamp volume curves — negative values throw or clamp.
- Ducking: lower music volume during voiceover ranges with keyframes at the voiceover `from`/end.
- Speed segments: a `<Series>` of `<Video trimBefore={consumed} playbackRate={speed}>` where each segment lasts `sourceFrames / speed`. Smooth speed ramps (animated rate) do not work with `@remotion/media` yet; the documented workaround uses `<OffthreadVideo>` + a `#disable` fragment and re-seats `from`/`trimBefore` per frame.
- Synthesized audio: render with `OfflineAudioContext`, convert via `audioBufferToDataUrl(buffer)`, play with `<Audio src={dataUrl}>` behind a delayRender handle.
- Audio from video tags is mixed automatically. Output sample rate is 48000 Hz by default (`--sample-rate`, `sampleRate` option, or `defaultSampleRate` from `calculateMetadata`).
- Audio-only output: `bunx remotion render MyComp out/audio.mp3` (codec inferred) or `--codec=mp3|aac|wav`. `--muted` drops audio.
- Trimming a source file permanently: prefer non-destructive `trimBefore`/`durationInFrames`. If you need a new file, re-encode with the bundled FFmpeg (`bunx remotion ffmpeg -ss 5 -i in.mp4 -t 10 -c:v libx264 -c:a aac out.mp4`); stream copy can freeze the first frames.
- Silence detection: `bunx remotion ffmpeg -i in.wav -af silencedetect=noise=-35dB:d=0.5 -f null -`, then `trimBefore={Math.floor(leadingSilenceEnd * fps)}`.

## 5. Audio visualization (`@remotion/media-utils`)

| API | Use |
| --- | --- |
| `useWindowedAudioData({src, frame, fps, windowInSeconds})` → `{audioData, dataOffsetInSeconds}` | Preferred for long files; loads only the window around the frame (range requests). `windowInSeconds` must stay constant. |
| `useAudioData(src)` / `getAudioData(src, {sampleRate?})` | Whole file in memory; fine for short clips. Needs CORS. |
| `visualizeAudio({audioData, frame, fps, numberOfSamples, smoothing?, optimizeFor?, dataOffsetInSeconds?})` → `number[]` 0–1 | Frequency bars; `numberOfSamples` is a power of 2; bass on the left. Use `optimizeFor: 'speed'`. |
| `visualizeAudioWaveform({audioData, frame, fps, windowInSeconds, numberOfSamples, dataOffsetInSeconds?, normalize?})` → `number[]` −1..1 | Oscilloscope waveform for voice. |
| `getWaveformPortion({audioData, startTimeInSeconds, durationInSeconds, numberOfSamples})` | Static volume bars (synchronous). |
| `createSmoothSvgPath({points})` | Smooth path from points. |
| `getImageDimensions(src)` | Image size. |

```tsx
import {Audio} from '@remotion/media';
import {useWindowedAudioData, visualizeAudio} from '@remotion/media-utils';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const src = staticFile('podcast.wav');

export const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {audioData, dataOffsetInSeconds} = useWindowedAudioData({src, frame, fps, windowInSeconds: 10});
  return (
    <>
      <Audio src={src} />
      {audioData ? (
        <div style={{display: 'flex', alignItems: 'flex-end', height: 300, gap: 4}}>
          {visualizeAudio({fps, frame, audioData, numberOfSamples: 32, dataOffsetInSeconds, optimizeFor: 'speed'}).map(
            (v, i) => (
              <div key={i} style={{width: 20, height: 300 * Math.min(1, v * 3), background: 'white'}} />
            ),
          )}
        </div>
      ) : null}
    </>
  );
};
```

- The `frame` passed in is the position in the audio track. If the audio has `from`/`trimBefore`, adjust it. Pass the frame from the parent into bar children instead of calling `useCurrentFrame()` inside offset sequences.
- Balanced look: convert to dB `20 * Math.log10(v)` and map −100…−30 dB to 0…1. Bass level = average of the first few bins.
- Waveform path: `visualizeAudioWaveform({…, windowInSeconds: 1 / fps})` → points → `createSmoothSvgPath`.
- Deprecated: `getAudioDurationInSeconds()`, `getVideoMetadata()` from media-utils — use Mediabunny.

## 6. Mediabunny: metadata, validation, frames

Mediabunny is the media toolkit Remotion builds on. Install the aligned version with `bunx remotion add mediabunny` — Remotion 4.0.532 pins `mediabunny@1.56.1` while npm `latest` is newer (1.61.0 on 2026-10-03); a plain `bun add mediabunny` can install a second, mismatched copy. It loads via `fetch()`, so remote URLs need CORS. In Node/Bun use `FilePathSource` (and `@mediabunny/server` + `registerMediabunnyServer()` for decode/encode).

```ts
import {ALL_FORMATS, BlobSource, Input, UrlSource} from 'mediabunny';

export const getMediaMetadata = async (src: string) => {
  using input = new Input({formats: ALL_FORMATS, source: new UrlSource(src)});
  const durationInSeconds = await input.computeDuration();
  const track = await input.getPrimaryVideoTrack();
  const dimensions = track ? {width: await track.getDisplayWidth(), height: await track.getDisplayHeight()} : null;
  const metrics = track ? await track.computeFrameRateMetrics() : null;
  const fps = metrics && metrics.probedPacketCount >= 2 ? metrics.bestGuessFrameRate : null;
  const hasAudio = (await input.getPrimaryAudioTrack()) !== null;
  return {durationInSeconds, dimensions, fps, hasAudio};
};

export const canDecode = async (src: string | Blob) => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: typeof src === 'string' ? new UrlSource(src) : new BlobSource(src),
  });
  try {
    await input.getFormat();
  } catch {
    return false;
  }
  const v = await input.getPrimaryVideoTrack();
  if (v && !(await v.canDecode())) return false;
  const a = await input.getPrimaryAudioTrack();
  if (a && !(await a.canDecode())) return false;
  return true;
};
```

- Match a composition to a video in `calculateMetadata`: `durationInFrames: Math.ceil(durationInSeconds * fps)`, `width`/`height` from the track. For variable-frame-rate screen recordings do not trust averages; pick a target fps.
- Sequence of clips: compute each clip's frames in `calculateMetadata`, pass them as props, render a `<Series>` of `<Series.Sequence durationInFrames premountFor={fps}><Video src /></Series.Sequence>`, sum for total duration.
- Thumbnails / filmstrips: `new VideoSampleSink(track)`; `sink.getSample(t)` or `samplesAtTimestamps([...])`; draw with `sample.draw(ctx, x, y)`; close samples (`using`).
- Validate user uploads with `canDecode()` before accepting them. Re-encode on the backend if needed.
- Formats: mp4/m4v/m4a, mov, mkv, webm, ogg, mp3, wav, aac, flac, ts, m3u8 (VOD). HEVC cannot be decoded in Chrome Headless Shell.

## 7. Transparency, greenscreen, matting

- Play alpha video: `@remotion/media` decodes alpha but needs WebGL in the render browser: v4 requires `--gl=angle` (or `swangle` without GPU). `<OffthreadVideo transparent>` also works.
- Video with black instead of alpha: `style={{mixBlendMode: 'screen'}}`.
- Greenscreen: `effects={[colorKey({similarity: 0.45})]}` from `@remotion/effects/color-key` (WebGL2).
- Render transparent output: see the rendering reference (ProRes 4444 `.mov` for editors, VP8/VP9 WebM for browsers).
- `@remotion/video-matting` (4.0.523, WebGPU, browser or Node): `separateVideoLayers({src, model: 'modnet' | 'ben2-base', audio, outputs, onProgress})` → base (opaque) and foreground (VP9 alpha) WebM blobs. Layer: base → your content → foreground (text behind a person). Check `canUseVideoMatting()` first. Needs a GPU; not on Linux arm64; serverless usually has no GPU. Studio exposes "Remove background".

## 8. Sound effects

`@remotion/sfx` exports URL constants for hosted WAV files (`https://remotion.media/<name>.wav`, normalized, no attribution needed): `whoosh`, `whip`, `pageTurn`, `uiSwitch` (switch.wav), `mouseClick`, `shutterModern`, `shutterOld`, `ding`, `vineBoom`, `recordScratch`, `bruh`, `windowsXpError`, `yippee`, `animeWow`, `boneCrack`, `wilhelmScream`, `macQuack`, `snapchatNotification`, `triggered`, `dramaticBoomer`, and more.

```tsx
import {Audio} from '@remotion/media';
import {whoosh} from '@remotion/sfx';

<Audio name="Whoosh" src={whoosh} from={58} durationInFrames={30} volume={0.6} />
```

Place transition sounds a few frames before the visual cut. Keep SFX volume below the voice.

## 9. Deprecated media packages

`@remotion/media-parser` and `@remotion/webcodecs` are being phased out and will not be published for v5. Write new code with Mediabunny (`Input`, `Output`, `Conversion`, sinks). Only touch `parseMedia()` / `convertMedia()` when migrating existing code. `getVideoMetadata()` from `@remotion/renderer` is removed in v5 — use Mediabunny in Node too.

## 10. Pitfalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| Video renders but uses HTML5 tag, not frame-exact | `import {Video} from 'remotion'` | Import from `@remotion/media` |
| `Cannot decode …, falling back` | No CORS, HEVC, unsupported codec, alpha without WebGL | Add CORS, re-encode to H.264, `--gl=angle`, or accept fallback |
| Client-side render fails on a video | No fallback in CSR | CORS + supported codec; validate with `canDecode()` |
| Video won't seek / reloads | Server ignores `Range` | Serve `Content-Range`/206, faststart MP4; avoid `blob:` URLs |
| Slow Lambda chunks with `.mkv`/`.webm` audio | Matroska audio decodes from the start | Prefer mp4/mov/m4a |
| "error creating media player" | Too many `<video>` tags / `key` changing per frame | `@remotion/media`; stable keys |
| Volume throws | Negative or ≥100 | Clamp; volume is 0–1 linear amplitude (>1 amplifies) |
| No sound when reviewing output in an editor preview | The editor mutes media | Open in QuickTime/VLC |
| `toneFrequency` error | Animated or outside 0.01–2 | Constant value in range |
| Transparent WebM flickers on Lambda | Chunk boundaries | ProRes 4444 or larger `framesPerLambda` / `concurrency: 1` |
