# Rendering: CLI, Config, Node/Bun SSR, Browser, Docker, Licensing

How renders work, the CLI, `remotion.config.ts`, the `@remotion/renderer` + `@remotion/bundler` APIs, Chrome Headless Shell and GL backends, Docker/CI, performance, and licensing. Snapshot: 4.0.532 (v4 defaults active; v5 flag off).

## Contents

1. How a render works
2. CLI commands
3. `remotion render` / `still` flags
4. `remotion.config.ts`
5. Node/Bun SSR: bundle → select → render
6. Other renderer APIs
7. Browser, GL backend, Linux deps
8. Docker and CI
9. Performance and concurrency
10. Licensing and telemetry
11. Troubleshooting

---

## 1. How a render works

1. **Bundle** the entry point (Webpack by default, Rspack opt-in) into a static site = serve URL.
2. **Select** the composition in headless Chrome; `calculateMetadata()` runs with the input props.
3. **Render frames** in N tabs (`concurrency`): seek, wait for all delayRender handles, screenshot (jpeg/png).
4. **Encode** with the bundled FFmpeg (in `@remotion/compositor-*` optional deps) and mix audio. H.264/H.265 can encode while rendering ("parallel encoding").

All `remotion` and `@remotion/*` packages must share one exact version. Check with `bunx remotion versions`; fix with `bunx remotion upgrade`.

## 2. CLI commands

`bunx remotion <cmd>` runs on Node; `bunx remotionb <cmd>` runs on Bun.

| Command | Purpose |
| --- | --- |
| `studio [entry]` | Dev preview + editor. `--port`, `--no-open`, `--force-new`, `--rspack`, `--log`. Open `http://localhost:3000/<composition-id>`. |
| `render [entry] [id] [out]` | Render video/audio/GIF/image sequence. No id → interactive picker. No out → `out/<id>.<ext>`. |
| `still [entry] [id] [out]` | Render one frame (`--frame`, negative = from end). |
| `compositions [entry] [-q]` | List composition ids. |
| `bundle [entry] --out-dir=build` | Build a relocatable static bundle (serve URL). |
| `benchmark [entry] [ids] --concurrencies=2,4,8 --runs=3` | Find the best concurrency. |
| `add <pkgs…>` | Install Remotion packages at the matching version. |
| `upgrade [--version=x] [--skip-skills]` | Upgrade all Remotion packages (+ zod, mediabunny, project agent skills). |
| `versions` | Verify one version everywhere. |
| `browser ensure` | Pre-download Chrome Headless Shell (CI/Docker). |
| `gpu --gl=angle` | Print Chrome GPU status. |
| `ffmpeg …` / `ffprobe …` | Bundled FFmpeg 7.1 — no install needed. |
| `lambda …` / `cloudrun …` | Cloud rendering CLIs (see cloud reference). |

## 3. `remotion render` / `still` flags

```bash
bunx remotion render src/index.ts Promo out/promo.mp4 --props=./props.json --crf=20 --color-space=bt709
bunx remotion render Promo out/overlay.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le
bunx remotion render Promo out/frames --frames=0,45,90,135 --image-format=png
bunx remotion still Promo out/thumb.png --frame=45 --scale=2
```

