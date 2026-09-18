# Usage Guide

Day-to-day Vite 8.3 workflow. Prefer this for adoption; sibling references for depth.

## 1. Requirements

- Node **`^20.19.0 || >=22.12.0`**
- Prefer current **`vite@^8`** (snapshot **8.3.0**)
- Scaffold with **`create-vite@9.2.1`**

## 2. Scaffold or add Vite

```sh
bun create vite@latest my-app
# non-interactive example:
bun create vite@latest my-app --template react-ts --no-interactive

cd my-app
bun install
bun run dev
```

Templates (`create-vite@9.2.1`): `vanilla`, `vanilla-ts`, `vue`, `vue-ts`, `react`, `react-compiler`, `react-ts`, `react-compiler-ts`, `preact`, `preact-ts`, `lit`, `lit-ts`, `svelte`, `svelte-ts`, `solid`, `solid-ts`, `qwik`, `qwik-ts`.

Online: https://vite.new/{template} (compiler variants may not have vite.new shortcuts).

Manual:

```sh
bun add -d vite
# add framework plugin as needed, e.g.:
bun add -d @vitejs/plugin-react
```

Default scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Dev server defaults to `http://localhost:5173`.

## 3. Toolchain defaults (Vite 8)

| Layer | Default | Status |
|---|---|---|
| Bundler + dep optimizer | **Rolldown** | Stable default since 8.0 |
| JS/TS transform | **Oxc** (`oxc` config) | Stable default; `esbuild` config deprecated |
| JS minify | **`oxc`** | Default client; SSR often `false`. `'esbuild'` needs installing esbuild |
| CSS minify | **Lightning CSS** | Stable default (`build.cssMinify`) |
| CSS transformer | **PostCSS** | `css.transformer: 'lightningcss'` is **experimental** (may become default in a future major) |
| Browser target (build) | `'baseline-widely-available'` | Chrome/Edge 111, Firefox 114, Safari 16.4 (Baseline as of 2026-01-01) |
| Dev transform target | `esnext` | Minimal lowering |

Do not assume esbuild/Rollup still power Vite 8 by default.

## 4. Minimal config

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Conditional / env-aware:

```ts
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: { port: Number(env.APP_PORT) || 5173 },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV ?? mode),
    },
  }
})
```

`.env*` are **not** loaded while evaluating config unless you call `loadEnv`. `loadEnv` also merges matching keys already on `process.env`.

Non-HTML entry (used in **dev and build**):

```ts
export default defineConfig({
  input: 'src/main.ts',
})
```

Prefer top-level `input` over `build.rolldownOptions.input` (the latter overrides for build only).

## 5. Project layout habits

| Path | Role |
|---|---|
| `index.html` | App entry (project root by default) |
| `src/` | Modules imported from HTML / JS |
| `public/` | Static files copied as-is (never processed as modules) |
| `vite.config.*` | Tooling config |
| `.env`, `.env.[mode]`, `*.local` | Env files |

Do not put the HTML entry in `public/`.

## 6. Environment variables

```env
# .env
VITE_API_URL=https://api.example.com
DB_PASSWORD=secret
```

```ts
import.meta.env.VITE_API_URL // exposed
import.meta.env.DB_PASSWORD  // undefined on client
import.meta.env.MODE
import.meta.env.DEV
import.meta.env.PROD
import.meta.env.SSR
import.meta.env.BASE_URL
```

- Only `VITE_`-prefixed (or custom `envPrefix`) values ship to the client — **no secrets**.
- Modes: `vite` → `development`; `vite build` → `production`; override with `--mode`.
- `PROD`/`DEV` follow `NODE_ENV`, not mode alone.
- Bun may auto-load `.env` and fight Vite’s precedence — prefer letting Vite own env loading in Vite apps.

## 7. TypeScript

- Vite transpiles with **Oxc** — **no typechecking**.
- Add `"types": ["vite/client"]` (or triple-slash) for asset/`import.meta.env` types.
- Prefer `import type` for type-only imports. Set `"isolatedModules": true`.
- `tsconfig` `target` is ignored; use `oxc.target` (dev) / `build.target` (prod).
- `resolve.tsconfigPaths: true` to honor `compilerOptions.paths` (off by default; small perf cost). Prefer `resolve.alias` or package `imports`/`exports` when you control mapping.
- Top-level `tsconfig` (8.3) forces one config for the whole project — **discouraged**; Vite already discovers the closest matching `tsconfig.json` per file (including `references`).
- Gate CI with `tsc --noEmit` (or project equivalent).

## 8. Common day-to-day commands

```sh
bunx vite                    # dev
bunx vite --host --port 3000
bunx vite --force            # re-optimize deps
bunx vite --profile cpu      # writes cpu.cpuprofile (8.3)
bunx vite build
bunx vite build --mode staging
bunx vite preview
bunx vite build --ssr src/entry-server.ts
```

