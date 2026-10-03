# Writing Media Files

Contents: Output lifecycle · track metadata · track groups · metadata tags · targets · pathed targets · media sources · encoding config · Quality · backpressure and packet buffering · output formats · codec/container table · MIME types.

## Output lifecycle

```ts
import { Output, Mp4OutputFormat, BufferTarget } from 'mediabunny';

const output = new Output({
	format: new Mp4OutputFormat(),
	target: new BufferTarget(),
	// initTarget?: Target | (() => Target),  // CMAF init segment
	// onFinalize?: () => MaybePromise<unknown>, // awaited at end of finalize()
});

output.addVideoTrack(videoSource, { frameRate: 30 });
output.addAudioTrack(audioSource);
output.setMetadataTags({ title: 'Demo' });   // before start()
await output.start();                        // no more tracks after this
// … await source.add(...) …
await output.finalize();                     // or: await output.cancel()
output.target.buffer;                        // ArrayBuffer (BufferTarget)
```

- `output.state`: `'pending' → 'started' → 'finalizing' → 'finalized'`, or `'canceled'`. A failed `finalize()` moves to `'canceled'` (1.57+).
- `output.hasEnoughTracks()` checks the format's minimum track counts before `start()`.
- One media source feeds exactly one track.
- `addXTrack` throws when the format cannot hold the track. Check `format.getSupportedTrackCounts()` and the codec table.

## Track metadata

`BaseTrackMetadata` (all tracks): `languageCode` (ISO 639-2/T), `name`, `disposition: Partial<{ default, primary, forced, original, commentary, hearingImpaired, visuallyImpaired }>`, `maximumPacketCount`, `bitrate`, `averageBitrate`, `isRelativeToUnixEpoch`, `group`.

`VideoTrackMetadata` adds: `rotation`, `flip`, `transformationMatrix` (overrides rotation/flip), `frameRate` (snaps all timestamps; use `30000/1001`, `24000/1001`, `60000/1001` for NTSC rates), `hasOnlyKeyPackets`, `canBeTransparent` (1.60+), `decoderConfig`, `primingPacket`.

`AudioTrackMetadata` adds: `decoderConfig`, `primingPacket`.

- `decoderConfig` ahead of time allows **zero-packet tracks** (1.53+).
- `maximumPacketCount` is required for every track with `fastStart: 'reserve'`. Exceeding it throws. Estimate one packet per video frame and one per ~10 ms or 512 samples of audio, plus ~33 % margin.

## Track groups (pairability)

Matters for HLS master playlists; ignored by single-file formats.

```ts
const a = new OutputTrackGroup(); const b = new OutputTrackGroup();
a.pairWith(b);                                   // symmetric
output.addVideoTrack(v, { group: a });
output.addAudioTrack(s, { group: [a, b] });
output.addAudioTrack(x, { group: [] });          // standalone
```

Pairable = same group and different type, or in two paired groups. Default: everything in `output.defaultTrackGroup` (different types pair, same types never pair). Same-type pairs are illegal in HLS and get a warning.

## Metadata tags

```ts
output.setMetadataTags({
	title, artist, album, albumArtist, date: new Date('2008-05-20'), genre, comment, lyrics,
	trackNumber, tracksTotal, discNumber, discsTotal, beatsPerMinute,
	images: [{ data: jpegBytes, mimeType: 'image/jpeg', kind: 'coverFront' }],
	raw: { TXXX: '…' },   // container-native keys
});
```

Format control: MP4 `metadataFormat: 'auto' | 'mdir' | 'mdta' | 'udta'` (`mdta` = arbitrary custom keys, like FFmpeg `use_metadata_tags`); WAVE `metadataFormat: 'info' | 'id3'` (`id3` for rich tags and cover art).

## Targets

All targets: `target.on('write', ({ start, end }) => …)` (very chatty; use for size tracking), `target.slice(offset)` → `RangedTarget`.

