# Spacing, density, layout, elevation

Tailwind v4 spacing unit: `--spacing: 0.25rem` → `p-1` = **4px**, `p-2` = **8px**.
Layout on **even steps** (2, 4, 6, 8). Use `1` / `1.5` only inside controls.

Source: https://tailwindcss.com/docs/padding

## Scale (common)

| Class | px @ 16 | Use |
| --- | --- | --- |
| `1` | 4 | Icon pad, hairline |
| `2` | 8 | Tight stack, table cell |
| `3` | 12 | Compact card |
| `4` | 16 | Default product pad / mobile gutter |
| `6` | 24 | Comfortable section / md gutter |
| `8` | 32 | Marketing / lg gutter |
| `12`–`16` | 48–64 | Hero blocks |
| `h-9` | 36 | Default new-york button |
| `h-11` / `min-h-11` | 44 | Recommended tap |
| `size-6` | 24 | WCAG 2.2 AA floor |

## Density (one per page)

| Surface | Page | Card | Gap | Type | Controls |
| --- | --- | --- | --- | --- | --- |
| Marketing | `py-16 md:py-24 lg:py-32` | `p-8 lg:p-10 rounded-xl` | `gap-10 lg:gap-16` | `text-lg`+ | `size-lg` / `h-11` |
| Product | `py-8 md:py-10` `gap-6` | `p-6` | `gap-6` | `text-sm` | default `h-9` |
| Dashboard | `py-4 md:py-6` `gap-4` | `p-4` | `gap-3`–`gap-4` | `text-sm` | `sm` + 24px min hit |
| Settings | `max-w-2xl py-8` | `p-6` per group | fields `gap-2`, groups `gap-6` | `text-sm` | default |

```tsx
<main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10 lg:px-8">
  <div className="grid gap-6 md:grid-cols-2">
    <div className="rounded-xl border bg-card p-6">…</div>
  </div>
</main>
```

## Gutters and max width

```tsx
<div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
```

| Class | Typical |
| --- | --- |
| `max-w-sm` | Auth card |
| `max-w-lg` | Dialog |
| `max-w-2xl` | Settings / form |
| `max-w-[65ch]` | Article measure |
| `max-w-5xl` | App content |
| `max-w-7xl` | Marketing / wide dashboard |

Breakpoints (min-width): `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

`container` is 100% width snapping to those maxes — **add** `mx-auto px-*`.

## Shells

**Sidebar + main** (product): `hidden md:block` rail `w-64` / `w-72`,
`min-w-0 flex-1` content. Mobile: `Sheet`, not a squeezed sidebar.

**12-col** (marketing): `grid-cols-4 md:grid-cols-8 lg:grid-cols-12`.

**Dashboard tiles:** `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`.

## Elevation

Prefer **border + surface step** over heavy shadow.

| Level | Light | Dark |
| --- | --- | --- |
| 0 page | `bg-background` | `bg-background` |
| 1 panel | `bg-card border` | `bg-card` (already lighter) + `border-border` |
| 2 nested | `bg-muted` / `bg-muted/50` | `bg-muted` |
| 3 overlay | `bg-popover border shadow-md` | keep shadow **light** |

Avoid `shadow-xl` cards in dark mode. Avoid card-in-card-in-card.

## Touch targets

- AA: **24×24 CSS px** or 24px-diameter spacing (SC 2.5.8).
- Prefer **44×44** (SC 2.5.5 / iOS HIG) for marketing, auth, mobile primary.
- Default `h-9` (36px) is acceptable for dense desktop toolbars if spacing holds.
- Icon-only: pad the hit area; 8px+ between adjacent targets.

## z-index

shadcn Dialog, Sheet, Popover often share `z-50`. Toast must **win** over dialog.

| Layer | z |
| --- | --- |
| Base | 0 |
| Sticky header / sidebar | 10 |
| Popover / dropdown / tooltip | 50 |
| Dialog / sheet overlay | 50 (portal order) |
| Toast | **60** (`z-[60]`) |
| Nested extra modal | 70 only if needed |

Do not use `z-[9999]`.
