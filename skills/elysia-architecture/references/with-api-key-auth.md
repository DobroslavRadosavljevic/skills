# Extension: API key auth

Load when a customer/jobs API authenticates with Bearer API keys and reuses the same identity/permissions macro shape as the session API.

## Stance

**Create/manage keys** on the session/control-plane API. **Consume keys** on the jobs/public API. Key capabilities are a filtered “key-safe” subset of the full catalog.

## Tree

```text
packages/<api-keys>/         # CRUD + findBySecret (Effect service or equivalent)
packages/<authz>/            # grantsForApiKey + key-safe scope filter

apps/<session-api>/
  modules/api-keys/routes/   # create, list, revoke, rename…

apps/<jobs-api>/src/plugins/identity/plugin.ts
  # Authorization: Bearer <secret> → lookup → grants → same identity macro
```

## MUST

1. Parse Bearer token in the jobs API identity plugin; map missing/invalid → 401.
2. Use the **same permission sugar** as user identity where possible.
3. Restrict creatable scopes to **key-safe** capabilities at create time on the session API.
4. Do not mount session-cookie auth as the primary gate on the jobs API (unless dual-mode is an explicit product requirement).

## MUST NOT

1. Store or log raw key secrets after creation beyond the one-time reveal response.
2. Give API keys full user/admin capability sets by default.
3. Put key verification inside every route handler — keep it in the identity plugin.

## Checklist

```text
API key auth overlay:
- [ ] Key CRUD on session API; verify on jobs API
- [ ] identity macro + grantsForApiKey
- [ ] Key-safe scopes enforced at create
```
