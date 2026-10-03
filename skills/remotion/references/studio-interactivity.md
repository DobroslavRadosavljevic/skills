# Studio and Studio-Editable Code

Running the Studio, `@remotion/studio` APIs, writing code that the Studio can edit visually (`Interactive.*`, `Interactive.withSchema`, `InteractivitySchema`), connected compositions, Elements, and WebMCP. Snapshot: 4.0.532.

## Contents

1. Running the Studio
2. Why editability rules exist
3. Editability rules
4. `Interactive.*` elements and schema fragments
5. `Interactive.withSchema` and `InteractivitySchema`
6. Connected compositions (precomps)
7. `@remotion/studio` APIs
8. Elements and the Studio protocol
9. WebMCP tools and agent workflow
10. Shortcuts and configuration

---

## 1. Running the Studio

- `bunx remotion studio [entry]` (templates: `bun run dev`). Port 3000 or the next free one. If a Studio already runs for the project, the command prints its URL.
- Agent with an in-app browser: `bunx remotion studio --no-open`, open the printed URL, confirm it loads, then open `http://localhost:3000/<composition-id>` and confirm the preview renders. Otherwise run without `--no-open`.
- Useful flags: `--port`, `--force-new` (second instance), `--props`, `--log=verbose`, `--rspack`, `--disable-keyboard-shortcuts`, `--disable-interactivity`, `--allow-html-in-canvas`, `--cross-site-isolation`, `--editor=cursor`, `--ipv4`.
- The Studio has a render dialog (GUI) — a friendlier render path for users.
- Static deploy: `bunx remotion bundle` → `build/` on any static host = read-only Studio + serve URL. remotion.dev/new is a browser-only Studio.

## 2. Why editability rules exist

Studio edits write back to the **JSX source node** that produced an item: dragging writes `style.translate`, resizing writes `style.scale`, keyframes rewrite inline `interpolate()` calls, the Props panel rewrites the `defaultProps` literal. The Studio can only edit what it can statically read. Computed values show as grayed out. Follow these rules whenever the user may tweak the video in the Studio — which is the default for "make me a video" requests.

## 3. Editability rules

1. One JSX node per independently editable item (scene, layer, clip, title). Use `.map()` only for intentionally uniform repetition (bars, particles, list rows).
2. Give every timed or interactive item a hardcoded `name="…"` (no computed names).
3. Inline `style={{…}}` object literals — no spreads, constants, helper functions, or `useMemo` style objects. Write fixed copy inline as children.
4. Animate with inline `interpolate(frame, [inputs], [outputs], {options})` on the style property.
   - First argument is `frame`.
   - Input range may use only `fps`, `durationInFrames`, `width`, `height` from `useVideoConfig()` in simple forms: `fps`, `2 * fps`, `fps * 2`, `durationInFrames - 1`.
   - Output range, easing, extrapolation, and `output` must be literals.
   - Editable easings: `Easing.linear`, `Easing.step1`, `Easing.bezier(a, b, c, d)`, `Easing.spring({…})`, `Easing.ease/quad/cubic/back()/poly(n)`, `Easing.in(…)`, `Easing.out(bezier|linear)`.
5. Use CSS `translate`, `scale`, `rotate`, `opacity`, `transformOrigin` — not `transform` strings and not animated `top`/`left`.
6. Put timing props directly on the component (`from`, `durationInFrames`, `trimBefore`, `premountFor`), not on wrapper `<Sequence>`s.
7. Write times inline as `n * fps` on the JSX node. No module-level `FPS` constant (exception: `calculateMetadata`, which cannot call hooks).
8. Effects arrays inline with stable shape and literal params. No conditional arrays (`effects={on ? […] : []}`) — render separate elements instead.
9. Composition metadata inline: string-literal `id`, inline `width/height/fps/durationInFrames`, inline object-literal `defaultProps`. Only dynamic values go in `calculateMetadata`.
10. SVG paths: `<Interactive.Path d="M …" />` with a literal `d`; morph with inline `interpolatePaths(frame, […], […paths], {…})` from `@remotion/paths`.
11. Do not make everything interactive — the timeline becomes unreadable. Make the things a user would plausibly adjust.
12. If the user edits code outside the conversation, keep their edits. Do not overwrite surprising changes; ask if unsure.

