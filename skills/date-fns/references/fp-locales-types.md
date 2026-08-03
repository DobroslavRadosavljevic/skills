# FP, Locales, and TypeScript

## FP Mode (`date-fns/fp`)

```ts
import { addYears, formatWithOptions } from "date-fns/fp";
import { eo } from "date-fns/locale";

const addFiveYears = addYears(5);
const dateToString = formatWithOptions({ locale: eo }, "d MMMM yyyy");

dateToString(addFiveYears(new Date(2014, 8, 1)));
```

Rules:

- **Data-last / curried:** `addDays(10)(date)` or `addDays(10, date)` — reversed vs main API `addDays(date, 10)`.
- Options variants: `formatWithOptions`, `parseWithOptions`, … — **options first**.
- Composes with lodash/fp-style `flow` / `compose`.
- Same tree-shaking: one module per function.
- Do not mix FP and main APIs casually without reversing the arity mental model.

## Locales

```ts
import { format, formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
// Prefer specific path when optimizing:
import { de } from "date-fns/locale/de";

format(date, "PPPP", { locale: fr });
formatDistance(a, b, { locale: de, addSuffix: true });
```

- Fallback for `format`: `options.locale` → `getDefaultOptions().locale` → **en-US**.
- Locale objects may carry `weekStartsOn` / `firstWeekContainsDate`.
- App-level wrapper (`formatDate(date, "PP")` with selected locale) is encouraged.
- Do not bundle every locale from `"date-fns/locale"` in client apps.

Common locale-aware APIs: `format`, `formatDistance`, `formatDistanceStrict`, `formatRelative`, `formatDuration` (check function options for `locale`).

## TypeScript

- First-class types; each function exports `*Options` interfaces.
- Core: `DateArg<DateType> = DateType | number | string`.
- Generics track input class (`Date` / `TZDate` / `UTCDate`) and result type (often from `in` context).
- Useful shared types: `Interval`, `Duration`, `RoundingMethod`, `ContextOptions` (`in`).
- Passing custom Date subclasses preserves types when the construct-from protocol is implemented.
- v4 rewrote generics again — expect type-only breakages on upgrade; run `tsc`.
- Prefer named imports for correct dual-package type resolution (`.d.ts` / `.d.cts`).

```ts
import { addDays } from "date-fns";
import { TZDate } from "@date-fns/tz";

const sg: TZDate = new TZDate(2024, 0, 1, "Asia/Singapore");
const next = addDays(sg, 1); // stays TZDate in well-typed v4 setups
```

## Constants

```ts
import {
  daysInYear,
  millisecondsInDay,
  maxTime,
  minTime,
} from "date-fns/constants";
```

Never import constants from `"date-fns"` main (removed from index in v3).
