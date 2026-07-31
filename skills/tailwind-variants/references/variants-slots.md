# Variants And Slots

## Variants

Define alternatives under `variants`. Keys are prop names; nested keys are values (or `true`/`false` for booleans).

```ts
const button = tv({
  base: 'font-semibold text-white text-sm py-1 px-4 rounded-full',
  variants: {
    color: {
      primary: 'bg-blue-500 hover:bg-blue-700',
      secondary: 'bg-purple-500 hover:bg-purple-700',
    },
    size: {
      sm: 'py-1 px-3 text-xs',
      md: 'py-1.5 px-4 text-sm',
      lg: 'py-2 px-6 text-md',
    },
    disabled: {
      true: 'opacity-50 bg-gray-500 pointer-events-none',
    },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
})

button({ color: 'secondary', size: 'sm', disabled: true })
```

### Compound variants

`compoundVariants` is an **array**. Each entry lists variant conditions plus `class` or `className`. Conditions may use arrays to match multiple values:

```ts
compoundVariants: [
  {
    color: 'success',
    disabled: true,
    class: 'bg-green-100 text-green-700',
  },
  {
    color: ['primary', 'secondary'],
    disabled: true,
    class: 'text-slate-400 bg-slate-200',
  },
  {
    size: ['sm', 'md'],
    class: 'px-3 py-1',
  },
]
```

### Responsive styling

`responsiveVariants` was **removed** (Tailwind v4). Put breakpoint prefixes inside class strings:

```ts
const component = tv({
  base: 'text-sm md:text-base lg:text-lg',
  variants: {
    color: {
      primary: 'text-blue-500 md:text-blue-600',
      secondary: 'text-gray-500 md:text-gray-600',
    },
  },
})
```

## Slots

Use slots when one recipe styles multiple DOM parts:

```ts
const alert = tv({
  slots: {
    root: 'rounded py-3 px-5 mb-4',
    title: 'font-bold mb-1',
    message: '',
  },
  variants: {
    variant: {
      outlined: { root: 'border' },
      filled: { root: '' },
    },
    severity: {
      error: '',
      success: '',
    },
  },
  compoundVariants: [
    {
      variant: 'outlined',
      severity: 'error',
      class: {
        root: 'border-red-700',
        title: 'text-red-700',
        message: 'text-red-600',
      },
    },
  ],
  defaultVariants: {
    variant: 'filled',
    severity: 'success',
  },
})

const { root, title, message } = alert({ severity: 'error', variant: 'outlined' })

// <div className={root()}><div className={title()}>…</div></div>
```

Slot-aware variants map each variant value to a **partial record of slot → classes**. Compound variants may use `class: { slotName: '…' }` the same way.

### Compound slots

Apply shared classes to several slots at once (optionally gated by variants):

```ts
const pagination = tv({
  slots: {
    base: 'flex gap-1',
    item: 'data-[active=true]:bg-blue-500',
    prev: '',
    next: '',
  },
  variants: {
    size: { xs: {}, sm: {}, md: {} },
  },
  compoundSlots: [
    {
      slots: ['item', 'prev', 'next'],
      class: 'flex items-center justify-center bg-neutral-100',
    },
    {
      slots: ['item', 'prev', 'next'],
      size: 'md',
      class: 'w-9 h-9 text-base',
    },
  ],
})
```

Without variant keys on a compound slot entry, those classes always apply to the listed slots.

## Invoking recipes

```ts
// string mode
button({ color: 'primary', class: 'mt-2' })

// slot mode
const slots = card({ color: 'primary' })
slots.base({ class: 'bg-purple-100' })
slots.title()
```

Consumer overrides use `class` or `className` on the recipe call or on individual slot calls. With merge enabled, later conflicting utilities win.