```tsx
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0d12', justifyContent: 'center', alignItems: 'center'}}>
      <Interactive.H1
        name="Headline"
        style={{
          color: '#ffffff',
          fontSize: 150,
          fontWeight: 800,
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          translate: interpolate(frame, [0, fps], ['0px 60px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Ship faster
      </Interactive.H1>
      <Interactive.P name="Subline" from={fps} premountFor={fps} style={{color: '#9aa4b2', fontSize: 56}}>
        Remotion makes video programmable
      </Interactive.P>
    </AbsoluteFill>
  );
};
```

## 4. `Interactive.*` elements and schema fragments

- HTML: `A, Article, Aside, Button, Code, Div, Em, Footer, H1–H6, Header, Label, Li, Main, Nav, Ol, P, Pre, Section, Small, Span, Strong, Ul`.
- SVG: `Circle, Ellipse, G, Line, Path, Rect, Svg, Text` (stroke, strokeWidth, fill controls).
- They accept timing props, premount props, crop props, `ref`, and all native props. They render as `<Sequence layout="none">`: normal document flow, unmounted outside their range.
- `<Img>`, `<CanvasImage>`, `<AnimatedImage>`, `<Solid>`, `@remotion/media` tags, shapes, and rough-notation are already interactive.
- Prebuilt schema fragments: `Interactive.baseSchema`, `transformSchema`, `cropSchema`, `premountSchema`, `sequenceSchema`, `textSchema`, `backgroundSchema`, `borderSchema`, `borderRadiusSchema`, `svgPaintSchema`, `svgStrokeSchema`, `captionsSchema`.

## 5. `Interactive.withSchema` and `InteractivitySchema`

Make your own components editable:

```tsx
import {Interactive, type InteractivitySchema} from 'remotion';

const lowerThirdSchema = {
  title: {type: 'text-content', default: 'Jane Doe', description: 'Name'},
  subtitle: {type: 'text-content', default: 'Head of Product', description: 'Role'},
  accent: {type: 'color', default: '#0b84ff', description: 'Accent color'},
  barWidth: {type: 'number', default: 8, min: 2, max: 24, step: 1, description: 'Accent bar width'},
} as const satisfies InteractivitySchema;

const LowerThirdInner: React.FC<{
  title?: string;
  subtitle?: string;
  accent?: string;
  barWidth?: number;
  style?: React.CSSProperties;
}> = ({title = 'Jane Doe', subtitle = 'Head of Product', accent = '#0b84ff', barWidth = 8, style}) => (
  <div style={{position: 'absolute', left: 80, bottom: 100, display: 'flex', gap: 24, ...style}}>
    <div style={{width: barWidth, backgroundColor: accent, borderRadius: barWidth / 2}} />
    <div>
      <div style={{fontSize: 56, fontWeight: 700, color: 'white'}}>{title}</div>
      <div style={{fontSize: 36, color: '#c7cdd6'}}>{subtitle}</div>
    </div>
  </div>
);

export const LowerThird = Interactive.withSchema({
  Component: LowerThirdInner,
  componentName: '<LowerThird>',
  schema: lowerThirdSchema,
  wrapInSequence: true, // gives from/durationInFrames/trimBefore/playbackRate/loop/freeze/hidden/name/premountFor/crop
});

// usage: <LowerThird name="Speaker" from={30} durationInFrames={120} premountFor={30} title="Ada" />
```

