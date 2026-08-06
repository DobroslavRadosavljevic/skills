# Prettier Migration, Coexistence, and CI

## Migrate from Prettier

```sh
bun add -D oxfmt@latest
bunx oxfmt --migrate=prettier
bunx oxfmt
```

Official migrate docs: https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html

| Prettier | Oxfmt |
| --- | --- |
| `prettier --write .` | `oxfmt` |
| `prettier --check .` | `oxfmt --check` |
| `.prettierrc*` | Prefer `oxfmt.config.ts`; `--migrate prettier` may write `.oxfmtrc.json(c)` — convert to TS if desired |
| `.prettierignore` | Still works; prefer `ignorePatterns` |
| Plugins | **Unsupported** — use built-in sorting / extras |
| `package.json#prettier` | **Unsupported** |
| `experimentalTernaries` / `experimentalOperatorPosition` | **Unsupported** |
| Default width 80 | Default **100** — set `printWidth: 80` to minimize diff |
| `eslint-plugin-prettier` | Remove; use `oxfmt --check` in CI |
| `eslint-config-prettier` | Keep if ESLint stays |

Also update: editor default formatter, CONTRIBUTING/AGENTS docs, `.git-blame-ignore-revs` for mass reformat commits.

Docs: https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html

## Migrate from Biome

```sh
bunx oxfmt --migrate=biome
```

Pick **one** formatter — do not leave Biome format + Oxfmt both active.

## Coexistence

| Tool | Guidance |
| --- | --- |
| **Oxlint** | Complementary. Same Oxc editor/LSP family. Common pair. |
| **ESLint** | Drop `eslint-plugin-prettier`; keep `eslint-config-prettier` if needed; consider Oxlint migration |
| **Prettier** | Replace; don’t run both |
| **Biome** | One formatter; migrate or stay |
| **Vite+** | `vp fmt` / `vp check`; config in `vite.config.ts` `fmt` block |

## Editors

Local `oxfmt` (and `oxlint` if using fix-on-save) required. LSP: `oxfmt --lsp` / `oxlint --lsp`.

- VS Code / Cursor: `oxc.oxc-vscode`
- Also: Zed, JetBrains, Neovim (conform / lspconfig / coc-oxc)

Docs: https://oxc.rs/docs/guide/usage/formatter/editors.html · https://oxc.rs/docs/guide/usage/linter/editors.html

### Team files

`.vscode/extensions.json`:

```json
{
  "recommendations": ["oxc.oxc-vscode"]
}
```

`.vscode/settings.json` — format, sort imports (via Oxfmt), remove unused (via Oxlint):

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always",
    "source.organizeImports": "never",
    "source.removeUnusedImports": "never"
  },
  "[javascript]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "oxc.enable.oxfmt": true,
  "oxc.enable.oxlint": true
}
```

| Goal | Who does it | How |
| --- | --- | --- |
| Format + wrap + quotes | **Oxfmt** | `editor.formatOnSave` + default formatter `oxc.oxc-vscode` |
| Sort imports | **Oxfmt** | `sortImports` in `oxfmt.config.ts` (runs on format) |
| Sort Tailwind classes | **Oxfmt** | `sortTailwindcss` in config (runs on format) |
| Remove unused imports / vars | **Oxlint** | `source.fixAll.oxc` + `no-unused-vars` fix options |
| Organize imports (TS built-in) | **Off** | Keep `source.organizeImports` / `source.removeUnusedImports` **never** — they fight Oxfmt/Oxlint |

### Oxfmt config side (required for sort-on-save)

```ts
// oxfmt.config.ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  sortImports: true,
  sortTailwindcss: {
    stylesheet: "./src/index.css", // v4; or `config` for v3
    functions: ["clsx", "cn", "cva", "tv"],
  },
});
```

### Oxlint config side (required for remove-unused-on-save)

`no-unused-vars` is on by default. For save-time **import** cleanup, enable import auto-fixes (experimental):

```ts
// oxlint.config.ts
import { defineConfig } from "oxlint";

export default defineConfig({
  rules: {
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        fix: {
          imports: "safe-fix", // remove unused imports via source.fixAll.oxc
          variables: "suggestion", // keep vars as suggestions unless you want aggressive delete
        },
      },
    ],
  },
});
```

Optional editor knobs:

| Setting | When |
| --- | --- |
| `oxc.fmt.configPath` | Non-root / Vite+ `fmt` config; monorepo path to `oxfmt.config.ts` |
| `oxc.fmt.disableNestedConfig` | Force a single fmt config |
| `oxc.configPath` / `oxc.disableNestedConfig` | Same for Oxlint |
| `oxc.fixKind` | Widen/narrow which fixes `source.fixAll.oxc` applies (`safe_fix` default family) |
| `oxc.typeAware` | Type-aware lint in the editor (needs `oxlint-tsgolint`) |
| `tailwindCSS.classAttributes` / `tailwindCSS.classFunctions` | IntelliSense only — mirror Oxfmt `sortTailwindcss.attributes` / `functions`; Oxfmt does not read these |

### Anti-patterns

- Do not leave Prettier / Biome as default formatter for the same languages.
- Do not enable ESLint `source.fixAll.eslint` for format/import-sort if Oxc already owns those jobs.
- Do not expect `source.organizeImports` to apply Oxfmt’s `sortImports` groups — format-on-save is the path.
- After installing `oxfmt` / `oxlint` while the editor is open: reload the window so the extension picks up local binaries.

## CI and hooks

```json
{
  "scripts": {
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check"
  },
  "lint-staged": {
    "*": "oxfmt --no-error-on-unmatched-pattern"
  }
}
```

```yaml
- run: bun install --frozen-lockfile
- run: bun run fmt:check
```

Optional autofix bots (e.g. autofix.ci) can run `oxfmt` write on PRs — keep `--check` as the merge gate.

Docs: https://oxc.rs/docs/guide/usage/formatter/ci.html

## Migration checklist

1. Install `oxfmt`; run `--migrate prettier` (or biome). Prefer converting the result to `oxfmt.config.ts` + `defineConfig`.
2. Set `printWidth` intentionally (80 vs 100).
3. Decide sorting extras (`sortImports`, Tailwind `stylesheet`/`config`/`functions`, `sortPackageJson`).
4. Point editors at Oxc formatter; add the full `.vscode/settings.json` recipe (format-on-save + `source.fixAll.oxc`; disable TS organize/remove-unused imports).
5. Swap scripts to `oxfmt` / `oxfmt --check`.
6. Remove Prettier deps/plugins (including `prettier-plugin-tailwindcss`) when clean.
7. Commit mass reformat separately; add blame-ignore if the repo uses it.

## When to stay on Prettier

- Required Prettier plugins Oxfmt cannot replace yet (e.g. some Astro setups)
- Exact plugin behavior that built-in sorting does not cover
- Team policy to wait for Oxfmt 1.0 / plugin support
