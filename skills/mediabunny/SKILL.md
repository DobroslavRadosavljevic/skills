---
name: mediabunny
description: "Build, review, debug, migrate, or plan Mediabunny 1.61 (mediabunny npm) TypeScript media pipelines in the browser and on the server. Use for reading, writing, converting, transmuxing, transcoding, trimming, compressing, resizing, cropping, rotating, or resampling MP4/MOV/WebM/MKV/MP3/WAV/Ogg/ADTS/FLAC/MPEG-TS/CMAF/HLS media; Input, Output, Conversion, BlobSource, UrlSource, FilePathSource, BufferTarget, StreamTarget, PathedTarget, EncodedPacketSink, VideoSampleSink, CanvasSink, AudioBufferSink, VideoSampleSource, CanvasSource, MediaStream sources, Quality, metadata tags, thumbnails, waveforms, playback, recording, HLS read/write, WebCodecs, custom coders, and the @mediabunny/server, mp3-encoder, aac-encoder, flac-encoder, ac3, dts, and prores extensions. Also for mp4-muxer/webm-muxer or FFmpeg CLI/ffmpeg.wasm migrations."
---

# Mediabunny

Use this skill when code reads, writes, converts, records, streams, or plays media files with `mediabunny` or its `@mediabunny/*` extensions.

Snapshot: `mediabunny@1.61.0` and all seven `@mediabunny/*` extensions at `1.61.0` (released 2026-09-29, captured 2026-10-03). Refresh from [source-map.md](references/source-map.md) when versions differ or the user asks for "latest".

## Workflow

1. Inspect the local surface:
   - `mediabunny` version in `package.json` / lockfile. Many APIs are version-gated; check [source-map.md](references/source-map.md) "Version timeline".
   - Runtime: browser main thread, Worker, Node / Bun / Deno, Electron, React Native. Server work needs `@mediabunny/server` for any decode, encode, or frame transform.
   - Which extensions are installed and whether their `register*()` call runs before the first Mediabunny operation.
   - Existing FFmpeg, ffmpeg.wasm, `mp4-muxer`, `webm-muxer`, MediaRecorder, or hand-written WebCodecs code that Mediabunny replaces.
2. Pick the abstraction level (highest level that works):
   - File → file (convert, compress, trim, extract audio, transmux): `Conversion`. Read [conversion.md](references/conversion.md).
   - Metadata, thumbnails, frames, audio data, playback: `Input` + a sink. Read [reading.md](references/reading.md) and [sinks-and-samples.md](references/sinks-and-samples.md).
   - New files from canvas, generated frames, mic/camera, or your own packets: `Output` + a media source. Read [writing.md](references/writing.md).
   - HLS (`.m3u8`) in or out: [hls.md](references/hls.md).
   - Codec support checks, polyfills, custom coders, server setup, extensions: [codecs-and-extensions.md](references/codecs-and-extensions.md).
3. Start from a matching recipe in [recipes.md](references/recipes.md) when one exists.
4. When a call misbehaves, check [troubleshooting.md](references/troubleshooting.md) before inventing workarounds.
5. When an exact signature matters and is not covered here, read the official `.d.ts` (`https://mediabunny.dev/mediabunny.d.ts`, or `node_modules/mediabunny/dist/mediabunny.d.ts`). It holds the full public API with thorough doc comments.

## Core Judgment

- Mental model: **Input** (demux from a *source*) → **sink** (packets or decoded samples) … **media source** (samples or packets in) → **Output** (mux to a *target*). `Conversion` wires both ends with pipelining and backpressure.
- All times are **floating-point seconds**, never WebCodecs microseconds. Timestamps can be negative or start after zero. Use `getFirstTimestamp()`, never assume `0`.
- Reads are **lazy**. `new Input(...)` and `new XSink(...)` cost nothing. `get*` methods read metadata; `compute*` methods may scan the file.
- Prefer **async getters** (`await track.getDisplayWidth()`, `getCodec()`). The sync getters (`track.displayWidth`, `track.codec`, …) are deprecated.
- Use **`quality: new Quality(...)`**. Every `bitrate` option is deprecated since 1.52. Named levels map to constant-quality (quantizer) encoding when the encoder supports it.
- **Always `await`** `source.add(...)`. The promise carries backpressure. Unawaited adds blow up memory.
- **Close** every `VideoSample` / `AudioSample` you receive or create (`sample.close()` or `using sample = ...`). Unclosed frames stall hardware decoders. `CanvasSink` and `AudioBufferSink` hand out non-closable data instead.
- **Dispose** inputs (`input.dispose()` or `using input = new Input(...)`). `FilePathSource` holds a file handle until disposal.
- Pass only the **formats** you need (`[MP4, WEBM]`) for tree shaking. `ALL_FORMATS` pulls in every demuxer. HLS needs `HLS_FORMATS` (or a list that includes `HLS` and the segment formats).
- Check before you run: `track.canDecode()`, `canEncodeVideo/Audio`, `getFirstEncodableVideoCodec(format.getSupportedVideoCodecs())`, and `conversion.isValid` + `conversion.discardedTracks`.
- `Conversion` copies packets (lossless, fast) whenever options allow. Resize, rotate, crop, `codec` change, `quality`, `keyFrameInterval`, `process`, resample, and `forceTranscode` force a transcode. Since 1.56, trims can stay on the copy path (see `copy` options).
- `BufferTarget` is for files under ~100 MB. Stream larger outputs with `StreamTarget` (random-access writes, honor `chunk.position`), `FilePathTarget` (server), or `AppendOnlyStreamTarget` (only with append-only formats such as fragmented MP4, append-only WebM, MPEG-TS, Ogg, ADTS).
- Multi-track outputs in packet-buffering formats (fragmented MP4, HLS) need **interleaved** feeding and early `source.close()`.
- On the server, call `registerMediabunnyServer()` once at startup; without it there are no decoders, encoders, or `VideoSample.transform()`. Pure demux/mux work (metadata, packet copy, transmux, copy trims) and PCM audio (WAV, resampling) run on Node / Bun / Deno without it.
- Mediabunny must load **once**. Two copies (duplicate versions, bad bundling) log a warning and break `instanceof` checks and coder registration.
- Mediabunny does not read subtitles, does not write HLS subtitles, and cannot add new codecs (custom coders only polyfill the listed codec IDs).

## Verification

Prefer repository-owned commands. For meaningful Mediabunny work, cover the relevant subset:

- Typecheck (`bunx tsc --noEmit` or the repo script). Mediabunny types need TypeScript ≥ 5.7.
- Round-trip check: read the produced file back with `new Input({ source: new BufferSource(buf), formats: ALL_FORMATS })` and assert codec, `computeDuration()`, dimensions, and track count.
- For conversions: log `conversion.isValid`, `discardedTracks` reasons, and `utilizedTracks` before `execute()`.
- Browser features: test in the target browsers. WebCodecs codec support differs (AAC, HEVC, AV1 encode, MP3/FLAC encode). Use `getEncodableCodecs()` output in the report.
- Server: run one real file through `registerMediabunnyServer()` + `Conversion` on the target OS; confirm `node-av` installed its prebuilt binary.
- Memory-sensitive pipelines: watch for "sample wasn't closed" warnings and heap growth during a long file.

Report which checks ran, which did not, and any version or browser-support assumptions that remain.
