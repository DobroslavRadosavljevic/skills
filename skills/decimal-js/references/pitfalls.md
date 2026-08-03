# Pitfalls and Migration Notes

## Anti-patterns checklist

1. **`new Decimal(0.1 + 0.2)`** / Number math before wrap — precision already lost.
2. **`new Decimal(19.99)` habit for money** — use `'19.99'` (or BigInt for integer minors).
3. **Expecting mutation** — API is immutable; reassign / chain.
4. **`===` / `==` for values** — use `.eq` / `.cmp`.
5. **`toNumber()` for money or DB/JSON** — transport strings.
6. **Assuming `toString` is always fixed-point** — exp at `toExpNeg`/`toExpPos`; use `toFixed` for currency.
7. **Relying on `precision` alone for cents** — significant digits ≠ decimal places; finish with `toDP`/`toFixed`.
8. **Global `Decimal.set` inside a library** — contaminates consumers; use `clone`.
9. **`Decimal.precision = n` direct assignment** — skips validation.
10. **Confusing with bignumber.js** — that library does not round every op to significant digits the same way.
11. **Assuming light and full round identically** — light truncates arithmetic.
12. **`log` as natural log** — default base 10; use `ln`.
13. **Expecting trailing zeros on Decimal values** — stripped; use formatters for display zeros.
14. **`crypto: true` without global crypto in Node** — throws.
15. **Trig at ≫1000 digit precision** without extending Pi.
16. **Map/Set keyed by Decimal objects** — use canonical strings.
17. **Hiding `-0` via `toString` then needing sign** — use `valueOf`/`toJSON`/`isNegative`.
18. **Mixing clone configs accidentally** — results follow the **receiver** constructor.

## Division and specials (no throw)

| Op | Result |
| --- | --- |
| `1 / 0` | `Infinity` |
| `0 / 0` | `NaN` |
| `-1.sqrt()` | `NaN` |
| `0.ln()` | `-Infinity` |
| underflow (`minE`) | `0` |
| overflow (`maxE`) | `Infinity` |

Invalid **constructor** values throw `[DecimalError]`.

## Recent version notes (v10)

| Version | Notes |
| --- | --- |
| 10.3.0 | Underscores, `clamp`, `sum`, cross-origin Decimals |
| 10.4.0 | `package.json` `exports` |
| 10.5.0 | **BigInt**; construct without `new`; max/min −0 fixes |
| 10.6.0 | BigInt in **TypeScript** definitions |

v9 → v10 was a soft break (`toNearest` rounding, TS packaging). Target **v10 API** in new code.

Historical: v5 added trig and replaced `constructor` with `clone`; v6 removed base-88 JSON; v7 added `config` alias and defaulted `crypto: false`.

## Migration between MikeMcl libraries

| From → To | Focus |
| --- | --- |
| Number/`parseFloat` money → decimal.js | String construction; Money `clone`; `toDP`/`toFixed` |
| bignumber.js → decimal.js | Significant-digit rounding on **all** ops; raise precision + explicit `toDP` |
| decimal.js → bignumber.js | Different precision model; audit every intermediate round |
| decimal.js → light | Lose trig/NaN/∞/`-0`/bases; arithmetic becomes truncate-at-precision |
| light → decimal.js | Enable rounded ops; verify previous truncate assumptions |

## Suggested verification after changes

1. `bun pm ls decimal.js`
2. Grep for `new Decimal([0-9]` number literals in money paths → convert to strings.
3. Grep for `Decimal.set` in library packages → convert to `clone`.
4. Grep for `.toNumber(` / `Number(` on Decimal → replace with string transport.
5. Unit tests for tax/`toDP` modes, split-penny allocation, and JSON hydrate.
