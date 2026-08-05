# Extension: Vitest (Start-focused)

Load when testing this TanStack Start app. Full monorepo Vitest layout
(per-package projects, `tests/unit` vs `tests/integration`, `passWithNoTests`,
no `bun:test`) is assumed — do not re-invent a second test tree here.

## Stack focus

1. Prefer **pure module libs, form schemas, and gate helpers** — not full page mounts
   — unless the repo already has a component test harness.
2. Target `modules/**/lib`, `modules/**/schema`, and authorization adapters first.
3. Do not require a browser for default unit tests; keep live API calls out of unit.
4. Route `-lib` helpers are fair game when they encode gate/search logic.

## Checklist

```text
Start Vitest overlay:
- [ ] Unit targets libs/schemas/gates
- [ ] No full-page mounts as the default
- [ ] No live product APIs in unit
```