`vite optimize` is **deprecated** — use automatic pre-bundle + `--force`.

`--experimental-bundle` / `experimental.bundledDev: true` turns on **bundled Dev Mode** (experimental; formerly Full Bundle Mode). `--app` builds all environments (`builder: {}`; experimental).

## 9. Assets and CSS

```ts
import imgUrl from './img.png'          // URL string
import raw from './file.txt?raw'
import worker from './worker?worker'
import.meta.glob('./pages/*.tsx')       // patterns must be literals
import.meta.glob('./dir/module*.js', { caseSensitive: false })
```

- CSS modules: `*.module.css`
- Preprocessors: install `sass-embedded` (preferred) / `sass` / `less` / `stylus` as needed
- Default CSS minify: Lightning CSS (`css.lightningcss` / `build.cssTarget`)
- Full Lightning CSS transformer: `css.transformer: 'lightningcss'` (**experimental**). Then CSS modules go through `css.lightningcss.cssModules`, not `css.modules`.
- Direct `.wasm` imports (ESM integration) plus `?init` for manual instantiate. SSR wasm needs Node-compatible runtimes.

## 10. Official React / Vue plugins

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// or: import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [react()],
})
```

Align `@vitejs/plugin-*` peer ranges with `vite@^8`.

- `@vitejs/plugin-react@6` uses **Oxc** for React Refresh (Babel is not a default dependency). For React Compiler, use the create-vite `react-compiler` / `react-compiler-ts` templates or the plugin’s `reactCompilerPreset` with `@rolldown/plugin-babel`.
- `@vitejs/plugin-react-swc` remains the SWC path.
- `@vitejs/plugin-legacy` does **not** lower to ES5 under Rolldown.

## 11. Production build

```ts
export default defineConfig({
  base: '/app/',
  build: {
    target: 'baseline-widely-available', // default
    outDir: 'dist',
    sourcemap: true,
    minify: 'oxc',
    cssMinify: 'lightningcss',
    rolldownOptions: {
      // https://rolldown.rs/reference/
    },
  },
})
```

Smoke with `vite preview` — deploy with a real static host / CDN / app server.

Optional experimental cache-friendly chunks: `build.chunkImportMap: true` (needs `import.meta.resolve`; does not currently work with `experimental.renderBuiltUrl`).

## 12. DevTools (Vite 8.3+)

```sh
bun add -d @vitejs/devtools @vitejs/devtools-vite @vitejs/devtools-rolldown
```

```ts
export default defineConfig({
  devtools: true, // or { apply: 'serve' | 'build' | 'all' }
})
```

Set `devtools` in the **user** config — plugin `config` hooks cannot change it. Marked **experimental**. Docs: https://devtools.vite.dev

## 13. Progressive adoption

1. Scaffold or add `vite` + HTML entry (or top-level `input`).
2. Add framework plugin; move scripts to `vite` / `vite build`.
3. Wire env with `VITE_*` + `loadEnv` in config as needed.
4. Tune `optimizeDeps.include` / `server.proxy` for stubborn deps / APIs.
5. Only then: SSR, library mode, MPA, DevTools, bundled Dev Mode, or Environment API (RC).

## 14. Troubleshooting checklist

| Symptom | Check |
|---|---|
| Stale / weird dep graph | `vite --force` or delete `node_modules/.vite` |
| Secret leaked to client | Was it `VITE_*`? Move off client prefix |
| Config can’t read `.env` | Use `loadEnv`; Bun may have preloaded `.env` into `process.env` |
| `tsconfig` paths ignored | Vite 8: `resolve.tsconfigPaths: true` (off by default) or explicit `resolve.alias` |
| Case works on macOS, fails in CI | Fix import path casing |
| CJS default import broke on Vite 8 | See migration; temporary `legacy.inconsistentCjsInterop` |
| Opening `dist/index.html` as `file://` | Use `vite preview` |
| Build uses old Rollup options | Migrate to `rolldownOptions` / `codeSplitting` |
| HMR WebSocket options ignored | Move `server.hmr.{host,port,…}` to `server.ws` |
| Agent can’t see browser errors | `server.forwardConsole` (auto-on when a coding agent is detected) |

## 15. What not to do

- Do not assume esbuild/Rollup still power Vite 8 by default.
- Do not put secrets in `VITE_*`.
- Do not treat `vite preview` as production hosting.
- Do not expect Vite to replace `tsc` typechecking.
- Do not use object-form `manualChunks`.
- Do not treat Environment API, bundled Dev Mode, Lightning CSS transformer, `--app`, or DevTools as fully stable defaults.
- Do not set top-level `tsconfig` just to remap imports — use `resolve.alias` / package `imports`.
