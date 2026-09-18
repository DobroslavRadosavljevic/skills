# Setup, CLI, and Config

## Install

```sh
bun add -D oxfmt
```

```json
{
  "scripts": {
    "format": "oxfmt",
    "format:check": "oxfmt --check"
  }
}
```

One-off: `bunx oxfmt --help`. Official docs also name scripts `fmt` / `fmt:check` — same flags.

npm package is required for Prettier-backed languages, TypeScript configs, Tailwind sorting, and `--lsp`. The GitHub Releases standalone binary skips those.

Optional peers (install only when used): `svelte` `^5` for `.svelte`; `vite-plus` when config lives in `vite.config.ts` `fmt`.

## CLI

```text
oxfmt [-c=PATH] [PATH]...
```

- No paths → format **cwd** (like `prettier --write .`).
- Default mode is **write** (`--write`).
- Style options are **config-only** — no `--no-semi`-style CLI flags.

| Flag | Role |
| --- | --- |
| `--write` | Format in place (**default**) |
| `--check` | Check + stats; CI gate |
| `--list-different` | Print paths that would change |
| `--init` | Write `.oxfmtrc.json` (JSON scaffold — prefer converting to `oxfmt.config.ts`) |
| `--migrate=prettier` / `--migrate=biome` | Config migration (often JSON — convert to TS if desired) |
| `--lsp` | LSP server for editors |
| `--stdin-filepath=PATH` | Parser from filename for stdin |
| `-c` / `--config` | Explicit config (disables nested lookup) |
| `--disable-nested-config` | Resolve one config from cwd upward |
| `--ignore-path` | Extra ignore file(s); repeatable |
| `--with-node-modules` | Include `node_modules` |
| `--no-error-on-unmatched-pattern` | Don’t fail when globs match nothing |
| `--threads=INT` | Thread count |

Quote globs in shells. `!` excludes (e.g. `'!**/fixtures/*.js'`).

```sh
echo 'const   x   =   1' | bunx oxfmt --stdin-filepath test.ts
```

### Exit codes

| Code | When |
| --- | --- |
| **0** | Success (write OK, or `--check` clean) |
| **1** | `--check` found unformatted files |
| **2** | No target files / unmatched pattern (unless `--no-error-on-unmatched-pattern`) |

Missing config still runs defaults and prints a hint (`oxfmt --init`).

## Config discovery

Nearest of: `oxfmt.config.ts`, `oxfmt.config.mts`, `.oxfmtrc.json`, `.oxfmtrc.jsonc`.

- **One config type per directory**.
- `-c` or `--disable-nested-config` changes nested resolution.
- Prefer **`oxfmt.config.ts`** + `defineConfig` for new projects (`defineConfig` is optional but gives types/autocomplete).
- `--init` still writes `.oxfmtrc.json` — for greenfield, write `oxfmt.config.ts` instead (or convert after init).
- JSON schema (when using JSON): `./node_modules/oxfmt/configuration_schema.json`.
- `-c` accepts `.json`, `.jsonc`, `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`.

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  singleQuote: true,
  ignorePatterns: ["dist/**", "coverage/**"],
});
```

Share/compose with normal TS imports (no dedicated `extends` key — spread or merge objects):

```ts
import { defineConfig } from "oxfmt";
import base from "@example/oxfmt-config";

export default defineConfig({
  ...base,
  printWidth: 80,
  overrides: [...(base.overrides ?? [])],
});
```

JSON fallback (existing repos / `--init` output):

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 80,
  "ignorePatterns": ["dist/**", "coverage/**"]
}
```

Node API: `defineConfig`, `format`, `FormatConfig`. `FormatOptions` is a **deprecated** alias of `FormatConfig` (old `experimentalSort*` names also deprecated).

```ts
import { format, type FormatConfig } from "oxfmt";

const options: FormatConfig = { semi: false };
const { code } = await format("a.js", "let a=42;", options);
```

