# Config, Rounding, and Modulo

## `set` / `config` / `clone`

| API | Role |
| --- | --- |
| `Decimal.set(obj)` | Configure **this** constructor |
| `Decimal.config(obj)` | Alias of `set` (v7+) |
| `Decimal.clone([obj])` | New **independent** constructor (functions shared — cheap) |
| `{ defaults: true }` | Reset unspecified props to library defaults |

### Defaults

| Property | Default | Meaning |
| --- | --- | --- |
| `precision` | `20` | Max **significant digits** of op results (`1…1e9`) |
| `rounding` | `4` (`ROUND_HALF_UP`) | Default rounding mode |
| `toExpNeg` | `-7` | `toString` uses exp at/below this exponent |
| `toExpPos` | `21` | `toString` uses exp at/above this exponent |
| `minE` | `-9e15` | Underflow → `0` |
| `maxE` | `9e15` | Overflow → `Infinity` |
| `modulo` | `1` (`ROUND_DOWN`) | Remainder mode |
| `crypto` | `false` | Secure RNG for `random` |

```ts
Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_EVEN });
Decimal.set({ defaults: true }); // full reset
Decimal.set({ precision: 50, defaults: true }); // precision 50 + other defaults
```

**Never** assign `Decimal.precision = 0` directly — bypasses validation and yields unreliable results.

### Isolation decision tree

```
Published library / shared util?
  → ALWAYS Decimal.clone({ defaults: true, ...opts })
     Never Decimal.set on the default export.

App-only, one domain?
  → Decimal.set once at boot is OK.

Multiple domains (money vs science)?
  → clone per domain.
```

```ts
export const Money = Decimal.clone({
  defaults: true,
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export const Sci = Decimal.clone({
  defaults: true,
  precision: 100,
  rounding: Decimal.ROUND_HALF_EVEN,
});
```

Results of ops use the **receiver’s** constructor config when mixing clone origins.

## Significant digits vs decimal places

```ts
Decimal.set({ precision: 5, rounding: 4 });
new Decimal(5).div(3); // '1.6667' — 5 significant digits
new Decimal("123.456789").plus(1); // '124.46' — sig-digit rounding!

new Decimal("12.34567").toDP(2); // '12.35' — decimal places; ignores precision
```

| Need | Use |
| --- | --- |
| Magnitude-independent accuracy | Raise `precision` |
| Fixed fractional places (cents) | `.toDP(2)` / `.toFixed(2)` after ops |
| Explicit sig-digit round | `.toSD(n)` |
| Display only | `toFixed` / `toPrecision` / `toExponential` (strings) |

**Finance pitfall:** significant-digit precision alone is not currency DP. Always plan a final `toDP`/`toFixed` (and enough `precision` headroom for intermediates).

## Rounding modes

| Constant | Value | Behavior | Typical use |
| --- | --- | --- | --- |
| `ROUND_UP` | 0 | Away from zero | Always inflate magnitude |
| `ROUND_DOWN` | 1 | Toward zero | Truncate |
| `ROUND_CEIL` | 2 | Toward +∞ | Ceiling charges |
| `ROUND_FLOOR` | 3 | Toward −∞ | Floor |
| `ROUND_HALF_UP` | **4** | Nearest; ties away from 0 | **Default**; common commerce |
| `ROUND_HALF_DOWN` | 5 | Nearest; ties toward 0 | |
| `ROUND_HALF_EVEN` | 6 | Nearest; ties to even | Banker’s / less bias |
| `ROUND_HALF_CEIL` | 7 | Nearest; ties toward +∞ | Emulates `Math.round` (API note) |
| `ROUND_HALF_FLOOR` | 8 | Nearest; ties toward −∞ | |
| `EUCLID` | 9 | **Modulo only** | Always-nonnegative remainder |

Modes 0–6 match Java `BigDecimal`. Pass mode as second arg to `toDP` / `toFixed` / etc. when overriding the constructor default.

## Modulo modes

Config `modulo` controls `mod` remainder sign. Default **`1`** matches JS `%`.

| Mode | Value | Remainder |
| --- | --- | --- |
| `ROUND_DOWN` | 1 | Same sign as **dividend** (JS `%`) |
| `ROUND_FLOOR` | 3 | Same sign as **divisor** (Python `%`) |
| `ROUND_HALF_EVEN` | 6 | IEEE 754 remainder |
| `EUCLID` | 9 | Always ≥ 0 |

```ts
Decimal.set({ modulo: 1 });
new Decimal(-7).mod(3); // '-1'

Decimal.set({ modulo: Decimal.EUCLID });
new Decimal(-7).mod(3); // '2'
```
