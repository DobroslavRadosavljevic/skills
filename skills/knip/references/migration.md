# Migration

## Contents

- [Knip 5 to Knip 6](#knip-5-to-knip-6)
- [From other tools](#from-other-tools)
- [Notable 6.x changes](#notable-6x-changes)

## Knip 5 to Knip 6

Knip 6.0.0 (2026-03-20) replaced the TypeScript compiler backend with `oxc-parser` + `oxc-resolver` (2–4x faster). Breaking changes and how to fix each:

| v5 | v6 | Action |
| --- | --- | --- |
| Node 18 supported | Node `^20.19.0 \|\| >=22.12.0` (or Bun) | Upgrade Node in CI and `.nvmrc`/`engines`. |
| `classMembers` issue type | Removed (needed TS `findReferences`, unavailable in TS 7) | Delete from `include`, `exclude`, `rules`, `ignoreIssues`, CLI. In `include`/`--include` it is a hard error (exit 2); in `rules` a warning. Use the linter or editor references for class members. |
| `--include-libs` | Removed; always on | Delete the flag (unknown flag exits 1). |
| `--isolate-workspaces` | Removed; always on | Delete the flag. |
| `--experimental-tags` | Removed | Use `--tags` / `tags`. |
| Reporter `issues._files`, `issues.files` as a Set | `issues.files` has the same shape as other types; `_files` removed | Update custom reporters/preprocessors. |
| JSON reporter: mixed shapes, root `files` | Every issue type is an array per file; no root `files` | Update scripts that parse `--reporter json`. |
| `typescript`, `@types/node` peer dependencies | No peer dependencies | Keep `typescript` installed in TS projects anyway (tsconfig, editors). |
| — | New `namespaceMembers` issue type | Expect new findings for `export namespace` members. |

Steps:

1. `bun add -d knip@^6` (or the repo's package manager).
2. Fix `$schema` to `https://unpkg.com/knip@6/schema.json`.
3. Remove the removed flags and issue types above from config, scripts, and CI.
4. Run `knip` and `knip --production`. New hints are common because v6 hints more (stale `workspaces` keys, extension hints, `ignoreFiles`). Fix them.
5. Review new findings: v6 analyzes more (namespaces, `.d.ts` imports as type-only, published type dependencies, `child_process` scripts).
6. Update custom reporters, preprocessors, and JSON consumers.

## From other tools

All of these are archived or recommend Knip. Remove the old tool and its config after Knip covers its job.

| Old tool | Knip equivalent | Remove |
| --- | --- | --- |
| depcheck | `knip --dependencies` | `depcheck`, `.depcheckrc*` |
| unimported | `knip --production --dependencies --files` | `unimported`, `.unimportedrc.json` |
| ts-prune | `knip --include exports,types,nsExports,nsTypes` (or `--exports`) | `ts-prune` |
| ts-unused-exports | same as ts-prune | `ts-unused-exports` |
| tsr / ts-remove-unused | `knip --fix-type exports,types` | `tsr` |

Translate old ignore lists one by one; do not copy them wholesale. Most entries in a depcheck ignore list exist because depcheck had no plugins. Run Knip without them first, then add back only what Knip still reports and cannot be taught.

Mapping old suppressions:

| Old | Knip |
| --- | --- |
| `// ts-prune-ignore-next` | `/** @lintignore */` with `"tags": ["-lintignore"]`, or delete the export |
| depcheck `ignores` | `ignoreDependencies` (exact names) only for what Knip still reports |
| unimported `ignorePatterns` | `project` negation or `ignoreFiles` |
| unimported `entry` | `entry` with `!` suffix for production files |

## Notable 6.x changes

Use these when an older 6.x is pinned or behavior differs from docs:

| Version | Change |
| --- | --- |
| 6.4 | Glob cache with `--cache`; extension config hints; Tailwind CSS compiler. |
| 6.10 | `.d.ts` imports and tsconfig `types` treated as type-only. |
| 6.11 | Stale `@internal` tags flagged in production mode. |
| 6.14 | `--duration`; shorthands `-p -s -w -D -f -F -u`. |
| 6.15 | `treatTagHintsAsErrors`, `--no-tag-hints`; trace overhaul. |
| 6.16 | `ignoreExportsUsedInFile` and `paths` per workspace; `node:child_process` scripts detected. |
| 6.17 | `ignoreIssues` per workspace. |
| 6.18 | Stale `workspaces` keys hinted. |
| 6.20 | `KNIP_DISABLE_RAW_TRANSFER`. |
| 6.25 | `cycles` issue type (opt-in, `warn` by default). |
| 6.28 | Multiple preprocessors; `project-extension-excluded` hint. |
| 6.30 | `sarif` reporter; `catalogReferences` issue type. |
| 6.33 | `knip/config` with `defineConfig`; non-object config throws. |
| 6.35 | `preprocessor` in config. |
| 6.35.1 | Exit 2 when a plugin config file fails to load. |
| 6.37 | Binaries matched only to real providers. |
| 6.38 | Turborepo plugin; tag hints for enum/namespace members. |
| 6.40 | Test files excluded from package entries in production mode. |
