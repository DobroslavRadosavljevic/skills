# Extension: Vitest workspaces (Turbo side)

Load when packages use Vitest and Turbo orchestrates `test` / `test:integration`.

## Stance

This overlay covers **Turbo scripts and task graph**. Test folder layout, project files, and unit vs integration rules live in the Vitest testing house style for the repo (per-package `vitest.config.ts`, `tests/unit`, `tests/integration`, `passWithNoTests`).

## MUST

1. Package scripts already scope the project: `vitest run --project unit|integration`.
2. Turbo `test` / `test:integration` `dependsOn: ["transit"]` (or equivalent).
3. `test:watch` is `cache: false` + `persistent: true`.
4. Root does **not** need a Vitest config that aggregates all packages.

## Soft defaults

```json
"test": "vitest run --project unit --passWithNoTests",
"test:integration": "vitest run --project integration --passWithNoTests"
```

## Checklist

```text
Vitest workspaces overlay:
- [ ] Per-package vitest scripts
- [ ] turbo test tasks + transit
- [ ] No root Vitest aggregator required
```
