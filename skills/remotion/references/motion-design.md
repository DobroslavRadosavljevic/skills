# Motion Design for Programmatic Video

How to make Remotion videos look professionally designed: formats, layout, typography, timing, easing, scene structure, and recipes for common video types. Remotion-specific API details live in the other references.

## Contents

1. Design for video, not a web page
2. Formats and safe areas
3. Typography
4. Color and backgrounds
5. Timing and pacing
6. Easing vocabulary
7. Scene structure
8. Recipes by video type
9. Data visualization
10. Quality bar checklist

---

## 1. Design for video, not a web page

- Each scene has one focal point. Decide what the viewer notices first and build the frame around it. Remove decoration that does not serve it.
- Viewers cannot scroll or pause to read. Short copy, large type, and enough time on screen (≈ reading speed of 3–4 words per second plus 1 s).
- Motion directs attention: animate the important element last or most strongly; keep the rest calm.
- Consistency beats variety: one easing family, one transition style, a small palette, two type weights.
- Make it parameterizable: content (copy, colors, images, durations) in props; layout and motion in code.

## 2. Formats and safe areas

| Format | Size | fps | Use |
| --- | --- | --- | --- |
| Landscape | 1920×1080 | 30 (or 60 for UI demos) | YouTube, web, presentations |
| Vertical | 1080×1920 | 30 | Reels, TikTok, Shorts |
| Square | 1080×1080 | 30 | Feeds |
| 4:5 | 1080×1350 | 30 | Instagram feed |
| 4K | 3840×2160 | 30 | Render 1080p with `--scale=2` when the design is resolution-independent |

- Use even dimensions (H.264). Prefer 30 fps unless motion is fast (UI scrolls, sports) — 60 fps doubles render cost.
- Safe area at 1080 px width: keep key text ≥80 px from left/right and ≥100 px from top/bottom. Scale proportionally for other widths.
- Vertical social: keep captions and CTAs out of the bottom ~20% and right ~15% (platform UI).
- Register one composition per format; share scene components and compute layout from `useVideoConfig()` (`width < height` → vertical layout).

## 3. Typography

- Minimum sizes at 1080 px width: headline ≥84 px, supporting text ≥44 px (≈150 / 78 px at 1920 width). Lower thirds ≈48 px semibold.
- Load fonts explicitly (Google Fonts with weights and subsets, or local files). Never rely on system fonts — render machines differ.
- Tight headline leading (1.0–1.15), slightly negative tracking for large display type, regular tracking for body.
- Fit dynamic copy with `fitText`/`fitTextOnNLines` and cap the size; never let user text overflow.
- Outline or shadow text only when it sits on video; prefer a solid or blurred plate behind text over heavy shadows.
- Numbers that animate: `fontVariantNumeric: 'tabular-nums'` so digits do not jitter.

## 4. Color and backgrounds

- Pick a palette per project (background, surface, text, muted text, one or two accents). Do not reuse example palettes.
- Contrast: text must stay readable at every frame of an animation (check mid-transition frames).
- Backgrounds: subtle motion (slow gradient drift with `interpolateColors`, noise-driven blobs, generator effects on a `<Solid>`) keeps static scenes alive. Keep it slow and low-contrast.
- Avoid pure black/white for large areas unless intentional; slightly tinted neutrals look richer.
- Brand colors as props (`zColor()`), so templates can be re-themed.

## 5. Timing and pacing

| Element | Typical duration at 30 fps |
| --- | --- |
| Element entrance | 12–24 frames (0.4–0.8 s) |
| Element exit | 8–15 frames (exits faster than entrances) |
| Stagger between items | 3–6 frames |
| Scene transition | 12–20 frames |
| Light leak / flash overlay | 20–30 frames |
| Scene length | 60–150 frames (2–5 s) for promos; longer for explanations |
| Hold after text lands | ≥1 s + reading time |
| Lower third on screen | 4–6 s |

