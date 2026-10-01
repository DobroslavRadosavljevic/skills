# Usage Guide

Day-to-day tsdown 0.23 workflow for TypeScript/JavaScript libraries.

## 1. Requirements

- Node **`^22.18.0 || ^24.11.0 || >=26.0.0`** to **run** the CLI (Node 25 unsupported since 0.23; library output can target older runtimes via `target` / `engines.node`).
- Prefer **`tsdown@^0.23.0`**. Projects still on 0.22 or tsup: clear warnings on 0.22.14 first — see [migrate-from-tsup.md](migrate-from-tsup.md).

## 2. Install and scaffold

```sh
bun add -d tsdown typescript
bunx create-tsdown@latest   # optional scaffold
```

```json
{
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch"
  }
}
```

## 3. Minimal config

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
})
```

Defaults that matter:

| Option | Default |
|---|---|
| `entry` | `src/index.ts` if present |
| `format` | `'esm'` |
| `outDir` | `'dist'` |
| `clean` | `true` |
| `platform` | `'node'` |
| `treeshake` | `true` |
| `minify` | `false` |
| `dts` | Auto if `package.json` has types/exports types |
| `deps.resolveDepSubpath` | `false` (0.23) |
| `target` | From `package.json` `engines.node`, else no lowering |

```sh
bunx tsdown
bunx tsdown --watch
bunx tsdown src/cli.ts --format esm --dts
```

## 4. Typical library setups

### ESM-only (preferred for new libs)

```ts
export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'esm',
  dts: true,
  exports: true, // rewrite package.json exports from outputs
})
```

### Dual ESM + CJS

```ts
export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  // cjsDefault: true (default) — single default export → module.exports
})
```

CJS is **maintenance-only**; prefer ESM-only when consumers can `require(esm)`.

### Externalize UI peers

```ts
export default defineConfig({
  entry: ['./src/index.ts'],
  deps: {
    neverBundle: ['react', 'react-dom', /^@myorg\//],
    alwaysBundle: ['some-tiny-helper'],
  },
})
```

Do **not** use deprecated `external` / `noExternal` in new configs.

## 5. Declarations

```ts
export default defineConfig({
  dts: true,
  // or: dts: { generator: 'oxc' }  // explicit generator: 'oxc' | 'tsc' | 'tsgo'
  // or: dts: { resolver: 'tsc' }   // when oxc import resolution struggles with complex @types
})
```

- Fast path: enable `isolatedDeclarations` in tsconfig → Oxc generator (auto-selected).
- TypeScript 7 installed → `tsgo` (experimental) is auto-selected.
- Otherwise: `tsc` (install `typescript`).
- Vue SFCs: `dts: { vue: true }` + `vue-tsc` + `unplugin-vue/rolldown` — see [plugins-css-workspace.md](plugins-css-workspace.md).

## 6. Watch and unbundle

```sh
bunx tsdown --watch
bunx tsdown --watch ./src
```

```ts
export default defineConfig({
  entry: ['./src/index.ts'],
  unbundle: true, // preserveModules-style / transpile many files
})
```

No stub mode — use watch and/or `exports.devExports` for local consumption.

## 7. Progressive adoption

1. Add `tsdown` + `entry` + ESM build script.
2. Turn on `dts` and align `package.json` `exports` (`exports: true` or hand-written).
3. Tune `deps.neverBundle` / `alwaysBundle` after inspecting the size report.
4. Add watch for local DX; dual-format only if required.
5. Optional: CSS (`@tsdown/css`), publint/attw, workspace `-W`.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| CLI fails on Node 20 | Upgrade Node for **building** (output can still target older engines) |
| Deps unexpectedly in bundle | Adjust `deps.neverBundle` / defaults (devDeps may bundle) |
| Deps missing from bundle | `deps.alwaysBundle` |
| No `.d.ts` | `dts: true` + `typescript`; or add `types`/`exports.types` for auto |
| Wrong extensions | Node platform → `.mjs`/`.cjs` via `fixedExtension`; check `type: "module"` |
| Config `.ts` won’t load | Use Node 22.18+ native, or `--config-loader tsx` / `unrun` |
| tsup options warn (0.22) or silently ignored (0.23) | Migrate — [migrate-from-tsup.md](migrate-from-tsup.md) |
| CLI fails on Node 25 | Use Node 24.11+ or 26+ (0.23 dropped 25) |
| `dep/sub` no longer gets `.js` appended | 0.23 default `resolveDepSubpath: false` — set `true` |
| `attw` stopped flagging CJS issues | 0.23 default profile `esm-only` — set `attw: { profile: 'strict' }` |
| `bundles.map is not a function` from `build()` | 0.23 returns `{ bundles, watch }` |
| Too much size-report noise | `report: { summary: true }` |

## 9. What not to do

- Do not treat tsdown as a Vite app bundler.
- Do not keep `external` / `entryPoints` / `bundle: false` in greenfield configs.
- Do not assume tsup defaults (`format: cjs`, `clean: false`).
- Do not jump to 0.23 with unresolved 0.22 deprecation warnings.
- Do not enable minify without testing (Oxc minify still maturing / alpha caveats in docs).
