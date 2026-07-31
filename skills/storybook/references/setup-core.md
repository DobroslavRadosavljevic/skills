# Setup And Core Config

## Install

New projects:

```sh
bunx create storybook@latest
```

Equivalent: `bunx storybook@latest init`. Use `--type <framework>` when detection fails (`react`, `nextjs`, `vue3`, `sveltekit`, `angular`, …). Feature flags:

```sh
bunx create storybook@latest --features docs test a11y
```

Recommended install includes docs, testing, and a11y; Minimal is component-dev only.

Upgrade existing Storybook:

```sh
bunx storybook@latest upgrade
bunx storybook doctor
```

Add an official addon:

```sh
bunx storybook add @storybook/addon-docs
bunx storybook add @storybook/addon-a11y
bunx storybook add @storybook/addon-vitest
```

## Framework Packages

Prefer **framework** packages for config and TypeScript imports:

| Stack | Framework package |
| --- | --- |
| React + Vite | `@storybook/react-vite` |
| Next.js + Vite (tests) | `@storybook/nextjs-vite` |
| Next.js Webpack | `@storybook/nextjs` |
| Vue 3 + Vite | `@storybook/vue3-vite` |
| SvelteKit | `@storybook/sveltekit` |
| Angular | `@storybook/angular` |
| Web Components + Vite | `@storybook/web-components-vite` |

```ts
import type { Meta, StoryObj } from '@storybook/react-vite'
```

Do not keep a separate `@storybook/react` dependency just for types when the framework already provides them.

## Main Config (ESM Required)

`.storybook/main.ts` must be valid ESM—no `require`, no `__dirname`/`__filename`.

```ts
import type { StorybookConfig } from '@storybook/react-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  staticDirs: ['../public'],
}

export default config
```

### What Belongs In `addons`

| Feature | Where it lives in SB 10 |
| --- | --- |
| Controls, Actions, Viewport, Interactions panel | **Core** — do not list essentials packages |
| Docs / Autodocs / MDX | `@storybook/addon-docs` |
| Accessibility | `@storybook/addon-a11y` |
| Component tests in Vitest | `@storybook/addon-vitest` |
| Visual / Chromatic | Chromatic addon / service as used by the repo |

Remove leftover `@storybook/addon-essentials`, `@storybook/addon-interactions`, `@storybook/addon-actions`, `@storybook/addon-controls`, `@storybook/addon-viewport` from `addons` and dependencies.

## Preview Config

```ts
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <div style={{ margin: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  // Use initialGlobals — not deprecated preview `globals`
  initialGlobals: {
    locale: 'en',
  },
  globalTypes: {
    locale: {
      description: 'Locale',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: ['en', 'es'],
      },
    },
  },
}

export default preview
```

Viewport / background story overrides use story/meta `globals` (not only parameters) in modern Storybook—follow current essentials docs when setting per-story viewport/background.

## Scripts

Typical `package.json` scripts after init:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test-storybook": "vitest --project=storybook"
  }
}
```

## Core Subpath Imports

| Need | Import |
| --- | --- |
| `expect`, `fn`, `userEvent`, `within`, … | `storybook/test` |
| Actions helpers | `storybook/actions` |
| Preview hooks (`useArgs`, …) | `storybook/preview-api` |
| Manager UI config | `storybook/manager-api` |
| Theming | `storybook/theming` |
| Viewport utilities | `storybook/viewport` |

## Manager UI Tweaks

Optional `.storybook/manager.ts`:

```ts
import { addons } from 'storybook/manager-api'

addons.setConfig({
  panelPosition: 'bottom',
  sidebar: { showRoots: true },
})
```

## Telemetry

CLI enables anonymous telemetry by default. Opt out per Storybook docs / env if the project requires it—do not invent custom telemetry hooks in stories.
