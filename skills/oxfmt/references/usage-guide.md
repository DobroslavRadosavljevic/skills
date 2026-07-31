# Oxfmt Usage Guide

End-to-end guide for installing, configuring, running, and adopting Oxfmt day to day. Prefer `bun` / `bunx` in commands.

Companion docs in this skill:

- [setup-cli-config.md](setup-cli-config.md) — CLI flags, options table, editorconfig
- [languages-sorting-ignores.md](languages-sorting-ignores.md) — languages, sorting, ignores
- [prettier-migration-ci.md](prettier-migration-ci.md) — Prettier/Biome migrate, CI, editors

Official quickstart: https://oxc.rs/docs/guide/usage/formatter/quickstart.html

---

## 1. Greenfield setup (new project)

### Step 1 — Install

```sh
bun add -D oxfmt
```

Oxfmt is still **0.x (beta)** — pin via the lockfile.

### Step 2 — Scripts

```json
{
  "scripts": {
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check"
  }
}
```

### Step 3 — Config file

Prefer a TypeScript config with `defineConfig` (do not rely on CLI flags — there are none for semi/quotes/width):

```ts
// oxfmt.config.ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  singleQuote: true,
  semi: true,
  trailingComma: "all",
  ignorePatterns: ["dist/**", "coverage/**", "build/**"],
});
```

`--init` still scaffolds `.oxfmtrc.json` — for new projects write `oxfmt.config.ts` instead (one config type per directory).

**Footgun:** Oxfmt default `printWidth` is **100**. Prettier’s default is **80**. Pick one deliberately.

### Step 4 — First format

```sh
bun run fmt          # write (default)
bun run fmt:check    # verify; exit 1 if drift
```

### Step 5 — Editor

Install `oxc.oxc-vscode` and set it as default formatter:

```json
{
  "recommendations": ["oxc.oxc-vscode"],
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true
}
```

### Step 6 — CI

```yaml
- run: bun install --frozen-lockfile
- run: bun run fmt:check
```

Never use write mode as the only CI gate without review — `--check` is the merge gate.

---

## 2. Day-to-day commands

| Goal | Command |
| --- | --- |
| Format repo (write) | `bunx oxfmt` or `bun run fmt` |
| Format one path | `bunx oxfmt src/app.ts` |
| Format globs | `bunx oxfmt 'src/**/*.{ts,tsx}'` |
| Exclude via CLI | `bunx oxfmt 'src/**' '!**/fixtures/**'` |
| Check only (CI) | `bunx oxfmt --check` |
| List dirty files | `bunx oxfmt --list-different` |
| Stdin format | `echo 'const  x=1' \| bunx oxfmt --stdin-filepath file.ts` |
| Init config | Prefer write `oxfmt.config.ts`; `bunx oxfmt --init` still writes JSON |
| Migrate Prettier | `bunx oxfmt --migrate=prettier` |
| Migrate Biome | `bunx oxfmt --migrate=biome` |
| Explicit config | `bunx oxfmt -c oxfmt.config.ts` |

### Mental model

- **Default = write** (unlike needing `prettier --write`).
- **Check = `--check`** (exit **1** if files would change; exit **2** if no files matched).
- **Style = config file only** — no `--no-semi` / `--single-quote` CLI flags.

Always quote globs in zsh/bash so the shell does not expand them prematurely.

---

## 3. Choosing style options

Start from team Prettier settings if migrating; otherwise pick a small explicit set in `oxfmt.config.ts`:

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: "all",
  arrowParens: "always",
  endOfLine: "lf",
  insertFinalNewline: true,
});
```

### Overrides per glob

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  overrides: [
    {
      files: ["*.md", "*.mdx"],
      options: { printWidth: 100, proseWrap: "always" },
    },
    {
      files: ["*.json"],
      options: { printWidth: 120 },
    },
  ],
});
```

One config **type** per directory — do not mix `.oxfmtrc.json` and `oxfmt.config.ts` in the same folder. JSON remains valid for existing repos / `--init` output.

---

## 4. Sorting extras (batteries included)

These replace common Prettier plugins. Enable only what you want:

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  sortImports: true,
  sortTailwindcss: true,
  sortPackageJson: true,
  jsdoc: false,
});
```

| Option | Default | Notes |
| --- | --- | --- |
| `sortImports` | off | Import order / perfectionist-style |
| `sortTailwindcss` | off | Class sorting like prettier-plugin-tailwindcss |
| `sortPackageJson` | **on** | First run often rewrites `package.json` — disable if undesired |
| `jsdoc` | off | JSDoc formatting |
| `svelte` | off | Requires local `svelte` package |

Adoption tip: enable sorting in a **dedicated PR** after the base format migration so diffs stay reviewable.

---

## 5. Ignores and skip comments

### Config ignores (preferred)

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [
    "dist/**",
    "coverage/**",
    "**/*.min.js",
    "fixtures/raw/**",
  ],
});
```

### Still supported

- `.prettierignore`
- `--ignore-path`
- `.gitignore` (explicit path args can still force-format)

### Inline

```ts
// oxfmt-ignore
const keep = {a:1,b:2};

const also = { a: 1 }; // oxfmt-ignore
```

