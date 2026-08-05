# Extension: Bun catalog

Load when the monorepo pins shared dependency versions via `workspaces.catalog` (and optional named `catalogs`).

## MUST

1. Add shared library versions to root `catalog` (or named catalog).
2. Consumers declare `"pkg": "catalog:"` (or `"catalog:codegen"` etc.).
3. Keep related tools aligned (e.g. `vitest` + `@vitest/*`, `oxlint` + plugins).
4. Use named catalogs when a tool needs a different pin (e.g. codegen TypeScript) without polluting app TS.

## MUST NOT

1. Randomly pinning the same library to different versions across packages without a named-catalog reason.
2. Putting workspace packages in `catalog` — use `workspace:*`.

## Checklist

```text
Catalog overlay:
- [ ] New shared dep version in root catalog
- [ ] Consumers use catalog:
- [ ] Related @scope tools version-aligned
```