| Target | Use | Notes |
| --- | --- | --- |
| `BufferTarget({ onFinalize?(buffer) })` | Small files (< ~100 MB), uploads needing `Content-Length` | `buffer` is null until finalized |
| `StreamTarget(writable, { chunked?, chunkSize? })` | Large files, File System Access API, custom sinks | Chunks are `{ data, position }`; **write at `position`**, regions can be rewritten; `chunked` batches into 16 MiB blocks; writable is closed on finalize/cancel; backpressure honored |
| `AppendOnlyStreamTarget(writable<Uint8Array>)` | HTTP upload streams, MSE `appendBuffer`, pipes | Only with append-only format configs |
| `FilePathTarget(path, { chunked = true, chunkSize? })` | Node / Bun / Deno | Closes the handle on finalize/cancel |
| `NullTarget()` | Discard bytes; consume via format callbacks (`onMoof`, `onCluster`, `onPage`, HLS `onMaster`) | — |
| `PathedTarget(rootPath, ({ path, isRoot, mimeType }) => Target)` | Multi-file outputs (HLS) | Callback may be async; return a **new** target per call |

File System Access API: `new StreamTarget(await handle.createWritable(), { chunked: true })` (`FileSystemWritableFileStream` accepts the chunk shape).

## Media sources

All sources: `await source.add(...)` (backpressure), `source.close()` when that track is done (lets the muxer stop waiting for it).

### Video

| Source | Input | Notes |
| --- | --- | --- |
| `VideoSampleSource(config)` | `add(videoSample, encodeOptions?)` | `encodeOptions` e.g. `{ keyFrame: true }` or `{ avc: { quantizer: 40 } }` |
| `CanvasSource(canvas, config)` | `add(timestamp, duration?, encodeOptions?)` | Captures canvas state at call time; HTML or Offscreen canvas |
| `MediaStreamVideoTrackSource(track, config, { frameRate?, timestampBase? })` | Automatic after `start()` | `pause()` / `resume()` (no gap in output); watch `errorPromise`; `latencyMode` auto `'realtime'`; `frameRate: null` = only pushed frames |
| `EncodedVideoPacketSource(codec)` | `add(packet, meta?)` | You encode; first `add` needs `meta.decoderConfig`; decode order |

### Audio

| Source | Input | Notes |
| --- | --- | --- |
| `AudioSampleSource(config)` | `add(audioSample)` | — |
| `AudioBufferSource(config, { startTimestamp? })` | `add(audioBuffer)` | Buffers play back to back from `startTimestamp` (default 0) |
| `MediaStreamAudioTrackSource(track, config, { timestampBase? })` | Automatic | Same pause/resume/`errorPromise` rules |
| `EncodedAudioPacketSource(codec)` | `add(packet, meta?)` | First `add` needs `decoderConfig` (`codec`, `numberOfChannels`, `sampleRate`, `description?`) |

