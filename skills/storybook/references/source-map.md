# Storybook Source Map

Snapshot date: 2026-07-31.

## Current Package Evidence

| Package / tag | Version | Notes |
| --- | --- | --- |
| `storybook` `latest` | `10.5.5` | Core CLI + consolidated APIs |
| `storybook` `v9` | `9.1.20` | Previous major |
| `storybook` `v8` | `8.6.18` | Older major still tagged |
| `storybook` `next` | `10.6.0-alpha.3` | Prerelease line |
| `@storybook/react-vite` | `10.5.5` | Preferred React + Vite framework |
| `@storybook/nextjs-vite` | `10.5.5` | Required for Vitest addon on Next |
| `@storybook/addon-docs` | `10.5.5` | Separate from core |
| `@storybook/addon-a11y` | `10.5.5` | Accessibility tests |
| `@storybook/addon-vitest` | `10.5.5` | Story → Vitest browser tests |
| `@storybook/vue3-vite` / `sveltekit` / `angular` | `10.5.5` | Other frameworks |

Stale packages still on npm at 8.x (do **not** add on Storybook 10):

- `@storybook/addon-essentials` → removed; features in core / install docs separately
- `@storybook/addon-interactions` → in core
- `@storybook/test` → use `storybook/test`
- `@storybook/blocks` → empty / stopped publishing with modern majors

## Research Notes

- Official docs: `https://storybook.js.org/docs` (versioned paths under `/docs/10/` when needed).
- Context7 library: `/storybookjs/storybook` (prefer version `v10.2.9` or newer indexed tags; verify against live docs for 10.5.x drift).
- Full breaking-change dump: `https://github.com/storybookjs/storybook/blob/v10.5.5/MIGRATION.md`
- User-facing 9→10 guide: `https://storybook.js.org/docs/releases/migration-guide`

## Official Docs (Storybook 10)

Getting started:

- Install: `https://storybook.js.org/docs/get-started/install`
- Frameworks index: `https://storybook.js.org/docs/get-started/frameworks`
- React Vite: `https://storybook.js.org/docs/get-started/frameworks/react-vite`
- Next.js Vite: `https://storybook.js.org/docs/get-started/frameworks/nextjs-vite`

Stories:

- Writing stories: `https://storybook.js.org/docs/writing-stories`
- Args: `https://storybook.js.org/docs/writing-stories/args`
- Args types / controls: `https://storybook.js.org/docs/api/arg-types`
- Parameters: `https://storybook.js.org/docs/writing-stories/parameters`
- Decorators: `https://storybook.js.org/docs/writing-stories/decorators`
- Tags: `https://storybook.js.org/docs/writing-stories/tags`
- Loaders: `https://storybook.js.org/docs/writing-stories/loaders`
- TypeScript: `https://storybook.js.org/docs/writing-stories/typescript`
- CSF: `https://storybook.js.org/docs/api/csf`
- CSF Next: `https://storybook.js.org/docs/api/csf/csf-next`

Config:

- Main config: `https://storybook.js.org/docs/api/main-config/main-config`
- Features / manager UI: `https://storybook.js.org/docs/configure/user-interface/features-and-behavior`
- Theming: `https://storybook.js.org/docs/configure/user-interface/theming`

Docs:

- Autodocs: `https://storybook.js.org/docs/writing-docs/autodocs`
- MDX: `https://storybook.js.org/docs/writing-docs/mdx`
- Doc blocks: `https://storybook.js.org/docs/writing-docs/doc-blocks`

Testing:

- Overview: `https://storybook.js.org/docs/writing-tests`
- Interaction testing: `https://storybook.js.org/docs/writing-tests/interaction-testing`
- Vitest addon: `https://storybook.js.org/docs/writing-tests/integrations/vitest-addon`
- Accessibility: `https://storybook.js.org/docs/writing-tests/accessibility-testing`
- Visual tests: `https://storybook.js.org/docs/writing-tests/visual-testing`
- Portable stories (Vitest): `https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest`
- Test runner (legacy path): `https://storybook.js.org/docs/writing-tests/integrations/test-runner`

Releases:

- Migration guide (10): `https://storybook.js.org/docs/releases/migration-guide`
- Addon migration (10): `https://storybook.js.org/docs/addons/addon-migration-guide`

## Requirements Snapshot (10.x)

From install docs / migration notes:

- Node `20.19+` or `22.12+` (Storybook 10)
- Vite `5+` (Vite 4 dropped in 9+)
- TypeScript `4.9+`
- Vitest `3+` for addon-vitest (`^3 || ^4` peers on 10.5.5)
- npm `10+` / pnpm `9+` / Yarn `4+` recommended

## Refresh Triggers

Refresh docs before relying on this skill when:

- `storybook` major/minor moves past the snapshot versions above.
- Tasks mention CSF Next factories, Vitest 4 projects API, or Next.js framework switches.
- Local code still imports `@storybook/test`, `@storybook/addon-essentials`, `@storybook/addon-interactions`, or renderer packages instead of frameworks.
- `main` config still uses CJS (`require`, `module.exports`, `__dirname`).
- Automigrate / doctor output disagrees with memorized package paths.
