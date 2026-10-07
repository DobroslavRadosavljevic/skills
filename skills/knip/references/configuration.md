# Configuration

Every Knip 6 option, its default, where it may live, and how the enforced setup uses it. Verified against the 6.40.0 zod schema and docs.

## Contents

- [Config file](#config-file)
- [Mental model: entry, project, graph](#mental-model-entry-project-graph)
- [entry and project](#entry-and-project)
- [Production markers](#production-markers)
- [paths](#paths)
- [Ignore options, ranked](#ignore-options-ranked)
- [Exports options](#exports-options)
- [JSDoc tags](#jsdoc-tags)
- [rules, include, exclude](#rules-include-exclude)
- [cycles](#cycles)
- [Hints as errors, preprocessors](#hints-as-errors-preprocessors)
- [Compilers](#compilers)
- [Option scope table](#option-scope-table)

## Config file

Lookup order: `knip.json`, `knip.jsonc`, `.knip.json`, `.knip.jsonc`, `knip.ts`, `knip.js`, `knip.config.ts`, `knip.config.js`, then `package.json#knip`. `-c` overrides. Knip **merges** `package.json#knip` with the file it finds, so keep exactly one source.

Preferred: `knip.json` (or `knip.jsonc` for comments) with `$schema`:

```json
{ "$schema": "https://unpkg.com/knip@6/schema.json" }
```

For `.jsonc` use `https://unpkg.com/knip@6/schema-jsonc.json` (allows comments and trailing commas).

Use `knip.ts` only when the config needs code: compilers, real `RegExp`, or values computed from the CLI args.

```ts
import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/index.ts!'],
  project: ['src/**/*.ts!'],
};

export default config;
```

```ts
import { defineConfig } from 'knip/config'; // 6.33+

export default defineConfig(async () => ({
  entry: ['src/index.ts!'],
  project: ['src/**/*.ts!'],
}));
```

A function config receives the parsed CLI args. A config that is not an object throws (exit 2). Unknown keys fail schema validation (`unevaluatedProperties: false`).

Zero config is valid. Many single-package projects need nothing beyond plugins and defaults. The enforced setup still creates `knip.json` to pin `$schema`, the CI gates (`treatConfigHintsAsErrors`), and any real entries. Do not add options "just in case": every unneeded option becomes a configuration hint.

## Mental model: entry, project, graph

```
unused files = project files − (entry files + files resolved from them)
```

1. Knip collects **entry files**: config `entry`, defaults, `package.json` `main`/`bin`/`exports`/`scripts`, plugin entries and plugin config files, and files referenced by scripts, dynamic `import()`, `require.resolve`, `import.meta.resolve`, `new URL('./x', import.meta.url)`, `new Worker(...)`, `child_process` calls, `module.register`.
2. It parses each entry, resolves imports (tsconfig `paths`, plugin aliases, `paths` option, package `exports`), and walks the graph.
3. It compares the graph against **project files** to find unused files, and walks import/export edges to find unused exports and dependencies.

Consequences:

- Accuracy depends on entry coverage. One missing entry cascades into dozens of unused files, exports, and dependencies. Read reports top-down and fix the root cause.
- Exports of entry files are **not** reported by default (they are a public API). Many broad entry globs therefore hide unused exports. Keep entries minimal and exact.
- `.gitignore`d files are never entries (`--no-gitignore` changes that).

## entry and project

Defaults (per workspace), from source:

```json
{
  "entry": ["{index,cli,main}.{js,mjs,cjs,jsx,ts,tsx,mts,cts}!", "src/{index,cli,main}.{js,mjs,cjs,jsx,ts,tsx,mts,cts}!"],
  "project": ["**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}!"]
}
```

Compiler extensions (`.vue`, `.svelte`, `.astro`, `.mdx`, `.css`, ...) are added to the default `project` when their compiler is enabled.

Rules:

- Setting `entry` or `project` **replaces** the default; it does not merge.
- Add `entry` only for files no plugin and no `package.json` field reaches: app bootstrap, worker files loaded by path, scripts run by an unsupported tool, build scripts.
- Set `project` to the real source boundary (`src/**`, `scripts/**`), with negations for areas outside the codebase. This also speeds Knip up, because negated files are not analyzed at all.
- Negate inside `entry` to skip some matches: `["src/routes/*.ts", "!src/routes/_*.ts"]`.
- If you narrow `project`, keep the extensions of **active** compilers in it (`src/**/*.{ts,tsx,css}` when Tailwind enables the CSS compiler), or Knip stops following those imports and reports e.g. `tailwindcss` as unused (hint `project-extension-excluded`). The reverse also fires: listing an extension with no active compiler gives `project-extension-unregistered` (verified on 6.40.0). Run once and let the hints tell you.
- Do not list test patterns in `entry`; test-runner plugins already do (hint: `entry-redundant`).
- Do not exclude tests through `ignore`, negated `entry`, or negated `project`. Plugins add tests as entries anyway. Use `--production` to analyze without tests.
- Do not list the same file both with and without the `!` suffix. Verified on 6.40.0: `["src/index.ts!", "src/index.ts"]` drops the file from the production graph and every file under it is reported unused.
- `--use-tsconfig-files` takes project files from tsconfig `files`/`include`/`exclude`/`references` instead of `project`. Editors and the MCP server use it implicitly when no Knip config exists. Files found that way are analyzed but never reported as unused files.

## Production markers

A `!` suffix marks a pattern as production code:

```json
{
  "entry": ["src/index.ts!", "scripts/build.ts"],
  "project": ["src/**/*.ts!", "scripts/**/*.ts", "!src/test-helpers/**!"]
}
```

- Default mode uses every pattern, suffix or not.
- Once you set `entry`/`project`, only `!` patterns count in production. Verified: `"project": ["src/**/*.{ts,tsx}"]` without `!` makes `--production` report only dependencies; unused files and exports disappear silently. Always mark shipped code.
- `--production` uses only `!` patterns, plugin `production` entries, the `start` script, and `dependencies`. It skips `@internal` exports, tests, stories, configs, and `devDependencies`.
- `!pattern!` (both ends) excludes files only in production mode.
- `ignoreFiles`, `ignoreDependencies`, `ignoreBinaries`, `ignoreWorkspaces` accept a `!` suffix to apply only in production mode.

## paths

TypeScript `compilerOptions.paths` semantics. Knip already reads tsconfig `paths` and aliases from plugins (Vite/webpack `resolve.alias`, SvelteKit `$lib`, Nuxt, Astro, Docusaurus). Add `paths` only for aliases defined somewhere Knip cannot see:

```json
{
  "paths": {
    "@lib": ["./lib/index.ts"],
    "@lib/*": ["./lib/*"],
    "~icons/*": ["node_modules/unplugin-icons/types/react.d.ts"]
  }
}
```

Values are arrays of paths relative to the workspace. Without `*` the key matches exactly. Scoped per workspace since 6.16.

## Ignore options, ranked

Prefer the option with the smallest blast radius. The enforced setup accepts these in this order and requires a comment (`knip.jsonc`/`knip.ts`) or PR note for each entry:

| Rank | Option | Hides | Legit use |
| --- | --- | --- | --- |
| 1 | JSDoc tag on one export (`@public`, `@internal`, `@alias`, custom via `tags`) | One export or member | Public API used only outside the repo; test-only helpers; intentional aliases. |
| 2 | `ignoreExportsUsedInFile` | Exports used in their own file | Codebases that export types next to their only consumer. Prefer `{ "interface": true, "type": true }` over `true`. |
| 3 | `ignoreIssues: { "<glob>": ["<type>"] }` | Named issue types in matching files | Generated code (`src/generated/**`: `exports`, `types`), framework-owned exports. |
| 4 | `ignoreDependencies` / `ignoreBinaries` / `ignoreUnresolved` / `ignoreMembers` | Exact names or regex strings | Plugin gaps, Node-builtin-named packages (`buffer`, `process`), conditional deps in executed configs, globally installed CLIs, virtual modules. |
| 5 | `ignoreFiles` | Only the "unused files" report for matches | Files consumed outside the JS graph (copied assets scripts, fixtures read by path). Other issues in them are still reported. |
| 6 | `ignoreWorkspaces` (root only) | Whole workspaces | Non-JS workspaces (Go, Python) with a `package.json`; last resort for a workspace whose configs cannot load. |
| 7 | `ignore` | **Every issue type** in matching files; files are still analyzed | Avoid. Only for a few analyzed files with real exceptions, or the temporary focus trick `"ignore": ["!src/dir/**"]`. |

`ignoreGlobalBinaries` (default `true`) skips a built-in list of system binaries (`git`, `docker`, `curl`, `node`, `bun`, `gh`, ...). Leave it `true`.

Regex: in JSON, `ignoreDependencies`, `ignoreBinaries`, `ignoreUnresolved`, `ignoreMembers` entries are strings treated as regex-capable patterns (`"@org/.+"`). Real `RegExp` only in `knip.ts`. Banned: catch-alls such as `".*"`.

Every stale ignore entry produces a configuration hint ("Remove from ignoreDependencies"). With `treatConfigHintsAsErrors`, stale ignores fail CI, which keeps the list honest.

## Exports options

- `includeEntryExports` / `--include-entry-exports` — also report unused exports in entry files (not plugin config/entry files, not files reached only via scripts). Enable it for applications (an app's entry exports are not a public API). Keep it off for published libraries, or mark real public API with `@public`. Also enables unused enum/namespace members in entry files. Root or per workspace.
- `ignoreExportsUsedInFile` — `true`, or an object over symbol kinds `class`, `enum`, `function`, `interface`, `member`, `namespace`, `type`, `variable`. Costs about 0.25–10% runtime (`--performance-fn hasRefsInFile`). Root or per workspace.
- Types used only in signatures of used exports are not reported; TypeScript needs them for declarations.
- Namespace imports: when `import * as NS` is used whole (passed, spread, `Object.values(NS)`, re-exported), every export of that module counts as used. Add `"include": ["nsExports", "nsTypes"]` to report them individually.

## JSDoc tags

Knip has no `// knip-ignore` comment. It uses JSDoc/TSDoc tags (comment must start with `/**`):

| Tag | Effect |
| --- | --- |
| `@public` | Never reported. Exception inside entry files with `includeEntryExports`. |
| `@beta` | Same as `@public`. (`@alpha`, `@experimental` have no effect.) |
| `@internal` | Not reported in `--production`; still reported in default mode. For exports used only by tests. Stale `@internal` tags are flagged in production mode (6.11+). |
| `@alias` | Marks a duplicate export as intentional (no `duplicates` issue). |
| custom | Use with `tags`/`--tags`: `"tags": ["-lintignore"]` excludes `@lintignore` exports. `+tag` includes only tagged. Tag names must not contain `-` or `+`. |

Tags work on enum and namespace members too. `@lintignore` placed on an import also silences an unresolved import. Unneeded excluded tags produce **tag hints**; fail on them with `treatTagHintsAsErrors`.

The enforced setup uses `"tags": ["-lintignore"]` (what `@knip/create-config` writes), so one tag works across tools and stale uses get flagged.

## rules, include, exclude

```json
{
  "rules": { "exports": "warn", "cycles": "error" },
  "include": ["nsExports"],
  "exclude": ["duplicates"]
}
```

- `rules` values: `"error"` (printed, counts for exit code), `"warn"` (printed gray, does not count), `"off"` (not reported). Default `error` everywhere except `cycles: "warn"`.
- Rule keys: `files`, `dependencies`, `devDependencies`, `optionalPeerDependencies`, `unlisted`, `binaries`, `unresolved`, `exports`, `nsExports`, `types`, `nsTypes`, `enumMembers`, `namespaceMembers`, `duplicates`, `catalog`, `catalogReferences`, `cycles`.
- `include`/`exclude` are root only. CLI `--include`/`--exclude` override them.
- Enforced end state: no core type `off` or `warn`. `warn` is allowed only during adoption with a tracking note.

## cycles

Opt-in circular dependency detection (6.25+):

```json
{
  "include": ["cycles"],
  "rules": { "cycles": "error" },
  "cycles": { "dynamicImports": false, "allow": [["src/i18n/index.ts", "src/i18n/middleware.ts"]] }
}
```

`allow` takes exact cycle paths from the root, omitting the closing repeat of the first file. Dynamic `import()` edges are skipped unless `dynamicImports: true`. View with `knip --cycles --reporter cycles`.

## Hints as errors, preprocessors

- `treatConfigHintsAsErrors: true` — exit 1 when configuration hints exist. Required in the enforced setup.
- `treatTagHintsAsErrors: true` — exit 1 when tag hints exist. Recommended once tags are in use.
- `preprocessor` / `preprocessorOptions` — transform results before reporters (6.35+). See [cli-and-reporters.md](cli-and-reporters.md#reporters).

## Compilers

Built-in import collectors (regex-based, not real compilers) for `.astro`, `.css` (when Tailwind is present), `.mdx`, `.prisma`, `.sass`/`.scss`, `.less`, `.styl`/`.stylus`, `.svelte`, `.tsrx`, `.vue`. They turn on when their dependency is present. Tradeoff: unused exports inside those files are not reported.

Custom or forced compilers need `knip.ts`:

```ts
import type { KnipConfig } from 'knip';
import { compile } from '@mdx-js/mdx';

const config: KnipConfig = {
  compilers: {
    mdx: true, // force the built-in one
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
    svelte: async (text: string) => (await import('svelte/compiler')).compile(text, {}).js.code,
    template: () => '', // track files as project files without parsing imports
  },
};

export default config;
```

Signature: `(source: string, filename: string) => string | Promise<string>`, text in, JS/TS out. Hint `project-extension-unregistered` means `project` matches an extension with no compiler.

## Option scope table

| Option | Root | Per workspace | Notes |
| --- | --- | --- | --- |
| `entry`, `project`, `paths` | root workspace only in monorepos | yes | Top-level `entry`/`project` are ignored when `workspaces` is used (hint `entry-top-level`); put them under `"."`. |
| `ignore`, `ignoreFiles`, `ignoreIssues` | yes | yes | |
| `ignoreDependencies`, `ignoreBinaries`, `ignoreUnresolved`, `ignoreMembers` | yes | yes | |
| `ignoreGlobalBinaries`, `ignoreExportsUsedInFile`, `includeEntryExports` | yes | yes | Workspaces inherit root values. |
| plugin keys | yes | yes | Workspace value overrides root. |
| `workspaces`, `ignoreWorkspaces`, `include`, `exclude`, `rules`, `tags`, `cycles`, `compilers`, `treatConfigHintsAsErrors`, `treatTagHintsAsErrors`, `preprocessor`, `preprocessorOptions` | yes | no | |
