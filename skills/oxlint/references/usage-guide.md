# Oxlint Usage Guide

End-to-end guide for installing, configuring, running, and adopting Oxlint day to day. Prefer `bun` / `bunx` in commands.

Companion docs in this skill:

- [setup-cli-config.md](setup-cli-config.md) — flags, config schema, nested configs, ignores
- [rules-plugins-typeaware.md](rules-plugins-typeaware.md) — categories, plugins, type-aware
- [eslint-ci-editors.md](eslint-ci-editors.md) — ESLint migrate/coexist, editors, CI

Official quickstart: https://oxc.rs/docs/guide/usage/linter/quickstart.html

---

## 1. Greenfield setup (new project)

### Step 1 — Install

```sh
bun add -D oxlint
# optional type-aware:
bun add -D oxlint-tsgolint@latest
```

### Step 2 — Scripts

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

### Step 3 — Init config

```sh
bunx oxlint --init
```

Creates `.oxlintrc.json`. Add the schema and a deliberate baseline:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error"
  },
  "ignorePatterns": ["dist/**", "build/**", "coverage/**", ".output/**"]
}
```

Defaults already enable `correctness` only — keep that until the first clean run succeeds.

### Step 4 — First run

```sh
bun run lint
bun run lint:fix   # apply safe autofixes, then re-run lint
```

### Step 5 — Editor

Install the Oxc extension (`oxc.oxc-vscode` in VS Code / Cursor). Enable format/lint actions if desired:

```json
{
  "recommendations": ["oxc.oxc-vscode"],
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  }
}
```

### Step 6 — CI

```yaml
- run: bun install --frozen-lockfile
- run: bun run lint
```

Optional: `bunx oxlint --deny-warnings` when warnings must fail the job.

---

## 2. Day-to-day commands

| Goal | Command |
| --- | --- |
| Lint whole project | `bunx oxlint` or `bun run lint` |
| Lint one path | `bunx oxlint src/app.ts` |
| Lint a glob | `bunx oxlint 'src/**/*.{ts,tsx}'` |
| Safe autofix | `bunx oxlint --fix` |
| Fixes + suggestions | `bunx oxlint --fix-suggestions` |
| Dangerous + suggestions | `bunx oxlint --fix-dangerously` (review carefully) |
| Fail on warnings | `bunx oxlint --deny-warnings` |
| Cap warnings | `bunx oxlint --max-warnings 0` |
| Quiet (errors only) | `bunx oxlint --quiet` |
| List rules | `bunx oxlint --rules` |
| Print resolved config | `bunx oxlint --print-config` |
| Type-aware | `bunx oxlint --type-aware` |
| GitHub annotations | `bunx oxlint -f github` |
| Agent-friendly output | `bunx oxlint -f agent` |

### Fix modes (important)

1. `--fix` — safe fixes only (default choice).
2. `--fix-suggestions` — may change behavior; review diffs.
3. `--fix-dangerously` — dangerous fixes + suggestions; use rarely and review every change.

Always re-run lint after fixing:

```sh
bunx oxlint --fix && bunx oxlint
```

### Exit codes (practical)

- **0** — no errors (warnings alone still pass unless `--deny-warnings` / `--max-warnings`).
- **non-zero** — lint errors, or warning policy exceeded, or no files matched.

---

## 3. Growing the config (progressive adoption)

Turn knobs in this order so noise stays manageable:

### Phase A — Correctness only (default)

Ship CI with `correctness` errors. Fix or suppress intentionally.

### Phase B — Add plugins for the stack

**Remember:** `"plugins": [...]` **replaces** defaults. Always re-list builtins you still want.

**React + TypeScript app:**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "react", "import", "jsx-a11y"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "settings": {
    "react": { "version": "detect" }
  },
  "ignorePatterns": ["dist/**", "coverage/**"]
}
```

**Next.js:** add `"nextjs"` to `plugins` and set `settings.next.rootDir` in monorepos.

**Vitest tests:**

```json
{
  "overrides": [
    {
      "files": ["**/*.{test,spec}.{ts,tsx}", "**/tests/**"],
      "plugins": ["vitest"],
      "env": { "vitest": true },
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

**Node library:**

```json
{
  "plugins": ["eslint", "typescript", "unicorn", "oxc", "node", "import", "promise"],
  "env": { "node": true }
}
```

### Phase C — Extra categories

Enable one at a time: `suspicious` → `perf` → `pedantic` / `style` / `restriction`. Prefer `warn` first, promote to `error` after cleanup.

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "perf": "warn"
  }
}
```

### Phase D — Type-aware (optional)

```sh
bun add -D oxlint-tsgolint@latest
```

```json
{
  "options": { "typeAware": true },
  "plugins": ["eslint", "typescript", "unicorn", "oxc"],
  "rules": {
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error"
  }
}
```

```sh
bunx oxlint --type-aware
```

Rules of thumb:

- `typeAware` is **root-only**.
- Build monorepo packages so `.d.ts` exist first.
- Do not pass `--tsconfig` together with `--type-aware`.
- Profile slow runs with `--debug timings` / `OXC_LOG=debug`.

