---
name: remotion
description: "Build, animate, review, debug, render, deploy, or migrate programmatic videos with Remotion 4.0.532 (React video framework). Use for remotion, @remotion/* packages, compositions, Sequence/Series/TransitionSeries, interpolate/spring/Easing, calculateMetadata and Zod props, @remotion/media Video/Audio, captions and Whisper transcription, effects/shaders, three/skia, fonts, Tailwind, Remotion Studio and Studio-editable code, Player embeds, CLI/SSR renders (renderMedia, codecs, ProRes/transparent output), Lambda, Vercel Sandbox, client-side web-renderer, AI-generated videos, and v5 upgrades. Also use when the user asks to make a video, motion graphics, animated promo, explainer, social clip, lower third, audiogram, or data video in code, even without naming Remotion."
---

# Remotion

Use this skill for any work that creates or changes videos made with React code: authoring compositions, animation, media, captions, effects, the Studio, the Player, rendering, cloud rendering, and upgrades.

Snapshot: `remotion@4.0.532` with all `@remotion/*` packages at the same version (2026-10-01). Remotion 5.0 is unreleased; many docs pages already describe v5 defaults — this skill states v4 behavior and flags v5 changes. Refresh facts from [source-map.md](references/source-map.md).

## Workflow

1. **Inspect first.** Read `package.json` (installed Remotion version, `@remotion/*` packages, package manager, Tailwind), the entry file (`registerRoot`), the Root file (`<Composition>`s), and `remotion.config.ts`. Run `bun <skill-dir>/scripts/check-versions.mjs` (or `bunx remotion versions`) — mismatched versions cause confusing errors. Check "available from" versions before using recent APIs.
2. **No project yet?** Scaffold with `bunx create-video@latest --yes --blank --no-tailwind <dir>` (or a template flag, see [player-apps.md](references/player-apps.md)). Inspect the target folder first (including hidden files); never delete meaningful files.
3. **Open the preview early.** Start `bunx remotion studio` (with an in-app browser: `--no-open`, then open the printed URL and `/<composition-id>`). Keep it running so the user can watch and steer.
4. **Plan the video** before coding: format, fps, duration, scenes, copy, palette, fonts, audio. Use [motion-design.md](references/motion-design.md) for layout, typography, pacing, and easing defaults.
5. **Author** with the rules below and the matching reference. Put content in props (schema or inferred `defaultProps`), timing in frames derived from `fps`, one file per scene.
6. **Verify visually** (see Verification). Fix, re-check.
7. **Render only when asked** ("render", "export", "give me the MP4"). Otherwise the deliverable is the working Studio preview. Pick output settings from [encoding-output.md](references/encoding-output.md).
8. **Preserve user edits.** The user may change files in the Studio or editor between turns. Treat surprising changes as intentional; ask before overwriting.
9. Prefer `bun` / `bunx` in commands. Install Remotion packages with `bunx remotion add <pkg>` so versions match.

## Non-negotiable rules

These exist because the renderer screenshots frames in many parallel browser tabs, out of order, with no shared state.

- **Everything moves from `useCurrentFrame()`.** No CSS `transition`/`animation`, Tailwind `animate-*`/`transition-*`, timers, `requestAnimationFrame`, R3F `useFrame`, or libraries playing on wall-clock time. Use `interpolate`, `spring`, `Easing`, or the frame-driven integrations (`@remotion/gsap`, `@remotion/lottie`, `@remotion/three`).
- **Clamp interpolations** (`extrapolateLeft/Right: 'clamp'`) — the default extends past the keyframes. Use `output: 'perceptual-scale'` for scale.
- **Deterministic:** `random(seed)`, never `Math.random()`. Same props + frame → same pixels.
- **Wait for async work** with `useDelayRender()` (create the handle once, release it on every path, `cancelRender` on errors). Prefer fetching JSON once in `calculateMetadata`.
- **Use Remotion asset components:** `<Img>`, `<CanvasImage>`, `<AnimatedImage>`/`<Gif>`, `<IFrame>`, and `<Video>`/`<Audio>` from **`@remotion/media`** (not from `remotion`, whose `Video`/`Audio` are deprecated HTML5 aliases). No `<img>`, `<video>`, CSS `background-image`.
- **Assets:** files in `public/` via `staticFile('name.png')`; remote URLs passed directly; no `fs`, no absolute paths.
- **Times in frames from fps:** `2 * fps`, `spring({frame, fps})`. Integer `durationInFrames` (`Math.ceil(seconds * fps)`). Even width/height.
- **Registration:** `registerRoot()` once in its own entry file; never nest `<Composition>`; props typed with `type`, JSON-serializable.
- **One exact version** for `remotion` and every `@remotion/*` package (no `^`).
- **Premount** timed scenes and media: `premountFor={fps}` (prevents black frames in preview).
- **WebGL needs a GL backend in v4 renders:** effects, Three.js, Skia, maps, shader transitions → `--gl=angle` (GPU) or `--gl=swangle` (no GPU); `chromiumOptions.gl` in Node/Lambda.
- **Keep code Studio-editable** when a user will tweak the video: inline style literals, inline `interpolate(frame, …)` with simple ranges, CSS `translate`/`scale`/`rotate` instead of `transform` strings, hardcoded `name` props, timing props on components, inline `defaultProps`. Details: [studio-interactivity.md](references/studio-interactivity.md).

