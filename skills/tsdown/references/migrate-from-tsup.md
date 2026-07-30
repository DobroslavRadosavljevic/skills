# Migrate from tsup

Checklist and option map. Source: https://tsdown.dev/guide/migrate-from-tsup

## Recommended path

1. Commit a clean tree.
2. Run the migrator (stays on **0.22.x** compat):

   ```sh
   bunx tsdown-migrate
   bunx tsdown-migrate packages/*
   bunx tsdown-migrate -d   # dry-run
   ```

3. Clear **all** deprecation warnings on **tsdown 0.22.14**.
4. Only then upgrade toward **0.23+** (beta removes many tsup-compat shims).

Manual: `bun add -d tsdown` and rewrite config using the tables below.

## Default deltas (highest surprise)

| | tsup | tsdown 0.22 |
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

## 0.23 beta heads-up

When leaving 0.22:

- Many deprecated tsup-compat options are **removed**.
- Prefer `dts.generator` for generator selection.
- Re-check `resolveDepSubpath` defaults and related deps flags on https://main.tsdown.dev.

## Checklist

1. Replace `defineConfig` import with `tsdown`.
2. Rename mapped options; switch Unplugin to `/rolldown`.
3. Explicitly set `format` if you still need CJS.
4. Verify `deps` vs accidental bundling of peers.
5. `bunx tsdown` + import/require smoke + types.
6. Zero warnings, then consider 0.23.

## Unbuild

No official migration guide. Only documented relationship: unbuild inspired **hooks**. Migrate manually using tsdown options + hooks docs.
