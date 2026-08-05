# Extension: dependency boundaries

Load when deployables have explicit may / must-not import tables (enforced by review and `package.json` deps; optional future Turborepo Boundaries).

## Stance

Write a table per app. Keep it honest in manifests — do not depend on packages you must not use.

## Template

| App | May use | Must not use |
| --- | --- | --- |
| **session-api** | auth, database, billing domain, … | browser runtime, pool, playwright |
| **jobs-api** | credits reserve, api-keys verify, queue, … | session auth admin, provider webhook admin |
| **worker** | runtime/engine packages, pool, queue, … | HTTP frameworks, billing UI, emails |
| **website** | ui, env, pure authz helpers, … | engine, pool, worker packages |

## MUST

1. Update the table when adding a new deployable or crossing a boundary.
2. Prefer failing review on forbidden deps over “temporary” exceptions without a date/owner.
3. Keep pure client-safe packages free of server-only Effect Layers when the website imports them.

## MUST NOT

1. Documenting boundaries that `package.json` already violates.
2. Inventing Turborepo Boundaries config unless the repo adopts it.

## Checklist

```text
Boundaries overlay:
- [ ] Table exists for each deployable
- [ ] package.json matches the table
- [ ] New cross-boundary imports challenged
```
