# Package Manager

Bun’s built-in package manager: install, lockfile, workspaces, trust, and CI.

## Core commands

```sh
bun install                 # install deps from package.json / lockfile
bun ci                      # frozen lockfile install (CI preferred)
bun install --frozen-lockfile
bun install --offline       # cache only; missing package is an error
bun install --prefer-offline
bun add <pkg>[@version]     # add dependency
bun add -d <pkg>            # devDependency
bun add -O <pkg>            # optionalDependency
bun add -p <pkg>            # peerDependency
bun add -g <pkg>            # global
bun add <pkg> --catalog     # root catalog + "catalog:" in the workspace
bun remove <pkg>
bun update [pkg]            # includes transitives; errors if name is unused
bun outdated
bun audit
bun audit fix               # bump to a safe version and install
bun audit fix --latest      # allow major bumps
bun dedupe                  # collapse duplicate versions in bun.lock
bun dedupe --check          # CI: fail if duplicates remain
bun prune                   # drop node_modules not in bun.lock
bun prune --production      # also drop devDependencies
bunx <pkg> [args]           # execute package binary (npx equivalent)
bun pm ls
bun pm whoami
bun pm bin
bun pm cache
bun pm cache rm
bun pm hash
bun pm untrusted
bun pm trust <pkg>
bun pm licenses [--prod] [--json]
bun pm diff <pkg>           # lockfile version → latest, or two versions
bun pm migrate              # when migrating lockfiles — confirm current help
bun why <pkg>               # why is this installed?
```

`bun install` is the default entry; `bun i` is an alias. `--production` on install implies frozen lockfile and skips installing `devDependencies` (it does not delete existing ones — use `bun prune --production`).

## Lockfile

- Default text lockfile: **`bun.lock`** (since Bun 1.2+).
- Legacy binary: **`bun.lockb`** — migrate to text when possible.
- New lockfiles use **`lockfileVersion`: 2** (integrity required for off-registry tarballs; git entries reject path traversal). Nested / version-scoped overrides write **version 3** — older Bun cannot read those files.
- **Commit the lockfile.**
- CI: `bun ci` or `bun install --frozen-lockfile` so installs fail on drift.

First install in a repo with npm/yarn/pnpm lockfiles can import resolution; afterward treat `bun.lock` as source of truth and remove other lockfiles to avoid dual maintenance. pnpm lockfile v7–9 migrates automatically when `bun.lock` is absent.

### configVersion / linker

Lockfile metadata records `configVersion` and linker mode:

- **isolated** — stricter, pnpm-like layout; default for **new workspaces** (`configVersion: 1`).
- **hoisted** — flatter `node_modules`; default for new single-package projects and pre-1.3.2 lockfiles (`configVersion: 0`).

Set in `bunfig.toml`:

```toml
[install]
linker = "isolated" # or "hoisted"
```

Do not change linker casually — reinstall and retest the monorepo.

### Global virtual store (opt-in)

Isolated installs can share extracted packages across projects:

```toml
[install]
linker = "isolated"
globalStore = true
```

Or `BUN_INSTALL_GLOBAL_STORE=1 bun install --linker isolated`. Default is **off**. Warm isolated installs symlink into `~/.bun/install/cache/links/` instead of copying. Patched, trusted, and `workspace:`/`file:`/`link:` packages stay project-local. Phantom `require`s that relied on the hidden hoist layer can fail — declare the dependency or disable `globalStore`. `bun pm cache rm` clears the store.

## Workspaces

Root `package.json`:

