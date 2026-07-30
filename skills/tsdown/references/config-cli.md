# Config and CLI

Config discovery, `defineConfig`, CLI flags, and important defaults.

## Config files

Discovered names (walk upward from cwd):

- `tsdown.config.ts` / `.mts` / `.cts` / `.js` / `.mjs` / `.cjs` / `.json`
- `tsdown.config` (extensionless)
- `"tsdown"` field in `package.json`

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
})

// array of configs
export default defineConfig([
  { entry: ['src/index.ts'] },
  { entry: ['src/cli.ts'], format: 'esm' },
])

// function form
export default defineConfig((_, { ci }) => ({
  minify: !!ci,
  failOnWarn: ci ? 'ci-only' : false,
}))
```

Config loaders (`--config-loader`): `auto` (default), `native`, `tsx`, `unrun` (last two optional peers).

Docs: https://tsdown.dev/options/config-file

## Entry

```ts
entry: 'src/index.ts'
entry: ['src/a.ts', 'src/b.ts']
entry: { main: 'src/index.ts', utils: 'src/utils.ts' }
// globs + negation supported
```

CLI positional files override/set entries. Default: `src/index.ts` when present.

## Formats and output

| Option | Notes |
|---|---|
| `format` | `'esm'` (default) \| `'cjs'` \| `'iife'` \| `'umd'` \| array \| per-format object |
| `outDir` | Default `dist` |
| `clean` | Default **`true`** |
| `platform` | `'node'` (default) \| `'browser'` \| `'neutral'`; CJS forces `node` |
| `target` | From `engines.node` or explicit; `false` / `--no-target` skips lowering |
| `fixedExtension` | Default true on node → `.mjs`/`.cjs` |
| `sourcemap` | Default false; forced if `declarationMap` |
| `minify` | Default false; Oxc — test thoroughly |
| `treeshake` | Default true |
| `unbundle` | Default false — file-preserving mode |
| `hash` | Chunk filename hashes (default true) |
| `report` | Size report (default true) |
| `shims` | CJS/ESM shims (default false) |
| `cjsDefault` | Default true for entry default-export interop |
| `write` | Default true; `false` = in-memory (no watch) |

Per-format overrides:

```ts
format: {
  esm: { target: ['es2015'] },
  cjs: { target: ['node20'] },
}
```

## CLI cheat sheet

```sh
bunx tsdown
bunx tsdown --watch
bunx tsdown -c ./tsdown.config.ts
bunx tsdown --no-config
bunx tsdown --format esm --format cjs
bunx tsdown -d dist
bunx tsdown --dts --sourcemap
bunx tsdown --minify
bunx tsdown --target node20
bunx tsdown --platform browser
bunx tsdown --unbundle
bunx tsdown --exports
bunx tsdown --copy public
bunx tsdown --publint --attw --unused   # need peers
bunx tsdown -W -F my-pkg                # workspace (experimental)
bunx tsdown --concurrency 4
bunx tsdown --fail-on-warn
bunx tsdown --from-vite                 # experimental
```

Flag rules: `--foo` → true, `--no-foo` → false, `--foo.bar` → nested; camelCase ≡ kebab-case.

Docs: https://tsdown.dev/reference/cli

## Default vs tsup mental model

| | tsup (typical) | tsdown (0.22) |
|---|---|---|
| Default format | cjs | **esm** |
| clean | often false | **true** |
| dts | opt-in | **auto** from package.json types |
| target | often none | from **engines.node** |
| external | `external` | **`deps.neverBundle`** |

## Env

Compile-time env via `--env.*`, `--env-file`, `--env-prefix` (file vars default prefix `TSDOWN_`). Prefer explicit `define`-style Rolldown options when replacing identifiers.

## CI tips

- Build on Node ≥ 22.18 even if the published package supports older runtimes.
- Consider `failOnWarn: 'ci-only'` in config.
- Docs: https://tsdown.dev/advanced/ci