| Flag | Node option | Config method | Default |
| --- | --- | --- | --- |
| `--props` (JSON or file) | `inputProps` | — | `{}` (on Windows shells use a file) |
| `--codec` | `codec` (required in Node) | `setCodec` | `h264` / from extension |
| `--crf`, `--video-bitrate`, `--audio-bitrate` | same | `setCrf`, … | per codec |
| `--max-rate`, `--buffer-size` | `encodingMaxRate`, `encodingBufferSize` | `setEncodingMaxRate`, … | none |
| `--image-format` | `imageFormat` | `setVideoImageFormat` | `jpeg` |
| `--pixel-format` | `pixelFormat` | `setPixelFormat` | `yuv420p` |
| `--prores-profile`, `--x264-preset`, `--gop` | same | … | `hq`, libx264 medium, encoder |
| `--jpeg-quality` | `jpegQuality` | `setJpegQuality` | 80 |
| `--color-space` | `colorSpace` | `setColorSpace` | `default` (bt601) |
| `--concurrency` (number or `"50%"`) | `concurrency` | `setConcurrency` | `round(min(8, cpus / 2))` |
| `--frames` (`0-99`, `100-`, `0,30,60`, `0-9,20-29`) | `frameRange` | `setFrameRange` | all |
| `--scale` | `scale` | `setScale` | 1 |
| `--muted`, `--enforce-audio-track`, `--separate-audio-to`, `--sample-rate` | same | … | |
| `--every-nth-frame`, `--number-of-gif-loops` | same | … | GIF only |
| `--sequence`, `--image-sequence-pattern` | `renderFrames()` | `setImageSequence` | |
| `--timeout` (ms) | `timeoutInMilliseconds` | `setDelayRenderTimeoutInMilliseconds` | 30000 |
| `--gl` | `chromiumOptions.gl` | `setChromiumOpenGlRenderer` | `null` in v4 |
| `--chrome-mode` | `chromeMode` | `setChromeMode` | `headless-shell` |
| `--disable-web-security`, `--ignore-certificate-errors`, `--user-agent`, `--dark-mode` | `chromiumOptions.*` | `setChromium*` | |
| `--hardware-acceleration` | `hardwareAcceleration` | `setHardwareAcceleration` | `disable` |
| `--log=trace\|verbose\|info\|warn\|error` | `logLevel` | `setLogLevel` | `info` |
| `--media-cache-size-in-bytes`, `--offthreadvideo-cache-size-in-bytes` | same | | ½ free RAM |
| `--width/--height/--fps/--duration` | overrides | `override*` | composition |
| `--env-file` | `envVariables` | `setDotEnvLocation` | `.env` |
| `--public-license-key` (`rm_pub_…` or `free-license`) | `licenseKey` | `setPublicLicenseKey` | none |
| `--rspack`, `--bundle-cache=false`, `--public-dir` | bundle options | `setRspack`, … | |
| `--repro` | `repro` | `setRepro` | writes a repro ZIP for bug reports |

## 4. `remotion.config.ts`

```ts
import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind-v4';

Config.setVideoImageFormat('jpeg');
Config.setColorSpace('bt709');
Config.setConcurrency('50%');
Config.setChromiumOpenGlRenderer('angle'); // only if you use WebGL/effects/three and have a GPU
Config.setPublicLicenseKey('free-license');
Config.overrideBundlerConfig((config) => enableTailwind(config)); // shared by Webpack and Rspack
```

- Applies to the CLI and Studio only. Node APIs ignore it — pass the same options and overrides explicitly (keep override functions in a shared file and import them in both places).
- CLI flags beat config values. Restart Studio after editing the config.
- `overrideBundlerConfig` (4.0.498) runs first for both bundlers; `overrideWebpackConfig` / `overrideRspackConfig` are bundler-specific. Rspack is opt-in (`setRspack(true)` / `--rspack`).
- Removed setters throw: `setQuality` (→ `setJpegQuality`), `setImageFormat` (→ `setVideoImageFormat`/`setStillImageFormat`), `setOutputFormat`, FFmpeg executables.

## 5. Node/Bun SSR: bundle → select → render

```ts
// scripts/render.ts — run with: bun scripts/render.ts
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {ensureBrowser, makeCancelSignal, openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {bundlerOverride} from '../src/bundler-override'; // same function used in remotion.config.ts

await ensureBrowser();

// Bundle once per code version (build step or server start), never per request.
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), bundlerOverride});

// Reuse one browser across renders. Add chromiumOptions: {gl: 'angle'} here if the video uses WebGL.
const browser = await openBrowser('chrome');
const inputProps = {title: 'Launch day', accent: '#0b84ff'};

const composition = await selectComposition({serveUrl, id: 'Promo', inputProps, puppeteerInstance: browser});

const {cancelSignal, cancel} = makeCancelSignal();
process.once('SIGINT', cancel);

await renderMedia({
  serveUrl,
  composition,
  inputProps, // pass the same props again
  codec: composition.defaultCodec ?? 'h264', // renderMedia does not apply defaultCodec itself
  outputLocation: `out/${composition.id}.mp4`, // null → returns a Buffer
  colorSpace: 'bt709',
  concurrency: '50%',
  timeoutInMilliseconds: 60_000,
  puppeteerInstance: browser, // chromiumOptions must then be set in openBrowser()
  envVariables: {API_URL: process.env.API_URL ?? ''}, // .env is not read automatically
  cancelSignal,
  licenseKey: process.env.REMOTION_LICENSE_KEY ?? 'free-license',
  onProgress: ({progress}) => process.stdout.write(`\r${Math.round(progress * 100)}%`),
});

await renderStill({serveUrl, composition, inputProps, frame: 45, output: 'out/thumb.png', puppeteerInstance: browser});
await browser.close({silent: false});
process.exit(0); // Bun may otherwise keep the process alive
```

