# Extension: React + happy-dom

Load when testing React components/hooks with `environment: "happy-dom"` (or jsdom) and Testing Library.

## Stance

Use happy-dom for component/hook unit tests. Keep setup (RTL cleanup, jest-dom) in `tests/setup/unit.ts` via `setupFiles`.

## Tree extras

```text
vitest.unit.config.ts          # environment: "happy-dom"; include .tsx
tests/setup/unit.ts            # cleanup + jest-dom
tests/unit/**/*.{test,spec}.tsx
```

Soft exception: UI design-system packages may also include colocated `src/**/*.test.tsx` when already configured that way — prefer `tests/` for new packages.

## MUST

1. Set `environment: "happy-dom"` (or jsdom) on the React unit project.
2. Clean up RTL between tests in setupFiles.
3. Do not use full Browser Mode for ordinary unit component tests (see Storybook overlay for visual/browser).

## MUST NOT

1. Requiring Playwright browser for every hook unit test.
2. Hitting live APIs in component unit tests.

## Checklist

```text
React happy-dom overlay:
- [ ] happy-dom on unit project
- [ ] setupFiles cleanup
- [ ] .tsx includes present
```
