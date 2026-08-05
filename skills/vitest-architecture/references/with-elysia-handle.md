# Extension: Elysia handle tests

Load when HTTP unit tests call Elysia plugins via `.handle(new Request(...))` instead of listening on a port.

## Stance

Unit-test route plugins in isolation: build a small app or use the exported plugin, `handle` a `Request`, assert status/body. Mock identity/runtime/auth macros with `vi.mock` when needed.

## MUST

1. Prefer `plugin.handle(Request)` (or `app.handle`) for success, validation, auth failure, and status-specific bodies.
2. Keep these tests under `tests/unit/` when mocks replace DB/network.
3. Mock cross-cutting plugins (identity, runtime) at the module boundary — do not boot the full production `main` for every unit case.
4. Await deferred plugins (`await app.modules`) when the app uses lazy/loadable plugins.

## MUST NOT

1. Requiring a listening port for default unit HTTP tests.
2. Hitting real provider webhooks in unit handle tests.

## Checklist

```text
Elysia handle overlay:
- [ ] handle(Request) assertions
- [ ] Auth/runtime mocked in unit
- [ ] Real deps deferred to integration
```
