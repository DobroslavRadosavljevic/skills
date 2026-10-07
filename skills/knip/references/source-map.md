# Source Map

Snapshot of the sources used to build this skill, and how to refresh it.

## Snapshot

- Captured: 2026-10-07
- npm `knip`: **6.40.0** (published 2026-10-06), `latest` dist-tag
- Node engines: `^20.19.0 || >=22.12.0` (`engineStrict`); Bun via `knip-bun`
- No `peerDependencies` in 6.x
- Package exports: `knip` (types), `knip/config` (`defineConfig`), `knip/session` (semi-internal)
- Binaries: `knip`, `knip-bun`
- Plugins: 190 (`scripts/list-plugins.mjs --all`)
- Schema: `https://unpkg.com/knip@6/schema.json`, JSONC: `https://unpkg.com/knip@6/schema-jsonc.json`
- Related packages: `@knip/mcp` 0.0.36, `@knip/create-config` 1.2.4, `@knip/language-server` 3.1.x, VS Code `webpro.vscode-knip` 2.3.x
- GitHub Actions majors at capture: `actions/checkout@v7`, `actions/setup-node@v7`, `oven-sh/setup-bun@v2`

Verified by running knip 6.40.0 on fixtures: default vs production entries, the `!`-duplicate entry pitfall, config hints (`ignore*`, `entry-top-level`, `entry-empty`, `project-extension-unregistered`), `--strict` unlisted detection, `includeEntryExports` on internal packages, tags (`@public`, `@internal`, `-lintignore`), `ignoreExportsUsedInFile`, `--fix` behavior, exit codes 0/1/2, v5 leftover errors.

Known docs-vs-code differences at capture (code wins):

- Getting Started still lists `typescript` and `@types/node` as peer dependencies; 6.x has none.
- `schema.json` omits `namespace` from `ignoreExportsUsedInFile` keys; the runtime schema accepts it.
- `schema.json` default text for `entry` is simplified; real defaults are `{index,cli,main}` + `src/` variants with `!`.
- Docs list fewer configuration hint types than the code (`ignore`, `ignoreFiles`, extension hints are missing there).
- `--help` and `cli.md` say `--exports` includes `nsExports`/`nsTypes`; the source shorthand is `exports,types,enumMembers,namespaceMembers,duplicates`. Add `--include nsExports,nsTypes` explicitly when needed.

## Refresh procedure

1. `bun info knip` (version, engines, exports). Compare with the snapshot.
2. `bunx knip --help` in a project with the new version; diff flags, issue types, reporters against [cli-and-reporters.md](cli-and-reporters.md).
3. `node scripts/list-plugins.mjs <project> --all` to regenerate the plugin table in [plugins.md](plugins.md).
4. Read the GitHub releases since the snapshot: https://github.com/webpro-nl/knip/releases (tags `knip@x.y.z`). Update [migration.md](migration.md#notable-6x-changes).
5. Docs source: https://github.com/webpro-nl/knip/tree/main/packages/docs/src/content/docs (or Context7 `/websites/knip_dev`).
6. If docs and package behavior disagree, trust a run of the installed binary and note the mismatch here.

## Official pages

- Home: https://knip.dev
- Getting started: https://knip.dev/overview/getting-started
- Configuration: https://knip.dev/overview/configuration
- Configuration reference: https://knip.dev/reference/configuration
- Dynamic configuration: https://knip.dev/reference/dynamic-configuration
- CLI: https://knip.dev/reference/cli
- Configuration hints: https://knip.dev/reference/configuration-hints
- Issue types: https://knip.dev/reference/issue-types
- JSDoc/TSDoc tags: https://knip.dev/reference/jsdoc-tsdoc-tags
- Plugins list: https://knip.dev/reference/plugins
- Known issues: https://knip.dev/reference/known-issues
- FAQ: https://knip.dev/reference/faq
- Integrations (editor, MCP, LSP): https://knip.dev/reference/integrations
- How Knip works: https://knip.dev/explanations/how-knip-works
- Entry files: https://knip.dev/explanations/entry-files
- Plugins: https://knip.dev/explanations/plugins
- Comparison and migration: https://knip.dev/explanations/comparison-and-migration
- Configuring project files: https://knip.dev/guides/configuring-project-files
- Handling issues: https://knip.dev/guides/handling-issues
- Adopt gradually: https://knip.dev/guides/adopt-gradually
- Using Knip in CI: https://knip.dev/guides/using-knip-in-ci
- Troubleshooting: https://knip.dev/guides/troubleshooting
- Performance: https://knip.dev/guides/performance
- Namespace imports: https://knip.dev/guides/namespace-imports
- CommonJS: https://knip.dev/guides/working-with-commonjs
- Production mode: https://knip.dev/features/production-mode
- Monorepos and workspaces: https://knip.dev/features/monorepos-and-workspaces
- Integrated monorepos: https://knip.dev/features/integrated-monorepos
- Rules and filters: https://knip.dev/features/rules-and-filters
- Auto-fix: https://knip.dev/features/auto-fix
- Reporters: https://knip.dev/features/reporters
- Compilers: https://knip.dev/features/compilers
- Script parser: https://knip.dev/features/script-parser
- Source mapping: https://knip.dev/features/source-mapping
- Catalogs: https://knip.dev/features/catalogs
- Knip v6 announcement: https://knip.dev/blog/knip-v6
- Writing a plugin: https://knip.dev/writing-a-plugin
