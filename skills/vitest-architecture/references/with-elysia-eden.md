# Extension: Elysia Eden tests

Load when HTTP tests hit Elysia routes. Official path: Eden Treaty
`treaty(app)` from `@elysia/eden` — in-process, fully typed, no `listen()`.

## Stance

Call the exported plugin or composed app through Treaty. Do not build
`Request` objects or `handle` helpers. Unit tests may `vi.mock` identity /
runtime / auth. Integration tests use real deps and still go through Treaty.

```ts
import { describe, expect, it } from "vitest";
import { treaty } from "@elysia/eden";
import { statusRoute } from "../../src/modules/billing/routes/status";

const api = treaty(statusRoute);

describe("GET /billing/status", () => {
  it("returns a plan", async () => {
    const { data, error, status } = await api.billing.status.get();
    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toBeDefined();
  });
});
```

Adjust the Treaty path to the plugin's actual prefix.

## MUST

1. Use `treaty(instance)` for success, validation, auth failure, and status-specific bodies.
2. Keep mocked HTTP tests under `tests/unit/`; real DB/providers under `tests/integration/`.
3. Mock cross-cutting plugins at the module boundary — do not boot full production `main` for every unit case.
4. `await app.modules` when lazy/loadable plugins are under test.

## MUST NOT

1. `app.handle(new Request(...))` or `plugin.handle(...)`.
2. Helpers like `const handle = (path: string) => app.handle(new Request(\`http://localhost${path}\`))`.
3. A listening port for default unit HTTP tests (URL `treaty<App>('http://…')` is only for true network checks).

## Checklist

```text
Elysia Eden overlay:
- [ ] treaty(app) assertions on { data, error, status }
- [ ] No handle/Request test helpers
- [ ] Auth/runtime mocked in unit
- [ ] Real deps deferred to integration
```
