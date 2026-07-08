---
name: base-ui
description: Build, review, migrate, or debug React interfaces that use Base UI (`@base-ui/react`) unstyled accessible primitives. Use when the user asks about Base UI docs, component anatomy, styling, composition, render props, forms, dialogs, drawers, popovers, menus, selects, comboboxes, autocomplete, tabs, toast, accessibility, TypeScript wrapper types, or replacing lower-level UI primitives with Base UI.
---

# Base UI

## Overview

Use Base UI as an unstyled, accessible React primitive layer. Keep semantics, focus, labels, keyboard behavior, and styling hooks intact while adapting the parts to the host app's design system.

## Workflow

1. Confirm the installed package and version from the project before changing code. Use `@base-ui/react`, not the retired `@base-ui-components/react` package name.
2. Read the relevant reference before implementing:
   - [references/source-map.md](references/source-map.md): current docs sources, package status, and component inventory.
   - [references/core-patterns.md](references/core-patterns.md): setup, styling, composition, state, TypeScript, animation, accessibility, and utilities.
   - [references/component-patterns.md](references/component-patterns.md): common component anatomy and implementation notes by component family.
3. Fetch current official docs when exact prop names, event reasons, release behavior, or component APIs matter. Prefer Context7 library `/mui/base-ui`, Exa, or the page's `.md` URL from `https://base-ui.com/llms.txt`.
4. Build from Base UI parts first, then wrap with local design-system components only through the documented `render` prop or thin wrappers that preserve props and refs.
5. Verify keyboard behavior, focus return, accessible names, controlled/uncontrolled state, portal layering, animation exit behavior, and responsive/mobile behavior.

## Implementation Rules

- Import components from subpaths such as `@base-ui/react/dialog`, `@base-ui/react/popover`, and `@base-ui/react/field`.
- Assemble the documented compound parts instead of inventing shortcuts. Most complex components need `Root`, triggers, portals, positioners or viewports, popups, labels/titles/descriptions, and close/actions parts.
- Treat Base UI as unstyled. Apply local styling via `className`, state-aware `className` functions, `style`, data attributes, and CSS variables.
- Keep accessible names explicit. Use `Field.Label`, component-specific labels, native labels, or `aria-label`/`aria-labelledby` depending on the control.
- Preserve custom component composition rules: custom rendered elements must forward refs and spread all received props onto the underlying DOM element.
- Prefer uncontrolled components unless the product needs external state. Control with `open`/`value` plus the matching `onOpenChange`/`onValueChange` handler.
- Use Base UI event details deliberately. `eventDetails.cancel()` cancels internal state updates; `eventDetails.allowPropagation()` allows a normally stopped DOM event to bubble.
- Do not copy Tailwind v4-only syntax blindly into Tailwind v3 projects. Convert unsupported utilities when the host project is on Tailwind v3.
- Add portal setup when the app lacks it: isolate the app root and handle the iOS 26+ backdrop requirement described in the core patterns reference.

## Verification Checklist

- The rendered markup has the intended roles, labels, disabled states, and focus-visible styles.
- Keyboard navigation covers arrows, Home/End, Enter/Space, Escape, tab order, and focus return where relevant.
- Popup/drawer/dialog layers appear above the app and close correctly by trigger, close button, Escape, outside interaction, and route/unmount transitions.
- Form controls submit the intended names/values and surface native, server, or external-library validation errors.
- Animations use `data-starting-style` and `data-ending-style` or `keepMounted` correctly, and reduced-motion or no-motion behavior remains usable.
- TypeScript wrappers expose the correct `Component.Part.Props` types and do not drop refs, handlers, or data attributes.
