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

Select with **`dts.generator`** only (0.23). `dts.oxc` / `dts.tsgo` objects now only configure their own generator.

| `generator` | When | Requirement |
|---|---|---|
| `'oxc'` | Fast — isolated declarations | Code valid under `isolatedDeclarations` |
| `'tsc'` | Full TypeScript / complex graphs, Vue, Volar languages | TypeScript 5.x or 6.x |
| `'tsgo'` | Experimental TypeScript 7 builds | TypeScript 7 or `@typescript/native-preview`; needs a `tsconfig.json` |

Omitted → `oxc` when `compilerOptions.isolatedDeclarations` is on, `tsgo` when TypeScript 7 is installed as `typescript`, otherwise `tsc`.

```ts
dts: {
  generator: 'oxc',   // was `dts.oxc: true` before 0.23
  // resolver: 'tsc', // when oxc import resolution struggles with third-party types
  sourcemap: true,    // or tsconfig declarationMap
}
```

ESM: JS + dts in one build. CJS: a **separate** declaration-only pass (0.23 always does this for dual format; `dts.cjsReexport` was removed). Dual format typically needs the **same** `outDir`.

Other `rolldown-plugin-dts` options (`build`, `incremental`, `parallel`, `eager`, `tsconfig`, `tsconfigRaw`, `emitDtsOnly`): https://github.com/sxzz/rolldown-plugin-dts#readme

### Framework notes

- **React:** JSX/TSX built-in; `dts: true` usually enough.
- **Vue:** `plugins: [Vue(...)]` from `unplugin-vue/rolldown` + `dts: { vue: true }` (+ `vue-tsc`). Requires the `tsc` generator — 0.23 throws on an incompatible generator.
- **Other custom languages (Astro, …):** `dts.customLanguages` (was `dts.volarPlugins`); each language's hook is `createVolarPlugins` (was `create`).

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
    onlyBundle: ['tiny-helper'],          // whitelist: error if anything else is bundled
    onlyImport: ['react'],                // whitelist: error if output imports anything else
    resolveDepSubpath: false,             // 0.23 default; true rewrites `dep/sub` → `dep/sub.js` for packages without `exports`
  },
})
```

### Default policy

| Kind | Default treatment |
|---|---|
| `dependencies` / `peerDependencies` / optional peers | **External** |
| Used `devDependencies` / phantom imports | Often **bundled** (a hint suggests `onlyBundle` unless it is set, or `false` to silence) |

Externalize everything package-like and bundle a few picks:

```ts
deps: { neverBundle: true, alwaysBundle: ['tiny-helper'] }
```

Removed in 0.23 (fail typecheck, ignored at runtime):

| Old | Use |
|---|---|
| `skipNodeModulesBundle: true` / `deps.skipNodeModulesBundle` | `deps.neverBundle: true` |
| `inlineOnly` / `deps.onlyAllowBundle` | `deps.onlyBundle` |

Still deprecated (warns; setting both old and new throws):

| Old | Prefer |
|---|---|
| `external` | `deps.neverBundle` |
| `noExternal` | `deps.alwaysBundle` |

Behavior change in 0.23: **`resolveDepSubpath` defaults to `false`** — set `true` to keep 0.22 behavior.

Docs: https://tsdown.dev/options/dependencies

## Validation

Optional peers:

```sh
bun add -d publint @arethetypeswrong/core unplugin-unused
bunx tsdown --publint --attw --unused
```

Or config `publint` / `attw` / `unused` options.

`attw` profiles: `'strict'` (all resolutions), `'node16'` (ignore node10), `'esm-only'` (ignore node10 + node16-cjs). **0.23 default is `esm-only`** (was `strict`) — set `attw: { profile: 'strict' }` for dual-format packages that must resolve under CJS. `level: 'warn'` (default) or `'error'`; `ignoreRules` for specific problems. The docs page may still show `strict` as default; the code default is `esm-only`.

Docs: https://tsdown.dev/options/lint

## CJS default export

`cjsDefault: true` (default): when an **entry** has a single default export, emit CJS `module.exports = …` and matching `.d.cts` `export =`. Does not rewrite every unbundle chunk. Docs: https://tsdown.dev/options/cjs-default
