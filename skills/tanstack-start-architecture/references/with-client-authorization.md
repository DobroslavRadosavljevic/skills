# Extension: client authorization

Load when a shared pure authorization package (`can`, capabilities, grants) is used from the Start app for UI gates and hooks — without Effect Layers or Elysia plugins on the client.

## Stance

The authz package stays **pure and isomorphic**. The Start app adds thin adapters under `modules/authorization/` for route policies and React hooks. Server/API still enforces permissions.

## Tree

```text
packages/<authz>/              # catalog, can(), grants helpers — no React

apps/<web>/src/modules/authorization/
  lib/
    capabilities.ts            # re-export or app-facing aliases
    route-policy.ts            # capability → enter policy / redirect
    require-capability.ts
  hooks/
    use-can.ts
    use-reassert-org-route-access.ts   # when grants change mid-session
```

## MUST

1. Import **pure helpers only** from the authz package in the website (no Effect service Layers).
2. Map capabilities to **enter policies** for org/section layouts.
3. Use `useCan` (or equivalent) for UI affordances; still rely on API 403s.
4. Re-assert access after permission refetch when the user can lose access without a full navigation.

## MUST NOT

1. Duplicating the capability catalog as string literals only in the website.
2. Treating client `can()` as sufficient authorization for mutations.
3. Importing API identity plugins into the Start app.

## Checklist

```text
Client authorization overlay:
- [ ] Pure package helpers only on the client
- [ ] modules/authorization adapters for routes/hooks
- [ ] Enter policies on org/section layouts
- [ ] API remains source of truth for enforcement
```
