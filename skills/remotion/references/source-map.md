# Source Map

Snapshot, official sources, refresh procedure, complete package catalog, recent changelog, and known doc/source mismatches.

## Snapshot

- Captured: 2026-10-03 from the `remotion-dev/remotion` monorepo `main` (commit 2026-10-02) and the npm registry.
- Latest stable: `remotion@4.0.532` (2026-10-01). All `@remotion/*` packages share this version.
- npm dist-tags: `latest` 4.0.532. `alpha` (4.1.0-alpha12, 2023) and `canary` (4.0.0-alpha.217) are stale leftovers — ignore them.
- Remotion 5.0: unreleased; breaking changes staged behind `ENABLE_V5_BREAKING_CHANGES = false` (`packages/core/src/v5-flag.ts`). Many docs pages already describe v5 defaults.
- Mediabunny pinned by Remotion: `1.56.1`. Zod pinned by Studio/media: `4.5.4`.
- Chrome Headless Shell pinned: `149.0.7790.0`. Bundled FFmpeg: 7.1.
- Runtime minimums (v4): Node ≥16, Bun ≥1.0.3 (no npm `engines` field; enforced at runtime). Renderer binaries: macOS ≥15, Linux glibc ≥2.35.
- Peer dependencies: `react`, `react-dom` `>=16.8.0`.
- License: Remotion License (source-available; free for individuals, ≤3-person companies, non-profits). Utility packages (paths, noise, shapes, media-utils, layout-utils, motion-blur, rough-notation, fonts, gsap, captions, sfx package) are MIT.

## Official sources

- Docs: https://www.remotion.dev/docs — append `.md` to any page for Markdown (`https://www.remotion.dev/docs/sequence.md`).
- LLM index: https://www.remotion.dev/llms.txt · system prompt: https://www.remotion.dev/system-prompt.txt
- API index: https://www.remotion.dev/docs/api
- Repo: https://github.com/remotion-dev/remotion (docs in `packages/docs/docs`, source in `packages/<name>/src`, renderer options in `packages/renderer/src/options/*`)
- Releases/changelog: https://github.com/remotion-dev/remotion/releases · https://remotion.dev/changelog
- License: https://remotion.dev/license · https://remotion.pro
- Context7 library id: `/remotion-dev/remotion` (also `/websites/remotion_dev`)
- Templates: https://www.remotion.dev/templates · Elements gallery in Studio
- Mediabunny: https://mediabunny.dev

## Refresh procedure

1. `npm view remotion version dist-tags --json` (registry metadata; `bun info remotion` also works).
2. `gh release list -R remotion-dev/remotion -L 20` and read notes for anything newer than the snapshot.
3. Check the local project's installed version (`bunx remotion versions`) before using APIs with "available from" gates.
4. Prefer `.md` docs pages over memory for any API you have not verified. When docs and source disagree, read the source in the repo.
5. When the v5 flag flips, re-check every "v4 default" in these references (GL, color space, premount, license key, Lambda defaults).

## Package catalog (4.0.532)

Core and tooling:

| Package | Role |
| --- | --- |
| `remotion` | Core: compositions, timeline, hooks, animation, assets, effects host components, `Interactive` |
| `@remotion/cli` | `remotion` / `remotionb` CLI, Studio launcher, `remotion.config.ts` (`@remotion/cli/config`) |
| `@remotion/studio`, `@remotion/studio-server`, `@remotion/studio-shared` | Studio UI and APIs (`getStaticFiles`, `saveDefaultProps`, …) |
| `@remotion/renderer` | Node/Bun SSR: `renderMedia`, `renderStill`, `selectComposition`, `ensureBrowser`, … |
| `@remotion/bundler` | `bundle()` (Webpack default, Rspack opt-in) |
| `@remotion/player` | `<Player>`, `<Thumbnail>` |
| `@remotion/zod-types` (`-v3`) | `zColor`, `zTextarea`, `zMatrix` |
| `@remotion/eslint-plugin`, `@remotion/eslint-config(-flat)` | Lint rules |
| `@remotion/licensing` | License usage events |
| `@remotion/compositor-*` | Native binaries (optional deps — do not omit) |
| `create-video` | Project scaffolder |
| `@remotion/codemods` | In-memory source edits (Studio engine; draft) |
| `@remotion/streaming`, `@remotion/timeline-utils`, `@remotion/design`, `@remotion/promo-pages`, `@remotion/serverless(-client)`, `@remotion/studio-codemods`, `@remotion/babel-loader` | Internal/supporting |

