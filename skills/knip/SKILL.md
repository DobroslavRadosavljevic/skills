---
name: knip
description: "Set up, enforce, audit, debug, migrate, and use Knip 6 (knip.dev, knip@6.40) to find and remove unused files, exports, types, enum/namespace members, dependencies, devDependencies, unlisted dependencies and binaries, unresolved imports, duplicate exports, catalog entries, and circular dependencies in any JavaScript/TypeScript codebase or monorepo. Use whenever the user mentions knip, knip.json, knip.ts, dead code, unused exports, unused dependencies, unused files, depcheck, ts-prune, unimported, cleaning up a codebase, removing slop, or wants a dead-code CI gate — even if they don't name Knip. Covers configuration (entry, project, production `!` markers, workspaces, plugins, paths, ignore options, rules, tags, compilers), configuration hints, production and strict mode, auto-fix, reporters, CI/GitHub Actions, editor/MCP integrations, troubleshooting exit code 2, and Knip 5 to 6 migration."
---

# Knip

Knip builds the module graph from entry files and reports what nothing uses. Its output is only as good as its entry coverage, so a "proper setup" means: Knip sees every real entry, hides nothing it should report, and fails CI on drift. This skill enforces that setup in any repository.

## Enforced setup (definition of done)

A repository is done only when every item holds. Check them with `scripts/audit-setup.mjs` plus real Knip runs.

