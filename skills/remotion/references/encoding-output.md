# Encoding and Output Formats

Codec matrix, CRF and bitrate, pixel and image formats, transparency, ProRes, GIF, color space, hardware encoding, metadata. Source of truth: `@remotion/renderer` options in 4.0.532 (v4 defaults; v5 changes noted).

## Contents

1. Quick decision guide
2. Codec matrix
3. Quality controls
4. Pixel format, image format, transparency
5. ProRes profiles
6. GIF
7. Color space and HDR
8. Hardware acceleration
9. Audio settings
10. Metadata and scaling
11. Precedence rules

---

## 1. Quick decision guide

| Goal | Settings |
| --- | --- |
| Web / social delivery | `h264` `.mp4`, CRF 18 (default) to 23 (smaller), `jpeg` frames, `--color-space=bt709` |
| Smallest web file, time is fine | `vp9` `.webm` or `av1` `.mp4` (AV1 not on Lambda or Linux arm64) |
| Editor hand-off (Premiere, Resolve, FCP) | `prores` `hq` `.mov` |
| Transparent overlay for editors | `prores` + `--prores-profile=4444` + `--image-format=png` + `--pixel-format=yuva444p10le` |
| Transparent overlay for browsers | `vp9` (or `vp8`) `.webm` + `--image-format=png` + `--pixel-format=yuva420p` (Safari is poor; keep an opaque fallback) |
| Audio only | `mp3`, `aac`, or `wav` (frames are skipped automatically) |
| GIF | `gif` + `--every-nth-frame=2` for half fps |
| Thumbnail / poster | `remotion still` (png default; `--scale=2` for crisp) |
| Several frames as images | `remotion render <id> out/frames --frames=0,45,90 --image-format=png` |

## 2. Codec matrix

`codec`: `h264` (default) | `h265` | `vp8` | `vp9` | `av1` | `prores` | `gif` | `h264-mkv` | `h264-ts` | `mp3` | `aac` | `wav`.

| Codec | Ext | Default audio | Allowed audio | CRF range / default | Alpha | Parallel encode |
| --- | --- | --- | --- | --- | --- | --- |
| `h264` | mp4 | aac | aac, pcm-16 (mkv/mov), mp3 | 1–51 / 18 (0 throws) | no | yes |
| `h265` | mp4 | aac | aac, pcm-16 (mkv) | 0–51 / 23 | no | yes |
| `vp8` | webm | opus | opus, pcm-16 (mkv) | 4–63 / 9 | yes (`yuva420p`) | no |
| `vp9` | webm | opus | opus, pcm-16 (mkv) | 0–63 / 28 | yes (`yuva420p`) | no |
| `av1` | mp4 | aac | aac, opus (webm/mkv), pcm-16 | 0–63 / 30 | no | no (slow) |
| `prores` | mov | pcm-16 | aac, pcm-16 | n/a | 4444 profiles | no |
| `gif` | gif | none | none | n/a | with png frames | no |
| `h264-mkv` | mkv | pcm-16 | pcm-16, mp3 | 1–51 / 18 | no | yes |
| `h264-ts` | ts | aac | aac, pcm-16 | 1–51 / 18 | no | no |
| `mp3` / `aac` / `wav` | mp3 / aac / wav | same | — | n/a | — | — |

- CLI infers the codec from the output extension: `mp4`→h264, **`mov`→prores**, `mkv`→h264-mkv, `webm`→vp8, `gif`→gif, `mp3`/`wav`/`aac`… → audio. So `out.mov` without `--codec` renders ProRes. A `--codec` that contradicts the extension throws.
- H.264/H.265/AV1 silently round width/height down to even numbers. Register even dimensions (ESLint `even-dimensions`).
- vp8/vp9/av1 encode much slower than h264.

## 3. Quality controls

- `crf` / `--crf`: lower = better and bigger. +6 ≈ half the bitrate. Codec ranges above.
- `videoBitrate` / `--video-bitrate=8M`: target bitrate. Mutually exclusive with `crf`.
- `encodingMaxRate` (`--max-rate`) + `encodingBufferSize` (`--buffer-size`): cap the bitrate. Use together. VP8/VP9/AV1 also need `videoBitrate` with them. (Some docs call these `maxRate`/`bufferSize`; the real option names are `encodingMaxRate`/`encodingBufferSize`.)
- `x264Preset` / `--x264-preset`: `ultrafast` … `placebo` (h264 only). Default = libx264 `medium`. Lambda's default becomes `veryfast` in v5.
- `gopSize` / `--gop`: max frames between keyframes.
- `jpegQuality` / `--jpeg-quality`: 0–100, default 80 (jpeg frames only). Raise to 90–100 for text-heavy, high-contrast graphics.
- `--scale=2` renders at double resolution (max 16). Canvas/WebGL content needs `pixelDensity` to stay sharp; videos do not upscale.