Media:

| Package | Role |
| --- | --- |
| `@remotion/media` | Recommended `<Video>` / `<Audio>` (Mediabunny + WebCodecs) |
| `@remotion/media-utils` | Audio data, visualization, waveforms, image dimensions |
| `@remotion/preload` | `preloadVideo/Audio/Image/Font`, `resolveRedirect` |
| `@remotion/captions` | `Caption` type, TikTok-style pages, SRT |
| `@remotion/install-whisper-cpp`, `@remotion/whisper-webgpu`, `@remotion/whisper-web`, `@remotion/openai-whisper`, `@remotion/elevenlabs` | Transcription → captions |
| `@remotion/sfx` | Hosted sound-effect URLs |
| `@remotion/video-matting` | WebGPU background removal into layers |
| `@remotion/media-parser`, `@remotion/webcodecs` | Deprecated → Mediabunny |

Visual:

| Package | Role |
| --- | --- |
| `@remotion/transitions` | `<TransitionSeries>`, presentations, timings |
| `@remotion/effects` | Effect factories for the `effects` prop |
| `@remotion/shapes`, `@remotion/paths`, `@remotion/noise` | Shapes, path utilities, simplex noise |
| `@remotion/motion-blur` | `<HtmlInCanvasMotionBlur>`, `<CameraMotionBlur>`, `<Trail>` |
| `@remotion/layout-utils`, `@remotion/rounded-text-box`, `@remotion/rough-notation` | Text fitting, caption boxes, hand-drawn highlights |
| `@remotion/animation-utils` | `interpolateStyles`, `makeTransform` |
| `@remotion/google-fonts`, `@remotion/fonts` | Font loading |
| `@remotion/tailwind-v4`, `@remotion/tailwind`, `@remotion/enable-scss` | Styling bundler overrides |
| `@remotion/gif`, `@remotion/lottie`, `@remotion/rive`, `@remotion/gsap`, `@remotion/animated-emoji`, `@remotion/mac-cursors` | Integrations |
| `@remotion/three`, `@remotion/skia` | 3D (R3F) and Skia |
| `@remotion/light-leaks`, `@remotion/starburst` | Deprecated → `@remotion/effects` |
| `@remotion/maptiler`, `@remotion/svg-3d-engine` | Published but internal/undocumented |

Rendering in the cloud and browser:

| Package | Role |
| --- | --- |
| `@remotion/lambda` | Deploy/admin + CLI (`remotion lambda`) |
| `@remotion/lambda-client` (= `@remotion/lambda/client`) | Render/progress/webhooks; bundle-safe |
| `@remotion/vercel` | Vercel Sandbox rendering (experimental) |
| `@remotion/cloudrun` | GCP Cloud Run (alpha, unmaintained) |
| `@remotion/web-renderer` | `renderMediaOnWeb`, `renderStillOnWeb` |

Authoring/app building:

| Package | Role |
| --- | --- |
| `@remotion/canvas` | Experimental editor `<Canvas>` around `<Player>` (renamed `@remotion/sdk` on `main`, unreleased) |
| `@remotion/browser-bundler` | Compile virtual projects in the browser (draft) |
| `@remotion/studio-protocol` | Publish Elements into a running Studio |
| `@remotion/mcp` | Deprecated docs MCP |
| `@remotion/player-a11y` | Published once (4.0.489), now private/internal — do not depend on it |
| `@remotion/canvas-capture` | Stale (last 4.0.502, no README). The Canvas Capture product is now a Chrome extension (Apple Silicon only) — not an npm API |

## Changelog highlights 4.0.440 → 4.0.532

