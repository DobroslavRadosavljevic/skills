# Route Colocation

Enforce how page and layout code sits next to file-based routes in TanStack Start
apps. Mechanism comes from TanStack Router's `routeFileIgnorePrefix` (default `-`).

Official docs:

- [Routing concepts — excluding files/folders](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts)
- [File-based routing API — `routeFileIgnorePrefix`](https://tanstack.com/router/latest/docs/framework/react/api/file-based-routing)

## Why

Route-owned UI, hooks, and helpers should live beside the route that owns them.
That keeps features movable, reviews scannable, and accidental URL routes rare.

## Tokens (do not mix up)

| Token | Meaning | Affects URL? | Affects layout tree? |
| --- | --- | --- | --- |
| `_name/` or `_name.tsx` | Pathless layout | No | Yes (`Outlet` wrapper) |
| `-name` / `-folder/` | Ignored from route generation | No | No |
| `(group)/` | Organizational folder only | No | No |
| `route.tsx` | Directory route / layout config | Parent path | Yes |
| `index.tsx` | Index child of parent | Parent path | Yes |

**Never** put non-route modules under `src/routes` without a `-` prefix (or
another configured ignore). An unprefixed `helpers.ts` becomes a route.

## Ownership rules

1. **Layout-owned code** lives under the pathless layout folder:

   ```text
   routes/_dashboard/
     route.tsx
     -components/shell.tsx
     -components/sidebar.tsx
     -hooks/use-dashboard-nav.ts
   ```

2. **Page-owned code** lives under that page's folder. Prefer every page as a
   directory with `index.tsx` (not a flat `page.tsx` leaf):

   ```text
   routes/_dashboard/settings/
     index.tsx
     -components/settings-page.tsx
     billing/
       index.tsx
       -components/billing-page.tsx
       -hooks/use-checkout.ts
       -lib/map-invoice.ts
   ```

3. **Cross-cutting shared code** stays outside routes:

   - Feature-reusable (2+ consumers): `src/modules/<feature>/` — see
     [Modules vs routes](#modules-vs-routes)
   - App-wide UI toolkit: `src/components/` (forms, root document, shared loading)
   - Shared UI packages / design system: follow the repo's package layout
   - Domain packages: follow the repo's package layout
   - Non-feature infra: `src/lib/`

4. **Reuse test:** if only one layout or one page imports it, colocate under
   that route with a `-` folder. If two or more routes/layouts need it (or it is
   a shared feature API like an auth client), put it in `src/modules/<feature>/`.

5. **Prefer folder + `index.tsx` for every page.** Avoid flat leaf route files
   (`credits.tsx`, `login.tsx`, `about.tsx`) when the page may grow colocated
   modules. Use hyphenated folder names that read as English:

   ```text
   # Preferred
   routes/_auth/sign-in/index.tsx
   routes/_auth/sign-up/index.tsx
   routes/_dashboard/settings/billing/index.tsx

   # Avoid for pages that need colocation room
   routes/_auth/login.tsx
   routes/_dashboard/settings/billing.tsx
   ```

   Exceptions: `__root.tsx`, pathless/layout `route.tsx` only. Flat leaves remain
   valid TanStack Router syntax; prefer folders so `-components` / `-hooks` /
   `-lib` have a clear owner.

## Modules vs routes

Feature modules live under `src/modules/<feature>/`, named after the product
capability (`authentication`, `users`, `billing`, …). Prefer one hook or helper
file per operation under `hooks/` / `lib/` (plus imperative helpers for route
`beforeLoad` when needed).

| Home | Owns | Test |
| --- | --- | --- |
| `src/modules/<feature>/` | Reusable feature code | Would another page/layout import this? |
| `src/routes/…` | URL tree, gates, route-only UI | Only this route touches it? |
| `src/components/` | App-wide UI primitives | Toolkit, not a product feature |

Rules:

1. **Default to the route.** New page UI → `routes/…/-components`.
2. **Promote on reuse.** Second consumer → move to `modules/<feature>/`.
3. **Don't preempt.** Don't move a one-page schema "just in case."
4. **Modules must not own TanStack route files.** URL stays under `src/routes`.
5. **Routes may import modules; modules must not import `src/routes/**`.**
6. **No module barrel `index.ts`.** Import concrete files
   (`@/modules/billing/hooks/use-checkout`), never `@/modules/billing`.
7. Prefer `schema/`, `hooks/`, `lib/`, and shared `components/` inside a module
   before introducing heavier service layers.

Typical module shape:

```text
src/modules/authentication/
  client.ts
  get-session.ts
  hooks/
    use-session.ts
    use-sign-in.ts
    use-sign-out.ts
  schema/
    sign-in.ts
  # no index.ts barrel
```

Route-only page stays colocated:

```text
src/routes/_auth/sign-in/
  index.tsx
  -components/sign-in-page.tsx   # deep-imports hooks/schema from modules
```

## Allowed ignored folders

Prefer short role folders, all hyphen-prefixed:

| Folder | Put here |
| --- | --- |
| `-components/` | React UI used only by this route or layout |
| `-hooks/` | React hooks owned by this route or layout |
| `-lib/` | Pure helpers, mappers, constants for this route |
| `-server/` | Route-local server-only helpers (still prefer `.server.ts` when Start import protection applies) |
| `-context/` | Route-local React context providers |
| `-types/` | Types used only by this route tree |

Single ignored files are fine when one module is enough:

```text
routes/_auth/-split.tsx
routes/posts/-posts-table.tsx
```

Do not invent deep role piles (`-components/ui/widgets/...`). Keep one ignored
role folder, then short leaf names.

## Thin route files

`route.tsx` / `index.tsx` should mostly:

- export `createFileRoute(...)({ ... })`
- declare `beforeLoad` / `loader` / `validateSearch`
- compose colocated pieces

Prefer `credits/index.tsx` over a flat `credits.tsx` leaf when the page owns UI.

Move non-trivial JSX into `-components`. Move reusable stateful logic into
`-hooks`. Keep one-liner markup inline.

Threshold guideline: when a route file grows past ~80–100 lines of UI, extract
named sections into `-components`.

## Typed hooks in colocated files

In `-components` / `-hooks`, use `getRouteApi` instead of importing `Route`
(avoids circular imports and keeps lazy chunks smaller):

```tsx
import { getRouteApi } from '@tanstack/react-router'

const routeApi = getRouteApi('/_dashboard/settings/billing/')

export function PlanCard() {
  const data = routeApi.useLoaderData()
  return <div>{/* ... */}</div>
}
```

Use the exact route id from `routeTree.gen.ts` / `createFileRoute`.

## Target shape

```text
src/routes/
  __root.tsx
  _dashboard/
    route.tsx
    -components/
      shell.tsx
      sidebar.tsx
    app/
      index.tsx
      -components/
        dashboard-page.tsx
      settings/
        index.tsx
        -components/
          settings-page.tsx
        billing/
          index.tsx
          -components/
            billing-page.tsx
  _auth/
    route.tsx
    -components/
      split.tsx
    sign-in/
      index.tsx
      -components/
        sign-in-page.tsx
    sign-up/
      index.tsx
      -components/
        sign-up-page.tsx
  _marketing/
    route.tsx
    -components/
      header.tsx
      footer.tsx
    index.tsx

src/components/          # cross-layout only
  form/
  route-loading.tsx
  root-document.tsx

src/modules/             # reusable feature code (2+ consumers)
  authentication/
  billing/
```

Adapt pathless layout names (`_dashboard`, `_auth`, `_marketing`) to the app.
Keep the ownership rules the same.

## Good vs bad

**Good — page is a folder with `index.tsx`:**

```text
routes/_dashboard/app/settings/billing/
  index.tsx
  -components/billing-page.tsx
```

**Bad — flat page leaf that blocks colocation:**

```text
routes/_dashboard/app/settings/billing.tsx
```

**Good — layout chrome colocated:**

```text
routes/_marketing/
  route.tsx                 # imports Header/Footer from -components
  -components/header.tsx
  -components/footer.tsx
  index.tsx
```

**Bad — parallel mirror tree:**

```text
routes/_marketing/route.tsx
src/components/marketing/header.tsx   # only used by _marketing
src/components/marketing/footer.tsx
```

**Good — ignored helpers:**

```text
routes/_dashboard/app/keys/
  index.tsx
  -lib/columns.ts
  -hooks/use-keys-filters.ts
```

**Bad — accidental route:**

```text
routes/_dashboard/app/keys/
  index.tsx
  columns.ts                # becomes a /app/keys/columns route
```

**Bad — wrong token:**

```text
routes/(dashboard)/         # group only — no layout Outlet
  app.tsx
# Need a shared shell? Use _dashboard/route.tsx instead.
```

## Agent checklist

When adding or moving page/layout UI, hooks, or helpers:

1. Create the page as `routes/…/<segment>/index.tsx` — prefer over a flat `<segment>.tsx` page file.
2. Default new UI to `routes/…/-components` (or `-hooks` / `-lib`) next to the owner.
3. If a second route needs the same code, promote it to `src/modules/<feature>/`.
4. Keep `route.tsx` / `index.tsx` files thin; import from ignored folders or modules.
5. Use `getRouteApi` in colocated modules that need route state.
6. Leave app-wide toolkit pieces in `src/components` or the repo's shared UI package.
7. After renames, regenerate the route tree via the app's normal Start/Vite or `tsr generate` flow — do not hand-edit `routeTree.gen.ts`.
8. Confirm no new unprefixed non-route files appeared under `src/routes`.
9. Confirm modules never import from `src/routes`.

## Migration policy

- **Enforce on all new and touched code.**
- When editing a layout that still imports layout-only modules from a shared
  `src/components/<layout>/` tree, prefer moving those into the matching
  `routes/_…/-components` (and related `-` folders) in the same change when the
  diff stays focused.
- Do not mass-migrate unrelated pages in the same change unless asked.
