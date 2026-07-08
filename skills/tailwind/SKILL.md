---
name: tailwind
description: Build, review, debug, configure, or migrate Tailwind CSS projects using current Tailwind documentation. Use for Tailwind CSS v4 utilities, CSS-first configuration, theme variables, Vite/PostCSS/CLI setup, source detection, variants, responsive design, dark mode, Preflight, custom utilities, @apply/@reference, Prettier class sorting, and v3-to-v4 upgrades.
---

# Tailwind

Use this skill to make Tailwind CSS decisions from current docs plus the local project's actual Tailwind version, integration path, and design conventions.

## Workflow

1. Identify the Tailwind surface:
   - Read the nearest project guidance and package manifests.
   - Check installed versions of `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/postcss`, `@tailwindcss/cli`, `prettier-plugin-tailwindcss`, and framework packages.
   - Inspect CSS entry files, `vite.config.*`, PostCSS config, framework config, `tailwind.config.*`, and class composition helpers.
2. Refresh docs when the user asks for latest/current behavior, when versions differ from the captured snapshot, or when touching v4 migration/configuration:
   - Use [source-map.md](references/source-map.md) for the captured latest-version snapshot and official source links.
3. Load the focused reference file:
   - [setup-and-migration.md](references/setup-and-migration.md): installation paths, package split, v3-to-v4 upgrade, browser support, and migration hazards.
   - [core-utilities.md](references/core-utilities.md): utility-class composition, source detection, responsive design, dark mode, variants, arbitrary values, Preflight, and accessibility.
   - [css-directives-and-theme.md](references/css-directives-and-theme.md): `@theme`, `@source`, `@utility`, `@variant`, `@custom-variant`, `@apply`, `@reference`, `@config`, `@plugin`, and Tailwind CSS functions.
4. Implement in the existing project style:
   - Prefer the project's current Tailwind major version and integration package.
   - Use complete, statically detectable class names. Map props or states to full class strings instead of interpolating fragments.
   - Prefer design-token utilities and theme variables over one-off arbitrary values.
   - Add custom CSS only when utilities, theme variables, variants, or component composition are not the right fit.
   - Do not migrate a v3 project to v4 unless the user asks or the task requires it.
5. Verify the smallest meaningful surface:
   - Run the relevant style build, framework build, typecheck, lint, tests, Storybook, or browser check.
   - For visible UI changes, inspect the actual rendered state when feasible.
   - Report any verification you could not run.

## Tailwind Judgment

- Treat Tailwind v4 as CSS-first: `@import "tailwindcss";`, theme variables in CSS, and dedicated Vite/PostCSS/CLI integration packages.
- Use `@source` for monorepos, ignored external packages, multiple stylesheets, safelisting, and source exclusions.
- Keep responsive styles mobile-first: unprefixed utilities target all sizes, breakpoint prefixes apply at that breakpoint and above.
- Keep dark mode explicit: use default `prefers-color-scheme` behavior or define a project selector with `@custom-variant dark`.
- Treat Preflight as active when Tailwind is imported. Account for reset margins, unstyled headings/lists, border reset, block images, responsive media, and hidden attributes.
- Prefer official framework guides when a framework owns the CSS pipeline.
- If the project must support Safari below 16.4, Chrome below 111, or Firefox below 128, do not choose Tailwind v4 without an explicit compatibility decision.
