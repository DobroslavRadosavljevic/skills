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
bun add -d @tsdown/css@0.22.14
```

```ts
export default defineConfig({
  css: {
    transformer: 'lightningcss', // or 'postcss'
    splitting: false,            // merge → style.css
    fileName: 'style.css',
    minify: true,
    inject: false,               // true keeps import './x.css' in JS
    modules: true,
  },
})
```

- Unbundle mode defaults CSS splitting **on**.
- `?inline` → CSS as JS string.
- Preprocessors: install `sass` / `less` / `stylus` as needed.

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

Experimental Node SEA path; peer `@tsdown/exe` must match tsdown version; Node version floor is higher — confirm current docs before using.

## Programmatic API

```ts
import { build, defineConfig, mergeConfig, version } from 'tsdown'

const bundles = await build({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  write: false, // in-memory chunks on result
  clean: false,
})
```

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
