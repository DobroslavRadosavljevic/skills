# Visual Craft and Anti-Slop

Visual design is hierarchy, rhythm, and restraint — not decoration stacked until
it looks “designed.”

## Hierarchy first

Every view needs a readable stack:

1. **Brand / product context** (when relevant)
2. **Page or section purpose** (one headline)
3. **Primary action**
4. **Supporting content**
5. **Tertiary metadata / utilities**

Encode hierarchy with **size, weight, color contrast, and space** — not with
more borders, more cards, or more icons.

### Composition rules

- **One composition** in the first viewport for marketing/landing — not a
  dashboard of widgets (unless the product *is* a dashboard).
- **One job per section** — one headline, usually one short supporting line.
- **Brand-first on branded surfaces** — the brand/product name must read as a
  hero-level signal, not only nav text. If removing the nav makes the page feel
  generic, branding is too weak.
- **Cards are not a layout strategy.** Default: no cards. Use card chrome only
  when it is the container for a user interaction or a true grouped object.
  Never put card grids in a marketing hero.
- **Full-bleed hero when imagery leads** on landing/promotional surfaces —
  edge-to-edge visual plane. Avoid inset hero thumbnails, side-panel heroes,
  rounded media cards, tiled collages, or floating image blocks unless the
  existing system requires them.
- **Hero budget** — typically: brand, one headline, one short support line, one
  CTA group, one dominant image. No stats strips, schedules, address blocks, or
  secondary promos in the first viewport.
- **No hero overlays** — no floating badges, stickers, chips, or callout boxes
  on top of hero media.

## Typography

- Prefer expressive, purposeful fonts already in the product system.
- Avoid thoughtless default stacks when the project has brand fonts.
- Limit sizes: a small, consistent type scale beats many one-off sizes.
- Line length ~45–75 characters for reading text; shorter for UI labels.
- Optical alignment: nudge ±1px when perception beats geometry.
- Balance icon + text lockups (stroke weight, size, color) so neither wins by accident.

## Spacing and layout

- Use spacing tokens / a consistent rhythm (e.g. 4/8-based). No random `17px`.
- Deliberate alignment to grid, baseline, or edge — no accidental positioning.
- Prefer flex/grid/intrinsic layout over measuring in JS.
- Nested radii: child radius ≤ parent and concentric where curves meet.
- Density: tools can be dense; marketing should breathe. Do not force one onto the other.

## Color and surfaces

- Define a clear direction with CSS variables / tokens already in the project.
- Minimum contrast: prefer perceptually accurate contrast (APCA when the project
  uses it; otherwise WCAG as floor). Interactive states increase contrast vs rest.
- Hue consistency: on tinted surfaces, borders/shadows/text lean into the same hue.
- Layered depth: if using shadows, prefer subtle ambient + direct layers; crisp
  borders often beat heavy shadows.
- Set `color-scheme` and theme-color appropriately for browser chrome.

### Avoid AI-default aesthetics

Do **not** default to these clustered looks unless they *are* the brand:

- Purple-on-white or purple→indigo gradient themes
- Warm cream backgrounds with generic high-contrast serif + terracotta accents
- Broadsheet / hairline / zero-radius dense newspaper layouts
- Dark mode + glow + blur stacks as a personality substitute
- `rounded-full` pill clusters, multi-layer shadows, emoji decoration
- Fake dashboards: metric card grids with invented numbers
- Icon rows that pretend to be features without hierarchy

## Iconography

- One icon set / optical size. Do not mix thick and thin systems.
- Icons support text; they rarely replace labels for primary actions.
- Icon-only controls need descriptive accessible names.
- Decorative icons are `aria-hidden`.

## Data and content honesty

- Format numbers, dates, and units consistently; don’t invent placeholder stats
  as design decoration.
- Plan for real string lengths (i18n expansion, empty names, long emails).
- Truncate with purpose; provide access to full values when needed.

## Product UI vs marketing UI

| | Product / app | Marketing / landing |
| --- | --- | --- |
| Density | Often higher | Lower, more atmosphere |
| Motion | Subtle, feedback-led | Can be more expressive |
| Cards | Rare; prefer rows/panels | Rare; prefer composition |
| Primary goal | Task completion | Understanding + conversion |

Do not “marketing-ize” an expert tool surface, and do not “dashboard-ize” a brand page.

## Quick visual QA

- Squint test: primary action still wins?
- Grayscale test: hierarchy survives without color?
- Real data test: long names / zero / error don’t explode layout?
- Token test: any raw one-off colors or spacing?
