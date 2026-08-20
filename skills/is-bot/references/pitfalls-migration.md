# Pitfalls and Migration

## Anti-patterns

1. **Default import** `import isbot from "isbot"` — removed in v4.
2. **`isbot.pattern` / `isbot.isbot` attached methods** — removed in v4.
3. **Named export `pattern`** — removed in v5; use `getPattern()`.
4. **Whitelisting crawlers by UA** — spoofable. Reverse DNS / IP lists for trust.
5. **Cloaking** — different primary HTML for Googlebot vs users. Against search guidelines; not an isbot use case.
6. **Using isbot as a WAF** — stealth scrapers copy Chrome UAs; they return `false`.
7. **`findBotPatterns` / `findBotMatches` per request** — O(list) `RegExp` compiles.
8. **Rebuilding `createIsBotFromList` per request** — compile once at module load.
9. **Treating missing UA as a bot** — `isBot(undefined)` is `false`. Add an explicit product rule if empty UA should be suspicious.
10. **`String(headers.get("user-agent"))`** — turns `null` into `"null"` (a string). Pass `null` through.
11. **Mutating `list`** — does not update default `isBot` / `getPattern()`.
12. **Literal custom tokens with `.` `(` `+`** in `createIsBotFromList` — they are regex fragments.
13. **Assuming `createIsBotFromList(list)` ≡ `isBot`** — join(`|`) skips lookbehind `fullPattern`.
14. **Removing broad fragments** (`bot`, `http`, `lighthouse`) to exempt one tool — collapses recall.
15. **Client `navigator.userAgent` for server analytics** — classify on the request.
16. **SEO “only bots see this” sitemaps/body** — not a legitimate isbot application.
17. **Expecting axios/undici/Postman to be “human”** — they are bots by design.
18. **Pinning match substrings** from an old `findBotMatch` in tests without a comment — pattern patches churn.
19. **Writing new code with `isbotMatch` names** — v6 will drop them; use `findBotMatch`.
20. **jsDelivr UMD `isBot` global** — the global is `isbot` (legacy). ESM CDN uses named `isBot`.

## What isbot will never do

| Need | Reality |
| --- | --- |
| Detect headless Chrome hiding as Chrome | UA looks human → `false` |
| Detect curl with a stolen Googlebot UA | UA looks like Googlebot → `true` (lie) |
| Score “likelihood of automation” | Boolean regex only |
| Parse browser family / version | Use a UA parser; isbot is match/not-match |
| IPv6 / JA3 / TLS fingerprint | Out of scope |
| CAPTCHA / proof-of-work | Out of scope |

## False-positive / false-negative themes (from changelog)

Maintainers continuously special-case **real browsers** that would otherwise hit generic tokens:

- HMS Core / GMS Core (Huawei / Google Play Services) — not bots
- CCleaner Browser — browser, not bot
- Project LightSpeed / Messenger in-app — not bots
- NewsSapphire, Ecosia in-app, search-provider in-app browsers
- Google Pixel / Google News Android app / Google webview tokens
- RSS substring (careful — RSS readers may still be bots)
- Locales with calendar in UA
- Cubot (phone brand vs `bot` suffix)

Generic tokens that **do** match many non-browser clients: `bot`, `crawl`, `spider`, `http`, `scan`, `search`, `lighthouse`, plus HTTP libraries (`axios/`, undici, Postman, RestSharp, Go clients, etc.).

When a user reports a “bug”, first run `findBotMatch` / `findBotPattern` and check isbot.js.org. Then either:

- Upgrade `isbot` (pattern patches are frequent), or
- Custom-list the exception, or
- File upstream with a fixture UA (README: open an issue).

## Migration

### v3 → v4

v4 removed the default export and `isbot.*` methods. Regex is built at **package build time**.

```ts
// v3
import isbot from "isbot";
isbot(ua);
isbot.pattern;

// v4
import { isbot } from "isbot";
isbot(ua);
```

v3.8.0 added `isbot` named export to ease this jump.

### v4 → v5

- Replace `import { pattern }` with `getPattern()`.
- Keep named `isbot`.

```ts
import { getPattern } from "isbot";
getPattern().test(ua);
```

v5.1.0: published JS targets **es2016**. v5.1.37: empty string is not a bot. v5.1.41: browser entry files must be present in the tarball.

### v5.2 → current

Rename to camelCase at leisure (no behaviour change):

| Old | New |
| --- | --- |
| `isbot` | `isBot` |
| `isbotNaive` | `isBotNaive` |
| `createIsbot` | `createIsBot` |
| `createIsbotFromList` | `createIsBotFromList` |
| `isbotMatch` | `findBotMatch` |
| `isbotMatches` | `findBotMatches` |
| `isbotPattern` | `findBotPattern` |
| `isbotPatterns` | `findBotPatterns` |

### v6 (not scheduled)

README: drop legacy names. New code should already use the right-hand column so v6 is a no-op.

### v2 historical

`isbot` used to return the **matched string** instead of `boolean`. Any `if (isbot(ua) === "Googlebot")` style is long obsolete.

## Suggested verification after changes

1. `bun pm ls isbot` — major 5.
2. Grep for `from "isbot"` / `from 'isbot'` — named camelCase imports only in new/edited files.
3. Grep for `isbot.pattern`, `import pattern`, default import — delete.
4. Grep for `findBotPatterns(` / `isbotPatterns(` / `findBotMatches(` in request handlers — move off the hot path.
5. Unit fixtures: Googlebot true, Chrome false, null/undefined/`""` false, plus any custom list cases.
6. If analytics changed: confirm Lighthouse/Cypress policy matches product intent.
