# Forms, wizards, settings, billing management

## Forms / wizards

**Job:** Collect correct data with least anxiety. Wizards are for **dependent
steps** or async provisioning — not a 3-field form split into 3 screens.

**Density:** One column, `max-w-xl`–`max-w-2xl`, `gap-6` between fields. Labels
`text-sm`. Errors adjacent to the field (`FieldError` / `aria-invalid`).

**Footer:** Cancel `ghost` left, Submit/Next filled right. Wizard: “Step 2 of 5”,
Back, Next saves the step. Unsaved close → confirm.

**Anti-patterns:** Multi-column dense forms on mobile; long forms inside
`Dialog` (use `Sheet` or a page); required fields hidden in “Advanced”; two
filled buttons.

```tsx
<form className="mx-auto max-w-xl space-y-6">
  <div className="grid gap-2">
    <Label htmlFor="name">Workspace name</Label>
    <Input id="name" />
    <p className="text-sm text-muted-foreground">Shown on invoices.</p>
  </div>
  <div className="flex justify-end gap-2">
    <Button type="button" variant="ghost">
      Cancel
    </Button>
    <Button type="submit">Create workspace</Button>
  </div>
</form>
```

## Settings / account

**Job:** Grouped configuration with predictable save.

**Density:** Comfortable. Content `max-w-2xl`–`max-w-3xl`. `Card` per group.
Switch rows: `justify-between` + border. Page title `text-2xl`; section `text-lg`.

**Chrome:** App shell + settings subnav (`Sidebar` groups or vertical `Tabs`):
Account / Preferences / Billing.

**Save:** Sticky/footer “Save changes”, disabled until dirty — **or** explicit
auto-save with toast, not both unused.

**Destroy:** `AlertDialog` for delete account / revoke.

## Billing management vs checkout

Settings billing = **manage after first charge** (plan, next invoice, portal,
invoice table). First purchase / upgrade paywall = [conversion.md](conversion.md).

Do not rebuild PCI card fields in shadcn when a hosted Checkout exists.
Destructive color only on cancel-subscription, not on “Upgrade”.

## shadcn kit

`Form` / `Field`, `Label`, `Input`, `Textarea`, `Select`, `Checkbox`,
`RadioGroup`, `Switch`, `Tabs`, `Card`, `Separator`, `Button`, `Badge`,
`AlertDialog`, `Table` (invoices), `Progress` (wizard).