- Hook in the first 1–2 seconds for social video.
- Cut or transition on the beat when music is present (compute beat frames from BPM: `frame = Math.round(beat * 60 / bpm * fps)`).
- Leave breathing room: not everything moves at once. Overlap animations slightly (start the next before the previous ends) for flow.
- End with a clean hold (logo/CTA) of at least 1.5 s.

## 6. Easing vocabulary

| Intent | Easing |
| --- | --- |
| Default entrance (fast in, soft landing) | `Easing.bezier(0.16, 1, 0.3, 1)` |
| Smooth push, no bounce | `Easing.spring({damping: 200})` or `spring({config: {damping: 200}})` |
| Playful pop | `spring({config: {damping: 12, stiffness: 120}})` or keyframes `[0, 0.6, 1] → [0, 1.15, 1]` |
| Exit | `Easing.in(Easing.cubic)` or `Easing.bezier(0.7, 0, 0.84, 0)` |
| Camera travel / long moves | `Easing.bezier(0.645, 0.045, 0.355, 1)` |
| Mechanical / UI cursor | `Easing.bezier(0.25, 0.1, 0.25, 1)` |
| Stop-motion feel | `posterize: 2`–`4` on interpolations |

- Scale animations: `output: 'perceptual-scale'`.
- Always clamp `interpolate` unless you want overshoot.
- Prefer one or two easing curves across a video.

## 7. Scene structure

- One file per scene; the main composition sequences them with `<Series>` (cuts) or `<TransitionSeries>` (transitions/overlays).
- Register substantial scenes as connected compositions so they can be previewed and edited alone.
- Scene durations as props or computed in `calculateMetadata` (from audio, data, or copy length); total = sum − transitions.
- Shared elements that persist across scenes (logo bug, background, progress bar, music) go in the parent outside the series.
- Text and data inside scenes come from props; never hardcode content that a user will want to change.

## 8. Recipes by video type

**Product promo (15–30 s)**: hook headline (scale + fade) → 2–4 feature scenes (screenshot/video in a device frame with a callout) → social proof/number counter → logo + CTA hold. Music + whooshes on transitions.

**Social clip with captions (vertical)**: talking-head video full-bleed (`objectFit: 'cover'`), word-highlight captions in the upper-middle third, progress bar at the top, hook text for the first 2 s.

**Explainer / data story**: title → sequential beats, each one idea, with diagrams built from SVG paths (`evolvePath`), numbers (`tabular-nums` counters), and charts that grow from zero. Voiceover drives durations.

**Lower third / overlay**: transparent background, slide/wipe in from the side with an accent bar, hold, exit; render as ProRes 4444.

**Data-driven batch (personalized videos)**: one parameterized composition with a Zod schema; `calculateMetadata` fetches data; render many with SSR or Lambda in a loop over input props.

**Product UI demo**: screen recording or recreated UI components in React, animated cursor (`@remotion/mac-cursors`) with eased moves and click feedback, zoom-ins via `scale` + `translate` on a wrapper, callouts that point at elements.

**Audiogram / podcast**: waveform or bars from `useWindowedAudioData`, speaker image, captions, title; length from the audio duration.

## 9. Data visualization

- Build charts from SVG (paths, rects) or a chart library rendered statically; animate with frame-driven progress, not the library's own animation (disable it).
- Grow from a baseline: bars scale from 0 with staggered springs; lines draw with `evolvePath`; pies with `<Pie progress>`.
- Label values directly instead of using legends; highlight the takeaway (color the important bar, dim others).
- Axis and gridlines subtle; numbers in tabular figures; counters ease out.

## 10. Quality bar checklist

- [ ] Every animation is frame-driven and clamped; no flicker in a rendered MP4.
- [ ] Text readable at every frame (check mid-transition stills).
- [ ] Safe areas respected for the target platform.
- [ ] Fonts explicitly loaded; no fallback font in stills.
- [ ] Consistent easing and transition language.
- [ ] Durations match audio/content; no blank tail or cut-off ending.
- [ ] Audio levels balanced (music under voice, SFX subtle), fades at start/end.
- [ ] Content in props; schema present for anything a user will change.
