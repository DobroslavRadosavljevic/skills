# Surfaces

Classify the route **before** choosing density, type, chrome, and CTA.

| If the user is… | Surface | Chrome |
| --- | --- | --- |
| A stranger deciding to try the product | Marketing | Header + footer, **no** `Sidebar` |
| Working inside the product daily | Dashboard / app shell | `Sidebar` + header |
| Proving identity | Auth | Logo only, no app nav |
| Configuring account / billing portal | Settings | App shell + settings subnav |
| Scanning many records | Tables / CRUD | App shell, compact |
| Filling a long or stepped form | Forms / wizards | Narrow column |
| Reading docs or legal | Reading | Docs nav + TOC, article measure |
| Paying for the first time | Checkout / paywall | Slim logo header |
| Interrupted by a task | Overlays | Dialog / Sheet / Command |
| Stuck (empty, 404, no results) | States | Keep or drop chrome per rules below |

## Contrast matrix

| Axis | Marketing | App shell | Auth / checkout / error | Docs / legal |
| --- | --- | --- | --- | --- |
| Density | Generous | Compact–comfortable | Sparse, focused | Comfortable reading |
| Type | Display headlines | `text-sm` UI | `text-2xl` title + `text-sm` fields | ≥16px, 65–80ch |
| Color | Primary as CTA + brand | Neutral; semantic badges | Primary = submit | Links underline; no hero gradients |
| Primary CTA | One offer, repeatable | Page-level Create | One submit | Rare |

## Always

1. One filled `Button` per view (plus destructive only for destroy).
2. Marketing never gets `Sidebar`. Auth / checkout / dead-session 404 never get
   full app nav.
3. Billing **settings** ≠ first **checkout**.
4. Empty ≠ loading ≠ error ≠ search-no-results.
5. CRUD edit → `Sheet`; destroy → `AlertDialog`; jump → `Command`.

## Extra surfaces (still in this skill)

- **Entity detail:** comfortable header + main/side cards. One header primary.
  See [dashboard.md](dashboard.md).
- **Search / no-results:** echo the query; CTA is clear-filters, not Create
  unless creation is the job. See [states.md](states.md).
- **Activity / notifications:** compact list, unread dot, not KPI cards. See
  [dashboard.md](dashboard.md).
