---
name: elysia-architecture
description: >-
  Enforce portable Elysia app architecture: feature modules, folder trees,
  naming, one-route-one-file, thin handlers, schema/services ownership, and
  mount tables. Use when scaffolding a new Elysia API or feature, adding
  endpoints, reviewing or reorganizing module layout, or when the user asks
  for elysia-architecture / Elysia house style. Optional with-* overlays for
  Effect, env, session auth, capability authz, API keys, Drizzle, OpenAPI,
  observability, HTTP errors, domain packages, plugins, cron, webhooks,
  service auth, and Vitest.
disable-model-invocation: true
---

# Elysia Architecture

Portable house style for Elysia HTTP apps. Use this skill alone — it does not
depend on other skills.

**Job:** where code lives, how folders/files are named, and ownership boundaries.

**Not this skill:** Elysia API quirks, plugin lifecycle details, Eden, adapters,
or latest framework docs. Prefer current Elysia docs for those.

If the target repo already documents architecture (e.g. `AGENTS.md`) and it
conflicts, **repo wins** unless the user asks to migrate toward this skill.

## Stack defaults (core)

| Piece | Default |
| --- | --- |
| Runtime | Bun (Node/adapters OK if the app already uses them) |
| HTTP | Elysia feature plugins under `src/modules/<feature>/` |
| Module layout | `routes/` + `schema/` + domain logic folder |
| Tests | Vitest under `tests/` (unit / integration projects) when the repo uses Vitest |

Domain logic may be plain TypeScript modules. Load matching **with-*** extensions
when those stacks are present (see below).

## Modes

1. **Scaffold** — new feature module from [checklist.md](references/checklist.md) + [tree.md](references/tree.md).
2. **Apply** — place new endpoints/schemas/services in the canonical spots.
3. **Review** — compare the tree to [rules.md](references/rules.md); propose moves; do not invent a parallel layout.

## Hard rules (core)

1. **Feature = `src/modules/<feature>/`.** Group by domain (`billing`, `users`), not by technical layer at the app root.
2. **One route file = one exported Elysia plugin** with a stable `name`, and typically one HTTP verb (or a tight related group). Do not pack unrelated verbs into one file.
3. **`routes/index.ts` is a mount table only** — `.use(child)` (+ `prefix`). No handlers, no domain logic, no shared mappers.
4. **Schemas live under `schema/`** (`body`, `response`, `query`, `params` as needed). Do not dump DTOs into route files or invent parallel hand-written response interfaces when schemas already define the contract.
5. **Routes stay thin.** HTTP concerns (auth guards, status mapping, request/response) in the route file; business rules in services (or plain domain modules).
6. **No route factories / shared HTTP wrappers.** Do not invent `makeSyncGet`, `mapXToHttp`, or `utils/*-http.ts` that wrap handlers. Inline the edge in each route file.
7. **Map failures at the HTTP edge only.** Public bodies stay small (e.g. `{ error: string }` + status). Do not leak internal causes.
8. **Do not grow `utils/` for HTTP.** Prefer `schema/`, services/domain, or inlined route edges.
9. **Naming:** folder = noun/domain; file = action or aspect (`create.ts`, `status.ts`). Do not repeat the parent folder in the leaf name (`billing/billing-status.ts` → `billing/routes/status.ts`).
10. **Import direction:** routes → schema + services; services must not import routes. Cross-feature deps go through services/shared packages, not route→route imports.
11. **Mount** feature trees from the app entry (or a parent feature’s mount table).

Details, anti-patterns, and examples: [rules.md](references/rules.md), [tree.md](references/tree.md), [examples.md](references/examples.md).

## Progressive disclosure

| Need | Read |
| --- | --- |
| Canonical trees + naming | [references/tree.md](references/tree.md) |
| Enforce rules + anti-patterns | [references/rules.md](references/rules.md) |
| Scaffold / review checklists | [references/checklist.md](references/checklist.md) |
| Good vs bad layouts | [references/examples.md](references/examples.md) |
| Optional stack overlays | [Extensions](#extensions) below |

## Extensions

Load an extension **only** when the matching stack is present (or the user asks).
Extensions add rules; they do not replace the core tree.

| When | Extension |
| --- | --- |
| Effect services / Layers / tagged errors | [with-effect.md](references/with-effect.md) |
| T3 Env / packages must not read `process.env` | [with-env.md](references/with-env.md) |
| Session auth mount + `{ auth: true }` macro | [with-session-auth.md](references/with-session-auth.md) |
| Capabilities / grants / identity permissions | [with-capability-authz.md](references/with-capability-authz.md) |
| Bearer API keys on a jobs/public API | [with-api-key-auth.md](references/with-api-key-auth.md) |
| Drizzle schema package + DB in services | [with-drizzle.md](references/with-drizzle.md) |
| OpenAPI derived from route schemas | [with-openapi.md](references/with-openapi.md) |
| Request logs + OTEL + Effect tracer | [with-observability.md](references/with-observability.md) |
| Stable public error body + edge mapping | [with-http-errors.md](references/with-http-errors.md) |
| Domain in `packages/*`, HTTP in app modules | [with-domain-packages.md](references/with-domain-packages.md) |
| Shared vs app-local Elysia plugins | [with-shared-plugins.md](references/with-shared-plugins.md) |
| In-process cron ticks | [with-cron.md](references/with-cron.md) |
| Provider webhooks | [with-webhooks.md](references/with-webhooks.md) |
| Internal shared-secret routes | [with-service-auth.md](references/with-service-auth.md) |
| Vitest — Elysia `handle` / what to test | [with-vitest.md](references/with-vitest.md) |
