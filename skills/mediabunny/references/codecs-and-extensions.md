# Codecs, Support Checks, Custom Coders, and Extensions

Contents: codec ids · encode checks · decode checks · custom encoders/decoders · extension packages · `@mediabunny/server` · logging.

## Codec ids

- Video (`VIDEO_CODECS`): `avc`, `hevc`, `vp8`, `vp9`, `av1`, `prores`.
- Audio (`AUDIO_CODECS`): `aac`, `opus`, `mp3`, `vorbis`, `flac`, `ac3`, `eac3`, `dts`, plus `PCM_AUDIO_CODECS`: `pcm-u8`, `pcm-s8`, `pcm-s16`, `pcm-s16be`, `pcm-s24`, `pcm-s24be`, `pcm-s32`, `pcm-s32be`, `pcm-f32`, `pcm-f32be`, `pcm-f64`, `pcm-f64be`, `ulaw`, `alaw`. `NON_PCM_AUDIO_CODECS` is the rest.
- Subtitle (`SUBTITLE_CODECS`): `webvtt` (write only).

PCM, μ-law, and A-law coders are built in and always work. Everything else uses WebCodecs or a registered custom coder.

Typical browser gaps (verify at runtime): MP3 and FLAC encode (none), AAC encode (Firefox and some Linux builds), HEVC (platform-dependent), AV1 encode (slow or missing on older hardware), ProRes / AC-3 / E-AC-3 / DTS (none).

## Encode checks

```ts
await canEncode('avc');                                       // 1280x720 / 2ch 48 kHz defaults
await canEncodeVideo('hevc', { width: 1920, height: 1080, frameRate: 60, quality: new Quality({ bitrate: 1e7 }) });
await canEncodeAudio('aac', { numberOfChannels: 1, sampleRate: 44100, quality: new Quality({ bitrate: 192e3 }) });
await canEncodeSubtitles('webvtt');
await getEncodableCodecs(); await getEncodableVideoCodecs(['avc', 'hevc', 'vp9'], { width: 1920, height: 1080 });
await getFirstEncodableVideoCodec(new Mp4OutputFormat().getSupportedVideoCodecs(), { width, height });
await getFirstEncodableAudioCodec(['opus', 'aac']);
```

Most `VideoEncodingConfig` / `AudioEncodingConfig` fields are accepted as constraints. Custom encoders count.

## Decode checks

```ts
await track.canDecode();                                     // best: uses the real track config
await canDecode('hevc');
await canDecodeVideo('hevc', { codedWidth: 3840, codedHeight: 2160 });
await canDecodeAudio('aac', { numberOfChannels: 6, sampleRate: 48000 });
await getDecodableVideoCodecs(); await getDecodableAudioCodecs();
```

## Custom coders

Register a class to polyfill a listed codec (you cannot add new codec ids). Registered classes win over WebCodecs when `supports()` returns true. Mediabunny serializes all instance method calls (no concurrency inside one instance).

### Encoder

```ts
import { CustomAudioEncoder, EncodedPacket, registerEncoder, type AudioCodec } from 'mediabunny';

class MyOpusEncoder extends CustomAudioEncoder {
	static override supports(codec: AudioCodec, config: AudioEncoderConfig) {
		return codec === 'opus' && config.numberOfChannels <= 2;
	}
	async init() { /* load WASM; read this.codec, this.config */ }
	async encode(sample: AudioSample) {
		// …produce bytes…
		this.onPacket(new EncodedPacket(bytes, 'key', sample.timestamp, sample.duration), {
			decoderConfig: { codec: 'opus', numberOfChannels, sampleRate, description }, // on first packet
		});
	}
	async flush() { /* emit all pending packets, then reset state */ }
	async close() { /* free resources */ }
}
registerEncoder(MyOpusEncoder);
```

- Video encoders get `encode(videoSample, options: VideoEncoderEncodeOptions)` (`options.keyFrame`).
- Emit packets in **decode order**, formatted per the Codec Registry.
- `flush()` resolves only after every pending input is emitted, then resets for the next batch.
- Call `this.onError(err)` for failures in background work (workers, callbacks) (1.50+).

### Decoder

```ts
class MyDecoder extends CustomVideoDecoder {
	static override supports(codec: VideoCodec, config: VideoDecoderConfig) { return codec === 'hevc'; }
	async init() {}
	async decode(packet: EncodedPacket) { this.onSample(new VideoSample(frameOrResource, { timestamp: packet.timestamp, duration: packet.duration })); }
	async flush() {}
	async close() {}
}
registerDecoder(MyDecoder);
```

- Emit samples sorted by **timestamp**. With B-frames, hold frames internally and reorder; ordering resets at each `flush()`.
- Back samples with a `VideoSampleResource` / `AudioSampleResource` subclass to avoid copies (implement `getFormat`, `getCodedWidth/Height`, `getSquarePixelWidth/Height`, `getColorSpace`, `getDataPlanes`, `toRgbSample`, `close`; audio: `getFormat`, `getSampleRate`, `getNumberOfFrames`, `getNumberOfChannels`, `getTimestamp`, `getDataPlane`, `close`).

## Extension packages

All peer-depend on `mediabunny`; keep versions identical. Each bundles its worker and WASM into one file (no CDN, no WASM URL config) and works in browsers, Node, Bun, and Deno. Call `register*()` once at startup, before any Mediabunny operation that needs the codec.

