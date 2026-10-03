# Recipes

Tested-shape patterns for Mediabunny 1.61. Imports come from `'mediabunny'` unless noted. Adapt sizes, codecs, and error handling to the app.

Contents:
1. Probe metadata · 2. Thumbnails and filmstrips · 3. Keyframe thumbnails · 4. Compress for upload · 5. Lossless trim · 6. Extract audio (MP3 / WAV / M4A) · 7. Speech-to-text audio (16 kHz mono) · 8. Waveform peaks · 9. Watermark overlay · 10. Render canvas animation with audio · 11. Screen + mic recording to disk · 12. Stream an upload while encoding · 13. MSE playback of generated media · 14. Replace or add an audio track · 15. Concatenate clips · 16. Edit tags only · 17. Frames to pixels (ML, analysis) · 18. Work in a Web Worker · 19. Remote preview with partial reads · 20. Server transcode (CLI, HTTP, S3) · 21. HLS VOD packaging

## 1. Probe metadata

```ts
export const probe = async (file: Blob) => {
	using input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
	if (!(await input.canRead())) return null;

	const video = await input.getPrimaryVideoTrack();
	const audio = await input.getPrimaryAudioTrack();
	return {
		format: (await input.getFormat()).name,
		mimeType: await input.getMimeType(),
		duration: await input.computeDuration(),
		tags: await input.getMetadataTags(),
		video: video && {
			codec: await video.getCodec(),
			width: await video.getDisplayWidth(),
			height: await video.getDisplayHeight(),
			rotation: await video.getRotation(),
			fps: (await video.computeFrameRateMetrics()).bestGuessFrameRate,
			hdr: await video.hasHighDynamicRange(),
			decodable: await video.canDecode(),
		},
		audio: audio && {
			codec: await audio.getCodec(),
			channels: await audio.getNumberOfChannels(),
			sampleRate: await audio.getSampleRate(),
			decodable: await audio.canDecode(),
		},
	};
};
```

For a cheaper duration, use `getDurationFromMetadata()` and fall back to `computeDuration()` when it is null.

## 2. Thumbnails and filmstrips

```ts
const video = await input.getPrimaryVideoTrack();
if (!video || !(await video.canDecode())) throw new Error('No decodable video');

const sink = new CanvasSink(video, { width: 320, poolSize: 1 });
const start = await video.getFirstTimestamp();
const end = await video.computeDuration();
const count = 10;
const times = Array.from({ length: count }, (_, i) => start + ((i + 0.5) / count) * (end - start));

const blobs: Blob[] = [];
for await (const wrapped of sink.canvasesAtTimestamps(times)) {
	if (!wrapped) continue;
	const c = wrapped.canvas;
	// Copy out now: with poolSize the canvas is reused on the next yield
	blobs.push(c instanceof OffscreenCanvas
		? await c.convertToBlob({ type: 'image/webp', quality: 0.8 })
		: await new Promise<Blob>(r => c.toBlob(b => r(b!), 'image/webp', 0.8)));
}
```

Square thumbnails: `{ width: 256, height: 256, fit: 'cover' }`. Single poster frame: `await sink.getCanvas(start)`.

## 3. Keyframe thumbnails (fastest scrubbing previews)

```ts
const packets = new EncodedPacketSink(video);
const canvases = new CanvasSink(video, { width: 160, poolSize: 1 });
const keyTimes = (async function* () {
	let p = await packets.getFirstKeyPacket({ metadataOnly: true });
	while (p) {
		yield p.timestamp;
		p = await packets.getNextKeyPacket(p, { metadataOnly: true });
	}
})();
for await (const wrapped of canvases.canvasesAtTimestamps(keyTimes)) { /* … */ }
```

## 4. Compress for upload

