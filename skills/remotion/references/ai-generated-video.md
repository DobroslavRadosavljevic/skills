# AI-Generated Videos and Agent Integration

Docs access for agents, generating Remotion code with an LLM, compiling generated code at runtime, browser bundling, and prompt-to-video pipelines. Snapshot: 4.0.532.

## Contents

1. Docs access for agents
2. Agent workflow inside a Remotion project
3. Generating composition code with an LLM
4. Compiling generated code at runtime
5. Rendering generated code on the server
6. Browser bundler and the vibe-coding stack
7. Prompt-to-video pipelines
8. Security and licensing

---

## 1. Docs access for agents

- Any docs page as Markdown: append `.md` (`https://www.remotion.dev/docs/sequence.md`) or send `Accept: text/markdown`. Cheaper than HTML.
- Index: `https://www.remotion.dev/llms.txt`. Condensed system prompt: `https://www.remotion.dev/system-prompt.txt`.
- Context7 library id: `/remotion-dev/remotion`.
- The hosted Remotion MCP (`@remotion/mcp`, one `remotion-documentation` tool) is deprecated; its shutdown date (no earlier than 2026-08-31) has passed. Use docs URLs instead.
- Source of truth for current APIs: the monorepo `remotion-dev/remotion` (`packages/docs/docs`, `packages/<pkg>/src`).

## 2. Agent workflow inside a Remotion project

1. Inspect `package.json`: installed Remotion version, which `@remotion/*` packages, package manager, Tailwind.
2. Start the Studio early and keep it running so the user can watch (see the Studio reference).
3. Write code following the frame-driven rules and editability rules.
4. Check visually: Studio preview, `bunx remotion still <id> out/check.png --frame=<n>`, or `bunx remotion render <id> out/frames --frames=0,30,90 --image-format=png` and inspect the images.
5. Render the final file only when the user asks ("render", "export", "give me the MP4").

## 3. Generating composition code with an LLM

When building a product that asks an LLM to write Remotion code:

- Use structured output so the model returns code plus metadata (no Markdown fences):

  ```ts
  import {generateText, Output} from 'ai';
  import {z} from 'zod';

  const {output} = await generateText({
    model,
    system: REMOTION_SYSTEM_PROMPT,
    prompt: userPrompt,
    output: Output.object({
      schema: z.object({
        code: z.string(),
        title: z.string(),
        durationInFrames: z.number().int().min(1),
        fps: z.number().min(1).max(120),
      }),
    }),
  });
  ```

  Check the AI SDK major version in the project before copying (older versions use `generateObject`).
- System prompt essentials: one named export component; animate only with `useCurrentFrame()` + `interpolate`/`spring`; clamp interpolations; no CSS animations, timers, or `Math.random()`; `staticFile()`/remote URLs only; use injected APIs only; output code only.
- Detect the needed capabilities first (charts, captions, transitions, 3D…) with a cheap model and add only the matching guidance to the prompt. Smaller prompts beat one giant prompt.
- Sanitize: strip fences and trailing prose. On compile errors, send the error back and retry. For edits, let the model choose a targeted edit or full rewrite.

## 4. Compiling generated code at runtime

Documented pipeline (Player preview): strip imports → extract the component body → transpile with `@babel/standalone` → build with `new Function(...)`, passing every allowed API explicitly → render in `<Player>`.

```ts
import * as Babel from '@babel/standalone';
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export function useCompiledComposition(code: string) {
  return useMemo(() => {
    if (!code.trim()) return {Component: null, error: null};
    try {
      const withoutImports = code.replace(/^import\s[\s\S]*?;?\s*$/gm, '').trim();
      const match = withoutImports.match(/export\s+const\s+\w+\s*(?::[^=]+)?=\s*\(\s*\)\s*=>\s*\{([\s\S]*)\};?\s*$/);
      const body = match ? match[1] : withoutImports;
      const source = `const DynamicComponent = () => {\n${body}\n};`;
      const out = Babel.transform(source, {presets: ['react', 'typescript'], filename: 'dynamic.tsx'});
      if (!out.code) return {Component: null, error: 'Transpilation failed'};
      const factory = new Function(
        'React', 'AbsoluteFill', 'Easing', 'interpolate', 'Sequence', 'spring', 'useCurrentFrame', 'useVideoConfig',
        `${out.code}\nreturn DynamicComponent;`,
      );
      const Component = factory(React, AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig);
      return {Component: Component as React.FC, error: null};
    } catch (e) {
      return {Component: null, error: e instanceof Error ? e.message : String(e)};
    }
  }, [code]);
}
```

- Every API the generated code uses must be injected (hooks, `Img`, `Sequence`, transitions, shapes, Lottie, `ThreeCanvas`…). Unknown identifiers throw at runtime.
- Wrap the Player in an error boundary (`errorFallback`) and remount with a new `key` after fixing code.

## 5. Rendering generated code on the server

- Register a `DynamicComp` composition whose code arrives as an input prop. Compile it inside a delayRender handle (`useDelayRender()`), then render the compiled component. Set `durationInFrames`/`fps` via `calculateMetadata` from props.
- `getInputProps()` throws inside `<Player>`; in the app, compile in the host and pass the component to the Player instead.
- Validate size limits on the code prop (Lambda inline payload ~194 KB before S3 upload).

## 6. Browser bundler and the vibe-coding stack

- `@remotion/browser-bundler` (draft API, Chrome only) compiles a virtual multi-file Remotion project in a worker (Rspack WASM): `createBrowserBundler()` → `bundle({project: {entryPoint: 'src/index.ts', files}})`; `@remotion/browser-bundler/runtime` → `loadBrowserBundle()` → `getBrowserComposition({root, compositionId, inputProps})` → feed `<Player>`.
- Requirements: cross-origin isolation (COOP `same-origin` + COEP `require-corp`), CSP allowing `'unsafe-eval'`, workers, WASM. No `public/` folder — use hosted CORS URLs. npm imports resolve through esm.sh.
- Reference app: `template-vibe-code` in the monorepo (browser bundler + `<Canvas>` editor + codemods + web renderer).

## 7. Prompt-to-video pipelines

Typical pipeline (template `--prompt-to-video`):

1. LLM writes a structured script: scenes with text, visual description, duration hints.
2. Generate assets per scene: images (image model), voiceover (TTS), music/SFX.
3. Save assets to `public/` or object storage; measure audio durations with Mediabunny.
4. Build input props: scene list with `durationInFrames` from audio length + padding.
5. One composition renders the scene list with `<Series>`/`<TransitionSeries>`, captions from transcription or TTS word timings.
6. Preview in Studio/Player; render locally or on Lambda.

Keep generation (network, API keys, randomness) in scripts or `calculateMetadata`, never in per-frame component code.

## 8. Security and licensing

- `new Function`/`eval` runs in the page's global scope. For untrusted users, run generated code in a sandboxed `<iframe>` with a strict CSP, and never give it credentials.
- License: rendering LLM-generated code for your users is allowed; letting users upload their own Remotion projects to your render service is not. Companies with ≥4 people need a company license.
