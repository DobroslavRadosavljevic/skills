# Time Zones: `@date-fns/tz` and `@date-fns/utc`

Official date-fns **v4+** path. Do not confuse with third-party `date-fns-tz`.

## Decision Matrix

| Need | Package / type |
| --- | --- |
| Host-local UI only | Plain `Date` + date-fns |
| UTC calendar math, charts, server-normalized days | `@date-fns/utc` → `UTCDate` / `UTCDateMini` / `{ in: utc }` |
| Named IANA zone or multi-zone product | `@date-fns/tz` → `TZDate` / `TZDateMini` / `{ in: tz("…") }` |
| Same wall clock, different zone (legacy to/fromZonedTime) | `transpose` from date-fns |
| Same instant, different zone display | `tzDate.withTimeZone("…")` or `new TZDate(instant, zone)` |
| Library public API / debug strings | Full `UTCDate` / `TZDate` (not Mini) |
| Size-sensitive internals | `UTCDateMini` (~239 B) / `TZDateMini` |

`TZDate(..., "UTC")` works but `@date-fns/utc` is the lighter purpose-built path.

## Install

```bash
bun add @date-fns/tz
bun add @date-fns/utc
# typically with:
bun add date-fns@^4
```

## Two Interop Patterns

### A. Pass extension instances

```ts
import { addDays, format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";

const sg = new TZDate(2024, 2, 13, "Asia/Singapore");
const next = addDays(sg, 1); // TZDate, same timeZone

const utcDay = new UTCDate(2024, 2, 13);
format(utcDay, "yyyy-MM-dd"); // UTC calendar fields
```

date-fns preserves the class/zone via `Symbol.for("constructDateFrom")`.

### B. Force context with `{ in }`

```ts
import { isSameDay, addDays, parse, format } from "date-fns";
import { tz } from "@date-fns/tz";
import { utc } from "@date-fns/utc";

isSameDay(a, b, { in: tz("Europe/Prague") });
addDays(date, 1, { in: tz("Asia/Singapore") });
format(ms, "H:mm:ss", { in: utc });
parse("2023-03-12 02:00", "yyyy-MM-dd HH:mm", new Date(), {
  in: tz("America/New_York"),
});
```

Use `{ in }` when inputs are primitives/strings or you must ignore argument-order zone selection.

**Normalization rule:** without `in`, the **first object** `Date`/extension argument is the reference type/zone. Mixing Singapore and New York `TZDate`s can flip `differenceInBusinessDays` by reversing args — pin `in` when unsure.

## `@date-fns/tz`

### Construction

```ts
import { TZDate, TZDateMini } from "@date-fns/tz";

new TZDate(2024, 2, 13, "Asia/Singapore");
new TZDate("2024-03-13T14:30:00Z", "America/New_York");
new TZDate(timestamp, "Europe/London");
new TZDate(2022, 2, 13, "+08:00");

// Zone first — required for “now in zone”
TZDate.tz("Asia/Singapore");
TZDate.tz("Asia/Singapore", 2024, 2, 13);
```

**Anti-pattern:** `new TZDate("Asia/Singapore")` → Invalid Date (string parsed as date).

Zones: IANA names or UTC offsets. Relies on **`Intl`** (no bundled IANA DB). Hermes/React Native may need Format.JS Intl polyfills.

### Mini vs Full

| | `TZDateMini` | `TZDate` |
| --- | --- | --- |
| Getters/setters in zone | Yes | Yes (extends Mini) |
| `toString` / `toLocale*` in zone | **No** (inherits system) | **Yes** |
| Prefer for | Internal / size | Library APIs / logs |

### Helpers

| Export | Role |
| --- | --- |
| `tz(zone)` | Context factory for `{ in: … }` |
| `withTimeZone(zone)` | Instance: same instant, new zone |
| `tzOffset(zone, date)` | Offset **minutes**, IANA sign (`Asia/Singapore` → `+480`). **Opposite sign** vs `Date#getTimezoneOffset` |
| `tzScan(zone, { start, end })` | DST transitions `{ date, change, offset }[]` |
| `tzName(zone, date, style?)` | Human label (`short` / `long` / …) |

