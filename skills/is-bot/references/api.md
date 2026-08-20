# API

All exports are **named**. Types below match `isbot@5.2.1` `index.d.ts`.

Prefer **New** names. **Legacy** names are aliases (`typeof` the new function) until v6.

| New (5.2+) | Legacy | Type | Role |
| --- | --- | --- | --- |
| `isBot` | `isbot` | `(userAgent?: string \| null) => boolean` | Default detector |
| `isBotNaive` | `isbotNaive` | same | Fast / fallback heuristic |
| `getPattern` | — | `() => RegExp` | Cached full (or naive) regex |
| `list` | — | `string[]` | Regex fragments |
| `findBotMatch` | `isbotMatch` | `(ua?) => string \| null` | First UA substring the full pattern matches |
| `findBotMatches` | `isbotMatches` | `(ua?) => string[]` | UA substrings matched by **each** list fragment |
| `findBotPattern` | `isbotPattern` | `(ua?) => string \| null` | First **list fragment** that matches |
| `findBotPatterns` | `isbotPatterns` | `(ua?) => string[]` | All **list fragments** that match |
| `createIsBot` | `createIsbot` | `(RegExp) => typeof isBot` | Custom regex detector |
| `createIsBotFromList` | `createIsbotFromList` | `(string[]) => typeof isBot` | Custom fragment-list detector |

## `isBot`

```ts
import { isBot } from "isbot";

isBot(
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
); // true

isBot(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
); // false
```

Use this on every hot path. Case-insensitive (`i` flag).

## `isBotNaive`

Same signature. Tests only `/bot|crawl|http|lighthouse|scan|search|spider/i`.

Use when:

- Bundle/CPU budget forbids the full pattern, **and** false positives are acceptable (`http` matches many legitimate UAs and URLs-in-UA).
- Documenting behaviour of `getPattern()` on engines without lookbehind.

Do not use as a silent substitute for `isBot` in analytics — `http` is a blunt token.

## `getPattern`

```ts
import { getPattern } from "isbot";

const pattern = getPattern();
pattern.test(ua);
```

- First call: `new RegExp(fullPattern, "i")`. On `SyntaxError` (no lookbehind): assign naive regex.
- Later calls return the cached `RegExp`.
- **v5 breaking change:** the old named export `pattern` was removed. Always call `getPattern()`.
- The returned object is shared. Do not mutate `lastIndex` without resetting; prefer `.test` on a copy if the consumer uses global flags (the built pattern uses `i` only).

## `list`

Exported array of fragment strings that make up the full pattern. Use as the base for `createIsBotFromList(list.filter(...))` or `list.concat("my-token")`.

Treat as **read-only**. Mutating `list` does not rebuild `getPattern()` (the full regex is compiled from build-time `fullPattern`, not live `list` join). Custom detectors must go through `createIsBotFromList`.

## `findBotMatch` / `findBotMatches`

Explain **why** a UA matched.

```ts
import { findBotMatch, findBotMatches } from "isbot";

findBotMatch(ua); // e.g. "Googlebot" or null
findBotMatches(ua); // every fragment's matched substring
```

- `findBotMatch` — one `.match(getPattern())`. Cheap enough for debug logs on `isBot === true`.
- `findBotMatches` — **one `new RegExp(part, "i")` per list entry**. Expensive. Audit/CLI only.

`findBotMatch` uses optional chaining: missing UA → `null`. It does not use `isNonEmptyString`, so behaviour on `""` is `null`.

## `findBotPattern` / `findBotPatterns`

Return the **fragment(s)** from `list`, not the UA slice.

```ts
import { findBotPattern, findBotPatterns } from "isbot";

findBotPattern(ua); // first matching fragment or null
findBotPatterns(ua); // all matching fragments
```

Same cost warning as `findBotMatches`: N regex compiles. Used in the official Lighthouse-exclusion recipe (see [custom-patterns.md](custom-patterns.md)).

Falsy UA → `null` / `[]`.

## `createIsBot`

```ts
import { createIsBot } from "isbot";

const isPreviewBot = createIsBot(/slackbot|twitterbot|facebookexternalhit/i);
```

Wraps `customPattern.test` with the same non-empty-string guard. Caller owns flags (`i` is not added automatically).

## `createIsBotFromList`

```ts
import { createIsBotFromList, list } from "isbot";

const isBot = createIsBotFromList(list.concat("shmulik"));
```

Implementation:

```ts
const pattern = new RegExp(list.join("|"), "i");
```

Consequences:

- Fragments are **regex**, not literals. Escape `.` `(` `+` `?` etc. in custom tokens.
- This join **does not** include the upstream lookbehind-based `fullPattern`. Accuracy can differ from default `isBot` even if `list` is copied unchanged.
- Build the custom function **once** at module load. Do not rebuild per request.

## Cost summary

| Call | Regex work |
| --- | --- |
| `isBot` / `getPattern().test` | 1 cached regex |
| `isBotNaive` | 1 small regex |
| `findBotMatch` | 1 cached regex `.match` |
| `findBotPattern(s)` / `findBotMatches` | **O(list.length)** compiles |
| `createIsBotFromList` (init) | 1 compile of joined fragments |

## Dual-name exports (5.2.0)

```ts
isBot === isbot; // same function
findBotMatch === isbotMatch;
createIsBot === createIsbot;
createIsBotFromList === createIsbotFromList;
```

New code: camelCase only, so v6 is a rename-free upgrade.
