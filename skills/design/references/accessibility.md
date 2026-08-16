# Accessibility

Target **WCAG 2.2 AA**. Primitives give keyboard and roles; you own contrast,
labels, copy, and not stripping `focus-visible`.

Spec: https://www.w3.org/TR/WCAG22/

## Map

| SC | Rule | Practice |
| --- | --- | --- |
| 2.4.7 | Focus visible | Keep `focus-visible:ring-*`. Never `outline-none` without a replacement. |
| 1.4.11 | Non-text contrast ≥ 3:1 | Full `--ring` + `ring-2` + `ring-offset-2 ring-offset-background`. Avoid `ring-ring/50` as the **only** indicator. |
| 2.4.11 | Focus not fully covered | `scroll-margin` under sticky chrome; toasts must not cover focused fields. |
| 2.5.8 | Target ≥ 24×24 CSS px | Pad icon buttons; space adjacent targets. Prefer 44×44 on touch/marketing. |
| 3.3.2 | Visible labels | `Label` + `htmlFor`. Placeholder is not a label. |
| 1.4.3 | Text 4.5:1 | Check `muted-foreground` on `muted` fills. |
| 1.4.1 | Not color-only | Error text + icon + `aria-invalid`. |
| 2.1.1 | Keyboard | Real `Dialog`/`Sheet`, not a styled `div`. |
| 3.3.8 | Accessible auth | Allow paste on OTP/password. |
| 1.1.1 / 4.1.2 | Name | Icon-only: `aria-label` on the **control**; SVG `aria-hidden`. |

## Focus ring

```tsx
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

Reduced motion must **not** remove the ring.

## Dialog / Sheet

Always `DialogTitle` + `DialogDescription` (visually hidden if needed). Focus in,
trap, Esc, restore. Destructive confirm = `AlertDialog`, focus Cancel first.

## States every control needs

Hover, `focus-visible`, active, disabled (explain why rather than silent disable).
Every async view: loading, empty, error. Success is text (and optional polite live
region), not green-only.

## Motion

150–300ms UI chrome. Hover 100–150ms. Overlay enter 200–250ms, exit faster.
Animate `transform` + `opacity`. Honor `prefers-reduced-motion`: keep state, drop
travel. Auto motion >5s needs pause (2.2.2). Never flash >3×/s.

## Icons

Lucide. Sizes **16 / 20 / 24** (`size-4` / `size-5` / `size-6`). Product default
16. Never icon-only without a name.

```tsx
<Button size="icon" aria-label="Delete invoice">
  <Trash aria-hidden className="size-4" />
</Button>
```

## Copy

CTAs are verbs that name the outcome. Errors name the field, the problem, and the
fix. Loading uses the same verb (“Saving changes”). Empty names the outcome plus
one action.
