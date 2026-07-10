---
name: compound-ui
description: Build, review, or refactor React UI components into shadcn-style compound components. Use when creating composable component APIs, splitting prop-heavy components into named parts, wrapping Radix/Base UI primitives, adding asChild/Slot behavior, designing data-slot styling hooks, or enforcing accessible source-owned component primitives.
---

# Compound UI

Use this skill to create source-owned React components that compose like shadcn/ui: small named parts, explicit children, accessible primitives, class merging, and stable styling hooks.

## Workflow

1. Inspect the local UI stack before writing code:
   - Read nearby project guidance, existing component files, package versions, styling utilities, primitive libraries, and test/story conventions.
   - Prefer the project's existing export, file, styling, icon, and accessibility patterns.
2. Refresh docs when exact APIs matter:
   - Use [references/source-map.md](references/source-map.md) for current source links and captured guidance.
   - Prefer current React, shadcn/ui, Radix UI, and local primitive docs before changing framework-sensitive code.
3. Design the public API before implementation:
   - Read [references/component-contract.md](references/component-contract.md).
   - Define the root component, named subcomponents, legal nesting, controlled/uncontrolled state, and required accessibility parts.
4. Implement in the shadcn style:
   - Read [references/authoring-patterns.md](references/authoring-patterns.md).
   - Export source-owned named parts with `data-slot`, `className` merging, prop/ref pass-through, and minimal behavior props.
5. Review before finishing:
   - Use [references/review-checklist.md](references/review-checklist.md).
   - Verify typecheck, lint, story/browser behavior, keyboard support, focus, accessible names, and responsive states when relevant.

## Enforcement Rules

- Prefer compound parts and `children` over prop-heavy wrapper APIs. Do not create `title`, `description`, `actions`, `icon`, `isLoading`, or layout props when named subcomponents express the same structure better.
- Keep acceptable props narrow: DOM props, `className`, `children`, `asChild`, controlled state, event handlers, accessibility props, and intentional variants such as `variant` or `size`.
- Use existing accessible primitives for complex behavior such as dialogs, menus, popovers, tabs, selects, tooltips, comboboxes, accordions, and roving focus.
- Preserve primitive contracts. Custom slotted children must spread incoming props and support refs according to the project's React version.
- Add `data-slot` to every exported part, plus state/variant data attributes when useful for styling and tests.
- Keep state local unless parts must coordinate. Use scoped context only for compound coordination and fail loudly when a required part is used outside its root.
- Add `"use client"` only when the component uses hooks, events, browser APIs, or client-only primitives.
- Do not hide required accessibility behind convenience defaults that callers cannot inspect or override.
