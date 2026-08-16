# Checkout, paywall, first upgrade

**Job:** Start money — choose plan → pay. Distinct from **settings billing**
(manage after first charge).

Stripe portal vs Checkout: https://docs.stripe.com/customer-management/integrate-customer-portal

## Density and type

Focused. Slim logo header + lock/trust line — **no** full app nav (or collapse
it). Plan picker: 2–4 `Card`s. Price is the display number; period
`text-muted-foreground`. Features `text-sm`.

## Color and CTA

Highlight recommended/current plan with border + `Badge`. One filled CTA per
selected plan (“Upgrade to Pro” / “Pay”). Do not use `destructive` for upgrade.
Don’t three filled plan buttons.

## Layout

```text
Logo
“You’re on Free”
Plan cards + monthly/annual Tabs
Order summary
Hosted/embedded pay
Success
```

Soft paywall: feature they hit + upgrade + “Not now”. Compare `Table` only if
plans differ on many axes.

## Anti-patterns

- Asking for a card on signup without saying so
- Rebuilding PCI inputs in shadcn when Checkout exists
- Trapping users in a paywall `Dialog` with no dismiss for soft gates
- Mixing invoice-history chrome into first purchase