| Package | Install | Register | Notes |
| --- | --- | --- | --- |
| `@mediabunny/mp3-encoder` | `bun add mediabunny @mediabunny/mp3-encoder` | `registerMp3Encoder()` | LAME, ~55× realtime |
| `@mediabunny/aac-encoder` | `bun add mediabunny @mediabunny/aac-encoder` | `registerAacEncoder()` | AAC-LC only |
| `@mediabunny/flac-encoder` | `bun add mediabunny @mediabunny/flac-encoder` | `registerFlacEncoder()` | Encoder only; FLAC decode is native in browsers |
| `@mediabunny/ac3` | `bun add mediabunny @mediabunny/ac3` | `registerAc3Decoder()`, `registerAc3Encoder()` | AC-3 + E-AC-3 |
| `@mediabunny/dts` | `bun add mediabunny @mediabunny/dts` | `registerDtsDecoder()`, `registerDtsEncoder()` | 1.55+ |
| `@mediabunny/prores` | `bun add mediabunny @mediabunny/prores` | `registerProresDecoder()` | Decoder only; fastest with cross-origin isolation (`COOP: same-origin`, `COEP: require-corp` or `credentialless` — not Safari); slower threading fallback otherwise |
| `@mediabunny/server` | `bun add mediabunny @mediabunny/server` | `registerMediabunnyServer(options?)` | All codecs on Node / Bun / Deno |

Prefer native support when it exists:

```ts
if (!(await canEncodeAudio('aac'))) {
	registerAacEncoder();
}
```

Script-tag builds expose globals `MediabunnyMp3Encoder`, `MediabunnyAacEncoder`, `MediabunnyFlacEncoder`, `MediabunnyAc3`, `MediabunnyDts`, `MediabunnyProres` next to `Mediabunny` (files on the GitHub releases page).

## `@mediabunny/server`

Wraps NodeAV (N-API bindings to the FFmpeg C API; npm `node-av`). Adds:

- Decoders + encoders: AVC, HEVC (length-prefixed and Annex B), VP8, VP9 (alpha), AV1, ProRes (alpha); AAC (raw + ADTS), MP3, Vorbis, Opus, FLAC, AC-3, E-AC-3, DTS.
- A libavfilter-based `VideoSample.transform()` (resize, rotate, flip, crop), which also powers Conversion resizing.
- Automatic hardware acceleration (VideoToolbox, VAAPI, NVENC, … when present), threaded coders, zero-copy decode → encode, constant-quantizer support.

```ts
import { registerMediabunnyServer } from '@mediabunny/server';
import * as NodeAv from 'node-av';

registerMediabunnyServer();                    // auto-detect HW context on first use
registerMediabunnyServer({ hardwareContext: null }); // software only
registerMediabunnyServer({
	hardwareContext: NodeAv.HardwareContext.create(NodeAv.AV_HWDEVICE_TYPE_VAAPI, '/dev/dri/renderD128'),
});
registerMediabunnyServer({ hardwareContext: (codecId) => pickContextFor(codecId) }); // per codec, not cached
```

Per-call opt-out: `hardwareAcceleration: 'prefer-software'` on encoding configs or sinks.

Hardware encoding and quality mode: in 1.61, a video encode in quantizer mode uses a hardware encoder only when it is NVENC; otherwise it falls back to the software encoder. Named levels (`new Quality('medium')`) choose quantizer mode when available. To keep hardware encoding on VideoToolbox, VAAPI, or QSV, use a bitrate-based quality: `new Quality({ quality: 'medium', preferBitrate: true })` or `new Quality({ bitrate })`. Transparent VP9 (`alpha: 'keep'`) always uses libvpx.

Bridging with NodeAV frames (zero-copy):

```ts
import { AvFrameVideoSampleResource, AvFrameAudioSampleResource, toAvFrame } from '@mediabunny/server';
new VideoSample(new AvFrameVideoSampleResource(frame), { timestamp });
new AudioSample(new AvFrameAudioSampleResource(frame));   // timestamp from the frame
await toAvFrame(videoSample, frame);  // refs instead of copies when already AVFrame-backed; video time base 1/1e6
await toAvFrame(audioSample, frame);  // audio time base 1/sampleRate
```

Server-side frame processing options:

1. `await sample.transform({ width, height, fit, crop, rotate, flip })`.
2. NodeAV filter graphs inside `Conversion` `video.process` (which may return a `VideoSampleResource` directly):

   ```ts
   import { Frame, FilterAPI } from 'node-av';
   async function* one(f: Frame) { yield f; }

   video: {
   	process: async (sample) => {
   		using inFrame = new Frame();
   		inFrame.alloc();
   		await toAvFrame(sample, inFrame);
   		using filter = FilterAPI.create('format=gray');
   		for await (const outFrame of filter.frames(one(inFrame))) {
   			return outFrame && new AvFrameVideoSampleResource(outFrame);
   		}
   		return null;
   	},
   },
   ```
3. Canvas polyfills (Skia Canvas, `@napi-rs/canvas`): `copyTo(imageData.data, { format: 'RGBA' })` → draw → `new VideoSample(pixels, { format: 'RGBA', codedWidth, codedHeight, timestamp, duration })`.

Server inputs/outputs: `FilePathSource`, `ReadableStreamSource(Readable.toWeb(req))`, `CustomSource` (S3 ranged GETs), `FilePathTarget`, `StreamTarget`, `AppendOnlyStreamTarget`.

`node-av` ships prebuilt FFmpeg binaries per platform; check its install output on the target OS and CPU architecture (Docker `linux/arm64` vs `amd64`) when installs fail.

## Logging (1.49+)

```ts
import { Logging, LogLevel } from 'mediabunny';
Logging.level = LogLevel.Warnings;   // Silent | Errors | Warnings | Info (default)
const off = Logging.on('warn', (args) => logger.warn(...args)); // also 'error', 'info'
```

Use `LogLevel.Silent` + `Logging.on` in CLIs and servers to route logs into your logger.
