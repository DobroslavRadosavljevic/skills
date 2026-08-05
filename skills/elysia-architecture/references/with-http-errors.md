# Extension: HTTP errors

Load when APIs return a stable public error body and map domain failures at the route edge (especially with Effect tagged errors).

## Stance

Public errors are **small and stable**. Domain errors stay rich internally. Mapping happens **inline in each route** (or a single global `onError` for truly unexpected failures) — not via a grab-bag `mapDomainToHttp` util per feature.

## Shape (default)

Prefer a machine + human pair when clients branch on errors:

```ts
{ code: "INSUFFICIENT_CREDITS", message: "Insufficient credits" }
```

Simpler APIs may use `{ error: string }`. Pick one per API surface and stick to it. Document it in OpenAPI via a shared schema.

## MUST

1. Map **exact** tagged failures / known domain errors to fixed status + body in the route.
2. Use **stable `code` strings** when the client gates on them (redirects, toasts).
3. Unexpected failures → 500 via `onError` / catch-all; do not leak stacks to clients.
4. Keep the shared error schema under a shared schema package or `schema/response.ts`.

## MUST NOT

1. Branch HTTP status on `error.message` / free-form `reason` when tags exist.
2. Invent a new error JSON shape per feature.
3. Return Effect `Cause` dumps in JSON.

## With Effect

See also `with-effect.md`: one `TaggedErrorClass` per failure mode; `catchTag("ExactTag", …)`.

## Checklist

```text
HTTP errors overlay:
- [ ] Shared public error schema
- [ ] Route maps known failures to status + body
- [ ] Stable codes where clients branch
- [ ] No message/reason status switching
```
