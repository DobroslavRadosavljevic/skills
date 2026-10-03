# Troubleshooting and Pitfalls

Symptom → cause → fix. Check the installed version first; many fixes landed in 1.5x patch releases.

## Setup and environment

| Symptom | Cause | Fix |
| --- | --- | --- |
| Console: "Mediabunny was loaded twice" | Two copies in the bundle (version mismatch between app and an extension or a dependency, or CJS + ESM both bundled) | Dedupe to one version (`bun pm ls mediabunny`), align `@mediabunny/*` versions, use one module format |
| `VideoDecoder is not defined` / missing WebCodecs | Insecure context (http, not localhost), old browser, or server without the extension | Serve over HTTPS; on the server call `registerMediabunnyServer()` first |
| `transform()` throws on the server | No transformer registered | `registerMediabunnyServer()` or `registerVideoSampleTransformer(...)` |
| Types fail to compile | TypeScript < 5.7, or missing DOM / WebCodecs libs in a server tsconfig | Upgrade TypeScript; include `"lib": ["ES2022", "DOM"]` (the d.ts references DOM WebCodecs types) |
| Huge bundle | `ALL_FORMATS` or `import *` | Import only the needed formats and classes; keep ESM for tree shaking |
| Extension worker never starts under Bun / Deno | Pre-1.61 worker bug | Upgrade to ≥ 1.61.0 |
| `@mediabunny/prores` slow | No cross-origin isolation | Send `COOP: same-origin` + `COEP: require-corp` (or `credentialless`) |
| `node-av` install fails | No prebuilt binary for the platform/arch | Check the `node-av` install log; match Docker `--platform`; use a supported glibc base image |

## Reading

| Symptom | Cause | Fix |
| --- | --- | --- |
| `UnsupportedInputFormatError` | Format not in `formats`, or not a supported container | Use `ALL_FORMATS` to test; check `input.canRead()` |
| `UrlSource` fails at once, no retries | CORS (cross-origin without headers) | Allow the origin and expose `Content-Range`, `Content-Length`, `Accept-Ranges` |
| `UrlSource` downloads the whole file | Server ignores `Range` (returns 200) | Enable range requests; since 1.53 the cache honors `maxCacheSize` even on 200 |
| `getCodec()` is `null` | Codec unknown to Mediabunny | Inspect `getInternalCodecId()`; cannot be decoded |
| `canDecode()` false | Browser lacks the decoder (HEVC, AC-3, DTS, ProRes) | Register the matching extension; on the server use `@mediabunny/server` |
| Duration call never resolves | Live HLS input | Pass `{ skipLiveWait: true }` |
| Timestamps look like `1.7e9` | HLS `PROGRAM-DATE-TIME` offset | Expected; or set `formatOptions.hls.offsetTimestampsByDateTime: false` |
| First frame missing or black start | Non-zero or negative start timestamp | Seek from `await track.getFirstTimestamp()`, not 0 |
| Decoder errors on seek | Delta frames mislabeled as key in the container | `{ verifyKeyPackets: true }` on `EncodedPacketSink` |
| Wrong orientation in manual drawing | Ignored rotation/flip metadata | Use `sample.draw()` / `CanvasSink` (they honor it), not `toCanvasImageSource()` |
| `InputDisposedError` | Use after `dispose()` / end of `using` scope | Keep the input alive until sinks and conversions finish |
| File handle leak on the server | `FilePathSource` input never disposed | `using input = …` or `input.dispose()` |

## Decoding and memory

| Symptom | Cause | Fix |
| --- | --- | --- |
| Decoding stalls after a few frames, warnings about unclosed samples | `VideoSample`s held open (hardware decoders have small frame pools) | `close()` every sample (`using`); clone only when needed |
| High VRAM with `CanvasSink` | New canvas per frame | `poolSize: 1–3` |
| Pooled canvas content changes | Canvas reused by the pool | Copy out before the next yield |
| Manual iterator leaks decoders | Iterator never finished | `await it.return()` |
| `toCanvasImageSource()` frame already closed | Internal frames close next microtask | Draw immediately |
| Slow random seeks | Far from keyframes / long GOPs | Expected; for scrubbing use keyframe thumbnails or `CanvasSink` with small size |

## Writing

