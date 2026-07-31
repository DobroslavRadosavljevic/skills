# Setup, CLI, and Config

## Install

```sh
bun add -D oxfmt
```

```json
{
  "scripts": {
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check"
  }
}
```

One-off: `bunx oxfmt --help`.

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

Node API also exports `format`, `defineConfig`, and `FormatOptions`.

## Core options (Prettier-aligned)

| Option | Default | Notes |
| --- | --- | --- |
| `printWidth` | **100** | Prettier default is 80 — migration footgun |
| `tabWidth` | `2` | |
| `useTabs` | `false` | |
| `semi` | `true` | |
| `singleQuote` | `false` | |
| `jsxSingleQuote` | `false` | |
| `trailingComma` | `"all"` | `"all" \| "es5" \| "none"` |
| `bracketSpacing` | `true` | |
| `bracketSameLine` | `false` | |
| `arrowParens` | `"always"` | |
| `quoteProps` | `"as-needed"` | |
| `objectWrap` | `"preserve"` | |
| `endOfLine` | `"lf"` | `"auto"` **unsupported** |
| `singleAttributePerLine` | `false` | |
| `proseWrap` | `"preserve"` | MD/MDX/YAML |
| `htmlWhitespaceSensitivity` | `"css"` | |
| `vueIndentScriptAndStyle` | `false` | |
| `embeddedLanguageFormatting` | `"auto"` | `"auto" \| "off"` |
| `insertFinalNewline` | `true` | Oxfmt-specific |
| `ignorePatterns` | `[]` | gitignore syntax, scoped to config dir |
| `overrides` | `[]` | `files` / `excludeFiles` / `options` |

## Oxfmt-native extras

| Option | Default | Inspired by |
| --- | --- | --- |
| `sortImports` | off | perfectionist `sort-imports` |
| `sortTailwindcss` | off | `prettier-plugin-tailwindcss` |
| `sortPackageJson` | **on** | prettier-plugin-packagejson (not identical) |
| `jsdoc` | off | `prettier-plugin-jsdoc` |
| `svelte` | off | Needs local `svelte` package |

## Precedence

1. Defaults → 2. Config root → 3. `overrides` → 4. `.editorconfig` for **unset** fields only.

`.editorconfig` maps: `end_of_line`, `indent_style`, `indent_size`, `max_line_length`, `insert_final_newline`. Nearest file only; `root = true` ignored; nested editorconfigs are **not merged**.

## Vite+

Prefer `fmt: { ... }` inside `vite.config.ts` instead of a separate `oxfmt.config.ts` / `.oxfmtrc.json`. Point the editor at that file when needed (`oxc.fmt.configPath`).
