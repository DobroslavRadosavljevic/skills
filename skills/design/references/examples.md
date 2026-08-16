# Examples

Composable patterns. Always use the project’s `Button` / `Card` imports and
`cn()`.

## 1. Token-correct card (product)

```tsx
<Card className="border-border bg-card text-card-foreground">
  <CardHeader>
    <CardTitle className="text-lg font-semibold tracking-tight">Usage</CardTitle>
    <CardDescription>Last 30 days</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-semibold tabular-nums tracking-tight">12,480</p>
  </CardContent>
</Card>
```

## 2. Wrong pairing (do not ship)

```tsx
<div className="bg-primary text-foreground">Save</div>
<div className="bg-primary text-black">Save</div>
<p className="bg-muted p-4 text-xs text-muted-foreground">The only instructions</p>
```

## 3. Marketing vs dashboard on the same product

Marketing H1: `text-4xl md:text-6xl`. Dashboard H1: `text-2xl md:text-3xl`.
Marketing section: `py-24`. Dashboard section: `py-4 gap-4`. Do not copy the
hero into `SidebarInset`.

## 4. Status without color-only

```tsx
<Badge variant="outline" className="gap-1">
  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
  Active
</Badge>
```

## 5. Dark elevation

```tsx
<main className="bg-background">
  <section className="rounded-xl border border-border bg-card p-6">
    Nested: <div className="rounded-md bg-muted p-3">Quiet well</div>
  </section>
</main>
```

In `.dark`, `card` must be **lighter** than `background` (default 0.205 vs 0.145).

## 6. Sheet edit (CRUD)

Table stays mounted. `Sheet` width `sm:max-w-lg`. Sticky footer Save / Cancel.
Do not use `Dialog` for a 12-field editor.

## 7. Focusable icon button

```tsx
<Button variant="ghost" size="icon" aria-label="Open filters">
  <ListFilter aria-hidden className="size-4" />
</Button>
```

## 8. Adding warning tokens

See [tokens.md](tokens.md). Then:

```tsx
<div className="rounded-md bg-warning px-3 py-2 text-sm text-warning-foreground">
  Payment method expires in 3 days.
</div>
```

## 9. Typeset article

```tsx
<article className="typeset mx-auto max-w-[65ch] [--typeset-size:1.125rem] [--typeset-leading:1.75]">
  {/* rendered markdown */}
</article>
```

Keep `Card` chrome **out** of the typeset tree (`not-typeset` on components).

## 10. Page gutters

```tsx
<div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
```

Use on marketing and app content. Auth cards skip the wide max-width and use
`max-w-sm` instead.