`timestampBase` for MediaStream sources: `'synced-zero'` (default: earliest media across all stream tracks is 0, tracks stay in sync), `'zero'` (this source's first sample is 0), `'unix'` (wall clock; pair with `isRelativeToUnixEpoch: true`; pauses leave gaps).

### Subtitles

`TextSubtitleSource('webvtt')`: `add(text)` the whole file then `close()`, or add the `WEBVTT` preamble first and then whole cues per chunk. WebVTT can be written into MP4, MKV, and WebM. QuickTime wants `align:center` cue settings.

### EncodedVideoPacketSource rules

- `decoderConfig` must contain `codec`, `codedWidth`, `codedHeight` (+ `description` where the Codec Registry requires it; `colorSpace` optional).
- Add in **decode order**. Timestamps are presentation timestamps.
- A packet must not have a smaller timestamp than the largest timestamp added before the most recent key frame.

## Video encoding config (`VideoEncodingConfig`)

```ts
{
	codec: 'avc' | 'hevc' | 'vp8' | 'vp9' | 'av1' | 'prores',
	quality: Quality,                       // required for video
	alpha?: 'discard' | 'keep',             // keep needs WebM/MKV (VP8/VP9) or ProRes 4444 via server
	latencyMode?: 'quality' | 'realtime',
	keyFrameInterval?: number,              // seconds, default 2; keep equal across video tracks
	fullCodecString?: string,               // e.g. 'avc1.640028'; must match codec
	hardwareAcceleration?: 'no-preference' | 'prefer-hardware' | 'prefer-software',
	scalabilityMode?: string,               // WebRTC-SVC, e.g. 'L1T2'
	contentHint?: string,                   // 'motion' | 'detail' | 'text'
	sizeChangeBehavior?: 'deny' | 'passThrough' | 'fill' | 'contain' | 'cover', // default 'deny'
	transform?: {
		width?, height?, fit?, rotate?, flip?, crop?, frameRate?,
		process?: (sample) => MaybePromise<CanvasImageSource | VideoSample | VideoSampleResource | (…)[] | null>,
		force?: boolean,                    // run transform step even with no options (bakes rotation)
	},
	onEncodedPacket?: (packet, meta) => unknown, // progress, live forwarding
	onEncoderConfig?: (config) => unknown,       // inspect final codec string
}
```

`transform` lets one decoded frame feed several sources at different sizes (HLS ladders). Do not set `transform.fit` when `sizeChangeBehavior` is `'fill' | 'contain' | 'deny'`.

## Audio encoding config (`AudioEncodingConfig`)

```ts
{
	codec: AudioCodec,                      // optional for PCM
	quality?: Quality,                      // unused for PCM
	fullCodecString?: string,               // e.g. 'mp4a.40.2'
	transform?: { numberOfChannels?, sampleRate?, process?: (sample) => MaybePromise<AudioSample | AudioSample[] | null> },
	onEncodedPacket?, onEncoderConfig?,
}
```

## Quality

```ts
new Quality('very-low' | 'low' | 'medium' | 'high' | 'very-high');
new Quality(0.6);                                       // 0..1
new Quality({ quality: 'medium', preferBitrate: true }); // force bitrate mode for predictable size
new Quality({ bitrate: 2e6 });                          // VBR
new Quality({ bitrate: 2e6, bitrateMode: 'constant' }); // CBR
new Quality({ quantizer: 26 });                         // throws if quantizer mode unavailable
new Quality({ quantizer: 26, bitrate: 2e6 });           // quantizer, bitrate fallback
```

Named/0–1 levels scale with codec and resolution and use quantizer (constant quality) where supported, else bitrate. Quantizer scales: AVC/HEVC 0–51, VP9 0–63, AV1 0–255 (lower = better). Deprecated: `bitrate:` fields, `QUALITY_HIGH` etc.

## Backpressure and packet buffering

- `await` every `add()`. `StreamTarget` writable slowness and encoder queues flow back through it.
- Formats that need all tracks' data for a time span before writing (**fragmented MP4, HLS**) buffer packets. Feed tracks interleaved (e.g. 1–10 s chunks per track), or add the smaller track (audio) first. `close()` each source as soon as it is done.
- Plain MP4 with default `fastStart` and `BufferTarget` keeps all media in memory until finalize (`'in-memory'`). For large files, use `StreamTarget` + `fastStart: false`, or `'fragmented'`, or `'reserve'` + `maximumPacketCount`.

## Output formats

Common members: `fileExtension`, `mimeType`, `getSupportedCodecs/VideoCodecs/AudioCodecs/SubtitleCodecs()`, `getSupportedTrackCounts()`, `supportsVideoTransformationMetadata`, `supportsTimestampedMediaData`, `negativeTimestampSupport` (`'full'` ISOBMFF, `'prefer-non-negative'` MKV/WebM/TS, `'none'` Ogg, `null` MP3/WAV/ADTS/FLAC).

| Class | Options | Append-only |
| --- | --- | --- |
| `Mp4OutputFormat`, `MovOutputFormat` | `fastStart: false \| 'in-memory' \| 'reserve' \| 'fragmented'` (default: `'in-memory'` with `BufferTarget`, else `false`), `minimumFragmentDuration` (1 s), `metadataFormat`, callbacks `onFtyp`, `onMoov`, `onMdat`, `onMoof(data, pos, timestamp)` | `'fragmented'`; `'in-memory'` (bulk at end) |
| `CmafOutputFormat` | Same minus `fastStart`; `minimumFragmentDuration` default `Infinity`; needs `OutputOptions.initTarget` | — |
| `WebMOutputFormat`, `MkvOutputFormat` | `appendOnly` (live; hurts duration/seeking), `minimumClusterDuration` (1 s), `onEbmlHeader`, `onSegmentHeader`, `onCluster(data, pos, timestamp)` | `appendOnly: true` |
| `OggOutputFormat` | `maximumPageDuration`, `onPage(data, pos, source)` | always |
| `Mp3OutputFormat` | `xingHeader` (default true), `onXingFrame` | `xingHeader: false` |
| `WavOutputFormat` | `large` (RF64, > 4 GiB), `metadataFormat: 'info' \| 'id3'`, `onHeader` | — |
| `AdtsOutputFormat` | `onFrame` | always |
| `FlacOutputFormat` | `appendOnly` (inexact STREAMINFO), `onFrame` | `appendOnly: true` |
| `MpegTsOutputFormat` | `onPacket` (each 188-byte TS packet) | always |
| `HlsOutputFormat` | see the HLS reference | playlists yes; segments per segment format |

Fragmented MP4 is ideal for streaming and long recordings, but some players cannot seek it. Use regular MP4 for downloads.

## Codec / container table

|            | mp4 | mov | mkv | webm | ogg | mp3 | wav | aac | flac | ts |
|------------|-----|-----|-----|------|-----|-----|-----|-----|------|----|
| avc, hevc  | ✓ | ✓ | ✓ |   |   |   |   |   |   | ✓ |
| vp8, vp9, av1 | ✓ | ✓ | ✓ | ✓ |   |   |   |   |   |   |
| prores     | ✓ | ✓ | ✓ |   |   |   |   |   |   |   |
| aac        | ✓ | ✓ | ✓ |   |   |   |   | ✓ |   | ✓ |
| opus, vorbis | ✓ | ✓ | ✓ | ✓ | ✓ |   |   |   |   |   |
| mp3        | ✓ | ✓ | ✓ |   |   | ✓ |   |   |   | ✓ |
| flac       | ✓ | ✓ | ✓ |   |   |   |   |   | ✓ |   |
| ac3, eac3, dts | ✓ | ✓ | ✓ |   |   |   |   |   |   | ✓ |
| pcm-s16/s24/s32/f32 (LE) | ✓ | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| pcm-u8     |   | ✓ | ✓ |   |   |   | ✓ |   |   |   |
| pcm-s16be/s24be/s32be, pcm-f64 | ✓ | ✓ | ✓ |   |   |   |   |   |   |   |
| pcm-f32be, pcm-f64be | ✓ | ✓ |   |   |   |   |   |   |   |   |
| pcm-s8     |   | ✓ |   |   |   |   |   |   |   |   |
| ulaw, alaw |   | ✓ |   |   |   |   | ✓ |   |   |   |
| webvtt (write only) | ✓ |   | ✓ | ✓ |   |   |   |   |   |   |

This mirrors the official table. Release 1.50.9 also added 64-bit float WAVE read/write, which the table does not list. When a cell matters, trust `format.getSupportedAudioCodecs()` at runtime over this table. HLS codec support follows the chosen segment format.

## MIME types

- `output.format.mimeType` → base type (`'video/mp4'`).
- `await output.getMimeType()` → full type with codecs, for `MediaSource.addSourceBuffer`. It resolves only after encoders produce config, so never await it before adding media (deadlock).
