# Typography

shadcn does **not** ship a type scale. Components use Tailwind `text-*`. Limit
roles to **6–8**, not all 13 utilities.

Sources: https://tailwindcss.com/docs/font-size · https://practicaltypography.com/line-length.html · https://web.dev/learn/design/typography

## Tailwind default sizes (16px root)

| Class | Size | Default line-height | Role |
| --- | --- | --- | --- |
| `text-xs` | 12px / 0.75rem | ~1.33 | Captions, table headers — **not** body |
| `text-sm` | 14px / 0.875rem | ~1.43 | Product UI, table cells, labels |
| `text-base` | 16px / 1rem | 1.5 | Product body, empty-state copy |
| `text-lg` | 18px / 1.125rem | ~1.56 | Marketing lead, long-form body |
| `text-xl` | 20px / 1.25rem | 1.4 | Product section titles |
| `text-2xl` | 24px / 1.5rem | ~1.33 | Product H1, KPI |
| `text-3xl` | 30px / 1.875rem | 1.2 | Marketing H2, large KPI |
| `text-4xl` | 36px / 2.25rem | ~1.11 | Marketing H1 (mobile) |
| `text-5xl`–`text-7xl` | 48–72px | **1** | Display — override leading |
| `text-8xl` `text-9xl` | 96 / 128px | 1 | Rare; usually too large |

From `text-5xl` up, default `line-height: 1` clips descenders. Add
`leading-[1.1]` (or similar). Combine size + leading: `text-lg/8`.

This ladder is **uneven**, not a true modular scale. Optional ratios if you
remap `@theme --text-*`:

| Context | Ratio | Feel |
| --- | --- | --- |
| Dense dashboard | 1.125–1.2 | Tight steps |
| Product UI | 1.25 (major third) | Default target |
| Marketing | 1.333 (perfect fourth) | Display drama |

Do **not** fluid-scale body text with `vw` only. Headings may use
`text-[clamp(2.25rem,1rem+4vw,4.5rem)]`.

## Body size by surface

| Surface | Body | Notes |
| --- | --- | --- |
| Marketing / blog / docs / legal | 18px (`text-lg`) or 16px (`text-base`) with `leading-7`+ | Measure 45–75ch, ideal ~66ch (`max-w-[65ch]`) |
| Product chrome | 14px (`text-sm`) | Labels, nav, tables |
| Product reading (empty, settings intro) | 16px (`text-base`) | |
| Dense dashboard cells | 14px | Not long paragraphs |
| Avoid | 12px body | Captions only; check contrast on `muted-foreground` |

Keep `html` font-size at 100% so rem tracks user zoom (WCAG 1.4.4). Avoid
`<16px` on mobile inputs (iOS zoom).

## Leading, tracking, measure

| Role | Line-height | Tracking |
| --- | --- | --- |
| Display / H1 | 1.05–1.15 | `tracking-tight` (−0.02em to −0.04em) |
| H2–H3 | 1.15–1.25 | `tracking-tight` |
| Body | 1.5–1.75 | 0 |
| Caption | 1.4–1.5 | 0; uppercase eyebrows `tracking-widest` |
| Buttons (single line) | ~1 | 0 |

WCAG 1.4.12: layout must **survive** user overrides (lh ≥ 1.5, extra letter/
word/paragraph spacing). Avoid fixed-height text boxes.

Legal/docs: max ~80 characters (WCAG 1.4.8 AAA guidance). Use `ch`, not px.

## Weight and hierarchy

Product: prefer **weight before size** (`text-sm font-medium` vs jumping to
`text-2xl`). One `h1` per page; do not skip heading levels; do not fake H1 with
`<p className="text-5xl">`.

Numbers in tables/KPIs: `tabular-nums` (and `slashed-zero` if the font supports
it). Code and IDs: `font-mono text-xs` / `text-sm`.

## Families

- **Sans** for all UI (buttons, inputs, nav, tables). Geist or Inter are common
  shadcn defaults; prefer the **project brand** over Inter+indigo cliché.
- **Serif** only for marketing display or long-form reading columns — never
  tables, labels, or badges.
- Cap: **two families + one mono**.
- Variable fonts: stick to named weights 400/500/600/700.

## Role recipes

### Product

```tsx
<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Projects</h1>
<h2 className="text-lg font-semibold tracking-tight">Active</h2>
<p className="max-w-prose text-base leading-relaxed">Empty-state body.</p>
<label className="text-sm font-medium leading-none">Name</label>
<p className="text-sm text-muted-foreground">Helper — verify 4.5:1.</p>
<td className="text-sm tabular-nums">1,240</td>
<p className="text-3xl font-semibold tabular-nums tracking-tight">1,240</p>
```

### Marketing

```tsx
<p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
  Product
</p>
<h1 className="text-4xl font-semibold tracking-tight leading-[1.1] md:text-6xl">
  Headline
</h1>
<p className="mt-6 max-w-[40rem] text-lg leading-8 text-muted-foreground md:text-xl">
  Lead. Contrast-check muted on background.
</p>
<article className="max-w-[65ch] text-lg leading-8">…</article>
```

## Long-form (docs, blog, chat markdown)

Prefer a dedicated typeset/prose container (shadcn Typeset: size, leading, flow)
instead of styling every heading by hand. Do not put `Card` chrome around every
paragraph. Typeset: https://ui.shadcn.com/docs/components/typography

## Anti-patterns

- More than ~8 sizes on one page
- `text-xs text-muted-foreground` as the only instructions
- Display serif / `tracking-tighter` in tables
- Justified body
- Third “fun” font
- Fluid body text
