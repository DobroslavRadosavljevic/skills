# Setup and Core Concepts

## Install

```bash
bun add isbot
```

No runtime dependencies. Types ship with the package — do not add `@types/isbot`.

Requires **Node.js ≥ 18** (`engines`). Browser ESM/CJS builds are published; jsDelivr UMD/ESM for script tags.

Package `"sideEffects": false` — tree-shaking named imports is safe.

## Package identity

| Item | Value |
| --- | --- |
| npm name | `isbot` (not `is-bot`) |
| Skill folder | `is-bot` |
| Preferred import | `{ isBot }` from `"isbot"` |
| Current major | **5** (snapshot **5.2.1**) |

## Imports

Prefer camelCase names added in **5.2.0**. Both names are exported until v6.

```ts
import { isBot } from "isbot";

isBot(request.headers.get("User-Agent"));
```

Legacy (still valid in 5.2.x):

```ts
import { isbot } from "isbot";
```

There is **no default export** since v4:

```ts
import isbot from "isbot"; // wrong on v4+
```

CJS:

```js
const { isBot } = require("isbot");
```

### CDN

jsDelivr `jsdelivr` field points at `browser.global.js` (UMD). README:

ESM (named):

```html
<script type="module">
  import { isBot } from "https://cdn.jsdelivr.net/npm/isbot@5/+esm";
  isBot(navigator.userAgent);
</script>
```

UMD (global **`isbot`**, legacy name — `src/browser.ts` defines `globalThis.isbot`):

```html
<script src="https://cdn.jsdelivr.net/npm/isbot@5"></script>
<script>
  isbot(navigator.userAgent);
</script>
```

Pin a major (`@5`) or exact version in production CDNs.

## Package exports (5.2.1)

| Condition | File |
| --- | --- |
| `import` (node/browser) | `index.mjs` |
| `require` | `index.js` |
| types | `index.d.ts` |
| jsDelivr | `browser.global.js` |
| `./package.json` | exported |

`"type": "commonjs"` with dual ESM via `exports`.

## What a "bot" means here

From the project definitions:

- **Bot** — autonomous program imitating or replacing human behaviour, usually faster/repetitive.
- **Good bot** — crawlers, scrapers that identify themselves, preview builders, stress testers, monitors.
- **Bad bot** — credential stuffing, DDoS, spam, stealth impersonation.

**isbot only targets good bots** that set a distinctive User-Agent. It does not classify malice, and it does not pierce fake browser UAs.

## Input contract

```ts
declare function isBot(userAgent?: string | null): boolean;
```

Implementation (`isNonEmptyString` since **5.1.37**):

```ts
typeof value === "string" && value !== "";
```

| Input | Result |
| --- | --- |
| Distinctive crawler UA | `true` |
| Typical desktop/mobile browser UA | `false` |
| `undefined` (missing header) | `false` |
| `null` (`headers.get` miss) | `false` |
| `""` | `false` |
| Non-string | `false` (not coerced since the empty-string check) |

Pass header values through. Do not `String(ua)` first. Do not treat a missing UA as a bot unless the product adds its own policy **after** `isBot`.

`null` accepted since **4.2.0** (`Headers#get`). `undefined` accepted since **4.3.0** (`req.headers["user-agent"]`).

## Matching model

1. `list` — array of regex **fragments** (from `patterns.json`).
2. Build-time `fullPattern` string joins those fragments (with lookbehind where needed).
3. `getPattern()` does `new RegExp(fullPattern, "i")` once, caches it.
4. `isBot(ua)` is `getPattern().test(ua)` after the non-empty-string guard.

Lookbehind is used to avoid false positives (example from changelog: `"bot"` as a standalone word/suffix, excluding **Cubot**). Engines that throw on lookbehind syntax catch in `getPattern()` and permanently cache the **naive** regex instead.

Naive regex (also used by `isBotNaive`):

```ts
/bot|crawl|http|lighthouse|scan|search|spider/i
```

Fallback accuracy quoted in the README: about **1% false positives** and **75% bot coverage**. Do not rely on lookbehind behaviour in very old browsers; Node 18+ is fine.

## Intended uses (from upstream)

- Flag pageviews for **business analytics** (exclude crawlers from human metrics).
- Prefer **cached** responses for crawlers to relieve origin load.
- **Omit** third-party tags/pixels for crawlers to cut cost.

Not intended:

- Serving different **content** to Googlebot (cloaking).
- Access control / allowlists based on UA.
- Blocking stealth bots.
