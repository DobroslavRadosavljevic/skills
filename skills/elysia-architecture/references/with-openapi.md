# Extension: OpenAPI from route schemas

Load when the API publishes OpenAPI from Elysia route schemas (Effect Schema / Standard Schema / Elysia `t`) and frontends may codegen clients from that document.

## Stance

**Route schemas are the HTTP contract.** OpenAPI is derived from them. Do not maintain a parallel hand-written OpenAPI or DTO layer for the same surface.

## Tree

```text
modules/<feature>/schema/
  body.ts · response.ts · query.ts · params.ts

apps/<api>/src/plugins/openapi/plugin.ts
  # mapJsonSchema for Effect Schema if needed; hide internal paths

# Consumer (other app):
openapi.<api>.json  →  typegen  →  src/gen/<api>/
```

## MUST

1. Define `body` / `query` / `params` / per-status `response` on routes that matter publicly.
2. Use a **shared error body schema** when error shape is stable (`{ code, message }` or `{ error }`).
3. Hide internal/ops routes from the public document (`detail.hide` / exclude paths).
4. After contract changes: refresh the OpenAPI snapshot (if the repo uses one), then run typegen for consumers.
5. Session auth clients may stay **off** the OpenAPI generator when they use a dedicated auth SDK.

## MUST NOT

1. Hand-written TypeScript interfaces that duplicate schema contracts for the same endpoint.
2. Document-only `security` without real guards.
3. Breaking response shapes without bumping consumers / typegen.

## Checklist

```text
OpenAPI overlay:
- [ ] Schemas on the route drive the document
- [ ] Shared error schema where applicable
- [ ] Internal routes hidden
- [ ] Snapshot + consumer typegen updated if needed
```
