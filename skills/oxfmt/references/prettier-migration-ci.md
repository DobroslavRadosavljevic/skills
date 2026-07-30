# Prettier Migration, Coexistence, and CI

## Migrate from Prettier

```sh
bun add -D oxfmt@latest
bunx oxfmt --migrate=prettier
bunx oxfmt
```

Official agent skill: `bunx skills add https://github.com/oxc-project/oxc --skill migrate-oxfmt`.

| Prettier | Oxfmt |
| --- | --- |
| `prettier --write .` | `oxfmt` |
| `prettier --check .` | `oxfmt --check` |
| `.prettierrc*` | `.oxfmtrc.json(c)` / `oxfmt.config.ts` via `--migrate prettier` |
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

Local `oxfmt` required. LSP: `oxfmt --lsp`.

- VS Code / Cursor: `oxc.oxc-vscode`; set `editor.defaultFormatter` to `oxc.oxc-vscode`
- Also: Zed, JetBrains, Neovim (conform / lspconfig / coc-oxc)

```json
{
  "recommendations": ["oxc.oxc-vscode"],
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true
}
```

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

1. Install `oxfmt`; run `--migrate prettier` (or biome).
2. Set `printWidth` intentionally (80 vs 100).
3. Decide sorting extras (`sortImports`, Tailwind, `sortPackageJson`).
4. Point editors at Oxc formatter; remove Prettier format-on-save.
5. Swap scripts to `oxfmt` / `oxfmt --check`.
6. Remove Prettier deps/plugins when clean.
7. Commit mass reformat separately; add blame-ignore if the repo uses it.

## When to stay on Prettier

- Required Prettier plugins Oxfmt cannot replace yet (e.g. some Astro setups)
- Exact plugin behavior that built-in sorting does not cover
- Team policy to wait for Oxfmt 1.0 / plugin support
