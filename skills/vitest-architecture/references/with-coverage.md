# Extension: coverage

Load when a package opts into Vitest coverage thresholds (not monorepo-wide by default).

## Stance

Coverage is **package-local**. Do not force 100% thresholds on every workspace.

## MUST

1. Configure coverage on that package’s Vitest config (`provider: "v8"` or repo standard).
2. Set explicit `coverage.include` (Vitest 4 does not use legacy `coverage.all` the same way).
3. Expose `test:coverage` (or `vitest run --coverage`) as an opt-in script unless CI already requires it.

## MUST NOT

1. Adding monorepo-wide coverage gates without an explicit decision.
2. Chasing coverage on generated code (`src/gen/**`) without excluding it.

## Checklist

```text
Coverage overlay:
- [ ] Package-local thresholds only
- [ ] include/exclude set deliberately
- [ ] Opt-in script or documented CI job
```
