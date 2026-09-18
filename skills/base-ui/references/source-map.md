# Base UI Source Map

## Snapshot

- Fetched: 2026-09-18.
- Package: `@base-ui/react`.
- npm dist-tag checked on 2026-09-18: `latest` is `1.8.0` (published 2026-09-04).
- Prior line in this catalog: `1.6.0` (2026-06-18). Intermediate: `1.7.0` (2026-08-04).
- Context7 library ID: `/mui/base-ui`.
- Official docs root: https://base-ui.com/
- Agent docs index: https://base-ui.com/llms.txt
- Full agent docs: https://base-ui.com/llms-full.txt
- GitHub repository: https://github.com/mui/base-ui
- GitHub changelog: https://github.com/mui/base-ui/blob/master/CHANGELOG.md
- GitHub tag: https://github.com/mui/base-ui/releases/tag/v1.8.0

The official docs repeatedly state that older knowledge should defer to the docs and that the old package name `@base-ui-components/react` was renamed to `@base-ui/react`. Use `@base-ui/react` in imports and installation instructions.

1.7.0 and 1.8.0 added **no new top-level components**. Inventory below matches `https://base-ui.com/llms.txt` and `packages/react/src/index.ts` at tag `v1.8.0`.

## High-Value Docs Pages

- Quick start: https://base-ui.com/react/overview/quick-start.md
- Accessibility: https://base-ui.com/react/overview/accessibility.md
- Releases: https://base-ui.com/react/overview/releases.md
- v1.7.0 release notes: https://base-ui.com/react/overview/releases/v1-7-0.md
- v1.8.0 release notes: https://base-ui.com/react/overview/releases/v1-8-0.md
- Styling: https://base-ui.com/react/handbook/styling.md
- Animation: https://base-ui.com/react/handbook/animation.md
- Composition: https://base-ui.com/react/handbook/composition.md
- Customization: https://base-ui.com/react/handbook/customization.md
- Forms: https://base-ui.com/react/handbook/forms.md
- TypeScript: https://base-ui.com/react/handbook/typescript.md

Use the `.md` form of a component URL to fetch Markdown for exact APIs, for example:

```text
https://base-ui.com/react/components/combobox.md
https://base-ui.com/react/components/toast.md
https://base-ui.com/react/components/otp-field.md
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

Do not treat `Combobox.createItems`, `Dialog.createHandle`, `Toast.createToastManager`, `Drawer.VirtualKeyboardProvider`, or similar as extra top-level components. They are APIs or parts on existing modules.

## Changes Since 1.6.0

### v1.8.0 (2026-09-04)

Headline APIs:

- `Combobox.createItems` collection for deriving selection values and labels from source records. Autocomplete does **not** export `createItems`.
- `toastManager.update(id, (prevToast) => options)` derives updates from the current toast. Object-form `update` still replaces listed fields, including `data` as a whole.
- `<Avatar.Image keepMounted>` renders the image immediately so native `loading="lazy"` and optimizers such as `next/image` work. Default remains preload-then-mount.

Also: Menu/Popover trigger mount is faster; Combobox/Autocomplete/Select can open and browse while `readOnly`; Field publishes neutral validity (`valid: null`) while async validation is in flight; Form `clearErrors` no longer drops concurrent field updates; outside-press on Dialog/Alert Dialog/Popover ignores presses that began before open.

### v1.7.0 (2026-08-04)

- `<ScrollArea.Thumb>` adds WebKit overscroll feedback.
- `render` callback props are typed from the rendered element.
- Form focuses the first invalid field in document order.
- Combobox/Autocomplete change reasons include `input-press` and `cancel-open`.
- Combobox inline lists expose `expanded` state; keep `open` set when using `inline`.
- Toast `Title`/`Description`/`Action` honor `render` children; bundle size reductions across many components.
- Popup roots ignore open requests after remounting with a reused handle.

### Still true from 1.6.0

- OTP Field is stable: `{ OTPField } from '@base-ui/react/otp-field'` (not `OTPFieldPreview`).
- Drawer is stable and includes `Drawer.VirtualKeyboardProvider` for mobile keyboards.
- Accordion keyboard navigation follows APG.

## Current-Docs Check

When exact API details matter:

1. Resolve Context7 library `Base UI`; prefer `/mui/base-ui`.
2. Query docs for the exact component or concept.
3. If Context7 is insufficient, fetch the component Markdown page from `https://base-ui.com/llms.txt`.
4. Cross-check the project's installed `@base-ui/react` version if it is pinned below `1.8.0`.
