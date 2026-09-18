# Migrate to Vite 8 (from v7 / Rolldown preview)

Breaking changes and checklist. Sources: https://vite.dev/guide/migration · https://vite.dev/blog/announcing-vite8 · https://vite.dev/blog/announcing-vite8-1 · changelog 8.3.0

## Target

- Package: **`vite@^8`** (snapshot **8.3.0**)
- Node: **`^20.19.0 || >=22.12.0`** (same floor as Vite 7)
- Architecture: **Rolldown** (bundle + optimize) + **Oxc** (transform/minify) + **Lightning CSS** (CSS minify)
- Support: regular patches on **8.3**; important + security on 8.2 and 7.3; security on 8.1 and 6.4

Older docs: https://v7.vite.dev · https://v6.vite.dev

## Gradual path

1. On Vite 7, optionally switch to **`rolldown-vite`** (Vite 7 + Rolldown) to isolate Rolldown issues. Guide: https://v7.vite.dev/guide/rolldown
2. Then move to `vite@^8`:

```json
{
  "devDependencies": {
    "vite": "^8.3.0"
  }
}
```

If you used `"vite": "npm:rolldown-vite@…"`, replace it with real `vite@^8`.

Compatibility shims convert many old `esbuild` / `rollupOptions` / `optimizeDeps.esbuildOptions` settings — still **migrate** to the new names; shims are deprecated.

Already on 8.0–8.2: bump to **8.3.0**. No extra major breaks; pick up DevTools integration, `closeServer` hooks, top-level `tsconfig`, `--profile [name]`, and the 8.1/8.2 features below.

## Default browser target (NRV)

`build.target` default `'baseline-widely-available'` bumped (as of 2026-01-01 Baseline):

- Chrome/Edge **111**
- Firefox **114**
- Safari **16.4**

## Config renames

| Old | New |
|---|---|
| `build.rollupOptions` | `build.rolldownOptions` |
| `worker.rollupOptions` | `worker.rolldownOptions` |
| `optimizeDeps.esbuildOptions` | `optimizeDeps.rolldownOptions` |
| `esbuild` (shared) | `oxc` |
| `build.minify: 'esbuild'` | default `'oxc'` (esbuild needs installing if forced) |
| CSS minify esbuild | default `'lightningcss'` |
| `server.hmr.{protocol,host,port,path,clientPort,timeout,server}` | **`server.ws`** (8.1; old fields synced, deprecated) |
| `transformWithEsbuild` | `transformWithOxc` |

Inspect converted options:

```ts
{
  name: 'log-config',
  configResolved(config) {
    console.log(config.optimizeDeps.rolldownOptions)
    console.log(config.oxc)
  },
}
```

## Chunk splitting

- Object form `output.manualChunks` — **removed**
- Function form — **deprecated**
- Prefer Rolldown **`output.codeSplitting`** (see https://rolldown.rs/in-depth/manual-code-splitting)

## CJS default import interop

Vite 8 makes default imports from CJS **consistent** across dev/build. Some packages break.

Temporary escape hatch: `legacy.inconsistentCjsInterop: true` (deprecated). Prefer fixing the package or aliasing.

## Other breaks agents hit

| Change | Action |
|---|---|
| Format sniffing (`browser` vs `module`) removed | Use `resolve.alias` / package `exports` / patch |
| `require` of externals preserved as `require` | Use `esmExternalRequirePlugin` from `vite` if you need ESM conversion |
| `import.meta.url` in UMD/IIFE → `undefined` by default | Use `define` / `output.intro` per Rolldown docs |
| `system` / `amd` formats | Unsupported |
| `@vitejs/plugin-legacy` ES5 lowering | Not supported on Rolldown |
| `transformWithEsbuild` | Deprecated → `transformWithOxc`; install `esbuild` only if a plugin still needs it |
| Native decorators lowering | Oxc waiting on spec — Babel/SWC workaround in migration guide |
| `build()` JS API errors | May throw `BundleError` with `.errors[]` |
| `import.meta.hot.accept(URL)` | Pass **id**, not URL |
| `build.commonjsOptions` | No-op / deprecated |
| `build.rollupOptions.watch.chokidar` | Removed → `build.rolldownOptions.watch.watcher` |
| Plugin `load`/`transform` converting non-JS | Return `moduleType: 'js'` |

## Vite 8.1–8.3 (already on Vite 8)

Not 7→8 breaks — features/renames after 8.0:

| Version | Note |
|---|---|
| 8.1 | Experimental **bundled Dev Mode** (`experimental.bundledDev` / `--experimental-bundle`; was “Full Bundle Mode”) |
| 8.1 | Experimental **chunk import map** (`build.chunkImportMap`) |
| 8.1 | Wasm **ESM integration** (direct `.wasm` imports) |
| 8.1 | Lightning CSS transformer closer to default (external CSS `@import`, plugin file deps). Still opt-in via `css.transformer: 'lightningcss'` |
| 8.1 | `import.meta.glob` `caseSensitive`; `html.additionalAssetSources` |
| 8.1 | `server.hmr` WebSocket fields → `server.ws` |
| 8.2 | Top-level **`input`**. `resolve.tsconfigPaths` no longer `@experimental` |
| 8.3 | **DevTools** dev-server integration (`devtools` + `@vitejs/devtools`, Vite 8.3+) |
| 8.3 | Top-level **`tsconfig`** (discouraged) |
| 8.3 | Plugin **`closeServer` / `closePreviewServer`** |
| 8.3 | `--profile [name]`; `server.watch` Rolldown options in bundled-dev |
| 8.3 | `import.meta.ROLLDOWN_FILE_URL_*` for emitted assets |
| 8.3 | Named JSON import warning; worker search params preserved |

## Coming from Vite 6

1. Apply Vite 6→7 migration on https://v7.vite.dev/guide/migration first (Node floor, Baseline target, Sass modern API, removed `splitVendorChunkPlugin`, …).
2. Then apply this Vite 8 checklist.

## Checklist

1. Ensure Node meets `^20.19.0 || >=22.12.0`.
2. Bump to `vite@^8.3` and aligned `@vitejs/plugin-*` peers (`@vitejs/plugin-react@6` is Oxc Fast Refresh).
3. Rename `rollupOptions` → `rolldownOptions`, `esbuild` → `oxc`, dep optimize options likewise. Move HMR socket config to `server.ws`.
4. Replace object `manualChunks` with `codeSplitting`.
5. Run production build; fix CJS default-import breakages.
6. Re-test legacy browser / plugin-legacy assumptions.
7. Confirm SSR dual builds and backend manifests still emit correct URLs.
8. Separate typecheck (`tsc`) still green — Vite never replaced it.
9. Optional: try `css.transformer: 'lightningcss'`, DevTools, or bundled Dev Mode — all experimental except Lightning CSS **minify**.

## What stayed conceptually the same

- `index.html` as app entry, `public/` for static copy-through
- Plugin model (with Rolldown underneath)
- `import.meta.env` + `VITE_` client prefix
- Dev HMR + dep pre-bundle (now Rolldown)
- Low-level SSR middleware mode + `ssrLoadModule`
- Environment API still **RC** (not the Vite 8 default app model)
