# Declarations, Exports, and Dependencies

`dts`, `package.json` exports generation, and the `deps` API.

## Declarations (`dts`)

```ts
export default defineConfig({
  dts: true,
})
```

- Implemented with **`rolldown-plugin-dts`**. Install **`typescript`**.
- Auto-enabled when `package.json` has `types` / `typings` or `exports` with a `types` condition.
- CLI: `--dts`
- Off by default when experimental `exe` is enabled.

### Generators

| Path | When |
|---|---|
| Oxc | Fast — needs `isolatedDeclarations` in tsconfig |
| tsc | Full TypeScript / complex graphs |
| tsgo | Experimental (TS7 line) |

```ts
dts: {
  // resolver: 'tsc', // when oxc struggles with third-party types
  sourcemap: true,    // or tsconfig declarationMap
}
```

ESM: JS + dts often in one build. CJS: separate dts-only build for compatibility. Dual format typically needs the **same** `outDir`.

### Framework notes

- **React:** JSX/TSX built-in; `dts: true` usually enough.
- **Vue:** `plugins: [Vue(...)]` from `unplugin-vue/rolldown` + `dts: { vue: true }` (+ `vue-tsc`).

Docs: https://tsdown.dev/options/dts

## Package exports

```ts
export default defineConfig({
  format: ['esm', 'cjs'],
  exports: true,
})
```

Writes `package.json` `exports` (and often `main`/`module` when dual-format / legacy rules apply).

| Option | Role |
|---|---|
| `exports: true` | Generate from entries/outputs |
| `exports.all` | Also export non-entry dist files |
| `exports.legacy` | Top-level `main`/`module`/`types` (default depends on ESM-only vs dual) |
| `exports.devExports` | Source paths for local installs; built paths for publish (`publishConfig`) — yarn/pnpm pack; **not npm** |
| `exports.customExports` | Object or mutator function |
| `exports.exclude` | Exclude patterns (relative to dist, no extensions) |
| `exports.bin` | Shebang / bin map |
| `exports.inlinedDependencies` | Default true |

Example dual shape:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  }
}
```

Exact filenames depend on `fixedExtension` / `type` / format. Prefer verifying after a build.

With CSS merge + `exports: true`, a style entry (default `style.css`) can be added — see CSS docs.

Docs: https://tsdown.dev/options/package-exports

## Dependencies (`deps`)

Preferred API (replaces deprecated `external` / `noExternal`):

```ts
export default defineConfig({
  deps: {
    neverBundle: ['react', /^@scope\//],  // always external
    alwaysBundle: ['tiny-helper'],        // force into bundle
    // onlyBundle / onlyImport / resolveDepSubpath — see docs when needed
  },
})
```

### Default policy

| Kind | Default treatment |
|---|---|
| `dependencies` / `peerDependencies` / optional peers | **External** |
| Used `devDependencies` / phantom imports | Often **bundled** |

To externalize everything package-like: `deps: { neverBundle: true }` (confirm exact boolean form against current docs if using the all-external shortcut).

Deprecated but still warned on 0.22:

| Old | Prefer |
|---|---|
| `external` | `deps.neverBundle` |
| `noExternal` | `deps.alwaysBundle` |
| `skipNodeModulesBundle` | `deps.neverBundle: true` (or transitional `deps.skipNodeModulesBundle`) |

Docs: https://tsdown.dev/options/dependencies

## Validation

Optional peers:

```sh
bun add -d publint @arethetypeswrong/core unplugin-unused
bunx tsdown --publint --attw --unused
```

Or config `publint` / `attw` / `unused` options. Docs: https://tsdown.dev/options/lint

## CJS default export

`cjsDefault: true` (default): when an **entry** has a single default export, emit CJS `module.exports = …` and matching `.d.cts` `export =`. Does not rewrite every unbundle chunk. Docs: https://tsdown.dev/options/cjs-default