```ts
export const compress = async (file: File, onProgress: (p: number) => void, signal?: AbortSignal) => {
	const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
	const format = new Mp4OutputFormat({ fastStart: 'in-memory' });
	const output = new Output({ format, target: new BufferTarget() });

	const videoCodec = await getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), { width: 1280, height: 720 });
	const audioCodec = await getFirstEncodableAudioCodec(format.getSupportedAudioCodecs());

	const conversion = await Conversion.init({
		input, output,
		tracks: 'primary',
		video: async (track) => ({
			codec: videoCodec ?? undefined,
			height: Math.min(await track.getDisplayHeight(), 720), // never upscale
			quality: new Quality('medium'),
		}),
		audio: { codec: audioCodec ?? undefined, numberOfChannels: 2, sampleRate: 48000, quality: new Quality('medium') },
		tags: {},
		showWarnings: false,
	});
	if (!conversion.isValid) {
		input.dispose();
		throw new Error(`Cannot convert: ${conversion.discardedTracks.map(d => d.reason).join(', ')}`);
	}
	conversion.onProgress = onProgress;
	signal?.addEventListener('abort', () => void conversion.cancel(), { once: true });
	try {
		await conversion.execute();
	} finally {
		input.dispose();
	}
	return new File([output.target.buffer!], file.name.replace(/\.\w+$/, '.mp4'), { type: 'video/mp4' });
};
```

`height` alone keeps aspect ratio. For a predictable size budget, use `new Quality({ bitrate: 2_000_000 })` instead. If the output must be smaller than the input, compare sizes and keep the original when the result is larger.

## 5. Lossless trim (no transcode, 1.56+)

```ts
const conversion = await Conversion.init({
	input, output: new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() }),
	trim: { start: 12.5, end: 42 },
	copy: { mode: 'forced', boundaryPolicy: 'expand' }, // keyframe-aligned; may include a bit before 12.5 s
});
```

MP4 output keeps the exact cut with an edit list. Use `boundaryPolicy: 'shrink'` to never include media outside the range, and `boundaryTolerance` to cap how far the start may move. Drop `copy` for frame-exact cuts with re-encoding.

## 6. Extract audio (MP3 / WAV / M4A)

```ts
import { registerMp3Encoder } from '@mediabunny/mp3-encoder';
if (!(await canEncodeAudio('mp3'))) registerMp3Encoder();

const output = new Output({ format: new Mp3OutputFormat(), target: new BufferTarget() });
const conversion = await Conversion.init({ input, output, audio: { quality: new Quality('high') } });
await conversion.execute();
```

- WAV: `new WavOutputFormat()` (PCM, no encoder needed; `audio: { codec: 'pcm-s16' }`).
- M4A (AAC): `new Mp4OutputFormat()` + `video: { discard: true }`; polyfill with `registerAacEncoder()` when `canEncodeAudio('aac')` is false.
- Copy without re-encode: target a container that holds the source codec (AAC → `AdtsOutputFormat` or MP4, Opus → `OggOutputFormat`).

## 7. Speech-to-text audio (16 kHz mono)

```ts
const output = new Output({ format: new WavOutputFormat(), target: new BufferTarget() });
await (await Conversion.init({
	input, output,
	video: { discard: true },
	audio: { numberOfChannels: 1, sampleRate: 16000, codec: 'pcm-s16' },
})).execute();
```

For raw `Float32Array` samples instead of a file, read with `AudioSampleSink` after a resampling conversion, or resample in `audio.process`.

## 8. Waveform peaks

```ts
const audio = (await input.getPrimaryAudioTrack())!;
const duration = await audio.computeDuration();
const buckets = 800;
const peaks = new Float32Array(buckets);
const sink = new AudioSampleSink(audio);

for await (using sample of sink.samples()) {
	const opts = { planeIndex: 0, format: 'f32' } as const;   // interleaved, all channels
	const data = new Float32Array(sample.allocationSize(opts) / 4);
	sample.copyTo(data, opts);
	const ch = sample.numberOfChannels;
	for (let i = 0; i < data.length; i += ch) {
		const t = sample.timestamp + (i / ch) / sample.sampleRate;
		const b = Math.min(buckets - 1, Math.max(0, Math.floor((t / duration) * buckets)));
		const v = Math.abs(data[i]);
		if (v > peaks[b]) peaks[b] = v;
	}
}
```

Reuse one `Float32Array` across samples when they share a size to cut allocations.

