# CI, Hooks, Editors, Agents, Performance, Troubleshooting

## Contents

- [CI gate](#ci-gate)
- [Gradual adoption](#gradual-adoption)
- [Caching](#caching)
- [Pre-commit and pre-push](#pre-commit-and-pre-push)
- [Editor extension, language server, MCP](#editor-extension-language-server-mcp)
- [Programmatic API](#programmatic-api)
- [Performance](#performance)
- [Troubleshooting load errors](#troubleshooting-load-errors)

## CI gate

The enforced gate runs **two** Knip passes on every pull request and on the default branch:

```json
{
  "scripts": {
    "knip": "knip",
    "knip:production": "knip --production"
  }
}
```

Add `--strict` to `knip:production` for libraries and monorepos with published packages.

Requirements:

- Exit code on (no `--no-exit-code`), `--max-issues` at its default `0`.
- `treatConfigHintsAsErrors: true` in config (or `--treat-config-hints-as-errors`), so stale ignores and dead patterns fail.
- Full install before Knip (`--frozen-lockfile` / `ci`). Knip resolves installed packages and binaries; a partial install produces false `unlisted`/`binaries`.
- Codegen and builds that Knip depends on (route trees, API clients, `dist` for source mapping of workspace packages) run before Knip.
- Exit code 2 fails the job. Never mask it.
- Annotate PRs with `--reporter github-actions` (keep `symbols` for the log). GitLab: `--reporter codeclimate` as a code-quality artifact. Code scanning: `--reporter sarif > knip.sarif` + `github/codeql-action/upload-sarif`.

Template: [../assets/knip.workflow.yml](../assets/knip.workflow.yml). It runs the production pass even if the default pass fails (`if: ${{ !cancelled() }}`), so one CI run shows both reports.

Other CI systems: run the same two scripts as separate steps after install. `--no-progress` is automatic when `CI` is set.

Turborepo/Nx: Knip analyzes the whole repo at once. Run it as a root task (`//#knip` in Turborepo) instead of one task per package; per-package runs repeat the graph work and lose cross-workspace usage.

## Gradual adoption

For a codebase with a big backlog, gate what is clean and ratchet the rest. Never ship the final state with these knobs left on.

1. Make the config correct first: zero exit-2 errors, zero configuration hints, no false positives in a sample of each issue type.
2. Put not-yet-clean types on `warn`:

   ```json
   { "rules": { "exports": "warn", "types": "warn", "enumMembers": "warn", "duplicates": "warn" } }
   ```

3. Gate in CI immediately (types on `error` already fail).
4. Clean one type at a time (`knip --exports`), then flip it to `error` in the same PR.
5. Alternatives when `warn` is too coarse: gate `--production` first; gate one `--workspace` at a time; a temporary `--max-issues N` budget lowered each sprint. `--no-exit-code` is for report-only jobs, never the required check.
6. Done when `rules` has no `warn`/`off` for core types and CI runs plain `knip` + `knip --production`.

## Caching

- `--cache` stores per-file analysis in `node_modules/.cache/knip` (`--cache-location` to move). Keyed on file mtime and size. 10–40% faster reruns.
- Stale results are possible after config or alias changes, or a newly added `.gitignore`. Fix: run without `--cache` or delete the cache directory.
- Use `--cache` locally and in hooks. In the required CI gate, either skip it or key a persisted cache on lockfile + Knip config hash. There is no official guidance for persisting it across CI runs.

## Pre-commit and pre-push

Knip needs the whole module graph; it cannot check only staged files. Options:

- `pre-push` hook (lefthook, husky, simple-git-hooks) running `knip --cache --reporter compact`. Good for small and medium repos.
- Leave it to CI for large repos.
- Never put `--fix` in a hook.

Knip's own plugins read hook configs (husky, lefthook, lint-staged, pre-commit, simple-git-hooks, nano-staged), so binaries used there are attributed correctly.

## Editor extension, language server, MCP

- **VS Code / Open VSX extension** `webpro.vscode-knip` (JetBrains: community plugin). Uses the project's local `node_modules/knip`. Gives diagnostics, hover with import/usage locations, Imports/Exports tree views, quick fixes, and a built-in MCP server. Useful settings: `knip.configFilePath`, `knip.cwd`, `knip.editor.severity`, `knip.requireConfig`. Without a Knip config file, the editor uses `--use-tsconfig-files` behavior.
- **Language server**: `@knip/language-server` (`--stdio` default; `--node-ipc`, `--socket`, `--pipe`).
- **MCP server**: `@knip/mcp` (pre-1.0). Config for MCP clients:

  ```json
  { "mcpServers": { "knip": { "command": "bunx", "args": ["@knip/mcp"] } } }
  ```

  Tools: `knip-run` (returns hints, counters, capped issue lists, enabled plugins, config file info) and `knip-docs`; prompt `knip-configure`; docs as `knip://docs/{topic}` resources. When an agent harness has it, use `knip-run` for the configure loop; otherwise use the CLI with `--reporter json` or `--reporter compact`. Same result either way.
- **Initializer**: `bun create @knip/config` (or `npm init @knip/config`). Installs `knip typescript @types/node`, writes `knip.json` with `$schema` and `"tags": ["-lintignore"]`, adds a `knip` script. Fine as a starting point; the enforced setup then adds `knip:production`, CI, and `treatConfigHintsAsErrors`. There is no `knip --init`.

## Programmatic API

- `knip` exports types: `KnipConfig`, `KnipConfiguration`, `Reporter`, `Preprocessor`, `ReporterOptions`, `Issue`, `IssueType`.
- `knip/config` exports `defineConfig`.
- `knip/session` exports `createSession`, `createOptions`, and file/package descriptors. It powers the MCP server and editor. It is not documented as a stable user API; prefer the CLI with `--reporter json` in scripts.

## Performance

- Typical v6 runs take seconds on large repos (oxc parser/resolver; 2–4x faster than v5).
- Narrow `project` with negations: negated files are not analyzed. `ignore` does **not** reduce work.
- Fewer, exact `entry` globs.
- `--cache` for repeated local runs.
- Measure: `-u/--duration` (no overhead), `--performance`, `--performance-fn <name>` (Node only), `--memory`, `--memory-realtime`.
- `ignoreExportsUsedInFile` costs 0.25–10%.
- Last resort for memory limits: split by `--workspace`.
- `RangeError: Array buffer allocation failed` on low-RAM machines or Windows with Node 22+: `KNIP_DISABLE_RAW_TRANSFER=1 knip`.

## Troubleshooting load errors

Exit code 2 or "Error loading <config file>" means a plugin could not execute a tool config. Fix in this order:

1. Install dependencies (the config imports packages).
2. Provide env vars the config reads: `KEY=VAL knip`, `node --env-file .env $(which knip)`, or dotenvx.
3. Path aliases inside config files: use relative imports, or `NODE_OPTIONS="--import tsx" knip`, or `knip-bun`.
4. Generated files or builds the config imports: run them first.
5. Nx: `NX_DAEMON=false knip`.
6. Still failing: keep the plugin but skip that file (`"vite": { "config": [] }`) and add the file to `entry`, or disable the plugin per workspace with a comment. `ignoreWorkspaces` is the last resort.

Other quick checks:

- `knip --debug`: config resolved, workspaces, enabled plugins, globs, compiled files, source mapping.
- "Module load error?" or "Configuration file load error?" messages link to https://knip.dev/reference/known-issues.
- v5 leftovers: `Unknown option '--include-libs'` (exit 1; same for `--isolate-workspaces`, `--experimental-tags`), `Invalid issue type: classMembers` in `--include`/`include` (exit 2), `Ignored unknown issue type "classMembers" in rules` (warning). See [migration.md](migration.md).
