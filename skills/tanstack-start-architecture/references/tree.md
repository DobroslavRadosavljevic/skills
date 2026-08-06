# Canonical trees (TanStack Start)

Paths are relative to the Start app `src/` (or `apps/<web>/src/` in a monorepo).

## Tokens (do not mix up)

| Token | Meaning | Affects URL? | Affects layout tree? |
| --- | --- | --- | --- |
| `_name/` or `_name.tsx` | Pathless layout | No | Yes (`Outlet` wrapper) |
| `-name` / `-folder/` | Ignored from route generation | No | No |
| `(group)/` | Organizational folder only | No | No |
| `route.tsx` | Directory route / layout config | Parent path | Yes |
| `index.tsx` | Index child of parent | Parent path | Yes |

**Never** put non-route modules under `src/routes` without a `-` prefix (or another configured ignore). An unprefixed `helpers.ts` becomes a route.

## Ownership map

| Home | Owns |
| --- | --- |
| `src/routes/**` | URL tree, `beforeLoad` gates, layout/page UI used only by that route (`-components`, `-hooks`, `-lib`) |
| `src/modules/<feature>/` | Reusable feature code (shared hooks, form schemas, clients used by 2+ routes) |
| `src/components/` | App-wide UI toolkit (shell primitives, form kit, root document helpers) |
| `src/lib/` | Non-feature infra (API error helpers, env wrappers, analytics) |

## Page + colocation

```text
routes/_app/
  route.tsx
  -components/shell.tsx
  -components/sidebar.tsx
  -hooks/use-app-nav.ts
  dashboard/
    index.tsx
    -components/dashboard-page.tsx
  billing/
    index.tsx
    -components/billing-page.tsx
    -hooks/use-billing-summary.ts
    -lib/map-invoice.ts
    credits/
      index.tsx
      -components/credits-page.tsx
```

## Feature module (after reuse gate)

```text
modules/<feature>/
  hooks/
    use-<thing>.ts
  schema/                    # client form / input schemas (optional)
    <form>.ts
  lib/                       # pure helpers shared inside the feature
    <helper>.ts
  components/                # only if reused across routes
    <widget>.tsx
```

Do **not** add a feature-root barrel `index.ts` unless the repo already standardizes on barrels.

Typical feature names mirror backend domains when both exist: `billing`, `users`, `organizations`, `auth`.

## Typical Start entrypoints (do not invent duplicates)

```text
src/
  router.tsx                 # export getRouter() → fresh router each call
  routes/__root.tsx
  routeTree.gen.ts           # generated — do not hand-edit
  start.ts                   # optional createStart (middleware, defaultSsr, …)
  server.ts                  # optional custom server entry
  modules/
  components/
  lib/
```

App root also owns the bundler config (`vite.config.ts` or `rsbuild.config.ts`)
and `package.json`. Do not add a second router factory or parallel route-tree
generator.

## Naming

| Kind | Pattern | Examples |
| --- | --- | --- |
| Page folder | URL segment | `billing/`, `credits/` |
| Page file | always `index.tsx` inside the folder | `billing/index.tsx` |
| Colocated UI | short aspect | `-components/billing-page.tsx` |
| Colocated hook | `use-*` | `-hooks/use-checkout.ts` |
| Module hook | same | `modules/billing/hooks/use-checkout.ts` |

Folder context carries the noun; avoid `billing/billing-page-component.tsx` noise when `billing/-components/page.tsx` or `billing-page.tsx` is enough for scanability.
