# Extension: Oxlint + Oxfmt

Load when every participating workspace has thin Oxlint/Oxfmt configs and Turbo runs `lint` / `format` scripts.

## Stance

**Oxlint** = correctness lint (optionally shared presets package). **Oxfmt** = format + import sort. Do not run Prettier/Biome alongside Oxfmt.

## Tree

```text
packages/<oxlint-presets>/     # optional shared presets
apps|packages/<ws>/
  oxlint.config.ts             # extends presets (base + stack overlays)
  oxfmt.config.ts              # printWidth, quotes, sortImports, …
```

## MUST

1. Define `lint`, `lint:fix`, `format`, `format:check` per workspace that participates.
2. Run Oxlint under Bun when presets are TypeScript (`bun --bun oxlint`) if Node ESM cannot resolve them.
3. Keep `format` / `lint:fix` **uncached** in Turbo (they mutate).
4. Mount stack overlays deliberately (e.g. do not put server-framework lint rules on a pure website package).

## Soft defaults

- `printWidth: 100`, double quotes, semis, `trailingComma: "all"`, `sortImports: true`.

## Checklist

```text
Oxlint/Oxfmt overlay:
- [ ] Thin per-workspace configs
- [ ] Scripts wired for turbo
- [ ] Mutating tasks cache: false
```
