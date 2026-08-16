# Tokens (shadcn)

Theme through **CSS variables**, not rewritten component classes. Default:
`tailwind.cssVariables: true` in `components.json`.

Source: https://ui.shadcn.com/docs/theming

## Convention

Base token = **surface**. `-foreground` = **text/icons on that surface**.

```tsx
<div className="bg-primary text-primary-foreground">Save</div>
```

## Token table

| Token | Controls | Typical classes |
| --- | --- | --- |
| `background` / `foreground` | Page canvas and default type | `bg-background` `text-foreground` |
| `card` / `card-foreground` | Panels | `bg-card` `text-card-foreground` |
| `popover` / `popover-foreground` | Floating overlays | `bg-popover` |
| `primary` / `primary-foreground` | Brand actions | `bg-primary` |
| `secondary` / `secondary-foreground` | Lower-emphasis fill | `bg-secondary` |
| `muted` / `muted-foreground` | Quiet fill + helper type | `bg-muted` `text-muted-foreground` |
| `accent` / `accent-foreground` | Hover / selected | `hover:bg-accent` |
| `destructive` | Destroy / error emphasis | `bg-destructive` `text-destructive` |
| `border` `input` `ring` | Chrome, fields, focus | `border-border` `ring-ring` |
| `chart-1` … `chart-5` | Series | `var(--chart-1)` |
| `sidebar*` | Sidebar canvas, active, hover, ring | `bg-sidebar` |
| `radius` | Corner scale | `rounded-lg` = base |

`destructive-foreground` is not always in the default scaffold. Add the pair if
you put light text on a filled destructive button.

## Wiring (Tailwind v4)

Colors live as full `oklch(...)` on `:root` and `.dark`. Map with `@theme inline`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

@custom-variant dark (&:is(.dark *));
```

Do **not** wrap v4 tokens in `hsl(var(--token))`. That is the old v3 pattern.

## Default radius

`--radius: 0.625rem` (10px). `rounded-lg` is the base. Inputs/buttons:
`rounded-md`. Cards: `rounded-xl`. Change **one** `--radius` to restyle the app.

Older notes used `calc(var(--radius) - 2px)`. Prefer the live theming multipliers
above.

## Adding tokens (success / warning / info)

shadcn does **not** ship success/warning/info. Add both themes, then expose:

```css
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
  --success: oklch(0.94 0.08 155);
  --success-foreground: oklch(0.27 0.07 155);
}
.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
  --success: oklch(0.37 0.08 155);
  --success-foreground: oklch(0.97 0.02 155);
}
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}
```

Then `bg-warning text-warning-foreground`. Never reuse `destructive` for success.

## Fonts

Map `--font-sans` and `--font-mono` (optional `--font-serif`) so `font-sans` /
`font-mono` work. Put the family variable on `<html>`, then `font-sans antialiased`
on the document. Align names (`--font-sans` vs `--font-geist-sans`).

## Base colors

`tailwind.baseColor` at init: Neutral, Stone, Zinc, Mauve, Olive, Mist, Taupe.
Do not mix a second ad-hoc gray scale in utilities.

## Body baseline

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

If focus rings fail 3:1, strengthen `--ring` rather than deleting rings. See
[accessibility.md](accessibility.md).
