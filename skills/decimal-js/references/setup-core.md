# Setup and Core Concepts

## Install

```bash
bun add decimal.js
```

No peer dependencies. Types ship with the package — do not add `@types/decimal.js` for current v10.

## Imports

```ts
import Decimal from "decimal.js";
import { Decimal } from "decimal.js"; // also valid

const Decimal = require("decimal.js"); // CJS → decimal.js
```

Package `exports` (10.4.0+):

| Condition | File |
| --- | --- |
| `import` | `decimal.mjs` |
| `require` | `decimal.js` |
| `types` | `decimal.d.ts` |

Browser script tag exposes global `Decimal`; `Decimal.noConflict()` restores a prior global.

Callable without `new` since **10.5.0**: `Decimal('1.23')` ≡ `new Decimal('1.23')`. Prefer `new` for clarity unless the project already omits it.

## Constructor

```ts
type Decimal.Value = string | number | bigint | Decimal;

new Decimal(value);
```

| Input | Notes |
| --- | --- |
| `string` | Preferred for money / long values; supports `e`/`E`, underscores, `0b`/`0o`/`0x`, binary exp `p`/`P` |
| `number` | Includes `±0`, `±Infinity`, `NaN` — **may already be imprecise** |
| `bigint` | Since 10.5.0 |
| `Decimal` | Clone; cross-origin clones OK since 10.3.0 |

Invalid values **throw** `Error` with message starting `[DecimalError]`.

### Why strings for money

```ts
new Decimal(1.0000000000000001); // '1'
new Decimal(88259496234518.57); // '88259496234518.56'
new Decimal(0.7 + 0.1); // '0.7999999999999999' — Number already wrong
new Decimal("19.99"); // exact
new Decimal(1999n); // exact integer BigInt
```

**Rule:** never run IEEE Number arithmetic first, then wrap. Construct operands as Decimal/string/BigInt, then operate.

Safe-looking floats like `0.046875` can be exact in IEEE-754; that is not a general money pattern.

## Immutability

- Methods return **new** Decimals; they do not mutate the receiver.
- Methods do not round arguments before use.
- Chaining is idiomatic: `x.dividedBy(y).plus(z).times(9).floor()`.
- Treat internal `d` / `e` / `s` as read-only.

## Special Values

decimal.js supports **NaN**, **±Infinity**, and **signed zero** (unlike big.js / decimal.js-light).

```ts
new Decimal(-0).toString(); // '0'
new Decimal(-0).valueOf(); // '-0'
new Decimal(-0).isNegative(); // true
new Decimal(0).isPositive(); // true

new Decimal(1).div(0); // Infinity
new Decimal(0).div(0); // NaN
```

`Decimal.isDecimal(obj)` — type guard; works across clone constructors.

## TypeScript

```ts
import Decimal from "decimal.js";

const v: Decimal.Value = "1.23";
const cfg: Decimal.Config = { precision: 50, rounding: Decimal.ROUND_HALF_EVEN };
Decimal.set(cfg);

const Money = Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_UP });
```

Prefer `--strictNullChecks`. Interface name is **`Decimal.Config`** (not `Configuration`).
