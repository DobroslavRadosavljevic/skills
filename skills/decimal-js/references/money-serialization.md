# Money Patterns and Serialization

## Money constructor recipe

```ts
import Decimal from "decimal.js";

export const Money = Decimal.clone({
  defaults: true,
  precision: 28, // headroom above currency digits
  rounding: Decimal.ROUND_HALF_UP, // or ROUND_HALF_EVEN for banker's
});

export function money(value: string | bigint | Decimal) {
  return new Money(value); // reject bare JS numbers at the boundary
}
```

Prefer requiring **string** (or BigInt / Decimal) inputs at API boundaries:

```ts
const price = new Money("19.99");
const rate = new Money("0.0825");
const tax = price.times(rate).toDP(2); // Decimal cents
const total = price.plus(tax).toFixed(2); // '21.64' for display/API
```

Author ecosystem note: for finance-first apps with DP-on-division mental models, **bignumber.js** is often recommended. If the project standardizes on decimal.js, the patterns below keep currency safe.

## Patterns

1. **Line total:** `qty.times(unitPrice).toDP(2, Money.rounding)`
2. **Tax:** `net.times(taxRate).toDP(2)` — pick jurisdiction mode (`HALF_UP` / `HALF_EVEN` / `CEIL`)
3. **Discount:** `price.times(new Money(1).minus(pct))` with string `pct`
4. **Allocate / split:** high-precision intermediates; round **once** at the end; adjust the last share to fix penny drift
5. **FX / conversion:** keep intermediates at high `precision`; round to currency DP with `toDP` or `toNearest("0.01")`
6. **Tick sizes:** `toNearest(tick, rm)` for exchange increments

```ts
const shares = amounts.map((a) => a.div(total).times(pot));
const rounded = shares.map((s) => s.toDP(2));
// fix last: pot - sum(rounded.slice(0, -1))
```

## Serialization rules

| Method | Transport |
| --- | --- |
| `toJSON()` / `valueOf()` | string (signed `-0`) |
| `JSON.stringify(decimal)` | JSON string |
| `toFixed(dp)` | fixed string — best for money APIs |
| `toString()` | may use exponential; hides `-0` |
| `toNumber()` | **unsafe** for money / persistence |

```ts
// Persist / API / Zustand
{ amount: amount.toFixed(2) }

// Hydrate
const amount = new Money(dto.amount); // string
```

**Never** store money as JSON numbers or Postgres `float8` / JS `number` through a round-trip.

## React / SSR / client state

1. Store **strings** in Zustand/Redux/URL; build `Decimal` in selectors/actions.
2. In-memory `Decimal` instances are fine; custom persist serializers must emit strings.
3. Keep the same `clone` config on server and client to avoid hydration mismatches from different `precision`.
4. Avoid accidental `+decimal` / `Number(decimal)` in props or templates.

```ts
type CartState = { price: string }; // "19.99"

const total = items
  .reduce((sum, i) => sum.plus(i.price), new Money(0))
  .toFixed(2);
```

## Equality in UI / collections

- Compare with `.eq` / `.cmp`, not `===`.
- For `Map`/`Set` keys, use a canonical string (`toFixed(dp)` or normalized `toString`), not Decimal object identity.
