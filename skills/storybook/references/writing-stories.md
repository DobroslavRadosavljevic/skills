# Writing Stories

## File Layout

Colocate stories with components:

```text
components/Button/
  Button.tsx
  Button.stories.tsx
```

Story files are development-only and stay out of the production app bundle when ignored by the app bundler.

## CSF3 (Default)

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Button } from './Button'

const meta = {
  component: Button,
  args: {
    onClick: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
}

export const Secondary: Story = {
  args: {
    ...Primary.args,
    primary: false,
  },
}
```

Rules:

- Default export = meta (`component` and/or statically readable `title` / `id`).
- Named exports = stories (UpperCamelCase).
- Prefer `satisfies Meta<typeof Component>` for typed args.
- Reuse args via object spread or by importing sibling story modules for composites.

### Custom `render`

```tsx
export const InAlert: Story = {
  args: { label: 'Save' },
  render: (args) => (
    <Alert>
      <Button {...args} />
    </Alert>
  ),
}
```

Always spread `args` onto the target so Controls keep working. Put shared custom renders on meta when every story needs them.

### React Hooks In Stories

Prefer args. If hooks are required, render a nested component from `render`—do not call React hooks directly in the story object factory incorrectly. For Storybook-managed args updates, use `useArgs` from `storybook/preview-api` and do not mix Storybook hooks with React `useState`/`useEffect` in the same render path.

## CSF Next (Experimental)

Opt-in typesafe factories via `definePreview` in preview, then:

```ts
import preview from '../.storybook/preview'
import { Button } from './Button'

const meta = preview.meta({ component: Button })

export const Basic = meta.story()
export const WithProp = meta.story({
  args: { label: 'Hi' },
})
```

Only adopt when the project already enabled CSF Next or the user asks for it. Do not migrate entire libraries casually—API is preview-quality.

## Args, ArgTypes, Parameters, Decorators

| Concept | Role |
| --- | --- |
| `args` | Live, serializable inputs (props) editable via Controls |
| `argTypes` | Control widgets, descriptions, mappings for complex values |
| `parameters` | Static addon/feature config (docs, layout, a11y rules, …) |
| `decorators` | Wrap stories (providers, layout, theme) |
| `loaders` / `beforeEach` | Async setup before render |
| `globals` / `globalTypes` | Toolbar-driven cross-story state (locale, theme, a11y manual, …) |

Mock callbacks with `fn()` from `storybook/test` so Actions and assertions work.

Map non-serializable control values:

```ts
argTypes: {
  label: {
    control: 'select',
    options: ['Normal', 'Bold'],
    mapping: { Bold: <b>Bold</b> },
  },
}
```

## Tags

Common built-ins:

- `autodocs` — include in autodocs page; `!autodocs` to exclude a story
- `dev` / `test` — default inclusion in UI vs test runs; negate with `!dev` / `!test`
- Custom tags for sidebar filters (`stable`, `experimental`, …)

```ts
const meta = {
  component: Button,
  tags: ['autodocs', 'stable'],
} satisfies Meta<typeof Button>

export const Experimental: Story = {
  tags: ['!stable', 'experimental'],
}
```

Removed in 10: undocumented `dev-only` / `docs-only` / `test-only` — use `dev` / `autodocs` / `test` instead.

## Docs

- Autodocs: add `tags: ['autodocs']` (or project-wide config) with `@storybook/addon-docs`.
- Write richer pages in MDX beside stories when autodocs is insufficient.
- Keep doc examples driven by the same CSF stories when possible.

## Play Functions (Authoring Side)

```tsx
import { expect } from 'storybook/test'

export const FilledForm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }))
    await expect(canvas.getByText(/ready/i)).toBeInTheDocument()
  },
}
```

Prefer role/label queries. See [testing.md](testing.md) for Vitest automation and portable stories.

## Multi-Component Stories

Compose children via custom `render`, and reuse child story args:

```tsx
import { Selected, Unselected } from './ListItem.stories'

export const ManyItems: Story = {
  render: (args) => (
    <List {...args}>
      <ListItem {...Selected.args} />
      <ListItem {...Unselected.args} />
    </List>
  ),
}
```

Tradeoff: deep composition can fight Controls—prefer args-driven APIs when the component allows it.
