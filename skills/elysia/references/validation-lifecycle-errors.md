# Validation, Lifecycle, and Errors

Use this reference when changing request contracts, response types, hooks, authentication timing, parsing, or error mapping.

## Schema as the Contract

Elysia's `t` is a server-oriented TypeBox builder that supplies runtime validation, TypeScript inference, and OpenAPI schema from one definition. Elysia also accepts Standard Schema validators such as Zod, Valibot, ArkType, Effect Schema, Yup, and Joi.

Prefer one schema source of truth:

```ts
import { Elysia, t } from 'elysia'

const User = t.Object({
  id: t.Number(),
  name: t.String({ minLength: 1 })
})

new Elysia().post('/users', ({ body, status }) => {
  if (body.name === 'blocked')
    return status(409, { code: 'NAME_BLOCKED' as const })

  return { id: 1, name: body.name }
}, {
  body: t.Object({ name: t.String({ minLength: 1 }) }),
  response: {
    200: User,
    409: t.Object({ code: t.Literal('NAME_BLOCKED') })
  }
})
```

Cover the applicable surfaces: `body`, `query`, `params`, `headers`, `cookie`, and `response`.

## Input Nuances

- Query values arrive as strings. Elysia coerces applicable query schemas; declare arrays explicitly with `t.Array`.
- Params infer as strings unless constrained by a schema.
- Header schema keys must be lower-case. Headers allow additional properties by default.
- Cookies use `t.Cookie` or `t.Object` and allow additional properties by default. Use cookie options such as `httpOnly`, `secure`, `sameSite`, path, domain, and signing deliberately.
- Validate files with `t.File`/`t.Files`; schema validation does not replace server request-body and infrastructure limits.
- Unknown input/output properties depend on the root `normalize` setting. Inspect it before assuming rejection or stripping behavior.
- Use named reference models for schemas reused across features or OpenAPI components. Namespace model names to avoid collisions.
- Use a guard to apply common schemas to multiple later routes. Its default collision mode is `override`; use `schema: 'standalone'` only when both colliding schemas should run independently.

## Lifecycle Order

Reason about a request in this order:

1. Request (`onRequest`)
2. Parse
3. Transform and `derive`
4. Validation
5. Before handle and `resolve`
6. Route handler
7. After handle
8. Map response
9. Error path when an error is thrown
10. After response cleanup

`trace` observes lifecycle timing rather than replacing these stages.

Important rules:

- Interceptor hooks affect routes and plugins registered after the hook. `onRequest` is the exception because routing is not yet known.
- Returning from `onRequest` or `beforeHandle` short-circuits later handling.
- `derive` runs before validation and therefore cannot rely on validated request types. Prefer `resolve` for auth/session/user data derived from validated headers, cookies, params, query, or body.
- `resolve` shares the before-handle queue. Registration order within a queue still matters.
- A returned `afterHandle` value replaces the response value, but later after-handle hooks still run.
- A returned `mapResponse` value stops later response-mapping hooks.
- `afterResponse` runs after the client response is sent. Use it for cleanup and telemetry, not response mutation.

## Expected Statuses vs Exceptions

Prefer returning `status(code, value)` for an expected HTTP branch. This keeps per-status response schemas, Eden narrowing, and OpenAPI types aligned.

Throw when centralized `onError` handling is required. A thrown `status(...)` reaches `onError`; a returned `status(...)` does not.

```ts
new Elysia()
  .onError(({ code, error, status }) => {
    if (code === 'NOT_FOUND')
      return status(404, { code: 'NOT_FOUND' as const })

    if (code === 'VALIDATION')
      return status(422, { code: 'INVALID_REQUEST' as const })

    console.error(error)
    return status(500, { code: 'INTERNAL_ERROR' as const })
  })
```

Register `onError` before the routes/plugins it must cover and account for plugin scope.

Built-in codes include `NOT_FOUND`, `PARSE`, `VALIDATION`, `INTERNAL_SERVER_ERROR`, `INVALID_COOKIE_SIGNATURE`, `INVALID_FILE_TYPE`, `UNKNOWN`, and numeric HTTP statuses. Register domain error classes with `.error(...)` when type-safe narrowing is useful; a custom error may provide `status` or `toResponse()`.

## Validation Errors and Production

- Custom field messages are part of the public API. Keep them stable, useful, and free of secrets.
- Validation detail is omitted in production by default to avoid exposing schema internals.
- Do not enable `allowUnsafeValidationDetails` casually. If enabled for a public developer API, review exactly what becomes observable.
- Normalize the error envelope at one deliberate boundary and declare its response schema.
- Log the internal cause with request correlation while returning a safe external message.

## Tests That Catch Real Bugs

- Missing, malformed, extra, and boundary-value input for every request surface.
- Each declared status response and its exact body shape.
- Hook registration before/after the route.
- Auth rejection before the handler and validated identity availability inside it.
- Thrown versus returned status behavior.
- Plugin-local error handling versus root error handling.
- Production-mode validation detail leakage.
