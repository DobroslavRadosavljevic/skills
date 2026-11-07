# Source map

Snapshot: 2026-11-07. Refresh from the commands at the end when a project is pinned elsewhere.

## Packages

| Package | Version | Purpose |
| --- | --- | --- |
| `react-aria-components` | 1.22.1 | Unstyled, accessible, composed components. Start here. |
| `react-aria` | 3.53.1 | Behavior hooks: interactions, focus, i18n, one hook for each pattern. |
| `react-stately` | 3.51.0 | State hooks with no DOM. Pair with `react-aria` hooks. |
| `@internationalized/date` | 3.12.4 | Calendars, dates, times, time zones. Used by all date components. |
| `@internationalized/number` | 3.6.9 | Number formatting and parsing across locales. |
| `@internationalized/string` | 3.2.10 | Plural and variable strings from precompiled dictionaries. |
| `@internationalized/message` | 3.1.10 | ICU strings at runtime, with `intl-messageformat`. |
| `@internationalized/string-compiler` | 3.4.1 | Build-time compiler from ICU strings to JS for `@internationalized/string`. |
| `@react-aria/optimize-locales-plugin` | 2.1.0 | Bundler plugin that removes unused locale strings. |
| `@react-aria/parcel-resolver-optimize-locales` | 1.4.0 | The same job for Parcel. |
| `tailwindcss-react-aria-components` | 2.2.0 | Tailwind v4 modifiers. Use 1.x for v3. |
| `@react-aria/test-utils` | 1.0.0-rc.1 | Testers for ARIA patterns. Release candidate. |
| `@react-aria/ssr` | 3.10.1 | `SSRProvider`, for React 16 and 17 only. |
| `@react-types/shared` | 3.37.0 | Shared types such as `Key`, `Selection`, `RouterConfig`. Installed with the others. |
| `@react-spectrum/s2` | 1.8.2 | Adobe's styled design system on top of React Aria. Not covered here. |
| `@react-aria/mcp` | 1.2.1 | Official MCP server for these docs. |
| `@react-spectrum/codemods` | 1.2.10 | `use-monopackages`, `use-subpaths`, `test-utils-rc-update`. |

All packages are Apache-2.0, except that npm shows no license field for the two locale build plugins (`optimize-locales-plugin`, `parcel-resolver-optimize-locales`). Check that if license review matters. React 16.8 through 19 are supported.

Individual packages such as `@react-aria/button` and `@react-stately/table` still work but only re-export the monopackages, and get no new exports. Move to `react-aria` and `react-stately`.

## Docs

- Site: https://react-aria.adobe.com. Index for agents: https://react-aria.adobe.com/llms.txt.
- Any page as Markdown: add `.md`, for example https://react-aria.adobe.com/Select.md. Hook pages sit under the component: https://react-aria.adobe.com/Select/useSelect.md.
- The old site at `react-spectrum.adobe.com/react-aria` is older. Prefer the new site. Archived release notes: https://react-spectrum.adobe.com/v3/releases/index.html.
- Source: https://github.com/adobe/react-spectrum (monorepo).
- Installed types are exact for the project: `node_modules/react-aria-components/dist/types/src/<Name>.d.ts`, `node_modules/react-aria/dist/types/exports/`, `node_modules/react-stately/dist/types/exports/`.
- Known a11y checker false positives: https://github.com/adobe/react-spectrum/wiki/Known-accessibility-false-positives.
- `@internationalized/string`, `/message`, and `/string-compiler` have no docs pages. Types and source are the docs.

## Where each topic lives

