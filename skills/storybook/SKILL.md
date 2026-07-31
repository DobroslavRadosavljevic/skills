---
name: storybook
description: "Build, review, debug, configure, migrate, or plan Storybook 10 UI workshops with current docs. Use for storybook, create storybook, CSF3, CSF Next, Meta, StoryObj, definePreview, preview.meta, args, argTypes, decorators, parameters, tags, autodocs, play functions, storybook/test, @storybook/react-vite, @storybook/nextjs-vite, @storybook/addon-docs, @storybook/addon-a11y, @storybook/addon-vitest, portable stories, composeStories, main.ts, preview.ts, ESM config, Chromatic, and upgrades from Storybook 8/9."
---

# Storybook

Use this skill when work touches Storybook 10 (or upgrades into it): stories, CSF, config, docs, interaction/a11y/visual tests, Vitest addon, portable stories, framework packages, or migrations from 8.x/9.x.

## Workflow

1. Inspect the local Storybook surface before changing code:
   - Package versions for `storybook`, framework package (e.g. `@storybook/react-vite`, `@storybook/nextjs-vite`), `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-vitest`, Node, Vite/Vitest, and React/Vue/Svelte peers.
   - Config: `.storybook/main.ts|js` (must be ESM), `preview.ts|tsx`, optional `manager.ts`, `vitest.setup.ts`, story globs, `staticDirs`.
   - Story style: CSF3 `Meta`/`StoryObj`, experimental CSF Next (`definePreview` / `preview.meta` / `meta.story`), MDX docs, tags.
   - Testing path: Vitest addon, legacy test-runner, portable `composeStories`, Chromatic/visual, a11y.
2. Refresh current docs when versions are unclear or work touches upgrades, ESM, CSF Next, or Vitest browser mode. Start from [source-map.md](references/source-map.md).
3. For install, frameworks, `main`/`preview`, core features vs addons, and CLI, use [setup-core.md](references/setup-core.md).
4. For CSF3/CSF Next, args, render, decorators, parameters, tags, and docs, use [writing-stories.md](references/writing-stories.md).
5. For `play`, `storybook/test`, Vitest addon, portable stories, and a11y, use [testing.md](references/testing.md).
6. For builds, CI, doctor/upgrade, 8→9→10 package moves, and common failures, use [production-migration.md](references/production-migration.md).

## Implementation Judgment

- Target **Storybook 10** unless the repo is intentionally pinned. Prefer framework packages for types/imports (`@storybook/react-vite`), not orphaned renderer-only packages.
- Write **CSF3** by default (`satisfies Meta`, `StoryObj`). Treat CSF Next as experimental opt-in; do not rewrite a stable CSF3 codebase without approval.
- Import test utilities from `storybook/test` (and manager/preview APIs from `storybook/manager-api` / `storybook/preview-api`). Do not reintroduce `@storybook/test`, `@storybook/addon-interactions`, or `@storybook/addon-essentials`.
- Controls, actions, viewport, and interactions live in **core**. Install `@storybook/addon-docs`, `@storybook/addon-a11y`, and `@storybook/addon-vitest` when those features are needed.
- Prefer `@storybook/addon-vitest` over `@storybook/test-runner` for Vite React/Vue/Svelte projects. Next.js needs `@storybook/nextjs-vite` for the Vitest addon.
- Keep stories colocated with components. Prefer `args` + Controls over story-local React state; use `play` for interactions and assertions.
- Use tags deliberately (`autodocs`, `!autodocs`, `!test`, custom filters). Titles/`component` on meta must be statically analyzable.
- `.storybook/main.*` must be valid ESM (no `require` / `__dirname`). Use `import.meta.url` for path math.

## Verification

Prefer the repo's existing checks. For meaningful Storybook changes, include the relevant subset:

- `bun run storybook` (or project script) smoke that stories compile and render.
- `bunx storybook build` when changing `main` config, framework, Vite aliases, or ESM boundaries.
- `bunx storybook doctor` after upgrades or mismatched `@storybook/*` versions.
- Focused Vitest story project (`vitest --project=storybook`) or UI testing widget when changing `play`/a11y/coverage.
- Typecheck for `Meta`/`StoryObj`, framework imports, and `storybook/test` usage.
- Visual/Chromatic or a11y smoke when those pipelines are in the repo.
