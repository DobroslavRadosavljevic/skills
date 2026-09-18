---
name: base-ui
description: "Build, review, migrate, or debug React interfaces that use Base UI (`@base-ui/react`) unstyled accessible primitives. Use when the user asks about Base UI docs, component anatomy, styling, composition, render props, TypeScript wrapper types, forms, dialogs, drawers, popovers, menus, selects, comboboxes, autocomplete, createItems, tabs, toast, OTP Field, accessibility, or replacing lower-level UI primitives with Base UI."
---

# Base UI

Use Base UI as an unstyled, accessible React primitive layer. Keep semantics, focus, labels, keyboard behavior, and styling hooks intact while adapting the parts to the host app's design system.

Snapshot: `@base-ui/react@1.8.0` (`latest`, 2026-09-18). Refresh from [source-map.md](references/source-map.md) if the project is pinned elsewhere.

## Workflow

1. Confirm the installed package and version from the project before changing code. Use `@base-ui/react`, not the retired `@base-ui-components/react` package name.
2. Read the relevant reference before implementing:
   - [references/source-map.md](references/source-map.md): docs sources, package status, inventory, and 1.7–1.8 deltas.
   - [references/core-patterns.md](references/core-patterns.md): setup, styling, composition, state, TypeScript, animation, accessibility, and utilities.
   - [references/component-patterns.md](references/component-patterns.md): anatomy and implementation notes by component family.
3. Fetch current official docs when exact prop names, event reasons, release behavior, or component APIs matter. Prefer Context7 library `/mui/base-ui` or the page's `.md` URL from `https://base-ui.com/llms.txt`.
4. Build from documented compound parts first, then wrap with local design-system components only through the `render` prop or thin wrappers that preserve props and refs.
5. Verify keyboard behavior, focus return, accessible names, controlled/uncontrolled state, portal layering, animation exit behavior, and responsive/mobile behavior.

## Implementation Rules

- Import from component subpaths such as `@base-ui/react/dialog`, `@base-ui/react/combobox`, and `@base-ui/react/field`.
- Assemble documented parts. Do not invent components, parts, or shortcuts. Most overlays need `Root`, trigger, portal, positioner or viewport, popup, labels/titles/descriptions, and close/actions.
- Treat Base UI as unstyled. Style with `className`, state-aware `className`/`style` functions, data attributes, and CSS variables.
- Keep accessible names explicit. Use `Field.Label`, component-specific labels, native labels, or `aria-label`/`aria-labelledby`.
- Custom `render` elements must forward refs and spread all received props onto the underlying DOM node.
- Prefer uncontrolled components unless the product needs external state. Control with `open`/`value` plus `onOpenChange`/`onValueChange`.
- Use event details deliberately: `eventDetails.cancel()` blocks the internal state update; `eventDetails.allowPropagation()` lets a normally stopped DOM event bubble.
- For Combobox ID selection, use `Combobox.createItems` and `Combobox.Root.Props<Value, Multiple, Item>`. Autocomplete has no `createItems`.
- Do not copy Tailwind v4-only syntax into Tailwind v3 projects.
- Add portal setup when the app lacks it: isolate the app root and apply the iOS 26+ body style in the core patterns reference.

## Verification Checklist

- Markup has the intended roles, labels, disabled/readOnly states, and focus-visible styles.
- Keyboard navigation covers arrows, Home/End, Enter/Space, Escape, tab order, and focus return where relevant.
- Popup/drawer/dialog layers appear above the app and close by trigger, close button, Escape, outside interaction, and route/unmount transitions.
- Form controls submit the intended names/values and surface native, server, or external-library validation errors.
- Animations use `data-starting-style`/`data-ending-style` or `keepMounted` correctly; reduced-motion or no-motion remains usable.
- TypeScript wrappers expose the correct `Component.Part.Props` types (including Combobox's third `Item` generic) and do not drop refs, handlers, or data attributes.
