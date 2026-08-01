# Styling

## Prefer Tailwind + `pixelBasedPreset`

Email clients do not support `rem`. Always include `pixelBasedPreset`:

```tsx
import { Tailwind, pixelBasedPreset, type TailwindConfig } from 'react-email';

<Tailwind config={{ presets: [pixelBasedPreset] }}>
```

How Tailwind works here:

- Utilities become inline styles on elements
- Media queries (when used) go into a `<style>` tag via `Head`
- CSS variables are resolved; RGB syntax is normalized for clients

Inline `style={{}}` is fine when the project is not on Tailwind.

## Shared Brand Config

```tsx
// emails/tailwind.config.ts
import { pixelBasedPreset, type TailwindConfig } from 'react-email';

export default {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#007bff',
          secondary: '#6c757d',
        },
      },
    },
  },
} satisfies TailwindConfig;
```

Import that config in every template. Prefer semantic classes (`bg-brand-primary`) over one-off hex in JSX.

## Unsupported / Fragile

| Avoid | Prefer |
| --- | --- |
| Flexbox / CSS Grid | `Row` / `Column` or nested `Section` |
| `sm:` `md:` `lg:` `xl:` | Single mobile-first stacked layout (~600px) |
| `dark:` / `light:` | Explicit dark palette if requested |
| SVG / WEBP images | PNG / JPEG |
| `rem`-based sizing without preset | `pixelBasedPreset` |
| Generic web CSS assumptions | Check [Can I email](https://www.caniemail.com) |

If the user insists on media queries, warn that support is uneven across Outlook/Gmail/webmail and offer stacked layouts instead.

## Required Utility Patterns

| Case | Classes |
| --- | --- |
| `Button` | `box-border` (plus `block text-center no-underline` as needed) |
| Any border / `Hr` | Explicit `border-solid` (or dashed/dotted) |
| Single-side border | `border-none` then the side + `border-solid` |

```tsx
// good
<div className="border border-solid border-gray-300" />
<div className="border-none border-l border-solid border-l-gray-300" />

// bad — missing border style
<div className="border border-gray-300" />
```

## Layout Defaults

```tsx
<Body className="bg-gray-100 font-sans py-10">
  <Container className="mx-auto max-w-xl bg-white p-6 rounded">
```

- Max content width ~600px (`max-w-xl` is a common choice).
- Stack content for mobile; treat multi-column as progressive enhancement that may collapse poorly in some clients.
- Fixed width/height for logos/icons; `w-full h-auto` for content images.

## Dark Mode (Explicit)

There is no reliable `dark:` utility story. When asked for dark emails, set colors directly:

```tsx
<Body className="bg-[#151516]">
  <Container className="bg-black text-white">
```

Aim for WCAG AA contrast (~4.5:1) for body text.

## Head Placement with Tailwind

```tsx
<Html>
  <Tailwind config={{ presets: [pixelBasedPreset] }}>
    <Head />
    <Body>...</Body>
  </Tailwind>
</Html>
```

## Size and Deliverability Styling Notes

- Keep total HTML under ~102KB (Gmail clips larger messages).
- Prefer system/web-safe stacks when brand fonts are optional.
- Do not rely solely on `<style>` — Tailwind inlining is the compatibility path.
