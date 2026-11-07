---
name: react-aria
description: "Build, review, debug, migrate, or plan accessible React UI with React Aria (react-aria-components 1.22, react-aria hooks, react-stately) and the @internationalized packages (date, number, string, message). Use for react-aria-components, RAC, Select, ComboBox, Autocomplete, Menu, ListBox, Table, GridList, Tree, NavigationTree, TagGroup, TokenField, Dialog, Modal, Popover, Tooltip, Sheet, PreviewTrigger, Toast, Tabs, Calendar, DatePicker, DateRangePicker, DateField, TimeField, color pickers, Slider, NumberField, Form validation, FieldError, render props, slots, contexts, data-* state styling, tailwindcss-react-aria-components, useDragAndDrop, Virtualizer, useListData, useAsyncList, usePress, useHover, useFocusRing, useSelect, useComboBox, useTable, CalendarDate, ZonedDateTime, NumberParser, LocalizedStringFormatter, I18nProvider, optimize-locales-plugin, @react-aria/test-utils, and migration from @react-aria/* packages, or for any accessible or headless React component when React Aria is in the project."
---

# React Aria

Build accessible React UI from React Aria's unstyled parts. Keep its behavior intact and own the styling. It handles semantics, keyboard, focus, press and hover across devices, screen reader output, right-to-left layout, and localized strings.

Snapshot: `react-aria-components@1.22.1`, `react-aria@3.53.1`, `react-stately@3.51.0`, `@internationalized/date@3.12.4` (2026-11-07). If the project pins another version, read its installed types first and see [references/source-map.md](references/source-map.md).

## Workflow

1. Check the project: installed versions, import style, the wrapper components that already exist, the styling system, and the framework. Extend existing wrappers before you add new ones.
2. Pick the API layer (below) and the component. Use the chooser table if the choice is not obvious.
3. Read the matching reference before you write code. Component names and parts have changed between versions, and older examples on the web are often wrong.
4. Compose all documented parts. Style with classes, `data-*` states, and render props.
5. Verify in the real app: keyboard only, a screen reader pass where possible, touch, right-to-left if supported, every state (loading, empty, invalid, disabled), and exit animations. Add tests by role.

## Choose the API layer

| Layer | Use it when | Package |
| --- | --- | --- |
| Components | Default. Nearly all UI work. | `react-aria-components/<Name>` |
| `render` prop, contexts, state contexts | You need a custom element, a router link, a motion wrapper, or a custom child in a stock pattern | `react-aria-components/slots` |
| Hook-built child or parent, with stock parts | One part must differ a lot | Both, via context |
| Hooks and state only | You must own the full DOM or add behavior to an existing component system | `react-aria/<hook>`, `react-stately/<hook>` |
| Interaction hooks | A custom element needs press, hover, focus-visible, or move behavior | `react-aria/usePress` and others |

Move down a layer only when the higher layer can not do the job. Most needs that look like "I need hooks" are met by `render`, contexts, or a state context.

## References

Read only what the task needs.

| Task | Read |
| --- | --- |
| Install, imports, wrappers, SSR, Next.js, React Router, Vite, locale plugin, router links, CSP | [setup-frameworks.md](references/setup-frameworks.md) |
| Classes, states, render props, slots, Tailwind, animation, Motion, `render`, `composeRenderProps`, contexts | [styling-customization.md](references/styling-customization.md) |
| Form submit, validation, server errors, form libraries | [forms.md](references/forms.md) |
| Button, ToggleButton, TextField, NumberField, SearchField, Checkbox, Radio, Switch, Slider, TokenField, Form | [components-fields.md](references/components-fields.md) |
| Select, ComboBox, Autocomplete, ListBox, Menu, TagGroup | [components-pickers.md](references/components-pickers.md) |
| Table, GridList, Tree, NavigationTree | [components-data.md](references/components-data.md) |
| Dialog, Modal, Popover, Tooltip, Sheet, PreviewTrigger, Toast, portals | [components-overlays.md](references/components-overlays.md) |
| Tabs, Breadcrumbs, Link, Disclosure, Toolbar, Group, Separator, Meter, ProgressBar, FocusRing, FocusScope, VisuallyHidden | [components-navigation-layout.md](references/components-navigation-layout.md) |
| Calendar, RangeCalendar, DateField, TimeField, DatePicker, DateRangePicker | [components-date-time.md](references/components-date-time.md) |
| ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch, ColorSwatchPicker, ColorWheel, `Color` | [components-color.md](references/components-color.md) |
| Collection data, `items`, `dependencies`, sections, selection, useListData, useAsyncList, useTreeData, Virtualizer | [collections-selection.md](references/collections-selection.md) |
| useDragAndDrop, reordering, DropZone, FileTrigger, useDrag, useDrop, clipboard | [drag-and-drop.md](references/drag-and-drop.md) |
| usePress, useHover, focus and keyboard hooks, useMove, mergeProps, overlay helpers | [hooks-interactions.md](references/hooks-interactions.md) |
| useSelect, useTable, other pattern hooks, `react-stately`, contexts with hooks | [hooks-components.md](references/hooks-components.md) |
| CalendarDate, ZonedDateTime, Time, calendars, NumberFormatter, NumberParser, string and message packages, I18nProvider, useDateFormatter, useFilter | [internationalized.md](references/internationalized.md) |
| Testing Library, timers, test utils, pattern testers | [testing.md](references/testing.md) |
| Full worked apps: CRUD, kanban, photos, emoji picker, iOS list, ripple, swipeable tabs | [example-recipes.md](references/example-recipes.md) |
| Versions, docs URLs, change history, deprecated names | [source-map.md](references/source-map.md) |

