# Usage Guide

Day-to-day Vite 8 workflow. Prefer this for adoption; sibling references for depth.

## 1. Requirements

- Node **`^20.19.0 || >=22.12.0`**
- Prefer current **`vite@^8`** (snapshot **8.2.0**)

## 2. Scaffold or add Vite

```sh
bun create vite@latest my-app
# non-interactive example:
bun create vite@latest my-app -- --template react-ts

cd my-app
bun install
bun run dev
```

Templates include `vanilla`, `vanilla-ts`, `react`, `react-ts`, `vue`, `vue-ts`, `svelte`, `solid`, `qwik`, `preact`, `lit`, and TS variants (plus RSC template where offered).

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

## 3. Minimal config

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

`.env*` are **not** loaded while evaluating config unless you call `loadEnv`.

## 4. Project layout habits

| Path | Role |
|---|---|
| `index.html` | App entry (project root by default) |
| `src/` | Modules imported from HTML / JS |
| `public/` | Static files copied as-is (never processed as modules) |
| `vite.config.*` | Tooling config |
| `.env`, `.env.[mode]`, `*.local` | Env files |

Do not put the HTML entry in `public/`.

## 5. Environment variables

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

## 6. TypeScript

- Vite transpiles with **Oxc** — **no typechecking**.
- Add `"types": ["vite/client"]` (or triple-slash) for asset/`import.meta.env` types.
- Prefer `import type` for type-only imports.
- Gate CI with `tsc --noEmit` (or project equivalent).

## 7. Common day-to-day commands

```sh
bunx vite                    # dev
bunx vite --host --port 3000
bunx vite --force            # re-optimize deps
bunx vite build
bunx vite build --mode staging
bunx vite preview
bunx vite build --ssr src/entry-server.ts
```

`vite optimize` is **deprecated** — use automatic pre-bundle + `--force`.

## 8. Assets and CSS

```ts
import imgUrl from './img.png'          // URL string
import raw from './file.txt?raw'
import worker from './worker?worker'
import.meta.glob('./pages/*.tsx')       // patterns must be literals
```

- CSS modules: `*.module.css`
- Preprocessors: install `sass` / `less` / etc. as needed (optional peers)
- Default CSS minify: Lightning CSS; full Lightning CSS transformer is **experimental**

## 9. Official React / Vue plugins

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// or: import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [react()],
})
```

Align `@vitejs/plugin-*` peer ranges with `vite@^8`.

## 10. Production build

```ts
export default defineConfig({
  base: '/app/',
  build: {
    target: 'baseline-widely-available', // default
    outDir: 'dist',
    sourcemap: true,
    // prefer Vite 8 names:
    rolldownOptions: {
      // https://rolldown.rs/reference/
    },
  },
})
```

Defaults (Vite 8):

| Layer | Default |
|---|---|
| Bundler | Rolldown |
| JS minify | `oxc` |
| CSS minify | `lightningcss` |
| Browser target | Baseline Widely Available (~Chrome/Edge 111, FF 114, Safari 16.4) |

Smoke with `vite preview` — deploy with a real static host / CDN / app server.

## 11. Progressive adoption

1. Scaffold or add `vite` + HTML entry.
2. Add framework plugin; move scripts to `vite` / `vite build`.
3. Wire env with `VITE_*` + `loadEnv` in config as needed.
4. Tune `optimizeDeps.include` / `server.proxy` for stubborn deps / APIs.
5. Only then: SSR, library mode, MPA, or Environment API (RC).

## 12. Troubleshooting checklist

| Symptom | Check |
|---|---|
| Stale / weird dep graph | `vite --force` or delete `node_modules/.vite` |
| Secret leaked to client | Was it `VITE_*`? Move off client prefix |
| Config can’t read `.env` | Use `loadEnv` |
| `tsconfig` paths ignored | Vite 8: `resolve.tsconfigPaths: true` (off by default) or explicit `resolve.alias` |
| Case works on macOS, fails in CI | Fix import path casing |
| CJS default import broke on Vite 8 | See migration; temporary `legacy.inconsistentCjsInterop` |
| Opening `dist/index.html` as `file://` | Use `vite preview` |
| Build uses old Rollup options | Migrate to `rolldownOptions` / `codeSplitting` |

## 13. What not to do

- Do not assume esbuild/Rollup still power Vite 8 by default.
- Do not put secrets in `VITE_*`.
- Do not treat `vite preview` as production hosting.
- Do not expect Vite to replace `tsc` typechecking.
- Do not use object-form `manualChunks`.
- Do not treat Environment API / Full Bundle Mode as fully stable defaults.
