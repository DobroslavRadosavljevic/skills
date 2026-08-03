# Setup and Core Concepts

## Install

```bash
bun add date-fns

# Optional companions (date-fns v4+)
bun add @date-fns/tz
bun add @date-fns/utc
```

- `date-fns@4.x`: no peerDependencies.
- Companions work **with or without** date-fns for the Date subclasses alone; first-class `{ in }` interop needs **date-fns ≥ 4**.
- CDN (v4.4+): prefer `@date-fns/cdn` over deprecated in-package CDN scripts.

## Imports and Tree-Shaking

```ts
import { addDays, format, isValid } from "date-fns";
import { addDays as addDaysFp } from "date-fns/fp";
import { de } from "date-fns/locale/de";
import { daysInYear } from "date-fns/constants";
```

Rules:

- **Named exports only** (v3+). Do not `import addDays from "date-fns/addDays"`.
- Subpaths (`date-fns/addDays`) are fine; barrel `"date-fns"` is OK with modern ESM bundlers when `sideEffects: false` applies.
- Avoid `import * as dateFns from "date-fns"` and full CDN bundles in apps.
- **Constants are not on the main index** since v3 — use `"date-fns/constants"`.
- Import locales individually; do not pull the entire locale barrel unless needed.

## Core Model

| Fact | Implication |
| --- | --- |
| Pure functions over native `Date` | Never mutates the input; returns new values |
| Default calendar = **system local** | Not UTC unless you opt in |
| `DateArg` = `Date \| number \| string` | Strings restored in v3 (were removed in v2) |
| Invalid inputs → `Invalid Date` | Many ops return Invalid/`NaN`; **`format` throws** |
| Custom Date subclasses | Preserved via `constructFrom` / `Symbol.for("constructDateFrom")` |

```ts
import { format, isValid, parseISO } from "date-fns";

const d = parseISO(userInput);
if (!isValid(d)) {
  // handle bad input — do not call format
}
format(d, "yyyy-MM-dd");
```

## Local vs UTC Instant Mental Model

- Instant arithmetic in milliseconds is timezone-agnostic.
- **Calendar fields** (`getHours`, `startOfDay`, `isSameDay`, `format` tokens) depend on which zone the Date subclass / `{ in }` context uses.
- Plain `Date` → host local fields.
- `UTCDate` → UTC fields via remapped getters.
- `TZDate` → assigned IANA/offset zone fields.

## Common Construction Pitfalls

```ts
// Date-only ISO string:
parseISO("2024-01-15"); // local midnight (date-fns)
new Date("2024-01-15"); // UTC midnight (ES Date)

// Multi-arg constructors:
new Date(2024, 0, 1); // local midnight
new UTCDate(2024, 0, 1); // UTC midnight (Date.UTC)
new TZDate(2024, 0, 1, "America/New_York"); // NY wall midnight
```

## Defaults

```ts
import { setDefaultOptions, getDefaultOptions } from "date-fns";
import { fr } from "date-fns/locale";

setDefaultOptions({ locale: fr, weekStartsOn: 1 });
```

Use sparingly in libraries; prefer explicit `{ locale, weekStartsOn }` at call sites for reusable code.

## Package Structure Notes (v4)

- `"type": "module"` with dual ESM (`.js`) + CJS (`.cjs`) and matching types.
- Flat export map: every function is a top-level path.
- v4 types/generics evolved again — run `tsc` after upgrades even when runtime looks fine.
