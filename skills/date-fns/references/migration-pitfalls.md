# Migration and Anti-Patterns

## Version Map

| From → To | What changes |
| --- | --- |
| v2 → v3 | Named exports; dual ESM/CJS; flat paths; **strings as args restored**; runtime arg checks removed; intervals normalize instead of throw; rounding default `trunc`; IE/Flow gone; constants leave main index; Date extensions supported |
| v3 → v4 | ESM-first; first-class TZ via **`@date-fns/tz`** / **`@date-fns/utc`**; `{ in }` context; mixing Date/extensions normalized; types rewritten; format gains TZ context (v4.1+); CDN moves to `@date-fns/cdn` (v4.4+) |
| `date-fns-tz` → official | Helper/fake-local model → **Date subclasses** + `transpose` + `{ in }` |

## Import Migrations

```ts
// v2
import addDays from "date-fns/addDays";

// v3+
import { addDays } from "date-fns/addDays";
import { addDays } from "date-fns";
```

```ts
// v2/v3 habit
import { daysInYear } from "date-fns"; // ❌ gone from main

// v3+
import { daysInYear } from "date-fns/constants";
```

## `date-fns-tz` → `@date-fns/tz` + date-fns v4

| Legacy | Official |
| --- | --- |
| `formatInTimeZone(date, zone, fmt)` | `format(new TZDate(date, zone), fmt)` or `format(date, fmt, { in: tz(zone) })` |
| `toZonedTime(utc, zone)` | `transpose(new TZDateMini(utc, zone), Date)` — **not** `new TZDate(utc, zone)` alone |
| `fromZonedTime(local, zone)` | `transpose(localAsDate, tz(zone))` or `new TZDate(y,m,d,h,…, zone)` |
| Offset helpers in **ms**, Date-like sign | `tzOffset` in **minutes**, IANA sign |
| Extended `z` tokens on forked format | `format` on `TZDate` + `tzName` |
| Returns plain `Date` with shifted digits | Returns `TZDate` carrying `timeZone` |

Conceptual shift: legacy keeps a plain `Date` and fakes local components; official attaches a real zone to getters/setters.

For **date-fns v3** projects that cannot upgrade yet, keep `date-fns-tz`. Official docs point there only for pre-v4.

## Anti-Patterns Checklist

1. **Moment tokens** (`YYYY-MM-DD`, `D` for day-of-month) — use Unicode `yyyy-MM-dd` / `d`.
2. **Assuming date-fns is UTC** — core is system-local.
3. **`new Date("2024-01-15")` for business date-only** — prefer `parseISO` or explicit `TZDate`/`UTCDate` construction.
4. **`format` without `isValid`** — throws on Invalid Date.
5. **Default imports from subpaths** on v3+.
6. **Constants from `"date-fns"`** — use `"date-fns/constants"`.
7. **Bundling all locales** or full CDN builds in apps.
8. **Mixing FP and main APIs** without reversing args.
9. **Expecting `eachDayOfInterval` to honor `weekStartsOn`**.
10. **Relying on interval order throwing** — v3+ normalizes.
11. **`formatISODuration` with weeks** — weeks ignored.
12. **Mixing zones without `{ in }`** — silent off-by-one day bugs from argument order.
13. **Treating `date-fns-tz` and `@date-fns/tz` as the same package**.
14. **`new TZDate(iso, zone)` as `toZonedTime`** — use `transpose` for wall remap.
15. **`new TZDate("America/New_York")`** — Invalid Date; use `TZDate.tz("…")`.
16. **`TZDateMini`/`UTCDateMini` + `toString` in SSR** — system-zone leak.
17. **`differenceInDays` when calendar days are intended** (or vice versa).
18. **Unprotected `Y`/`D` tokens** without additional options.
19. **CJS barrel `require("date-fns")` for tree-shaking**.
20. **Using `{ in: utc }` / `tz()` on date-fns v3** — upgrade to v4.
21. **Fall-back ambiguous hours without a policy** — host-dependent (tz#40).
22. **Copying CHANGELOG typo** `import { tz } from "@date-fns/utc"` — export is **`utc`**.

## Upgrade Procedure (Suggested)

1. Confirm current majors: `bun pm ls date-fns date-fns-tz @date-fns/tz @date-fns/utc`.
2. Upgrade `date-fns` to ^4; fix named imports / constants / types.
3. Replace `date-fns-tz` call sites one pattern at a time (`formatInTimeZone`, then to/fromZonedTime → `transpose`, then offsets → `tzOffset`).
4. Add `@date-fns/tz` and/or `@date-fns/utc` only where zone intent is clear.
5. Pin `{ in }` at shared helpers (startOfDay, isSameDay, business days) used across SSR or multi-zone users.
6. Add tests for Unicode tokens, Invalid Date, DST edges, and hydration-sensitive “today” paths.
