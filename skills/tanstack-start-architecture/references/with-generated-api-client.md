# Extension: generated API client

Load this file **only** when the app consumes a **generated** OpenAPI/HTTP client
(Hey API, Orval, openapi-typescript + fetch client, etc.) for a backend API.

Core route/module layout still applies. Pair with `with-tanstack-query.md` when
loaders/hooks use React Query.

## Stance

Website/product UI should not hand-maintain parallel DTO types or raw `fetch`
wrappers for endpoints that the generator already covers.

## MUST

1. **Use the generated client** for typed requests/responses against that API.
2. **Prefer generated React Query helpers** when the generator emits them
   (`*Options`, `*Mutation`, query keys) over hand-rolled `useQuery` fetchers for the same endpoints.
3. **Take response/request types from generated `types`** (or equivalent). Alias narrow slices if needed
   (`GetInvoicesResponse["items"][number]`), do not redefine the same shape by hand.
4. **Do not** cast `client.get` / `client.post` payloads to improvised interfaces for covered endpoints.
5. Keep **UI form schemas** (Effect Schema / Zod / Standard Schema) in `modules/<feature>/schema` when they model form UX — those are not a substitute for API response DTOs.
6. Configure the client once (base URL, `credentials: "include"` when cookie auth, `throwOnError` if that is the app default).
7. Attach a small **error interceptor / helper** in `src/lib/` so gates and UI can branch on HTTP status + stable `code` (import for side effects from the root route if needed).

## MUST NOT

1. Hand-coded HTTP clients for the same OpenAPI surface the generator owns.
2. Duplicating generated response interfaces under `modules/**/types.ts`.
3. Mixing “sometimes generated, sometimes fetch” for the same resource without a documented exception.

## Soft defaults

- Regenerate after backend contract changes (`openapi.json` / typegen script the repo already has).
- Auth session clients (e.g. Better Auth) stay **separate** from the OpenAPI generator.
- Thin `modules/<feature>/hooks/use-*.ts` compose generated options; pages stay dumb composition.

## Where code lives

```text
src/gen/<api>/                 # generated — do not hand-edit
src/hey-api.ts                 # or client config entry (optional)
src/lib/<api>-errors.ts        # interceptor + isXError / message helpers
modules/<feature>/hooks/       # thin hooks: spread *Options / *Mutation
modules/<feature>/lib/         # type aliases from generated types (optional)
modules/<feature>/schema/      # form schemas only
routes/…/-components/          # page composition; call hooks
```

## Checklist add-on

```text
Generated client overlay:
- [ ] New API calls use generated client / Query helpers
- [ ] Types from generated types (aliases OK)
- [ ] Error helper/interceptor in src/lib
- [ ] No parallel hand-written DTO for the same endpoint
- [ ] Form schemas stay UI-side, not fake API types
- [ ] Typegen refreshed if the OpenAPI contract changed
```
