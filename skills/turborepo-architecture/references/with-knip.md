# Extension: Knip (root-only)

Load when unused export/dependency analysis runs via Knip from the repo root.

## Stance

**One root Knip config** (`knip.ts` / `knip.json`). Turbo may expose `//#knip` with `cache: false`. Do not add per-package Knip scripts.

## MUST

1. Run `bun run knip` (or equivalent) from the root.
2. Treat package `exports` / scripts as Knip entries.
3. Keep Knip uncached in Turbo when wired as a root task.

## MUST NOT

1. Per-package `"knip": "knip"` scripts that fragment analysis.
2. Ignoring unused workspace deps without an explicit Knip ignore.

## Checklist

```text
Knip overlay:
- [ ] Root knip config only
- [ ] Root script / //#knip task
- [ ] No per-package knip scripts
```
