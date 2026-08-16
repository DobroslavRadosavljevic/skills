# Marketing (landing, pricing, blog, changelog)

**Job:** Convert strangers — what it is, why it matters, what to do next.
Blog/changelog feed mid-funnel; they are **not** dashboards.

Official blocks: https://ui.shadcn.com/blocks

## Density and type

Generous section padding (`py-16 md:py-24`). Hero headline `text-4xl md:text-6xl`
`font-semibold tracking-tight leading-[1.1]`. Lead `text-lg md:text-xl leading-8`
`max-w-[40rem]`. Body in articles `text-lg` + `max-w-[65ch]`. Max two families.

## Color and CTA

One primary CTA color site-wide. Secondary = `outline` / `ghost`. Repeat the
**same** offer in hero, mid-page, and footer. Copy is a verb + outcome
(“Start free trial”), not “Learn more” as the only action.

Pricing: highlight **one** recommended tier (border + `Badge`). Never three
filled primary buttons.

## Layout skeleton

```text
Nav (logo, 1–2 links, one CTA)
Hero (headline, subhead, 1 CTA, product shot — not a card grid)
Proof (logos or quotes)
3–5 features (one story leads; others subordinate)
How it works
Pricing preview
FAQ (Accordion)
Final CTA
Footer
```

Blog: list cards **or** long-form typeset — not KPI rows.
Changelog: reverse-chrono (`Badge` version + date + bullets).

## shadcn kit

`Button`, `NavigationMenu`, `Accordion`, `Card`, `Badge`, `Separator`, `Avatar`,
`Tabs` (billing period). **No** `Sidebar` on marketing routes.

## Anti-patterns

- Co-equal “Start free” + “Book demo” both filled in the hero
- Card grid in the first viewport
- Overlay stickers/badges on the hero media
- Unreadable dashboard screenshots on mobile
- Changelog styled like analytics
- Purple mesh, fake “10k+ teams”, pill-badge clusters (see [anti-slop.md](anti-slop.md))

## Example (hero)

```tsx
<section className="px-4 py-16 md:px-6 md:py-24 lg:px-8">
  <div className="mx-auto max-w-3xl text-center">
    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
      Observability
    </p>
    <h1 className="mt-4 text-4xl font-semibold tracking-tight leading-[1.1] md:text-6xl">
      See every deploy in one timeline
    </h1>
    <p className="mx-auto mt-6 max-w-[40rem] text-lg leading-8 text-muted-foreground">
      Trace production from commit to customer impact.
    </p>
    <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
      <Button size="lg">Start free trial</Button>
      <Button size="lg" variant="outline">
        View docs
      </Button>
    </div>
  </div>
</section>
```
