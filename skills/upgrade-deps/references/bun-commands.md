# Bun Commands For Upgrades

Verified against `bun@1.4.2` (`bun <cmd> --help`) and the Bun docs on 2026-10-09. Re-run `bun <cmd> --help` if the local Bun is older or newer. Do not invent flags.

## Contents

- Inventory
- Update and add
- Audit
- Lockfile, dedupe, explain
- Trust and install scripts
- Release age and scanner
- Catalogs and overrides
- npm and pnpm equivalents

## Inventory

```sh
bun outdated                      # current workspace: Current / Update / Latest columns
bun outdated -r                   # every workspace; catalog entries appear as "catalog (<workspace>)"
bun outdated --filter './apps/*'  # filter by workspace path or name
bun outdated --filter '!web'      # exclude a workspace
bun outdated 'is-*'               # filter by package-name pattern
bun outdated '!typescript'
```

- **Update** = highest version inside the current range. **Latest** = highest published stable. A row where Update < Latest is a range-blocked major or minor.
- `bun pm ls --all` prints the full tree from the lockfile.
- `bun info <pkg>` and `bun info <pkg>@<version>` read registry metadata. Add a property path to narrow it, for example `bun info zod dist-tags --json`, `bun info esbuild scripts --json`, `bun info <pkg> maintainers --json`, `bun info <pkg> time --json`. `bun info` needs a `package.json` in the working directory. Check the output shape once; it follows npm registry metadata.
- `bun why <pkg>` (alias of `bun pm why`) explains why a package is installed; supports globs and `--top`, `--depth <n>`.

## Update And Add

`bun update` (alias `bun up`):

```sh
bun update --dry-run              # preview; no writes
bun update                        # newest version inside each range; also refreshes transitives in bun.lock
bun update zod jquery@3           # named packages, optional version/range
bun update '@types/*'             # glob include
bun update '!webpack'             # everything except
bun update --latest               # -L: direct deps to latest, ignoring ranges; rewrites package.json
bun update --latest vite          # one package to latest
bun update --dev                  # -d: only devDependencies
bun update --prod                 # -p: only dependencies + optionalDependencies
bun update --no-optional          # skip optionalDependencies
bun update --exact                # -E: write exact versions instead of ^ or ~
bun update -r                     # every workspace's package.json
bun update --filter './packages/*' zod
bun update --no-save              # node_modules only; leave package.json and bun.lock alone
bun update --ignore-scripts       # skip the project's own lifecycle scripts
bun update --minimum-release-age 259200
```

Rules that matter:

- **Never use `-i/--interactive`.** It prompts. Use names, globs, `--filter`, and `--dry-run` instead.
- Without `--latest`, `bun update` keeps the operator (`^1.1.0` -> `^1.2.0`). Exact pins, dist-tags (`latest`, `next`), and odd ranges (`*`, `1.x`, `>=1.0.0`) stay as written; only `bun.lock` moves.
- `--latest` keeps range style on the new version and does not downgrade a package already ahead of `latest` (for example a prerelease).
- Transitives always respect their dependents' ranges. Use `overrides` to force one.
- `bun update` never rewrites `catalog:` references; it updates the catalog entry in the root `package.json`.
- From a workspace member, `bun update` rewrites only that member's `package.json`. From the root, it still refreshes transitives of every workspace in `bun.lock`. Use `-r` or `--filter` for the other members' `package.json`.
- In 1.4, `bun update <name>` errors when the name is not a dependency; it does not add it.

`bun add` (alias `bun a`):

```sh
bun add zod@4.1.0                 # exact version or range spec
bun add -d typescript@<version>   # devDependency
bun add -E react@<version>        # exact pin
bun add zod --filter api          # into one workspace
bun add --catalog react           # root catalog entry + "catalog:" in the workspace
bun add --catalog=testing vitest  # named catalog
bun add --only-missing zod
bun add pkg --dry-run
```

`bun add pkg@version` is the right tool to move one package to a specific version, including a downgrade or a dist-tag (`@next`).

## Audit

```sh
bun audit                         # report; check the exit code in CI
bun audit --json
bun audit --audit-level=high      # low | moderate | high | critical
bun audit --ignore GHSA-xxxx-xxxx-xxxx   # repeatable; record why in the report
bun audit fix --dry-run           # plan only
bun audit fix                     # lowest safe version every dependent's range allows
bun audit fix --latest            # also rewrite your own package.json/catalog ranges to escape a block
bun audit fix --json
```

- `fix` changes `bun.lock` and `node_modules`; it edits `package.json` or a catalog entry only to bump an exact pin.
- Output sections: **fixing**, **blocked by a dependent's range** (your own range: use `--latest`; a third-party range: update the dependent or add an `overrides` entry), **no published version fixes** (replace the package or `--ignore` with a written reason).
- `fix` may install a safe version newer than `--minimum-release-age` and marks it. Review those rows against [supply-chain.md](supply-chain.md).
- `fix` rejects `--prod`, `--frozen-lockfile`, and `--no-save`.
- It upgrades `patchedDependencies` too; re-create the patch afterwards with `bun patch`.
- After installing it re-audits; the exit code reflects the second audit.

