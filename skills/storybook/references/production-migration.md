# Production, CI, And Migration

## Build And CI

```sh
bunx storybook build
bunx storybook doctor
```

CI tips:

- Install matching Playwright browsers when using Vitest browser mode (`bunx playwright install` / `--with-deps` in CI images).
- Cache Storybook build output and Playwright browsers separately.
- Run `vitest --project=storybook` (or the repo script) on PRs that touch components/stories.
- Publish static `storybook-static` (or Chromatic) from `build-storybook` artifacts.
- Prefer `storybook build` over `dev` when diagnosing opaque config errors—build errors are often clearer.

## Upgrade Path

1. If on Storybook **&lt; 9**, upgrade to 9 first, then to 10.
2. Run `bunx storybook@latest upgrade` and accept automigrations.
3. Run `bunx storybook doctor` for duplicate/mismatched packages.
4. Remove community addons temporarily if something breaks after upgrade; re-add once SB10-compatible.

### Storybook 10 Highlights

- **ESM-only** distribution; `.storybook/main.*` and presets must be ESM.
- Node **20.19+** or **22.12+**.
- CSF Next preview (optional).
- Improved tags filtering; remove obsolete `*-only` tags.
- Prefer Vitest addon over test-runner when eligible.

### Storybook 9 Package Consolidation (Still Bites On 10)

| Old | New |
| --- | --- |
| `@storybook/test` | `storybook/test` |
| `@storybook/manager-api` | `storybook/manager-api` |
| `@storybook/preview-api` | `storybook/preview-api` |
| `@storybook/theming` | `storybook/theming` |
| `@storybook/addon-actions` | core / `storybook/actions` |
| `@storybook/addon-interactions` | core |
| `@storybook/addon-essentials` | removed — install `@storybook/addon-docs` if needed |
| `@storybook/experimental-addon-test` | `@storybook/addon-vitest` |
| Renderer imports `@storybook/react` | Framework `@storybook/react-vite` (etc.) |

Preview `globals` renamed to `initialGlobals` (story-level overrides still use `globals`).

## Common Failure Modes

| Symptom | Likely fix |
| --- | --- |
| `require` / `__dirname` in `main.ts` | Convert to ESM + `import.meta.url` |
| Controls/Actions missing after upgrade | Essentials removed—features are core; restart; check preview params |
| Docs missing | Add `@storybook/addon-docs` |
| Vitest addon refuses Next.js | Switch to `@storybook/nextjs-vite` |
| Tests don’t see providers | Portable setup missing `setProjectAnnotations` / addon preview |
| Duplicate `@storybook/*` versions | Align all official packages to the same Storybook version; run doctor |
| Community addon crashes on 10 | Remove/replace; addon must ship ESM |
| CJS addon load errors | Addon not SB10-ready |
| Node engine errors | Upgrade Node to 20.19+/22.12+ |

## Addon Author Notes (When Touching Addons)

Storybook 10 requires **ESM-only** addon builds. Peer `storybook: ^10.0.0`. Drop CJS exports and empty essentials/interactions/blocks dependencies. See the official addon migration guide.

## AI / Agent Authoring Checklist

When generating Storybook work:

1. Detect framework package and Storybook major from `package.json`.
2. Match existing CSF style (CSF3 vs CSF Next)—do not mix casually.
3. Colocate `*.stories.tsx` with the component.
4. Use typed `Meta`/`StoryObj` and `fn()` for handlers.
5. Add `play` only when interaction matters; keep a static story too.
6. Wire autodocs via tags when docs addon is present.
7. Prefer Vitest addon scripts already in the repo over inventing test-runner.
8. After dependency edits, suggest `storybook doctor` + build/test smoke.

## Verification Matrix

| Change | Verify |
| --- | --- |
| New story | Dev UI render + Controls |
| `play` / a11y | Interactions panel and/or Vitest project |
| `main` / Vite aliases | `storybook build` |
| Upgrade | `upgrade` → `doctor` → build → story tests |
| Portable stories | Unit test calling `run()` with annotations |
| Docs | Autodocs/MDX page renders; no missing blocks imports |
