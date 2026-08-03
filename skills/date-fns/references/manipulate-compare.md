# Manipulate, Compare, Intervals

## Add / Sub / Set

Unit helpers: `addDays`, `addMonths`, `addYears`, `addHours`, `addMinutes`, `addSeconds`, `addWeeks`, `addQuarters`, `addBusinessDays`, `addISOWeekYears`, and matching `sub*`.

```ts
import { add, addDays, subMonths, set } from "date-fns";

addDays(date, 7);
subMonths(date, 1);
add(date, { days: 2, hours: 3 });
set(date, { hours: 9, minutes: 0, seconds: 0 });
```

- `subX` typically delegates to `addX(-amount)`.
- Day/month arithmetic uses calendar methods of the active zone context (local / UTC / TZ).
- Hour adds on plain `Date` follow **host DST** (e.g. spring-forward can skip an hour). Use `UTCDate` / `TZDate` when that is wrong for the product.

## Boundaries and Rounding

- `startOfDay|Week|Month|Quarter|Year|ISOWeek|…`
- `endOf…` → typically `23:59:59.999` for day-like units
- `startOfWeek` default `weekStartsOn: 0` (Sunday); override via options, locale, or `setDefaultOptions`
- `roundToNearestMinutes` / `roundToNearestHours`

## Comparison

| Family | APIs | Notes |
| --- | --- | --- |
| Ordering | `isBefore`, `isAfter`, `isEqual` | Timestamp compare |
| Same unit | `isSameSecond|Minute|Hour|Day|Week|Month|…` | Calendar equality in context zone |
| Relative to now | `isPast`, `isFuture`, `isThisWeek`, … | |
| Sort | `compareAsc`, `compareDesc` | `-1` / `0` / `1` |
| Interval | `isWithinInterval` | Inclusive; **normalizes** start/end order (v3+) |

## Differences: Elapsed vs Calendar

```ts
import {
  differenceInDays,
  differenceInCalendarDays,
  differenceInHours,
} from "date-fns";

differenceInDays(a, b); // full elapsed days (default rounding: trunc)
differenceInCalendarDays(a, b); // calendar day boundaries
differenceInHours(a, b, { roundingMethod: "round" });
```

| Intent | Prefer |
| --- | --- |
| “How many midnights between?” / booking nights | `differenceInCalendar*` |
| “How many full 24h periods elapsed?” | `differenceIn*` |
| Business days | `differenceInBusinessDays` (zone-sensitive — pin `{ in }`) |

Rounding methods: `"ceil" | "floor" | "round" | "trunc"` (default **`trunc`** since v3).

## Duration and Interval Types

```ts
interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  // no milliseconds field
}

interface Interval {
  start: Date | number | string;
  end: Date | number | string;
}
```

Key APIs:

- `interval(interval)` — validate helper
- `areIntervalsOverlapping(a, b, { inclusive? })`
- `getOverlappingDaysInIntervals`
- `clamp(date, interval)`
- `intervalToDuration` — skips zero fields (v3+); negative intervals → negative duration; invalid → `{}`
- `milliseconds(duration)` — approximate (years/months use constants)
- `eachDayOfInterval` / `eachHourOfInterval` / `eachMinuteOfInterval` / `eachWeekOfInterval` / `eachMonthOfInterval` / `eachQuarterOfInterval` / `eachYearOfInterval` / weekend variants

```ts
import { eachDayOfInterval, intervalToDuration } from "date-fns";

eachDayOfInterval({ start, end }, { step: 1 });
// Reversed interval → reversed array (v3+), does not throw
// eachDayOfInterval does NOT take weekStartsOn — pre-bound with startOfWeek if needed
```

## Misc Helpers

- `min` / `max` / `closestTo` / `closestIndexTo`
- `fromUnixTime` / `getUnixTime` / `getTime`
- Unit converters: `hoursToMinutes`, `yearsToDays`, …
- `transpose(date, constructorOrContext)` — wall-clock remapping across zones (see [timezones.md](timezones.md))

## Zone-Sensitive Math Checklist

When day/week boundaries matter across servers or users:

1. Decide zone (local / UTC / IANA).
2. Use `UTCDate`/`TZDate` **or** `{ in: utc }` / `{ in: tz("…") }`.
3. Do not rely on argument order when mixing extension types — pin `in`.
4. Test DST edges for the chosen zone (spring-forward gap, fall-back overlap).
