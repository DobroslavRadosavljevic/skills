# Plugins and Build

Plugin API conventions, official plugins, production build, library mode, MPA, and performance.

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
| `config` / `configResolved` | Mutate / read resolved config |
| `configureServer` / `configurePreviewServer` | Connect middlewares (return fn = post-internal) |
| `transformIndexHtml` | HTML transforms (`order` + `handler`) |
| `handleHotUpdate` | Custom HMR (Environment API adds `hotUpdate`) |

Universal Rolldown hooks (`resolveId`, `load`, `transform`, …) run in the Vite container. Prefer hook **filters** / `withFilter` for perf on Vite 6.3+.

## Official `@vitejs/*` plugins

| Package | Role |
|---|---|
| `@vitejs/plugin-react` | React Fast Refresh via Oxc |
| `@vitejs/plugin-react-swc` | SWC-focused React |
| `@vitejs/plugin-vue` | Vue 3 SFC |
| `@vitejs/plugin-vue-jsx` | Vue JSX |
| `@vitejs/plugin-legacy` | Legacy production builds — **ES5 lowering not supported** under Rolldown |
| `@vitejs/plugin-rsc` | RSC via Environment API |
| `@vitejs/plugin-basic-ssl` | Dev HTTPS |

Registry: https://vite.dev/plugins/ · https://registry.vite.dev

**Community (not official):** e.g. `vite-plugin-pwa` for PWA. Prefer Awesome Vite / registry for backend framework plugins (Laravel, Rails, …).

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
    rolldownOptions: {
      // preferred over deprecated rollupOptions
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

Unsupported under Rolldown: `output.format: 'system' | 'amd'`.

Docs: https://vite.dev/guide/build · https://vite.dev/config/build-options

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
- For complex non-browser libraries, consider Rolldown/tsdown directly (per Vite docs guidance).

## Performance tips

- Warm critical files: `server.warmup.clientFiles` / `ssrFiles`
- Profile: `vite --profile`, `vite --debug plugin-transform`
- Avoid deep barrel files when they pull huge graphs
- Prefer explicit extensions / fewer `resolve.extensions` guesses
- Use plugin hook filters to cut JS↔Rust overhead
- Tune `optimizeDeps.include` for stubborn CJS deps
- Guide: https://vite.dev/guide/performance

## JavaScript API (sketch)

```ts
import { createServer, build, preview } from 'vite'

const server = await createServer({ /* UserConfig */ })
await server.listen()
server.printUrls()

await build({ /* inline config */ })
```

`build()` on Vite 8 may throw `BundleError` with `.errors` array (JS API users).

## Environment API (RC)

Multi-environment model (`client`, custom `server`/`edge`, …). Status: **Release Candidate** — usable for frameworks; expect possible breaks before full stabilization. SPA/MPA apps usually need not configure `environments`.

Docs: https://vite.dev/guide/api-environment
