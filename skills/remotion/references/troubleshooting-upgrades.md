# Troubleshooting, Linting, Upgrades, and v5 Readiness

Cross-cutting symptom table, debugging method, ESLint rules, version alignment and upgrades, deprecations, and the planned Remotion 5.0 changes. Snapshot: 4.0.532.

## Contents

1. Debugging method
2. Symptom table
3. ESLint plugin rules
4. Version alignment and upgrades
5. Deprecated APIs → replacements
6. Remotion 5.0 (planned) and how to be ready now

---

## 1. Debugging method

1. Reproduce with one still: `bunx remotion still <id> out/debug.png --frame=<n> --log=verbose`.
2. Render a short range with logs: `bunx remotion render <id> out/debug.mp4 --frames=0-60 --log=verbose --concurrency=1` (one tab = readable logs).
3. Read the label of any delayRender timeout — it names the stuck handle.
4. Check versions: `bunx remotion versions`.
5. Check GL: `bunx remotion gpu --gl=angle` when WebGL is involved.
6. In Studio, read runtime errors (or the `get_current_error` WebMCP tool).
7. Lower the timeout (`--timeout=10000`) to surface hangs faster; use `--repro` to produce a reproduction ZIP for bug reports.

## 2. Symptom table

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Flicker or jumps in the rendered video, fine in preview | CSS transitions/animations, timers, `Math.random()`, state carried across frames, assets not awaited | Frame-driven values, `random(seed)`, Remotion asset components, `useDelayRender()` |
| Black frame when a scene starts (preview) | Assets load on mount | `premountFor={fps}` |
| Values overshoot the keyframes | `interpolate` default `extend` | Clamp |
| `inputRange must be strictly monotonically increasing` | Short duration makes keyframes collide | Guard ranges for short durations |
| `durationInFrames must be an integer` | Float from `seconds * fps` | `Math.ceil` |
| `No video config found` / hooks outside composition | Hook outside Remotion, or duplicate `remotion` copies | Move the hook; align versions |
| `registerRoot() was called more than once` | `registerRoot` in Root file | Separate entry file |
| `delayRender … not cleared after 28000ms` | Handle never released / slow asset | Release on all paths, `cancelRender` on errors, raise timeout |
| "Loading root component" timeout | Wrong entry point | Pass the `registerRoot` file |
| Video uses HTML5 tag unexpectedly | `import {Video} from 'remotion'` | `@remotion/media` |
| `Failed to acquire WebGL2 context` | v4 default `gl=null` | `--gl=angle` / `swangle` |
| Config ignored in Node | Node APIs ignore `remotion.config.ts` | Pass options explicitly |
| `.env` values missing in SSR | Not auto-loaded | `envVariables` |
| `.mov` output is ProRes | Extension default | `--codec=h264` |
| Output 1 px smaller | Odd dimensions | Even dimensions |
| Lambda: no compatible function | Upgraded without redeploy | Redeploy function and site |
| Player: "React.createContext is undefined" | Server Component import | `'use client'` |
| Studio can't save props / controls grayed out | Non-literal `defaultProps`, computed styles, `transform` strings | Follow editability rules |
| Fonts measure wrong | Measured before load | `waitUntilDone()` first, `validateFontIsLoaded: true` |
| Google Fonts timeouts | `loadFont()` without weights/subsets | Pass both |
| SIGKILL during render | Out of memory | Lower concurrency/caches, more RAM |
| No sound in the editor's video preview | Editor mutes media | Open in QuickTime/VLC |

## 3. ESLint plugin rules (`@remotion/eslint-plugin`)

Setup (flat config): `import remotion from '@remotion/eslint-plugin'` → `{files: ['src/remotion/**'], ...remotion.flatPlugin}`. Shared configs: `@remotion/eslint-config-flat` (ESLint 9+), `@remotion/eslint-config` (legacy).

| Rule | Flags | Why |
| --- | --- | --- |
| `warn-native-media-tag` | `<img>`, `<video>`, `<audio>`, `<iframe>` | Remotion components wait for load and sync to the timeline |
| `deterministic-randomness` | `Math.random()` | Different per tab → use `random(seed)` |
| `no-string-assets` | Local paths as plain strings | Use `staticFile()` |
| `staticfile-no-relative`, `staticfile-no-remote` | `./`, `../`, absolute, `public/`, URLs in `staticFile()` | Paths are relative to `public/`; URLs go directly into `src` |
| `even-dimensions` | Odd composition sizes | H.264 needs even sizes |
| `no-background-image` | CSS `background-image: url()`, masks | No load signal → flicker |
| `non-pure-animation` | `transition` / Tailwind `transition*` | Wall-clock animation |
| `use-gif-component` | `.gif` in `<Img>`/`<img>` | Use `<Gif>` (or `<AnimatedImage>`) |
| `no-object-fit-on-media-video` | `objectFit` in style on `@remotion/media` `<Video>` | Use the `objectFit` prop |
| `v4-config-import` | `Config` from `remotion` | Use `@remotion/cli/config` |
| `valid-composition-and-folder-name` | Invalid ids | Letters, digits, `-` |
| `duration-in-frames`, `from-0` | `durationInFrames={Infinity}`, `from={0}` | Defaults; remove |
| `slow-css-property` (opt-in) | `boxShadow`, `textShadow`, `filter` | Slow on CPU renderers |

