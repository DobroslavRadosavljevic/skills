# Color and dark / light palettes

Source: https://ui.shadcn.com/docs/theming · WCAG 2.2 1.4.3 / 1.4.11 / 1.4.1

## OKLCH

`oklch(L C H / a)`: **L** perceived lightness 0–1, **C** chroma (0 = gray),
**H** hue 0–360.

| C | Use |
| --- | --- |
| 0–0.02 | Neutrals (optional brand tint 0.005) |
| 0.10–0.20 | Safe UI chroma |
| 0.20–0.32 | Saturated brand / charts in sRGB |
| >0.32 | Wide gamut — clips on sRGB |

Hold **H** across themes. Retune **L** (and often drop **C** in dark). Do **not**
invert L as `1 − L` for chromatic colors.

Yellow/warning at high L fails as **text**. Official warning pattern: light fill
`0.84` + dark foreground `0.28`; dark fill `0.41` + light foreground.

## Contrast (AA)

| Pair | Ratio |
| --- | --- |
| Normal text | **4.5:1** |
| Large text (≥24px or ≥18.5px bold) | **3:1** |
| UI boundaries, icons, focus rings, chart lines vs plot | **3:1** |
| Color as the only meaning | Forbidden |

Equal OKLCH L is **not** a WCAG pass. Measure real pairs. Placeholders count as
text.

## Light vs dark (neutral default)

| Token | Light L | Dark L | Rule |
| --- | --- | --- | --- |
| `background` | 1 | 0.145 | Canvas |
| `card` / `popover` | 1 (same as page) | **0.205** | **Raised** in dark |
| `muted` / `secondary` | 0.97 | 0.269 | Step above card |
| `border` | 0.922 solid | `oklch(1 0 0 / 10%)` | White hairline in dark |
| `input` | 0.922 | `oklch(1 0 0 / 15%)` | Slightly stronger than border |
| `primary` (neutral theme) | 0.205 | 0.922 | Role flip, still achromatic |
| `muted-foreground` | 0.556 | 0.708 | Borderline on muted fills — check |

**Do:** elevate surfaces; hairline white borders; bump chromatic L in dark; drop
chroma so fills do not neon.

**Don’t:** `filter: invert()`; copy light gray `#333` borders onto `#111`; use
`muted-foreground` as body copy; stack `text-muted-foreground` on `bg-muted`
without measuring.

## Brand primary

Default shadcn **neutral** primary is gray — good chrome. Brand is **one**
chromatic hue on `--primary` / `--ring` (and sidebar-primary if needed).

Avoid the generated look: hue **262–280** (indigo/violet), mesh gradients,
glow stacks. Pick H from the product (forest, rust, ink, ochre).

```css
:root {
  --primary: oklch(0.48 0.14 38);
  --primary-foreground: oklch(0.99 0.01 95);
  --ring: oklch(0.48 0.14 38);
}
.dark {
  --primary: oklch(0.72 0.12 38);
  --primary-foreground: oklch(0.22 0.04 38);
  --ring: oklch(0.72 0.12 38);
}
```

Foreground on primary must pass 4.5:1. Ring vs adjacent background must pass 3:1.

## Status

| Role | Light | Dark | Hue |
| --- | --- | --- | --- |
| destructive | shipped | shipped (higher L, lower C) | ~22–27 |
| warning | official example in theming docs | official example | ~70–90 |
| success | high-L fill + dark FG **or** mid fill + light FG | lower C, L ~0.4 | ~140–155 |
| info | C ≤ 0.14 | raise L, drop C | ~230–250, **not** 262–280 |

Always pair icon or text with color.

## Charts

Default `--chart-1…5` **change hue between themes** and are **not** colorblind-safe
(light 4/5 both gold; dark 1 is indigo). Override with a qualitative palette
(e.g. Paul Tol bright: https://personal.sron.nl/~pault/). Add legend, tooltip,
and labels. Series vs plot ≥ 3:1.

```ts
color: "var(--chart-1)" // not hsl(var(--chart-1)) in v4
```

## Class cheat sheet

| Intent | Classes |
| --- | --- |
| Page | `bg-background text-foreground` |
| Card | `bg-card text-card-foreground border border-border` |
| Primary button | `bg-primary text-primary-foreground` |
| Quiet type | `text-muted-foreground` |
| Hover row | `hover:bg-accent hover:text-accent-foreground` |
| Danger text | `text-destructive` |

## Good / bad

| Good | Bad |
| --- | --- |
| `bg-primary text-primary-foreground` | `bg-primary text-foreground` |
| card L 0.205 > bg 0.145 | Same L everywhere in dark |
| `oklch(1 0 0 / 10%)` borders | `#333` on `#111` |
| One brand H, C 0.10–0.16 | Indigo-500 + violet glow |
| Tol series + legend | Hue-only status / series |
