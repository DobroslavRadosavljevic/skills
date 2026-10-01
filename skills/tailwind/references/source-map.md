# Tailwind Source Map

Snapshot date: 2026-10-01.

Refresh official docs before high-risk migrations, when the user asks for latest/current behavior, or when the project uses a version outside this snapshot.

## Captured Latest Versions

- `tailwindcss` npm `latest`: `4.3.3` (released 2026-07-16).
- `@tailwindcss/vite` npm `latest`: `4.3.3`.
- `@tailwindcss/postcss` npm `latest`: `4.3.3`.
- `@tailwindcss/cli` npm `latest`: `4.3.3`.
- `@tailwindcss/webpack` npm `latest`: `4.3.3`.
- `@tailwindcss/turbopack` npm `latest`: `4.3.3` (first published 2026-07-31; the core CHANGELOG still lists it under Unreleased and the docs site has no install guide yet).
- `@tailwindcss/upgrade` npm `latest`: `4.3.3`.
- `prettier-plugin-tailwindcss` npm `latest`: `0.8.1` (requires Prettier 3.7+ since `0.8.0`).
- `tailwindcss` npm `v3-lts`: `3.4.19`.
- Tailwind packages also exposed an `insiders` tag at capture time. Do not use insiders unless the repository already opts into it.

## Primary Docs Used

- Context7 selected library: `/tailwindlabs/tailwindcss.com`.
- Docs home: https://tailwindcss.com/docs
- Installation: https://tailwindcss.com/docs/installation
- Vite installation: https://tailwindcss.com/docs/installation/using-vite
- PostCSS installation: https://tailwindcss.com/docs/installation/using-postcss
- Tailwind CLI: https://tailwindcss.com/docs/installation/tailwind-cli
- Framework guides: https://tailwindcss.com/docs/installation/framework-guides
- Upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Detecting classes: https://tailwindcss.com/docs/detecting-classes-in-source-files
- Styling with utility classes: https://tailwindcss.com/docs/styling-with-utility-classes
- Theme variables: https://tailwindcss.com/docs/theme
- Functions and directives: https://tailwindcss.com/docs/functions-and-directives
- Adding custom styles: https://tailwindcss.com/docs/adding-custom-styles
- Hover, focus, and other states: https://tailwindcss.com/docs/hover-focus-and-other-states
- Responsive design: https://tailwindcss.com/docs/responsive-design
- Dark mode: https://tailwindcss.com/docs/dark-mode
- Preflight: https://tailwindcss.com/docs/preflight
- Editor setup: https://tailwindcss.com/docs/editor-setup
- Tailwind CSS v4.0 release: https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind CSS v4.3 release: https://tailwindcss.com/blog/tailwindcss-v4-3
- Core changelog: https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md
- Turbopack loader README: https://github.com/tailwindlabs/tailwindcss/tree/main/packages/%40tailwindcss-turbopack
- webpack loader README: https://github.com/tailwindlabs/tailwindcss/tree/main/packages/%40tailwindcss-webpack
- Prettier plugin releases: https://github.com/tailwindlabs/prettier-plugin-tailwindcss/releases

## Current v4 Baseline

Tailwind CSS v4 is the current major version. Its default model is:

- CSS-first configuration.
- A single CSS import: `@import "tailwindcss";`.
- Theme variables in CSS through `@theme`.
- Automatic source detection.
- Built-in CSS import handling.
- Dedicated packages for Vite, PostCSS, CLI, webpack, and Turbopack integration.
- Native cascade layers and modern CSS features.

Tailwind v4 is designed for modern browsers: Safari 16.4+, Chrome 111+, and Firefox 128+. Keep v3.4 if the project must support older browsers.

## v4 Feature Orientation

Tailwind v4 introduced or emphasized:

- High-performance engine with much faster incremental rebuilds.
- CSS theme variables for design tokens.
- Dynamic utility values and variants.
- Modern P3 color palette.
- Container query APIs without a separate plugin.
- 3D transform utilities.
- Expanded gradient APIs.
- `@starting-style`, `not-*`, `inert`, color-scheme, field-sizing, and more variants/utilities.
- Official Prettier plugin support for class sorting.

Tailwind v4.2 additions:

- First-class `@tailwindcss/webpack` loader for webpack and compatible Turbopack paths.
- New `mauve`, `olive`, `mist`, and `taupe` palettes.
- Logical property utilities: `pbs-*`/`pbe-*`, `mbs-*`/`mbe-*`, `scroll-pbs-*`/`scroll-mbs-*` (and `-be`), `border-bs-*`/`border-be-*`, `inline-*`/`min-inline-*`/`max-inline-*`, `block-*`/`min-block-*`/`max-block-*`, and `inset-s-*`/`inset-e-*`/`inset-bs-*`/`inset-be-*`.
- `font-features-*` utilities for `font-feature-settings`.

Tailwind v4.3 additions:

- `scrollbar-{auto,thin,none}`, `scrollbar-thumb-*`, `scrollbar-track-*`, and `scrollbar-gutter-*` utilities.
- `@container-size` utility for size containers.
- `zoom-*` utilities.
- `tab-*` utilities.
- Stacked (`@variant hover:focus { … }`) and compound (`@variant hover, focus { … }`) `@variant` support inside CSS.
- `--default(…)` inside `--value(…)` and `--modifier(…)` for functional `@utility` definitions.

Tailwind v4.3.1-v4.3.3 patch notes worth knowing:

- `@tailwindcss/cli` gained `--silent` (4.3.1) and `--watch --poll[=ms]` for unreliable filesystem events (4.3.3).
- Spacing utilities now emit `0` for `m-0`/`left-0` and `var(--spacing)` for `m-1` instead of `calc(var(--spacing) * n)` (4.3.1). Update snapshot tests that assert generated CSS.
- `@apply` works with CSS mixins (4.3.1).
- `auto-rows-*` and `auto-cols-*` accept bare spacing values such as `auto-rows-12` (4.3.2).
- The default `--font-sans` theme value and Preflight font stack now list explicit platform fonts instead of `system-ui`/`ui-sans-serif` so CJK text respects `lang` on Windows (4.3.3). Expect visual-diff noise on Windows after upgrading.
- `@tailwindcss/upgrade` no longer rewrites git-ignored files, including when run from a subdirectory (4.2.3, 4.3.3).

Unreleased on `main` at snapshot time (do not rely on it until a release ships): `@scope`-based custom variant fixes, canonicalizing arbitrary breakpoints like `max-[64rem]` to `max-lg`, WASM fallback for `@tailwindcss/oxide`, and dropping utilities that use an ignored modifier (for example `rounded-sm/[5]`).

## Refresh Triggers

Refresh docs before work involving:

- A v3-to-v4 upgrade.
- Browser support decisions.
- JavaScript config compatibility.
- Legacy plugins or presets.
- `@apply` inside CSS modules, Vue, Svelte, or Astro style blocks.
- Monorepo source detection.
- Safelisting or excluding generated classes.
- New directives, custom utilities, or custom variants.
