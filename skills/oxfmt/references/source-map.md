# Source Map

This reference captures the Oxfmt docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-10-01
- Official site: https://oxc.rs/
- Formatter docs: https://oxc.rs/docs/guide/usage/formatter.html
- npm `oxfmt`: **0.71.0** (dist-tag `latest`, published 2026-09-28; still **0.x / beta** toward 1.0 — no 1.x line)
- Previous skill snapshots: **0.68.0** (2026-09-18), **0.62.0** (2026-08-06)
- Bundled Prettier (for Prettier-backed languages): **3.9.9** (since 0.71.0)
- Vite+ **1.0.0** (2026-09-28) pins `oxfmt` **0.70.0** — `vp fmt` users may trail npm `latest`
- Node engines: `^20.19.0 || >=22.12.0`
- Bin: `oxfmt`
- Optional peers: `svelte` `^5.0.0`, `vite-plus` `*`
- Preferred config: **`oxfmt.config.ts`** + `defineConfig` (JSON `.oxfmtrc.json(c)` still supported; `--init` / `--migrate` still write JSON)
- Node API: `defineConfig`, `format`, `FormatConfig` (`FormatOptions` is a deprecated alias)
- Schema: `node_modules/oxfmt/configuration_schema.json`
- Context7 IDs: `/websites/oxc_rs`, `/oxc-project/oxc`, `/oxc-project/website`, `/websites/viteplus_dev_guide` (Vite+ wraps Oxfmt)

Maturity trail: alpha (2025-12) → beta (2026-02, 100% Prettier JS/TS conformance tests). Plugins unsupported until later; HTML/Markdown-family languages still Prettier-backed.

## 0.63.0–0.68.0 (user-facing)

| Version | Date | What agents should know |
| --- | --- | --- |
| **0.63.0** | 2026-08-10 | YAML-in-CSS frontmatter dispatched to native YAML formatter. JSDoc fenced examples use the effective print width. |
| **0.64.0** | 2026-08-18 | **`experimentalOperatorPosition`** (`"start" \| "end"`, default `"end"`). `.gitignore` applies to walk/dir targets only — **explicit files** can still be formatted. |
| **0.65.0** | 2026-08-24 | Suppress-comment class-decorator placement (keep decorators before `export`). Present on GitHub Releases; missing from `apps/oxfmt/CHANGELOG.md`. |
| **0.66.0** | 2026-08-31 | Native CSS formats PostCSS nested config blocks. `sortImports` custom side-effect groups. YAML keeps trailing whitespace in block scalars. |
| **0.67.0** | 2026-09-07 | Bundled `prettier-plugin-tailwindcss` bump. JSDoc-cast layout fixes. GitHub release also lists **crate-level** parser BREAKING (`MAX_LEN`); oxfmt npm **config keys were not renamed**. |
| **0.68.0** | 2026-09-14 | Unified suppress-comment behavior (incl. trailing enum-member comments). YAML `tabWidth: 0` clamped to `1`. TSX-in-Vue `Fill` expansion. Skip Node 24 shutdown delay on fixed Node 24 releases. |

## 0.69.0–0.71.0 (user-facing)

| Version | Date | What agents should know |
| --- | --- | --- |
| **0.69.0** | 2026-09-21 | Vite+ mode finds every `vite.config.*` variant (`.js`, `.mjs`, `.mts`, …), so the LSP no longer needs `configPath` for non-`.ts` Vite configs. A native Rust **Markdown formatter crate** landed upstream but is **not wired into Oxfmt yet** — Markdown stays Prettier-backed. Comment-placement fixes. |
| **0.70.0** | 2026-09-21 | Vite+ mode **never discovers nested configs** (CLI and LSP) — editors no longer need `oxc.fmt.disableNestedConfig` for Vite+. |
| **0.71.0** | 2026-09-28 | Bundled Prettier bumped to **3.9.9** (HTML/Markdown/Vue/… output may shift). Repeated CLI calls in one process work. JSDoc alignment closer to `prettier-plugin-jsdoc`; `/***` comments treated as JSDoc. Comments around `=` stay on their side. |

CLI flags did **not** change from 0.63 through 0.71 (`--write` default, `--check`, `--list-different`, `--init`, `--migrate`, `--lsp`, `--stdin-filepath`, `-c`/`--config`, `--disable-nested-config`, `--ignore-path`, `--with-node-modules`, `--no-error-on-unmatched-pattern`, `--threads`).

YAML is **native** (landed 0.62; language-support page lists it). HTML/Vue/Svelte/Markdown/MDX/Handlebars/MJML remain Prettier-backed (native Markdown is in progress; re-check the language-support page).

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check registry metadata:

   ```sh
   bun info oxfmt
   bunx oxfmt --version
   bunx oxfmt --help
   ```

3. Prefer official pages under https://oxc.rs/docs/guide/usage/formatter/. If docs and package metadata disagree, report the mismatch.
4. Re-check [language support](https://oxc.rs/docs/guide/usage/formatter/language-support.html) when asking whether a format is native vs Prettier-backed.
5. Cross-check changelog sources — they diverge:
   - GitHub Releases: https://github.com/oxc-project/oxc/releases (tags `oxfmt_v0.71.0` since 0.70; combined `apps_v1.84.0` and older)
   - `apps/oxfmt/CHANGELOG.md`
   - `npm/oxfmt/CHANGELOG.md` (thinner; often omits formatter-crate fixes)
6. Pin `oxfmt` in lockfiles — 0.x minors move quickly.

## In-skill usage guide

- Full how-to / workflows / troubleshooting: [usage-guide.md](usage-guide.md)

## Official Pages

- Overview: https://oxc.rs/docs/guide/usage/formatter.html
- Quickstart: https://oxc.rs/docs/guide/usage/formatter/quickstart.html
- CLI: https://oxc.rs/docs/guide/usage/formatter/cli.html
- Config: https://oxc.rs/docs/guide/usage/formatter/config.html
- Config file reference: https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html
- Ignore files: https://oxc.rs/docs/guide/usage/formatter/ignore-files.html
- Ignore comments: https://oxc.rs/docs/guide/usage/formatter/ignore-comments.html
- Sorting: https://oxc.rs/docs/guide/usage/formatter/sorting.html
- Embedded formatting: https://oxc.rs/docs/guide/usage/formatter/embedded-formatting.html
- Unsupported features: https://oxc.rs/docs/guide/usage/formatter/unsupported-features.html
- Language support: https://oxc.rs/docs/guide/usage/formatter/language-support.html
- Migrate from Prettier: https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html
- CI: https://oxc.rs/docs/guide/usage/formatter/ci.html
- Editors: https://oxc.rs/docs/guide/usage/formatter/editors.html
- Coding agents: https://oxc.rs/docs/guide/usage/coding-agents.html
- Compatibility: https://oxc.rs/compatibility.html
- Alpha blog: https://oxc.rs/blog/2025-12-01-oxfmt-alpha.html
- Beta blog: https://oxc.rs/blog/2026-02-24-oxfmt-beta.html
- Playground: https://playground.oxc.rs/
- npm: https://www.npmjs.com/package/oxfmt
- GitHub: https://github.com/oxc-project/oxc
- Changelog (app): https://github.com/oxc-project/oxc/blob/main/apps/oxfmt/CHANGELOG.md
- VS Code extension: https://github.com/oxc-project/oxc-vscode
- Vite+ fmt: https://viteplus.dev/guide/fmt
- Vite+ fmt config: https://viteplus.dev/config/fmt
- Schema: `node_modules/oxfmt/configuration_schema.json`
