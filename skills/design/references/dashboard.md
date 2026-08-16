# Dashboard and app shell

**Job:** Persistent frame for daily work. Overview → action in seconds. Power
users want data, not hero whitespace.

Official: https://ui.shadcn.com/docs/components/sidebar · https://ui.shadcn.com/blocks

## Density and type

Compact: content `gap-4` `p-4`–`p-6`. UI `text-sm`. KPI `text-2xl`–`text-3xl`
`tabular-nums tracking-tight`. Labels `text-xs text-muted-foreground`. Mono for
IDs and timestamps.

Sidebar ~16rem (`w-64`), icon collapse ~3–4rem. Filters live in the **content
toolbar**, not the nav rail.

## Color

Quiet neutrals. Charts: overridden `--chart-*` + legend, not rainbow. Semantic
color only on deltas and `Badge`. Dark is a first-class theme, not an invert.

## Layout (`dashboard-01` shape)

```text
SidebarProvider
  Sidebar (brand, groups by frequency, user footer)
  SidebarInset
    thin header (search, account)
    page header (title + one Create)
    3–6 KPI Cards  →  one hero chart  →  table
```

Mobile: `Sheet` for nav and filters.

## Primary CTA

Page-level filled button in the **page header** (“Create project”). Nav items
are not CTAs.

## Entity detail

Comfortable: breadcrumb → `text-2xl` title + status `Badge` + one header
primary → `Separator` → main `Card` + side meta `Card`. Destroy in
`AlertDialog`. Do not nest cards three deep.

## Activity / notifications

Compact list, relative time, unread dot with `primary`. `Tabs` All/Unread.
Overflow: `Popover` or a page — not a huge `Dialog`. “Mark all read” is `ghost`.

## shadcn kit

`Sidebar*`, `SidebarInset`, `Breadcrumb`, `Card`, `Badge`, `Chart`, `Table`,
`Tabs`, `DropdownMenu`, `Command`, `Sheet`, `Skeleton`.

## Anti-patterns

- Welcome banner eating 80–120px
- More than ~6 KPIs above the fold
- Marketing gradients in the shell
- Equal-noise KPI cards with fake sparkline decoration
- Collapsing nav, filters, and detail into one control

## Example (KPI)

```tsx
<Card className="gap-2 p-4">
  <CardDescription>MRR</CardDescription>
  <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
    $48,200
  </CardTitle>
  <p className="text-xs text-muted-foreground">
    <span className="text-foreground">+4.1%</span> vs last month
  </p>
</Card>
```
