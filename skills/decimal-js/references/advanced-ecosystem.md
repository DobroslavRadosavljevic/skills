# Advanced Math and Ecosystem

## Trig and transcendental functions

decimal.js includes static + instance:

- Trig: `sin`/`sine`, `cos`/`cosine`, `tan`/`tangent`, `asin`, `acos`, `atan`, **`atan2(y, x)`** (static)
- Hyperbolic: `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`
- Other: `exp`, `ln`, `log` / `log2` / `log10`, `pow`, `sqrt`, `cbrt`, `hypot`

All round to `precision`. Internal **Pi ≈ 1025 digits** → practical trig results up to ~**1000 − argument precision** digits. Extend `PI` in source only if you truly need more.

```ts
Decimal.set({ precision: 40 });
Decimal.acos(-1); // π
Decimal.atan2(y, x);
```

`log` default base is **10**. Use `ln` for natural log.

## Random and crypto

```ts
Decimal.set({ precision: 10, crypto: false });
Decimal.random(); // [0, 1), ~precision decimal places
Decimal.random(20);

// Node — expose Web Crypto / node crypto before enabling:
// globalThis.crypto = require("crypto"); // or webcrypto
Decimal.set({ crypto: true }); // getRandomValues / randomBytes
```

If `crypto: true` but unavailable → **throws**. Default `false` uses `Math.random`.

## decimal.js vs decimal.js-light

| | **decimal.js** | **decimal.js-light** |
| --- | --- | --- |
| Size | Larger | Smaller (~12.7 KB min historically) |
| Trig / hyperbolics | Yes | No |
| NaN / Infinity / `-0` | Yes | No |
| Other bases | Yes | No |
| Arithmetic vs precision | **Rounded** to precision | **Truncated** at precision |
| `rounding` | Ops + formatters | Mainly `toDP`/`toFixed`/formatters |
| Prefer when | Science, full API, specials | Bundle-sensitive basic decimals |

```ts
// full: rounded
x.div(y); // '0.66666666666666666667'
// light: truncated unless toDP
x.div(y); // '0.66666666666666666666'
```

Light instance `e` is base-1e7 — use `.exponent()` for base-10 when needed.

## MikeMcl ecosystem

| Library | Precision model | Best fit |
| --- | --- | --- |
| **decimal.js** | Significant digits; **all ops** rounded | Science, trig, wide exponents |
| **bignumber.js** | Decimal-place oriented; precision mainly on division | **Finance** (author guidance) |
| **big.js** | Smallest; simple DP | Tiny footprint helpers |
| **decimal.js-light** | Sig digits; truncated ops | Lighter decimal.js-like API |

```
Need trig / ln / exp / non-int pow / extreme range?
  → decimal.js

Need exact add/mul until divide (classic money)?
  → bignumber.js (or decimal.js with Money clone + toDP)

Need smallest bundle?
  → big.js or decimal.js-light
```

## Performance — when not to use decimal.js

Avoid or reconsider when:

- Hot loops of millions of ops where IEEE float error is acceptable
- Integer-only within `BigInt` / safe integer range → native `BigInt`
- Bundle-critical and only DP-on-division is needed → big.js / bignumber.js
- Extreme non-integer `pow` at huge precision (docs warn adequacy/speed)
- Trig far beyond Pi budget without extending constants
- `precision` set far above what the domain needs (cost scales with digits)

Use decimal.js when decimal correctness, scientific functions, extreme magnitudes, or consistent significant-digit rounding matter more than raw throughput.