## 9. Watermark overlay

```ts
const logo = await createImageBitmap(await (await fetch('/logo.png')).blob());
let ctx: OffscreenCanvasRenderingContext2D | null = null;

const conversion = await Conversion.init({
	input, output,
	video: {
		process: (sample) => {
			ctx ??= new OffscreenCanvas(sample.displayWidth, sample.displayHeight).getContext('2d')!;
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			sample.draw(ctx, 0, 0);
			ctx.drawImage(logo, ctx.canvas.width - logo.width - 24, 24);
			return ctx.canvas; // timestamp and duration come from the input sample
		},
	},
});
```

Return an array to emit extra frames, `null` to drop a frame. If `process` changes the size, set `processedWidth` / `processedHeight`.

## 10. Render a canvas animation with audio

```ts
const fps = 30, seconds = 10;
const canvas = new OffscreenCanvas(1920, 1080);
const ctx = canvas.getContext('2d')!;

const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
const videoCodec = (await getFirstEncodableVideoCodec(output.format.getSupportedVideoCodecs(), { width: 1920, height: 1080 }))!;
const videoSource = new CanvasSource(canvas, { codec: videoCodec, quality: new Quality('high') });
const audioSource = new AudioBufferSource({ codec: 'aac', quality: new Quality('high') });
output.addVideoTrack(videoSource, { frameRate: fps });
output.addAudioTrack(audioSource);
await output.start();

// Audio: render offline, add once, close early
const offline = new OfflineAudioContext(2, 48000 * seconds, 48000);
/* …build the audio graph… */
await audioSource.add(await offline.startRendering());
audioSource.close();

for (let i = 0; i < fps * seconds; i++) {
	drawFrame(ctx, i / fps);
	await videoSource.add(i / fps, 1 / fps); // awaits encoder backpressure
}
videoSource.close();
await output.finalize();
```

Faster than real time; frame timing is exact. For transparent output use `WebMOutputFormat`, codec `'vp9'`, `alpha: 'keep'`, and a canvas with `{ alpha: true }`.

## 11. Screen + mic recording to disk

```ts
const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
const handle = await window.showSaveFilePicker({ suggestedName: 'recording.mp4' });

const output = new Output({
	format: new Mp4OutputFormat({ fastStart: 'fragmented' }), // crash-tolerant, constant memory
	target: new StreamTarget(await handle.createWritable(), { chunked: true }),
});
const video = new MediaStreamVideoTrackSource(display.getVideoTracks()[0], { codec: 'avc', quality: new Quality('high'), keyFrameInterval: 2 });
const audio = new MediaStreamAudioTrackSource(mic.getAudioTracks()[0], { codec: 'aac', quality: new Quality('medium') });
output.addVideoTrack(video);
output.addAudioTrack(audio);

const fail = (e: unknown) => { void output.cancel(); console.error(e); };
video.errorPromise.catch(fail);
audio.errorPromise.catch(fail);

await output.start();
// pause/resume: video.pause(); audio.pause(); … video.resume(); audio.resume();
// stop:
await output.finalize();
[...display.getTracks(), ...mic.getTracks()].forEach(t => t.stop());
```

Pick codecs with `getFirstEncodableVideoCodec` / `getFirstEncodableAudioCodec` for Firefox (no AAC encode in some builds) or use WebM + VP9/Opus.

## 12. Stream an upload while encoding

```ts
const { writable, readable } = new TransformStream<Uint8Array, Uint8Array>();
const output = new Output({
	format: new Mp4OutputFormat({ fastStart: 'fragmented' }), // append-only
	target: new AppendOnlyStreamTarget(writable),
});
const upload = fetch('/upload', {
	method: 'POST', body: readable, duplex: 'half',
	headers: { 'Content-Type': output.format.mimeType },
} as RequestInit);
// …add tracks, start, add media, finalize…
await output.finalize();
await upload;
```

