# Storybook Source Map

Snapshot date: 2026-10-01 (previous: 2026-07-31 at 10.5.5).

## Current Package Evidence

| Package / tag | Version | Notes |
| --- | --- | --- |
| `storybook` `latest` | `10.6.1` | Core CLI + consolidated APIs (10.6.0 on 2026-09-02, 10.6.1 on 2026-09-29) |
| `storybook` `v9` | `9.1.20` | Previous major |
| `storybook` `v8` | `8.6.18` | Older major still tagged |
| `storybook` `next` | `11.0.0-alpha.1` | Storybook 11 prerelease — do not target unless the repo opts in |
| `@storybook/react-vite` | `10.6.1` | Preferred React + Vite framework |
| `@storybook/nextjs-vite` | `10.6.1` | Required for Vitest addon on Next |
| `@storybook/addon-docs` | `10.6.1` | Separate from core |
| `@storybook/addon-a11y` | `10.6.1` | Accessibility tests |
| `@storybook/addon-vitest` | `10.6.1` | Story → Vitest browser tests (Vitest `^3 \|\| ^4 \|\| ^5`) |
| `@storybook/addon-mcp` | `10.6.1` | MCP server for agents; version-aligned with core since 10.6 (was `0.7.x`) |
| `@storybook/vue3-vite` / `sveltekit` / `angular` | `10.6.1` | Other frameworks |

Stale packages still on npm at 8.x (do **not** add on Storybook 10):

- `@storybook/addon-essentials` → removed; features in core / install docs separately
- `@storybook/addon-interactions` → in core
- `@storybook/test` → use `storybook/test`
- `@storybook/blocks` → empty / stopped publishing with modern majors

## 10.6 Highlights (current)

- Agent tooling: `storybook skills` (skill ids `stories`, `write-story`, `setup`; `--all`, `-c`, `--cwd`) and `storybook tools` (runs the MCP toolsets from the CLI, attaching to the running dev server). `storybook ai` is **deprecated** in favor of `storybook skills` (docs pages still show `ai setup`).
- `@storybook/addon-mcp` now ships with the monorepo version. Toolsets: development (`stories-changed`, `get-storybook-story-instructions`, `stories-preview`, `stories-find-by-component`, `review-create`), docs (`docs-list`, `docs-show`, `docs-show-story`), testing (`test-run`).
- Docs toolset needs `features.componentsManifest: true`; available for React frameworks, `@storybook/angular-vite`, and `@storybook/vue3-vite` (Vue also needs `experimentalDocgenServer`).
- `storybook upgrade --features <list>` opts into experimental flags such as `experimentalReview`, `experimentalDocgenServer`; `--yes` skips those opt-ins.
- Experimental Playwright CT integration removed from core.
- 10.6.1: Vitest 5 browser tests, a11y vision simulator fix on Firefox.

## Storybook 11 Preview (`next`, alpha — not for production)

Announced in `11.0.0-alpha.*` notes: Node **22.12+** required, Create React App support removed, Yarn PnP removed, `@storybook/nextjs` deprecated (removal in 12; use `@storybook/nextjs-vite`), Vitest 4 floor for the Vitest addon. Re-check before advising upgrades.

## Research Notes

- Official docs: `https://storybook.js.org/docs` (versioned paths under `/docs/10/` when needed).
- Context7 library: `/storybookjs/storybook` (prefer version `v10.2.9` or newer indexed tags; verify against live docs for 10.6.x drift).
- Full breaking-change dump: `https://github.com/storybookjs/storybook/blob/v10.6.1/MIGRATION.md`
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

AI / agents (preview):

- Overview: `https://storybook.js.org/docs/ai`
- Agentic setup: `https://storybook.js.org/docs/ai/setup`
- MCP server: `https://storybook.js.org/docs/ai/mcp/overview`
- Manifests: `https://storybook.js.org/docs/ai/manifests`
- Best practices: `https://storybook.js.org/docs/ai/best-practices`

Releases:

- Migration guide (10): `https://storybook.js.org/docs/releases/migration-guide`
- Addon migration (10): `https://storybook.js.org/docs/addons/addon-migration-guide`

## Requirements Snapshot (10.x)

From install docs / migration notes:

- Node `20.19+` or `22.12+` (Storybook 10)
- Vite `5`–`8` (`@storybook/react-vite` peers `^5 || ^6 || ^7 || ^8`; Vite 4 dropped in 9+)
- TypeScript `4.9+`
- Vitest `3+` for addon-vitest (`^3 || ^4 || ^5` peers on 10.6.1; Vitest 5 browser tests supported since 10.6.1)
- npm `10+` / pnpm `9+` / Yarn `4+` recommended

## Refresh Triggers

Refresh docs before relying on this skill when:

- `storybook` major/minor moves past the snapshot versions above.
- Tasks mention CSF Next factories, Vitest 4 projects API, or Next.js framework switches.
- Local code still imports `@storybook/test`, `@storybook/addon-essentials`, `@storybook/addon-interactions`, or renderer packages instead of frameworks.
- `main` config still uses CJS (`require`, `module.exports`, `__dirname`).
- Automigrate / doctor output disagrees with memorized package paths.