For exact props not in a reference, read the installed `.d.ts` (`node_modules/react-aria-components/dist/types/src/<Name>.d.ts`), then the page's Markdown at `https://react-aria.adobe.com/<Name>.md`. The index is `https://react-aria.adobe.com/llms.txt`.

## Component chooser

| Need | Use | Not |
| --- | --- | --- |
| Pick one or many from a closed list | `Select` | `ComboBox` when typing adds nothing |
| Type to filter, in a popup anchored to an input | `ComboBox` | `Select` |
| Search box over a list, menu, or grid, such as a command palette | `Autocomplete` with `SearchField` | `ComboBox` |
| Free text plus inline tokens, such as mentions or recipients | `TokenField` | `TagGroup` |
| Commands and actions | `Menu` | `Select`, `ListBox` |
| Inline list of options to choose from | `ListBox` | `GridList` when items hold no interactive parts |
| List whose rows hold buttons, checkboxes, or fields | `GridList` | `ListBox`, which can not contain interactive children |
| Columns of data | `Table` | `GridList` |
| Nested items, selectable | `Tree` | `NavigationTree` |
| Nested site or app links | `NavigationTree` | `Tree` |
| Removable or filter chips | `TagGroup` | `ToggleButtonGroup` |
| One or many pressed options in a row | `ToggleButtonGroup` | `RadioGroup` for commands |
| A form choice from visible options | `RadioGroup` or `CheckboxGroup` | `ToggleButtonGroup` |
| Blocking overlay | `Modal` + `Dialog` | `Popover` |
| Anchored overlay | `Popover` | `Modal` |
| Bottom or edge drawer with swipe | `Sheet` | `Modal` with custom gestures |
| Short plain hint on hover or focus | `Tooltip` | `PreviewTrigger` |
| Interactive preview on hover, focus, or long press | `PreviewTrigger` | `Tooltip`, which must hold no interactive content |
| Value within a known range | `Meter` | `ProgressBar` |
| Progress of a task | `ProgressBar` | `Meter` |

## Rules that prevent most bugs

**Imports**

- Use subpaths: `react-aria-components/Select`, `react-aria/useButton`, `react-stately/useToggleState`. A subpath also exports the parts used with that component.
- Never copy `vanilla-starter/*` or `tailwind-starter/*` imports from docs examples. They are docs starter kits. Their `label` and `errorMessage` props do not exist on real components.
- Do not add `@react-aria/*` or `@react-stately/*` packages in new code. They only re-export the monopackages. Some docs pages still show these paths. Use `react-aria/PortalProvider`, `react-aria/FocusRing`, and `react-aria/FocusScope`.
- Not every part is exported from every subpath. `CheckboxField` and `CheckboxButton` come from `react-aria-components/Checkbox`, not `/CheckboxGroup`. `RouterProvider` comes from the root entry. `useIsSSR` comes from `react-aria/SSRProvider`. When an import fails, read `dist/types/exports/<Name>.d.ts`.

**When docs and types disagree**

- Follow the installed types. Some docs tables list props from the styled Spectrum components or from older APIs.
- Starter-kit props that do not exist on real components include `label`, `errorMessage`, `Column allowsResizing`, `TreeItem title`, and `items` on `Select` or `TagGroup`. Real `MenuTrigger` also needs an explicit `Popover`.

**Names that changed**

- For form fields, use `CheckboxField` + `CheckboxButton`, `RadioField` + `RadioButton`, and `SwitchField` + `SwitchButton`. `Checkbox`, `Radio`, and `Switch` are deprecated since 1.18. One exception: the docs and the `Table`, `GridList`, and `Tree` subpaths still use `<Checkbox slot="selection" />` for row selection.
- `Select` uses `value`, `defaultValue`, `onChange`. `selectedKey` is deprecated since 1.13.
- Use the specific section components (`ListBoxSection`, `MenuSection`). Generic `Section` is deprecated.
- Toast is still `UNSTABLE_`-prefixed at this version. Alias it in one file.

**Events and values**

