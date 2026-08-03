# Arithmetic and Comparison API

## Instance arithmetic (aliases)

| Long | Alias | Rounds to `precision`? |
| --- | --- | --- |
| `plus` | `add` | Yes |
| `minus` | `sub` | Yes |
| `times` | `mul` | Yes |
| `dividedBy` | `div` | Yes |
| `dividedToIntegerBy` | `divToInt` | Yes |
| `modulo` | `mod` | Yes (+ `modulo` mode) |
| `toPower` | `pow` | Yes |
| `squareRoot` | `sqrt` | Yes |
| `cubeRoot` | `cbrt` | Yes |
| `naturalExponential` | `exp` | Yes |
| `naturalLogarithm` | `ln` | Yes |
| `logarithm([base])` | `log` | Yes — **default base 10** (not `Math.log`) |
| `absoluteValue` | `abs` | No |
| `negated` | `neg` | No |
| `ceil` / `floor` / `truncated` (`trunc`) | — | No |
| `round` | — | Uses `rounding`; not the same as op precision |
| `clampedTo` | `clamp` | No |
| `toDecimalPlaces` | `toDP` | Optional `dp`/`rm` — **not** global precision |
| `toSignificantDigits` | `toSD` | Optional `sd`/`rm` |
| `toNearest` | — | Nearest multiple of `x` |

```ts
x.plus(y).times(z).toDP(2);
x.div(y); // ≡ dividedBy
Decimal.log(100); // base 10 → 2
x.ln(); // natural log
```

Non-integer `pow` can be slow / lose adequacy at extreme precision — prefer `sqrt` for ½ when possible.

## Comparison

| Method | Alias | Returns |
| --- | --- | --- |
| `comparedTo` | `cmp` | `1 \| -1 \| 0 \| NaN` |
| `equals` | `eq` | boolean (`NaN` ≠ `NaN`) |
| `greaterThan` | `gt` | boolean |
| `greaterThanOrEqualTo` | `gte` | boolean |
| `lessThan` | `lt` | boolean |
| `lessThanOrEqualTo` | `lte` | boolean |

```ts
a === b; // false even if same value — object identity
a.eq(b); // value equality
a.cmp(b) === 0;
new Decimal(-0).eq(0); // true
```

Introspection: `isFinite`, `isInteger`/`isInt`, `isNaN`, `isNegative`/`isNeg`, `isPositive`/`isPos`, `isZero`, `decimalPlaces`/`dp`, `precision`/`sd([includeZeros])`.

## Formatting and conversion

| Method | Returns | Notes |
| --- | --- | --- |
| `toString` | string | Exp if `e ≤ toExpNeg` or `e ≥ toExpPos`; **hides** `-0` sign |
| `valueOf` / `toJSON` | string | Like string form but **signed** `-0` |
| `toNumber` | number | May lose precision |
| `toFixed([dp[, rm]])` | string | Always fixed-point |
| `toExponential([dp[, rm]])` | string | Always exponential |
| `toPrecision([sd[, rm]])` | string | Fixed or exp by magnitude |
| `toDecimalPlaces([dp[, rm]])` | **Decimal** | Round to decimal places |
| `toSignificantDigits([sd[, rm]])` | **Decimal** | Round to sig digits |
| `toFraction([maxDen])` | `[Decimal, Decimal]` | |
| `toBinary` / `toHexadecimal` (`toHex`) / `toOctal` | string | |
| `toNearest(x[, rm])` | Decimal | Tick sizes / denominations |

**Display money:** `toFixed(2)`. **Keep Decimal after rounding:** `toDP(2, Decimal.ROUND_HALF_UP)`.

Trailing fractional zeros are **not** retained on Decimal values — use `toFixed`/`toPrecision` when display needs them.

## Static helpers

Mirror instance ops by wrapping `new this(n)…`:

`abs`, `add`, `sub`, `mul`, `div`, `mod`, `pow`, `sqrt`, `cbrt`, `exp`, `ln`, `log`, `log2`, `log10`, `ceil`, `floor`, `trunc`, `round`, `clamp`, trig/hyperbolics, `atan2(y, x)`, `hypot(...n)`, `max(...n)`, `min(...n)`, `sum(...n)`, `sign`, `random([dp])`, `isDecimal(obj)`.

```ts
Decimal.add(x, y); // ≡ new Decimal(x).plus(y)
Decimal.max(a, b, c);
Decimal.sum(...lineItems);
```

Config/factory statics: `set` / `config`, `clone`, `noConflict` (browser) — see [config-rounding.md](config-rounding.md).
