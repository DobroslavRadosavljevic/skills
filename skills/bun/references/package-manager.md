# Package Manager

Bun’s built-in package manager: install, lockfile, workspaces, trust, and CI.

## Core commands

```sh
bun install                 # install deps from package.json / lockfile
bun ci                      # frozen lockfile install (CI preferred)
bun install --frozen-lockfile
bun add <pkg>[@version]     # add dependency
bun add -d <pkg>            # devDependency
bun add -O <pkg>            # optionalDependency
bun add -p <pkg>            # peerDependency (confirm flag in current CLI help)
bun add -g <pkg>            # global
bun remove <pkg>
bun update [pkg]
bun outdated
bunx <pkg> [args]           # execute package binary (npx equivalent)
bun pm ls
bun pm whoami
bun pm bin
bun pm cache
bun pm hash
bun pm untrusted
bun pm trust <pkg>
bun pm migrate              # when migrating lockfiles — confirm current help
```

`bun install` is the default entry; `bun i` is an alias.

## Lockfile

- Default text lockfile: **`bun.lock`** (since Bun 1.2+).
- Legacy binary: **`bun.lockb`** — migrate to text when possible.
- **Commit the lockfile.**
- CI: `bun ci` or `bun install --frozen-lockfile` so installs fail on drift.

First install in a repo with npm/yarn/pnpm lockfiles can import resolution; afterward treat `bun.lock` as source of truth and remove other lockfiles to avoid dual maintenance.

### configVersion / linker

Lockfile metadata may record `configVersion` and linker mode:

- **isolated** — stricter, pnpm-like layout; common default for new workspaces.
- **hoisted** — flatter `node_modules`; common for older / migrated projects.

Set in `bunfig.toml`:

```toml
[install]
linker = "isolated" # or "hoisted"
```

Do not change linker casually — reinstall and retest the monorepo.

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
bun run --filter './apps/*' build
bun run --filter pkg-name test
```

Filters accept paths, package names, and patterns. Prefer explicit filters over `cd` + install in each package.

## Catalogs

Share dependency versions across workspaces (Bun catalogs):

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

Exact catalog syntax can include named catalogs (`catalog:react19`) — confirm against current docs when using multiple catalogs.

## Overrides / resolutions

Force a transitive version:

```json
{
  "overrides": {
    "foo": "1.2.3"
  }
}
```

Bun honors `overrides` (and may read yarn-style `resolutions` during migration — prefer `overrides` going forward).

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

After adding packages with native `postinstall` (sharp, prisma engines, etc.), always check untrusted list if binaries are missing.

## .npmrc and registries

Bun reads many `.npmrc` settings (registry, auth tokens, `@scope:registry`). Prefer:

- Project `.npmrc` for registry/auth
- `bunfig.toml` `[install]` for Bun-specific install behavior
- Env vars for CI secrets (`NPM_TOKEN`, etc.)

Private registries: configure scope registry + auth token; then `bun install` as usual.

## Exact versions / save behavior

```toml
[install]
exact = true
```

Or CLI flags on `bun add` (`--exact`) so lockfile and package.json pin exact versions when the team prefers that.

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

Use patches for urgent upstream fixes; prefer upstream PRs for long-term.

## CI pattern

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: 1.3.14
- run: bun ci
- run: bun test
- run: bun run build
```

Cache Bun’s install cache when CI supports it (setup-bun / cache actions). Always freeze the lockfile in CI.

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

## Troubleshooting

| Issue | Action |
|---|---|
| Lockfile conflict noise | Prefer text `bun.lock`; rebase carefully; regenerate with `bun install` if corrupt |
| Phantom missing binary | `bun pm untrusted` / trust postinstall packages |
| Peer dependency warnings | Align versions; use catalogs/overrides |
| Isolated install breaks tool expecting hoisting | Try `linker = "hoisted"` only after validating; or fix package to not require hoisting |
| Auth 401 to private registry | Check `.npmrc` / env token / scope registry URL |
