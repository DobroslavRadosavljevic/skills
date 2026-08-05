# Extension: typecheck project

Load when the package uses Vitest type tests (`*.test-d.ts`) via a dedicated `types` project.

## Tree

```text
vitest.types.config.ts         # name: "types"; typecheck enabled
tests/types/**/*.test-d.ts
package.json → "test:types": "vitest run --project types"
```

## MUST

1. Keep type tests out of the default unit gate unless the repo explicitly merges them.
2. Use `*.test-d.ts` (or the repo’s established suffix) for type-level assertions.
3. Document `test:types` as an opt-in script (and CI job when required).

## MUST NOT

1. Expecting `vitest run --project unit` to typecheck the whole package — use `tsc` / `test:types` deliberately.

## Checklist

```text
Typecheck project overlay:
- [ ] vitest.types.config.ts
- [ ] tests/types/*.test-d.ts
- [ ] test:types script
```
