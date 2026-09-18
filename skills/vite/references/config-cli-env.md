# Config, CLI, and Env

Shared config, CLI flags, environment/modes, assets, CSS, HMR, and dep optimization. Snapshot: `vite@8.3.0`.

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
| `input` | App entries (8.2+). Default for `build.rolldownOptions.input`, `build.lib.entry`, `build.ssr` if `true`, and `optimizeDeps.entries`. Prefer this over build-only `rolldownOptions.input`. |
| `publicDir` | Default `public`; `false` disables |
| `cacheDir` | Default `node_modules/.vite` |
| `plugins` | Arrays flattened; falsy skipped |
| `resolve.alias` | Absolute FS paths for filesystem aliases |
| `resolve.tsconfigPaths` | Default **`false`**. Opt in for `compilerOptions.paths`. Not experimental. Does not apply inside `.less`. |
| `resolve.dedupe` | Force single instance of a package |
| `define` | Compile-time replacements (JSON-serializable / identifiers) via **Oxc** |
| `oxc` | Preferred transform options (JSX, include/exclude); `false` disables |
| `esbuild` | **Deprecated** — converted to `oxc` |
| `css.modules` / `postcss` / `preprocessorOptions` | CSS pipeline (PostCSS transformer) |
| `css.transformer` | `'postcss'` (default) \| `'lightningcss'` (**experimental**) |
| `css.lightningcss` | Lightning CSS options (used for minify always; for transform when opted in) |
| `envDir` / `envPrefix` | Env file directory / client prefix (default `VITE_`); empty prefix errors |
| `appType` | `'spa'` \| `'mpa'` \| `'custom'` |
| `assetsInclude` | Extra static asset patterns |
| `html.cspNonce` / `html.additionalAssetSources` | CSP nonce; extra HTML asset attrs (8.1) |
| `devtools` | **Experimental**. Enable Vite DevTools (8.3+ for full dev-server integration). Set in **user** config only. |
| `tsconfig` | 8.3. Path to one tsconfig. **Discouraged** — overrides per-file discovery. |
| `future` | Opt into upcoming breaks |

Docs: https://vite.dev/config/shared-options

### `oxc`

```ts
export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'preact' },
    // jsxInject: `import React from 'react'`,
  },
})
```

Default: transform `ts` / `jsx` / `tsx`. Customize with `oxc.include` / `oxc.exclude`.

### DevTools

```ts
export default defineConfig({
  devtools: true,
  // or: { apply: 'serve' } | { apply: 'build' }
})
```

Install `@vitejs/devtools` (and `@vitejs/devtools-vite` / `@vitejs/devtools-rolldown` as needed). Default `apply` is both serve and build.

### `tsconfig` (8.3)

Use only when automatic discovery cannot find the intended config. Prefer a nearby `tsconfig.json` + TypeScript `references`. For import remaps, prefer `resolve.alias` or package.json `imports` / `exports`.

## Server options

```ts
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: true,
    cors: true, // prefer an explicit origin list in real apps
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
    ws: { /* protocol, host, port, path, clientPort, timeout, server */ },
    watch: {
      // chokidar options; with bundled-dev also Rolldown watch options
      // (usePolling, pollInterval, include, exclude, …)
    },
    forwardConsole: true, // auto-on when a coding agent is detected
  },
})
```

- Proxied requests are **not** Vite-transformed.
- WebSocket / HMR connection: **`server.ws`**. `server.hmr` remains for `overlay` (and `false` to disable HMR). `server.hmr.{protocol,host,port,…}` are **deprecated** (synced for now).
- `server.forwardConsole`: browser errors/logs → terminal. Default auto when `@vercel/detect-agent` sees a coding agent.
- `server.watch`: chokidar. In bundled-dev, also accepts Rolldown watch options (8.3).
- `server.cors` default allows localhost / 127.0.0.1 / ::1 — do not set `true` casually.
- `server.allowedHosts` default `[]` (localhost and IPs still allowed). Never `true` without understanding DNS rebinding.

Docs: https://vite.dev/config/server-options

## CLI

| Command | Role |
|---|---|
| `vite` / `vite dev` / `vite serve` | Dev server |
| `vite build` | Production build |
| `vite preview` | Local preview of `dist` (not prod hosting) |
| `vite optimize` | **Deprecated** |

Useful flags: `--host`, `--port`, `--open`, `--force`, `-c/--config`, `--base`, `-m/--mode`, `--profile [name]` (8.3; writes `<name>.cpuprofile`), `-d/--debug`, `--experimental-bundle` (bundled Dev Mode).

Build flags: `--outDir`, `--ssr [entry]`, `--sourcemap`, `--minify` (default `oxc`), `--manifest`, `--ssrManifest`, `-w/--watch`, `--app` (**experimental**, all environments).

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

Plugin HMR / WS send: `server.ws.send` (not the deprecated `server.hmr` socket fields).

### Glob import

```ts
const modules = import.meta.glob('./dir/*.ts')
const eager = import.meta.glob('./dir/*.ts', { eager: true })
const ci = import.meta.glob('./dir/module*.js', { caseSensitive: false })
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

Plugin-emitted files: JS `import.meta.ROLLDOWN_FILE_URL_<referenceId>`; CSS/HTML `__VITE_ASSET__<referenceId>__`.

### Workers

Prefer:

```ts
new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
```

Search params on worker URLs are preserved (8.3). Unreferenced worker chunks are dropped.

### WASM

Direct ESM import (`import { add } from './add.wasm'`) or `?init`. Direct import is an async module (needs TLA). Vite 8: both work in SSR on Node-compatible runtimes.

### JSON

Default import plus named imports (`json.namedExports` default `true`). Vite 8.3 **warns** on named imports from JSON modules — prefer default import unless tree-shaking a root field is intentional.

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
