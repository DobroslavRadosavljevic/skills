# Compositions, Props, Schemas, Metadata

Project layout, registration, props flow, Zod schemas, `calculateMetadata`, data fetching, env vars, and artifacts. Snapshot: `remotion@4.0.532`.

## Contents

1. Project layout and entry point
2. `registerRoot`, `<Composition>`, `<Still>`, `<Folder>`
3. Props flow and input props
4. Schemas and Studio controls
5. `calculateMetadata`
6. Data fetching strategy
7. Environment variables
8. `<Artifact>` side outputs
9. React, TypeScript, and library notes

---

## 1. Project layout and entry point

```
package.json            # all remotion + @remotion/* pinned to ONE exact version (no ^)
remotion.config.ts      # optional; import {Config} from '@remotion/cli/config'
public/                 # assets for staticFile(); next to the package.json that has remotion
src/index.ts            # entry point: registerRoot() only
src/Root.tsx            # <Composition>/<Still>/<Folder> registrations
src/<Scene>.tsx         # components (one file per scene for multi-scene videos)
```

- New project: `bunx create-video@latest` (or `bun create video`). Non-interactive blank: `bunx create-video@latest --yes --blank --no-tailwind my-video`. It refuses non-empty folders.
- Existing app (brownfield): `bun add remotion @remotion/cli` and add an entry file + Root. Add `@remotion/player` to embed, `@remotion/renderer` + `@remotion/bundler` for Node rendering.
- Add more packages with `bunx remotion add <pkg...>`. It installs `@remotion/*`, `zod`, `mediabunny`, `@mediabunny/*`, `@huggingface/transformers` at the version that matches the installed Remotion.
- Entry point resolution: CLI argument → `Config.setEntryPoint()` → first of `src/index.{ts,tsx,js,mjs}`, `remotion/index.*`, `src/remotion/index.*`.
- The "Remotion Root" directory is the nearest ancestor with a `package.json`. It decides `public/`, `.env`, and the config file location.
- Do not add an unprefixed tsconfig `paths` alias that can shadow `remotion` (for example a local `remotion/` folder resolved as a bare import).
- Runtime minimums today (v4): Node ≥16 or Bun ≥1.0.3. Planned v5: Node ≥22, Bun ≥1.1.3. Renderer binaries need macOS ≥15 or Linux glibc ≥2.35. Alpine and NixOS are not supported.
- Bun runtime: `bunx remotion …` runs the CLI on Node. `bunx remotionb …` runs it on Bun (`bun create video` scripts use `remotionb`). Bun runtime caveats: `lazyComponent` is disabled and SSR scripts may not exit by themselves.

## 2. Registration

### `registerRoot(Root)` — `remotion`

- Call exactly once, in its own entry file. Keep it separate from the Root file. Fast Refresh re-executes the edited file, and a second call throws `registerRoot() was called more than once.`
- May be deferred (for example after loading WASM): `loadWasm().then(() => registerRoot(Root))`.
- Passing the Root file instead of the entry file as entry point produces a timeout on `"Loading root component"`.

### `<Composition>` — `remotion`

| Prop | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Required. Letters, digits, `-` (source also allows CJK). Unique. |
| `component` xor `lazyComponent` | `ComponentType<Props>` / `() => import('./X')` | `lazyComponent` needs a default export and uses Suspense. |
| `width`, `height` | positive integers | Optional only with `calculateMetadata`. Use even numbers for H.264/H.265. |
| `fps` | positive number | Optional only with `calculateMetadata`. |
| `durationInFrames` | positive integer | Optional only with `calculateMetadata`. |
| `defaultProps` | object | Required at type level when the component has props or a schema. JSON-serializable plus `Date`, `Map`, `Set`, `staticFile()` values. |
| `schema` | Zod `z.object()` | Validates props, drives Studio controls. Zod v3 and v4 detected structurally. |
| `calculateMetadata` | function | See §5. |

Rules:

- Type props with `type`, not `interface`. Props must satisfy `Record<string, unknown>`.
- Never render a `<Composition>` inside another composition's component or inside a `<Player>` component. To reuse a scene, render the component directly (optionally inside `<Sequence width height>` to give it its own dimensions).
- Keep `defaultProps` small. Large data URLs or audio buffers hit the serialization limit ("defaultProps too big").
- Register the same component under several ids when you need variants (for example 1920×1080 and 1080×1920).

### `<Still>`

