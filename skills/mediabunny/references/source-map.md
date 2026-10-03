# Source Map

Docs, packages, and version history used to build this skill.

## Snapshot

- Captured: **2026-10-03**
- `mediabunny` npm `latest`: **1.61.0** (2026-09-29). A stale `beta` dist-tag points at `1.42.0-beta.11`; ignore it.
- GitHub `main` at capture: `1dd3971` (2026-10-02, "Fix color range issues for alpha frames"), unreleased after 1.61.0.
- License: MPL-2.0. Zero runtime dependencies. ESM (tree-shakable) + CJS bundles + `mediabunny.d.ts` global (`Mediabunny` namespace) for script tags.
- Requirements: ES2021+ runtime, TypeScript ≥ 5.7 for types. `package.json` maps `node:fs/promises` away for browser builds.

### Packages (all `1.61.0`, released in lockstep)

| Package | Adds | Peer / deps |
| --- | --- | --- |
| `mediabunny` | Core: demuxers, muxers, WebCodecs wrappers, Conversion, PCM coders | none |
| `@mediabunny/server` | libavcodec decoders + encoders for every codec, libavfilter `VideoSample.transform`, HW accel, threads (Node / Bun / Deno) | peer `mediabunny ^1.45.0`; deps `node-av ^6` (6.1.1 at capture), `@mediabunny/prores` |
| `@mediabunny/mp3-encoder` | LAME 3.100 WASM MP3 encoder (worker, SIMD, ~130 kB gz) | peer `mediabunny ^1.0.0` |
| `@mediabunny/aac-encoder` | FFmpeg AAC-LC WASM encoder | peer `mediabunny ^1.0.0` |
| `@mediabunny/flac-encoder` | libFLAC WASM encoder | peer `mediabunny ^1.0.0` |
| `@mediabunny/ac3` | AC-3 + E-AC-3 decoder and encoder (FFmpeg WASM) | peer `mediabunny ^1.0.0` |
| `@mediabunny/dts` | DTS decoder and encoder (FFmpeg WASM) | peer `mediabunny ^1.0.0` |
| `@mediabunny/prores` | TurboRes WASM ProRes decoder (all flavors) | peer `mediabunny ^1.49.0`; dep `turbores` |

Keep `mediabunny` and every `@mediabunny/*` on the same version.

Third-party packages built on Mediabunny exist (players, editors, HEVC polyfills, React wrappers). They are not official; evaluate them separately.

## Official Pages

- Home: https://mediabunny.dev
- Guide: https://mediabunny.dev/guide/introduction
  - Quick start: https://mediabunny.dev/guide/quick-start
  - Reading: https://mediabunny.dev/guide/reading-media-files
  - Media sinks: https://mediabunny.dev/guide/media-sinks
  - Input formats: https://mediabunny.dev/guide/input-formats
  - Reading HLS: https://mediabunny.dev/guide/reading-hls
  - Writing: https://mediabunny.dev/guide/writing-media-files
  - Media sources: https://mediabunny.dev/guide/media-sources
  - Output formats: https://mediabunny.dev/guide/output-formats
  - Writing HLS: https://mediabunny.dev/guide/writing-hls
  - Converting: https://mediabunny.dev/guide/converting-media-files
  - Packets & samples: https://mediabunny.dev/guide/packets-and-samples
  - Formats & codecs: https://mediabunny.dev/guide/supported-formats-and-codecs
  - Extensions: https://mediabunny.dev/guide/extensions/server (also `mp3-encoder`, `aac-encoder`, `flac-encoder`, `ac3`, `dts`, `prores`)
