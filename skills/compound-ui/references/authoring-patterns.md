# Authoring Patterns

## File Shape

Use one source-owned component file per primitive family unless the local project has a stronger convention.

```tsx
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const panelVariants = cva("rounded-lg border bg-card text-card-foreground", {
  variants: {
    variant: {
      default: "",
      muted: "bg-muted/40",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Panel({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof panelVariants>) {
  return (
    <section
      data-slot="panel"
      data-variant={variant}
      className={cn(panelVariants({ variant, className }))}
      {...props}
    />
  )
}

function PanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-header"
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    />
  )
}

function PanelTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="panel-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  )
}

export { Panel, PanelHeader, PanelTitle }
```

## Styling Hooks

- Add `data-slot` to every exported part.
- Add `data-variant`, `data-size`, `data-orientation`, or `data-disabled` when useful for styling, testing, or consumer overrides.
- Preserve primitive-provided data attributes such as `data-state`, `data-disabled`, `data-side`, `data-align`, `data-orientation`, and `data-highlighted`.
- Merge local classes with the local utility, usually `cn(...)`.
- Use the project's existing variant helper: CVA, tailwind-variants, plain class maps, or local tokens.
- Keep selectors targeted to slots and states. Avoid brittle DOM-depth selectors when a part can carry a slot.

## Element Swapping: `asChild` (Radix) Or `render` (Base UI)

shadcn/ui now ships three primitive bases: **Radix** (`radix-ui`, `asChild` + `Slot`), **Base UI** (`@base-ui/react`, `render` prop, no `asChild`), and **React Aria** (`react-aria-components`). Use the composition API of the base the project already uses.

Radix base: use `asChild` for leaf components when the caller needs another element to receive the component behavior and styling.

```tsx
function Action({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="action"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    />
  )
}
```

Rules:

- Slotted custom children must spread all incoming props onto the final DOM element.
- Slotted custom children must support refs. Use React 19 `ref` props in React 19-only code; use `React.forwardRef` for React 18 or mixed-version libraries.
- Do not use `asChild` to skip semantic work. The resulting element must still be valid for the behavior. For example, a trigger should render a `button`, `a`, or another accessible interactive component.
- For components with more than one child around the slottable area, use the local Radix `Slottable` pattern if the installed Slot package supports it.

Base UI base: wrap the primitive part and pass props through; callers swap the element with `render`, not `asChild`.

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"

function Action({ className, ...props }: ButtonPrimitive.Props) {
  return (
    <ButtonPrimitive
      data-slot="action"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    />
  )
}

// <DialogPrimitive.Close render={<Button variant="outline" />}>Close</DialogPrimitive.Close>
```

- Do not add an `asChild` prop on top of a Base UI part; it duplicates `render` and breaks the primitive contract.

## Primitive Wrappers

When wrapping Radix, Base UI, or another primitive:

- Export each meaningful primitive part instead of hiding the anatomy behind one component.
- Preserve primitive prop types with `React.ComponentProps<typeof Primitive.Part>`.
- Pass through props after setting slot, class, and required children.
- Keep required portal, overlay, title, description, trigger, close, viewport, item, group, and indicator parts visible unless the local component family deliberately owns them.
- Keep primitive accessibility behavior intact. Do not intercept events, refs, ids, or ARIA props without reapplying them.

## State And Context

- Prefer uncontrolled primitives by default when they already support `defaultOpen`, `defaultValue`, and similar props.
- Expose controlled props only when callers need external state.
- Keep context values small and stable. Split contexts if one value changes often and another is static.
- Use generated ids or caller ids to connect labels and descriptions only when the primitive does not already do so.
- Avoid global state for a component family unless it is genuinely app-wide state.

## Client Boundaries

- Server-safe presentational parts do not need `"use client"`.
- Add `"use client"` for components that use hooks, event handlers, browser APIs, mutable refs for interaction, or client-only primitive libraries.
- In frameworks with Server Components, keep data fetching and server-only work outside client component files when possible.