Same as `<Composition>` without `fps`/`durationInFrames` (forced to 1 frame). Render with `bunx remotion still`. Formats: png (default), jpeg, webp, pdf.

### `<Folder name>`

Visual grouping in the Studio sidebar. Nestable. Same charset as ids. Group scenes and reusable elements ("Scenes", "Elements").

```tsx
// src/index.ts
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';

registerRoot(RemotionRoot);
```

## 3. Props flow

Resolution order during a render:

1. `defaultProps` on the `<Composition>`.
2. Overridden by input props (`--props='{"title":"Hi"}'` or `--props=./props.json`, `inputProps` in Node/Lambda APIs, Studio render dialog).
3. Transformed by `calculateMetadata()`. Returned `props` win.

- Server-side rendering: pass the same `inputProps` to `selectComposition()` and `renderMedia()`. `composition.props` is the resolved props; `inputProps` is what `getInputProps()` returns.
- `getInputProps()` (`remotion`) returns raw input props anywhere. It is not type-safe, returns `{}` in Node without `window`, throws inside `<Player>`, and does not work in client-side rendering. Prefer component props or `calculateMetadata`.
- In Studio, sidebar edits change default props. `bunx remotion studio --props=…` overrides them (rarely useful).
- Saving props back to code (💾 in Studio) needs: a TypeScript root file Remotion can find (`src/Root.tsx`, `remotion/Root.tsx`, `src/remotion/Root.tsx`, `app/remotion/Root.tsx`), the `id` as a JSX string literal, and `defaultProps` as an inline object literal (may contain `staticFile('x')` and `new Date('…')`). No variables, spreads, helpers, `satisfies`, or `as` casts.

## 4. Schemas and Studio controls

Without a schema, Studio infers controls from `defaultProps` (4.0.516+): string → text, CSS color string → color picker, `staticFile()` value → asset picker, number, boolean → checkbox, `Date` → date picker, plain object → nested, non-empty homogeneous array → array editor. A key named `type` becomes a read-only discriminator. `null`, `undefined`, empty arrays, and class instances are not editable.

Add a Zod schema when you need validation, enums, unions, optional/nullable fields, `min`/`max`/`step`, descriptions, or special inputs.

- Install: `bunx remotion add zod @remotion/zod-types`. `@remotion/zod-types` targets Zod 4. For Zod 3.22.3 use `@remotion/zod-types-v3`.
- Top level must be `z.object()` (`z.discriminatedUnion()` is accepted since 4.0.444).
- Supported controls: `z.object`, `z.string`, `z.number`, `z.boolean`, `z.date`, `z.array`, `z.enum`, `z.optional`, `z.nullable`, `z.union` (only `X | null` / `X | undefined`), `.min/.max/.step`, plus `zColor()` (color picker), `zTextarea()` (multiline; render with `white-space: pre-line`), `zMatrix()` (flat square numeric matrix). An asset field is a `z.string()` whose default is a `staticFile()` value.

