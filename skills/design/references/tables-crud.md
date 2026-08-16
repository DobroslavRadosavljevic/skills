# Tables, CRUD, admin

**Job:** Scan, filter, and act on many records without losing list context.

## Density and type

Highest density. Compact rows. Toolbar **above**, pagination **below**. Cells
`text-sm`; headers `text-xs font-medium uppercase tracking-wide text-muted-foreground`.
First column = identity link, semibold. Numbers `text-right tabular-nums`.

## Color

Row hover `hover:bg-accent`. Status via `Badge` (text + color). Don’t zebra-stripe
**and** use heavy borders. Destructive only in confirm.

## Layout

```text
Page header + filled “Add {entity}” (above the table, not after it)
Filter Input + view options
Table
Pagination
```

- Create/edit: **`Sheet`** so the table stays visible.
- Full page: wizards, nested sub-tables, or shareable URLs.
- Delete: `AlertDialog`.
- Extra row actions: `DropdownMenu` — not 5 filled buttons.
- Mobile: card list or horizontal scroll + `Sheet` filters.

## Anti-patterns

- Edit in a blocking `Dialog` that hides reference rows
- Empty `<tbody>` with no empty state
- Create button only after a long table
- Display type or serif in cells

## Example

```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between gap-4">
    <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
    <Button>Create invoice</Button>
  </div>
  <Input placeholder="Filter…" className="max-w-sm" aria-label="Filter invoices" />
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Customer</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-accent">
        <TableCell className="font-medium">Acme</TableCell>
        <TableCell className="text-right tabular-nums">$1,240.00</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

`placeholder` on a filter still needs `aria-label` or a visible `Label`.
