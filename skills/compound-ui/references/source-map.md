# Source Map

Snapshot captured on 2026-07-08 for creating React compound UI components in a shadcn-like style.

## Primary Sources Checked

- React official docs via Context7 library `/reactjs/react.dev`
  - React 19 allows `ref` as a function component prop.
  - Existing mixed-version component libraries may still need `React.forwardRef` for React 18 compatibility.
  - Shared state belongs in a common parent or focused context; render must stay pure.
  - Source: https://react.dev
- shadcn/ui official repo and docs via Context7 library `/shadcn-ui/ui`
  - Components are source-owned TypeScript + Tailwind code, not sealed package abstractions.
  - Current v4 examples use `data-slot`, `data-variant`, `data-size`, `cn`, CVA variants, Radix primitives, and named part exports.
  - Source: https://ui.shadcn.com and https://github.com/shadcn-ui/ui
- Radix UI Primitives docs via Context7 library `/websites/radix-ui_primitives`
  - `asChild` composes primitive behavior onto custom elements through Slot.
  - Custom children must spread props and support refs so behavior, measurements, keyboard support, and accessibility are preserved.
  - Source: https://www.radix-ui.com/primitives/docs/guides/composition
- Additional Exa research
  - shadcn component composition guidance, Vercel shadcn composition material, and `asChild` / Slot implementation discussions.

## shadcn Source Examples Inspected

- `apps/v4/registry/new-york-v4/ui/button.tsx`
  - `asChild`, `Slot.Root`, `buttonVariants`, `VariantProps`, `data-slot`, `data-variant`, `data-size`, and `cn`.
- `apps/v4/registry/new-york-v4/ui/card.tsx`
  - Simple named parts such as `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
- `apps/v4/registry/new-york-v4/ui/dialog.tsx`
  - Radix primitive wrapping, named exported parts, overlay/content composition, title/description parts, close control, and `data-slot`.
- `skills/shadcn/rules/composition.md`
  - Concrete composition rules: group items under groups, full Card structure, dialogs/sheets/drawers need titles, TabsTrigger belongs in TabsList, Avatar needs fallback, use existing primitives instead of raw markup.

## Recheck Triggers

Refresh docs before relying on:

- React `ref` handling in a codebase moving between React 18 and 19.
- shadcn registry structure, import paths, or generated source shape.
- Radix `Slot`, `Slottable`, or primitive package import paths.
- Tailwind v4-only syntax in a Tailwind v3 project.
- Accessibility behavior for overlays, composite widgets, focus traps, roving focus, or portal layering.
