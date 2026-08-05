# Extension: Vitest (Elysia-focused)

Load when testing this Elysia app. Full monorepo Vitest layout (per-package
projects, `tests/unit` vs `tests/integration`, `passWithNoTests`, no `bun:test`)
is assumed — do not re-invent a second test tree here.

## Stack focus

1. Prefer testing **services, schemas, and pure libs** over mounting the entire `main`.
2. HTTP unit edges: **`plugin.handle(new Request(...))`** (or `app.handle`) with
   `vi.mock` for identity/runtime/auth when needed.
3. Real DB/Redis/providers → **integration** project only.
4. Await deferred plugins (`await app.modules`) when lazy plugins are under test.

## Checklist

```text
Elysia Vitest overlay:
- [ ] Unit: handle(Request) + mocks
- [ ] Integration: real deps only when needed
- [ ] No parallel ad-hoc test layout under routes/
```