- API reference: https://mediabunny.dev/api/<Name> (for example `/api/Input`, `/api/MetadataTags`, `/api/VideoEncodingConfig`)
- Codec Registry (packet + decoder-config formats per codec): https://mediabunny.dev/codec-registry/overview
- Examples (source in repo `examples/`): https://mediabunny.dev/examples — metadata extraction, thumbnail generation, media player, file compression, procedural generation, live recording, HLS transcoding
- Blog: https://mediabunny.dev/blog (HLS support, quantizer support in 1.52)
- LLM files: https://mediabunny.dev/llms.txt, https://mediabunny.dev/llms-full.txt, https://mediabunny.dev/mediabunny.d.ts
- Repo: https://github.com/Vanilagy/mediabunny · Releases: https://github.com/Vanilagy/mediabunny/releases
- Migration from predecessors: https://github.com/Vanilagy/mp4-muxer/blob/main/MIGRATION-GUIDE.md, https://github.com/Vanilagy/webm-muxer/blob/main/MIGRATION-GUIDE.md
- NodeAV (server backend): https://github.com/seydx/node-av

Context7 IDs: `/vanilagy/mediabunny` (repo), `/websites/mediabunny_dev_guide`, `/websites/mediabunny_dev_api`, `/llmstxt/mediabunny_dev_llms-full_txt`.

## Refresh Procedure

1. Check versions:

   ```sh
   bun pm view mediabunny version
   bun pm view mediabunny time --json
   ```

   (`npm view` works the same if Bun is not present.)
2. Read release notes since the snapshot: `gh api 'repos/Vanilagy/mediabunny/releases?per_page=20' --jq '.[] | .tag_name, .body'`.
3. For exact signatures, read `https://mediabunny.dev/mediabunny.d.ts` (or the installed `dist/mediabunny.d.ts`). Prefer it over memory.
4. Re-check browser codec support claims at runtime with `getEncodableCodecs()` / `getDecodableCodecs()`, not from docs.

## Version Timeline (features that gate code)

Check the installed version before you use these.

| Version | Change |
| --- | --- |
| 1.48.0 | `formatOptions.hls.offsetTimestampsByDateTime`; per-sink decoder options (`VideoSampleSink(track, { hardwareAcceleration })`, `CanvasSink({ decoderOptions })`) |
| 1.49.0 | `Logging` / `LogLevel` singleton; ID3v2 read in FLAC |
| 1.50.0 | ProRes codec `'prores'` (ISOBMFF + Matroska); `@mediabunny/prores`; custom coder `onError` |
| 1.51.0 | Composable conversions (`composable: true`), `execute({ pauseSignal, until })` |
| 1.52.0 | `Quality` class overhaul + quantizer (constant-quality) encoding; **all `bitrate` options deprecated → `quality`**; `QUALITY_*` constants deprecated → `new Quality('…')` |
| 1.53.0 | Zero-packet tracks via `decoderConfig` + `primingPacket` track metadata; HLS single-file + fMP4 gives a standalone fMP4 |
| 1.54.0 | `InputVideoTrack.computeFrameRateMetrics()` |
| 1.55.0 | DTS codec `'dts'`; `@mediabunny/dts` |
| 1.55.2 | ISOBMFF carrying Annex B AVC/HEVC |
| 1.56.0 | Copy (no-transcode) conversions for arbitrary trims; `ConversionOptions.copy`; negative timestamp muxing (ISOBMFF edit lists, Matroska, MPEG-TS); `OutputFormat.negativeTimestampSupport`; `handleUnhandledError` on sources |
| 1.57.0 | Flip support everywhere (`getFlip`, `flip` options); `getTransformationMatrix()`; `btrt` bitrate box read/write; `BaseTrackMetadata.bitrate/averageBitrate`; `allowRotationMetadata` → `allowTransformationMetadata`; `supportsVideoRotationMetadata` → `supportsVideoTransformationMetadata`; failed `finalize()` → `canceled` state |
| 1.58.0 | `ConversionCopyOptions.boundaryTolerance` |
| 1.59.0 | `MetadataTags.beatsPerMinute` |
| 1.60.0 | `VideoTrackMetadata.canBeTransparent` |
| 1.61.0 | HLS `#EXT-X-DEFINE` variable substitution; Ogg end trimming + non-zero start; extension workers fixed for Bun 1.4+ and Deno; auto-refresh of inactive reclaimed video encoders |

Older but relevant: `StreamSource` was renamed `CustomSource` (alias deprecated); `source.onread` / `target.onwrite` are deprecated in favor of `source.on('read', …)` / `target.on('write', …)`.