## Core options (Prettier-aligned)

| Option | Default | Notes |
| --- | --- | --- |
| `printWidth` | **100** | Prettier default is 80 — migration footgun. Overrides `.editorconfig.max_line_length` |
| `tabWidth` | `2` | Overrides `.editorconfig.indent_size` (falls back to `tab_width`) |
| `useTabs` | `false` | Overrides `.editorconfig.indent_style` |
| `semi` | `true` | |
| `singleQuote` | `false` | Overrides `.editorconfig.quote_type` |
| `jsxSingleQuote` | `false` | |
| `trailingComma` | `"all"` | `"all" \| "es5" \| "none"` — JS/TS, JSONC/JSON5, TOML, CSS/Less/SCSS, YAML |
| `bracketSpacing` | `true` | |
| `bracketSameLine` | `false` | |
| `arrowParens` | `"always"` | |
| `quoteProps` | `"as-needed"` | `"as-needed" \| "consistent" \| "preserve"` |
| `objectWrap` | `"preserve"` | `"preserve" \| "collapse"` |
| `endOfLine` | `"lf"` | `"lf" \| "crlf" \| "cr"` — `"auto"` **unsupported** |
| `singleAttributePerLine` | `false` | |
| `proseWrap` | `"preserve"` | MD/MDX/YAML |
| `htmlWhitespaceSensitivity` | `"css"` | |
| `vueIndentScriptAndStyle` | `false` | |
| `embeddedLanguageFormatting` | `"auto"` | `"auto" \| "off"` |
| `experimentalOperatorPosition` | `"end"` | `"start" \| "end"` — JS/JSX/TS/TSX wrap operators. Supported since **0.64.0** |
| `insertFinalNewline` | `true` | Oxfmt-specific. Overrides `.editorconfig.insert_final_newline` |
| `ignorePatterns` | `[]` | gitignore syntax, scoped to config dir. `..` and paths outside the config dir are **rejected** |
| `overrides` | `[]` | `files` / `excludeFiles` / `options`. Later override wins |

`experimentalTernaries` remains **unsupported**. `package.json#prettier` is **unsupported**.

## Oxfmt-native extras

| Option | Default | Inspired by |
| --- | --- | --- |
| `sortImports` | off | perfectionist `sort-imports` — `true` or object (`groups`, `customGroups`, …) |
| `sortTailwindcss` | off | `prettier-plugin-tailwindcss` — object: `stylesheet` (v4) / `config` (v3), `functions`, `attributes`, `preserveWhitespace`, `preserveDuplicates` |
| `sortPackageJson` | **on** | prettier-plugin-packagejson (not identical) — `{ sortScripts }` (default `false`) |
| `jsdoc` | off | `prettier-plugin-jsdoc` — `true` or object |
| `svelte` | off | Needs local `svelte` `^5`. `true` resets inherited svelte options |

Sorting / JSDoc / Svelte field details: [languages-sorting-ignores.md](languages-sorting-ignores.md). Editor wiring: [prettier-migration-ci.md](prettier-migration-ci.md#editors).

## Precedence

1. Defaults → 2. Config root → 3. `overrides` → 4. `.editorconfig` for **unset** fields only.

`.editorconfig` maps: `end_of_line`, `indent_style`, `indent_size` (fallback `tab_width`), `max_line_length`, `insert_final_newline`, `quote_type` → `singleQuote`. Nearest file only; `root = true` ignored; nested editorconfigs are **not merged**. Glob sections inside that nearest file are applied.

## Vite+

Prefer `fmt: { ... }` inside `vite.config.ts` instead of a separate `oxfmt.config.ts` / `.oxfmtrc.json`. Vite+ does not apply nested package `fmt` blocks — use `fmt.overrides` on the root config.

Point the editor at that file (`oxc.fmt.configPath`) and set `oxc.fmt.disableNestedConfig: true` so format-on-save uses the root `fmt` block. See https://viteplus.dev/guide/fmt.