## 4. Pixel format, image format, transparency

- `pixelFormat`: `yuv420p` (default), `yuva420p` (vp8/vp9 only), `yuv422p`, `yuv444p`, `yuv420p10le`, `yuv422p10le`, `yuv444p10le`, `yuva444p10le`.
- Video frame `imageFormat`: `jpeg` (default, fastest), `png` (required for alpha), `none` (audio only).
- Still `imageFormat`: `png` (default), `jpeg`, `webp`, `pdf` (not on Lambda).
- Transparent output requires: no opaque background in the composition, `png` frames, an alpha pixel format, and an alpha-capable codec. Alpha sources inside need `@remotion/media` + WebGL (`--gl=angle`) or `<OffthreadVideo transparent>`.
- Per-composition defaults via `calculateMetadata`: return `defaultCodec`, `defaultVideoImageFormat`, `defaultPixelFormat`, `defaultProResProfile`. The CLI honors all; Node `renderMedia()` honors pixel format, image format, sample rate — but **not** codec or ProRes profile (pass `codec: composition.defaultCodec ?? 'h264'`).

## 5. ProRes profiles

| Profile | Approx. bitrate | Alpha |
| --- | --- | --- |
| `proxy` | 45 Mbps | no |
| `light` | 102 Mbps | no |
| `standard` | 147 Mbps | no |
| `hq` (default) | 220 Mbps | no |
| `4444` | 330 Mbps | yes |
| `4444-xq` | 500 Mbps | yes |

## 6. GIF

`--codec=gif`, `--every-nth-frame=2` (halve fps), `--number-of-gif-loops` (`null` infinite, `0` play once, `1` play twice). 256 colors — avoid gradients and photos. Transparent GIF needs `png` frames.

## 7. Color space and HDR

- `colorSpace`: `default` (v4 default, = bt601), `bt601`, `bt709`, `bt2020-ncl`. v5 default becomes `bt709`. Prefer `--color-space=bt709` now for accurate colors.
- `bt2020-*` only tags HDR; Chrome renders SDR, so output looks overexposed. Do not use it to "make HDR". `bt2020-cl` is documented but rejected.
- HDR sources: `<OffthreadVideo toneMapped>` (default true) converts to SDR.

## 8. Hardware acceleration

- `hardwareAcceleration` / `--hardware-acceleration`: `disable` (default) | `if-possible` | `required`. Local and Vercel only (not Lambda/Cloud Run).
- Encoders: macOS VideoToolbox (h264, h265, prores); Linux/Windows x64 NVENC (h264, h265, 4.0.484+).
- `crf`, `encodingMaxRate`, `encodingBufferSize` are incompatible: `required` throws; `if-possible` falls back to software. Use `--video-bitrate=8M` for ~1080p software-equivalent size.
- The availability check only looks at the FFmpeg build, not the GPU. On a GPU-less Linux x64 box, `if-possible` may still pick NVENC and fail. Confirm with `--log=verbose` (`Encoder: h264_nvenc, hardware accelerated: true`).

## 9. Audio settings

- `audioCodec`: `aac` | `mp3` | `opus` | `pcm-16` (must fit the container; see matrix).
- `audioBitrate` default 320k. `sampleRate` default 48000.
- `muted` drops audio. `enforceAudioTrack` adds a silent track (needed when concatenating chunks or for platforms that require audio).
- `separateAudioTo` writes audio to a separate file (extension picks the codec).
- `preferLossless` forces `pcm-16`; in source it overrides `audioCodec`, so do not set both.

## 10. Metadata and scaling

- `metadata: {title, artist, …}` / `--metadata title=Hi`. MP4/MOV accept: title, artist, album_artist, composer, album, date, genre, copyright, grouping, lyrics, description, synopsis, show, episode_id, network, keywords, episode_sort, season_number, media_type. Remotion writes `comment=Made with Remotion <version>`.
- Override dimensions/fps/duration at render time: `--width`, `--height`, `--fps`, `--duration` (or `forceWidth`… on Lambda).

## 11. Precedence rules

- CLI: Studio UI choice > CLI flag > `calculateMetadata` defaults > `remotion.config.ts` > built-in default.
- Node SSR: explicit option > composition default (pixel format, image format, sample rate only) > built-in default. The config file is ignored by Node APIs.
