---
name: tanstack-start-architecture
description: >-
  Enforce portable TanStack Start app architecture: file-route trees, page
  folders with index.tsx, route colocation (-components/-hooks/-lib),
  reuse-gated src/modules, naming, and import boundaries. Use when scaffolding
  a Start app or feature, adding pages/layouts, reviewing or reorganizing
  route/module layout, or when the user asks for tanstack-start-architecture /
  Start house style. Optional with-* overlays for generated OpenAPI clients,
  Better Auth client, TanStack Query, route gates, TanStack Form, env, client
  authorization, UI package, Effect, and Vitest.
disable-model-invocation: true
---

# TanStack Start Architecture

Portable house style for TanStack Start (`@tanstack/react-start`) apps. Use this
skill alone — it does not depend on other skills.

**Job:** where UI, hooks, and feature code live; folder/file naming; ownership.

**Not this skill:** Start/Router API quirks, SSR adapters, deployment, or latest
framework docs. Prefer current TanStack Start / Router docs for those.

If the target repo already documents architecture (e.g. `AGENTS.md`) and it
conflicts, **repo wins** unless the user asks to migrate toward this skill.

## Stack defaults (core)

| Piece | Default |
| --- | --- |
| Framework | TanStack Start + file-based TanStack Router |
| Pages | Folder + `index.tsx` per page (no flat page leaves) |
| Route-only code | Hyphen-prefixed colocated folders (`-components`, `-hooks`, `-lib`) |
| Reusable features | `src/modules/<feature>/` after a reuse gate |
| App-wide UI | `src/components/` |
| Non-feature infra | `src/lib/` |
| Ignore prefix | Router `routeFileIgnorePrefix` default `-` |

Load matching **with-*** extensions when those stacks are present (see below).

## Modes

1. **Scaffold** — new page/layout/feature from [checklist.md](references/checklist.md) + [tree.md](references/tree.md).
2. **Apply** — place new UI/hooks/helpers in the canonical spots.
3. **Review** — compare to [rules.md](references/rules.md); propose moves; do not invent a parallel layout.

## Hard rules (core)

1. **Every page is `segment/index.tsx`.** Do not add flat page leaves (`billing.tsx` as the page component file). Prefer `billing/index.tsx`.
2. **Route-only modules use a `-` prefix** (or the app’s configured ignore prefix). Unprefixed files under `src/routes` become URLs.
3. **Default new page UI to `routes/…/-components`.** Same for page-only hooks (`-hooks`) and helpers (`-lib`).
4. **Reuse gate for `src/modules/<feature>/`:** promote when a second consumer appears, or for clearly shared clients/schemas used across routes. Do not pre-create empty module trees.
5. **Modules must not import from `src/routes`.** Routes may import modules.
6. **No module barrel `index.ts` by default.** Import concrete paths (`@/modules/billing/hooks/use-checkout`).
7. **App-wide toolkit → `src/components/`;** non-feature infra → `src/lib/`. Do not dump random shared UI into `routes/`.
8. **Pathless layouts** use `_name/` (or `_name.tsx`) when wrapping a section without changing the URL.
9. **Naming:** folder = noun/route segment; leaf = short aspect (`billing-page.tsx`, `use-checkout.ts`). Do not repeat parent path noise in every filename when the folder already carries it.
10. **One job per route folder:** that segment’s page/layout and its colocated private code only.

Details: [rules.md](references/rules.md), [tree.md](references/tree.md), [examples.md](references/examples.md).

## Progressive disclosure

| Need | Read |
| --- | --- |
| Canonical trees + tokens | [references/tree.md](references/tree.md) |
| Enforce rules + anti-patterns | [references/rules.md](references/rules.md) |
| Scaffold / review checklists | [references/checklist.md](references/checklist.md) |
| Good vs bad layouts | [references/examples.md](references/examples.md) |
| Optional stack overlays | [Extensions](#extensions) below |

## Extensions

Load an extension **only** when the matching stack is present (or the user asks).
Extensions add rules; they do not replace the core tree.

| When | Extension |
| --- | --- |
| Generated OpenAPI / Hey-style client | [with-generated-api-client.md](references/with-generated-api-client.md) |
| Better Auth (or session) client module | [with-better-auth-client.md](references/with-better-auth-client.md) |
| TanStack Query + loaders / ensureQueryData | [with-tanstack-query.md](references/with-tanstack-query.md) |
| Pathless auth / onboarding / org gates | [with-route-gates.md](references/with-route-gates.md) |
| TanStack Form + module/route schemas | [with-tanstack-form.md](references/with-tanstack-form.md) |
| `createEnv` / `VITE_` client keys | [with-env.md](references/with-env.md) |
| Pure authz package + client adapters | [with-client-authorization.md](references/with-client-authorization.md) |
| Workspace UI package + Storybook/tokens | [with-ui-package.md](references/with-ui-package.md) |
| Effect Schema / server-only Effect | [with-effect.md](references/with-effect.md) |
| Vitest — libs/schemas/gates focus | [with-vitest.md](references/with-vitest.md) |
