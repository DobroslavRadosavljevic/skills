# Extension: capability authorization

Load when routes declare permissions via a shared pure authorization package (capabilities, grants, policies) and an app identity macro resolves the actor.

## Stance

Authorization **catalog + compilers** live in a pure package (no Elysia plugins required). HTTP apps expose an **identity macro** that resolves grants and checks route permissions. Workers / non-HTTP jobs do not re-run the same HTTP authz stack unless explicitly designed to.

## Tree

```text
packages/<authz>/
  catalog/                   # capability strings
  grants/                    # grantsForUser / grantsForApiKey (or equivalent)
  permissions/               # expr, Policies.*, check helpers

apps/<api>/src/plugins/identity/plugin.ts
  # macro { identity: true | { permissions } }
  # resolves actor → grants; 401/403 with stable codes

modules/<feature>/routes/<action>.ts
  # .get(…, handler, { identity: { permissions: "…" | { all|any } | Policies.* } })
```

## MUST

1. Declare **permissions on the route** (macro / guard options), not as ad-hoc if-checks scattered in unrelated utils.
2. Prefer capability string, XOR `{ all }` / `{ any }`, or named `Policies.*`.
3. Resolve **active org / tenant from server state**, not from a client-supplied org id alone (when multi-tenant).
4. Entity-level checks (e.g. “can change this member’s role”) stay in the **handler** using grants helpers.
5. Keep the authz package usable from non-Elysia clients (pure functions).

## Session vs identity

| Macro | Meaning |
| --- | --- |
| Session / `{ auth: true }` | Logged in (pre-product / onboarding OK) |
| `{ identity: … }` | Onboarded product actor + grants |

Do not collapse these if the product requires onboarding before private APIs.

## MUST NOT

1. Duplicate capability strings as magic literals across apps without the catalog.
2. Put Effect Layers inside the pure authz package if the package is meant to be client-safe.
3. Rely on OpenAPI `security` declarations as enforcement.

## Checklist

```text
Capability authz overlay:
- [ ] Route declares identity/permissions
- [ ] Grants resolved in identity plugin
- [ ] Entity checks in handler via grants helpers
- [ ] Authz package stays pure / portable
```
