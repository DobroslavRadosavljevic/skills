# Major Upgrades

## Contents

- Read before you edit
- Find what touches this repo
- Codemods and upgrade CLIs
- TypeScript bumps
- Node and Bun runtime bumps
- ESM-only and module-format changes
- Peer-dependency conflicts
- Deprecation warnings
- Subagent fan-out

## Read Before You Edit

For each major (and each minor of a 0.x package):

1. Find the official source: the repo's `CHANGELOG.md` or GitHub Releases, the project's migration or upgrade guide, and the blog post for the release. Use a docs MCP or web search tool; fall back to `bun info <pkg> repository.url` and reading the repo's releases page.
2. Read every release between current and target, not only the target. Breaking changes hide in intermediate majors and in "minor" notes of fast-moving projects.
3. Extract into a short list: removed APIs, renamed APIs, changed defaults, changed types, new peer ranges, new `engines` floor, dropped platforms, ESM/CJS changes, config-file format changes, and deprecations that become removals in the next major.
4. Record the URL you used. The commit body and the final report cite it.

Never answer "what changed in vX" from memory. Versions after your training data exist, and defaults change silently.

## Find What Touches This Repo

For each listed breaking change, search first-party code, config, scripts, and docs:

```sh
rg -n "oldApiName|old/import/path" --glob '!node_modules' --glob '!bun.lock'
rg -n "from ['\"]pkg/removed-subpath['\"]"
rg -n "pkgConfigKey" --glob '*.{json,jsonc,ts,js,mjs,toml,yaml,yml}'
```

Also check: config files (`vite.config.*`, `tsconfig*.json`, lint config), CI workflows, Dockerfiles, scripts in `package.json`, and generated-code templates. Keep a table: breaking change, hit count, files. Zero hits means "no action"; say so in the report instead of silently skipping.

## Codemods And Upgrade CLIs

- Check the migration guide and the package's repo for an official codemod or `migrate`/`upgrade` command. Prefer the official one over hand edits or ad hoc regex.
- Run it with `bunx <codemod>` in non-interactive mode (look for `--yes`, `--force`, `--no-interactive`, or a config flag; if the tool can only prompt, pipe an answer or do the steps by hand). Do not run unreviewed community codemods.
- Run codemods on a clean tree, on their own step, then review `git diff` before verifying. Keep codemod output and manual fixes in the same group commit, but look at them separately.
- Run the formatter after a codemod so the diff only shows real changes.
- If the codemod fails halfway, `git restore` the touched paths and redo it; do not hand-patch a half-migrated tree.

## TypeScript Bumps

- Treat `typescript` as its own group. A minor can add new errors (stricter checks, changed inference, new lib typings).
- Compare typecheck error counts and messages with the baseline. New errors from the bump are the group's work; old errors stay old.
- Check `tsconfig` option changes in the release notes: removed or renamed options, changed defaults (`strict` family, `module`, `moduleResolution`, `target`, `types`), and deprecated flags. Apply the smallest config edit the notes recommend; do not turn on new strictness flags in the same commit.
- Move tools that read TypeScript in the same group when they declare a TypeScript peer range: `typescript-eslint`, doc generators, schema generators, bundler plugins.
- If a native or alternative compiler line is involved, treat it as a separate group and check both `tsc`-style typecheck and emit/bundler behavior.
- With Bun, `bun build` does not typecheck, so always run the repo's typecheck script.
- `@types/node` follows the Node version the project runs, not the newest published types.

## Node And Bun Runtime Bumps

Runtime versions live in several places. Update all of them in one group and grep for each:

- `engines`, `devEngines`, `packageManager` in `package.json`
- `.nvmrc`, `.node-version`, `.tool-versions`, `mise.toml`
- CI workflow versions (`setup-node`, `setup-bun`, matrix entries)
- Docker base images and `FROM` tags
- Deploy platform runtime setting
- `@types/node`, `@types/bun`/`bun-types`

Steps:

1. Read the runtime's release notes for removed APIs, changed defaults, and native-addon ABI changes (`process.versions.modules`). Rebuild or bump native modules when the ABI changes.
2. Bump the local version, run `bun install` (fresh `node_modules` if native modules are present), then the full gates.
3. For Bun, check `bun.lock` `lockfileVersion` and `configVersion` effects, and whether `bunfig.toml` parses (strings must be quoted). A newer Bun can write a lockfile older Bun cannot read, so bump CI and teammates before merging.
4. Prefer LTS lines for Node unless the project already tracks Current.
5. After the bump, remove polyfills and shims for features the new floor ships natively (see Cleanup in [workflow-details.md](workflow-details.md#cleanup-after-upgrades)).

## ESM-Only And Module-Format Changes

A dependency that goes ESM-only breaks `require()` in CommonJS callers, Jest-style CJS test setups, and old bundler configs.

1. Detect: release notes say "ESM only" or `"type": "module"` with no `require` export condition. Check `bun info <pkg>@<version> exports --json` and `type`.
2. Decide per consumer: already ESM (no work), CJS app (convert the importing file to ESM or use dynamic `import()`), or tooling config (rename to `.mjs`/`.mts`, set `"type": "module"` only if the repo is ready).
3. Do not flip the whole repo to ESM inside an upgrade commit. If the repo needs that, the package is **blocked** until the user approves a separate migration.
4. Check test runner and bundler resolution (`resolve.conditions`, `deps.inline`-style settings) when the first import fails with `ERR_REQUIRE_ESM` or a missing default export.
5. Types: check `moduleResolution` and the package's `types` exports field when TypeScript cannot find the types of an ESM-only package.

## Peer-Dependency Conflicts

When install output warns about unmet or conflicting peers, or a target version needs a newer peer:

1. Identify the consumer and the range it wants: `bun why <pkg>` and `bun info <consumer>@<version> peerDependencies --json`.
2. Prefer upgrading the consumer to a version that supports the target. If none exists yet, the major is **blocked**; record the consumer, its latest supported range, and the upstream issue if one exists.
3. Use `overrides` only to bridge a known-compatible gap (a plugin that works but has a stale peer range). Add a note naming the issue or release that lets you remove the override, and verify with the full gates and a runtime check.
4. Never "fix" a peer warning by pinning an older major of the core library without saying so in the report.
5. Check for duplicate copies of a library with stateful singletons (React, Zod, TanStack contexts): `bun why <pkg>` should show one version. Run `bun dedupe --dry-run`.

## Deprecation Warnings

- Capture warnings from install, build, test, and dev-server output during the baseline and after each group. Compare.
- Warnings that the upgrade introduced and that mark removal in the next major go to the follow-ups list with the replacement API and the release notes link.
- Warnings about a deprecated package (`npm deprecate`): check `bun info <pkg> deprecated`. Note the recommended replacement; replacing it is a separate, user-approved change unless it is a drop-in.
- Do not silence warnings by hiding output or adding ignore flags unless the warning is a known upstream issue; record it in that case.

## Subagent Fan-Out

When the harness supports subagents and there are several independent majors, give each reader one package. Brief each with: package name, current and target versions, the repo's relevant usage (file paths from grep), and the output shape wanted: official source URLs, breaking changes that touch this repo, codemod command, peer/engine floor, and a risk rating. Reading is parallel; **applying upgrades stays serial in the main agent**, because groups share the lockfile and working tree. Without subagents, read one package at a time in the order of the group plan.
