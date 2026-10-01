# Migrate from tsup

Checklist and option map. Source: https://tsdown.dev/guide/migrate-from-tsup

## Recommended path

1. Commit a clean tree.
2. Run the migrator (installs **tsdown 0.22.14**, the last version that still accepts tsup-compat options with warnings):

   ```sh
   bunx tsdown-migrate
   bunx tsdown-migrate packages/*
   bunx tsdown-migrate -d                    # dry-run
   bunx tsdown-migrate --yes --no-install    # non-interactive (CI / agents)
   bunx tsdown-migrate --package-manager bun # when detection fails
   ```

3. Clear **all** deprecation warnings on **tsdown 0.22.14**.
4. Only then upgrade to **`tsdown@^0.23.0`** — 0.23 removed the tsup-compat options; leftovers fail typecheck and are **silently ignored** at runtime.

Manual: `bun add -d tsdown` and rewrite config using the tables below.

## Default deltas (highest surprise)

| | tsup | tsdown 0.23 |
|---|---|---|
| Default `format` | cjs | **esm** |
| `clean` | often false | **true** |
| `dts` | false unless set | **auto** from package.json types |
| `target` | often none | from **`engines.node`** |

## Option mappings

| tsup | tsdown |
|---|---|
| `entryPoints` | `entry` |
| `cjsInterop` | `cjsDefault` |
| `esbuildPlugins` | `plugins` (Rolldown / `unplugin-*/rolldown`) |
| `outExtension` | `outExtensions` |
| `skipNodeModulesBundle` | `deps: { neverBundle: true }` |
| `publicDir` | `copy` |
| `bundle: false` | `unbundle: true` |
| `bundle: true` | remove (default) |
| `removeNodeProtocol: true` | `nodeProtocol: 'strip'` |
| `injectStyle: true` | `css: { inject: true }` |
| `external: [...]` | `deps: { neverBundle: [...] }` |
| `noExternal: [...]` | `deps: { alwaysBundle: [...] }` |

## Full example

```ts
// Before (tsup)
import { defineConfig } from 'tsup'
import myPlugin from 'unplugin-example/esbuild'

export default defineConfig({
  entryPoints: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react'],
  noExternal: ['lodash-es'],
  publicDir: 'public',
  cjsInterop: true,
  removeNodeProtocol: true,
  injectStyle: true,
  esbuildPlugins: [myPlugin()],
  clean: true,
})

// After (tsdown)
import { defineConfig } from 'tsdown'
import myPlugin from 'unplugin-example/rolldown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  deps: {
    neverBundle: ['react'],
    alwaysBundle: ['lodash-es'],
  },
  copy: 'public',
  cjsDefault: true,
  nodeProtocol: 'strip',
  css: { inject: true },
  plugins: [myPlugin()],
  clean: true,
})
```

## Unsupported / removed concepts

| tsup | Notes |
|---|---|
| `splitting: false` | Code splitting always on |
| `metafile` | Prefer `devtools: true` / current reporting |
| `swc` / `experimentalDts` / `legacyOutput` | No direct equivalent — rework |
| Stub mode | Use `--watch` + `exports.devExports` |

## Upgrade 0.22 → 0.23

Source: https://github.com/rolldown/tsdown/releases/tag/v0.23.0. Most projects upgrade directly after a warning-free build on 0.22.14.

| Area | 0.22 | 0.23 |
|---|---|---|
| Node (to run tsdown) | `^22.18.0 \|\| >=24.11.0` | `^22.18.0 \|\| ^24.11.0 \|\| >=26.0.0` (Node 25 dropped) |
| Unbundle | `bundle: false` | `unbundle: true` (`bundle: true` → delete) |
| Extensions | `outExtension` | `outExtensions` |
| Static copy | `publicDir` / `--public-dir` | `copy` / `--copy` |
| `node:` prefix | `removeNodeProtocol: true` | `nodeProtocol: 'strip'` |
| CSS inject | `injectStyle` | `css.inject` |
| Bundle whitelist | `inlineOnly` / `deps.onlyAllowBundle` | `deps.onlyBundle` |
| Externalize all | `skipNodeModulesBundle: true` | `deps.neverBundle: true` |
| Subpath rewrite | `resolveDepSubpath` on by default | **off** by default — set `true` to keep old behavior |
| dts generator | `dts.oxc: true` / `dts.tsgo: true` | `dts.generator: 'oxc' \| 'tsgo' \| 'tsc'` |
| Custom languages | `dts.volarPlugins` + `create` hook | `dts.customLanguages` + `createVolarPlugins` hook; incompatible generator now throws |
| CJS dts | `dts.cjsReexport` | removed — dual format emits CJS declarations in a separate pass |
| attw | default profile `strict` | default `esm-only` — set `profile: 'strict'` to keep old checks |
| Programmatic | `const bundles = await build()` | `const { bundles, watch } = await build()` |
| Internals | `rolldown-plugin-dts@0.27` | `rolldown-plugin-dts@0.28` (Rolldown 1.2.x) |

tsdown's own `package.json` dropped `types` / `typesVersions` fallbacks: importing `tsdown` types in a config needs TypeScript `moduleResolution` `bundler`, `node16`, or `nodenext`.

New in 0.23: programmatic watch controls (`watch.restart()` / `watch.close()`), `report.summary`, function form for `css.modules.localsConvention`, `unplugin-unused` 0.5+.

## Checklist

1. Replace `defineConfig` import with `tsdown`.
2. Rename mapped options; switch Unplugin to `/rolldown`.
3. Explicitly set `format` if you still need CJS.
4. Verify `deps` vs accidental bundling of peers.
5. `bunx tsdown` + import/require smoke + types.
6. Zero warnings on 0.22.14, then upgrade to 0.23 and re-run the build, typecheck, and `attw`.

## Unbuild

No official migration guide. Only documented relationship: unbuild inspired **hooks**. Migrate manually using tsdown options + hooks docs.
