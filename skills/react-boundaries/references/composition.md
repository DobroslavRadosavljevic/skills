# Composition

Intermediates should shape layout and slots. They should not exist to forward data they never use.

## Prefer children and slots

```tsx
// Good: shell composes; leaf owns data
function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="orders">
      <OrdersNav />
      <main>{children}</main>
    </div>
  )
}

function OrderDetailsPage({ orderId }: { orderId: string }) {
  return (
    <OrdersLayout>
      <OrderSummary orderId={orderId} />
      <OrderActivity orderId={orderId} />
    </OrdersLayout>
  )
}
```

```tsx
// Bad: shell is a prop router
function OrdersLayout({
  summary,
  activity,
  isLoading,
}: {
  summary: Summary
  activity: Activity[]
  isLoading: boolean
}) {
  return (
    <div>
      {isLoading ? <Spinner /> : null}
      <SummaryView data={summary} />
      <ActivityView items={activity} />
    </div>
  )
}
```

## Named parts over prop bags

When building reusable UI, prefer explicit parts (`Card.Header`, `Dialog.Footer`) or `children` over `title`, `description`, `actions`, `isLoading` props that force callers to own all state above the component.

Keep props narrow: DOM props, `className`, `children`, controlled state the part truly coordinates, and intentional variants.

## Callbacks

- Pass a callback only to the component that fires it, or to a slot that renders that control.
- Do not thread `onSave` through layout ancestors that never call it—render the actions where the mutation lives, or use a slot:

```tsx
<OrderPanel orderId={orderId} footer={<OrderSaveButton orderId={orderId} />} />
```

## Context as composition glue

Scoped context is fine for compound components (root provides state parts consume). Rules:

- Provide at the root that owns the interaction.
- Fail clearly when a part is used outside its root.
- Split high-churn state from stable dispatch/actions when consumers differ.
- Do not use app-wide context as a substitute for leaf queries.

## Render isolation

- Keep high-frequency state (keystrokes, drag, hover) in a small owner so siblings do not re-render.
- Split list rows so row-local state does not live in the list page.
- Suspense and error boundaries are UI walls: put them around leaves that own their own loading/error, instead of one mega-spinner at the page driven by every child’s data.

## Props that are still good

Passing props is correct when:

- The value is **identity** (`id`, `slug`, enum mode) or pure config.
- The parent **truly coordinates** (controlled accordion index shared by siblings).
- The child is a reusable presentational primitive with no data dependency by design (design-system `Button`).

If a prop exists only because an ancestor fetched “for convenience,” move the fetch.
