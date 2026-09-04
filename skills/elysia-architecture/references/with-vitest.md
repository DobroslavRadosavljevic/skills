# Extension: Vitest (Elysia-focused)

Load when testing this Elysia app. Full monorepo Vitest layout (per-package
projects, `tests/unit` vs `tests/integration`, `passWithNoTests`, no `bun:test`)
is assumed — do not re-invent a second test tree here.

## Stack focus

1. Prefer testing **services, schemas, and pure libs** over mounting the entire `main`.
2. HTTP edges (unit or integration): **`treaty(app)` from `@elysia/eden`**. Pass the exported Elysia instance. Assert `{ data, error, status }`. Mock identity/runtime/auth with `vi.mock` in unit tests.
3. Real DB/Redis/providers → **integration** project only. Still call those endpoints through Treaty, not `handle`/`Request`.
4. Await deferred plugins (`await app.modules`) when lazy plugins are under test.

## MUST NOT

1. `app.handle(new Request(\`http://localhost${path}\`))`
2. `export const handle = (path: string) => app.handle(new Request(...))`
3. `plugin.handle(...)` in tests

## Checklist

```text
Elysia Vitest overlay:
- [ ] HTTP tests: treaty(app) from @elysia/eden
- [ ] No handle/Request helpers
- [ ] Unit mocks identity/runtime; integration uses real deps
- [ ] No parallel ad-hoc test layout under routes/
```
