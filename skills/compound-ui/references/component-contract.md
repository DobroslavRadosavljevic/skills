# Component Contract

## API Shape

Design a compound component as a small family of parts, not one wrapper with many layout props.

Prefer:

```tsx
<MetricCard>
  <MetricCardHeader>
    <MetricCardTitle>Revenue</MetricCardTitle>
    <MetricCardAction>
      <Button variant="ghost" size="icon" aria-label="Open revenue menu" />
    </MetricCardAction>
  </MetricCardHeader>
  <MetricCardValue>$24,300</MetricCardValue>
  <MetricCardDescription>Up 8% from last week</MetricCardDescription>
</MetricCard>
```

Avoid:

```tsx
<MetricCard
  title="Revenue"
  value="$24,300"
  description="Up 8% from last week"
  action={<Button />}
  layout="with-action"
/>
```

The first API lets callers replace, reorder, omit, wrap, and test parts without asking the parent component to grow new props.

## Naming

- Use the local naming style first.
- In shadcn-style files, prefer named exports with a shared prefix:
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`
  - `Command`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`
- Use static namespace APIs such as `Card.Header` only when the project already prefers them.
- Name parts by semantic role, not visual position. Prefer `Header`, `Title`, `Description`, `Content`, `Footer`, `Action`, `Trigger`, `Item`, `Group`, `List`, `Viewport`, `Portal`, `Overlay`, and `Indicator`.

## Props Policy

Allowed by default:

- `children`
- `className`
- DOM or primitive part props via `React.ComponentProps<...>`
- `ref` or `forwardRef` support as required by the local React version
- `asChild` for leaf components that should render another element
- Controlled/uncontrolled state props such as `open`, `defaultOpen`, `onOpenChange`, `value`, `defaultValue`, and `onValueChange`
- Accessibility props such as `aria-label`, `aria-labelledby`, `aria-describedby`, `id`, `role`, and native form props
- Small styling variants such as `variant`, `size`, `orientation`, or `side` when they map to stable design-system decisions

Question or reject:

- `title`, `description`, `subtitle`, `footer`, `actions`, `icon`, `leftIcon`, `rightIcon`, `avatar`, or `badge` props when a named child part can represent them
- `isLoading`, `isPending`, or `loadingText` props when the project can compose a spinner, disabled state, and label inside the button/content
- Boolean layout props such as `compact`, `withBorder`, `withActions`, `showHeader`, or `alignRight` when className, variants, or parts are clearer
- Render props that only patch around a bad component boundary

## Nesting And Invariants

- Document legal nesting in the component code, story, or surrounding docs.
- Preserve primitive anatomy. If a primitive expects `Root -> Trigger -> Portal -> Overlay -> Content -> Title`, do not flatten it into a shortcut that hides required pieces.
- Use context only for invariants that cannot be represented by normal composition:
  - registering parts
  - shared ids for `aria-labelledby` / `aria-describedby`
  - open/selected state shared across parts
  - orientation, disabled state, or roving focus coordination
- When a part requires a provider, expose a focused hook that throws a helpful error outside the root.

## Accessibility Contract

- Prefer semantic elements first: `button`, `a`, `section`, `nav`, `ul`, `li`, `label`, `input`, `fieldset`, and heading tags where appropriate.
- Do not build interactive controls from `div` plus click handlers unless an accessible primitive owns the behavior.
- Overlays and composite widgets need keyboard, focus, escape/close, outside interaction, label, and announcement behavior.
- Required labels must stay explicit. Dialog, sheet, drawer, tooltip, form, input, select, and menu-like components need visible or screen-reader labels as appropriate.
- Do not bury the only accessible name in a convenience prop when callers need to compose richer content.
