# Assets and Async Loading

`staticFile`, image components, `<Solid>`, `<HtmlInCanvas>`, `<IFrame>`, the `delayRender` family, prefetch/preload, and font loading basics. Snapshot: `remotion@4.0.532`.

## Contents

1. Why asset components matter
2. `staticFile` and remote URLs
3. Images: `<Img>`, `<CanvasImage>`, `<AnimatedImage>`, `<Gif>`
4. `<Solid>`, `<HtmlInCanvas>`, `<IFrame>`
5. `useDelayRender` and the global `delayRender`
6. Prefetch and preload
7. Asset pitfalls

---

## 1. Why asset components matter

Remotion's asset components register a delayRender handle until the asset is loaded and decoded, and sync media to the timeline. Native `<img>`, `<video>`, `<audio>`, `<iframe>`, Next.js `<Image>`, and CSS `background-image` / `mask-image` do not, so the screenshot may capture a half-loaded or blank frame (flicker). The ESLint plugin flags all of these (`warn-native-media-tag`, `no-background-image`).

## 2. `staticFile` and remote URLs

- Put files in `public/` and reference them with `staticFile('logo.png')` (subfolders: `staticFile('img/a.png')`). A leading `/` is trimmed and fine.
- Remote URLs go directly into `src`. `staticFile('https://…')` throws.
- `staticFile()` also throws on `null`, `./` or `../` prefixes, OS absolute paths (`/Users`, `/home`, `/tmp`, `C:`…), and a `public/` prefix.
- It URL-encodes each segment since v4. Do not pre-encode (double encoding → 404).
- It returns `/static-<hash>/…` in Studio and renders. Files added to `public/` after `bundle()` are not in the bundle.
- Image sequences: `<Img src={staticFile(`frames/${String(Math.floor(frame)).padStart(4, '0')}.png`)} />`.
- `getStaticFiles()` / `watchStaticFile()` list and watch `public/` in Studio. Import them from `@remotion/studio` (the `remotion` exports are going away in v5). Returns `[]` in Player and Node.
- Importing assets through the bundler (`import logo from './logo.png'`) still works but is discouraged. Dynamic `require()` must contain the expression inside the call.

## 3. Images

### `<Img>` (`remotion`)

Native `<img>` props plus:

- `maxRetries` (default 2, exponential backoff), `delayRenderTimeoutInMilliseconds`, `delayRenderRetries`.
- `onError` — if you pass it, you must unmount or change `src`, otherwise the render times out. Without it, a load failure cancels the render (since v4).
- `pauseWhenLoading` (default `false` in v4, `true` in v5) — pauses Player while loading.
- `effects` (4.0.469) — non-empty array switches rendering to a canvas (`<CanvasImage>`); then `ref`, `srcSet`, `onLoad`, `alt` and similar are not available, and `style.objectFit` supports fill/contain/cover.
- Crop props, timing props, premount props.
- Not for animated GIFs. Chrome's max image area is 2^29 pixels.

### `<CanvasImage>` (`remotion`, 4.0.466)

Static image drawn to a `<canvas>`. Use it when you want `effects`. Props: `src` (CORS required for remote), `width`/`height` (default: decoded size), `fit` (`fill` | `contain` | `cover`), `crossOrigin` (default `'anonymous'`), `onError`, `maxRetries`, `pauseWhenLoading`, `effects`, crop/timing/premount props.

### `<AnimatedImage>` (`remotion`, 4.0.246)

GIF, APNG, AVIF, animated WebP, synced to the timeline via `ImageDecoder` (Chrome/Firefox; not Safari). Props: `src` (CORS), `width`, `height`, `fit`, `loopBehavior` (`'loop'` | `'pause-after-finish'` | `'clear-after-finish'`), `playbackRate`, `requestInit`, `effects`, crop/timing/premount props.

### `<Gif>` (`@remotion/gif`)

GIF only, works in more browsers, accepts `effects` and timing props. The ESLint rule `use-gif-component` steers `.gif` sources here. Use `<AnimatedImage>` for APNG/WebP/AVIF.

## 4. `<Solid>`, `<HtmlInCanvas>`, `<IFrame>`

### `<Solid width height color? effects? pixelDensity?>` (4.0.464)

A solid-color canvas. Main use: a full-frame layer to carry generative effects (light leak, starburst, gradients, noise). Accepts crop, timing, premount props. Pass `pixelDensity={usePixelDensity()}` for sharp output at `--scale`.

### `<HtmlInCanvas width height onPaint? onInit? effects? pixelDensity?>` (4.0.455)

Renders its DOM children into a canvas using the WICG HTML-in-canvas API, so you can apply effects or shaders to arbitrary HTML.