There is **no** `withDate` helper — use `tz`, `withTimeZone`, or `transpose`.

## `@date-fns/utc`

```ts
import { UTCDate, UTCDateMini, utc } from "@date-fns/utc";
// Tree-shake Mini:
import { UTCDateMini } from "@date-fns/utc/date/mini";
```

| Call | Behavior |
| --- | --- |
| `new UTCDate()` / `UTCDateMini()` | `Date.now()` |
| `new UTCDate(timestamp)` | Absolute ms |
| `new UTCDate(string)` | `+new Date(string)` (native parse quirks) |
| `new UTCDate(y, m, d, …)` | **`Date.UTC(...)`** — components are UTC wall time |

```ts
new Date(2024, 0, 1); // local midnight
new UTCDate(2024, 0, 1); // UTC midnight
```

- Getters remapped: `getHours()` ≡ UTC hours; `getTimezoneOffset()` → `0`.
- Prefer **`UTCDateMini` internally**; **`UTCDate`** when `toString`/`toLocale*` must stay UTC.
- Context helper is **`utc`**, not `tz` (ignore any changelog typo saying `tz` from `@date-fns/utc`).

## `transpose` (Wall Clock Remap)

Official successor to `date-fns-tz` `toZonedTime` / `fromZonedTime`.

```ts
import { transpose } from "date-fns";
import { tz, TZDateMini } from "@date-fns/tz";
import { utc } from "@date-fns/utc";

// Same Y-M-D h:m:s digits, different zone/instant
const la = transpose(systemLocalDate, tz("America/Los_Angeles"));
const back = transpose(la, Date);

// Same instant in a zone ≠ wall transpose
new TZDate(isoInstant, zone); // interpret/calculate in zone
transpose(new TZDateMini(isoInstant, zone), Date); // legacy toZonedTime shape
```

**Critical:** `TZDate` attaches a zone to an instant. Transposition **fakes** wall-clock digits across zones. Confusing them is the #1 migration bug from `date-fns-tz`.

## DST Behavior

- **Spring-forward (gap):** nonexistent local times typically map forward to the post-gap occurrence (constructor/`parse` with `{ in }`).
- **Fall-back (overlap):** ambiguous hour behavior can be **host-dependent** (open issue date-fns/tz#40). Prefer unambiguous UTC instants or an explicit policy; validate with `tzOffset` / `tzScan` when needed.
- Non-DST zones (e.g. `Asia/Singapore`) avoid host DST distortion for hour arithmetic when using `TZDate`.

## SSR / Hydration

| Pattern | Result |
| --- | --- |
| `startOfDay(new Date())` on server (UTC) vs client (local) | Different calendar days → hydration bugs |
| `startOfDay(new UTCDate())` / `{ in: utc }` | Consistent **UTC** day — only correct if product wants UTC |
| User-local SSR | Capture client TZ (cookie/header) + `@date-fns/tz`, or defer local formatting to client |

Serialization:

- `toISOString()` / `toJSON()` → UTC `Z` (usually safe for transport).
- Mini `toString()` → **system-dependent** — SSR risk.
- Full `UTCDate`/`TZDate` `toString()` → zone-stable.

## React Native / Incomplete Intl

- Prefer modern Node/browsers with full `Intl.DateTimeFormat` TZ support.
- Hermes: Format.JS `intl-datetimeformat` + timezone data polyfills at app entry (needed from `@date-fns/tz` ≥ 1.3.0 era).
- Offset-only zones can work when IANA data is weak.

## Usage Cheat Sheet

```ts
// Format instant in a zone
format(new TZDate(instant, "America/New_York"), "yyyy-MM-dd HH:mm");

// Same instant, different zone
new TZDate(instant, "Asia/Tokyo").withTimeZone("Europe/Berlin");

// Wall components mean that zone
new TZDate(2024, 5, 15, 9, 0, 0, "America/Chicago");

// Forced context
addDays(someDate, 1, { in: tz("Pacific/Auckland") });
isSameDay(a, b, { in: utc });

// Inspect DST
tzScan("America/New_York", { start, end });
tzOffset("America/New_York", date);
```
