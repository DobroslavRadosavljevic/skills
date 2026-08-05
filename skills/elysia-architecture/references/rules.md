# Rules and anti-patterns (Elysia core)

## MUST

1. Put new HTTP surface under `modules/<feature>/routes/`.
2. Export **one** named Elysia instance per route file.
3. Keep `routes/index.ts` as a mount table only.
4. Put request/response contracts under `schema/`.
5. Keep handlers thin; put business rules in domain/services modules.
6. Map domain failures to HTTP status + small public body **in the route**.
7. Preserve import direction: routes → domain; never domain → routes; never route → route across features.
8. Prefer short leaf names; let the folder carry the feature noun.

## MUST NOT

1. Flat `routes/users.ts` mega-files with many unrelated verbs (unless the feature is a single trivial endpoint and stays that way).
2. `utils/makeRoute.ts`, `createCrudRoutes()`, or shared HTTP mapper helpers that hide handlers.
3. Hand-written TypeScript interfaces that duplicate Elysia/schema contracts for the same boundary.
4. Growing `utils/` with auth wrapping, status mapping, or OpenAPI glue — keep that at the route edge or in dedicated plugins.
5. Importing from another feature’s `routes/` to “reuse a handler.”
6. Dumping shared platform code into a random feature module — use a shared package or `src/lib/` / `src/plugins/` for true cross-cutting HTTP plugins.

## Soft defaults (prefer, escape if repo differs)

- Bun + `"type": "module"`; relative imports without `.ts` extensions when that is already the repo style.
- Named plugins for lifecycle deduplication.
- Explicit `response: { [status]: Schema }` where the public contract matters.
- Feature names that can mirror a sibling frontend domain (`billing` ↔ website `billing`) when both exist.

## Anti-patterns → fix

| Smell | Fix |
| --- | --- |
| `modules/billing/routes.ts` with 8 verbs | Split into `routes/<action>.ts` + mount table |
| `routes/helpers/mapError.ts` shared by all features | Inline `catch`/status map per route, or one small shared **plugin** if truly global |
| `services/` importing `routes/` | Invert: route calls service |
| `schema` types only as TS interfaces next to handler | Move to `schema/` and wire into the route options |
| `modules/utils/http.ts` | Delete; push logic into plugins or route edges |

## Conflict with local docs

If `AGENTS.md` / CONTRIBUTING defines a different module shape, follow the repo unless the user explicitly wants this skill’s tree.
