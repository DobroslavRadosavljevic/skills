# Plugins

Knip 6.40.0 ships **190 plugins**. Plugins are the main reason a correct setup needs little config: they turn tool config files, test files, framework routes, and `package.json` scripts into entry files and dependency references.

## Contents

- [How a plugin works](#how-a-plugin-works)
- [Override, enable, disable](#override-enable-disable)
- [Rules for plugin config](#rules-for-plugin-config)
- [When no plugin exists](#when-no-plugin-exists)
- [Plugin defaults table](#plugin-defaults-table)

## How a plugin works

Each plugin has up to five parts:

| Part | What Knip does with it |
| --- | --- |
| Enablers | The plugin turns on per workspace when one of these packages is in that workspace's `package.json` (dependencies or devDependencies). Some plugins use a custom rule instead (lockfile present, `.github/workflows/*.yml` present, `packageManager` field). |
| `config` | Tool config files. Knip loads them (or reads them statically from the AST for ESLint flat config, tsdown, tsup, and more) and turns referenced modules (presets, plugins, reporters, setup files) into dependencies and entry files. Config files are also added as entry files so their own imports resolve. Plugins read the tool's own settings too (Playwright `testDir`/`testMatch`, Vitest `setupFiles`, Next.js `pageExtensions`), so do not copy those into Knip config. A config file that fails to load exits 2 (since 6.35.1). Executed configs can miss conditional dependencies when the condition evaluates differently under Knip. |
| `entry` | Extra entry files for default mode only (tests, stories, mocks, fixtures). |
| `production` | Entry files that also count in `--production` (routes, pages, middleware, server files). |
| `project` | Rare. Extra project files. |

Plugins without enablers (`c8`, `nodemon`, `ts-node`, `dotenv`, `glob`, ...) only parse command-line arguments when their binary runs in a `package.json` script or CI workflow. Knip parses all scripts (`package.json`, GitHub Actions `run:` steps, husky/lefthook hooks, Taskfile, mise) with a shell parser and resolves the binaries to packages, which is how `unlisted binaries` and dependency usage from scripts are detected.

Check what is enabled per workspace:

```sh
bunx knip --debug          # look for "Enabled plugins" per workspace
node <skill>/scripts/list-plugins.mjs .            # enabled here + defaults
node <skill>/scripts/list-plugins.mjs . --plugin vitest --plugin vite
```

## Override, enable, disable

A plugin key goes at the top level (root workspace, and inherited by every workspace) or inside `workspaces["<name>"]`.

```jsonc
{
  "$schema": "https://unpkg.com/knip@6/schema.json",

  // Shorthand: string or array = override `config` files only.
  "eslint": ["eslint.config.ts", "eslint.base.ts"],

  // Object: override any part. A given key REPLACES the plugin default for that key.
  "vitest": {
    "config": ["vitest.config.ts"],
    "entry": ["src/**/*.test.ts", "test/setup.ts"]
  },

  // Force on (enabler missing, e.g. tool installed globally) or off.
  "storybook": true,
  "jest": false
}
```

Semantics verified in source:

- `"<plugin>": true | false` — force enable or disable, ignoring enablers.
- `"<plugin>": "glob" | ["glob", ...]` — sets `config` only; `entry` stays default.
- `"<plugin>": { config?, entry?, project? }` — each key you set replaces that default list; keys you omit keep defaults. `project` defaults to your `entry` patterns minus negations.
- `"<plugin>": { "config": [] }` — keep the plugin but load no config file (use when a config cannot load under Knip); then add that file to `entry` so its imports still count.
- Workspace-level plugin config overrides the root-level plugin config for that workspace.

## Rules for plugin config

1. Check before you add. Most tools are covered; a hand-written `entry` for `**/*.test.ts` duplicates the vitest/jest/playwright plugin and produces an `entry-redundant` hint.
2. Override only to match a non-default layout (config file in a non-standard path, tests outside default globs). Copy the default patterns from the table and adjust, because a set key replaces the default.
3. If a tool config needs env vars, path aliases, or a build step to load, fix the load first: `KEY=VAL knip`, `node --env-file .env $(which knip)`, relative imports in the config, `NODE_OPTIONS="--import tsx" knip`, `knip-bun`, `NX_DAEMON=false knip`, or run codegen/build before Knip. Do not just disable the plugin. Disabling loses every dependency the config references and causes `unused devDependencies` noise.
4. Disable a plugin only when it misreads the project and a config override cannot fix it. Leave a `//` comment in `knip.jsonc` or `knip.ts` with the reason.
5. A dependency that a plugin should have found but did not is a plugin gap: report or contribute upstream, and add a narrow `ignoreDependencies` entry with a comment meanwhile.

## When no plugin exists

Pick the first option that fits:

1. Add the tool's config files as `entry` (they are source files that import things): `"entry": ["src/index.ts!", "tool.config.ts"]`.
2. Reference the binary in a `package.json` script so the script parser sees it.
3. Write a local plugin by contributing upstream (`bun run create-plugin` in the Knip repo) — the plugin API is not loaded from user config.
4. Last resort: `ignoreDependencies` / `ignoreBinaries` with exact names and a comment.

Compilers for non-standard file types (`.vue`, `.svelte`, `.astro`, `.mdx`, `.css` with `@import`, ...) are separate from plugins. See [configuration.md](configuration.md#compilers).

## Plugin defaults table

Generated from knip 6.40.0 (`scripts/list-plugins.mjs --all`). Long cells are cut with `…`; run the script against the installed version for exact, current values.

Columns: **Enablers** (packages or rule), **Config** files, **Entry** (default mode only), **Production** entry (both modes).

| Plugin | Enablers | Config | Entry | Production |
| --- | --- | --- | --- | --- |
| `angular` | @angular/cli | angular.json |  |  |
| `astro` | astro | astro.config.{js,cjs,mjs,ts,mts} | src/content/config.ts, src/content.config.ts | src/pages/**/*.{astro,mdx,js,ts}, !src/pages/**/_*, !src/pages/**/_*/**, src/content/**/*.mdx, src/middleware.{js,ts}, src/middleware/index.{js,ts}, src/actions/index.{js,ts} |
| `astro-db` | @astrojs/db |  | db/config.{js,ts}, db/seed.{js,ts} |  |
| `astro-markdoc` | @astrojs/markdoc | markdoc.config.{js,ts,mjs,mts} |  |  |
| `astro-og-canvas` | astro-og-canvas |  |  |  |
| `ava` | ava | ava.config.{js,cjs,mjs}, package.json | test.{js,cjs,mjs,ts}, {src,source}/test.{js,cjs,mjs,ts}, **/__tests__/**/*.{js,cjs,mjs,ts}, **/*.spec.{js,cjs,mjs,ts}, **/*.test.{js,cjs,mjs,ts}, **/test-*.{js,cjs,mjs,ts}, **/test/**/*.{js,cjs,mjs,ts}, **/tests/**/*.… |  |
| `babel` | /^@babel\// | babel.config.{json,js,cjs,mjs,cts,ts}, .babelrc.{json,js,cjs,mjs,cts}, .babelrc, package.json |  |  |
| `biome` | @biomejs/biome | biome.json, biome.jsonc |  |  |
| `borp` | borp | .borp.yaml, .borp.yml | **/*.test.{js,mjs,cjs,ts,mts,cts} |  |
| `bumpp` | bumpp |  | package.json, .bumprc, .config/bumprc, .bumprc.{json,jsonc,json5,yaml,yml,js,ts,mjs,cjs,mts,cts,toml}, bump.config.{js,ts,mjs,cjs,mts,cts}, .config/bumprc.{json,jsonc,json5,yaml,yml,js,ts,mjs,cjs,mts,cts,toml} |  |
| `bun` | when a `bun.lock` or `bun.lockb` file is found or a `bun test` script is configured. | bunfig.toml |  |  |
| `c8` | _args only (binary in scripts)_ |  |  |  |
| `capacitor` | /^@capacitor\// | capacitor.config.{json,js,ts} |  |  |
| `catalyst` | @github/catalyst |  |  |  |
| `changelogen` | changelogen |  | package.json, .changelogrc, .config/changelogrc, .changelogrc.{json,jsonc,json5,yaml,yml,js,ts,mjs,cjs,mts,cts,toml}, changelog.config.{js,ts,mjs,cjs,mts,cts}, .config/changelogrc.{json,jsonc,json5,yaml,yml,js,ts,mjs,… |  |
| `changelogithub` | changelogithub |  | package.json, .changelogithubrc, .config/changelogithubrc, .changelogithubrc.{json,jsonc,json5,yaml,yml,js,ts,mjs,cjs,mts,cts,toml}, changelogithub.config.{js,ts,mjs,cjs,mts,cts}, .config/changelogithubrc.{json,jsonc,… |  |
| `changesets` | @changesets/cli | .changeset/config.json |  |  |
| `commitizen` | commitizen | .czrc, .cz.json, package.json |  |  |
| `commitlint` | @commitlint/cli | package.json, package.yaml, .commitlintrc, .config/commitlintrc, .commitlintrc.{json,yaml,yml,js,ts,cjs,mjs,cts,mts}, commitlint.config.{js,ts,cjs,mjs,cts,mts}, .config/commitlintrc.{json,yaml,yml,js,ts,cjs,mjs,cts,mts} |  |  |
| `convex` | convex | convex.json |  | convex/**/*.@(js\|ts) |
| `create-typescript-app` | create-typescript-app |  | create-typescript-app.config.{js,cjs,mjs,ts} |  |
| `cspell` | cspell | cspell.config.{js,cjs,mjs,ts,mts,json,yaml,yml}, cspell.{json,yaml,yml}, .c{s,S}pell.json, c{s,S}pell.json |  |  |
| `cucumber` | @cucumber/cucumber | cucumber.{json,yaml,yml,js,cjs,mjs} | features/**/*.@(js\|cjs\|mjs) |  |
| `cypress` | cypress | cypress.config.{js,ts,mjs,cjs} | cypress/e2e/**/*.cy.{js,jsx,ts,tsx}, cypress/support/e2e.{js,jsx,ts,tsx}, cypress/support/commands.{js,ts}, cypress/support/component.{js,ts}, cypress/plugins/index.js |  |
| `danger` | danger |  | dangerfile.{js,cjs,mjs,ts} |  |
| `dependency-cruiser` | dependency-cruiser | .dependency-cruiser.{js,cjs,mjs,json} |  |  |
| `docusaurus` | @docusaurus/core | docusaurus.config.{js,cjs,mjs,ts,cts,mts} |  | src/pages/**/*.{js,ts,jsx,tsx}, {blog,docs}/**/*.mdx, versioned_docs/**/*.{mdx,jsx,tsx} |
| `dotenv` | _args only (binary in scripts)_ |  |  |  |
| `drizzle` | drizzle-kit | drizzle.config.{ts,js,json} |  |  |
| `electron-vite` | electron-vite | electron.vite.config.{js,mjs,cjs,ts,mts,cts} |  | src/main/index.{js,mjs,cjs,ts,mts,cts}, src/preload/index.{js,mjs,cjs,ts,mts,cts}, src/renderer/index.html |
| `eleventy` | @11ty/eleventy | .eleventy.js, eleventy.config.{js,cjs,mjs} |  | posts/**/*.11tydata.js, _data/**/*.{js,cjs,mjs} |
| `esbuild` | esbuild | esbuild.config.{js,mjs,cjs,ts,mts,cts}, esbuild.{js,mjs,cjs,ts,mts,cts} |  |  |
| `eslint` | eslint, @eslint/js | eslint.config.{js,cjs,mjs,ts,cts,mts}, .eslintrc, .eslintrc.{js,json,cjs}, .eslintrc.{yml,yaml}, package.json |  |  |
| `eve` | eve |  | {evals,agents/*/evals}/evals.config.ts, {evals,agents/*/evals}/**/*.eval.ts | {,agent/,agents/*/,agents/*/agent/}{agent,instructions,instrumentation,memory,sandbox}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}, {,agent/,agents/*/,agents/*/agent/}{instructions,instrumentation,memory}/*.{js,jsx,ts,tsx,mjs,cjs… |
| `execa` | execa |  |  |  |
| `expo` | expo | app.json, app.config.{ts,js} |  | app/**/*.{js,jsx,ts,tsx}, src/app/**/*.{js,jsx,ts,tsx} |
| `expressive-code` | astro-expressive-code, rehype-expressive-code, @astrojs/starlight | ec.config.{js,mjs,cjs,ts} |  |  |
| `fast` | @microsoft/fast-element |  |  |  |
| `fumadocs` | fumadocs-core, fumadocs-mdx, fumadocs-ui |  | source.config.{js,ts,mjs}, content/**/*.mdx |  |
| `gatsby` | gatsby, gatsby-cli | gatsby-{config,node}.{js,jsx,ts,tsx}, plugins/**/gatsby-node.{js,jsx,ts,tsx} |  | gatsby-{browser,ssr}.{js,jsx,ts,tsx}, src/api/**/*.{js,ts}, src/pages/**/*.{js,jsx,ts,tsx}, src/templates/**/*.{js,jsx,ts,tsx}, src/html.{js,jsx,ts,tsx}, plugins/**/gatsby-{browser,ssr}.{js,jsx,ts,tsx} |
| `github-action` | @actions/core | action.{yml,yaml} |  |  |
| `github-actions` | when a `.yml` or `.yaml` file is found in the `.github/workflows` folder. | .github/workflows/*.{yml,yaml}, .github/**/action.{yml,yaml} |  |  |
| `glob` | _args only (binary in scripts)_ |  |  |  |
| `graphql-codegen` | /^@graphql-codegen\//, graphql-config | package.json, codegen.{json,yml,yaml,js,ts}, .codegenrc.{json,yml,yaml,js,ts}, codegen.config.js, .graphqlrc, .graphqlrc.{json,yml,yaml,toml,js,ts}, graphql.config.{json,yml,yaml,toml,js,cjs,ts} |  |  |
| `hardhat` | hardhat |  | hardhat.config.{js,cjs,mjs,ts,cts,mts} |  |
| `husky` | husky | .husky/prepare-commit-msg, .husky/commit-msg, .husky/pre-{applypatch,commit,merge-commit,push,rebase,receive}, .husky/post-{checkout,commit,merge,rewrite}, package.json |  |  |
| `i18next-parser` | i18next-parser | i18next-parser.config.{js,mjs,json,ts,yaml,yml} |  |  |
| `jasmine` | jasmine | spec/support/jasmine.{json,jsonc,js,cjs,mjs} | spec/**/*[sS]pec.{js,mjs}, spec/helpers/**/*.{js,mjs} |  |
| `jest` | jest | jest.config.{js,ts,mjs,cjs,mts,cts,json}, package.json | **/__tests__/**/*.?(c\|m)[jt]s?(x), **/?(*.)+(spec\|test).?(c\|m)[jt]s?(x), **/__mocks__/**/*.[jt]s?(x) |  |
| `karma` | karma | karma.conf.js, karma.conf.ts, .config/karma.conf.js, .config/karma.conf.ts |  |  |
| `knex` | knex | knexfile.{js,cjs,mjs,ts,cts,mts} |  |  |
| `ladle` | @ladle/react | .ladle/config.{mjs,js,ts} | .ladle/components.{js,jsx,ts,tsx}, src/**/*.stories.{js,jsx,ts,tsx,mdx} |  |
| `laravel-vite-plugin` | laravel-vite-plugin | vite.config.{js,mjs,ts,cjs,mts,cts} |  |  |
| `lefthook` | lefthook, @arkweid/lefthook, @evilmartians/lefthook | (computed at runtime) |  |  |
| `lint-staged` | lint-staged | package.{json,yaml,yml}, .lintstagedrc, .lintstagedrc.{json,yaml,yml,mjs,mts,js,ts,cjs,cts}, lint-staged.config.{mjs,mts,js,ts,cjs,cts} |  |  |
| `linthtml` | @linthtml/linthtml | package.json, .linthtmlrc, .config/linthtmlrc, .linthtmlrc.{json,yaml,yml,js,ts,cjs,mjs}, linthtml.config.{js,ts,cjs,mjs}, .config/linthtmlrc.{json,yaml,yml,js,ts,cjs,mjs} |  |  |
| `lit` | lit, lit-element, @lit/reactive-element |  |  |  |
| `lockfile-lint` | lockfile-lint | package.json, .lockfile-lintrc, .config/lockfile-lintrc, .lockfile-lintrc.{json,yaml,yml,js,ts,cjs,mjs,toml}, lockfile-lint.config.{js,ts,cjs,mjs}, .config/lockfile-lintrc.{json,yaml,yml,js,ts,cjs,mjs,toml} |  |  |
| `lost-pixel` | lost-pixel | lostpixel.config.{js,ts} |  |  |
| `lunaria` | @lunariajs/core, @lunariajs/starlight | lunaria.config.json |  |  |
| `markdownlint` | markdownlint-cli, markdownlint-cli2 | .markdownlint-cli2.{jsonc,yaml,cjs,mjs}, .markdownlint.{json,jsonc,yaml,yml,cjs,mjs} |  |  |
| `marko` | marko | **/marko.json, **/marko-tag.json |  | **/{components,tags}/**/*.marko, **/{components,tags}/**/{component,component-browser}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}, **/{components,tags}/**/*.{component,component-browser}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}, **/{comp… |
| `mdx` | astro, mdxlint | tsconfig.json |  |  |
| `mdxlint` | mdxlint | .mdxlintrc, .mdxlintrc.{json,js,cjs,mjs,yml,yaml}, package.json |  |  |
| `metro` | metro, @react-native/metro-config, expo | metro.config.{js,cjs,mjs,ts,cts,mts,json}, .config/metro.{js,cjs,mjs,ts,cts,mts,json}, package.json |  | src/**/*.{ios,android,windows,web,native,default}.{js,jsx,json,ts,tsx} |
| `mise` | when `mise.toml` or `.mise.toml` is found. | {mise,.mise}{,.*}.toml, {mise,.mise}/config{,.*}.toml, .config/mise{,.*}.toml, .config/mise/config{,.*}.toml, .config/mise/mise{,.local}.toml, {mise,.mise}/conf.d/[!.]*.toml, .config/mise/conf.d/[!.]*.toml |  |  |
| `mocha` | mocha | .mocharc.{js,cjs,json,jsonc,yml,yaml}, package.json | **/test/*.{js,cjs,mjs} |  |
| `moonrepo` | @moonrepo/cli | moon.yml, .moon/tasks.yml, .moon/tasks/*.yml |  |  |
| `msw` | msw | package.json | mockServiceWorker.js |  |
| `nano-spawn` | nano-spawn |  |  |  |
| `nano-staged` | nano-staged | package.json, .nano-staged.{js,cjs,mjs,json}, nano-staged.{js,cjs,mjs,json}, .nanostagedrc |  |  |
| `nest` | /^@nestjs\/.*/ | nest-cli.json, .nestcli.json, .nest-cli.json, nest.json |  |  |
| `netlify` | /^@netlify\/plugin-/, netlify-cli, @netlify/functions | netlify.toml |  | netlify/functions/**/*.{js,mjs,cjs,ts,mts,cts} |
| `next` | next | next.config.{js,ts,cjs,mjs,mts} |  | {,src/}app/{,[(]*[)]/}{manifest,robots}.{js,ts}, {,src/}app/**/sitemap.{js,ts}, {,src/}app/**/{icon,apple-icon,opengraph-image,twitter-image}.{js,jsx,ts,tsx}, {,src/}{instrumentation,instrumentation-client,middleware,… |
| `next-intl` | next-intl |  |  | {src/,}i18n/request.{js,jsx,ts,tsx} |
| `next-mdx` | @next/mdx | next.config.{js,ts,cjs,mjs,mts} |  | {src/,}mdx-components.{js,jsx,ts,tsx} |
| `nitro` | nitropack, nitro | nitro.config.{js,cjs,mjs,ts,cts,mts} |  | server.{js,mjs,ts}, api/**/*.ts, routes/**/*.ts, middleware/**/*.ts, plugins/**/*.ts, .nitro/types/*.d.ts |
| `node` | custom |  | server.js |  |
| `node-modules-inspector` | node-modules-inspector | node-modules-inspector.config, node-modules-inspector.config.{json,ts,mts,cts,js,mjs,cjs} |  |  |
| `nodemon` | _args only (binary in scripts)_ |  |  |  |
| `npm-package-json-lint` | npm-package-json-lint | package.json, .npmpackagejsonlintrc, .config/npmpackagejsonlintrc, .npmpackagejsonlintrc.{json,yaml,yml,js,ts,cjs,mjs}, npmpackagejsonlint.config.{js,ts,cjs,mjs}, .config/npmpackagejsonlintrc.{json,yaml,yml,js,ts,cjs,… |  |  |
| `nuxt` | nuxt, nuxt-nightly | nuxt.config.{js,cjs,mjs,ts,cts,mts} | app.config.ts, **/*.d.vue.ts | app.{vue,jsx,tsx}, error.{vue,jsx,tsx}, router.options.ts, layouts/**/*.{vue,jsx,tsx}, middleware/**/*.ts, pages/**/*.{vue,jsx,tsx}, plugins/**/*.ts, modules/**/*.{ts,vue}, server/api/**/*.ts, server/middleware/**/*.t… |
| `nuxtjs-i18n` | @nuxtjs/i18n |  | i18n.config.{js,mjs,ts}, i18n/i18n.config.{js,mjs,ts} |  |
| `nx` | nx, /^@nrwl\//, /^@nx\// | nx.json, project.json, {apps,libs}/**/project.json, package.json |  |  |
| `nyc` | nyc | .nycrc, .nycrc.{json,yml,yaml}, nyc.config.js, package.json |  |  |
| `oclif` | oclif, @oclif/core | package.json |  | {,src/}commands/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts} |
| `openapi-ts` | @hey-api/openapi-ts | package.json, .openapi-tsrc, .config/openapi-tsrc, .openapi-tsrc.{json,jsonc,json5,yaml,yml,js,ts,mjs,cjs,mts,cts,toml}, openapi-ts.config.{js,ts,mjs,cjs,mts,cts}, .config/openapi-tsrc.{json,jsonc,json5,yaml,yml,js,ts… |  |  |
| `openclaw` | when `package.json#openclaw` is present. | package.json, openclaw.plugin.json |  |  |
| `orval` | orval | orval.config.{js,mjs,ts,mts} |  |  |
| `osls` | osls | serverless.{js,cjs,mjs,ts,cts,mts,yml,yaml} |  |  |
| `oxfmt` | oxfmt | .oxfmtrc.json, .oxfmtrc.jsonc, oxfmt.config.{ts,mts} |  |  |
| `oxlint` | oxlint, vite-plus | .oxlintrc.{json,jsonc}, oxlint.config.{ts,mts} |  |  |
| `panda-css` | @pandacss/dev | panda.config.{ts,js,mjs,cjs,mts,cts} |  |  |
| `parcel` | parcel, @parcel/core | .parcelrc |  |  |
| `payload` | payload | payload.config.ts, src/payload.config.ts |  |  |
| `pino` | pino |  |  |  |
| `playwright` | @playwright/test | playwright.config.{js,cjs,mjs,ts,cts,mts} | **/*.@(spec\|test).?(c\|m)[jt]s?(x) |  |
| `playwright-ct` | /^@playwright\/experimental-ct-/ | playwright-ct.config.{js,ts} | **/*.@(spec\|test).?(c\|m)[jt]s?(x), playwright/index.{js,ts,jsx,tsx} |  |
| `playwright-test` | playwright-test |  |  |  |
| `plop` | plop |  | plopfile.{cjs,mjs,js,ts} |  |
| `pm2` | pm2 | pm2.config.{json,js,cjs,mjs}, ecosystem.config.{json,js,cjs,mjs} |  |  |
| `pnpm` | when a `pnpm-lock.yaml` or `pnpm-workspace.yaml` file is found in the root directory, or when `pnpm@` is specified in the `packageManager` field of `package.json`. | package.json, pnpm-workspace.yaml | .pnpmfile.{cjs,mjs} |  |
| `postcss` | postcss, postcss-cli, next, @tailwindcss/postcss | package.json, postcss.config.json, .postcssrc, .postcssrc.{json,ts,js,cjs,mjs,mts,cts,yaml,yml}, postcss.config.{ts,js,cjs,mjs,mts,cts} |  |  |
| `pre-commit` | pre-commit, @fastify/pre-commit |  |  |  |
| `preconstruct` | @preconstruct/cli | package.json |  |  |
| `prettier` | prettier | .prettierrc, .prettierrc.{json,js,cjs,mjs,ts,cts,mts,yml,yaml,toml,json5}, prettier.config.{js,cjs,mjs,ts,cts,mts}, package.{json,yaml} |  |  |
| `prisma` | prisma, /^@prisma\/.*/ | prisma.config.{js,ts,mjs,cjs,mts,cts}, .config/prisma.{js,ts,mjs,cjs,mts,cts}, package.json | prisma/schema.prisma, schema.prisma |  |
| `quasar` | @quasar/app, @quasar/app-vite, @quasar/app-webpack | quasar.config.{js,cjs,mjs,ts}, quasar.conf.js |  | src/App.vue, src/router/index.{js,ts}, src/stores/index.{js,ts}, src/store/index.{js,ts}, src-pwa/register-service-worker.{js,ts}, src-pwa/register-sw.{js,ts}, src-pwa/custom-service-worker.{js,ts}, src-pwa/sw/custom-… |
| `qwik` | @builder.io/qwik | vite.config.{js,mjs,ts,cjs,mts,cts} | src/entry.dev.tsx | src/root.tsx, src/entry.*.tsx, src/routes/**/*.{tsx,ts,md,mdx} |
| `railway` | railway | .railway/railway.ts |  |  |
| `raycast` | @raycast/api | package.json |  |  |
| `react-cosmos` | react-cosmos | cosmos.config.json | **/*.fixture.{js,jsx,ts,tsx,md,mdx}, __fixtures__/**/*.{js,jsx,ts,tsx,md,mdx}, **/fixture.{js,jsx,ts,tsx,md,mdx}, **/cosmos.decorator.{jsx,tsx} |  |
| `react-email` | react-email |  | emails/**/*.tsx |  |
| `react-native` | react-native | react-native.config.js |  |  |
| `react-router` | @react-router/dev | react-router.config.{js,ts}, vite.config.{js,mjs,ts,cjs,mts,cts} |  |  |
| `relay` | vite-plugin-relay, @swc/plugin-relay, babel-plugin-relay | relay.config.json, relay.config.js |  |  |
| `release-it` | release-it | .release-it.{json,js,cjs,ts,yml,yaml,toml}, package.json |  |  |
| `remark` | remark-cli | package.json, .remarkrc, .remarkrc.json, .remarkrc.{js,cjs,mjs}, .remarkrc.{yml,yaml} |  |  |
| `remix` | /^@remix-run\// |  | remix.config.js, remix.init/index.js | app/root.tsx, app/entry.{client,server}.{js,jsx,ts,tsx}, app/routes/**/*.{js,ts,tsx}, server.{js,ts} |
| `rolldown` | rolldown | rolldown.config.{js,cjs,mjs,ts,cts,mts} |  |  |
| `rollup` | rollup | rollup.config.{js,cjs,mjs,ts} |  |  |
| `rsbuild` | @rsbuild/core | rsbuild*.config.{mjs,ts,js,cjs,mts,cts} |  |  |
| `rslib` | @rslib/core | rslib*.config.{mjs,ts,js,cjs,mts,cts} |  |  |
| `rspack` | @rspack/core | rspack.config*.{js,ts,mjs,mts,cjs,cts} |  |  |
| `rstest` | @rstest/core | rstest.config.{js,cjs,mjs,ts,cts,mts} | **/*.{test,spec}.?(c\|m)[jt]s?(x), **/__mocks__/**/*.?(c\|m)[jt]s?(x) |  |
| `sanity` | sanity |  | sanity.config.{js,jsx,ts,tsx}, sanity.cli.{ts,js}, sanity.blueprint.{ts,js,json} |  |
| `semantic-release` | semantic-release | package.json, .releaserc, .config/releaserc, .releaserc.{json,yaml,yml,js,ts,cjs,mjs}, release.config.{js,ts,cjs,mjs}, .config/releaserc.{json,yaml,yml,js,ts,cjs,mjs} |  |  |
| `sentry` | /^@sentry\// |  |  | sentry.{client,server,edge}.config.{js,ts} |
| `serverless-framework` | serverless | serverless.{js,cjs,mjs,ts,cts,mts,yml,yaml} |  |  |
| `simple-git-hooks` | simple-git-hooks | .simple-git-hooks.{js,cjs,mjs,json}, simple-git-hooks.{js,cjs,mjs,json}, package.json |  |  |
| `size-limit` | size-limit |  | .size-limit, .size-limit.{json,ts,js,cjs,mjs,mts,cts}, size-limit.config.{ts,js,cjs,mjs,mts,cts} |  |
| `sst` | sst | sst.config.ts |  |  |
| `starlight` | @astrojs/starlight | astro.config.{js,cjs,mjs,ts,mts} |  |  |
| `stencil` | @stencil/core | stencil.config.{ts,js} | **/*.spec.{ts,tsx}, **/*.e2e.{ts,tsx} | src/**/*.tsx |
| `storybook` | /^@storybook\//, @nrwl/storybook | .{storybook,rnstorybook}/{main,test-runner}.{js,ts,mts} | .{storybook,rnstorybook}/{manager,preview,index,vitest.setup}.{js,jsx,ts,tsx}, **/*.@(mdx\|stories.@(mdx\|js\|jsx\|mjs\|ts\|tsx)) |  |
| `stryker` | @stryker-mutator/core | ?(.)stryker.{conf,config}.{js,mjs,cjs,json} |  |  |
| `stylelint` | stylelint | package.json, .stylelintrc, .config/stylelintrc, .stylelintrc.{json,yaml,yml,js,ts,cjs,mjs}, stylelint.config.{js,ts,cjs,mjs}, .config/stylelintrc.{json,yaml,yml,js,ts,cjs,mjs} |  |  |
| `svelte` | svelte |  | svelte.config.js, vite.config.{js,mjs,ts,cjs,mts,cts} |  |
| `sveltejs-package` | @sveltejs/package |  |  |  |
| `sveltekit` | @sveltejs/kit | svelte.config.js, vite.config.{js,mjs,ts,cjs,mts,cts} |  |  |
| `svgo` | svgo, @svgr/plugin-svgo |  | svgo.config.{js,cjs,mjs} |  |
| `svgr` | @svgr/cli, @svgr/core | .svgrrc, .svgrrc.{yaml,yml,json,js}, svgr.config.{js,cjs}, package.json |  |  |
| `swc` | @swc/core | .swcrc |  |  |
| `syncpack` | syncpack | package.json, .syncpackrc, .config/syncpackrc, .syncpackrc.{json,yaml,yml,js,ts,cjs,mjs}, syncpack.config.{js,ts,cjs,mjs}, .config/syncpackrc.{json,yaml,yml,js,ts,cjs,mjs} |  |  |
| `tailwind` | tailwindcss, @tailwindcss/vite, @tailwindcss/webpack, @tailwindcss/postcss, @tailwindcss/cli |  | tailwind.config.{js,cjs,mjs,ts,cts,mts} |  |
| `tanstack-router` | @tanstack/react-router, @tanstack/solid-router, @tanstack/vue-router, @tanstack/svelte-router, @tanstack/router-cli, @tanstack/router-plugin, @tanstack/react-start, @tanstack/solid-start | tsr.config.json |  | src/routeTree.gen.{ts,js}, src/{router,start,client,server}.{js,jsx,ts,tsx} |
| `taskfile` | when a Taskfile is found (Taskfile.yml, taskfile.yml, Taskfile.yaml, taskfile.yaml, etc.). | Taskfile.yml, taskfile.yml, Taskfile.yaml, taskfile.yaml, Taskfile.dist.yml, taskfile.dist.yml, Taskfile.dist.yaml, taskfile.dist.yaml |  |  |
| `tauri` | @tauri-apps/cli | src-tauri/tauri.conf.{json,json5}, src-tauri/tauri.{macos,linux,windows,android,ios}.conf.{json,json5}, src-tauri/Tauri.toml, src-tauri/Tauri.{macos,linux,windows,android,ios}.toml, tauri.conf.{json,json5} |  |  |
| `temporal` | @temporalio/worker |  |  | src/workflows{,/index}.{js,cjs,mjs,ts,cts,mts} |
| `textlint` | textlint | package.json, .textlintrc, .textlintrc.{json,yaml,yml,js,cjs} |  |  |
| `travis` | when a `.travis.yml` file is found in the root folder. | .travis.yml |  |  |
| `ts-node` | _args only (binary in scripts)_ |  |  |  |
| `tsd` | tsd | package.json | *.test-d.{ts,tsx}, test-d/**/*.test-d.{ts,tsx} |  |
| `tsdown` | tsdown | tsdown.config.{ts,mts,cts,js,mjs,cjs,json}, package.json |  |  |
| `tsup` | tsup | tsup.config.{js,ts,cjs,mjs,cts,mts,json}, package.json |  |  |
| `tsx` | custom | package.json |  |  |
| `turbo` | turbo, @turbo/gen |  | turbo/generators/config.{ts,js,cjs,mts,mjs} |  |
| `typedoc` | typedoc | typedoc.{js,cjs,mjs,json,jsonc}, typedoc.config.{js,cjs,mjs}, .config/typedoc.{js,cjs,mjs,json,jsonc}, .config/typedoc.config.{js,cjs,mjs}, package.json, tsconfig.json |  |  |
| `typescript` | typescript, @typescript/native, @typescript/native-preview | tsconfig.json |  |  |
| `typescript-content-mapper` | when `package.json#typescript.contentMapper` is present. | package.json |  |  |
| `unbuild` | unbuild | build.config.{js,cjs,mjs,ts,mts,cts,json} |  |  |
| `unocss` | unocss | uno.config, uno.config.{json,ts,mts,cts,js,mjs,cjs}, unocss.config, unocss.config.{json,ts,mts,cts,js,mjs,cjs} |  |  |
| `unplugin-auto-import` | unplugin-auto-import |  |  |  |
| `unplugin-icons` | unplugin-icons |  |  |  |
| `unplugin-vue-components` | unplugin-vue-components |  |  |  |
| `unplugin-vue-i18n` | @intlify/unplugin-vue-i18n |  |  |  |
| `unplugin-vue-markdown` | unplugin-vue-markdown |  |  |  |
| `unplugin-vue-router` | unplugin-vue-router, vue-router |  |  | src/pages/**/*.{vue,md} |
| `varlock` | varlock |  |  |  |
| `vercel` | @vercel/config |  | vercel.{js,mjs,cjs,ts,mts} |  |
| `vercel-og` | next, @vercel/og |  |  | {src/,}pages/api/og.{jsx,tsx}, {src/,}app/api/og/route.{jsx,tsx} |
| `vike` | vike |  |  | {pages,renderer}/**/+*.{js,jsx,ts,tsx,vue,react,solid}, */{pages,renderer}/**/+*.{js,jsx,ts,tsx,vue,react,solid} |
| `vite` | vite, vitest, vite-plus | vite.config.{js,mjs,ts,cjs,mts,cts} |  |  |
| `vite-plugin-pages` | vite-plugin-pages | vite.config.{js,mjs,ts,cjs,mts,cts} |  | src/pages/**/*.{vue,jsx,tsx,md,mdx} |
| `vite-plugin-pwa` | vite-plugin-pwa, @vite-pwa/nuxt | vite.config.{js,mjs,ts,cjs,mts,cts}, nuxt.config.{js,cjs,mjs,ts,cts,mts} |  | public/sw.js |
| `vite-plugin-vue-layouts-next` | vite-plugin-vue-layouts-next, vite-plugin-vue-layouts, vite-plugin-vue-meta-layouts | vite.config.{js,mjs,ts,cjs,mts,cts} |  | src/layouts/**/*.vue |
| `vite-plus` | vite-plus | vite.config.{js,mjs,ts,cjs,mts,cts} |  |  |
| `vite-pwa-assets-generator` | @vite-pwa/assets-generator | pwa-assets.config.{js,cjs,mjs,ts,cts,mts} |  |  |
| `vitepress` | vitepress |  | .vitepress/config.{js,ts,mjs,mts,cjs,cts}, .vitepress/config/index.{js,ts,mjs,mts,cjs,cts}, .vitepress/theme/index.{js,ts,mjs,mts} |  |
| `vitest` | vitest, vite-plus | vitest.config.{js,mjs,ts,cjs,mts,cts}, vitest.{workspace,projects}.{js,mjs,ts,cjs,mts,cts,json} | **/*.{bench,test,test-d,spec,spec-d}.?(c\|m)[jt]s?(x), **/__mocks__/**/*.?(c\|m)[jt]s?(x) |  |
| `vue` | vue | vue.config.{js,ts,mjs} |  |  |
| `webdriver-io` | @wdio/cli | wdio.conf.{js,cjs,mjs,ts,cts,mts} |  |  |
| `webpack` | webpack, webpack-cli | webpack.config.{js,ts,mjs,cjs,mts,cts} |  |  |
| `wireit` | wireit | package.json |  |  |
| `wrangler` | wrangler | wrangler.{json,jsonc,toml} |  |  |
| `wxt` | wxt | wxt.config.{js,cjs,mjs,ts,cts,mts} |  | entrypoints/**/* |
| `xo` | xo | package.json, .xo-config, .xo-config.{js,cjs,json}, xo.config.{js,cjs,mjs,ts,cts,mts} | .xo-config.{js,cjs}, xo.config.{js,cjs,mjs,ts,cts,mts} |  |
| `yarn` | when a `yarn.lock` file is found in the root directory, or when `yarn@` is specified in the `packageManager` field of `package.json`. | .yarnrc.yml | yarn.config.cjs |  |
| `yorkie` | yorkie | package.json |  |  |
| `zx` | zx |  |  |  |