```tsx
// src/Root.tsx
import {Composition, type CalculateMetadataFunction} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';
import {Promo} from './Promo';

export const promoSchema = z.object({
  productId: z.string(),
  accent: zColor(),
  data: z.nullable(z.object({title: z.string(), seconds: z.number().min(1)})),
});
export type PromoProps = z.infer<typeof promoSchema>;

const calculatePromoMetadata: CalculateMetadataFunction<PromoProps> = async ({props, abortSignal}) => {
  const res = await fetch(`https://api.example.com/products/${props.productId}`, {signal: abortSignal});
  const data = (await res.json()) as {title: string; seconds: number};
  return {
    durationInFrames: Math.ceil(data.seconds * 30),
    props: {...props, data},
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Promo"
    component={Promo}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={300}
    schema={promoSchema}
    calculateMetadata={calculatePromoMetadata}
    defaultProps={{productId: 'p_1', accent: '#0b84ff', data: null}}
  />
);
```

## 5. `calculateMetadata`

```ts
type CalculateMetadataFunction<T> = (options: {
  defaultProps: T;
  props: T; // resolved input props
  abortSignal: AbortSignal; // aborts stale Studio requests
  compositionId: string;
  isRendering: boolean;
}) => Promise<Result> | Result;
// Result (all optional): durationInFrames, fps, width, height, props,
// defaultCodec, defaultOutName (no extension), defaultVideoImageFormat ('png'|'jpeg'|'none'),
// defaultPixelFormat, defaultProResProfile, defaultSampleRate
```

- Runs once per render (in its own tab during `selectComposition()`), not once per concurrency tab. In Studio it reruns on every props change.
- Validation is strict: `width`, `height`, `durationInFrames` must be positive integers; `fps` positive. Always `Math.ceil(seconds * fps)` or `Math.round`.
- Returned `props` must keep the input shape. Use nullable fields (`data: X | null`) and throw in the component if the data is missing.
- It is wrapped in a delayRender handle: it must resolve within the timeout (30 s default).
- Priority: explicit render options > config file > `defaultCodec` etc. returned here. CLI `--width/--height` override returned dimensions; `--scale` applies last.
- Pass `abortSignal` to every `fetch`. To debounce in Studio but not during render, skip the wait when `isRendering` is true.
- True randomness is fine here (it runs once). Binary assets do not belong in props — fetch those inside components.
- Hooks cannot be called here. Use a local constant fps that matches the registration when converting seconds.
- `<Player>` does not run `calculateMetadata`. Call the function yourself and pass the result to the Player (see the Player reference).
- Multiple frame rates: return `fps` from a prop and write every animation as `n * fps`.

Typical uses: match duration to an audio or video file (Mediabunny `computeDuration()`), size a video to an image, fetch API data once, sum per-scene durations minus transition overlaps, set a per-composition output default (`defaultCodec: 'prores'`, `defaultPixelFormat: 'yuva444p10le'`).

## 6. Data fetching strategy

| Need | Where | Why |
| --- | --- | --- |
| JSON data that decides duration or props | `calculateMetadata` | Runs once; no handles; result is serializable. |
| Binary data (images, audio buffers, fonts, WASM) | Inside the component with `useDelayRender()` | Not serializable as props. |
| Data that must also buffer preview playback | `useDelayRender()` + `useBufferState().delayPlayback()` | delayRender only affects rendering. |

Rules:

- Data fetched inside components runs in every render tab. It must return identical results in every tab, and it multiplies API calls (rate limits).
- Never include `frame` in the dependency array of a fetching effect.
- The legacy pattern (`useEffect` + `delayRender()` in the Root to compute `<Composition>` props) is discouraged since v4.

## 7. Environment variables

- CLI and Studio load `.env` (and `.env.local`) from the Remotion Root. Only variables prefixed `REMOTION_` are exposed to component code as `process.env.REMOTION_X`. `Config.setDotEnvLocation()` / `--env-file` change the file.
- Node APIs (`renderMedia`, `renderStill`, Lambda, Vercel) do NOT read `.env`. Pass `envVariables: {KEY: 'value'}` explicitly.
- `.env` values are passed into the headless browser. Do not put secrets there that the composition does not need. Never hardcode secrets in the bundle (the bundle is a public website on Lambda).

## 8. `<Artifact>` side outputs

`<Artifact filename content downloadBehavior?>` (4.0.176) emits a file during a render, for example a sidecar `.srt`, a JSON report, or a thumbnail.

- `content`: `string | Uint8Array | Artifact.Thumbnail` (current frame as image).
- Render it on exactly one frame: `{frame === 0 ? <Artifact filename="captions.srt" content={srt} /> : null}`. Duplicate names in one render throw.
- Output: CLI/Studio → `out/<composition-id>/<filename>`; Node `onArtifact({filename, content, frame})`; Lambda → S3 `renders/<id>/artifacts/` and `getRenderProgress().artifacts`; web renderer `onArtifact`. Not supported on Cloud Run. No-op in preview.

## 9. React, TypeScript, library notes

- React 18 needs Remotion ≥3.0; React 19 needs Remotion ≥4.0 (R3F ≥9.1.2 and three ≥0.171 with React 19). Planned v5 requires React ≥18.
- Plain JS works, but TypeScript gives typed `defaultProps`.
- Publishing a library of Remotion components: `remotion` as `peerDependency` (`"*"`) plus `devDependency`. Never bundle your own copy.
- `import {VERSION} from 'remotion'` (or `remotion/version` without React) returns the installed core version.
- Testing components: render `<Thumbnail>` from `@remotion/player` with `renderToString`, or run Studio/still renders. Works with Bun + Happy DOM.
- Removed APIs still exported for compatibility: `Experimental.Clipper` and `Experimental.Null` throw when rendered. `import {Config} from 'remotion'` exits the process — use `@remotion/cli/config`.
