# Testing

## Mental Model

Every story is a render test. Add a `play` function to simulate user behavior and assert outcomes. Run those stories in:

1. Storybook UI Interactions panel (debug)
2. **Vitest addon** (recommended for Vite apps)
3. Portable stories API (`composeStories` / `run`) when you need hand-written Vitest/Jest cases
4. Legacy **test-runner** only when Vitest addon is not viable

## Interaction Tests

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { LoginForm } from './LoginForm'

const meta = {
  component: LoginForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyForm: Story = {}

export const FilledForm: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(canvas.getByLabelText(/email/i), 'email@provider.com')
    await userEvent.type(canvas.getByLabelText(/password/i), 'a-random-password')
    await userEvent.click(canvas.getByRole('button', { name: /log in/i }))

    await expect(args.onSubmit).toHaveBeenCalled()
    await expect(canvas.getByText(/ready/i)).toBeInTheDocument()
  },
}
```

Notes:

- Import from `storybook/test`, not `@storybook/test` or `@storybook/testing-library`.
- `canvas` is Testing Library queries scoped to the story root (`getBy…`, `findBy…`, …).
- Prefer `userEvent` over raw `fireEvent`.
- Use `fn()` spies in `args` for callback assertions.
- Steps can be grouped with `storybook/test` step helpers when debugging long plays.

Exclude a story from automated test runs with `tags: ['!test']` when it is docs-only or intentionally flaky/manual.

## Vitest Addon (Preferred)

Requirements:

- Vite-based Storybook framework
- Vitest ≥ 3 (peers also allow Vitest 4)
- Playwright Chromium for browser mode (recommended)
- Next.js: `@storybook/nextjs-vite` (not Webpack-only `@storybook/nextjs`)

Install:

```sh
bunx storybook add @storybook/addon-vitest
```

This registers the addon, configures Vitest browser mode, and usually adds `.storybook/vitest.setup.ts`.

Example Vitest project (shape varies by Vitest 3 vs 4; prefer what the addon writes):

```ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import viteConfig from './vite.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
              storybookScript: 'bun run storybook -- --no-open',
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        },
      ],
    },
  }),
)
```

Run:

```sh
bunx vitest --project=storybook
```

Or use the Storybook testing widget (watch mode, filter failures, jump to Interactions).

If the app already has Vitest unit tests, keep Storybook in a **separate Vitest project/workspace** so browser mode does not collide with node/jsdom unit config.

## Portable Stories

Prefer the Vitest addon when possible. Use portable stories for explicit unit-style tests:

```ts
import { test, expect } from 'vitest'
import { composeStories } from '@storybook/react-vite'
import * as stories from './Button.stories'

const { Primary } = composeStories(stories)

test('primary', async () => {
  await Primary.run()
  // assert via Testing Library screen/canvas as needed
})
```

Call `setProjectAnnotations` once in setup (preview + addon preview exports) so decorators/loaders apply. Prefer `run()` so loaders/`play` execute.

Override globals per composition when locale/theme matters:

```ts
const PrimaryEs = composeStory(PrimaryStory, meta, { globals: { locale: 'es' } })
```

## Accessibility

With `@storybook/addon-a11y`:

- Component/a11y parameters configure rules/context.
- Manual mode uses **globals**, not deprecated `parameters.a11y.manual`:

```ts
export const ManualCheck: Story = {
  globals: {
    a11y: { manual: true },
  },
}
```

Run a11y alongside component tests from the testing widget when both addons are installed.

## Visual Testing

Use the repo’s Chromatic / visual addon pipeline when present. Keep visual stories stable (deterministic data, fonts, no random content). Pair screenshot diffs with interaction/a11y assertions when failures are semantic.

## Test Runner (Legacy)

`@storybook/test-runner` still exists for some Webpack or non-Vitest setups. For Vite React/Vue/Svelte, migrate to `@storybook/addon-vitest` instead of expanding test-runner usage.
