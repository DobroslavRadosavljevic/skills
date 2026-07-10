# Review Checklist

Use this checklist when reviewing or finishing a compound UI component.

## API

- The component exposes named parts, not a prop matrix.
- Required structure is visible at the call site.
- The root and parts accept the expected DOM or primitive props.
- Props that remain are behavior, accessibility, pass-through, or true design variants.
- Callers can compose icons, labels, spinners, badges, actions, headers, footers, and descriptions through children.
- The export style matches nearby source-owned components.

## React And TypeScript

- Render is pure and derived values are computed during render rather than mirrored into state.
- Shared state is lifted or held in focused context only when multiple parts need it.
- React 19 `ref` props or React 18 `forwardRef` are used according to the local version and library compatibility needs.
- Slotted children spread props and support refs.
- Type names are exported only when the project normally exports component prop types.
- No hooks are called conditionally or inside callbacks.

## Styling

- Every part has a stable `data-slot`.
- State, variant, size, and orientation data attributes are present where useful.
- `className` is merged with the local utility and not overwritten.
- Variant names are small, meaningful, and aligned with design tokens.
- Tailwind syntax matches the project's Tailwind version.
- Focus-visible, disabled, invalid, loading, hover, active, selected, open/closed, and responsive states are covered where relevant.

## Accessibility

- Interactive parts use semantic elements or accessible primitives.
- Buttons have names; icon-only buttons have `aria-label` or visible screen-reader text.
- Dialogs, sheets, drawers, popovers, tooltips, tabs, menus, selects, comboboxes, and accordions preserve keyboard behavior and focus management.
- Dialog-like content has title and description parts when required by the primitive or product.
- Form parts have labels, names, descriptions, errors, and disabled/invalid states.
- Loading and async states do not trap focus or erase accessible names.

## Verification

- Run the smallest relevant typecheck, lint, test, build, or story command.
- For visual components, inspect the real story/page in a browser when feasible.
- Exercise keyboard navigation: Tab, Shift+Tab, Enter, Space, Escape, arrows, Home/End where relevant.
- Test `asChild` with a custom child and confirm props, handlers, class names, and refs survive.
- Check controlled and uncontrolled state paths if both are supported.
- Report any verification that could not be run.

## Smells To Call Out

- A component claims to be composable but still takes `title`, `description`, `actions`, `icon`, and `footer` props.
- A wrapper hides a required primitive part, making accessibility impossible to audit at the call site.
- `asChild` is accepted but the child cannot receive props or refs.
- A custom trigger is not keyboard accessible.
- Styling depends on internal DOM order instead of slots and state attributes.
- Context is used as a prop-drilling escape hatch without a real cross-part invariant.
- Loading, pending, or empty states are hard-coded instead of composed from parts.
