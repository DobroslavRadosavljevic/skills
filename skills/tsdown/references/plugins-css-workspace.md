# Plugins, CSS, Workspace, and Programmatic API

Advanced surfaces beyond a basic ESM library build.

## Plugins

Config-only (not CLI). Supported: Rolldown plugins, most Unplugin (`…/rolldown`), most Rollup plugins, some Vite plugins.

```ts
import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  platform: 'neutral',
  plugins: [Vue({ isProduction: true })],
  dts: { vue: true },
})
```

Unplugin imports: use **`/rolldown`** entry, not `/esbuild`.

### tsdown plugin hooks

```ts
import type { TsdownPlugin } from 'tsdown'

const plugin: TsdownPlugin = {
  name: 'example',
  tsdownConfig(config) {
    // mutate or return partial UserConfig
  },
  tsdownConfigResolved(resolved) {
    // read-only; once per format
  },
}
```

### Lifecycle hooks

`hooks`: `build:prepare` | `build:before` (per format) | `build:done` (unbuild-inspired / hookable).

### Raw Rolldown

```ts
export default defineConfig({
  inputOptions: {
    /* Rolldown input */
  },
  outputOptions: {
    /* Rolldown output — e.g. entryFileNames for iife/umd */
  },
})
```

Or functions `(opts, format) => opts`. Docs: https://tsdown.dev/advanced/rolldown-options · https://tsdown.dev/advanced/plugins

`--from-vite` / `fromVite` reuses Vite/Vitest resolve+plugins — **experimental**.

## CSS (`@tsdown/css`)

Experimental (may break outside SemVer). Install matching version:

```sh
bun add -d @tsdown/css@0.23.0   # same version as tsdown
```

```ts
export default defineConfig({
  css: {
    transformer: 'lightningcss', // or 'postcss'
    splitting: false,            // merge → style.css
    fileName: 'style.css',
    minify: true,
    inject: false,               // true keeps import './x.css' in JS
    modules: true,               // or { localsConvention: (name) => … } (function form 0.23+)
  },
})
```

- Unbundle mode defaults CSS splitting **on**.
- `?inline` → CSS as JS string.
- Preprocessors: install `sass` / `sass-embedded` / `less` / `stylus` as needed. PostCSS path peers: `postcss`, `postcss-import`, `postcss-modules`.
- Watch mode also tracks files pulled in via CSS `@import` (0.23).

Docs: https://tsdown.dev/options/css

## Copy assets

```ts
copy: 'LICENSE'
copy: [
  'README.md',
  {
    from: ['public/**/*', '!public/**/*.map'],
    to: 'dist/assets',
    flatten: false,
  },
]
```

```sh
bunx tsdown --copy public
```

Runs after bundle; paths relative to **cwd**. Replaces deprecated `publicDir`. Docs: https://tsdown.dev/options/copy

## Workspace (experimental)

```sh
bunx tsdown -W
bunx tsdown -W -F my-package
bunx tsdown -W --concurrency 4
```

```ts
export default defineConfig({
  workspace: true, // or 'packages/*' or { include, exclude, config }
})
```

Root config merges into packages. Filter by name/cwd/regex. Concurrency ignored in watch. Docs: FAQ monorepo + CLI `-W`/`-F`.

## Executable (`@tsdown/exe`)

Experimental Node Single Executable Applications (SEA). Peer `@tsdown/exe` must match the tsdown version. Needs Node **>= 25.7.0** to build; with 0.23 engines that means Node **26+**. Not supported when running under Bun or Deno. dts defaults off when `exe` is on.

```sh
bunx tsdown src/cli.ts --exe
```

```ts
export default defineConfig({
  entry: ['src/cli.ts'],
  exe: { fileName: 'my-tool' }, // no `.exe` / platform suffix — added automatically
})
```

Docs: https://tsdown.dev/options/exe

## Programmatic API

```ts
import { build, defineConfig, mergeConfig, version } from 'tsdown'

// 0.23: build() returns a handle, not an array
const { bundles, watch } = await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  write: false, // in-memory chunks; incompatible with watch
  clean: false, // clean defaults to true even with write: false
})

for (const bundle of bundles) {
  for (const output of bundle.chunks) {
    console.log(output.fileName, output.type === 'chunk' ? output.code : output.source)
  }
}
```

- `bundles` has one entry per resolved config (always an array).
- In watch mode: `await watch.restart()` resolves to a new handle (each handle restarts once); `await watch.close()` closes all watchers.
- `copy` / `exports` may still write files when `write: false`.

Also: `enableDebug`, `globalLogger`. Docs: https://tsdown.dev/advanced/programmatic-usage

## Recipes

| Recipe | URL |
|---|---|
| React | https://tsdown.dev/recipes/react-support |
| Vue | https://tsdown.dev/recipes/vue-support |
| Solid | https://tsdown.dev/recipes/solid-support |
| Svelte | https://tsdown.dev/recipes/svelte-support |
| WASM | https://tsdown.dev/recipes/wasm-support |

WASM typically via `rolldown-plugin-wasm` (`?init`, `?url`, …).
