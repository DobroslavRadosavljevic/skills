# Organization Model

Gold-standard reference for `reorganize`. Reuse the **rules**, not any one
project's folder names. Names stay descriptive; the tree carries relatedness.

Companion files:

- Split decision rules: [split-heuristics.md](split-heuristics.md)
- Concrete trees: [examples.md](examples.md)

## Why this shape works

- Domain folders group code that changes together
- Each file owns one concern; large mixed files become a small tree
- Related types, operations, tests, and errors sit beside each other
- Names describe the thing; they are not abbreviated for path length
- Public contracts stay stable; internals may fan out underneath

## Domain → concern → file

1. Pick the **domain** (or existing role bucket the archetype already uses:
   `queries`, `services`, `components`, `hooks`, `lib`, …).
2. Add a **subfolder** when several files share a tighter identity
   (`invoices/`, `session/`, `event-row/`).
3. Name each **file** after the one concern it owns. Descriptive multi-word
   names are preferred over vague short ones.
4. Keep tests beside sources, or in a local `tests/` only when the package
   already does that.

Path should read as a map of ownership: `billing/invoices/create.ts`,
`auth/session/refresh.ts`, `orders/detail-panel.tsx`.

## Vertical slice over technical soup

Prefer grouping by **product/domain slice** when the local architecture allows
it. A billing invoice create flow (schema, service function, errors) should sit
near itself — not three `index.ts` barrels in `controllers/`, `services/`,
`models/` that each mix every domain.

Layer folders are acceptable **when the project already uses them**. Then group
**by domain inside** each layer, and still split oversized files.

```text
# Prefer (feature slice), when the repo is already slice-shaped
billing/invoices/create.ts
billing/invoices/create.test.ts

# Acceptable (layer + domain), when the repo is already layer-shaped
services/billing/invoices/create.ts
routes/billing/invoices/create.ts
```

Never invent a second architecture. Match the local archetype, then apply
cohesion inside it.

## When to add a folder vs a file

| Signal | Action |
| --- | --- |
| Two+ related files, or one file about to split into two+ | Folder named for the shared domain |
| One cohesive unit, still small | Single descriptive file is fine |
| Types used only by one module | Colocate `types.ts` in that folder |
| Types used across a domain | Domain-level `types.ts`, not a global dump |
| Errors specific to one operation | `errors/` under that operation or domain |
| Private helpers for one folder | Same folder, named for the operation |
| Public import path must not change | Thin facade or re-export at the old path; internals in a folder |
| Five unrelated domains in one `lib/` | Category folders (`money/`, `dates/`, `html/`), not `misc.ts` |

## Public vs private

| Kind | How to reorganize |
| --- | --- |
| Published package export | Keep the export path; split internals behind it |
| App-internal module | Move freely; update imports |
| Framework route / page file | Keep the framework-required filename; extract everything else beside it |
| Applied migration / generated file | Do not move unless asked |
| Trust bucket (`public/` / `private/`) | Reorganize inside; do not flatten |

## Top-level role buckets (adapt, do not copy blindly)

| Folder | Role |
| --- | --- |
| `queries/`, `repos/`, `data/` | Data access grouped by domain |
| `services/`, `use-cases/` | Domain services (folder = service id) |
| `components/`, `hooks/`, `screens/` | UI surfaces |
| `errors/`, `types/`, `contracts/` | Shared contracts / errors |
| `seed/`, `fixtures/`, `benchmark/` | Focused operational concerns |

A service that has grown past one file becomes a folder of named concerns, not
`service.ts` plus `utils.ts`.

## Adapting by archetype

| Archetype | Keep | Apply |
| --- | --- | --- |
| Workspace package | Role buckets that match ownership | Domain folders + one concern per file |
| API / ingest feature | `public/` / `private/` / `internal/` | Split inside; group by subdomain |
| UI subtree | Existing primitive/component conventions | No mega page/form files; extract related pieces |
| Utils domain | Category folders (`url/`, `text/`) | Operation files by concern |
| Route-driven app | Framework file names (`$id.tsx`, `route.ts`) | Colocate extracted modules next to the route |
| Monorepo package | Package `exports` map | Split internals; do not churn public export paths |

Never copy data-layer folders (`queries/`, `rows/`) into a React feature just
because another package uses them.

## What not to optimize

- Do not shorten accurate names
- Do not move applied migrations, public SDK entrypoints, or generated paths
  unless the user asks
- Do not extract a file for a 20-line helper used once with no growth
- Do not create barrels unless the subtree already uses them
- Do not split a cohesive exhaustive table just to chase a LOC budget
- Do not introduce a competing folder scheme beside an existing sound one