| Symptom | Cause | Fix |
| --- | --- | --- |
| Memory grows without bound | Unawaited `add()` calls | `await source.add(...)` |
| Memory grows in fragmented MP4 / HLS | Packet buffering: one track far ahead | Interleave tracks, `close()` finished sources |
| Page crashes on large output | `BufferTarget` + `fastStart: 'in-memory'` | `StreamTarget` to disk, `fastStart: false` or `'fragmented'` |
| Corrupt file from `StreamTarget` | Chunks concatenated, `position` ignored | Write at `chunk.position` in arrival order, or use an append-only format + `AppendOnlyStreamTarget` |
| `addVideoTrack` throws | Codec not allowed in container, or track limits | Check `format.getSupportedVideoCodecs()` / `getSupportedTrackCounts()` |
| Error after frame size change | `sizeChangeBehavior: 'deny'` (default) | `'contain'`, `'cover'`, `'fill'`, or `'passThrough'` |
| Duplicate timestamps / dropped frames | `frameRate` metadata set and frames added faster than the rate | Match add rate to `frameRate`; use exact fractions (`30000/1001`) |
| `output.getMimeType()` hangs | Awaited before media was added | Call it without awaiting, or after adding media |
| `fastStart: 'reserve'` error | Missing or exceeded `maximumPacketCount` | Set it on every track with ~33 % margin |
| Recording silently stops | MediaStream source internal error | Handle `source.errorPromise` and cancel the output |
| Encoder throws for AAC/MP3/FLAC | No native encoder | `register*Encoder()` extension, or pick another codec via `getFirstEncodableAudioCodec` |
| Transparent video comes out opaque | `alpha` defaults to `'discard'`; wrong container | `alpha: 'keep'` + VP8/VP9 in WebM/MKV (or ProRes 4444 via server); canvas `{ alpha: true }`; read with `CanvasSink({ alpha: true })` |
| QuickTime hides WebVTT | Missing alignment | Add `align:center` to cues |
| Files fail in Safari / iOS | VP9/AV1/Opus support, fragmented MP4 seeking | Prefer AVC + AAC in regular MP4 for widest playback |
| Server encode is slow despite a GPU | Quantizer mode (named `Quality` levels) forces software unless NVENC | `new Quality({ quality: 'medium', preferBitrate: true })` or explicit bitrate |

## Conversion

| Symptom | Cause | Fix |
| --- | --- | --- |
| `isValid` false | All needed tracks discarded | Inspect `discardedTracks[].reason`; see the conversion reference |
| Unexpected transcode (slow) | An option forces it (`quality`, size, rotate, `keyFrameInterval`, `process`, resample, `codec`) or the container cannot hold the codec | Remove those options; target a container that holds the source codec |
| Trim cut is off by up to a GOP | Copy path aligns to keyframes | `boundaryPolicy: 'shrink'`, tighten `boundaryTolerance`, or `copy: false` for exact cuts |
| Output starts at 0 but should keep the TS offset | Default trim shifts to 0 | `trim: { start: 0 }` |
| Progress stuck at 1 | Finalization still running | Await `execute()` |
| `ConversionCanceledError` | `cancel()` was called | Catch and treat as user abort |
| `options.output must be fresh…` | Tracks, tags, or `start()` applied before `Conversion.init` | Use `composable: true` or a new `Output` |
| `options.output must not have been started yet.` | Composable conversion initialized after `output.start()` | `Conversion.init` all composable parts first, then `start()`, then `execute()` |
| `TypeError` on `width`/`height`/`processedWidth` | Non-integer values (e.g. `w * 0.5`) | `Math.round` (or `roundDimensionsTo` on `VideoSample.transform`) |

## Deprecated → current

| Deprecated | Use |
| --- | --- |
| `bitrate: number \| Quality` (all configs) | `quality: new Quality(...)` |
| `QUALITY_LOW`, `QUALITY_HIGH`, … | `new Quality('low')`, … |
| `bitrateMode` on encoding configs | `new Quality({ bitrate, bitrateMode })` |
| `allowRotationMetadata` | `allowTransformationMetadata` |
| `format.supportsVideoRotationMetadata` | `format.supportsVideoTransformationMetadata` |
| `StreamSource` / `StreamSourceOptions` | `CustomSource` / `CustomSourceOptions` |
| `source.onread` / `target.onwrite` | `source.on('read', …)` / `target.on('write', …)` |
| Sync track getters (`track.codec`, `displayWidth`, `languageCode`, …) | Async `getCodec()`, `getDisplayWidth()`, `getLanguageCode()`, … |

## Migrating from other tools

- **mp4-muxer / webm-muxer**: `Muxer` → `Output` + `Mp4OutputFormat` / `WebMOutputFormat`; `ArrayBufferTarget` → `BufferTarget`; `muxer.addVideoChunk(chunk, meta)` → `EncodedVideoPacketSource.add(EncodedPacket.fromEncodedChunk(chunk), meta)`; `fastStart` options carry over. Official guides are listed in the source map.
- **FFmpeg CLI / ffmpeg.wasm**: `-c copy` is the default behavior; `-ss/-to` → `trim`; `-vf scale=-2:720` → `video: { height: 720 }`; `-crf 23` → `new Quality({ quantizer: 23 })`; `-b:v 2M` → `new Quality({ bitrate: 2e6 })`; `-an` / `-vn` → `discard: true`; `-ac 1 -ar 16000` → `numberOfChannels`, `sampleRate`; `-map_metadata -1` → `tags: {}`; `-movflags +faststart` → `fastStart: 'in-memory'`; `-f hls` → `HlsOutputFormat`. Filters without a Mediabunny equivalent go in `process` (Canvas in browsers, NodeAV filter graphs on the server).
- **MediaRecorder**: `MediaStreamVideoTrackSource` / `MediaStreamAudioTrackSource` give codec, quality, container, and keyframe control, plus pause without gaps.
