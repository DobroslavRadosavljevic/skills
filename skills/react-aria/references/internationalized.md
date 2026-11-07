# Internationalization: dates, numbers, strings, and locale hooks

Versions: `@internationalized/date` 3.12.4, `@internationalized/number` 3.6.9, `@internationalized/string` 3.2.10, `@internationalized/message` 3.1.10, `@internationalized/string-compiler` 3.4.1, `react-aria` 3.53.1.

Lines marked "Tested" were run against the installed packages. Docs pages: `https://react-aria.adobe.com/internationalized/date`, `https://react-aria.adobe.com/internationalized/number` (`/index.md` gives Markdown), and `https://react-aria.adobe.com/useLocale`.

## Contents

1. [Which package to use](#which-package-to-use)
2. [ISO strings at API boundaries](#iso-strings-at-api-boundaries)
3. [Date objects](#date-objects)
4. [All exports of @internationalized/date](#all-exports-of-internationalizeddate)
5. [Parsing and creating](#parsing-and-creating)
6. [Manipulation](#manipulation)
7. [Time zones and DST](#time-zones-and-dst)
8. [Conversion, including native Date](#conversion-including-native-date)
9. [Queries](#queries)
10. [Calendars and eras](#calendars-and-eras)
11. [DateFormatter](#dateformatter)
12. [NumberFormatter and NumberParser](#numberformatter-and-numberparser)
13. [Localized strings](#localized-strings)
14. [React i18n layer](#react-i18n-layer)
15. [Supported locales and bundles](#supported-locales-and-bundles)
16. [RTL and number field notes](#rtl-and-number-field-notes)
17. [Docs and types disagreements](#docs-and-types-disagreements)

## Which package to use

| Need | Use | Why |
| ---- | --- | --- |
| Value of `DatePicker`, `DateField`, `TimeField`, `Calendar`, `RangeCalendar`, `DateRangePicker` | `@internationalized/date` objects | These components accept and emit only these objects. A native `Date` or a string fails. |
| Birthday, all-day event, due date | `CalendarDate` | No time and no zone, so no off-by-one-day bug. |
| Wall-clock time that is the same everywhere | `CalendarDateTime` | No zone. |
| Clock time only | `Time` | No date. |
| Exact moment at a place (meeting, reminder) | `ZonedDateTime` | Handles DST with explicit rules. |
| Non-Gregorian calendars, locale week rules | `@internationalized/date` | `date-fns` and `Date` do not model these calendars. |
| Date math in existing server or non-UI code | Keep `date-fns` or `Date` | Convert only at the UI edge. Do not mix the two models inside one module. |
| Show a date to a user | `useDateFormatter` in React, `DateFormatter` outside React | Follows `I18nProvider`. |
| Show a number, currency, or unit | `useNumberFormatter` in React, `NumberFormatter` outside React | Follows `I18nProvider`. |
| Parse user-typed localized numbers | `NumberParser` | `parseFloat` handles only Latin digits and US decimals. |
| Number input UI | `NumberField` with `formatOptions` | Uses the parser for you. |
| App UI strings | Your i18n library first. `useLocalizedStringFormatter` fits component libraries that ship their own strings | See [Localized strings](#localized-strings). |
| Filter or sort strings for a locale | `useFilter`, `useCollator` | Ignores case and diacritics by locale rules. |

Rule for a mixed codebase: store and send ISO strings. Parse them into these objects only for React Aria components. Convert to `Date` only when a function needs it (for example `date-fns` or `DateFormatter`).

```tsx
// no-check: date-fns is your own dependency, not part of these packages.
import {format} from 'date-fns';
import {getLocalTimeZone, parseDate} from '@internationalized/date';

// CalendarDate to date-fns: make a Date at local midnight in the zone date-fns will use.
let forDateFns = parseDate('2022-02-03').toDate(getLocalTimeZone());

// date-fns to CalendarDate: format the local fields, do not call toISOString().
let backToCalendarDate = parseDate(format(new Date(), 'yyyy-MM-dd'));
```

Do not use `date.toISOString().slice(0, 10)` for a date-only value. It reads the UTC day, which can differ from the local day. Do not use `new Date('2022-02-03')` for a date-only value. JavaScript reads it as UTC midnight.

## ISO strings at API boundaries

| Meaning | Wire format | Parse | Serialize |
| ------- | ----------- | ----- | --------- |
| Date only | `2022-02-03` | `parseDate(s)` | `date.toString()` |
| Local date and time | `2022-02-03T09:45:00` | `parseDateTime(s)` | `dateTime.toString()` |
| Time only | `09:45:00` | `parseTime(s)` | `time.toString()` |
| Instant | `2022-02-03T20:24:45.000Z` or `...-08:00` | `parseAbsolute(s, zone)`, `parseAbsoluteToLocal(s)` | `zoned.toAbsoluteString()` |
| Instant plus the user's zone | `2022-02-03T12:24:45-08:00[America/Los_Angeles]` | `parseZonedDateTime(s)` | `zoned.toString()` |
| Duration | `P3Y6M6W4DT12H30M5S` | `parseDuration(s)` | No serializer exported |
| Epoch milliseconds | `1688023843144` | `fromAbsolute(ms, zone)` | `zoned.toDate().getTime()` |
| Native `Date` | Object | `fromDate(d, zone)`, `fromDateToLocal(d)` | `date.toDate(zone)`, `zoned.toDate()` |

Choose by what must survive:

- Use the absolute form when only the exact instant matters.
- Use the zoned form when the local time and place matter (calendar events, reminders). It stays correct when DST rules change.

Tested parser behavior:

- Every `parse*` function throws on bad input. Wrap untrusted input in `try`/`catch`.
- `parseDate('2022-02-30')` throws a range error. `parseDate('2022-02-03T10:00')` throws.
- `parseDateTime('2022-02-03')` works and gives midnight. `parseDateTime('2022-02-03T10:00:00Z')` throws and tells you to use `parseAbsolute`.
- `parseAbsolute('2021-11-07T07:45:00', 'UTC')` throws because the offset is missing.
- `parseZonedDateTime('2021-11-07T07:45:00Z')` throws because the `[Zone]` part is missing.
- `parseAbsolute(new Date().toISOString(), zone)` works.
- `parseAbsolute('2022-02-03 12:00:00+00', 'UTC')` throws. Postgres text output with a space must be normalized first: `new Date(s).toISOString()`.
- `toString()` on a non-Gregorian date prints the Gregorian date. `new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30).toString()` is `2019-04-30`. `parseDate` returns Gregorian. Store the calendar identifier separately and call `toCalendar` after parsing if you must restore it.

Form boundary pattern:

```tsx
import {useState} from 'react';
import {DatePicker, type DatePickerProps} from 'react-aria-components/DatePicker';
import {parseDate, type CalendarDate} from '@internationalized/date';

function DueDate({iso, onSave}: {iso: string | null; onSave: (iso: string | null) => void}) {
  let [value, setValue] = useState<CalendarDate | null>(iso ? parseDate(iso) : null);
  let handleChange: DatePickerProps<CalendarDate>['onChange'] = next => {
    setValue(next);
    onSave(next ? next.toString() : null);
  };
  return <DatePicker<CalendarDate> aria-label="Due date" value={value} onChange={handleChange} />;
}
```

Empty components emit `null`. Handle it before you call `toString()`.

SSR: `today()` and `now()` depend on the clock and the zone. `getLocalTimeZone()` on the server gives the server zone. Pass the user's zone from the server, or compute these values after hydration.

## Date objects

All objects are immutable. Every method returns a new object.

```tsx
import {CalendarDate, CalendarDateTime, Time, ZonedDateTime} from '@internationalized/date';

new CalendarDate(2022, 2, 3);
new CalendarDateTime(2022, 2, 3, 9, 45, 0, 0);
new Time(9, 45, 0, 0);
// The UTC offset is in milliseconds and is required.
new ZonedDateTime(2022, 2, 3, 'America/Los_Angeles', -28800000, 9, 15, 0);
```

Constructor forms. The same prefix applies to all three date classes:

| Form | Example |
| ---- | ------- |
| `(year, month, day, ...)` | `new CalendarDate(2022, 2, 3)` |
| `(era, year, month, day, ...)` | `new CalendarDate('BC', 100, 1, 1)` |
| `(calendar, year, month, day, ...)` | `new CalendarDate(new BuddhistCalendar(), 2563, 4, 30)` |
| `(calendar, era, year, month, day, ...)` | `new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30)` |

`CalendarDateTime` adds optional `hour, minute, second, millisecond`. `ZonedDateTime` adds required `timeZone, offset`, then optional time fields. Months start at 1, not 0. Docs page: `https://react-aria.adobe.com/internationalized/date/CalendarDate`.

| Member | `CalendarDate` | `CalendarDateTime` | `ZonedDateTime` | `Time` |
| ------ | -------------- | ------------------ | --------------- | ------ |
| Readonly fields | `calendar, era, year, month, day` | Date fields plus `hour, minute, second, millisecond` | Same plus `timeZone, offset` | `hour, minute, second, millisecond` |
| `copy()` | Yes | Yes | Yes | Yes |
| `add(d)`, `subtract(d)` | `DateDuration` | `DateTimeDuration` | `DateTimeDuration` | `TimeDuration` |
| `set(fields)` | `DateFields` | `DateFields & TimeFields` | Same, plus `disambiguation?` | `TimeFields` |
| `cycle(field, amount, opts?)` | `CycleOptions` | `CycleTimeOptions` | `CycleTimeOptions` | `CycleTimeOptions` |
| `toDate(...)` | `toDate(timeZone)` | `toDate(timeZone, disambiguation?)` | `toDate()` | None |
| `toString()` | `2022-02-03` | `2022-02-03T09:45:00` | `2022-02-03T09:45:00-08:00[America/Los_Angeles]` | `09:45:00` |
| `toAbsoluteString()` | None | None | `2022-02-03T17:45:00.000Z` | None |
| `compare(b)` | `AnyCalendarDate` | `DateValue` | `DateValue` | `AnyTime` |

`DateValue` is `CalendarDate | CalendarDateTime | ZonedDateTime`.

Docs pages: `.../internationalized/date/CalendarDateTime`, `.../internationalized/date/ZonedDateTime`, `.../internationalized/date/Time`.

## All exports of @internationalized/date

Classes:

| Export | Purpose |
| ------ | ------- |
| `CalendarDate` | Date without time. |
| `CalendarDateTime` | Date and time without zone. |
| `Time` | Clock time without date. |
| `ZonedDateTime` | Date and time with zone and UTC offset. |
| `DateFormatter` | Wrapper around `Intl.DateTimeFormat`. |
| `GregorianCalendar`, `JapaneseCalendar`, `BuddhistCalendar`, `TaiwanCalendar`, `PersianCalendar`, `IndianCalendar`, `IslamicCivilCalendar`, `IslamicTabularCalendar`, `IslamicUmalquraCalendar`, `HebrewCalendar`, `EthiopicCalendar`, `EthiopicAmeteAlemCalendar`, `CopticCalendar` | The 13 calendar implementations. |

Parsing:

| Function | Signature | Result |
| -------- | --------- | ------ |
| `parseDate` | `(value: string)` | `CalendarDate` |
| `parseDateTime` | `(value: string)` | `CalendarDateTime` |
| `parseTime` | `(value: string)` | `Time` |
| `parseAbsolute` | `(value: string, timeZone: string)` | `ZonedDateTime` |
| `parseAbsoluteToLocal` | `(value: string)` | `ZonedDateTime` |
| `parseZonedDateTime` | `(value: string, disambiguation?: Disambiguation)` | `ZonedDateTime` |
| `parseDuration` | `(value: string)` | `Required<DateTimeDuration>` |

Conversion:

| Function | Signature | Result |
| -------- | --------- | ------ |
| `toCalendarDate` | `(dateTime: AnyCalendarDate)` | `CalendarDate` |
| `toCalendarDateTime` | `(date: DateValue, time?: AnyTime)` | `CalendarDateTime` |
| `toTime` | `(dateTime: CalendarDateTime \| ZonedDateTime)` | `Time` |
| `toCalendar` | `(date: T, calendar: Calendar)` | `T` |
| `toZoned` | `(date: DateValue, timeZone: string, disambiguation?: Disambiguation)` | `ZonedDateTime` |
| `toTimeZone` | `(date: ZonedDateTime, timeZone: string)` | `ZonedDateTime` |
| `toLocalTimeZone` | `(date: ZonedDateTime)` | `ZonedDateTime` |
| `fromDate` | `(date: Date, timeZone: string)` | `ZonedDateTime` |
| `fromDateToLocal` | `(date: Date)` | `ZonedDateTime` |
| `fromAbsolute` | `(ms: number, timeZone: string)` | `ZonedDateTime` |
| `createCalendar` | `(name: CalendarIdentifier)` | `Calendar` |

Current time and zone:

| Function | Signature | Result |
| -------- | --------- | ------ |
| `now` | `(timeZone: string)` | `ZonedDateTime` |
| `today` | `(timeZone: string)` | `CalendarDate` |
| `getLocalTimeZone` | `()` | `string` (cached after the first call) |
| `setLocalTimeZone` | `(timeZone: string)` | `void` (mock it in tests) |
| `resetLocalTimeZone` | `()` | `void` |
| `getHoursInDay` | `(a: CalendarDate, timeZone: string)` | `number` (23, 24, or 25) |

Comparison:

| Function | Signature | Meaning |
| -------- | --------- | ------- |
| `isSameDay`, `isSameMonth`, `isSameYear` | `(a: DateValue, b: DateValue)` | Same unit. Converts `b` to the calendar of `a`. |
| `isEqualDay`, `isEqualMonth`, `isEqualYear` | `(a: DateValue, b: DateValue)` | Same unit and same calendar. |
| `isEqualCalendar` | `(a: Calendar, b: Calendar)` | Same calendar system. |
| `isToday` | `(date: DateValue, timeZone: string)` | Today in that zone. |
| `minDate`, `maxDate` | `(a?: DateValue \| null, b?: DateValue \| null)` | Lesser or greater date. Accepts `null`. |

Start, end, and locale queries. Each date function returns the same type it receives:

| Function | Signature |
| -------- | --------- |
| `startOfYear`, `endOfYear`, `startOfMonth`, `endOfMonth` | `(date)` |
| `startOfWeek`, `endOfWeek` | `(date, locale: string, firstDayOfWeek?: DayOfWeek)` |
| `getDayOfWeek` | `(date: DateValue, locale: string, firstDayOfWeek?: DayOfWeek)`: `number`, 0 to 6 |
| `getWeeksInMonth` | `(date: DateValue, locale: string, firstDayOfWeek?: DayOfWeek)`: `number` |
| `isWeekday`, `isWeekend` | `(date: DateValue, locale: string)`: `boolean` |
| `getMinimumMonthInYear`, `getMinimumDayInMonth` | `(date: AnyCalendarDate)`: `number`. Above 1 where an era starts mid-year, such as Japanese. |

Type exports: `AnyCalendarDate`, `AnyTime`, `AnyDateTime`, `Calendar`, `CalendarIdentifier`, `DateDuration`, `TimeDuration`, `DateTimeDuration`, `DateFields`, `TimeFields`, `DateField`, `TimeField`, `Disambiguation`, `CycleOptions`, `CycleTimeOptions`, `DateValue`, `DayOfWeek`.

Not exported, although they appear in internal `.d.ts` files: `compareDate`, `compareTime`, `toAbsolute`, `isLocalTimeZoneOverridden`, `isLeapYear`, `dateToString`, and the other string helpers. Do not import them.

## Parsing and creating

```tsx
import {
  fromAbsolute, fromDate, getLocalTimeZone, now, parseAbsolute, parseAbsoluteToLocal,
  parseDate, parseDateTime, parseDuration, parseTime, parseZonedDateTime, today
} from '@internationalized/date';

parseDate('2022-02-03');
parseDateTime('2022-02-03T09:45');
parseTime('09:45');
parseZonedDateTime('2022-11-07T00:45[America/Los_Angeles]');
parseAbsolute('2021-11-07T07:45:00Z', 'America/Los_Angeles');
parseAbsoluteToLocal('2021-11-07T07:45:00Z');
fromDate(new Date(), 'America/Los_Angeles');
fromAbsolute(1688023843144, 'America/Los_Angeles');
today(getLocalTimeZone());
now('America/New_York');
parseDuration('-P3Y6M6W4DT12H30M5.5S');
```

`parseDuration`:

- A leading minus negates every field.
- The smallest unit may have a decimal, written with a comma or a period.
- Fields not in the string come back as `0`. Tested: `parseDuration('P3Y6M6W4D')` gives `{years: 3, months: 6, weeks: 6, days: 4, hours: 0, minutes: 0, seconds: 0}`.
- `parseDuration('3 days')` throws.

## Manipulation

`add` and `subtract` balance overflow and constrain invalid days.

```tsx
import {CalendarDate, Time, parseZonedDateTime} from '@internationalized/date';

let date = new CalendarDate(2022, 2, 3);
date.add({weeks: 1}); // 2022-02-10
date.subtract({years: 1, months: 1, days: 1}); // 2021-01-02
new CalendarDate(2022, 8, 31).add({months: 1}); // 2022-09-30, constrained

date.set({day: 100}); // 2022-02-28, constrained
date.set({month: 20}); // 2022-12-03, constrained

new CalendarDate(2022, 12, 31).cycle('day', 1); // 2022-12-01, wraps inside the month
new CalendarDate(2022, 12, 31).cycle('month', 1); // 2022-01-31, wraps inside the year
date.cycle('year', 5, {round: true}); // 2025-02-03
date.cycle('year', -5, {round: true}); // 2020-02-03

new Time(11).cycle('hour', 1); // 12:00:00
new Time(11).cycle('hour', 1, {hourCycle: 12}); // 00:00:00, stays AM
new Time(23, 30).add({hours: 2}); // 01:30:00, wraps

parseZonedDateTime('2022-02-03T09:22[America/Los_Angeles]').cycle('minute', 15, {round: true}); // 09:30
```

- `add` carries into other fields. `cycle` wraps inside the one field. Use `cycle` for spin-button behavior.
- `Time` has no date, so `add` wraps around the day.
- `hourCycle` defaults to 24.

## Time zones and DST

`ZonedDateTime` arithmetic follows the zone rules. The offset changes, and the local hour may skip or repeat.

```tsx
import {parseZonedDateTime} from '@internationalized/date';

// Spring forward: the 2 AM hour does not exist.
parseZonedDateTime('2020-03-08T01:00-08:00[America/Los_Angeles]').add({hours: 1});
// 2020-03-08T03:00-07:00[America/Los_Angeles]
parseZonedDateTime('2020-03-07T02:00-08:00[America/Los_Angeles]').add({days: 1});
// 2020-03-08T03:00-07:00[America/Los_Angeles]

// Fall back: the 1 AM hour happens twice.
parseZonedDateTime('2020-11-01T01:00-07:00[America/Los_Angeles]').add({hours: 1});
// 2020-11-01T01:00-08:00[America/Los_Angeles]
```

`Disambiguation` applies to `set`, `toZoned`, `CalendarDateTime.toDate`, and `parseZonedDateTime`. It is used when a local time does not exist or exists twice:

| Value | Meaning |
| ----- | ------- |
| `'compatible'` (default) | Later time on spring forward. Earlier time on fall back. |
| `'earlier'` | The earlier of the two possible times. |
| `'later'` | The later of the two possible times. |
| `'reject'` | Throws. Tested message: `No such absolute time found`. |

```tsx
import {CalendarDateTime, parseZonedDateTime, toZoned} from '@internationalized/date';

let date = parseZonedDateTime('2020-03-01T02:00-08:00[America/Los_Angeles]');
date.set({day: 8}); // 2020-03-08T03:00-07:00
date.set({day: 8}, 'earlier'); // 2020-03-08T01:00-08:00
date.set({day: 8}, 'later'); // 2020-03-08T03:00-07:00

toZoned(new CalendarDateTime(2020, 3, 8, 2, 30), 'America/Los_Angeles'); // 03:30-07:00
```

`getHoursInDay(new CalendarDate(2020, 3, 8), 'America/Los_Angeles')` returns 23. Do not assume 24 in timeline layouts.

The local zone is cached after the first `getLocalTimeZone()` call. Tests mock it with `setLocalTimeZone('Europe/Paris')` and restore it with `resetLocalTimeZone()`.

Use IANA names such as `America/Los_Angeles`. Read the user's zone with `getLocalTimeZone()`.

## Conversion, including native Date

```tsx
import {
  CalendarDate, Time, getLocalTimeZone, parseAbsolute, parseZonedDateTime, toCalendarDate,
  toCalendarDateTime, toLocalTimeZone, toTime, toTimeZone, toZoned
} from '@internationalized/date';

let date = new CalendarDate(2022, 2, 3);
toCalendarDateTime(date); // 2022-02-03T00:00:00
let dateTime = toCalendarDateTime(date, new Time(8, 30)); // 2022-02-03T08:30:00
toZoned(date, 'America/Los_Angeles'); // midnight in that zone
toZoned(dateTime, 'America/Los_Angeles'); // 08:30 in that zone

let zoned = parseZonedDateTime('2022-02-03T09:45[America/Los_Angeles]');
toCalendarDate(zoned); // 2022-02-03
toTime(zoned); // 09:45:00
toCalendarDateTime(zoned); // 2022-02-03T09:45:00
toTimeZone(zoned, 'America/Chicago'); // 2022-02-03T11:45:00-06:00[America/Chicago]
toLocalTimeZone(zoned);

// Native Date
date.toDate(getLocalTimeZone());
dateTime.toDate('America/Los_Angeles', 'earlier');
zoned.toDate();

// The local day depends on the zone. Tested:
toCalendarDate(parseAbsolute('2022-02-03T23:30:00Z', 'Asia/Tokyo')); // 2022-02-04
```

`CalendarDate` and `CalendarDateTime` need a zone in `toDate` because a `Date` is an exact moment. `ZonedDateTime.toDate()` takes no argument.

## Queries

`compare` returns a negative number, zero, or a positive number. Read only the sign. The size has no stable unit: tested results are a day count for two `CalendarDate` values and milliseconds for a `CalendarDateTime`. Comparing a `CalendarDate` with a `CalendarDateTime` on that date at 10:00 gives `0` from the date side and a positive number from the date-time side.

`ZonedDateTime.compare` compares instants. Tested: 09:00 New York and 06:00 Los Angeles on the same day give `0`.

```tsx
import {
  CalendarDate, IslamicUmalquraCalendar, endOfMonth, getDayOfWeek, getHoursInDay, getLocalTimeZone,
  getWeeksInMonth, isEqualMonth, isSameMonth, isToday, isWeekend, maxDate, minDate, startOfWeek,
  startOfYear
} from '@internationalized/date';

let date = new CalendarDate(2022, 2, 3);
let hijri = new CalendarDate(new IslamicUmalquraCalendar(), 1442, 9, 4);
isSameMonth(new CalendarDate(2021, 4, 16), hijri); // true, converts
isEqualMonth(new CalendarDate(2021, 4, 16), hijri); // false, calendars differ

startOfYear(date); // 2022-01-01
endOfMonth(date); // 2022-02-28
startOfWeek(date, 'en-US'); // 2022-01-30, Sunday
startOfWeek(date, 'fr-FR'); // 2022-01-31, Monday
startOfWeek(date, 'en-US', 'mon'); // 2022-01-31

let sunday = new CalendarDate(2022, 2, 6);
getDayOfWeek(sunday, 'en-US'); // 0
getDayOfWeek(sunday, 'fr-FR'); // 6
getDayOfWeek(sunday, 'en-US', 'mon'); // 6
isWeekend(sunday, 'en-US'); // true
isWeekend(sunday, 'he-IL'); // false

getWeeksInMonth(new CalendarDate(2021, 1, 1), 'en-US'); // 6
getWeeksInMonth(new CalendarDate(2021, 1, 1), 'fr-FR'); // 5
isToday(date, getLocalTimeZone());
minDate(null, date); // date
maxDate(date, new CalendarDate(2023, 1, 1));
```

Common mistake: `getDayOfWeek` returns a locale-relative index. `0` is not always Sunday. Pass `firstDayOfWeek` when you need a fixed origin, or use the locale from `useLocale()`.

## Calendars and eras

Docs page: `https://react-aria.adobe.com/internationalized/date/Calendar`.

| Class | Identifier | Eras and notes |
| ----- | ---------- | -------------- |
| `GregorianCalendar` | `gregory` | `BC`, `AD`. |
| `BuddhistCalendar` | `buddhist` | `BE`. |
| `EthiopicCalendar` | `ethiopic` | `AA`, `AM`. 12 months of 30 days plus 5 or 6 extra days. |
| `EthiopicAmeteAlemCalendar` | `ethioaa` | `AA`. |
| `CopticCalendar` | `coptic` | `BCE`, `CE`. |
| `HebrewCalendar` | `hebrew` | 12 or 13 months. Leap month inserted at month 6. |
| `IndianCalendar` | `indian` | `saka`. |
| `IslamicCivilCalendar` | `islamic-civil` | Arithmetic rules. |
| `IslamicTabularCalendar` | `islamic-tbla` | Arithmetic rules, another epoch. |
| `IslamicUmalquraCalendar` | `islamic-umalqura` | Saudi Arabia, astronomical. |
| `JapaneseCalendar` | `japanese` | `meiji`, `taisho`, `showa`, `heisei`, `reiwa` (tested). No dates before 1868. |
| `PersianCalendar` | `persian` | Year starts near the March equinox. |
| `TaiwanCalendar` | `roc` | `before_minguo`, `minguo`. |

```tsx
import {CalendarDate, GregorianCalendar, HebrewCalendar, JapaneseCalendar, createCalendar, toCalendar} from '@internationalized/date';

toCalendar(new CalendarDate(2020, 9, 19), new HebrewCalendar()); // 5781-01-01 in Hebrew
new CalendarDate(new JapaneseCalendar(), 'heisei', 31, 4, 30);
new JapaneseCalendar().getEras();

// Calendar for a locale
let identifier = new Intl.DateTimeFormat('th-TH').resolvedOptions().calendar; // 'buddhist'
createCalendar(identifier as Parameters<typeof createCalendar>[0]);
new Intl.DateTimeFormat('hi-IN-u-ca-indian').resolvedOptions().calendar; // 'indian'

// Smaller bundle: createCalendar pulls in every calendar. Own factory lets the bundler drop the rest.
function appCalendar(id: string) {
  switch (id) {
    case 'gregory': return new GregorianCalendar();
    case 'japanese': return new JapaneseCalendar();
    default: throw new Error(`Unsupported calendar ${id}`);
  }
}
```

Without an era, a date is in the current era. With eras, years start at 1 inside the era.

`Calendar` interface: `identifier`, `fromJulianDay(jd)`, `toJulianDay(date)`, `getDaysInMonth(date)`, `getMonthsInYear(date)`, `getYearsInEra(date)`, `getEras()`, `getMaximumMonthsInYear()`, `getMaximumDaysInMonth()`, and the optional `getMinimumMonthInYear?`, `getMinimumDayInMonth?`, `getFormattableMonth?`, `isEqual?`.

Gotcha, tested: `CalendarIdentifier` also lists `chinese`, `dangi`, `islamic`, `islamic-rgsa`, and `iso8601`. `createCalendar` has no class for them and silently returns Gregorian. A locale can resolve to one of these, for example a locale with `-u-ca-chinese`. Check the identifier if accuracy matters.

Custom calendars (for example a 4-5-4 fiscal year): extend `GregorianCalendar` or implement `Calendar`. The key methods are `fromJulianDay` and `toJulianDay`. Then override `getDaysInMonth`, `getFormattableMonth`, and `isEqual`.

```tsx
import {CalendarDate, GregorianCalendar, type AnyCalendarDate, type Calendar} from '@internationalized/date';

class Fiscal extends GregorianCalendar {
  // Each month is whole weeks.
  getDaysInMonth(date: AnyCalendarDate): number {
    return date.month % 3 === 2 ? 35 : 28;
  }
  // First day of the month to display for this date.
  getFormattableMonth(date: AnyCalendarDate): CalendarDate {
    return new CalendarDate(date.year, date.month, 1);
  }
  isEqual(other: Calendar): boolean {
    return other instanceof Fiscal;
  }
}
```

This shape is a sketch. A real calendar must also map Julian days to its own months, as the docs example does.

## DateFormatter

Wrapper around `Intl.DateTimeFormat`. It adds a `formatRange` polyfill and fixes `hour12` and `hourCycle` bugs in browsers. Docs page: `https://react-aria.adobe.com/internationalized/date/DateFormatter`.

Methods: `format(value: Date)`, `formatToParts(value)`, `formatRange(start, end)`, `formatRangeToParts(start, end)`, `resolvedOptions()`. All take native `Date`.

```tsx
import {CalendarDate, DateFormatter, getLocalTimeZone} from '@internationalized/date';

let zone = getLocalTimeZone();
let formatter = new DateFormatter('en-US', {dateStyle: 'long', timeZone: zone});
formatter.format(new CalendarDate(2022, 2, 3).toDate(zone)); // February 3, 2022
```

Use the same zone in `toDate(zone)` and in the `timeZone` option. If they differ, the printed day can shift by one. Tested: `dateStyle: 'medium'` range output is `Feb 3 – 6, 2022`.

To display a non-Gregorian calendar, pass `calendar` in `useDateFormatter`, or put it in the locale (`hi-IN-u-ca-indian`).

## NumberFormatter and NumberParser

Docs pages: `https://react-aria.adobe.com/internationalized/number/NumberFormatter`, `https://react-aria.adobe.com/internationalized/number/NumberParser`.

Exports: `NumberFormatter`, `NumberParser`, type `NumberFormatOptions`.

`NumberFormatter(locale, options?: NumberFormatOptions)` wraps `Intl.NumberFormat` with caching, plus polyfills for `signDisplay` and the narrow `degree` unit. `NumberFormatOptions` extends `Intl.NumberFormatOptions`; `numberingSystem` overrides the locale default.

Methods: `format(value)`, `formatToParts(value)`, `formatRange(start, end)`, `formatRangeToParts(start, end)`, `resolvedOptions()`.

```tsx
import {NumberFormatter} from '@internationalized/number';

new NumberFormatter('de-DE', {style: 'currency', currency: 'EUR'}).format(1234.5); // 1.234,50 €
new NumberFormatter('en-US', {style: 'percent'}).format(0.45); // 45%
new NumberFormatter('en-US', {style: 'unit', unit: 'kilometer-per-hour'}).format(50); // 50 km/h
new NumberFormatter('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0}).formatRange(3, 5); // $3 – $5
```

`NumberParser(locale, options?: Intl.NumberFormatOptions)`:

| Method | Result |
| ------ | ------ |
| `parse(value: string)` | `number`, or `NaN` when invalid |
| `isValidPartialNumber(value, minValue?, maxValue?)` | `boolean`. Use during typing. With `minValue >= 0`, `-` is invalid. |
| `getNumberingSystem(value)` | `string`, for example `arab`. Falls back to the locale default. |

```tsx
import {NumberFormatter, NumberParser} from '@internationalized/number';

// Decimal
let decimal = new NumberParser('en-US');
decimal.parse('1,000,000'); // 1000000
decimal.parse('١٢'); // 12, numbering system detected
decimal.parse('X'); // NaN
new NumberParser('de-DE').parse('1.234,5'); // 1234.5

// Percent: divides by 100, rounds to maximumFractionDigits
let percent = new NumberParser('en-US', {style: 'percent', maximumFractionDigits: 2});
percent.parse('45%'); // 0.45
percent.parse('62.3333%'); // 0.6233

// Currency
let money = new NumberParser('en-US', {
  style: 'currency', currency: 'EUR', currencyDisplay: 'code', currencySign: 'accounting'
});
money.parse('EUR 26.45'); // 26.45
money.parse('(EUR 25)'); // -25
money.parse('EU 45'); // NaN, partial symbol
money.parse('$45'); // NaN, other symbol

// Unit
let inches = new NumberParser('en-US', {style: 'unit', unit: 'inch', unitDisplay: 'long'});
inches.parse('12 inches'); // 12
inches.parse('12 in'); // NaN, wrong display form
inches.parse('23 ft'); // NaN, other unit

// Partial input
let partial = new NumberParser('en-US', {style: 'unit', unit: 'inch'});
partial.isValidPartialNumber('.'); // true
partial.isValidPartialNumber('10 in'); // true
partial.isValidPartialNumber('10 i'); // false
new NumberParser('en-US').isValidPartialNumber('-', 0); // false

// Numbering system round trip
let numberingSystem = new NumberParser('en-US').getNumberingSystem('١٢'); // 'arab'
new NumberFormatter('en-US', {numberingSystem}).format(12); // ١٢
```

Limits:

- The parser is strict. The format must be known up front. It cannot accept either a unit or a percent. Add an outside control to pick one.
- `parse` rejects partial input. `isValidPartialNumber` rejects partial units and currency symbols. Let users type the number and add the unit for them.
- Numbers are JavaScript doubles. Do not use them for exact money math on the server. Format and parse only.

## Localized strings

There are no docs pages for these packages. Facts come from types and source.

| Package | Runtime need | Input | Fits |
| ------- | ------------ | ----- | ---- |
| `@internationalized/string` | Small, no parser | Plain strings or precompiled functions | Component libraries. Build-time compile step. |
| `@internationalized/message` | Bundles `intl-messageformat` | ICU strings parsed at runtime | Quick use with ICU strings, including `date`, `number` skeletons, and rich tags. |
| `@internationalized/string-compiler` | Build only | ICU strings to JavaScript source | Generates input for `@internationalized/string`. |

### @internationalized/string

Exports: `LocalizedStringDictionary`, `LocalizedStringFormatter`, types `LocalizedString`, `LocalizedStrings`, `Variables`.

```tsx
import {LocalizedStringDictionary, LocalizedStringFormatter, type LocalizedString} from '@internationalized/string';

let items: LocalizedString = (args, formatter) =>
  `${formatter!['plural'](args!.count as number, {
    one: () => `${formatter!['number'](args!.count as number)} item`,
    other: () => `${formatter!['number'](args!.count as number)} items`
  })}`;

let dictionary = new LocalizedStringDictionary<'hello' | 'items', LocalizedString>({
  'en-US': {hello: 'Hello', items},
  'fr-FR': {hello: 'Bonjour', items}
}, 'en-US');

dictionary.getStringForLocale('hello', 'fr-CA'); // 'Bonjour'
dictionary.getStringsForLocale('en-GB');
new LocalizedStringFormatter('en-US', dictionary).format('items', {count: 2500}); // '2,500 items'
```

Normally, `items` above is generated by the compiler. `plural`, `number`, and `select` are `protected` on the class, so hand-written functions do not typecheck cleanly.

Tested behavior:

- `format` returns a plain string as is. `'Hello {name}'` stays `Hello {name}` even with variables. Only compiled functions interpolate. This is the main mistake with this package.
- Locale lookup order: exact, language plus script, language, any locale of the language, then the default locale (`en-US` unless you pass another). `fr-CA` finds `fr-FR`. `de-DE` falls to `en-US`.
- A missing key throws `Could not find intl message ...`. There is no per-key fallback to English: a key absent from `fr-FR` throws for French.
- `LocalizedStringDictionary.getGlobalDictionaryForPackage(packageName)` reads strings injected in the page by the server. It returns `null` without a window or without injected strings. It throws when the package is missing from the injected set.

### @internationalized/string-compiler

```tsx
import {compileString, compileStrings} from '@internationalized/string-compiler';

compileString('Hello {name}');
// (args) => `Hello ${args.name}`
compileString('{count, plural, =0 {No items} one {# item} other {# items}}');
// (args, formatter) => `${formatter.plural(args.count, {"=0": `No items`, one: () => `${formatter.number(args.count)} item`, other: () => `${formatter.number(args.count)} items`})}`
compileStrings({a: 'A', b: 'B {x}'}, {format: 'esm'});
// export default {  "a": `A`, "b": (args) => `B ${args.x}`, }
```

- Both return JavaScript source as a string. Write it to a file at build time. Do not `eval` it.
- `format` is `'cjs'` by default, or `'esm'`.
- Supported ICU (tested): arguments, `plural` (with `offset`, `selectordinal`, and `#`), `select`, and `{n, number}`.
- `{n, number, percent}` compiles, but the style is dropped: output is `formatter.number(args.n)`.
- `{d, date, short}` and rich tags such as `<b>x</b>` throw `Unsupported message type`.

### @internationalized/message

Exports: `MessageDictionary`, `MessageFormatter`, type `LocalizedStrings`.

```tsx
import {MessageDictionary, MessageFormatter} from '@internationalized/message';

let messages = new MessageDictionary({
  'en-US': {
    hello: 'Hello {name}',
    items: '{count, plural, one {# item} other {# items}}',
    rich: '<b>Sale</b> ends {when, date, short}'
  }
}, 'en-US');

let formatter = new MessageFormatter('en-US', messages);
formatter.format('hello', {name: 'Ana'}); // Hello Ana
formatter.format('items', {count: 1200}); // 1,200 items
formatter.format('rich', {b: chunks => `[${chunks}]`, when: new Date(0)});
```

- `format(key, variables)` takes the `variables` argument always. Pass `undefined` for a message with no arguments.
- A missing key or a missing variable throws (tested). `null` values become `false`.
- Parsed messages are cached per formatter.
- `MessageDictionary` has `getStringForLocale` only.

### React hooks for strings

`react-aria/useLocalizedStringFormatter` exports `useLocalizedStringFormatter` and `useLocalizedStringDictionary`. `useMessageFormatter` is not exported from `react-aria` 3.53.1. For ICU at runtime in React, combine `useLocale` with `useMemo` and `MessageFormatter`.

```tsx
import {useMemo} from 'react';
import {MessageDictionary, MessageFormatter} from '@internationalized/message';
import {useLocale} from 'react-aria/I18nProvider';
import {useLocalizedStringDictionary, useLocalizedStringFormatter} from 'react-aria/useLocalizedStringFormatter';

// Module level: the hooks cache per strings object.
const strings = {'en-US': {save: 'Save'}, 'fr-FR': {save: 'Enregistrer'}};
const messages = new MessageDictionary({'en-US': {hi: 'Hi {name}'}});

function SaveLabel() {
  let formatter = useLocalizedStringFormatter(strings);
  return <>{formatter.format('save')}</>;
}

function useDictionary() {
  return useLocalizedStringDictionary(strings);
}

function Hi({name}: {name: string}) {
  let {locale} = useLocale();
  let formatter = useMemo(() => new MessageFormatter(locale, messages), [locale]);
  return <>{formatter.format('hi', {name})}</>;
}
```

Signature: `useLocalizedStringFormatter(strings, packageName?)`. Pass `packageName` to read server-injected strings by that package name. Never create `strings` inside a component.

## React i18n layer

Import from `react-aria/<name>`. `react-aria-components/I18nProvider` re-exports `I18nProvider`, `useLocale`, `isRTL`. `useFilter` is also available from `react-aria-components/Autocomplete`.

| Hook or component | Import | Input | Returns |
| ----------------- | ------ | ----- | ------- |
| `I18nProvider` | `react-aria/I18nProvider` | `locale?: string`, `children` | Sets the locale for children. |
| `useLocale` | `react-aria/I18nProvider` | None | `{locale: string, direction: 'ltr' \| 'rtl'}` |
| `isRTL` | `react-aria/I18nProvider` | `localeString: string` | `boolean`, from script and language |
| `useDateFormatter` | `react-aria/useDateFormatter` | `DateFormatterOptions` (`Intl.DateTimeFormatOptions` plus `calendar?`) | `DateFormatter` |
| `useNumberFormatter` | `react-aria/useNumberFormatter` | `NumberFormatOptions` | `Intl.NumberFormat` |
| `useListFormatter` | `react-aria/useListFormatter` | `Intl.ListFormatOptions` | `Intl.ListFormat` |
| `useCollator` | `react-aria/useCollator` | `Intl.CollatorOptions` | `Intl.Collator` |
| `useFilter` | `react-aria/useFilter` | `Intl.CollatorOptions` | `{startsWith, endsWith, contains}` |

Docs pages: `https://react-aria.adobe.com/I18nProvider`, `/useLocale`, `/useDateFormatter`, `/useNumberFormatter`, `/useListFormatter`, `/useCollator`, `/useFilter`.

```tsx
import {useState, type ReactNode} from 'react';
import {getLocalTimeZone, type CalendarDate} from '@internationalized/date';
import {I18nProvider, isRTL, useLocale} from 'react-aria/I18nProvider';
import {useCollator} from 'react-aria/useCollator';
import {useDateFormatter} from 'react-aria/useDateFormatter';
import {useFilter} from 'react-aria/useFilter';
import {useListFormatter} from 'react-aria/useListFormatter';
import {useNumberFormatter} from 'react-aria/useNumberFormatter';

function Root({lang, children}: {lang: string; children: ReactNode}) {
  return (
    <I18nProvider locale={lang}>
      <Shell>{children}</Shell>
    </I18nProvider>
  );
}

function Shell({children}: {children: ReactNode}) {
  let {locale, direction} = useLocale();
  return <div lang={locale} dir={direction}>{children}</div>;
}

function Due({value}: {value: CalendarDate}) {
  let timeZone = getLocalTimeZone();
  let formatter = useDateFormatter({dateStyle: 'long', timeZone});
  return <time>{formatter.format(value.toDate(timeZone))}</time>;
}

function Price({value, currency}: {value: number; currency: string}) {
  let formatter = useNumberFormatter({style: 'currency', currency, minimumFractionDigits: 0});
  return <>{formatter.format(value)}</>;
}

function Names({items}: {items: string[]}) {
  let formatter = useListFormatter({type: 'conjunction'});
  return <>{formatter.format(items)}</>;
}

function Sorted({items}: {items: string[]}) {
  let collator = useCollator({numeric: true});
  return <>{[...items].sort(collator.compare).join(', ')}</>;
}

function Search({items}: {items: string[]}) {
  // sensitivity: 'base' ignores case and diacritics.
  let {contains} = useFilter({sensitivity: 'base'});
  let [query, setQuery] = useState('');
  return (
    <>
      <input aria-label="Filter" type="search" value={query} onChange={e => setQuery(e.target.value)} />
      <ul>{items.filter(item => contains(item, query)).map(item => <li key={item}>{item}</li>)}</ul>
    </>
  );
}

isRTL('he-IL'); // true
```

Notes:

- Wrap the whole app in one `I18nProvider`. Nest a second one only for a part in another locale.
- Without a provider, the locale comes from `navigator.language` and updates on `languagechange`. Invalid values fall back to `en-US`.
- `lang` and `dir` are not set for you. Set them on the root element.
- During SSR without a provider, the default is `en-US` and `ltr`. It changes after hydration, so the markup can shift. Pass a locale from the server.
- `react-aria/i18n` and `react-aria-components/i18n` are string data paths, not the hooks.
- Hooks cache the `Intl` objects for you. Do not wrap them in `useMemo`.
- `useNumberFormatter` returns the `Intl.NumberFormat` type, but `useDateFormatter` returns `DateFormatter`. Its `format` needs a `Date`, not a `CalendarDate`.

## Supported locales and bundles

The docs list these 36 locales for component strings. Docs page: `https://react-aria.adobe.com/quality`.

`ar-AE`, `bg-BG`, `cs-CZ`, `da-DK`, `de-DE`, `el-GR`, `en-GB`, `en-US`, `es-ES`, `et-EE`, `fi-FI`, `fr-CA`, `fr-FR`, `he-IL`, `hr-HR`, `hu-HU`, `it-IT`, `ja-JP`, `ko-KR`, `lt-LT`, `lv-LV`, `nb-NO`, `nl-NL`, `pl-PL`, `pt-BR`, `pt-PT`, `ro-RO`, `ru-RU`, `sk-SK`, `sl-SI`, `sr-SP`, `sv-SE`, `tr-TR`, `uk-UA`, `zh-CN`, `zh-TW`.

The docs list 36. The installed `react-aria-components/i18n` folder has 34 files: `en-GB` and `fr-CA` have no file of their own, so their strings come from another `en` or `fr` locale through language matching. Dates and numbers still follow the exact locale.

Other locales still format dates and numbers through `Intl`, but built-in strings such as "Select" use the closest language match, then `en-US`.

Bundle size: `@react-aria/optimize-locales-plugin` removes unneeded strings. Docs page: `https://react-aria.adobe.com/frameworks`.

```bash
bun add -d @react-aria/optimize-locales-plugin
```

```ts
import localesPlugin from '@react-aria/optimize-locales-plugin';

// vite.config.ts plugins entry. locales: [] removes all strings from client JS.
let plugin = {...localesPlugin.vite({locales: []}), enforce: 'pre' as const};

// Next.js Turbopack: spread .rules into turbopack.rules.
let rules = localesPlugin.turbopack({locales: ['en-US', 'fr-FR']}).rules;
```

With strings removed from the client bundle, inject them from the server for the current locale:

```tsx
import {LocalizedStringProvider, createLocalizedStringDictionary, getLocalizationScript} from 'react-aria-components/i18n';

// In a streaming render:
let bootstrapScriptContent = getLocalizationScript('fr-FR');

// In a server component tree:
let element = <LocalizedStringProvider locale="fr-FR" />;

// Limit to some packages:
let dictionary = createLocalizedStringDictionary(['react-aria-components']);
let limited = getLocalizationScript('fr-FR', dictionary);
```

## RTL and number field notes

RTL (`https://react-aria.adobe.com/blog/rtl-date-time`):

- Date fields need their segments in normal flow, not flex, so the browser's bidirectional algorithm orders them. Keep the `DateInput` content inline. Do not reorder segments yourself.
- Time fields are always `HH:MM` left to right, even in RTL. Isolates (`⁦`, `⁩`) enforce this.
- Formats differ by locale: `he-IL` numeric dates read `DD.MM.YYYY`, and `ar-AE` separators contain right-to-left marks.
- Arrow keys in RTL date fields move to the visually closest segment, not the next DOM node.
- Flex and grid mirror with `dir`. Use logical CSS properties for margins, paddings, and borders.
- React Aria handles RTL keyboard navigation for you once `dir` and the locale are right.

Number fields (`https://react-aria.adobe.com/blog/how-we-internationalized-our-numberfield`):

- `NumberField` uses `<input type="text">` with `inputMode` and a custom role description, not `<input type="number">`. Native inputs lack currency, percent, unit, and non-Latin digit support.
- `inputMode` changes by platform and options: iOS has no minus key on numeric keyboards, so it uses `text` when negatives are allowed. Android uses `numeric`. Set `minValue={0}` to get a simpler keyboard.
- Only characters valid for the format can be typed. Latin, Arabic, and Han positional digits all work, including input methods such as Pinyin.
- `step` controls the buttons and arrow keys, and rounds to the nearest step on blur. Floating point errors are corrected.
- Do not use a number field for card or phone numbers. They are not incrementable.
- The parser builds its digit map from `Intl.NumberFormat`, so no locale data is downloaded.

## Docs and types disagreements

| Topic | Docs | Types or tested behavior (follow this) |
| ----- | ---- | ------------------------------------- |
| `ZonedDateTime.toDate` | Example passes a zone | `toDate()` takes no argument. |
| `parseDuration` result | Shows only present fields | Absent fields are `0`. |
| `CalendarIdentifier` | Lists 13 | Type lists 18. Five fall back to Gregorian in `createCalendar`. |
| `I18nProvider` import | One example uses `@react-aria/i18n` | Use `react-aria/I18nProvider` or `react-aria-components/I18nProvider`. |
| `useMessageFormatter` | Not documented | Not exported in `react-aria` 3.53.1. |
| `minDate`, `maxDate`, `isEqualCalendar`, `getHoursInDay`, `toLocalTimeZone` | Partly undocumented | Exported and usable. |
