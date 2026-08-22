---
name: turborepo-architecture
description: >-
  Enforce portable Turborepo + workspace monorepo house style: apps/packages
  layout, catalog pins, turbo.jsonc transit/cache rules, package scopes and
  exports, env ownership, scripts, filters, and dependency boundaries. Use when
  scaffolding a monorepo, adding a workspace, reviewing turbo/package layout, or
  when the user asks for turborepo-architecture. Optional with-* overlays for
  catalog, Knip, Oxlint/Oxfmt, Vitest workspaces, env packages, Effect packages,
  typegen, nested scopes, Docker prune, boundaries, and local compose. Not a
  Turbo CLI docs skill.
disable-model-invocation: true
---

# Turborepo Architecture

Portable monorepo house style for Turborepo + Bun/pnpm workspaces. Use this
skill alone — it does not depend on other skills.

**Job:** workspace wiring, package boundaries, turbo tasks/cache, root scripts.

**Not this skill:** Turbo CLI deep docs, remote cache vendor setup, or feature
module trees inside an app (HTTP routes / Start pages belong to app architecture
docs for that stack).

If the target repo already documents monorepo rules (e.g. `AGENTS.md`) and it
conflicts, **repo wins** unless the user asks to migrate toward this skill.

## Stack defaults (core)

| Piece | Default |
| --- | --- |
| Package manager | Bun workspaces (pnpm/npm OK if already used) |
| Layout | `apps/*`, `packages/*` |
| Orchestration | Turborepo (`turbo.jsonc` / `turbo.json`) |
| Internal packages | `"exports": { ".": "./src/index.ts" }` — Bun runs TS directly |
| Env | Apps own `.env` + T3 Env `src/env.ts`; packages take `.make(options)` |
| Verification | Full graph for closing gates; `--filter` for mid-edit iteration |

## Modes

1. **Scaffold** — new app/package from [checklist.md](references/checklist.md) + [tree.md](references/tree.md).
2. **Apply** — add scripts, deps, turbo participation correctly.
3. **Review** — compare to [rules.md](references/rules.md); propose moves.

## Hard rules (core)

1. **Workspaces + shared pins** — shared deps via catalog (or equivalent); workspace deps via `workspace:*`.
2. **Turbo orchestrates scripts** — it is not the package manager. Package scripts must not recurse into `turbo run` for the same task.
3. **`transit` DAG** — use a no-script `transit` / `topo` node with `dependsOn: ["^transit"]` so `typecheck` / `test` can run in parallel while invalidating on dependency source changes.
4. **Persistent / mutating tasks are uncached** — `dev`, watch servers, `format`, `lint:fix`, `typegen` → `cache: false` (+ `persistent: true` for long-lived processes).
5. **Lint/format/test/typecheck are per-workspace scripts** that Turbo runs (skip packages without the script).
6. **Apps own env; packages never read `process.env`** in library code — pass options into factories/Layers.
7. **Internal entry = `./src/index.ts`** unless the package is publishable/built (`dist/`).
8. **Filter by package name** — `--filter=@org/api`, not by accident-only folder paths.
9. **Prefer clean breaking changes** in active monorepos — delete shims/dual-writes/deprecated aliases in the same change; update callers together.
10. **Closing verification = full graph** unless the user explicitly defers quality gates.

Details: [rules.md](references/rules.md), [tree.md](references/tree.md), [examples.md](references/examples.md).

## Progressive disclosure

| Need | Read |
| --- | --- |
| Canonical trees | [references/tree.md](references/tree.md) |
| Rules + anti-patterns | [references/rules.md](references/rules.md) |
| Scaffold / review checklists | [references/checklist.md](references/checklist.md) |
| Good vs bad layouts | [references/examples.md](references/examples.md) |
| Optional overlays | [Extensions](#extensions) below |

## Extensions

Load **only** when the matching stack is present (or the user asks):

| When | Extension |
| --- | --- |
| Bun `workspaces.catalog` / named catalogs | [with-catalog.md](references/with-catalog.md) |
| Root-only Knip | [with-knip.md](references/with-knip.md) |
| Per-package Oxlint + Oxfmt | [with-oxlint-oxfmt.md](references/with-oxlint-oxfmt.md) |
| Vitest scripts + turbo test tasks | [with-vitest-workspaces.md](references/with-vitest-workspaces.md) |
| App env vs package `.make` | [with-env-packages.md](references/with-env-packages.md) |
| Effect services in packages | [with-effect-packages.md](references/with-effect-packages.md) |
| Opt-in typegen / OpenAPI codegen | [with-typegen.md](references/with-typegen.md) |
| Nested `packages/<group>/*` + second scope | [with-engine-nested.md](references/with-engine-nested.md) |
| `turbo prune --docker` + empty Root Directory | [with-docker-deploy.md](references/with-docker-deploy.md) |
| Explicit may/must-not import tables | [with-dependency-boundaries.md](references/with-dependency-boundaries.md) |
| Root compose helpers for local infra | [with-compose-local.md](references/with-compose-local.md) |

## Boundary vs app architecture

This skill owns **monorepo wiring and package boundaries**. Inside an app, feature
folder trees (Elysia modules, TanStack Start routes) belong to that app’s
architecture guidance — do not invent a second HTTP/UI layout here.