## Reference map

Load only what the task needs.

| Task | Reference |
| --- | --- |
| Project layout, `<Composition>`, props, Zod schema, `calculateMetadata`, env vars, artifacts | [compositions-props.md](references/compositions-props.md) |
| Frame model, timing props, `Sequence`/`Series`/`Loop`/`Freeze`, premount, `interpolate`/`spring`/`Easing`, recipes | [timeline-animation.md](references/timeline-animation.md) |
| `staticFile`, images, `<Solid>`, `<HtmlInCanvas>`, delayRender patterns, prefetch | [assets-async.md](references/assets-async.md) |
| Video/audio tags, mixing, volume, visualization, Mediabunny metadata, transparency, SFX, matting | [media-audio.md](references/media-audio.md) |
| Captions, SRT, Whisper/ElevenLabs/OpenAI transcription, voiceover pipelines | [captions-transcription.md](references/captions-transcription.md) |
| `TransitionSeries`, presentations, overlays, duration math | [transitions.md](references/transitions.md) |
| Fonts, text fitting, highlights, Tailwind, SCSS, CSS rules | [fonts-text-styling.md](references/fonts-text-styling.md) |
| Shapes, paths, noise, motion blur, Lottie, GIF, Rive, GSAP, cursors | [visual-libraries.md](references/visual-libraries.md) |
| `@remotion/effects` catalog, custom effects, shaders, GL backends, Three.js, Skia | [effects-3d.md](references/effects-3d.md) |
| Maps and geographic animations | [maps.md](references/maps.md) |
| Design quality: formats, safe areas, typography, pacing, easing, video recipes | [motion-design.md](references/motion-design.md) |
| Studio usage, editable code, `Interactive.withSchema`, connected compositions, Studio APIs | [studio-interactivity.md](references/studio-interactivity.md) |
| `<Player>`, app architecture, templates, editors, framework integrations | [player-apps.md](references/player-apps.md) |
| CLI, config file, Node/Bun SSR, browser, Docker, performance, licensing | [rendering-ssr.md](references/rendering-ssr.md) |
| Codecs, CRF, ProRes, transparency, GIF, color space, hardware encoding | [encoding-output.md](references/encoding-output.md) |
| Lambda, Vercel Sandbox, Cloud Run, client-side `renderMediaOnWeb` | [cloud-rendering.md](references/cloud-rendering.md) |
| LLM-generated compositions, runtime compilation, prompt-to-video, docs for agents | [ai-generated-video.md](references/ai-generated-video.md) |
| Symptom table, ESLint rules, upgrades, deprecations, v5 readiness | [troubleshooting-upgrades.md](references/troubleshooting-upgrades.md) |
| Versions, package catalog, changelog, doc/source mismatches | [source-map.md](references/source-map.md) |

## Judgment

- **Default stack for a new video:** 1920×1080 (or 1080×1920 for social) at 30 fps; `@remotion/media` for media; Google Fonts with explicit weights/subsets; `<TransitionSeries>` for multi-scene videos; Zod schema or inline `defaultProps` for every user-changeable value; `calculateMetadata` for data- or audio-driven durations.
- **Prefer core features over extra packages:** timing props on components over wrapper `<Sequence>`s; `interpolate` with string outputs over transform helpers; CSS for simple visuals before effects; CSS transition presentations before shader ones when the result plays in a `<Player>`.
- **Effects and 3D cost render time.** On CPU-only or Lambda renders, prefer CSS and pre-rendered images; reserve WebGL for what CSS cannot do.
- **Where to render:** local CLI for one-offs; Node SSR (bundle once, render many) for servers and batch jobs; Lambda for scalable apps; Vercel Sandbox when already on Vercel; `@remotion/web-renderer` when no server is wanted and the CSS subset is enough. Never render inside a Next.js route with `@remotion/bundler`.
- **Licensing:** companies with 4+ people need a company license. Mention it when building products; pass `licenseKey` to render APIs. Do not decide eligibility for the user.
- **Secrets:** never ask users to paste cloud keys or API tokens into chat; use `.env` and the platform's secret store. Keep secrets out of the bundle.
- **Docs drift:** Remotion ships 2–3 releases a week. When unsure, fetch the `.md` docs page (`https://www.remotion.dev/docs/<page>.md`) or read the source in the monorepo; source wins over docs.

## Verification

Pick the checks that fit the change:

- Typecheck (`bunx tsc --noEmit`) and lint if the project has `@remotion/eslint-plugin`.
- Studio preview loads the composition without runtime errors.
- Stills at key frames: `bunx remotion still <id> out/check.png --frame=<n>`, or several at once: `bunx remotion render <id> out/frames --frames=0,30,90,<last> --image-format=png`. Inspect the images: layout, safe areas, fonts loaded, text readable mid-transition, no blank frames.
- For WebGL, maps, media sync, or flicker concerns: render a short MP4 range (`--frames=0-90`, add `--gl=angle` when needed) and check it plays correctly.
- Duration matches content: no cut-off ending, no blank tail (transition math, audio length).
- After dependency changes: `bun <skill-dir>/scripts/check-versions.mjs`.
- After upgrades or cloud changes: redeploy Lambda function and site; run one test render.