Streaming request bodies need HTTP/2+ in Chromium and are not available in every browser. When unsupported, fall back to `BufferTarget({ onFinalize })` or chunked uploads from a `StreamTarget`. Other append-only formats: WebM/MKV `appendOnly: true`, MPEG-TS, Ogg, ADTS, MP3 `xingHeader: false`, FLAC `appendOnly: true`.

## 13. MSE playback of generated media

```ts
const mediaSource = new MediaSource();
videoEl.src = URL.createObjectURL(mediaSource);
await new Promise(r => mediaSource.addEventListener('sourceopen', r, { once: true }));

const queue: Uint8Array[] = [];
let sb: SourceBuffer | null = null;
const pump = () => {
	if (sb && !sb.updating && queue.length) sb.appendBuffer(queue.shift()!);
};

const output = new Output({
	format: new Mp4OutputFormat({ fastStart: 'fragmented', minimumFragmentDuration: 0.5 }),
	target: new AppendOnlyStreamTarget(new WritableStream({ write: (chunk) => { queue.push(chunk); pump(); } })),
});
// …add tracks, then:
await output.start();
// Do NOT await before media is added (it waits for encoder configs):
void output.getMimeType().then((mime) => {
	sb = mediaSource.addSourceBuffer(mime);
	sb.addEventListener('updateend', pump);
	pump();
});
// …add media…
```

## 14. Replace or add an audio track (composable, 1.51+)

```ts
const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
const videoPart = await Conversion.init({ input: videoInput, output, composable: true, audio: { discard: true } });
const audioPart = await Conversion.init({ input: musicInput, output, composable: true, video: { discard: true },
	trim: { end: await videoInput.computeDuration() } });
await output.start();
await Promise.all([videoPart.execute(), audioPart.execute()]);
await output.finalize();
```

Add generated audio instead: `output.addAudioTrack(new AudioBufferSource(...))` before `start()`, then `add()` and `close()` it in parallel with `execute()`.

## 15. Concatenate clips (re-encode)

Packet copy across files only works when every clip has an identical decoder config. The robust path decodes and re-encodes with shifted timestamps.

```ts
const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
const vOut = new VideoSampleSource({
	codec: 'avc', quality: new Quality('high'),
	sizeChangeBehavior: 'contain',            // letterbox clips with other sizes into the first clip's box
});
const aOut = new AudioSampleSource({
	codec: 'aac', quality: new Quality('high'),
	transform: { sampleRate: 48000, numberOfChannels: 2 }, // normalize clip audio
});
output.addVideoTrack(vOut);
output.addAudioTrack(aOut);
await output.start();

let offset = 0;
for (const file of files) {
	using input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
	const start = await input.getFirstTimestamp();
	const end = await input.computeDuration();
	const v = await input.getPrimaryVideoTrack();
	const a = await input.getPrimaryAudioTrack();

	await Promise.all([
		(async () => {
			if (!v) return;
			for await (using s of new VideoSampleSink(v).samples(start, end)) {
				s.setTimestamp(s.timestamp - start + offset);
				await vOut.add(s);
			}
		})(),
		(async () => {
			if (!a) return; // a silent gap is fine; or generate silence with AudioSample
			for await (using s of new AudioSampleSink(a).samples(start, end)) {
				s.setTimestamp(s.timestamp - start + offset);
				await aOut.add(s);
			}
		})(),
	]);
	offset += end - start;
}
vOut.close(); aOut.close();
await output.finalize();
```

## 16. Edit tags only (copy everything else)

```ts
await (await Conversion.init({
	input, output: new Output({ format: new Mp3OutputFormat(), target: new BufferTarget() }),
	tags: (old) => ({ ...old, title: 'New title', images: [{ data: coverJpeg, mimeType: 'image/jpeg', kind: 'coverFront' }] }),
})).execute();
```

Keep the same container as the input so packets copy. For MP4, `metadataFormat: 'mdta'` allows custom keys in `raw`.

## 17. Frames to pixels (ML, analysis)

```ts
const sink = new VideoSampleSink(video);
for await (using frame of sink.samplesAtTimestamps(times)) {
	if (!frame) continue;
	using small = await frame.transform({ width: 224, height: 224, fit: 'cover' });
	const rgba = new Uint8Array(small.allocationSize({ format: 'RGBA' }));
	await small.copyTo(rgba, { format: 'RGBA' });
	await model.run(rgba, small.codedWidth, small.codedHeight);
}
```

