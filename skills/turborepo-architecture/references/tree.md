# Canonical trees (Turborepo monorepo)

## Repo layout

```text
/
  package.json                 # workspaces + catalog + root scripts
  turbo.jsonc                  # task graph / cache rules
  tsconfig.base.json           # shared TS defaults
  knip.ts                      # optional root-only (see with-knip)
  compose*.yml                 # optional local infra (see with-compose-local)
  Dockerfile.<app>             # optional prune deploy (see with-docker-deploy)

  apps/<app>/
    package.json               # @org/<app>
    .env · .env.example
    src/env.ts                 # validated env
    src/…                      # app entry + feature trees
    tsconfig.json              # extends ../../tsconfig.base.json
    oxlint.config.ts · oxfmt.config.ts   # when using those overlays
    vitest*.config.ts · tests/           # when using Vitest overlay

  packages/<pkg>/
    package.json               # @org/<pkg>
    src/index.ts               # typical export
    … quality tooling same as apps …
```

## Workspace globs (Bun example)

```json
{
  "workspaces": {
    "packages": ["apps/*", "packages/*", "packages/<nested>/*"],
    "catalog": {}
  },
  "packageManager": "bun@…"
}
```

## Package entry (internal)

```json
{
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@org/other": "workspace:*",
    "effect": "catalog:"
  }
}
```

## Turbo tasks (core shape)

| Task | dependsOn | cache | notes |
| --- | --- | --- | --- |
| `transit` | `^transit` | default | no-script DAG walker |
| `typecheck` | `transit` (+ typegen if needed) | yes | |
| `test` | `transit` | yes | unit only via package scripts |
| `test:integration` | `transit` | yes | |
| `build` | `^build`, `transit` | yes | declare `outputs` |
| `lint` | — | yes | |
| `lint:fix` / `format` | — | **false** | mutators |
| `format:check` | — | yes | |
| `dev` / `start` | — | **false**, persistent | |
| `typegen` | — | **false** | opt-in packages only |

## Scripts per workspace (canonical set)

```json
{
  "typecheck": "tsc --noEmit -p tsconfig.json",
  "test": "vitest run --project unit --passWithNoTests",
  "test:watch": "vitest --project unit",
  "test:integration": "vitest run --project integration --passWithNoTests",
  "lint": "bun --bun oxlint",
  "lint:fix": "bun --bun oxlint --fix",
  "format": "oxfmt",
  "format:check": "oxfmt --check"
}
```

Apps with a process also define `dev` / `start`.

## Filter examples

```bash
# Full graph (verification)
bun run typecheck && bun run test

# Single workspace (iteration)
bunx turbo run typecheck --filter=@org/credits
bunx turbo run dev --filter=@org/api
```
