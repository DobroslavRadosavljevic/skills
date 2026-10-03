# Conversion API

Contents: basics · validity · progress · cancel/pause/partial execution · video options · audio options · per-track functions · fan-out · trimming · copy path · tags · track selection · discarded tracks · composable conversions · live inputs.

## Basics

```ts
import { Input, Output, Conversion, ALL_FORMATS, BlobSource, Mp4OutputFormat, BufferTarget } from 'mediabunny';

const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });

const conversion = await Conversion.init({ input, output });
if (!conversion.isValid) {
	throw new Error(conversion.discardedTracks.map(d => `#${d.track.id}: ${d.reason}`).join(', '));
}
conversion.onProgress = (progress, processedSeconds) => { /* 0..1 */ };
await conversion.execute();
const bytes = output.target.buffer!;
```

- The `Output` must be fresh (`'pending'`, no tracks, no tags) unless `composable: true`.
- Unconfigured, it copies media when possible, transcodes when needed, and drops tracks the output cannot hold.
- `showWarnings: false` silences discarded-track console warnings once you handle them yourself.
- `onProgress` must be set before `execute()`. Progress `1` is not completion; the `execute()` promise is. Progress needs the total duration; skip it for `ReadableStreamSource` inputs.
- Output size: `output.target.on('write', ({ end }) => size = Math.max(size, end))`.

## Cancel, pause, partial execution (1.51+)

```ts
await conversion.cancel();                     // execute() rejects with ConversionCanceledError
const ctrl = new AbortController();
await conversion.execute({ pauseSignal: ctrl.signal }); // resolves early on abort
conversion.state;                              // 'idle' | 'executing' | 'done' | 'canceled'
await conversion.execute();                    // resume
await conversion.execute({ until: 10 });       // run until output time 10 s, then resolve
```

Cancel a non-composable conversion and the output is canceled too. Cancel a composable one and the output stays usable.

## Video options (`ConversionVideoOptions`)

| Option | Effect |
| --- | --- |
| `discard` | Drop the track |
| `width`, `height`, `fit` | Resize; one side keeps aspect; both sides need `fit`; apply after rotate/flip/crop |
| `rotate`, `flip` | On top of existing metadata; written as metadata when possible |
| `allowTransformationMetadata` | `false` bakes rotation/flip into pixels and strips metadata (was `allowRotationMetadata` before 1.57) |
| `crop` | `{ left, top, width, height }`, clamped, after rotate/flip, before resize |
| `frameRate` | Output FPS (default keeps original, possibly variable) |
| `codec` | Target codec; must fit the container or the track is discarded |
| `quality` | `Quality`; forces transcode; default `new Quality('high')` when a transcode happens anyway |
| `alpha` | `'discard'` (default) or `'keep'` |
| `hardwareAcceleration` | Encoder/decoder hint |
| `keyFrameInterval` | Seconds; forces transcode |
| `forceTranscode` | Never copy |
| `process(sample)` | Return a `CanvasImageSource`, `VideoSample`, `VideoSampleResource`, an array of them (extra frames), or `null` (drop); runs after built-in transforms and FPS changes; untimed results reuse the input timestamp and duration |
| `processedWidth`, `processedHeight` | Declare output size when `process` resizes |
| `group` | HLS track group |

When `fit` is unset and the input changes size mid-stream, the behavior is `'passThrough'`.

## Audio options (`ConversionAudioOptions`)

| Option | Effect |
| --- | --- |
| `discard` | Drop the track |
| `codec`, `quality` | Same rules as video |
| `numberOfChannels` | Up/downmix (Web Audio mixing rules) |
| `sampleRate` | Resample |
| `sampleFormat` | `'u8' \| 's16' \| 's32' \| 'f32'` for PCM targets |
| `forceTranscode` | Never copy |
| `process(sample)` | Return `AudioSample`/array/`null`; runs after remix/resample |
| `processedNumberOfChannels`, `processedSampleRate` | Declare output shape when `process` changes it |

## Per-track functions

```ts
await Conversion.init({
	input, output,
	video: async (track, n) => (n > 1 ? { discard: true } : {
		width: Math.min(await track.getDisplayWidth(), 1280),
	}),
	audio: async (track) => (await track.getLanguageCode()) === 'eng' ? { codec: 'aac' } : { discard: true },
});
```

`n` is the 1-based index among tracks of that type. Return `undefined` for defaults.

## Fan-out (one input track → many output tracks)

```ts
video: [
	{ height: 1080, quality: new Quality('high') },
	{ height: 720, quality: new Quality('medium') },
	{ height: 480, quality: new Quality('low') },
],
```

Mostly for HLS ladders. `utilizedTracks` lists an input track once per output track.

## Trimming

```ts
trim: { start: 10, end: 25 } // 15 s output starting at 0
trim: { start: 0 }           // keep original start offset (e.g. MPEG-TS) instead of shifting to 0
trim: { start: -2 }          // 2 s of freeze frame / silence before the media
```

Default trimming shifts the output to start at 0.

## Copy path (lossless, no transcode) — 1.56+

Copy happens when no option forces a transcode, the container can hold the codec, and the container's timestamp rules allow it. MP4 is the most permissive (edit lists model any trim).

```ts
copy: {
	mode: 'preferred',          // or 'forced': discard tracks that cannot be copied
	shiftTolerance: 0,          // max seconds the media may shift to be copyable; Infinity = any
	boundaryPolicy: 'expand',   // 'expand': include ≥ the trim range (keyframe-aligned); 'shrink': never exceed it
	boundaryTolerance: Infinity,// max seconds added/removed at the start by boundaryPolicy (1.58+)
},
copy: false,                    // always transcode
```

`shiftTolerance: 0` keeps exact timeline sync with the input. Any shift still keeps A/V sync. Before 1.56, any non-default `trim.start` forced a transcode of both tracks.

## Metadata tags

```ts
tags: { title: 'New' }                                   // replace
tags: (inputTags) => ({ ...inputTags, comment: undefined }) // edit
tags: {}                                                 // strip all
```

Default: copy input tags.

## Track selection

`tracks: 'all' | 'primary'`. Default is `'all'`, except HLS inputs default to `'primary'`. Use `discard` in per-track functions for finer control.

## Discarded tracks

`conversion.discardedTracks: { track, reason }[]` with reasons:

- `discarded_by_user`
- `max_track_count_reached` — output has no room left
- `max_track_count_of_type_reached` — no room for this type, or the format does not support it (for example video into `.mp3`)
- `unknown_source_codec` — Mediabunny cannot identify the codec
- `undecodable_source_codec` — known codec, no decoder (register an extension or use `@mediabunny/server`)
- `no_encodable_target_codec` — no encoder for any codec the container accepts (register an encoder extension, pick another container, or check `codec`)

`isValid === false` means the remaining tracks cannot make a legal output (for example an audio-only format lost its only audio track).

## Composable conversions (1.51+)

The conversion only adds and pumps its own tracks. You own `start()`, extra tracks, tags, and `finalize()`.

```ts
const conversion = await Conversion.init({ input, output, audio: { discard: true }, composable: true });
const audioSource = new AudioBufferSource({ codec: 'aac', quality: new Quality('high') });
output.addAudioTrack(audioSource);
await output.start();
await Promise.all([
	conversion.execute(),
	audioSource.add(narration).then(() => audioSource.close()),
]);
await output.finalize();
```

Lockstep feeding keeps buffering low:

```ts
for (let until = 1; ; until++) {
	await Promise.all([c1.execute({ until }), c2.execute({ until })]);
	if (c1.state === 'done' && c2.state === 'done') break;
}
```

Use composable conversions to mux the video of one file with the audio of another, to add generated tracks next to copied ones, or to send several inputs to one output.

## Live inputs

A live HLS input converts until the stream ends. To capture a window:

```ts
const edge = await input.getDurationFromMetadata(undefined, { skipLiveWait: true });
await Conversion.init({ input, output, trim: { start: edge!, end: edge! + 60 } });
```