`transform()` applies the track's rotation, so the pixels are upright. On the server, register `@mediabunny/server` first.

## 18. Work in a Web Worker

Mediabunny runs in dedicated workers (WebCodecs, `OffscreenCanvas`, `BlobSource` all work there). Post the `File`/`Blob` (structured clone, no copy of bytes), run the conversion in the worker, and post back the result `ArrayBuffer` as a transferable. `CanvasSink` yields `OffscreenCanvas` in workers; transfer `ImageBitmap`s (`canvas.transferToImageBitmap()` on a non-pooled canvas, or `createImageBitmap(canvas)`) to the main thread. Report `onProgress` via `postMessage`, throttled.

## 19. Remote preview with partial reads

```ts
using input = new Input({
	formats: ALL_FORMATS,
	source: new UrlSource(url, { requestInit: { headers: { Authorization: `Bearer ${token}` } } }),
});
const poster = await new CanvasSink((await input.getPrimaryVideoTrack())!, { width: 640 }).getCanvas(0);
```

Only the needed byte ranges download (MP4 with `moov` at the end needs a range request to the tail). The server must allow CORS and `Range`. Log traffic with `input.source.on('read', …)`.

## 20. Server transcode

### CLI / batch job

```ts
import { registerMediabunnyServer } from '@mediabunny/server';
registerMediabunnyServer();
Logging.level = LogLevel.Warnings;

using input = new Input({ formats: ALL_FORMATS, source: new FilePathSource(inPath) });
const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'reserve' }), target: new FilePathTarget(outPath) });
```

`fastStart: 'reserve'` needs `maximumPacketCount` on manually added tracks; with `Conversion`, prefer `fastStart: false` (default for non-buffer targets) or `'in-memory'` for small files.

### HTTP upload → compressed file (O(1) memory)

```ts
const input = new Input({ source: new ReadableStreamSource(Readable.toWeb(req) as ReadableStream<Uint8Array>), formats: ALL_FORMATS });
const output = new Output({ format: new Mp4OutputFormat(), target: new FilePathTarget(`./out-${crypto.randomUUID()}.mp4`) });
const conversion = await Conversion.init({
	input, output,
	video: async (t) => ({ codec: 'avc', height: Math.min(720, await t.getDisplayHeight()), quality: new Quality('medium') }),
});
await conversion.execute();
```

`ReadableStreamSource` is unsized and sequential. It suits files readable front to back (MP4 with `moov` first, fragmented MP4, WebM, TS, …). An MP4 with `moov` at the end forces the reader to hold most of the stream in its cache; save such uploads to disk and use `FilePathSource`, or raise `maxCacheSize` knowingly.

### S3 / object storage input

```ts
const source = new CustomSource({
	getSize: async () => (await s3.headObject({ Bucket, Key })).ContentLength!,
	read: async (start, end) => {
		const r = await s3.getObject({ Bucket, Key, Range: `bytes=${start}-${end - 1}` });
		return new Uint8Array(await r.Body!.transformToByteArray());
	},
	prefetchProfile: 'network',
});
```

## 21. HLS VOD packaging

```ts
const output = new Output({
	format: new HlsOutputFormat({ segmentFormat: new MpegTsOutputFormat(), targetDuration: 4 }),
	target: new PathedTarget('master.m3u8', ({ path }) => new FilePathTarget(join(outDir, path))),
});
await (await Conversion.init({
	input, output,
	video: [
		{ height: 1080, quality: new Quality('high'), keyFrameInterval: 4 },
		{ height: 720, quality: new Quality('medium'), keyFrameInterval: 4 },
		{ height: 480, quality: new Quality('low'), keyFrameInterval: 4 },
	],
	audio: { codec: 'aac', quality: new Quality('medium') },
})).execute();
```

`FilePathTarget` does not create directories; create `outDir` (and subfolders from custom `getSegmentPath`) first.
