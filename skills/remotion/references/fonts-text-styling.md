# Fonts, Text Layout, and Styling

Google and local fonts, text measuring and fitting, rounded caption boxes, text highlights, Tailwind, SCSS, and CSS rules for video. Snapshot: 4.0.532.

## Contents

1. Google Fonts
2. Local and remote font files
3. Waiting for fonts before measuring
4. `@remotion/layout-utils`
5. Rounded text boxes and highlights
6. Tailwind CSS
7. SCSS and CSS modules
8. CSS rules for video

---

## 1. Google Fonts (`@remotion/google-fonts`)

```ts
// src/fonts.ts — module top level, imported by every scene that uses it
import {loadFont} from '@remotion/google-fonts/Inter';

export const inter = loadFont('normal', {weights: ['400', '700', '800'], subsets: ['latin']});
export const fontFamily = inter.fontFamily;
```

- Always pass `weights` and `subsets`. Without them v4 loads every file (dozens of requests → timeouts); v5 requires them. An unknown weight throws ("does not have a weight X").
- `loadFont()` holds a delayRender handle per file until loaded, so plain text needs nothing else.
- Variable fonts (4.0.525): `loadVariableFont('normal', {subsets: ['latin']})` → `{fontFamily, axes, waitUntilDone}`; animate `fontWeight` with `interpolate(frame, …, [axes.wght.min, axes.wght.max])`.
- Several styles: call `loadFont` once per style. Avoid name clashes with `import * as Montserrat from '@remotion/google-fonts/Montserrat'`.
- Font pickers: `getAvailableFonts()` from `@remotion/google-fonts` → `{fontFamily, importName, load()}`; the chosen font must also be loaded inside the composition.
- `getInfo()` lists available weights/subsets.

## 2. Local and remote font files (`@remotion/fonts`)

```ts
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const family = 'Brand Sans';
export const brandFontsLoaded = Promise.all([
  loadFont({family, url: staticFile('fonts/BrandSans-Regular.woff2'), weight: '400'}),
  loadFont({family, url: staticFile('fonts/BrandSans-Bold.woff2'), weight: '700'}),
]);
```

- Wraps itself in delayRender; on any error it cancels the render (wrong path or format fails loudly).
- Load each weight/style file separately with the same `family`.
- Also registers fonts for SVG `<text>` in the web renderer.
- Alternatives: CSS `@import url('https://fonts.googleapis.com/css2?family=…')` in an imported stylesheet, or manual `new FontFace(...)` + delayRender.

## 3. Waiting for fonts before measuring

Text measurement must happen after fonts load, otherwise sizes come from the fallback font.

```tsx
import {useEffect, useState} from 'react';
import {useDelayRender} from 'remotion';
import {inter} from './fonts';

export const WaitForFonts: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender('Waiting for fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    inter
      .waitUntilDone()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle, continueRender, cancelRender]);
  return ready ? <>{children}</> : null;
};
```

## 4. `@remotion/layout-utils` (browser only)

| Function | Returns | Use |
| --- | --- | --- |
| `measureText({text, fontFamily, fontSize, fontWeight?, letterSpacing?, …})` | `{width, height}` | Size a single line. Cached. |
| `fitText({text, withinWidth, fontFamily, fontWeight?, …})` | `{fontSize}` | Largest size that fits one line. No cap — use `Math.min(max, fontSize)`. |
| `fitTextOnNLines({text, maxBoxWidth, maxLines, fontFamily, maxFontSize?, …})` | `{fontSize, lines}` | Headlines that may wrap to N lines. |
| `fillTextBox({maxBoxWidth, maxLines}).add({text, …})` | `{exceedsBox, newLine}` | Word-by-word fill (captions, typewriter). |

- Set `validateFontIsLoaded: true` (off by default in v4) so it throws when the font is not loaded.
- Use exactly the same font props in measurement and markup (share constants).
- Remotion uses `box-sizing: border-box`: a `border` shrinks the content box. Use `outline` or subtract the border.
- Do not multiply by `useCurrentScale()`; measurements are in composition pixels.
- Not usable in Node scripts or `calculateMetadata` (no DOM).

## 5. Rounded text boxes and highlights

- `@remotion/rounded-text-box`: `createRoundedTextBox({textMeasurements, textAlign, horizontalPadding, borderRadius})` → `{d, boundingBox}`. Measure each line with `measureText` (same `lineHeight`), draw the path in an SVG behind the lines — TikTok/Reels-style caption backgrounds.
- `@remotion/rough-notation` (4.0.490): `<Highlight>`, `<Underline>`, `<StrikeThrough>`, `<CrossedOff>`, `<Box>`, `<Bracket>`, `<Circle>` around text, drawn by `progress` (0–1, required): `progress={interpolate(frame, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}`. Props: `color`, `strokeWidth`, `iterations`, `padding`, `roughness`, `seed` (change per frame for a hand-drawn "boil"). `Circle` clashes with `@remotion/shapes` — alias on import.

## 6. Tailwind CSS

Tailwind v4:

```bash
bunx remotion add @remotion/tailwind-v4
bun add -d tailwindcss
```

```ts
// remotion.config.ts
import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind-v4';
Config.overrideBundlerConfig((config) => enableTailwind(config));
```

```css
/* src/index.css */
@import 'tailwindcss';
```

- Import `./index.css` in `src/Root.tsx`. If `package.json` has `"sideEffects": false`, set `["*.css"]`.
- Node `bundle()` does not read the config: pass the same override as `bundlerOverride`.
- Tailwind v3: `@remotion/tailwind` + `tailwind.config.js` (`enableTailwind(config, {configLocation})`).
- Never use `animate-*` or `transition-*` classes (they run on wall-clock time; ESLint `non-pure-animation`). Static utility classes are fine; animate with inline styles from `interpolate`.
- Tailwind classes lose to the Player's inline sizing — size the Player with `style`.

## 7. SCSS and CSS modules

`bunx remotion add @remotion/enable-scss && bun add sass` → `Config.overrideBundlerConfig((c) => enableScss(c))`. Plain CSS and CSS modules work without setup (`import './styles.css'`).

## 8. CSS rules for video

- Fixed canvas: absolute positioning with `<AbsoluteFill>` is normal and safe.
- Text rendering: Chrome renders with `--font-render-hinting=none`; for slow subpixel moves add `willChange: 'transform'`.
- Avoid expensive CSS on CPU-only render machines: large `box-shadow`, `text-shadow` stacks, `filter: blur()`, `backdrop-filter`, big gradients. Precompute as images or use `@remotion/effects` with a GPU.
- Text outline: `WebkitTextStroke` + `paintOrder: 'stroke'`.
- Emoji and CJK: Lambda ships Noto (CJK + color emoji); Docker images need `fonts-noto-color-emoji fonts-noto-cjk`. Prefer loading fonts explicitly for consistent output across machines.
- `@remotion/animation-utils`: `interpolateStyles(frame, [0, 30], [{opacity: 0, transform: makeTransform([translateY(40)])}, {opacity: 1, transform: makeTransform([translateY(0)])}])` interpolates whole style objects (same units and transform order in every keyframe; colors ignore easing). `makeTransform([rotate(45), scale(1.2)])` builds ordered transform strings.