- Handle `onPress`, not `onClick`. `onPress` works the same for mouse, touch, keyboard, and screen readers, and it does not fire when a press ends off the element. Use `onHoverStart` and `onFocusChange` in the same way. Press handling stops event propagation by default, so a parent's `onClick` does not run.
- Field `onChange` receives the value, not a DOM event. Do not read `e.target.value`.
- Boolean props start with `is` or `allows` (`isDisabled`, `isOpen`, `allowsSorting`), not `disabled` or `open`. Controlled and uncontrolled pairs are `value`/`defaultValue`, `isOpen`/`defaultOpen`, `selectedKeys`/`defaultSelectedKeys`.
- `Button` defaults to `type="button"`. Submit buttons need `type="submit"`.
- Date components take `@internationalized/date` objects, not `Date` or strings. Convert with `parseDate` and `toString()` at API edges.
- `selectedKeys` can be the string `'all'`, not only a `Set`. Handle both.
- `Table` rows use `onRowAction`, not `onAction`. On `ListBox`, there is no `slot="drag"` handle. External drag `onDragEnd` removal needs a `!isInternal` check.
- `granularity` with a time unit needs a value that has time. A `CalendarDate` value with a time `granularity` throws.
- `createCalendar` returns the Gregorian calendar for `chinese`, `dangi`, `islamic`, `islamic-rgsa`, and `iso8601`. See [internationalized.md](references/internationalized.md) before you use those.

**Labels**

- Every field and collection needs a name: a `Label` part, or `aria-label` or `aria-labelledby`. Icon-only buttons need `aria-label`. Development builds warn when the name is missing; treat that warning as a bug.
- Any item with non-text children needs `textValue`, for typeahead and screen readers.

**Collections**

- Prefer `items` with a function over `array.map`. React Aria caches each rendered item by object identity.
- If an item render reads outside state, pass `dependencies={[...]}`, or the item shows old data. Alternatively, update the item object so only that row changes.
- Every item needs a unique `id` across the whole collection, including across sections. Objects with an `id` field need no extra prop. With `array.map`, set both `key` and `id`.
- Use `useListData`, `useAsyncList`, and `useTreeData` for list state rather than custom reducers. Use `Virtualizer` for long lists rather than an outside virtualization library, because keyboard navigation and screen readers need the collection's layout.

**Composition and styling**

- A custom `className` replaces `react-aria-Name`. Do not mix default-class CSS with custom classes on the same element unless you add `defaultClassName`.
- Style state through `data-*` attributes and render props, not `:hover`, `:active`, or `:focus-visible`.
- Wrapper `className` may be a function. Merge with `composeRenderProps`, never with string concatenation.
- Custom `render` output must be the expected element type, one root, with all props and the ref passed through.
- A child that must not join a parent's slot needs `slot={null}`, such as a clear button inside a `DatePicker`.
- Parts get behavior through context, so moving them out of the parent's subtree breaks them. Portals and wrappers inside the subtree are fine.

**Overlays**

- `Modal` needs `Dialog` inside it for focus and labels, unless content is a `Menu` or other pattern with its own role. `Dialog` needs a `Heading slot="title"` or `aria-label`.
- `Tooltip` needs a focusable trigger, normally `Button` or `Focusable`. A custom trigger element must forward its ref and DOM props.
- Animate exits with `data-exiting`. React Aria keeps the element until the animation finishes.
- Set the portal root with `UNSAFE_PortalProvider`, not `UNSTABLE_portalContainer`.

**Forms**

- Fields need `name` to appear in `FormData`.
- Default `validationBehavior` is `native`, which blocks submit. Form libraries that own validation use `aria` plus `isInvalid`.
- Show server errors with `validationErrors` on `Form`. Always validate on the server as well. A `FieldError` render function must fall back to `validationErrors`, or server errors show as blank.
- React 19 `action` resets the form, which leaves a `Select` out of sync and silently blocks a retry. Read [forms.md](references/forms.md) before you combine them.
- `I18nProvider` does not translate browser validation messages. Use a `FieldError` render function when words or language matter.

**i18n and SSR**

- With SSR, wrap the app in `I18nProvider` with the server's locale and set `lang` and `dir` on `<html>`. A mismatch breaks hydration.
- Add `@react-aria/optimize-locales-plugin` for apps that do not need all 30+ languages. Without it, all strings ship in the bundle.
- Use `useDateFormatter`, `useNumberFormatter`, `useCollator`, and `useFilter`, not raw `Intl` objects in render, so locale and caching stay correct.
- Use logical CSS properties (`margin-inline-start`) so right-to-left layout works.

**Security**

- `href` values from user data still need URL validation. React Aria does not filter `javascript:` URLs for you, so check them before rendering.
- Check locales from `Accept-Language`, URLs, or cookies against your supported list before SSR. The docs examples use the header value directly, but `isRTL('*')` and `getLocalizationScript('*')` throw a `RangeError`, and `*` is a legal header value. See `pickLocale` in [setup-frameworks.md](references/setup-frameworks.md).
- Drop items and files are untrusted input. Check type and size on the server.

## Done checklist

- Tab order is correct. Arrow keys, Home, End, Escape, and typeahead work where the pattern defines them.
- Focus goes in on open and returns on close. Nothing focuses a hidden element.
- Every state exists and is styled: hovered, pressed, focus-visible, selected, disabled, invalid, loading, empty, entering, exiting.
- Names are present, and development console warnings are gone.
- Long text, right-to-left, narrow screens, and touch work. Touch targets are large enough even where the visual is small.
- Long lists are virtualized, and dynamic collections use `items` and correct `dependencies`.
- Types pass against the installed version, and tests query by role.