- Preview needs Chrome ≥149 with `chrome://flags/#canvas-draw-element` enabled — tell the user. Otherwise it throws. `HtmlInCanvas.isSupported()` checks.
- Server renders work out of the box (Remotion's bundled Chrome 149 enables the flag), including Lambda and Vercel.
- `onPaint({canvas, element, elementImage, pixelDensity})` replaces the default `drawElementImage` paint; async work holds the frame. `onInit` must return a cleanup.
- Nesting needs Chrome ≥157 (`HtmlInCanvas.isNestingSupported()`); not in server renders yet. Treat nesting as fragile.

### `<IFrame src>`

Waits for the iframe load. The embedded page must not animate on its own. Not supported in client-side rendering.

## 5. `useDelayRender` and the global `delayRender`

Use these for any async work that the frame depends on: fetch, font loading you do yourself, WASM init, canvas decode, map tiles.

```tsx
import {useCallback, useEffect, useState} from 'react';
import {useDelayRender} from 'remotion';

export const WithData: React.FC<{url: string}> = ({url}) => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender(`Fetching ${url}`, {retries: 1, timeoutInMilliseconds: 20000}));
  const [data, setData] = useState<unknown>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(url);
      setData(await res.json());
      continueRender(handle);
    } catch (err) {
      try {
        cancelRender(err);
      } catch {
        // cancelRender throws by design
      }
    }
  }, [url, handle, continueRender, cancelRender]);

  useEffect(() => {
    load();
  }, [load]); // never depend on frame

  return data ? <pre>{JSON.stringify(data)}</pre> : null;
};
```

Rules:

- Prefer `useDelayRender()` (4.0.342) over global `delayRender`/`continueRender`/`cancelRender`. It is scoped to the render, required for client-side rendering, and does not conflict with a `<Player>` on the same page.
- Create the handle once: `useState(() => delayRender('label'))`. Calling `delayRender()` in the render body creates a new handle on every React render. Never call it at module top level (it blocks all compositions, including composition listing).
- Label every handle — the label appears in timeout errors.
- Default timeout is 30 s; the effective timer is `timeout − 2000 ms`, so errors say "not cleared after 28000ms".
- Per-call options: `timeoutInMilliseconds`, `retries` (on timeout, the tab closes and the frame retries).
- Raise globally with `--timeout`, `timeoutInMilliseconds` on render APIs, `Config.setDelayRenderTimeoutInMilliseconds()`, or per component `delayRenderTimeoutInMilliseconds` props.
- `cancelRender(err)` stops the render without retries and throws. Wrap in try/catch in client-side rendering.
- Handles are no-ops in Player/Studio (no timeout), so a missing `continueRender` only shows up when rendering.
- `useBufferState().delayPlayback()` is the preview-side counterpart (pauses playback while loading).

Timeout causes: `continueRender` never called; network blocked (VPC, firewall); huge downloads (prefer `@remotion/media` over `<OffthreadVideo>`); too many heavy tabs (lower concurrency); wrong entry point (`"Loading root component"`). "Timed out evaluating page function" is browser overload, not a leaked handle: lower concurrency and raise `--timeout`.

## 6. Prefetch and preload

- `prefetch(src, {method?: 'blob-url' | 'base64', contentType?, credentials?, onProgress?, logLevel?})` → `{free(), waitUntilDone()}`. Downloads an asset fully for smooth Player playback; Remotion media tags reuse the blob automatically. No-op during rendering. Use `base64` + `contentType` for Safari audio. Needs CORS.
- `@remotion/preload`: `preloadVideo`, `preloadAudio` (only help HTML5 elements, not `@remotion/media`), `preloadImage`, `preloadFont` (add `<link rel=preload>`), `resolveRedirect(url)` (CORS).
- Swapping a media `src` at runtime in the Player can error ("cannot be seeked"). `await prefetch(url).waitUntilDone()` before switching.

## 7. Asset pitfalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| Image flickers or is blank in some frames | `<img>`, CSS `background-image`, Next `<Image>` | `<Img>` inside `<AbsoluteFill>`; for masks also render a hidden `<Img>` with the same `src` |
| 404 for a `public/` file | Plain path string or double encoding | `staticFile('name.png')`, raw name |
| Render hangs then times out on an image | `onError` provided but `src` never changed | Remove `onError` or replace the source |
| Tainted canvas / CORS error | Remote asset without CORS headers on a canvas-based component | Serve `Access-Control-Allow-Origin`, or use `staticFile()` |
| Black frame when a scene enters in preview | Assets load on mount | `premountFor={fps}` |
| Measured text sizes wrong | Measured before font loaded | Wait for font loading (`waitUntilDone()` / delayRender) before measuring |
| `defaultProps too big` | Data URLs or large arrays in props | Pass URLs; load inside the component |
