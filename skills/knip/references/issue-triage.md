# Issue Triage

How to read a Knip report, decide "real issue or graph gap", and fix each issue type the right way.

## Contents

- [Order of work](#order-of-work)
- [Decision rule](#decision-rule)
- [Configuration hints](#configuration-hints)
- [Issue types](#issue-types)
- [False-positive playbook](#false-positive-playbook)
- [Never do this](#never-do-this)

## Order of work

Findings cascade: one missing entry produces unused files, then unused exports and dependencies inside and below them. Work top-down and re-run Knip after each step.

1. **Exit code 2** (config load errors). Fix first; the graph is incomplete until then.
2. **Configuration hints**, in printed order (`*-unconfigured` → top-level/workspaces → `ignore*` → patterns → extensions → `package-entry`).
3. **Unresolved imports** (`unresolved`). Each one is a hole in the graph.
4. **Unused files** (`files`).
5. **Unlisted dependencies and binaries** (`unlisted`, `binaries`), catalog references.
6. **Unused dependencies** (`dependencies`, `devDependencies`), catalog entries.
7. **Unused exports and types** (`exports`, `types`, `enumMembers`, `namespaceMembers`, `duplicates`, opt-in `nsExports`/`nsTypes`).
8. Optional: **cycles**.
9. Repeat the default run and `--production` until both are clean.

For a big backlog, narrow the view: `knip --max-show-issues 5`, `knip --files`, `knip --dependencies`, `knip --exports`, `knip --workspace <name>`, `--reporter compact`.

## Decision rule

For every finding ask: **is the code really unused, or can Knip not see the usage?**

- Really unused → delete it (or un-export it). That is the point of Knip.
- Usage Knip cannot see → **teach Knip** with the most specific mechanism: entry pattern, plugin config, `paths`, compiler, `package.json` field, script. These fixes keep working as code changes.
- Only when teaching is impossible → the narrowest ignore (see the ranked list in [configuration.md](configuration.md#ignore-options-ranked)), with a comment naming the reason.
- Knip bug → minimal reproduction upstream (https://knip.dev/guides/issue-reproduction), narrow ignore meanwhile.

Tools to see the graph: `--debug` (workspaces, enabled plugins, globs, resolved files), `--trace-file <file>`, `--trace-export <name>`, `--trace-dependency <name>`. "File not found in module graph" from `--trace-file` means no entry reaches it.

## Configuration hints

Hints mean the config is wrong or stale. They are warnings unless `treatConfigHintsAsErrors` is on (enforced setup: on). Never hide them with `--no-config-hints`.

| Hint type | Printed message | Fix |
| --- | --- | --- |
| `top-level-unconfigured` | Create knip.json … / Add entry and/or refine project files (N unused files) | More than 20 unused files and over 20% of processed files. Add the real entries and narrow `project`. Usually a missing plugin config or framework entry. |
| `workspace-unconfigured` | … in `workspaces["<ws>"]` (N unused files) | Same, for one workspace. Add a `workspaces` entry. |
| `entry-top-level`, `project-top-level` | Remove, or move unused top-level entry/project to one of "workspaces" | Monorepo: root `entry`/`project` are ignored. Move them under `workspaces["."]` or the right workspace. |
| `workspaces` | Remove from workspaces | A `workspaces` key matches no workspace. Fix the path or delete it. |
| `ignore`, `ignoreFiles`, `ignoreDependencies`, `ignoreBinaries`, `ignoreUnresolved`, `ignoreWorkspaces` | Remove from <option> | The entry matches nothing anymore. Delete it. |
| `entry-empty`, `project-empty` | Refine entry/project pattern (no matches) | Glob matches no file. Fix or delete. |
| `entry-redundant`, `project-redundant` | Remove redundant entry/project pattern | Defaults or a plugin already cover it. Delete it. |
| `project-extension-unregistered` | Extension in project not registered as a compiler | `project` matches e.g. `.vue` but no compiler is on. Install/enable the compiler or narrow `project`. |
| `project-extension-excluded` | Compiled extension excluded by project (imports not followed) | Narrowed `project` drops `.css`/`.vue`/…; add the extension back. |
| `package-entry` | Package entry file not found | `main`/`exports`/`bin` points to a missing file. Build first (source mapping) or fix `package.json`. |

Tag hints ("Unused tag in <file>: <id> → <tag>") mean an excluded tag such as `@lintignore` is no longer needed. Remove the tag.

## Issue types

### Unused files (`files`)

Meaning: a project file no entry reaches.

| Cause | Fix |
| --- | --- |
| Dead file | Delete it. |
| Dev-only file (seed, migration, build script) reported only in `--production` | The default `project` marks every file as production. Drop the `!` for those paths: `"project": ["src/**/*.{ts,tsx}!", "scripts/**/*.ts"]`. Do not ignore it. |
| Framework/tool file without plugin coverage | Check `knip --debug` for the plugin; if enabled, override its `entry`/`config`; if no plugin, add to `entry`. |
| Tool config in a non-default location | Plugin `config` override: `"vite": ["apps/web/vite.config.ts"]`. |
| Dynamic import with computed path (`import(\`./locales/${l}.ts\`)`) | Add the target glob to `entry`. |
| Generated file not generated yet (`routeTree.gen.ts`, GraphQL/OpenAPI clients) | Run codegen before Knip in CI. |
| File referenced from HTML `<script src>`, a shell script, Dockerfile | Add to `entry`. |
| Relative import across workspaces (`../../packages/x/src`) | Import the package by name and list it as a dependency. |
| Auto-mocks / auto-imports (Jest `__mocks__`, Nuxt) | Extend plugin `entry` or negate in `project`. |
| Fixtures read by path at runtime | `ignoreFiles` with a precise glob, or negate in `project`. |

### Unresolved imports (`unresolved`)

| Cause | Fix |
| --- | --- |
| Alias defined outside tsconfig/plugins | `paths` (per workspace if needed). |
| Extensionless import of a non-standard file (`./icon` → `.svg`) | Write the extension. |
| Virtual module (`virtual:`, `~icons/*`, `#build/*`) | `paths` to the type declarations, else exact `ignoreUnresolved`. |
| Template-string import | Add the files to `entry` (internal) or `ignoreDependencies` (external). |
| Real typo / deleted module | Fix the import. |

### Unlisted dependencies (`unlisted`)

Imported but not in this workspace's `package.json` (often transitive or hoisted "phantom" dependencies). Fix: install it in the workspace that imports it, `dependencies` if it ships at runtime, else `devDependencies`. Never ignore an unlisted runtime dependency; it breaks on clean installs, other package managers, and in Docker images. `node:` builtins and `engines.*` names are not reported; a listed `@types/x` alone no longer counts as missing `x` (6.10+).

### Unlisted binaries (`binaries`)

A script calls a binary that no installed package provides. Fix: add the providing package to `devDependencies`. If the script cannot work anyway (tool never installed, no config, not run anywhere), it is dead: delete the script, or install and configure the tool. If it is a system tool not on the global list (`terraform`, `kubectl`), use exact `ignoreBinaries`. An unused dependency plus an unlisted binary of the same name means the package is not installed where Knip runs: run from the repo root after a full install. `npx foo` is assumed to be package `foo`; use the real package name (`npx @commitlint/cli`).

### Unused dependencies (`dependencies`, `devDependencies`)

Fix unused files first; their imports make dependencies look used.

| Cause | Fix |
| --- | --- |
| Really unused | Remove it (`knip --fix-type dependencies`), reinstall. |
| Used only by a tool whose plugin is off or config failed to load | Fix the plugin/config load. |
| Used from a script Knip cannot parse, or a plugin gap | Add a script reference or `entry`, else exact `ignoreDependencies` with comment. |
| Conditional dependency in an executed config (`process.env.CI ? 'x' : 'y'`) | `ignoreDependencies` with comment. |
| Name collides with a Node builtin (`buffer`, `process`, `events`) | `ignoreDependencies`. |
| `@types/x` for a package that bundles its own types | Remove the `@types/` package. |
| Listed in root and in a workspace, used only in the workspace | Remove it from the root `package.json`. |
| In `dependencies` but only used by tests/configs (`--production`) | Move to `devDependencies`. |
| In `devDependencies` but used by shipped code (`--production --strict`, published packages) | Move to `dependencies` (or required `peerDependencies`). Types exposed in built `.d.ts` must be `dependencies` too. |

`optionalPeerDependencies` reports optional peers that the code references; make them real dependencies or required peers.

### Unused exports and types (`exports`, `types`, `nsExports`, `nsTypes`)

| Cause | Fix |
| --- | --- |
| Really unused | Un-export or delete. `knip --fix-type exports,types`, then lint away dead locals. |
| Used only in its own file | Un-export. If the codebase style requires the export, `ignoreExportsUsedInFile` (prefer `{ interface, type }`). |
| Used only by tests (reported by `--production`) | Dead feature: delete the code and its tests. Real seam the tests need: tag `@internal`. Otherwise test through the public API. |
| Public library API, used outside the repo | Expose through `package.json#exports` entry (entry exports are not reported) or tag `@public`. |
| Consumed by a framework through convention (route `loader`, `generateMetadata`, Storybook `default`) | The framework plugin should make the file an entry; if not, add the file to `entry`. |
| Generated code | `ignoreIssues: { "src/generated/**": ["exports", "types"] }`. |
| Barrel re-export never imported | Remove from the barrel. |

### Enum and namespace members (`enumMembers`, `namespaceMembers`)

Unused members of exported enums/namespaces. Delete them (`--fix-type types` does it), or tag single members with JSDoc, or `ignoreMembers` with exact names. Enums exported from entry files are skipped unless `includeEntryExports`.

### Duplicate exports (`duplicates`)

The same value exported under two names (`export const a = 1; export default a;`). Keep one. If intentional, tag the alias `/** @alias */`.

### Catalog issues (`catalog`, `catalogReferences`)

pnpm/Yarn/Bun catalogs. `catalog`: entry no workspace references → delete (`--fix-type catalog`). `catalogReferences`: a `catalog:` specifier names an entry the catalog lacks → add it to the catalog or fix the specifier. Both are excluded in `--production`.

### Circular dependencies (`cycles`)

Opt-in. Break the cycle by moving shared code into a third module, or by inverting the dependency. Accept known-safe cycles with `cycles.allow` (exact paths). Dynamic imports are skipped by default.

## False-positive playbook

1. `bunx knip --debug` → is the right plugin enabled in the right workspace? Did its config file load (no exit 2)?
2. `bunx knip --trace-file <file>` / `--trace-export <name>` / `--trace-dependency <pkg>` → where the chain breaks.
3. Fix at the source in this order: build/codegen step before Knip → plugin `config`/`entry` override → `entry` → `paths` → compiler → narrow ignore with comment.
4. Re-run the default run and `--production`.
5. Confirm the ignore produces no hint later (stale ignores fail CI when hints are errors).

## Never do this

- `"ignore": ["**/*.test.ts"]` or negated test globs to "exclude tests" → use `--production`.
- `ignore` / `ignoreIssues` over `src/**` or other catch-alls.
- `"ignoreDependencies": [".*"]`, or ignoring every flagged dependency without checking.
- `rules` set to `"off"` for core types to make CI green.
- `--no-exit-code`, `--max-issues N > 0`, or `--no-config-hints` in the final CI gate.
- Running `--fix` before configuration hints and unresolved imports are zero.
- `--fix --allow-remove-files` without reviewing the deleted file list.
- Adding entries for every file Knip reports, which hides their unused exports and freezes dead code as "entry".
- Turning off a plugin because its config does not load, instead of fixing the load.
