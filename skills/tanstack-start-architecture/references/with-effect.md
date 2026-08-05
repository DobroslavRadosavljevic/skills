# Extension: Effect

Load this file **only** when the Start app uses Effect (or the user asks to adopt it). Core route/module layout still applies.

## Stance

- **Do not** invent Effect `services/` under `src/modules` for ordinary client UI.
- Prefer Effect where it already fits: **Effect Schema** for forms, server functions, server-only modules, or shared domain logic that matches a backend Effect style.
- Keep route components free of `Effect.gen` sprawl — call a small server function / module API instead.

## MUST (when Effect is in play)

1. Put Effect services in a clear server-capable home (`modules/<feature>/server/`, `*.server.ts`, or existing server-only folders) — not in route `-components`.
2. Authorize and validate inside server functions / server routes; do not treat `beforeLoad` alone as the security boundary.
3. Use tagged errors (or the repo’s existing error type) consistently; map to user-safe results at the server boundary.
4. Do not import server-only Effect layers into client components.
5. For forms, Effect Schema in `modules/<feature>/schema` is encouraged even when no Effect runtime exists on the client.

## Soft defaults

- Mirror naming from a sibling API when both exist.
- If the app later adds `createServerFn`, keep authz + mapping inside the server function (future `with-server-functions` territory).

## Checklist add-on

```text
Effect overlay:
- [ ] No new Effect services for single-page client UI
- [ ] Server-only Effect code not imported by client components
- [ ] Server functions own authz + mapping to safe results (when used)
- [ ] Route files stay mostly view/composition
- [ ] Form schemas may use Effect Schema without a client runtime
```
