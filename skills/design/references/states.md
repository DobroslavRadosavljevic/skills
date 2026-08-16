# States (empty, onboarding, error, 404, search)

Empty, loading, error, and no-results are **four designs**. Never reuse one
illustration for all of them.

NN/g empty: https://www.nngroup.com/articles/empty-state-interface-design/  
NN/g errors: https://www.nngroup.com/articles/error-message-guidelines/

## Loading

`Skeleton` matching the **final layout** (table rows, KPI cards). `aria-busy`
on the region. Hide decorative pulse from AT (`aria-hidden` on bones). No pulse
when `prefers-reduced-motion`. Buttons: verb in progress (“Saving…”) + spinner
with a name.

## Empty (first use)

Stay in the **app shell**. Heading names an **outcome** (“Track stalled deals”),
not “No data”. One sentence how. **One** primary (“Create project”). Optional
import / sample / skip. Ghost rows that preview structure beat a floating art
island. Do not use `destructive` for “no rows”.

## Empty (inbox zero)

Confirmation, not activation. Different copy from first-use.

## Search / no-results

Echo the query: `No docs matching “xyz”`. CTA = **clear filters** / refine —
not Create unless creation is the job. Don’t use the first-use illustration.

## Onboarding

Checklists in `Card`s with progress — not a 5-slide modal carousel. Ask
permissions in context. Skip available on optional tours.

## Page error / 404 / maintenance

Sparse, centered, `max-w-md`–`max-w-lg`. Code (`404`) small/muted; title human;
body what happened + what to do. Primary: Home / Retry / Status. Don’t paint
the whole page red. Form errors stay **inline**, not a 404.

Dead session: **no** `Sidebar`. Distinguish 404 vs empty vs loading (`Skeleton`
until sure).

## Example (empty)

```tsx
<div className="flex flex-col items-start gap-4 py-16">
  <h2 className="text-lg font-semibold tracking-tight">Track stalled deals</h2>
  <p className="max-w-md text-sm text-muted-foreground">
    Create a pipeline to see deals that have not moved in 14 days.
  </p>
  <Button>Create pipeline</Button>
</div>
```
