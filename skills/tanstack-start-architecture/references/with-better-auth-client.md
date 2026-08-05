# Extension: Better Auth client

Load when the Start app uses Better Auth (or a similar session SDK) separate from the OpenAPI-generated API client.

## Stance

Session auth lives in **`modules/authentication/`**. Routes and gates use React Query wrappers / shared `queryOptions` — not raw `authClient` calls in page files.

## Tree

```text
modules/authentication/
  client.ts                  # createAuthClient({ baseURL }) from env
  hooks/use-*.ts             # sign-in, session, password, social…
  lib/session-query-options.ts
  lib/query-keys.ts
  lib/*-error-message.ts     # map auth client errors to UI copy
  schema/                    # sign-in / sign-up / reset form schemas
```

## MUST

1. Keep the auth client **off** the OpenAPI generator.
2. Wrap auth calls in **hooks + Query**; invalidate session (and product `/me` keys when applicable) on success.
3. Use shared `sessionQueryOptions` in route `beforeLoad` gates.
4. Map auth errors for UI in module `lib/`, not ad-hoc string parsing in every form.

## MUST NOT

1. Instantiating multiple auth clients with different base URLs without intent.
2. Calling `authClient` directly from deep route `-components` when a hook already exists.
3. Treating auth session as product authorization — pair with route gates + capability checks.

## Checklist

```text
Better Auth client overlay:
- [ ] Single client in modules/authentication/client.ts
- [ ] Hooks + sessionQueryOptions for gates
- [ ] Invalidate session / me keys on auth mutations
- [ ] Form schemas under modules/authentication/schema
```
