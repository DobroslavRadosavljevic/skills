# Extension: Storybook browser

Load when Vitest runs Storybook stories via browser mode (`@vitest/browser-playwright` or equivalent) as an opt-in project.

## Stance

Storybook/browser tests are **not** the default unit gate. Keep them as `test:storybook` (or similar) on the UI package.

## Tree

```text
vitest.storybook.config.ts     # browser.enabled + provider
package.json → "test:storybook": "…"
```

## MUST

1. Keep browser Storybook tests off the default `test` script unless product CI requires them always.
2. Align `@vitest/browser-*` with the Vitest version.
3. Prefer documenting primitives in the UI package Storybook — app pages rarely need browser Vitest.

## Checklist

```text
Storybook browser overlay:
- [ ] Separate vitest project / script
- [ ] Not part of default unit gate (unless intentional)
- [ ] Provider packages version-aligned
```
