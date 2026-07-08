# Base UI Source Map

## Snapshot

- Fetched: 2026-07-08.
- Package: `@base-ui/react`.
- npm dist-tag checked on 2026-07-08: `latest` is `1.6.0`.
- Context7 library ID: `/mui/base-ui`.
- Official docs root: https://base-ui.com/
- Agent docs index: https://base-ui.com/llms.txt
- Full agent docs: https://base-ui.com/llms-full.txt
- GitHub repository: https://github.com/mui/base-ui

The official docs repeatedly state that older knowledge should defer to the docs and that the old package name `@base-ui-components/react` was renamed to `@base-ui/react`. Use `@base-ui/react` in imports and installation instructions.

## High-Value Docs Pages

- Quick start: https://base-ui.com/react/overview/quick-start.md
- Accessibility: https://base-ui.com/react/overview/accessibility.md
- Releases: https://base-ui.com/react/overview/releases.md
- v1.6.0 release notes: https://base-ui.com/react/overview/releases/v1-6-0.md
- Styling: https://base-ui.com/react/handbook/styling.md
- Animation: https://base-ui.com/react/handbook/animation.md
- Composition: https://base-ui.com/react/handbook/composition.md
- Customization: https://base-ui.com/react/handbook/customization.md
- Forms: https://base-ui.com/react/handbook/forms.md
- TypeScript: https://base-ui.com/react/handbook/typescript.md

Use the `.md` form of a component URL to fetch Markdown for exact APIs, for example:

```text
https://base-ui.com/react/components/popover.md
https://base-ui.com/react/components/select.md
https://base-ui.com/react/components/field.md
```

## Component Inventory

Disclosure and layout:

- Accordion
- Collapsible
- Separator
- Scroll Area

Overlays and positioned UI:

- Alert Dialog
- Dialog
- Drawer
- Popover
- Preview Card
- Tooltip

Menus and navigation:

- Menu
- Context Menu
- Menubar
- Navigation Menu
- Tabs
- Toolbar

Selection and inputs:

- Autocomplete
- Combobox
- Select
- Checkbox
- Checkbox Group
- Radio
- Number Field
- OTP Field
- Slider
- Switch
- Toggle
- Toggle Group
- Input
- Field
- Fieldset
- Form

Feedback and display:

- Avatar
- Button
- Meter
- Progress
- Toast

Utilities:

- CSP Provider
- Direction Provider
- `mergeProps`
- `useRender`

## Release Notes To Remember

For v1.6.0, the docs call out many bug fixes across Accordion, Dialog, Drawer, Field/Form, Menu, Number Field, Popover, Select, Slider, Tabs, Toast, Tooltip, and others. Practical impact: verify exact behavior from current docs when dealing with focus return, positioning, validation, controlled hover state, swipe gestures, or selected-value edge cases.

The v1.6.0 notes also include a breaking import rename for OTP Field preview: use `{ OTPField } from '@base-ui/react/otp-field'`.