- The inner component must accept `style` and spread it last onto **one** visual root. Transform/opacity controls are added automatically — do not add them to your schema.
- Register and render the exported `withSchema` result, not the inner component.
- `InteractivitySchema` is not Zod (Zod is for composition props). Field types: `text-content`, `number` (`min`, `max`, `step`, `integer`), `boolean`, `color`, `enum` (`variants` with nested schemas), `array` (`item`, `newItemDefault`), `asset` (`assetType: 'image' | 'video' | 'audio'`), `font-family`, `font-weight`, `translate`, `scale`, `rotation-css`, `rotation-degrees`, `transform-origin`, `uv-coordinate`, `svg-path`, `remotion-captions`, `hidden`. Common keys: `default`, `description`, `keyframable`, `defaultKeyframeOutput` (`'perceptual-scale'` for scale), `hiddenFromList`. Dot keys (`'style.color'`) target nested props.
- `visualControl()` and `outlineRef` are deprecated; do not use them in new code.

## 6. Connected compositions (precomps)

A scene component rendered inside the parent **and** registered as its own `<Composition>` with the same exported reference. The Studio then shows it as one layer you can open and edit alone (like an After Effects precomp).

- Use for every substantial scene in a multi-scene video, and for reusable elements. Group registrations in `<Folder name="Scenes">` / `<Folder name="Elements">`.
- Make each scene parent-independent: load its fonts in its own module, set its own `fontFamily`, no parent-only context providers. Verify by opening it alone in the Studio.
- Keep its registration's `defaultProps`, size, and fps aligned with how the parent uses it.
- Studio's "Pre-compose" action asks you to extract a node into a named component and register it — an extraction without registration is incomplete.

## 7. `@remotion/studio` APIs

Browser-side; only work inside a running Studio.

| API | Use |
| --- | --- |
| `getStaticFiles()`, `watchStaticFile(name, cb)`, `watchPublicFolder(cb)` | List/watch `public/`. Pass `staticFile(name)` to media, not cached `src`. |
| `writeStaticFile({filePath, contents})`, `deleteStaticFile(path)` | Write/delete files in `public/` (not in read-only Studio). |
| `saveDefaultProps({compositionId, defaultProps: ({savedDefaultProps}) => next})` | Persist props to the Root file (needs inline `defaultProps` and `zod` installed). |
| `focusDefaultPropsPath({path})` | Scroll the props editor to a field. |
| `reevaluateComposition()` | Rerun `calculateMetadata`. |
| `goToComposition(id)`, `play(e?)`, `pause()`, `toggle(e?)`, `seek(frame)` | Drive the Studio from custom UI. |
| `restartStudio()`, `shutDownStudio()` | Process control. |

`updateDefaultProps` and `visualControl` are deprecated.

## 8. Elements and the Studio protocol

- The Studio can browse and install Elements (prebuilt components) into the project. Add a library with `Config.addElementLibrary({url, displayName})`.
- `@remotion/studio-protocol` lets a website publish Elements: `createElementPayload({displayName, slug, sourceCode, dependencies, dimensions, durationInFrames, initialProps, assets})` → `installInStudio({payload})` (asks the user to confirm in the Studio). `staticFileRef(path)` in `initialProps` downloads assets into `public/`.

## 9. WebMCP tools and agent workflow

- The Studio exposes WebMCP tools to browser agents that support WebMCP: `get_compositions`, `select_composition`, `get_sequences`, `get_canvas_html`, `get_playback_state`, `play`, `pause`, `seek_to_frame`, `get_current_error` (symbolicated runtime error), `install_package`, `transcribe_asset`, `remove_video_background`, `restart_studio`, and more. Use them when available; otherwise read errors from the Studio page or terminal.
- Agent loop: open Studio early → edit code → Fast Refresh updates the preview → check the preview or render stills at key frames → iterate. Do not render the final video unless the user asks.
- If Fast Refresh stops working: the Studio process died, or an import path differs in capitalization from the file name.

## 10. Shortcuts and configuration

- `?` lists shortcuts. Space play/pause, J/K/L shuttle, I/O in/out, G go to frame, R render, Cmd/Ctrl+K quick switcher, Cmd/Ctrl+J props sidebar, T transparency checkerboard.
- Customize with `Config.setKeyboardShortcuts({...})`; disable with `Config.setKeyboardShortcutsEnabled(false)`.
- `Config.setDefaultEditor('cursor' | 'vscode' | …)` controls "open in editor".
- Shared render dialog settings come from the config file and `calculateMetadata` defaults.
