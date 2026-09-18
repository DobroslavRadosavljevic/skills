# Plugins and Build

Plugin API conventions, official plugins, production build, library mode, MPA, DevTools, and performance. Snapshot: `vite@8.3.0`.

## Using plugins

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // conditional:
    // somePlugin({ apply: 'build' }),
  ],
})
```

- Arrays are flattened; falsy entries ignored.
- `enforce: 'pre' | 'post'` controls order relative to Vite core.
- `apply: 'build' | 'serve'` or `apply(config, { command })`.

Docs: https://vite.dev/guide/using-plugins · Plugin API: https://vite.dev/guide/api-plugin

### Conventions

| Kind | Naming |
|---|---|
| Vite-only | `vite-plugin-*` |
| Rolldown-compatible | prefer `rolldown-plugin-*` (+ `vite-plugin` keyword) |
| Virtual modules | `virtual:…` → resolve to `\0` + id |

Detect Rolldown-powered Vite:

```ts
import { rolldownVersion } from 'vite'
// or in a plugin: this.meta.rolldownVersion
```

### Vite-specific hooks (high level)

| Hook | Role |
|---|---|
| `config` / `configResolved` | Mutate / read resolved config (`devtools` cannot be changed from `config`) |
| `configureServer` / `configurePreviewServer` | Connect middlewares (return fn = post-internal) |
| `closeServer` / `closePreviewServer` | 8.3. Dispose resources after teardown. `closeServer({ reason: 'restart' \| 'close' })` |
| `transformIndexHtml` | HTML transforms (`order` + `handler`) |
| `handleHotUpdate` | Custom HMR (Environment API adds `hotUpdate`) |

Universal Rolldown hooks (`resolveId`, `load`, `transform`, …) run in the Vite container. Prefer hook **filters** / `withFilter` for perf.

Emitted assets from plugins: JS `import.meta.ROLLDOWN_FILE_URL_<referenceId>`; CSS/HTML `__VITE_ASSET__<id>__`.

`applyToEnvironment` (Environment API): 8.3 warns if the returned plugin uses unsupported hooks.

## Official `@vitejs/*` plugins (2026-09-18)

| Package | npm | Role |
|---|---|---|
| `@vitejs/plugin-react` | 6.1.1 | React Fast Refresh via **Oxc**. Peer `vite@^8`. Optional: `oxc-transform-react`, `@rolldown/plugin-babel`, `babel-plugin-react-compiler`. |
| `@vitejs/plugin-react-swc` | 4.3.3 | SWC-focused React |
| `@vitejs/plugin-vue` | 6.0.9 | Vue 3 SFC |
| `@vitejs/plugin-vue-jsx` | 5.1.6 | Vue JSX |
| `@vitejs/plugin-legacy` | 8.2.3 | Legacy production builds — **ES5 lowering not supported** under Rolldown. Prefers Oxc minify. |
| `@vitejs/plugin-rsc` | 0.5.35 | RSC via Environment API (0.x) |
| `@vitejs/plugin-basic-ssl` | 2.3.0 | Dev HTTPS |
| `@vitejs/devtools` | 0.7.5 | Optional Vite peer. `devtools: true` in user config (8.3+). |

Registry: https://vite.dev/plugins/ · https://registry.vite.dev · DevTools: https://devtools.vite.dev

**Community (not official):** e.g. `vite-plugin-pwa` for PWA. Prefer Awesome Vite / registry for backend framework plugins (Laravel, Rails, …).

### DevTools

```ts
export default defineConfig({
  devtools: true, // both serve and build; or { apply: 'serve' }
})
```

```sh
bun add -d @vitejs/devtools @vitejs/devtools-vite @vitejs/devtools-rolldown
```

Experimental. Plugin `config` hooks cannot set `devtools`.

## Production build

```ts
export default defineConfig({
  build: {
    target: 'baseline-widely-available',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'oxc',          // default client; SSR often false
    cssMinify: 'lightningcss',
    cssCodeSplit: true,     // false by default in lib mode
    manifest: false,        // true → .vite/manifest.json
    ssrManifest: false,
    license: false,         // true → .vite/license.md
    chunkImportMap: false,  // experimental
    rolldownOptions: {
      output: {
        // prefer Rolldown codeSplitting — not object manualChunks
        // codeSplitting: { groups: [{ name: 'libs', test: /node_modules/ }] },
      },
    },
  },
})
```

| Prefer | Avoid / deprecated |
|---|---|
| `build.rolldownOptions` | `build.rollupOptions` (alias, deprecated) |
| `oxc` | `esbuild` config (converted, deprecated) |
| `optimizeDeps.rolldownOptions` | `optimizeDeps.esbuildOptions` |
| `output.codeSplitting` | object `manualChunks` (removed); function form deprecated |
| `worker.rolldownOptions` | `worker.rollupOptions` |
| top-level `input` | repeating `build.rolldownOptions.input` for HTML-less apps |

Unsupported under Rolldown: `output.format: 'system' | 'amd'`.

`build.cssMinify` default `'lightningcss'` (false if client `build.minify` is disabled). `build.cssTarget` wins over `css.lightningcss.targets` during minify.

Docs: https://vite.dev/guide/build · https://vite.dev/config/build-options

### Bundled Dev Mode (experimental)

Formerly “Full Bundle Mode”. Serves bundled ESM in dev for huge apps (fewer requests, faster cold start / reload; HMR kept).

```ts
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
```

CLI: `bunx vite --experimental-bundle`. Third-party plugins may not work. 8.3: `server.watch` also accepts Rolldown watch options in this mode.

### Chunk import map (experimental)

`build.chunkImportMap: true` — maps chunk IDs via import maps so hash changes do not cascade. Needs `import.meta.resolve`. Incompatible with `experimental.renderBuiltUrl`. CSS/assets still invalidate their direct importers.

## Multi-page apps

```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa',
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        nested: resolve(import.meta.dirname, 'nested/index.html'),
      },
    },
  },
})
```

Dev serves HTML like a static server; asset paths follow resolved file ids.

## Library mode

```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'lib/main.ts'),
      name: 'MyLib',      // needed for umd/iife
      fileName: 'my-lib',
      // formats?: ['es', 'cjs', 'umd', 'iife']
    },
    rolldownOptions: {
      external: ['vue', 'react'],
      output: {
        globals: { vue: 'Vue', react: 'React' },
      },
    },
  },
})
```

- Single entry defaults often `es` + `umd`; multi-entry often `es` + `cjs`.
- CSS collapses to one file when `cssCodeSplit` is false (lib default).
- `vite/modulepreload-polyfill` does **not** apply to library mode.
- For complex non-browser libraries, consider Rolldown directly (per Vite docs guidance).

## Performance tips

- Warm critical files: `server.warmup.clientFiles` / `ssrFiles`
- Profile: `vite --profile [name]` (8.3 names the `.cpuprofile`), `vite --debug plugin-transform`
- Avoid deep barrel files when they pull huge graphs
- Prefer explicit extensions / fewer `resolve.extensions` guesses
- Use plugin hook filters to cut JS↔Rust overhead
- Tune `optimizeDeps.include` for stubborn CJS deps
- Huge apps: try experimental bundled Dev Mode
- Guide: https://vite.dev/guide/performance

## JavaScript API (sketch)

```ts
import { createServer, build, preview, transformWithOxc } from 'vite'

const server = await createServer({ /* UserConfig */ })
await server.listen()
server.printUrls()

await build({ /* inline config */ })
```

`build()` on Vite 8 may throw `BundleError` with `.errors` array (JS API users). Prefer `transformWithOxc` over deprecated `transformWithEsbuild` (esbuild must be installed if still used).

`rolldownVersion` is a string export (e.g. `1.2.x` on 8.3). `esbuildVersion` / `rollupVersion` remain for compatibility only.

## Environment API (RC)

Multi-environment model (`client`, custom `server`/`edge`, …). Status: **Release Candidate** — APIs intended to stay stable between majors so frameworks can experiment; **some APIs remain experimental**. Expected to stabilize (possibly with breaks) in a **future major**. SPA/MPA apps usually need not configure `environments`. Docs still advise most plugins not to switch away from `ViteDevServer` methods yet.

8.3: warn when a plugin returned from `applyToEnvironment` uses unsupported hooks.

Docs: https://vite.dev/guide/api-environment