1. `knip` is in **root `devDependencies`** on major 6 (`^6.x`), run through the repo's package manager. No global or `npx`-only use.
2. **Exactly one config**: `knip.json` (or `knip.jsonc`) with `"$schema": "https://unpkg.com/knip@6/schema.json"` (`schema-jsonc.json` for `.jsonc`). Use `knip.ts` only when the config needs code (compilers, `RegExp`, computed values). No `package.json#knip` next to a file (Knip merges them).
3. **Minimal, specific config**: `entry` only for files no plugin, default, or `package.json` field reaches; `project` set to the real source boundary; shipped code marked with the `!` production suffix. No option that only repeats a default or a plugin.
4. **`"treatConfigHintsAsErrors": true`** and zero configuration hints. Add `"treatTagHintsAsErrors": true` when tags are used.
5. **Scripts**: `"knip": "knip"` and `"knip:production": "knip --production"` (`--production --strict` for published packages or monorepos with published packages).
6. **CI runs both scripts** on every pull request after a full install and any codegen, with exit code on: no `--no-exit-code`, `--max-issues` 0, no `--no-config-hints`. Exit code 2 fails the job.
7. **All core issue types at `error`**. `rules` with `warn` is allowed only during a tracked adoption; `off` for core types is not allowed.
8. **Every suppression is the narrowest possible** (see the ranked list in [configuration.md](references/configuration.md#ignore-options-ranked)), uses exact names, and has a written reason (`//` comment in `knip.jsonc`/`knip.ts`, or the PR description for `knip.json`). No catch-all globs or regexes. Prefer `"tags": ["-lintignore"]` with `/** @lintignore */` over file-level ignores.
9. **Exports are really checked**: `includeEntryExports: true` for applications and internal (private) workspace packages; published APIs use `package.json#exports` and `@public`.
10. **Monorepos**: root files under `workspaces["."]`, no top-level `entry`/`project`, every workspace lists what it imports.
11. Replaced tools (depcheck, ts-prune, unimported, ts-unused-exports) and their configs are removed.
12. `knip` and `knip --production` both **exit 0** on the final tree, and typecheck, tests, and build still pass.

## Workflow

### 1. Inspect

- Detect the package manager (lockfile, `packageManager`), monorepo layout (`workspaces`, `pnpm-workspace.yaml`), frameworks and tools, existing Knip config, scripts, CI files, and replaced tools.
- Run the static audit from the skill directory: `node <skill-dir>/scripts/audit-setup.mjs <repo-root>` (add `--json` for machine output). Exit 1 means violations of the enforced setup.
- See which plugins the dependencies enable and their default globs: `node <skill-dir>/scripts/list-plugins.mjs <repo-or-workspace-dir>` (needs Knip installed; `--all`, `--plugin <name>`).

### 2. Install or upgrade

- `bun add -d knip` (or the repo's package manager; keep `typescript` installed in TS projects). Node `^20.19.0 || >=22.12.0` or Bun.
- On Knip 5: follow [migration.md](references/migration.md) (removed `classMembers`, `--include-libs`, `--isolate-workspaces`, `--experimental-tags`; new JSON reporter shape).
- Create the config from [assets/knip.json](assets/knip.json) or [assets/knip.monorepo.jsonc](assets/knip.monorepo.jsonc) and adapt `project` to the real source folders. Start **without** `entry`: framework and tool plugins usually find entries (Vite reads `index.html`, test runners find tests, `package.json` `main`/`bin`/`exports`/`scripts` count). Add `entry` only when unused files or hints show a gap. Delete template patterns that match nothing; hints flag them.

### 3. Baseline

- `bunx knip --reporter compact` and `bunx knip --production --reporter compact`. For a huge report add `--max-show-issues 5`.
- Exit code 2 first: a tool config failed to load. Fix the load, do not disable the plugin blindly ([ci-and-tooling.md](references/ci-and-tooling.md#troubleshooting-load-errors)).
- `bunx knip --debug` shows workspaces, enabled plugins, entry/project globs, and resolved files.

### 4. Configure until the graph is right

Loop until there are zero hints and no false positives:

1. Fix configuration hints in printed order ([issue-triage.md](references/issue-triage.md#configuration-hints)).
2. For each suspicious finding decide: really unused, or invisible usage? Use `--trace-file`, `--trace-export`, `--trace-dependency`.
3. Teach Knip with the most specific fix: codegen/build before Knip → plugin `config`/`entry` override ([plugins.md](references/plugins.md)) → `entry` → `paths` → compiler → narrowest ignore with a reason ([configuration.md](references/configuration.md)).
4. Re-run both modes.

Never exclude tests through `ignore` or negated globs; production mode does that. Never list the same file with and without `!`: it drops the file from the production graph.

### 5. Fix real issues

Work top-down ([issue-triage.md](references/issue-triage.md#order-of-work)): unresolved → files → unlisted/binaries → dependencies → exports/types/members/duplicates → optional cycles.

- Auto-fix only after step 4 is clean, with a clean git tree, one type at a time: `--fix-type dependencies`, then `--fix-type exports,types`, then remove the dead locals it leaves (linter unused-vars autofix; without a linter, `tsc --noEmit --noUnusedLocals` lists them, or delete by hand), then `--fix-type files --allow-remove-files` last. Review every diff. Details: [cli-and-reporters.md](references/cli-and-reporters.md#auto-fix).
- Add unlisted dependencies by hand to the workspace that imports them (`dependencies` if shipped, else `devDependencies`).
- Unlisted binary from a script that cannot work (tool not installed, no config, not run in CI): the script is dead. Remove it, or install and configure the tool if the user wants it. Say which you chose.
- Code used only by tests (flagged in `--production`): if the feature is dead, delete the code and its tests; if tests need an internal seam, tag it `@internal`. Say which you chose.
- If the backlog is too big for one change, use the ratchet in [ci-and-tooling.md](references/ci-and-tooling.md#gradual-adoption) and tell the user which types remain on `warn`. Do not delete large amounts of code the user did not ask to remove without confirming scope.

### 6. Enforce

- Add the two scripts, `treatConfigHintsAsErrors`, and CI from [assets/knip.workflow.yml](assets/knip.workflow.yml) (adapt to the repo's CI and package manager). Monorepo specifics: [monorepos.md](references/monorepos.md).
- Optional: editor extension or MCP server, pre-push hook with `--cache` ([ci-and-tooling.md](references/ci-and-tooling.md)).

### 7. Verify

- Before changing code, record which of typecheck, tests, lint, build already fail. Afterwards compare: only new failures are regressions. Report pre-existing failures separately; do not fix unrelated breakage unless asked.
- `node <skill-dir>/scripts/audit-setup.mjs <repo-root>` exits 0.
- `bun run knip` and `bun run knip:production` exit 0 with zero hints.
- Typecheck, tests, lint, and build pass after any removal.

## Core judgment

- A Knip finding is a question, not a verdict. Fix the cause (missing entry, plugin config, alias, codegen) before reaching for an ignore. Every ignore must survive "can Knip be taught this instead?".
- Configuration hints mean the config is wrong or stale. Treat them as errors; never silence them.
- Exports of entry files are not reported by default. Broad entry globs therefore hide dead code. Keep entries few and exact, and enable `includeEntryExports` where the entry is not a public API.
- `ignore` hides **all** issue types and still costs analysis time. It is almost never right. Prefer `project` negation, `ignoreFiles`, `ignoreIssues` per type, or JSDoc tags.
- Setting `entry`, `project`, or a plugin key **replaces** defaults; it does not merge.
- Plugins enable per workspace from that workspace's dependencies. Do not duplicate what they already cover (`entry-redundant` hints).
- Default mode includes tests and tooling; `--production` checks shipped code and `dependencies`; `--strict` adds per-workspace isolation and peer/devDependency correctness.
- `cycles` is opt-in and defaults to `warn`; set `rules.cycles: "error"` to gate on it.
- Knip does not remove unused imports or locals inside files. The linter does.
- Never run `--fix` against an unverified report: a wrong graph deletes live code.

## Reporting back

Report: Knip version; config file and the reason for each non-default option and suppression; hint count; issue counts per type before and after (default and production); what was removed; what remains on `warn` and why; which checks ran (audit, both Knip modes, typecheck, tests, build) and which did not.

## References

- [configuration.md](references/configuration.md) — every option, defaults, entry/project model, production `!`, ignore ranking, tags, rules, cycles, compilers, scope table.
- [issue-triage.md](references/issue-triage.md) — order of work, hints table, each issue type's causes and fixes, false-positive playbook, banned shortcuts.
- [plugins.md](references/plugins.md) — plugin mechanics, overrides, and the defaults of all 190 plugins.
- [monorepos.md](references/monorepos.md) — workspaces config, dependency rules, `--strict`, internal vs published packages, `--workspace`, catalogs.
- [cli-and-reporters.md](references/cli-and-reporters.md) — every flag, issue type names, exit codes, reporters, custom reporters/preprocessors, auto-fix behavior.
- [ci-and-tooling.md](references/ci-and-tooling.md) — CI gate, gradual adoption, cache, hooks, editor/LSP/MCP, API, performance, load errors.
- [migration.md](references/migration.md) — Knip 5 to 6, depcheck/ts-prune/unimported migration, 6.x change log.
- [source-map.md](references/source-map.md) — snapshot versions, docs-vs-code differences, refresh procedure, official pages.
