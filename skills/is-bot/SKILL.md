---
name: is-bot
description: "Build, review, debug, migrate, or plan User-Agent bot/crawler/spider detection with the isbot npm package (v5). Use for isbot, is-bot, isBot, isBotNaive, getPattern, list, createIsBot, createIsBotFromList, findBotMatch, findBotMatches, findBotPattern, findBotPatterns, Googlebot, Lighthouse, crawlers, spiders, analytics bot filtering, reverse-dns-lookup verification, and v3/v4/v5/v6 export migrations."
---

# isbot

Use this skill for **isbot v5** (`isbot` on npm, folder name `is-bot`): recognise self-identifying bots, crawlers, and spiders from a User-Agent string.

Package: [`isbot`](https://www.npmjs.com/package/isbot). Repo: [omrilotan/isbot](https://github.com/omrilotan/isbot). Tester: [isbot.js.org](https://isbot.js.org). Snapshot **5.2.1**.

## Workflow

1. Inspect the local surface:
   - Installed `isbot` version (`bun pm ls isbot`). Target **v5.2+** for camelCase `isBot` names.
   - Import style: named `isBot` (preferred) vs legacy `isbot`. No default export.
   - Call site: Fetch `Headers`, Node `IncomingMessage`, Express/Fastify/Hono/Elysia, browser `navigator.userAgent`.
   - Goal: analytics exclusion, cache preference, skip pixels — **not** stealth-bot blocking or SEO cloaking.
   - Custom lists: `createIsBotFromList` / `createIsBot` vs default `isBot`.
2. Refresh docs when versions drift or work touches custom patterns, naive fallback, or major-version imports. Start from [source-map.md](references/source-map.md).
3. Route deeper detail:
   - Install, engines, exports, null/empty handling: [setup-core.md](references/setup-core.md).
   - Named API, naive pattern, `getPattern` cache: [api.md](references/api.md).
   - Custom regex / list filters (Lighthouse, extras): [custom-patterns.md](references/custom-patterns.md).
   - Framework recipes, analytics, cache, pixels: [integrations.md](references/integrations.md).
   - What it cannot do, anti-patterns, v3–v6: [pitfalls-migration.md](references/pitfalls-migration.md).
4. Prefer **`bun` / `bunx`** in command examples.
5. Verify with typecheck plus UA fixtures (known bot, known browser, missing header, custom list).

## Library Decision Tree

```
Need to flag self-declared crawlers / HTTP clients / preview bots from User-Agent?
  → isbot (this skill). Prefer isBot(ua).

Need to verify Googlebot / Bingbot identity (not spoofed UA)?
  → isBot as a cheap prefilter, then reverse DNS (or provider IP lists). Never whitelist on UA alone.

Need to catch stealth scrapers, residential-proxy bots, or browser-impersonating clients?
  → isbot will not help. Use rate limits, WAF, TLS/JA3, CAPTCHA, behaviour — not this package.

Need a tiny/fast heuristic and can accept false positives (e.g. "http" in UA)?
  → isBotNaive, or accept getPattern() fallback on engines without lookbehind.

Need to treat Lighthouse / Cypress as humans for product analytics?
  → createIsBotFromList after removing those pattern parts. Do not fork the default isBot in-place.
```

## Core Judgment

- **Scope is honest User-Agents only.** isbot matches "good bots" that volunteer a distinctive UA. It does **not** detect disguised scrapers.
- **Do not cloak.** Do not serve different primary HTML to Googlebot than to users. Allowed: skip analytics pixels, prefer cache, flag pageviews.
- **Do not whitelist on UA.** Confirm crawler identity with reverse DNS or official IP ranges.
- **Named camelCase API** (`isBot`, `createIsBotFromList`, `findBotMatch`, …). Legacy `isbot` / `isbotMatch` still work in 5.2.x; they are scheduled to drop in **v6**.
- **`isBot(null | undefined | "")` is `false`.** Pass header values through as-is. Missing UA is not a bot.
- **Hot path = `isBot` only.** `findBotMatches` / `findBotPatterns` compile one `RegExp` per list part — debug/audit, not every request.
- **`getPattern()` is lazy and cached.** Engines that reject lookbehind fall back to the naive pattern (~1% false positive, ~75% bot coverage).
- **`list` entries are regex fragments**, not literal strings. Escape custom tokens before `createIsBotFromList`.
- HTTP clients (**axios**, **undici**, **Postman**, **Cypress**, curl-like UAs) typically match as bots. That is intended.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls isbot` — confirm **5.x** (and 5.2+ if using camelCase-only guidance).
- Typecheck: `isBot(headers.get("User-Agent"))` accepts `string | null`.
- Fixtures: Googlebot → `true`; desktop Chrome → `false`; `undefined`/`null`/`""` → `false`.
- Custom list: extra token matches; removed Lighthouse patterns no longer match those UAs.
- Debug helpers: `findBotMatch` / `findBotPattern` explain a surprising `true`.
- If using reverse DNS for claimed Googlebot/Bingbot, assert both UA match **and** verified hostname.

Report which checks ran, which did not, and version/export-name assumptions that remain.