Rules:

- Pass `inputProps` to both `selectComposition()` and `renderMedia()` (v5 makes it required; use `{}` if none).
- `renderMedia()` returns `{buffer, slowestFrames, contentType}`. Progress: `{progress, renderedFrames, encodedFrames, stitchStage}`.
- `bundle()` cannot run inside Next.js routes or serverless functions ("Can't resolve 'module'", compositor parse errors). Bundle at build time, or use Lambda/Vercel.
- Use `getCompositions({serveUrl, inputProps})` only when you need all ids (it evaluates every `calculateMetadata`).
- Bound a render: `makeCancelSignal()` + `setTimeout(cancel, ms)`.
- Batch renders (datasets): bundle once, reuse one browser, loop `selectComposition` + `renderMedia` sequentially with per-item props. One render already saturates a machine.
- If you pass `scale` with a shared browser, also pass `forceDeviceScaleFactor` to `openBrowser()`.

## 6. Other renderer APIs

| API | Use |
| --- | --- |
| `renderFrames({…, outputDir \| onFrameBuffer, frames?})` | Image sequences or custom pipelines. |
| `stitchFramesToVideo()` | Encode frames from `renderFrames` (prefer `renderMedia`). |
| `combineChunks()` | Concatenate DIY distributed chunks (advanced; Lambda does this for you). |
| `getSilentParts({src, noiseThresholdInDecibels, minDurationInSeconds})` | Find silences in a local file. |
| `extractAudio({videoSource, audioOutput})` | Copy the audio stream out. |
| `ensureBrowser({onBrowserDownload})` | Download Chrome early. |
| `openBrowser('chrome', {chromiumOptions, chromeMode, forceDeviceScaleFactor})` | Share one browser. |
| `getVideoMetadata()` | Deprecated (removed in v5) → Mediabunny. |

Electron: render in the main process, ship a prebuilt bundle, point `binariesDirectory` at the compositor package in `app.asar.unpacked`, and include the matching `-gnu`/`-musl` compositor for Linux targets.

## 7. Browser, GL backend, Linux deps

- Remotion downloads and pins Chrome Headless Shell (149.0.7790.0) into `node_modules/.remotion/`. Do not point `--browser-executable` at desktop Chrome; renders can hang or differ.
- `chromeMode`: `headless-shell` (default, CPU) or `chrome-for-testing` (needed for real GPU use on Linux).
- `gl` backend: v4 default `null` (no WebGL in headless). Use `angle` on machines with a GPU, `swangle` (software) without one, `angle-egl` or `vulkan` + `chrome-for-testing` on cloud GPUs. Lambda forces `swangle`. v5 will default to `angle` with automatic software fallback. Needed for: `@remotion/effects` WebGL effects, Three.js, Skia, maps, shader transitions, alpha decoding in `@remotion/media`. Error "Failed to acquire WebGL2 context" means you forgot it.
- Debian/Ubuntu libs: `libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 (libasound2t64 on 24.04) libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2 libatk-bridge2.0-0`. Alpine and NixOS are unsupported.
- Install optional dependencies — the compositor binaries ship as optional packages.

## 8. Docker and CI

```dockerfile
FROM oven/bun:1-debian
RUN apt-get update && apt-get install -y \
  libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev \
  libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
  fonts-noto-color-emoji fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx remotion browser ensure
CMD ["bun", "scripts/render.ts"]
```

