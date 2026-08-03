---
name: date-fns
description: "Build, review, debug, migrate, or plan date-fns v4 date/time code with @date-fns/tz and @date-fns/utc. Use for date-fns, format, parse, parseISO, addDays, differenceIn*, Interval, Duration, date-fns/fp, locales, TZDate, UTCDate, tz(), utc, transpose, in option, Unicode tokens, DST, SSR hydration date bugs, and migrations from date-fns v2/v3 or date-fns-tz."
---

# date-fns

Use this skill for **date-fns v4** date math, formatting, parsing, FP mode, locales, and official timezone packages **`@date-fns/tz`** / **`@date-fns/utc`**.

## Workflow

1. Inspect the local surface before changing code:
   - Packages: `date-fns`, optional `@date-fns/tz`, `@date-fns/utc` (and legacy `date-fns-tz` if present).
   - Versions: prefer **date-fns ≥ 4** for first-class `{ in }` / `TZDate` / `UTCDate` interop. v3 is common but local-only unless using `date-fns-tz`.
   - Zone intent: system-local UI, UTC-normalized server math, or named IANA zones (user/venue/HQ).
   - Imports: named from `"date-fns"`, `"date-fns/fp"`, `"date-fns/locale/*"`, `"date-fns/constants"`.
2. Refresh docs when versions are unclear or work touches timezones, Unicode tokens, SSR, or major upgrades. Start from [source-map.md](references/source-map.md).
3. Route deeper detail:
   - Install, imports, core concepts, Invalid Date: [setup-core.md](references/setup-core.md).
   - `format` / `parse` / `parseISO`, Unicode tokens: [format-parse.md](references/format-parse.md).
   - Add/set/boundaries, diffs, Interval, Duration: [manipulate-compare.md](references/manipulate-compare.md).
   - `TZDate`, `UTCDate`, `tz` / `utc`, `transpose`, DST, SSR: [timezones.md](references/timezones.md).
   - FP, locales, TypeScript: [fp-locales-types.md](references/fp-locales-types.md).
   - v2→v3→v4 and `date-fns-tz` migration: [migration-pitfalls.md](references/migration-pitfalls.md).
4. Match the project's installed major and existing import style. Do not add `@date-fns/tz` or `@date-fns/utc` unless zone semantics require them.
5. Verify with typecheck plus focused tests for Invalid Date, calendar vs elapsed diffs, and zone/SSR edges when relevant.

## Zone Decision Tree

```
System-local calendar / host TZ only?
  → plain Date + date-fns

UTC-only math (server day, charts, no IANA zones)?
  → @date-fns/utc (UTCDate / UTCDateMini or { in: utc })

Named IANA zone or multi-zone product?
  → @date-fns/tz (TZDate / TZDateMini or { in: tz("…") })

Stuck on date-fns v3?
  → upgrade to v4 + official packages, or use legacy date-fns-tz until then
```

## Core Judgment

- **Bare date-fns is system-local**, not a UTC library. Use `@date-fns/utc` or `@date-fns/tz` for non-local calendar fields.
- Prefer **named imports**. Constants come from `"date-fns/constants"`, not the main barrel.
- Always **`isValid` before `format`** — `format` throws `RangeError` on Invalid Date.
- Unicode tokens: use **`yyyy-MM-dd`**, never Moment-style `YYYY-MM-DD` / `DD` (week-year / day-of-year). See [format-parse.md](references/format-parse.md).
- **`parseISO("YYYY-MM-DD")` → local midnight**; `new Date("YYYY-MM-DD")` → UTC midnight. Do not conflate.
- Prefer **`differenceInCalendar*`** for calendar-day questions; **`differenceIn*`** for elapsed full units.
- With mixed zones or primitives, pin context with **`{ in: tz("…") }`** or **`{ in: utc }`** — first object `Date`/extension argument otherwise wins and order can flip day math.
- **`new TZDate(iso, zone)` ≠ legacy `toZonedTime`**. Same instant, different wall clock. Wall-clock remapping uses **`transpose`**.
- Prefer **full `TZDate` / `UTCDate`** at library boundaries; **Mini** variants skip zone-aware `toString` / locale formatters (system-zone leak).
- Do not confuse **`@date-fns/tz`** with third-party **`date-fns-tz`**.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls date-fns @date-fns/tz @date-fns/utc` (and `date-fns-tz` if migrating).
- Typecheck for `DateArg`, options types, and extension return types.
- Tests: valid/invalid parse, Unicode tokens, calendar vs elapsed diffs, reversed intervals, DST spring-forward/fall-back, `{ in }` vs argument-order zone selection.
- SSR/hydration smoke when formatting “today” or local day boundaries across server (often UTC) and client (local).

Report which checks ran, which did not, and version assumptions that remain.
