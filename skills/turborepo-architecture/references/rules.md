# Rules and anti-patterns (Turborepo core)

## MUST

1. Declare workspace globs for apps and packages; use `workspace:*` for internal deps.
2. Pin shared third-party versions in one place (catalog or root) and consume consistently.
3. Put cache/orchestration rules in `turbo.json(c)` — including `transit` for parallel typecheck/test.
4. Mark `dev`/watch/`format`/`lint:fix`/`typegen` appropriately uncached.
5. Keep apps responsible for process entry + env; packages expose factories/options.
6. Export internal TypeScript packages from `src` (or document why `dist/` is required).
7. Prefer package-name filters for DX scripts.
8. Delete obsolete shims when changing boundaries — update callers in the same change.
9. Run full-graph quality gates when finishing substantive work (unless user defers).

## MUST NOT

1. Recurse: package `"build": "turbo run build"` while turbo is already running `build`.
2. Read `process.env` inside reusable package library code.
3. Relative imports that escape into another package’s `src` instead of `workspace:*`.
4. Add per-package Knip scripts when Knip is configured root-only (see overlay).
5. Keep dual-write / deprecated path “just in case” in active-development monorepos.
6. Treat `--filter` mid-edit runs as a substitute for the closing full-graph gate.

## Soft defaults

- Shared `tsconfig.base.json`; packages `extends` it.
- Root convenience scripts: `dev:<app>`, `db:*`, `compose:*`.
- Multi-entry `exports` only when consumers need subpaths.
- Named scopes encode boundaries (`@org/*` platform, `@runtime/*` nested worker libs).

## Anti-patterns → fix

| Smell | Fix |
| --- | --- |
| All apps import each other’s `src/` via `../../` | Workspace packages + exports |
| No `transit`; typecheck uses `^build` always | Add transit node for TS-only graphs |
| Cached `format` that rewrites files | `cache: false` |
| Secrets in package defaults | App env → `.make({ secret })` |
| Compatibility re-exports forever | Delete + update callers |

## Conflict with local docs

If `AGENTS.md` / CONTRIBUTING defines different workspace rules, follow the repo unless the user asks to migrate.
