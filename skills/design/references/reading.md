# Reading (docs, help, legal, blog article)

**Job:** Find → read → copy/act. Legal must disclose clearly, not decorate.

Typeset: https://ui.shadcn.com/docs/components/typography

## Density and type

Comfortable reading. Body **≥16px**, leading **1.6–1.75**, measure **65–80ch**
(`max-w-3xl` or `max-w-[72ch]`). Docs H1 ~`text-3xl`, H2 `text-xl`–`text-2xl`.
Code: `font-mono`, wrap without breaking commands. Legal: sentence case; no
all-caps walls; **not** `text-sm` “fine print” as the only size.

Prefer a `typeset` / prose container with three controls (size, leading, flow)
instead of restyling every heading.

## Color

Near-black `foreground` on `background`. Links **underlined** (not color-only).
Callouts: `Alert`. No marketing gradients on legal pages.

## Layout

```text
Slim header + search
Left nav (docs tree / legal TOC) — Sheet on mobile
Article
Right “On this page” (desktop)
Footer with policy links on every site chrome
```

Help center: search-first, then category cards.

## CTA

Weak. Copy code, “Contact support”. Do not hero “Start free trial” on a legal
page.

## Anti-patterns

- Full-bleed paragraphs
- `text-muted-foreground` as body (often &lt;4.5:1)
- Missing TOC
- Sticky header + TOC + cookie covering 40% of the viewport (WCAG 2.4.11)
- Docs search returning marketing pages
