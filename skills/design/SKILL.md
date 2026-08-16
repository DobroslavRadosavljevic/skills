---
name: design
description: >-
  Enforces modern website visual design on shadcn/ui + Tailwind: semantic OKLCH
  tokens, type scale, light/dark palettes, spacing density, radius, elevation,
  WCAG 2.2, and surface-specific layouts (marketing, dashboard, auth, settings,
  tables, forms, docs, checkout, overlays, empty/error). Use when building,
  restyling, reviewing, or theming any website UI, landing page, app shell,
  or shadcn component composition.
---

# Design

Enforce **correct visual design** for websites built with **shadcn/ui**, Tailwind
semantic tokens, and Lucide. Classify the **surface** first. Do not apply
marketing density to a dashboard, or dashboard `text-sm` to a legal page.

## Workflow

1. Ground in the project:
   - Read local tokens (`globals.css` / `:root` / `.dark` / `@theme inline`).
   - Read `components.json` (style, `baseColor`, `cssVariables`, `iconLibrary`).
   - Reuse existing primitives (`Button`, `Card`, `Sidebar`, `Table`, …). Do not
     invent a parallel visual language.
2. Classify the surface using [surfaces.md](references/surfaces.md). Load **only**
   the matching surface file(s) plus the foundation files the change needs.
3. Apply foundations:
   - Tokens: [tokens.md](references/tokens.md)
   - Type: [typography.md](references/typography.md)
   - Color / dark mode: [color.md](references/color.md)
   - Spacing, density, radius, z-index: [spacing.md](references/spacing.md)
4. Apply surface rules (one density and one primary CTA per view).
5. Clear craft gates: [accessibility.md](references/accessibility.md),
   [anti-slop.md](references/anti-slop.md).
6. Verify: light + dark, responsive, focus ring, empty/loading/error, 200% zoom
   when layout is fragile. Prefer a browser check when available.

## Hard rules

- Style with **semantic tokens** (`bg-background`, `text-foreground`,
  `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`). No
  one-off hex/rgb on product chrome unless the project already does that for a
  documented brand exception.
- Pair surfaces: `bg-primary` with `text-primary-foreground`. Never
  `text-foreground` on `bg-primary`.
- Dark mode **overrides the same tokens** under `.dark`. Do not invert the
  page. Raise `card` / `popover` above `background`. Dark borders:
  `oklch(1 0 0 / 10%)`.
- One **filled** primary button per view. Destructive is only for destroy.
- One density per page. Do not mix hero padding with compact table chrome.
- Interactive hit area: **24×24 CSS px** minimum (WCAG 2.2 AA); prefer **44×44**
  for marketing, auth, and primary mobile actions.
- Visible labels on inputs. Placeholder is not a label.
- Icon-only controls need an accessible name. Lucide sizes: **16 / 20 / 24**.
- Honor `prefers-reduced-motion`. Keep the end state; drop travel.

## Surface map

| Surface | Load |
| --- | --- |
| Landing, pricing, blog, changelog | [marketing.md](references/marketing.md) |
| App shell, dashboard, analytics, entity detail, activity | [dashboard.md](references/dashboard.md) |
| Login, signup, invite, password | [auth.md](references/auth.md) |
| Settings, account, billing **management** | [forms-settings.md](references/forms-settings.md) |
| Tables, CRUD, admin lists | [tables-crud.md](references/tables-crud.md) |
| Multi-field forms, wizards | [forms-settings.md](references/forms-settings.md) |
| Docs, help, legal | [reading.md](references/reading.md) |
| Checkout, paywall, first upgrade | [conversion.md](references/conversion.md) |
| Dialog, sheet, command, toast | [overlays.md](references/overlays.md) |
| Empty, onboarding, 404, search-no-results | [states.md](references/states.md) |

Composed examples: [examples.md](references/examples.md).  
Official links: [source-map.md](references/source-map.md).

## Decision record (emit with UI work)

```markdown
## Surface
[marketing | dashboard | auth | …] — [user job]

## Tokens
Reuse local / change --primary|--radius|--font-sans: [why]

## Hierarchy
Type roles used: [display/h1/body/ui/caption]
Density: [generous | comfortable | compact]
Primary CTA: [one verb]

## Gates
- [ ] contrast (text 4.5:1, UI/focus 3:1) light+dark
- [ ] spacing on 4px grid
- [ ] states: empty/loading/error
- [ ] keyboard focus visible, not obscured
- [ ] anti-slop (no default indigo mesh / fake stats / equal card noise)
```

## Out of scope

Email HTML, native mobile apps, and print. If the user asks for those, say so
and keep this skill on website UI only.