```json
{
  "name": "repo",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

```sh
bun install
bun add zod --filter ./packages/core
bun add zod --filter api
bun run --filter './apps/*' build
bun run --filter pkg-name test
bun run --parallel --filter '*' test
bun run --filter 'web...' build   # web + its dependents
```

Filters accept paths, package names, and patterns. `--filter` on `add`/`remove`/`update` edits the matching workspace, not the root. `add`/`remove --filter '*'` does not include the root. Prefer explicit filters over `cd` + install in each package.

Electron (and similar tools that expect a full local `node_modules`) can opt a workspace into a self-contained tree:

```json
{
  "workspaces": {
    "packages": ["apps/*"],
    "selfContained": ["apps/desktop"]
  }
}
```

Yarn `"installConfig": { "hoistingLimits": "workspaces" }` in that package is also honored.

## Catalogs

Share dependency versions across workspaces:

```json
{
  "name": "repo",
  "workspaces": {
    "packages": ["packages/*"],
    "catalog": {
      "zod": "3.23.8"
    }
  }
}
```

In a workspace package:

```json
{
  "dependencies": {
    "zod": "catalog:"
  }
}
```

`bun add react --catalog` writes the version into the root catalog and `"catalog:"` in the workspace. A plain `bun add` of a package already in the default catalog writes `catalog:`. Named catalogs use `catalog:react19`. Confirm current docs when using multiple catalogs.

## Overrides / resolutions

Force a transitive version. Nested form, yarn `a/b`, pnpm `a>b`, and version-scoped keys work:

```json
{
  "overrides": {
    "foo": "1.2.3",
    "express": { "qs": "6.13.0" },
    "lodash@<4.17.21": "4.17.21"
  }
}
```

Prefer `overrides` going forward (yarn-style `resolutions` may still be read during migration). Nested/version-scoped overrides bump the lockfile to version 3.

## trustedDependencies and lifecycle scripts

By default Bun **does not run** dependency lifecycle scripts until trusted.

```json
{
  "trustedDependencies": ["sharp", "esbuild"]
}
```

Or:

```sh
bun pm untrusted
bun pm trust sharp
```

The default trusted-package list applies only to the **npm registry**. A `github:`/`git:`/`file:` fork named `esbuild` is not auto-trusted.

```json
{
  "nativeDependencies": ["esbuild"],
  "ignoreScripts": ["sharp"]
}
```

`nativeDependencies` links the matching platform optional binary instead of running `postinstall`. `ignoreScripts` skips lifecycle even if the package is trusted.

After adding packages with native `postinstall` (sharp, prisma engines, etc.), always check the untrusted list if binaries are missing.

## .npmrc and registries

Bun reads many `.npmrc` settings (registry, auth tokens, `@scope:registry`). Prefer:

- Project `.npmrc` for registry/auth
- `bunfig.toml` `[install]` for Bun-specific install behavior
- Env vars for CI secrets (`NPM_TOKEN`, etc.)

A project `bunfig.toml` **overrides** `.npmrc` for the same key. Private registries: configure scope registry + auth token; then `bun install` as usual.

## Exact versions / save behavior / age gate

```toml
[install]
exact = true
offline = false
prefer = "offline"       # --prefer-offline
minimumReleaseAge = 259200
minimumReleaseAgeExcludes = ["@types/bun", "typescript"]
```

CLI: `bun add --exact`, `bun install --offline` / `--prefer-offline`, `--minimum-release-age`.

## Global installs and bunx

```sh
bun add -g neonctl
bunx create-vite@latest
bunx --bun vite          # run the tool under Bun when it shells to node
```

Prefer `bunx` over `npx`. Prefer project-local `devDependencies` + `bun run` over global tools for reproducible CI.

## Patch, link, publish

```sh
bun patch <pkg>           # edit-and-persist package patches
bun link / bun link <pkg> # local package linking
bun publish               # publish to npm registry
```

Use patches for urgent upstream fixes; prefer upstream PRs for long-term. Patched packages are ineligible for the global virtual store.

## CI pattern

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: 1.4.2
- run: bun ci
- run: bun test
- run: bun run build
```

Cache Bun’s install cache when CI supports it (setup-bun / cache actions). Always freeze the lockfile in CI. For a restored cache and no network: `bun install --offline --frozen-lockfile`. After a production image build: `bun prune --production`.

## Migration from npm / pnpm / yarn

1. Install Bun.
2. `bun install` in the repo root.
3. Commit `bun.lock`.
4. Replace CI `npm ci` / `pnpm i --frozen-lockfile` with `bun ci`.
5. Replace `npx` with `bunx`.
6. Remove old lockfiles once the team agrees.
7. Audit `trustedDependencies` for native packages.
8. Keep Node for runtime until apps are verified under `bun`.

Script mapping:

| npm | bun |
|---|---|
| `npm install` | `bun install` |
| `npm ci` | `bun ci` |
| `npm install pkg --save-dev` | `bun add -d pkg` |
| `npm uninstall pkg` | `bun remove pkg` |
| `npm update` | `bun update` |
| `npx pkg` | `bunx pkg` |
| `npm run script` | `bun run script` |
| `npm test` | `bun test` (if using bun:test) |
| `npm audit fix` | `bun audit fix` |

## Troubleshooting

| Issue | Action |
|---|---|
| Lockfile conflict noise | Prefer text `bun.lock`; rebase carefully; regenerate with `bun install` if corrupt |
| Phantom missing binary | `bun pm untrusted` / trust postinstall packages |
| Peer dependency warnings | Align versions; use catalogs/overrides |
| Isolated install breaks tool expecting hoisting | Try `linker = "hoisted"` only after validating; or fix package to not require hoisting; Electron: `selfContained` |
| Auth 401 to private registry | Check `.npmrc` / env token / scope registry URL |
| `bun update pkg` exit 1 | Name is not a dependency — 1.4 no longer adds it |
| Older Bun cannot read lockfile | Nested overrides wrote `lockfileVersion: 3` |
| Warm isolated install still slow | Enable `globalStore` (isolated only) |
