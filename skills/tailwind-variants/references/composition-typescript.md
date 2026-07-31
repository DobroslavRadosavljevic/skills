# Composition And TypeScript

## Prefer `extend`

`extend` merges `base`, `slots`, `variants`, `defaultVariants`, and `compoundVariants` with TypeScript autocomplete:

```ts
import { tv } from 'tailwind-variants'

const baseButton = tv({
  base: 'font-semibold text-white rounded-full active:opacity-80',
  variants: {
    color: {
      primary: 'bg-blue-500 hover:bg-blue-700',
      secondary: 'bg-purple-500 hover:bg-purple-700',
    },
    size: {
      small: 'py-0 px-2 text-xs',
      medium: 'py-1 px-3 text-sm',
      large: 'py-1.5 px-3 text-md',
    },
  },
  defaultVariants: {
    color: 'primary',
    size: 'medium',
  },
})

const myButton = tv({
  extend: baseButton,
  variants: {
    isSquared: {
      true: 'rounded-sm',
    },
  },
})

myButton({ color: 'primary', size: 'medium', isSquared: true })
```

Override inherited keys by redefining them on the child recipe. Slot-based parents pass slots through `extend` the same way.

## String composition (escape hatch)

You can splice a parent result into a child `base` array, but it is **not** type-safe for variants:

```ts
const actionButton = tv({
  base: [baseButton(), 'bg-red-500', 'rounded-xs'],
})
```

Put the inherited string first so later classes can override via merge. Prefer `extend` for design-system work.

## Runtime metadata

The function returned by `tv` exposes introspection helpers such as `.base`, `.slots`, `.variants`, `.variantKeys`, `.defaultVariants`, `.compoundVariants`, `.compoundSlots` for tooling and debugging—do not treat undocumented shapes as stable public API beyond the docs.

## TypeScript: `VariantProps`

```ts
import { tv, type VariantProps } from 'tailwind-variants'

export const button = tv({
  base: 'px-4 py-1.5 rounded-full',
  variants: {
    color: {
      primary: 'bg-blue-500 text-white',
      neutral: 'bg-zinc-500 text-black',
    },
    flat: {
      true: 'bg-transparent',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
})

type ButtonVariants = VariantProps<typeof button>

interface ButtonProps extends ButtonVariants {
  children: React.ReactNode
}

export function Button(props: ButtonProps) {
  const { children, ...variants } = props
  return <button className={button(variants)}>{children}</button>
}
```

### Required variants

`VariantProps` fields are optional. Force required props with utilities:

```ts
type ButtonVariants = VariantProps<typeof buttonStyles>

export interface ButtonProps
  extends Omit<ButtonVariants, 'requiredFlat'>,
    Required<Pick<ButtonVariants, 'requiredFlat'>> {}
```

### Slots + TypeScript

Destructure slot functions after calling the recipe for better inference:

```ts
const { base, title, content } = card({ color: 'primary' })
```

Or call `card().base()` inline when brevity matters.

## Framework notes

Tailwind Variants is **framework-agnostic**. React examples dominate the docs, but the same `tv` recipes work anywhere you set `class` / `className`. Keep recipes in shared modules so multiple frameworks can import them.

## DX checklist

- Add `tv` to `tailwindCSS.classFunctions` and Prettier `tailwindFunctions`.
- Colocate recipes next to components or in a `styles`/`ui` module with clear naming (`button`, `card`, …).
- Pass full class strings in variants—never dynamically concatenate incomplete Tailwind token fragments if the scanner must see complete utilities.
