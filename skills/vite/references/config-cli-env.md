# Config, CLI, and Env

Shared config, CLI flags, environment/modes, assets, CSS, HMR, and dep optimization.

## Config files

- Auto-resolve `vite.config.js` / `.ts` (and related extensions) from project root.
- Override: `vite --config ./path/to/config.ts`
- Prefer `defineConfig` for typing; async config supported.
- Callback form: `defineConfig(({ command, mode, isSsrBuild, isPreview }) => …)` — `command` is `'serve' | 'build'`.

Config loaders: default `bundle` (Rolldown temp bundle). `runner` / `native` are experimental (`--configLoader`).

## Important shared options

| Option | Notes |
|---|---|
| `root` | Project root (default cwd) — where `index.html` lives |
| `base` | Public base path (default `/`) |
| `publicDir` | Default `public`; `false` disables |
| `cacheDir` | Default `node_modules/.vite` |
| `plugins` | Arrays flattened; falsy skipped |
| `resolve.alias` | Absolute FS paths for filesystem aliases |
| `resolve.tsconfigPaths` | Default **`false`** in Vite 8 — opt in for `paths` |
| `resolve.dedupe` | Force single instance of a package |
| `define` | Compile-time replacements (JSON-serializable / identifiers) via Oxc |
| `oxc` | Preferred transform options (JSX, include/exclude); `false` disables |
| `esbuild` | **Deprecated** — converted to `oxc` |
| `css.modules` / `postcss` / `preprocessorOptions` | CSS pipeline |
| `css.transformer` | `'postcss'` (default) \| `'lightningcss'` (**experimental**) |
| `envDir` / `envPrefix` | Env file directory / client prefix (default `VITE_`); empty prefix errors |
| `appType` | `'spa'` \| `'mpa'` \| `'custom'` |
| `assetsInclude` | Extra static asset patterns |
| `future` | Opt into upcoming breaks |

Docs: https://vite.dev/config/shared-options

## Server options

```ts
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, ''),
      },
      '/socket.io': { target: 'ws://localhost:5174', ws: true },
    },
    warmup: { clientFiles: ['./src/main.tsx'] },
    middlewareMode: true, // or { server: parentHttpServer }
    // forwardConsole: useful for agents (browser → terminal)
  },
})
```

Proxied requests are **not** Vite-transformed. Docs: https://vite.dev/config/server-options

## CLI

| Command | Role |
|---|---|
| `vite` / `vite dev` / `vite serve` | Dev server |
| `vite build` | Production build |
| `vite preview` | Local preview of `dist` (not prod hosting) |
| `vite optimize` | **Deprecated** |

Useful flags: `--host`, `--port`, `--open`, `--force`, `-c/--config`, `--base`, `-m/--mode`, `--profile`, `-d/--debug`.

Build flags: `--outDir`, `--ssr [entry]`, `--sourcemap`, `--minify` (default `oxc`), `--manifest`, `--ssrManifest`, `-w/--watch`, `--app` (**experimental**).

Docs: https://vite.dev/guide/cli

## Env and modes

Files (from `envDir`):

```
.env
.env.local
.env.[mode]
.env.[mode].local
```

Precedence (high → low): existing `process.env` at start → mode-specific files → generic `.env` / `.env.local`.

Client exposure: matching `envPrefix` only → `import.meta.env.*` as **strings**.

Built-ins: `MODE`, `BASE_URL`, `PROD`, `DEV`, `SSR`.

HTML placeholders: `%MODE%`, `%VITE_*%`.

```ts
import { loadEnv } from 'vite'
const env = loadEnv(mode, process.cwd(), '') // '' = all keys for config use
```

Docs: https://vite.dev/guide/env-and-mode

## Features agents use often

### HMR

Framework plugins handle most HMR. Custom: https://vite.dev/guide/api-hmr  
`import.meta.hot.accept` must receive **ids**, not URLs (Vite 8).

### Glob import

```ts
const modules = import.meta.glob('./dir/*.ts')
const eager = import.meta.glob('./dir/*.ts', { eager: true })
```

Patterns must be **string literals**.

### Assets

| Query | Result |
|---|---|
| (default) | Resolved URL |
| `?url` | Explicit URL |
| `?raw` | File contents string |
| `?inline` / `?no-inline` | Inline control |
| `?worker` / `?sharedworker` | Worker constructors |

`new URL('./asset.png', import.meta.url)` works in client builds; **not SSR-safe**.

### Workers

Prefer:

```ts
new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
```

### WASM

ESM import or `?init`. Vite 8: `?init` works in SSR on Node-compatible runtimes.

## Dependency pre-bundling

Dev-only Rolldown pre-bundle into `node_modules/.vite`.

```ts
export default defineConfig({
  optimizeDeps: {
    include: ['some-cjs-pkg'],
    exclude: ['huge-esm-pkg'],
    rolldownOptions: {
      // https://rolldown.rs/reference/
    },
    force: false,
  },
})
```

- `optimizeDeps.esbuildOptions` is **deprecated** (auto-converted).
- Exclude CJS-only deps carefully — usually **include** them instead.
- Force refresh: `vite --force` or delete cache dir.

Docs: https://vite.dev/guide/dep-pre-bundling

## Types entry

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

`vite/client` is **types-only**. Dev HMR client URL is `/@vite/client` (server path), not the npm export.
