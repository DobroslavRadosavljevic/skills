# Source Map

This reference captures the Oxfmt docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-31
- Official site: https://oxc.rs/
- Formatter docs: https://oxc.rs/docs/guide/usage/formatter.html
- npm `oxfmt`: **0.61.0** (dist-tag `latest`; still **0.x / beta** toward 1.0)
- Node engines: `^20.19.0 || >=22.12.0`
- Bin: `oxfmt`
- Preferred config: **`oxfmt.config.ts`** + `defineConfig` (JSON `.oxfmtrc.json(c)` still supported; `--init` / `--migrate` often write JSON)
- Context7 IDs: `/websites/oxc_rs`, `/oxc-project/oxc`, `/oxc-project/website`, `/websites/viteplus_dev_guide` (Vite+ wraps Oxfmt)

Maturity trail: alpha (2025-12) → beta (2026-02, 100% Prettier JS/TS conformance tests). Plugins unsupported until later; some languages still Prettier-backed.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check registry metadata:

   ```sh
   bun info oxfmt
   bunx oxfmt --version
   ```

3. Prefer official pages under https://oxc.rs/docs/guide/usage/formatter/. If docs and package metadata disagree, report the mismatch.
4. Re-check [language support](https://oxc.rs/docs/guide/usage/formatter/language-support.html) when asking whether a format is native vs Prettier-backed.
5. Pin `oxfmt` in lockfiles — 0.x minors move quickly.

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
- Compatibility: https://oxc.rs/compatibility.html
- Alpha blog: https://oxc.rs/blog/2025-12-01-oxfmt-alpha.html
- Beta blog: https://oxc.rs/blog/2026-02-24-oxfmt-beta.html
- Playground: https://playground.oxc.rs/
- npm: https://www.npmjs.com/package/oxfmt
- GitHub: https://github.com/oxc-project/oxc
- Migrate from Prettier: https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html
- Vite+ fmt: https://viteplus.dev/guide/fmt
- Schema: `node_modules/oxfmt/configuration_schema.json`
