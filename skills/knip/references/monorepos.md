# Monorepos and Workspaces

Knip analyzes all workspaces in one run, with cross-workspace imports, per-workspace plugins, and per-workspace dependency checks. Behavior below was verified on 6.40.0 with a two-workspace fixture.

## Contents

- [How Knip finds workspaces](#how-knip-finds-workspaces)
- [Config shape](#config-shape)
- [Dependency rules across workspaces](#dependency-rules-across-workspaces)
- [Internal packages vs published packages](#internal-packages-vs-published-packages)
- [Running a subset](#running-a-subset)
- [Integrated monorepos](#integrated-monorepos)
- [Catalogs](#catalogs)
- [Monorepo checklist](#monorepo-checklist)

## How Knip finds workspaces

A workspace is a directory with a `package.json`. Sources, merged:

- root `package.json#workspaces` (array, or legacy `{ packages: [...] }`) — npm, Yarn, Bun, Lerna;
- `pnpm-workspace.yaml#packages`;
- keys of the Knip `workspaces` object (directories not listed elsewhere are added).

The root workspace is named `"."`. Workspaces cannot be nested inside Knip config keys; each workspace is keyed by its path from the root (globs allowed).

## Config shape

```jsonc
{
  "$schema": "https://unpkg.com/knip@6/schema-jsonc.json",
  "workspaces": {
    // Root workspace: repo scripts and root tool configs.
    ".": {
      "entry": ["scripts/*.ts"],
      "project": ["scripts/**/*.ts"]
    },
    // Glob key: defaults shared by every package.
    "packages/*": {
      "includeEntryExports": true
    },
    // Exact key: wins for this workspace.
    "apps/web": {
      "entry": ["src/main.tsx!"],
      "project": ["src/**/*.{ts,tsx,css}!"]
    }
  },
  "ignoreWorkspaces": ["services/go-api"],
  "treatConfigHintsAsErrors": true
}
```

Rules:

- With a monorepo, **top-level `entry` and `project` are ignored**. Knip prints `entry-top-level` / `project-top-level` hints. Put root files under `"."`.
- Each workspace starts with the same defaults (`{index,cli,main}` entries, `src/` variants, `package.json` `main`/`bin`/`exports`, plugins enabled by **that workspace's** dependencies).
- Root plugin settings and root `ignoreExportsUsedInFile`, `includeEntryExports`, `ignoreGlobalBinaries` are inherited; a workspace value overrides.
- Start with only `$schema` + `treatConfigHintsAsErrors`, run Knip, then add workspace entries where `workspace-unconfigured` hints or unused files point.
- A `workspaces` key that matches nothing triggers a `workspaces` hint (6.18+).
- `ignoreWorkspaces` is for non-JS workspaces or a last resort; suffix `!` ignores only in production mode. A `!` prefix re-includes a workspace matched by an earlier glob.

## Dependency rules across workspaces

- A dependency must be listed in the `package.json` of the workspace that imports it. Imports satisfied only by hoisting are `unlisted`.
- Default mode: a workspace may also use dependencies of its ancestors (the root). Root `devDependencies` such as `typescript`, `vitest`, `eslint` therefore cover all workspaces.
- If a dependency is listed in both the root and a workspace but used only in that workspace, the root entry is reported unused: remove it from the root.
- Internal workspace packages must be imported by package name and listed as dependencies (`"@org/lib": "workspace:*"`). Relative imports into another workspace (`../../packages/lib/src`) break this: fix the import.
- `--strict` (implies `--production`): each workspace may use only its own `dependencies` plus required `peerDependencies`. No ancestor dependencies, no `devDependencies`. Verified: a package that imports a module declared only in its `devDependencies` reports it as `unlisted` under `--strict`.
- Production types under `--strict`: type-only imports may stay in `devDependencies` unless they leak into the built `.d.ts` files (followed via `main`, `types`, `typings`, `exports`, `typesVersions`, pnpm `publishConfig`); then they must be `dependencies` or required peers. Private workspaces and `publishConfig.directory` packages are skipped for this check.

## Internal packages vs published packages

Exports reachable from `package.json#exports`/`main` are entry exports, and entry exports are not reported by default. In a monorepo that hides dead code in internal packages. Verified on 6.40.0: an unused export in an internal package is only reported after `includeEntryExports: true` on that workspace.

| Workspace kind | Setting |
| --- | --- |
| Internal (private, consumed only inside the repo) | `"includeEntryExports": true` on its workspace key. Consumers are in the same graph, so unused exports are real. |
| Published library | Leave `includeEntryExports` off (consumers are external). Mark intentional public API that is still unused internally with `@public`. Run `knip --production --strict` in CI. |
| Application | `"includeEntryExports": true`; an app's entry files are not an API. |

## Running a subset

```sh
bunx knip --workspace @org/web                 # by package name
bunx knip --workspace './apps/*'               # by directory glob
bunx knip --workspace '@org/*' --workspace '!@org/legacy'
bunx knip --workspace @org/web --strict        # isolated
```

- A filtered run also includes the workspace's ancestors, the workspaces it depends on, and the workspaces that depend on it (so exports used by dependents are not misreported). `--strict` drops this expansion.
- Running Knip from inside a workspace directory also isolates it, but config and workspace discovery then start from that directory. Prefer `--workspace` from the root so one config stays the source of truth.
- Configuration hints still appear in filtered runs (6.17.2+).
- CI on large repos: run the whole repo in one job (shared graph is faster than N runs). Split by `--workspace` only for memory or time limits.

## Integrated monorepos

One `package.json`, many projects (Nx "integrated" style). Knip treats it as one workspace. Use broad but exact globs and plugin overrides:

```json
{
  "entry": ["{apps,libs}/**/src/index.{ts,tsx}!", "apps/*/src/main.{ts,tsx}!"],
  "project": ["{apps,libs}/**/src/**/*.{ts,tsx}!"],
  "eslint": { "config": ["{apps,libs}/**/eslint.config.{js,ts}"] },
  "cypress": { "entry": ["apps/**/cypress.config.ts", "apps/**/cypress/e2e/*.cy.ts"] }
}
```

Run `NX_DAEMON=false knip` if Nx config loading hangs.

## Catalogs

Knip reads catalogs from `pnpm-workspace.yaml` (`catalog`, `catalogs`), `.yarnrc.yml`, root `package.json` (`catalog`, `catalogs`), and Bun's `package.json#workspaces.catalog(s)`. References are resolved from `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`, `resolutions`, and pnpm `overrides`.

- `catalog`: unused catalog entry → `knip --fix-type catalog`.
- `catalogReferences`: `catalog:` specifier with no matching entry → add it to the catalog.
- Both are part of `--dependencies` and are excluded in `--production`.

## Monorepo checklist

- [ ] One root `knip.json`; no `knip.json` inside workspaces.
- [ ] No top-level `entry`/`project`; root files under `workspaces["."]`.
- [ ] Every workspace that imports a package lists it; no relative cross-workspace imports.
- [ ] `includeEntryExports: true` for internal packages and apps.
- [ ] `knip --production --strict` passes for published packages (CI job).
- [ ] `ignoreWorkspaces` only for non-JS workspaces, each with a reason.
- [ ] Zero hints with `treatConfigHintsAsErrors: true`.
