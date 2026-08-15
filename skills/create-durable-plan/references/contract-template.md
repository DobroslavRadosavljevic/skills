# CONTRACT.md Template

Authoritative for **shapes and invariants**. Implementing a phase that violates this file is not done, even if tests were not written yet — add the tests named here.

If there is no new public surface, still fill **Invariants** and **Do not break**. Do not ship a hollow "N/A" file when the file map adds types, routes, jobs, flags, or schemas.

```markdown
# Contract: <mission title>

## Seams (phase outputs)

What a later phase may assume exists.

| After phase | Must exist | Shape / location | Consumed by |
| --- | --- | --- | --- |
| P00 | | `<path>` + type/export/table/flag | P01 |

## Types and data

- **New/changed types:** name, fields, nullability, identity, units.
- **Schema / storage:** tables, columns, indexes, TTL, tenancy column.
- **Events / jobs:** payload, idempotency key, retry.
- **Compatibility:** additive vs breaking; dual-write/read if migrate.

Include a short TypeScript/JSON example only when the prose is ambiguous.

## APIs and UI

- **HTTP / RPC / tRPC / server fn:** method, path, auth, input, output, errors.
- **UI routes / search params / states:** empty, loading, forbidden, error, success.
- **Copy:** user-visible strings if they are part of acceptance.

## Env and flags

| Name | Required | Default | Read in | Notes |
| --- | --- | --- | --- | --- |
| `FOO_BAR` | | | `<path>` | name only, no values |

## Invariants

Must remain true after every phase unless a migrate phase explicitly replaces them.

1. <e.g. tenant A cannot read tenant B rows>
2. <e.g. existing `/v1/x` status codes unchanged>

## Error model

| Case | Signal (throw/result/HTTP) | User/agent visible | Retry |
| --- | --- | --- | --- |
| | | | |

## Do not break

- `<path or API>` — <guaranteed behavior>
- Callers: `<path>` — <what they rely on>

## Tests that encode this contract

| Contract piece | Test file | Cases |
| --- | --- | --- |
| | `<path>` | |

## Out of contract

Things implementers must not "helpfully" add (extra endpoints, extra fields, extra flags).
```