- 4.0.440 AV1 codec · 4.0.442 `<Video objectFit>` · 4.0.443 `@remotion/elevenlabs`; `<Series>` is a Sequence
- 4.0.446 media tags accept `from`/`durationInFrames` · 4.0.448 `--sample-rate` · 4.0.452 Chrome 149 with HTML-in-canvas in renders
- 4.0.454 HLS in `@remotion/media` · 4.0.455 `<HtmlInCanvas>` · 4.0.461 Studio code edits
- 4.0.462 per-segment easing arrays · 4.0.464 `<Solid>`, effects on media · 4.0.465 effects system launch · 4.0.467 `<CanvasImage>`
- 4.0.470 `posterize` · 4.0.472 `usePixelDensity`, transform strings in `interpolate`, `colorKey` · 4.0.476 `Easing.spring`
- 4.0.482 `trimBefore` on `<Sequence>` · 4.0.484 NVENC hardware encoding · 4.0.487 ProRes decoding in `@remotion/media`
- 4.0.490 `@remotion/rough-notation`, `output: 'perceptual-scale'` · 4.0.495 premount on media · 4.0.497 `deploySiteFromBundle`, object `getCompositions`
- 4.0.500 crop props, light leak/starburst moved into effects, `pushCut`, Cloud Run unmaintained · 4.0.501 `<AbsoluteFill>` accepts timing props, `deploySite` deprecated
- 4.0.502 Rspack stable (opt-in), `--frames=0,10,20` · 4.0.503 `<ThreeWebGPUCanvas>`, `remotion skills` · 4.0.506 Elements gallery, `visualControl` deprecated
- 4.0.508–509 exposure/levels/vibrance/whiteBalance/colorCorrection · 4.0.513 `@remotion/mac-cursors` · 4.0.515 Lambda render cancellation, frame-encoding backpressure
- 4.0.516 props controls inferred from `defaultProps` · 4.0.517 `@remotion/gsap`, single-function Lambda renders · 4.0.518 `@remotion/whisper-webgpu`
- 4.0.520 preview pitch shifting, WebMCP `get_current_error` · 4.0.523 `@remotion/video-matting`, `blurSlide`, `tear` · 4.0.525 `loadVariableFont`
- 4.0.526 `lut()` · 4.0.528 `playbackRate` and `premountFor` on many components · 4.0.529 `<HtmlInCanvasMotionBlur>`, `interpolatePaths`
- 4.0.530 `durationInFrames` applies before `playbackRate` (small breaking), `loop` on most components, `Interactive.withSchema({wrapInSequence})`
- 4.0.531 VP8/VP9/AV1 need `videoBitrate` with `encodingBufferSize`; create-video Tailwind default "No" · 4.0.532 minor

## Known doc/source mismatches (source wins)

- Many docs pages describe v5 defaults as current (GL `angle`, color space `bt709`, required `inputProps`, Lambda disk 10240 MB, premount by default).
- `renderMedia`/`renderMediaOnLambda` docs name `bufferSize`/`maxRate`; real options are `encodingBufferSize`/`encodingMaxRate`.
- Default concurrency is capped at 8 (`round(min(8, cpus/2))`); docs say "half the CPU threads".
- `renderMedia()` does not apply `defaultCodec`/`defaultProResProfile` from `calculateMetadata` (the CLI does).
- `bt2020-cl` color space is documented but rejected.
- `getInputProps()` throws inside `<Player>` (docs say it returns `{}`).
- `getPointAtLength`/`getTangentAtLength` already return `null` past the end in 4.x.
- Docs export name `openaiWhisperApiToCaptions` → real `openAiWhisperApiToCaptions`; `getWaveformPortion` is synchronous.
- HTML-in-canvas transition shader `time` runs 1 → 0 (one page says 0 → 1).
- `--template <name>` is not a `create-video` flag; use `--<name>`. Studio flag is `--cross-site-isolation`.
- `Config.setChromiumMultiProcessOnLinux(false)` has no effect from the CLI; use SSR `chromiumOptions`.
- `@remotion/effects` root only re-exports 11 effects; use subpaths.
- Lambda runtime is Node 24 (some prose still says 20). Webhook signature is computed over `JSON.stringify(parsedBody)`.
- Some docs and official examples still use `npx`; this skill uses `bunx`.
