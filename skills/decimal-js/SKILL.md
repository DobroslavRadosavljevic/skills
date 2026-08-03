---
name: decimal-js
description: "Build, review, debug, migrate, or plan arbitrary-precision decimal math with decimal.js v10. Use for decimal.js, Decimal, Decimal.clone, Decimal.set, precision, rounding modes, ROUND_HALF_UP, ROUND_HALF_EVEN, toDecimalPlaces, toFixed, plus, minus, times, dividedBy, money/currency math, BigInt decimals, NaN/Infinity handling, trig/exp/ln, decimal.js-light, and comparisons with big.js or bignumber.js."
---

# decimal.js

Use this skill for **decimal.js v10** arbitrary-precision decimal arithmetic: construction, config, rounding, money-safe patterns, serialization, and advanced math.

## Workflow

1. Inspect the local surface before changing code:
   - Package: `decimal.js` (and siblings `decimal.js-light`, `bignumber.js`, `big.js` if present).
   - Version: target **v10** (current `10.6.0`); bundled `decimal.d.ts` (BigInt in types since 10.6.0).
   - Domain: money/currency, scientific, or general — this drives `clone` config and whether significant-digit `precision` alone is enough.
   - Imports: default or named `Decimal` from `"decimal.js"`.
2. Refresh docs when versions are unclear or work touches rounding, money, trig, or library isolation. Start from [source-map.md](references/source-map.md).
3. Route deeper detail:
   - Install, constructor, immutability, Value types: [setup-core.md](references/setup-core.md).
   - Arithmetic, compare, format, static helpers: [arithmetic-api.md](references/arithmetic-api.md).
   - `set`/`config`/`clone`, rounding modes, modulo: [config-rounding.md](references/config-rounding.md).
   - Money, JSON/SSR/store transport: [money-serialization.md](references/money-serialization.md).
   - Trig, random/crypto, light vs full, MikeMcl ecosystem: [advanced-ecosystem.md](references/advanced-ecosystem.md).
   - Anti-patterns and upgrades: [pitfalls.md](references/pitfalls.md).
4. Match the project's constructor style (`Decimal` vs domain `clone`). Do not call global `Decimal.set` inside published libraries.
5. Verify with typecheck plus tests for string construction, rounding mode, `toDP`/`toFixed`, and serialization round-trips.

## Library Decision Tree

```
Need trig / ln / exp / non-integer pow / wide exponents?
  → decimal.js (this skill)

Exact add/mul until division, finance-first, smaller API?
  → consider bignumber.js (author guidance) — or stay on decimal.js with Money clone + toDP

Tiny bundle, basic DP only?
  → big.js or decimal.js-light

Using decimal.js for money anyway?
  → Decimal.clone({ precision: 28, rounding: … }) + construct from strings + round once with toDP/toFixed
```

## Core Judgment

- **Construct from strings (or BigInt / Decimal)** for money and multi-digit values. Never `new Decimal(0.1 + 0.2)` or Number arithmetic first.
- Instances are **immutable**. Chain methods; do not expect in-place mutation.
- **`precision` = significant digits** for (almost) all arithmetic results — not currency decimal places. Use **`toDecimalPlaces` / `toDP`** (or `toFixed` for strings) for fixed fractional places.
- Prefer **`Decimal.clone({…})`** for libraries and multi-domain apps. Use `Decimal.set` only for app-wide boot config.
- Value equality: **`.eq` / `.cmp`**, never `===` / `==`.
- Serialize as **strings** (`toJSON` / `toFixed` / `toString`). Avoid `toNumber()` for money or persisted values.
- Default rounding is **`ROUND_HALF_UP` (4)**. Pick explicitly for finance (`HALF_UP` / `HALF_EVEN` / jurisdiction rules).
- Configure via **`set`/`config`/`clone`** — never assign `Decimal.precision = …` directly (skips validation).

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls decimal.js` (and light / big / bignumber if migrating).
- Typecheck for `Decimal.Value`, `Decimal.Config`, clone constructors.
- Tests: string vs number construction, `eq` vs `===`, `toDP`/`toFixed` rounding modes, penny-allocation / tax edges, JSON hydrate (`new Decimal(dto.amount)`), signed zero if relevant.
- Bundle/size check only when choosing light vs full.

Report which checks ran, which did not, and version/config assumptions that remain.