Use `prettier-ignore` for many non-JS regions / Vue template & style blocks. TOML has no ignore comments.

---

## 6. Languages — what to expect

**Native (fast):** JS/TS/JSX/TSX, JSON family, CSS/SCSS/Less, GraphQL, TOML.

**Still Prettier-backed or partial:** HTML/Angular, Vue (scripts native), Svelte (opt-in), Markdown/MDX, YAML (verify current version), Handlebars.

**Often blocked today:** Astro (needs Prettier plugins), some XML/SVG (planned ~1.0).

Before promising full-repo format for a framework, check [language support](https://oxc.rs/docs/guide/usage/formatter/language-support.html) and [compatibility](https://oxc.rs/compatibility.html).

---

## 7. Day-to-day workflows

### Local development

1. Format on save via Oxc extension **or** run `bun run fmt` before commit.
2. Optionally lint-staged:

```json
{
  "lint-staged": {
    "*": "oxfmt --no-error-on-unmatched-pattern"
  }
}
```

### Before opening a PR

```sh
bun run fmt
bun run fmt:check
```

### CI

```sh
bun run fmt:check
```

If check fails: run `bun run fmt`, commit, push. Do not “fix” by disabling the gate.

### Stdin / editor non-LSP

```sh
bunx oxfmt --stdin-filepath path/to/file.tsx < file.tsx
```

---

## 8. Monorepo usage

**Option A — nested configs**

```
oxfmt.config.ts                 # repo default
apps/web/oxfmt.config.ts
packages/ui/oxfmt.config.ts
```

Nearest config wins.

**Option B — one root + overrides**

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  overrides: [
    {
      files: ["apps/docs/**"],
      options: { printWidth: 100 },
    },
  ],
});
```

**Option C — Vite+**

Put `fmt: { ... }` in `vite.config.ts`; avoid a second `oxfmt.config.ts` / `.oxfmtrc.json` unless you know both are wired correctly.

Use `--disable-nested-config` when a single root config should apply everywhere for speed/consistency.

---

## 9. Pairing with Oxlint

```json
{
  "scripts": {
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "check": "oxfmt --check && oxlint"
  }
}
```

| Concern | Tool |
| --- | --- |
| Spaces, wraps, quotes, import/class sort | **Oxfmt** |
| Bugs, correctness, a11y, import cycles, type-aware | **Oxlint** |

Remove `eslint-plugin-prettier`. Keep `eslint-config-prettier` only while ESLint remains.

---

## 10. Migrating from Prettier (full path)

```sh
bun add -D oxfmt@latest
bunx oxfmt --migrate=prettier
```

Then:

1. Open the migrated config (often `.oxfmtrc.json`) — prefer converting to `oxfmt.config.ts` + `defineConfig`; set `printWidth: 80` if you want Prettier-like wrapping.
2. Decide sorting extras (`sortPackageJson` is already on).
3. `bunx oxfmt` once; commit as “format with oxfmt”.
4. Add blame-ignore if the repo uses `.git-blame-ignore-revs`.
5. Swap scripts to `oxfmt` / `oxfmt --check`.
6. Point the editor at Oxc; remove Prettier format-on-save.
7. Uninstall `prettier` and plugins when clean.
8. Update CI from `prettier --check` → `oxfmt --check`.

Official migrate path: `bunx oxfmt --migrate=prettier` (see https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html).

Details: [prettier-migration-ci.md](prettier-migration-ci.md).

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Huge wrap diffs vs Prettier | `printWidth` 100 vs 80 | Set `printWidth: 80` |
| `package.json` reshuffled | `sortPackageJson` default on | Set `false` or accept in format PR |
| CLI flags like `--single-quote` fail | Not supported | Put options in config |
| Check exit 2 | No files matched | Fix globs/ignores or `--no-error-on-unmatched-pattern` |
| Editor ≠ CLI | Wrong formatter / config path | Set `oxc.oxc-vscode`; open correct root |
| Astro/plugin files untouched or wrong | Plugins unsupported | Stay on Prettier for those paths or wait for support |
| Nested ignore surprise | `ignorePatterns` scoped to config | Prefer root patterns or keep `.prettierignore` during migrate |
| Svelte not formatting | Option off / no `svelte` pkg | `"svelte": true` + install `svelte` |
| Warn “No config found” | Missing init | `oxfmt --init` (still runs defaults without it) |

---

## 12. Agent checklist

When asked to “add Oxfmt” or “format the repo”:

1. Detect Prettier / Biome / Oxfmt / Vite+ `fmt`.
2. Install `oxfmt`; write `oxfmt.config.ts` (or `--migrate`, then convert JSON → TS if desired).
3. Lock `printWidth` and quote/semi to team intent.
4. Call out `sortPackageJson` default before first write.
5. Run `oxfmt`, then `oxfmt --check`.
6. Wire scripts, lint-staged, CI `--check`, editor default formatter.
7. Do not leave Prettier and Oxfmt both formatting the same files.
8. For lint rules / correctness, use a dedicated linter (for example Oxlint or ESLint) — not Oxfmt.