## Lockfile, Dedupe, Explain

```sh
bun install                       # resolve and install; writes bun.lock
bun ci                            # frozen-lockfile install for CI
bun install --frozen-lockfile     # fail if bun.lock would change
bun install --lockfile-only       # rewrite bun.lock without installing
bun install --dry-run
bun dedupe --dry-run              # show removable duplicate versions
bun dedupe                        # re-resolve onto versions already in the lockfile, then install
bun dedupe --check                # exit 1 when duplicates remain (CI)
bun pm hash                       # lockfile hash, handy to prove "no change"
bun pm migrate                    # convert another manager's lockfile without installing
```

- Commit `bun.lock` (text). If the repo still has `bun.lockb`, do not convert it inside an upgrade commit.
- Nested or version-scoped `overrides` write `lockfileVersion` 3, which older Bun cannot read. Check CI and teammates' Bun versions before adding them.
- A new major of a package may duplicate across the tree. Run `bun dedupe --dry-run` after the group and decide whether to dedupe in the cleanup commit.

## Trust And Install Scripts

```sh
bun pm untrusted                  # dependencies with blocked lifecycle scripts
bun pm trust <name>               # run scripts and add to trustedDependencies
bun pm ls --trusted
bun pm default-trusted
bun install --ignore-scripts      # skip the project's own scripts; dependency scripts never run unless trusted
bun add <name> --trust            # add + trust in one step (review first)
```

Dependency lifecycle scripts do not run unless the package is in `trustedDependencies` (or the default trusted list, npm registry only). After a bump, a package that adds a new `postinstall` shows up in `bun pm untrusted`. Review it before trusting. See [supply-chain.md](supply-chain.md).

## Release Age And Scanner

```toml
# bunfig.toml
[install]
minimumReleaseAge = 259200                 # seconds (3 days)
minimumReleaseAgeExcludes = ["@types/bun", "typescript"]

[install.security]
scanner = "<scanner-package>"              # replace with the scanner you use
```

- CLI: `--minimum-release-age <seconds>` on `install`, `add`, `update`, `outdated`.
- `bun pm scan` scans every package in the lockfile for vulnerabilities (needs a configured scanner; check `bun pm --help`).
- A scanner runs on packages about to be installed by `bun install`, `bun add`, `bun update`, and `bun audit fix`; a fatal advisory cancels the install.

## Catalogs And Overrides

```json
{
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "catalog": { "react": "^19.0.0", "zod": "^4.0.0" },
    "catalogs": { "testing": { "vitest": "^4.0.0" } }
  },
  "overrides": { "foo": "1.2.3", "lodash@<4.17.21": "4.17.21" }
}
```

- Members reference `"react": "catalog:"` or `"vitest": "catalog:testing"`.
- Bump a catalog by editing the root entry (or `bun update` from the root), then `bun install`. All members move together, so a catalog bump is a group of its own.
- `bun outdated -r` lists catalog rows separately; check each consuming workspace after the bump.
- Overrides are for security pins and peer fixes. Each override needs a comment-equivalent note in the commit or PR naming its removal condition, and must be re-evaluated on every upgrade pass.

## npm And pnpm Equivalents

Use only when the repo is not on Bun. Do not migrate package managers inside an upgrade.

| Task | Bun | npm | pnpm |
| --- | --- | --- | --- |
| Outdated | `bun outdated -r` | `npm outdated` (workspaces: `--workspaces`) | `pnpm outdated -r` |
| In-range update | `bun update` | `npm update` | `pnpm update` |
| To latest | `bun update --latest` | `npm install pkg@latest` | `pnpm update --latest` |
| Audit | `bun audit` | `npm audit` | `pnpm audit` |
| Audit fix | `bun audit fix` | `npm audit fix` | `pnpm audit --fix` |
| Why | `bun why pkg` | `npm explain pkg` | `pnpm why pkg` |
| Dedupe | `bun dedupe` | `npm dedupe` | `pnpm dedupe` |
| Frozen install | `bun ci` | `npm ci` | `pnpm install --frozen-lockfile` |
| Release age | `minimumReleaseAge` (seconds) in `bunfig.toml` | `min-release-age` (days) in `.npmrc`, npm 11.10+ | `minimumReleaseAge` (minutes) in `pnpm-workspace.yaml` |
| Overrides | `overrides` | `overrides` | `pnpm.overrides` (or `overrides` in `pnpm-workspace.yaml` for newer pnpm) |

Check units: Bun counts seconds, pnpm counts minutes, npm counts days. Verify against the installed version's docs before editing config.
