# CLI, Reporters, Exit Codes, Auto-fix

Verified against `knip --help` of **knip 6.40.0**. Run `bunx knip --help` to confirm on other versions.

## Contents

- [Run it](#run-it)
- [Flags by group](#flags-by-group)
- [Issue type names](#issue-type-names)
- [Exit codes and gates](#exit-codes-and-gates)
- [Reporters](#reporters)
- [Auto-fix](#auto-fix)
- [Command recipes](#command-recipes)

## Run it

- Install locally and run through the package manager: `bun add -d knip`, then `bunx knip` or `bun run knip`.
- `knip-bun` is a second binary that runs Knip on the Bun runtime. Use it only when Node is not available or Bun-only config loading is needed: `bunx --bun knip-bun`.
- Node engines for 6.x: `^20.19.0 || >=22.12.0` (`engineStrict`).
- `typescript` and `knip` are always treated as used dependencies (built-in `IGNORED_DEPENDENCIES`).

## Flags by group

### General

| Flag | Meaning |
| --- | --- |
| `-c, --config <file>` | Config path. Default lookup: `knip.json`, `knip.jsonc`, `.knip.json`, `.knip.jsonc`, `knip.ts`, `knip.js`, `knip.config.ts`, `knip.config.js`, then `package.json#knip`. |
| `-t, --tsConfig <file>` | tsconfig path (default `tsconfig.json`). Knip reads `compilerOptions.paths` and related settings. |
| `--use-tsconfig-files` | Use tsconfig `include`/`files` as the project files, overriding `project` patterns. |
| `-n, --no-progress` | No progress spinner (auto in CI). |
| `-D, --directory <dir>` | Run from another directory. |

### Mode

| Flag | Meaning |
| --- | --- |
| `-p, --production` | Only production code: entry patterns ending in `!`, plugin `production` entries, `dependencies` (not `devDependencies`). Tests, stories, configs drop out. |
| `-s, --strict` | Implies `--production`. A workspace may only use its own `dependencies` plus required `peerDependencies`: no `devDependencies`, no dependencies inherited from ancestor workspaces (root). Use for publishable packages. |
| `--include-entry-exports` | Report unused exports in entry files too (default: entry exports are ignored). Use for apps; never for published library entry points. |
| `--cache` / `--cache-location <dir>` | File cache, default `node_modules/.cache/knip`. Big speedup on repeat runs. |
| `--no-gitignore` | Do not respect `.gitignore`. |
| `-w, --watch` | Watch mode. Local only, never in CI or agent loops. |

### Scope

| Flag | Meaning |
| --- | --- |
| `-W, --workspace <filter>` | Filter workspaces by name, directory, or glob. Repeatable. Supports negation: `--workspace '!@org/legacy'`. Knip still analyzes the workspaces that the filtered ones depend on. |
| `--include <types>` | Report only these issue types (comma list or repeat). |
| `--exclude <types>` | Drop these issue types. |
| `--dependencies` | `--include dependencies,unlisted,binaries,unresolved,catalog,catalogReferences` |
| `--exports` | `--include exports,types,enumMembers,namespaceMembers,duplicates` (source; `--help` also lists `nsExports,nsTypes`, but they stay opt-in) |
| `--files` | `--include files` |
| `--cycles` | `--include cycles` (circular dependencies; off by default). |
| `--tags <tags>` | Include (`+tag` or `tag`) or exclude (`-tag`) exports by JSDoc tag. Example: `--tags=-lintignore`. |

### Fix

| Flag | Meaning |
| --- | --- |
| `-f, --fix` | Apply fixes for fixable issue types. |
| `--fix-type <types>` | Fix only these types. Fixable: `dependencies`, `exports`, `types`, `files`, `catalog`. |
| `--allow-remove-files` | Allow `--fix` to delete unused files. Without it, files are never deleted. |
| `-F, --format` | Run the project's own formatter on modified files after fixing. |

### Output

| Flag | Meaning |
| --- | --- |
| `--reporter <name or path>` | Reporter. Repeatable. Default `symbols`. |
| `--reporter-options <json>` | JSON options, for example `'{"path":".github/CODEOWNERS"}'`. |
| `--preprocessor <path>` / `--preprocessor-options <json>` | Transform results before reporters. Repeatable. |
| `--no-config-hints` | Hide configuration hints. Do not use in CI. |
| `--no-tag-hints` | Hide tag hints. |
| `--treat-config-hints-as-errors` | Exit 1 when hints exist. Use in CI. |
| `--treat-tag-hints-as-errors` | Exit 1 when tag hints exist. |
| `--max-issues <n>` | Allowed issues before non-zero exit (default `0`). |
| `--max-show-issues <n>` | Cap printed issues per type (output only). |
| `--no-exit-code` | Always exit 0. Banned in CI. |

### Troubleshooting

| Flag | Meaning |
| --- | --- |
| `-d, --debug` | Full debug output: resolved config, enabled plugins per workspace, entry/project globs, files found. |
| `--trace` | Trace output for all exports. |
| `--trace-export <name>` | Where a named export is imported or re-exported. |
| `--trace-file <file>` | Trace all exports of one file. "File not found in module graph" means no entry reaches it. |
| `--trace-dependency <name>` | Which files import a dependency. |
| `--performance` / `--performance-fn <name>` | Timing table of key functions. |
| `--memory` / `--memory-realtime` | Memory usage table or live log. |
| `-u, --duration` | Total run time with no overhead. |

## Issue type names

Use these exact names in `--include`, `--exclude`, `rules`, `include`, `exclude`, and `ignoreIssues`:

`files`, `dependencies`, `devDependencies`, `optionalPeerDependencies`, `unlisted`, `binaries`, `unresolved`, `exports`, `nsExports`, `types`, `nsTypes`, `enumMembers`, `namespaceMembers`, `duplicates`, `catalog`, `catalogReferences`, `cycles`.

Defaults: all on except `nsExports`, `nsTypes`, and `cycles`. Default rule is `error` for all, except `cycles` which is `warn`: `knip --cycles` exits 0 until `rules.cycles` is `"error"`. Including only `nsExports`/`nsTypes` adds them to the default set; `--include cycles` reports only cycles. `classMembers` does not exist in Knip 6 (a leftover `rules.classMembers` prints a warning and is ignored). See [issue-triage.md](issue-triage.md) for what each means and how to fix it.

## Exit codes and gates

| Exit | Meaning |
| --- | --- |
| `0` | Error-level issue count is within `--max-issues` (default 0), or `--no-exit-code`. Issue types with `rules` `"warn"` print but never count. |
| `1` | Error-level issues above `--max-issues`; or hints exist with `--treat-config-hints-as-errors` / `--treat-tag-hints-as-errors`; or an unknown CLI flag (prints help). |
| `2` | Config load error (a plugin could not load a tool config file, since 6.35.1), invalid Knip config, or a crash. `--no-exit-code` does not hide it. Treat as a setup bug, never as "clean". |

`--no-config-hints` also cancels `--treat-config-hints-as-errors`; never combine them.

Gate rules for the enforced setup:

- CI runs with exit code on and `--max-issues` at `0` (the default).
- Configuration hints fail CI: `"treatConfigHintsAsErrors": true` in config or `--treat-config-hints-as-errors`.
- Temporary debt goes to `rules: { "<type>": "warn" }` with a tracking note, never `--no-exit-code`.

## Reporters

Built-in: `symbols` (default), `compact`, `codeowners`, `cycles`, `json`, `codeclimate`, `markdown`, `disclosure`, `github-actions`, `sarif`.

| Reporter | Use |
| --- | --- |
| `symbols` | Human output grouped by issue type. |
| `compact` | One line per file. Good for agents with small context. |
| `json` | Machine-readable. Shape: `{ issues: [{ file, files, dependencies, devDependencies, optionalPeerDependencies, unlisted, binaries, unresolved, exports, types, enumMembers, namespaceMembers, duplicates, catalog, catalogReferences }] }`, each item `{ name, line, col, pos }`. Use for scripted triage. |
| `github-actions` | Workflow annotations on the PR diff. |
| `sarif` | SARIF 2.1.0 (since 6.30). Upload to GitHub code scanning (needs Code Security on private repos). |
| `codeclimate` | GitLab code quality widget. |
| `markdown` | PR comments, job summaries. |
| `codeowners` | Prefixes issues with the owner. Option `{"path":".github/CODEOWNERS"}`. The `json` reporter reads `{"codeowners":"<path>"}` instead and adds an `owners` array. |
| `disclosure` | Collapsible sections. |
| `cycles` | Tree view of circular dependencies: `knip --cycles --reporter cycles`. |

Combine reporters: `knip --reporter github-actions --reporter markdown`.

Custom reporter: a module whose default export receives the results:

```ts
import type { Reporter } from 'knip';

const reporter: Reporter = function (options) {
  // options.report, options.issues, options.counters, options.configurationHints, options.options (JSON string of --reporter-options)
};

export default reporter;
```

Run with `knip --reporter ./scripts/knip-reporter.ts` or a package name. `ReporterOptions` also carries `tagHints`, `enabledPlugins`, `hasConfigLoadErrors`, `includedWorkspaceDirs`, `configFilePath`.

Preprocessors (`import type { Preprocessor } from 'knip'`) take the same options and return them modified. They run in sequence before reporters, and the exit code is computed from their output counters, so a preprocessor can change pass/fail. Configure in the file with `"preprocessor": ["./a.ts"]` and `"preprocessorOptions": {}` (6.35+). Treat a preprocessor that drops issues like an ignore rule: review it.

## Auto-fix

Behavior on 6.40.0 (source `IssueFixer` + verified runs). Order: files, then exports/types, then dependencies, then catalog.

| `--fix-type` | Covers issue types | What changes |
| --- | --- | --- |
| `exports` | `exports`, `nsExports` | Removes the `export` keyword (and `default`), or the specifier from `export { }` / re-export lists through barrel chains. The declaration stays as a dead local. |
| `types` | `types`, `nsTypes`, `enumMembers`, `namespaceMembers` | Removes `export` from types; deletes unused enum and namespace members. |
| `dependencies` | `dependencies`, `devDependencies` | Deletes entries from `package.json`. Leaves empty objects; rewrites formatting. Not `optionalPeerDependencies`. |
| `files` | `files` | Deletes files with `fs.rm` (permanent, no trash). Only with `--allow-remove-files`. |
| `catalog` | `catalog` | Deletes unused entries in `pnpm-workspace.yaml`, `package.json` `catalog(s)`, Bun `workspaces.catalog`. |

Details that bite:

- `--fix-type x` alone enables fixing. `--allow-remove-files` deletes files only when fix types are empty or include `files`.
- CommonJS `module.exports.X = ...` is removed as a whole declaration, even if the right side has side effects. Destructured exports keep an empty declaration (`export const {} = fn()`).
- If a file loses its last import/export, Knip appends `export {};` to keep it a module.
- Exports in compiled files (`.vue`, `.svelte`, `.astro`, `.mdx`) are not fixed.
- Never fixed: `unlisted`, `binaries`, `unresolved`, `duplicates`, `catalogReferences`, `cycles`. They need a human decision (which workspace, dependencies vs devDependencies, which name to keep).
- Knip does not remove unused imports or locals inside a file. The linter does (`no-unused-vars`).
- `--format` (`-F`) runs the project formatter via Formatly (documented: Biome, deno fmt, dprint, Prettier). If the project uses another formatter, run it yourself after the fix.
- When `--fix` resolves everything, the run exits 0; remaining issues exit 1.
- Do not combine `--fix` with `--production`: test-only exports look unused there and would be un-exported.

Safe sequence (require a clean git tree first):

1. Settle configuration: zero configuration hints, zero `unresolved`, no false positives in the report. A wrong graph means `--fix` deletes live code.
2. `knip --fix-type dependencies --format`, then reinstall to sync the lockfile.
3. `knip --fix-type exports,types --format`, then lint with unused-vars autofix to delete dead locals, then typecheck, test, build.
4. Repeat steps 3 until stable: removing exports can expose more unused code.
5. Last, `knip --fix-type files --allow-remove-files`. Review the deleted file list before committing.
6. Add unlisted dependencies and binaries by hand to the right workspace and dependency group.

## Command recipes

```sh
bunx knip                                   # full default-mode run
bunx knip --production                      # production code + dependencies only
bunx knip --production --strict             # libraries / publishable workspaces
bunx knip --reporter compact --no-progress  # agent-friendly output
bunx knip --dependencies                    # dependency hygiene only
bunx knip --workspace packages/api          # one workspace (+ what it depends on)
bunx knip --debug | less                    # what Knip sees (plugins, entries)
bunx knip --trace-file src/foo.ts           # why a file is (not) in the graph
bunx knip --trace-export useThing           # who imports an export
bunx knip --trace-dependency zod            # who imports a dependency
bunx knip --cycles                          # circular imports
bunx knip --cache                           # faster local reruns
```