- Do not use Alpine. Give the container enough CPUs and RAM. Install emoji/CJK fonts if content needs them.
- GitHub Actions: checkout → setup-bun → `bun install` → `bunx remotion render Promo out/promo.mp4 --props=./props.json` → upload artifact. Runners have no GPU (do not force `--gl=angle`).

## 9. Performance and concurrency

- Benchmark: `bunx remotion benchmark --concurrencies=2,4,8`. Too high → timeouts, "Target closed", SIGKILL; too low → idle CPU.
- `--log=verbose` prints the slowest frames, encoder, GL backend, parallel encoding, cache sizes.
- Cheap wins: `@remotion/media` `<Video>`; jpeg frames; precompute heavy data in `calculateMetadata`; memoize expensive per-frame work with `useMemo` on stable inputs; avoid `box-shadow`/`text-shadow`/`filter: blur()`/big gradients on CPU-only machines (precompute as images); keep DOM node counts sane (thousands of animated nodes are slow).
- `disallowParallelEncoding` saves RAM. Lower `mediaCacheSizeInBytes` / `offthreadVideoCacheSizeInBytes` when the OOM killer strikes.
- Node under Rosetta on Apple Silicon is ~2× slower; use native arm64.

## 10. Licensing and telemetry

- Free license: individuals, for-profit organizations with ≤3 people, non-profits, evaluation. Companies with ≥4 people need a company license (remotion.pro): "Creators" seats for people writing Remotion code, "Automators" per-render pricing when the company's code renders (SSR, Lambda, Vercel, web renderer, CLI renders) or embeds the Player.
- Pass the license key so usage is counted: Node/Lambda/Vercel `licenseKey: 'free-license' | '<key>'`; CLI `--public-license-key` or `Config.setPublicLicenseKey()`. `isProduction: false` marks dev renders non-billable (the CLI ignores `--is-production`).
- Telemetry in v4 is sent only when a key is set and only for successful renders; it never fails a render. The web renderer always sends telemetry (origin + IP) — mention it in privacy policies. v5 makes the key mandatory for Automators.
- Not allowed: letting end users upload their own Remotion code to your render service, or reselling Remotion. Rendering LLM-generated code for users is allowed. Codec patent royalties are not covered.
- When unsure whether the user's organization needs a license, tell them to check remotion.dev/license instead of deciding for them.

## 11. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `delayRender() "Loading root component"` timeout | Entry file does not call `registerRoot()` | Pass `src/index.ts` |
| `delayRender() "…" not cleared after 28000ms` | Handle never released, blocked network, slow asset | Fix handle; `cancelRender` on errors; `@remotion/media`; raise `--timeout` |
| `Timed out evaluating page function` | Tab overloaded or infinite loop | Lower concurrency, raise timeout, profile |
| `Target closed` / `Failed to launch the browser process` | Missing Linux libs, OOM, wrong arch, Alpine | Install libs, lower concurrency, correct platform |
| `Compositor quit with signal SIGKILL` | OOM killer | Lower caches/concurrency, `disallowParallelEncoding`, more RAM |
| `No frame found at position … Compositor error` | OffthreadVideo cache eviction or broken source | Bigger cache, re-encode source, `@remotion/media` |
| `Failed to acquire WebGL2 context` | No GL backend | `--gl=angle` / `swangle` |
| Config option ignored in a Node script | Node APIs do not read the config file | Pass options explicitly |
| `.env` values undefined in SSR | Not auto-read | `envVariables` |
| Output is ProRes, expected H.264 | `.mov` extension | `--codec=h264` |
| Output 1 px smaller | Odd dimensions rounded down | Use even dimensions |
| `ENAMETOOLONG` (Windows) | FFmpeg command too long (many audio layers) | `muted` on silent videos; render on Linux/WSL |
| `Module not found: Can't resolve 'module'` in Next.js | `bundle()`/renderer imported in app code | Move rendering out of the app bundle |
| Video has no sound in editor preview | VS Code/Cursor preview mutes media | Open in QuickTime/VLC |
| Text shifts by whole pixels | Chrome pixel snapping | `willChange: 'transform'` |
| Repeated log lines | One log per tab | `--concurrency=1` while debugging |