## 4. Version alignment and upgrades

- Every `remotion` and `@remotion/*` package must have the identical exact version (no `^`/`~`). Internal dependencies are pinned exactly, so a mismatch installs a second copy of `remotion` and breaks contexts.
- Install Remotion packages with `bunx remotion add <pkg>` — it picks the matching version and also aligns `zod`, `mediabunny`, `@mediabunny/*`, `@huggingface/transformers`.
- Upgrade with `bunx remotion upgrade` (or `--version=4.0.x`). It also upgrades project-local agent skills (`--skip-skills` to opt out). Verify with `bunx remotion versions`.
- Manual upgrade: `npm view remotion version`, set every Remotion package to that exact version, align `zod`/`mediabunny` to what `@remotion/studio@<version>` depends on, reinstall.
- After upgrading: redeploy Lambda function + site, restart Studio, re-run a still render.
- Use `scripts/check-versions.mjs` in this skill to list mismatched or caret-ranged Remotion packages.
- Release cadence is 2–3 patch releases per week; most features land in `4.0.x` patches with "available from" notes. Check the installed version before using recent APIs.

## 5. Deprecated APIs → replacements

| Deprecated | Use instead |
| --- | --- |
| `Video` / `Audio` from `remotion` | `@remotion/media` `<Video>` / `<Audio>` |
| `startFrom` / `endAt` | `trimBefore` / `durationInFrames` |
| `trimAfter` | `durationInFrames` |
| `<OffthreadVideo>`, `<Html5Video>` for new code | `@remotion/media` `<Video>` (keep Offthread for non-CORS/HEVC SSR) |
| Global `delayRender`/`continueRender`/`cancelRender` | `useDelayRender()` |
| `getRemotionEnvironment()` | `useRemotionEnvironment()` |
| `getStaticFiles`/`watchStaticFile` from `remotion` | Import from `@remotion/studio` |
| `@remotion/media-parser`, `@remotion/webcodecs` | Mediabunny |
| `getVideoMetadata()` (renderer, media-utils), `getAudioDurationInSeconds()` | Mediabunny `Input` |
| `@remotion/light-leaks`, `@remotion/starburst` | `lightLeak()` / `starburst()` from `@remotion/effects` on `<Solid>` |
| `useVideoTexture`, `useOffthreadVideoTexture` | `<Video headless onVideoFrame>` + `CanvasTexture` |
| `deploySite()` | `bundle()` + `deploySiteFromBundle()` |
| `renderMediaOnLambda` etc. from `@remotion/lambda` root | `@remotion/lambda/client` |
| `visualControl()`, `updateDefaultProps()`, `outlineRef` | Studio interactivity, `saveDefaultProps()`, automatic outlines |
| `Config.setLevel`, `setQuality`, `setImageFormat` | `setLogLevel`, `setJpegQuality`, `setVideoImageFormat`/`setStillImageFormat` |
| `@remotion/mcp` | Docs `.md` URLs / llms.txt |
| `<MotionBlur>` | `<HtmlInCanvasMotionBlur>` or `<Trail>` |
| `Experimental.Clipper`, `Experimental.Null` | Removed (throw) |
| Cloud Run for new projects | Lambda or Vercel Sandbox |

## 6. Remotion 5.0 (planned) and how to be ready now

5.0 is not released; its breaking changes exist in code behind a disabled flag. Planned changes:

- Node ≥22, Bun ≥1.1.3, ESLint ≥8.57, React ≥18.
- License key passed to rendering APIs and config is mandatory for company-license holders (`'free-license'` if eligible); `apiKey` alias removed.
- WebGL enabled by default (`gl: 'angle'` with software fallback; Lambda stays `swangle`).
- `selectComposition()`/`getCompositions()` require `inputProps`; `bundle()`/`getCompositions()` positional signatures removed.
- Sequences premount `fps` frames by default; `pauseWhenBuffering`/`pauseWhenLoading` default true; Player `numberOfSharedAudioTags` default 0.
- Default `colorSpace: 'bt709'` (`'default'` removed).
- Google Fonts `loadFont()` requires `weights` + `subsets`; layout-utils `validateFontIsLoaded` default true.
- `visualizeAudio` default `optimizeFor: 'speed'`; `measureSpring` drops `from`/`to`; `<TransitionSeries layout="none">` removed; `getPointAtLength`/`getTangentAtLength` return `null` past the end.
- Lambda: `overwrite: true`, x264 `veryfast`, disk 10240 MB default (function names change → use `speculateFunctionName`), render APIs only from `/client`. Cloud Run `maxInstances` 5.
- `getVideoMetadata()` removed; `openBrowser({shouldDumpIo})` removed; packages light-leaks, starburst, media-parser, webcodecs no longer published.

Write v4 code that already works in v5: pass `inputProps: {}`, use object signatures, pass `weights`/`subsets`, set `premountFor` explicitly, use `@remotion/effects` and Mediabunny, set `colorSpace: 'bt709'`, set `gl` explicitly when WebGL is used, pass `licenseKey`, import Lambda render APIs from `/client`, pass `diskSizeInMb` explicitly.