| Reference | Covers |
| --- | --- |
| [setup-frameworks.md](setup-frameworks.md) | Install, imports, wrappers, SSR, locale plugin, routers, CSP |
| [styling-customization.md](styling-customization.md) | Classes, states, render props, slots, Tailwind, animation, `render`, contexts |
| [forms.md](forms.md) | Submission, validation, server errors, form libraries |
| [collections-selection.md](collections-selection.md) | Collections, selection, data hooks, Virtualizer |
| [drag-and-drop.md](drag-and-drop.md) | `useDragAndDrop`, DropZone, FileTrigger, useDrag, useDrop, clipboard |
| [components-fields.md](components-fields.md) | Button, toggle buttons, text, number, search, checkbox, radio, switch, slider, token field, Form |
| [components-date-time.md](components-date-time.md) | Calendar, RangeCalendar, DateField, TimeField, pickers |
| [components-color.md](components-color.md) | All color components and the `Color` object |
| [components-pickers.md](components-pickers.md) | Select, ComboBox, Autocomplete, ListBox, Menu, TagGroup |
| [components-data.md](components-data.md) | Table, GridList, Tree, NavigationTree |
| [components-overlays.md](components-overlays.md) | Dialog, Modal, Popover, Tooltip, Sheet, PreviewTrigger, Toast, portals |
| [components-navigation-layout.md](components-navigation-layout.md) | Tabs, Breadcrumbs, Link, Disclosure, Toolbar, Group, Meter, ProgressBar, focus helpers |
| [hooks-interactions.md](hooks-interactions.md) | usePress, useHover, focus and keyboard hooks, useMove, mergeProps, overlay helpers |
| [hooks-components.md](hooks-components.md) | Pattern hooks with state, contexts with hooks, `react-stately` inventory |
| [internationalized.md](internationalized.md) | All `@internationalized/*` packages and i18n hooks |
| [testing.md](testing.md) | Testing Library, timers, test utils and testers |
| [example-recipes.md](example-recipes.md) | CRUD, kanban, photos, emoji picker, iOS list, ripple, swipeable tabs |

## Change history

Read when a project is on an older version or when old code looks wrong.

| Version | Change |
| --- | --- |
| 1.22 | New `Sheet`. Overlays account for the virtual keyboard. Locale plugin supports Turbopack. Dev warning for duplicate collection keys. |
| 1.21 | New `NavigationTree`. |
| 1.20 | New `PreviewTrigger` and other additions. See its notes. |
| 1.19 | `keyboardNavigationBehavior` on GridList and Tree for embedded fields. Autocomplete inline completions. Locale plugin 2.0 moved to `unplugin@2`; webpack 4 is out. |
| 1.18 | **`Checkbox`, `Radio`, `Switch` deprecated.** Use `CheckboxField` + `CheckboxButton`, `RadioField` + `RadioButton`, `SwitchField` + `SwitchButton`. Multiple date selection in Calendar. `CalendarHeading`, `CalendarMonthPicker`, `CalendarYearPicker`. Test utils RC with breaking tester API (`test-utils-rc-update` codemod). |
| 1.17 | **Subpath imports and monopackages.** Expandable Table rows (`treeColumn`). Window scrolling in Virtualizer. Individual hook packages are no longer installed for you. |
| 1.16 | Multi-select ComboBox with `ComboBoxValue`. `TreeSection` and `TreeHeader`. |
| 1.15 | `render` prop on components for custom DOM elements. |
| 1.13 | **Select `selectedKey` deprecated.** Use `value`, `defaultValue`, and `onChange`, which also support `selectionMode="multiple"`. |

Deprecated names to replace when you touch code: `Section` (use `ListBoxSection`, `MenuSection`, and so on) and the `UNSTABLE_portalContainer` prop on overlays (use a parent `UNSAFE_PortalProvider` from `react-aria/PortalProvider`).

Still unstable at this snapshot: Toast has only `UNSTABLE_`-prefixed exports (`UNSTABLE_ToastRegion`, `UNSTABLE_Toast`, `UNSTABLE_ToastQueue`, and so on). Import them with `as` aliases, as the docs do, so a later rename stays in one file.

## Refresh

```bash
curl -s https://react-aria.adobe.com/llms.txt | head -60
```

```bash
curl -s https://registry.npmjs.org/react-aria-components/latest | grep -o '"version":"[^"]*"' | head -1
```

Read the newest page under https://react-aria.adobe.com/releases for changes after this snapshot.