---

## 4. Reading and acting on diagnostics

Typical loop for agents and humans:

1. Run `bunx oxlint` (or `-f agent` for concise machine-oriented output).
2. Group by rule id (e.g. `no-unused-vars`, `import/no-cycle`).
3. Prefer **fix code** over disable comments.
4. Use `--fix` when the rule offers a safe fix.
5. If a violation is intentional and local, suppress the smallest scope:

```ts
// oxlint-disable-next-line no-console -- CLI progress output
console.log("done");
```

6. Prefer `oxlint-disable*` over `eslint-disable*` in new code.
7. Clean unused suppressions with `--report-unused-disable-directives`.

### When to change config vs code

| Situation | Prefer |
| --- | --- |
| One-off exception | Inline `oxlint-disable-next-line` |
| Whole test folder | `overrides` for that glob |
| Rule too noisy project-wide | Downgrade to `warn` or `"off"` with a comment in config PR |
| Missing framework coverage | Enable the right plugin (don’t invent disable spam) |

---

## 5. Paths, ignores, and scope

```sh
# only app source
bunx oxlint src/

# exclude generated via config
```

```json
{
  "ignorePatterns": [
    "dist/**",
    "coverage/**",
    "fixtures/**",
    "!fixtures/keep/**"
  ]
}
```

(`!` negation works with gitignore-style patterns — use carefully.)

Also respected: `.gitignore`, and `.eslintignore` during migration. Prefer consolidating into `ignorePatterns`.

---

## 6. Monorepo usage

```
repo/
  .oxlintrc.json          # root: shared categories/options.typeAware
  packages/ui/.oxlintrc.json   # extends root or shared base
  apps/web/.oxlintrc.json
```

Patterns that work:

1. **Root + nested** — each package owns plugins/overrides; `extends` a shared JSON/TS base.
2. **Single root config + overrides** — one file with `files` globs per app.
3. **Type-aware CI job** — build graph → `oxlint --type-aware` from root.

Nested configs do **not** auto-merge. `-c path` disables nested discovery (use only when intentional).

---

## 7. Pairing with Oxfmt

Lint ≠ format. Recommended scripts:

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

Order tip: format first (or on save), then lint — reduces noise from style-looking issues that are really formatting.

See the `oxfmt` skill for formatter depth.

---

## 8. Coming from ESLint

### Incremental (safest)

```sh
bun add -D oxlint eslint-plugin-oxlint
```

```json
{ "scripts": { "lint": "oxlint && eslint ." } }
```

Put `...oxlint.configs["flat/recommended"]` **last** in `eslint.config.js` so overlapping ESLint rules turn off.

### Full migrate

```sh
bunx @oxlint/migrate
# edit .oxlintrc.json, run oxlint, then remove ESLint when ready
```

Keep ESLint only for template lint (Vue/Svelte/Astro) or exotic plugins.

Details: [eslint-ci-editors.md](eslint-ci-editors.md).

---

## 9. Recommended baselines (copy/adapt)

### Minimal library

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": { "correctness": "error" },
  "ignorePatterns": ["dist/**", "coverage/**"]
}
```

### App (React + TS + Vitest)

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": [
    "eslint",
    "typescript",
    "unicorn",
    "oxc",
    "react",
    "import",
    "jsx-a11y"
  ],
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "options": { "typeAware": true },
  "settings": { "react": { "version": "detect" } },
  "ignorePatterns": ["dist/**", "coverage/**"],
  "overrides": [
    {
      "files": ["**/*.{test,spec}.{ts,tsx}"],
      "plugins": ["vitest"],
      "env": { "vitest": true }
    }
  ]
}
```

(Requires `oxlint-tsgolint` when `typeAware` is true.)

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Missing expected rules | `plugins` overwrote defaults | Re-list `eslint`/`typescript`/`unicorn`/`oxc` |
| Nested package ignores root | No `extends` / no merge | Add `extends` or duplicate needed keys |
| Type-aware “can’t find module” | Packages not built | Build dependents; fix tsconfig includes |
| Type-aware slow | Huge program | Narrow `include`; check `--debug timings` |
| CI fails on warnings only | Policy flags | Align local scripts with `--deny-warnings` |
| No files linted (exit 1) | Everything ignored | Fix `ignorePatterns` or use `--no-error-on-unmatched-pattern` |
| Editor disagrees with CLI | Different cwd/config | Open workspace root; ensure local `oxlint` installed |
| Template issues in Vue SFC | Script-only lint | Keep ESLint for templates |

---

## 11. Agent checklist

When asked to “add Oxlint” or “fix lint”:

1. Detect existing ESLint / Biome / Oxlint.
2. Install matching versions; init or migrate config.
3. Start with correctness (+ stack plugins if already expected).
4. Run `oxlint --fix` then `oxlint`; leave a clean or explicitly suppressed result.
5. Wire `package.json` scripts + CI + editor recommendation.
6. Document type-aware separately if enabling it.
7. Do not replace the formatter with Oxlint — point at Oxfmt when formatting is requested.
