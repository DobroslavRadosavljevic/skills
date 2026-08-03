# Formatting and Parsing

## Format Family

| API | Use when |
| --- | --- |
| `format` / `formatDate` | Unicode token formatting (throws on Invalid Date) |
| `lightFormat` | Smaller token subset, less weight |
| `formatISO` | ISO 8601 in **local** zone (`Z` only when offset is 0) |
| `formatISO9075` | SQL-ish ISO |
| `formatRFC3339` / `formatRFC7231` | RFC outputs |
| `formatDistance` / `formatDistanceStrict` | Fuzzy or exact relative phrases |
| `formatDistanceToNow` / `…Strict` | Relative to now |
| `formatRelative` | Relative to a base date |
| `formatDuration` | Humanize a `Duration` object |
| `formatISODuration` | `P1Y2M…` — **ignores `weeks`**; missing fields → `0` |
| `intlFormat` / `intlFormatDistance` | Intl-backed alternatives |

```ts
import { format, formatISO, formatDistanceToNow, isValid } from "date-fns";
import { enGB } from "date-fns/locale";

if (!isValid(date)) throw new Error("bad date");

format(date, "yyyy-MM-dd HH:mm");
format(date, "PPPP", { locale: enGB });
formatISO(date, { representation: "date" });
formatDistanceToNow(date, { addSuffix: true });
```

Locale shorthand patterns: `P`/`PP`/`PPP`/`PPPP` and time `p`/`pp`… expand per locale.

## Unicode Tokens (Critical)

date-fns uses **Unicode tokens**, not Moment tokens.

| Want | Use | Do **not** use |
| --- | --- | --- |
| Calendar year | `y` / `yy` / `yyyy` | `Y` / `YY` / `YYYY` (week-numbering year) |
| Day of month | `d` / `dd` | `D` / `DD` (day of year) |

```ts
// ❌ Moment habit — wrong year / day-of-year
format(date, "YYYY-MM-DD");

// ✅
format(date, "yyyy-MM-dd");
```

To use `D`/`DD` or `Y`/`YY`/`YYYY` intentionally, pass:

- `useAdditionalDayOfYearTokens: true`
- `useAdditionalWeekYearTokens: true`

Without those options, format/parse protect against the common mistake.

## Parsing

| API | Role | Gotchas |
| --- | --- | --- |
| `parse(str, formatStr, referenceDate, options?)` | Custom formats | Needs **referenceDate**; leftover non-whitespace → Invalid Date |
| `parseISO(str, options?)` | ISO 8601 | Date-only → **local** midnight; offsets/`Z` honored |
| `parseJSON(value)` | JSON date / Date / number | Number = timestamp; else Invalid Date |
| `isMatch` | String matches format? | |
| `isExists` | y/m/d exists on calendar? | |

```ts
import { parse, parseISO, isValid } from "date-fns";

parse("11.02.87", "d.MM.yy", new Date());
parseISO("2014-02-11"); // local midnight
parseISO("2014-10-25T06:46:20Z"); // absolute instant

parse("31", "d", new Date(2012, 1, 1), { strictValidation: true });
// Invalid Date under strictValidation (Feb 31)
```

Always follow parse with `isValid` before formatting or persisting.

## Machine vs Human Output

- **Human UI:** `format`, `formatDistance*`, `formatRelative` + locale.
- **Wire/API:** prefer ISO with explicit offset or `Z`; be intentional about `formatISO` (local) vs UTC via `{ in: utc }` / `UTCDate`.
- **SQL date-only columns:** store calendar intent explicitly (UTC date, venue TZ date, or plain `yyyy-MM-dd` string) — do not round-trip through ambiguous local midnights.

## Formatting in a Time Zone

```ts
import { format } from "date-fns";
import { TZDate, tz, tzName } from "@date-fns/tz";
import { utc } from "@date-fns/utc";

format(new TZDate(instant, "America/New_York"), "yyyy-MM-dd HH:mm zzzz");
format(instant, "HH:mm:ss", { in: utc });
format(instant, "PPPP", { in: tz("Asia/Tokyo") });

tzName("America/New_York", instant, "short"); // e.g. "EST"
```

See [timezones.md](timezones.md) for `TZDate` vs `transpose` vs `{ in }`.
