# Tailwind Source Map

Snapshot date: 2026-07-08.

Refresh official docs before high-risk migrations, when the user asks for latest/current behavior, or when the project uses a version outside this snapshot.

## Captured Latest Versions

- `tailwindcss` npm `latest`: `4.3.2`.
- `@tailwindcss/vite` npm `latest`: `4.3.2`.
- `@tailwindcss/postcss` npm `latest`: `4.3.2`.
- `@tailwindcss/cli` npm `latest`: `4.3.2`.
- `@tailwindcss/webpack` npm `latest`: `4.3.2`.
- `prettier-plugin-tailwindcss` npm `latest`: `0.8.0`.
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

## Current v4 Baseline

Tailwind CSS v4 is the current major version. Its default model is:

- CSS-first configuration.
- A single CSS import: `@import "tailwindcss";`.
- Theme variables in CSS through `@theme`.
- Automatic source detection.
- Built-in CSS import handling.
- Dedicated packages for Vite, PostCSS, CLI, and webpack integration.
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

Tailwind v4.2/v4.3 additions captured from the latest release notes:

- First-class `@tailwindcss/webpack` loader for webpack and compatible Turbopack paths.
- New `mauve`, `olive`, `mist`, and `taupe` palettes.
- More logical property utilities, including block-start/block-end spacing and logical inset utilities.
- `font-features-*` utilities for OpenType feature controls.
- First-party scrollbar styling utilities.
- `@container-size` utility for size containers.
- `zoom-*` utilities.
- `tab-*` utilities.
- Stacked and compound `@variant` support inside CSS.
- Default values for functional utilities.

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
