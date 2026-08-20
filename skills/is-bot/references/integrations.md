# Integrations

Extract the User-Agent **once** per request. Pass `string | null | undefined` straight into `isBot`.

```ts
import { isBot } from "isbot";
```

## Fetch / Web `Request` (WinterCG, Cloudflare, Bun, Deno)

```ts
isBot(request.headers.get("User-Agent"));
```

Header names are case-insensitive. `get` returns `null` when missing — valid input.

## Node `http` / `IncomingMessage`

```ts
isBot(request.headers["user-agent"]);
```

Node lower-cases incoming header names. Value is `string | string[] | undefined`. If the type is an array, join or take `[0]` before calling; `isBot` will return `false` for a non-string array.

`ServerResponse` / HTTP/2: `request.getHeader?.("user-agent")` may return `number | string | string[]`. Normalize to a string first only when the runtime type is not `string`.

## Express

```ts
isBot(req.get("user-agent"));
```

`req.get` returns `string | undefined`.

## Fastify

```ts
isBot(request.headers["user-agent"]);
```

## Hono

```ts
isBot(c.req.header("User-Agent"));
```

## Elysia

```ts
isBot(request.headers.get("user-agent"));
```

Or from derived context if the app already copies headers.

## TanStack Start / Router server functions

Use the incoming `Request`:

```ts
export const beforeLoad = async ({ request }: { request: Request }) => ({
  isBot: isBot(request.headers.get("User-Agent")),
});
```

Do not run `isBot(navigator.userAgent)` in SSR HTML for **request** classification — that is the server’s identity, not the client’s. Browser `navigator.userAgent` is only for client-side beacons.

## Next.js (App Router)

```ts
import { headers } from "next/headers";
import { isBot } from "isbot";

const ua = (await headers()).get("user-agent");
const bot = isBot(ua);
```

Middleware:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBot } from "isbot";

export function middleware(request: NextRequest) {
  const bot = isBot(request.headers.get("user-agent"));
  const response = NextResponse.next();
  response.headers.set("x-is-bot", bot ? "1" : "0");
  return response;
}
```

Use the header as a **hint** for cache/analytics, not as an authorization gate.

## Browser

```ts
isBot(navigator.userAgent);
```

Client-side detection cannot see the original request UA if a gateway rewrote it. Prefer server classification for analytics and cache.

`navigator.userAgentData` / Client Hints are **not** inputs to isbot. Do not concatenate brands into a fake UA.

## Analytics: exclude bots from human metrics

```ts
if (!isBot(ua)) {
  capturePageview();
}
```

Keep a parallel `bot_pageview` event if crawler volume matters (SEO monitoring). Do not drop logs entirely — ops still need probe/crawler traces.

## Cache / origin offload

Prefer CDN/edge cache for `isBot === true` GET/HEAD of public pages. Do not skip cache for personalized HTML based on UA alone.

Safe pattern: public marketing pages, feeds, sitemaps, OG endpoints.

Unsafe pattern: different **body** for Googlebot vs users (cloaking). Same HTML; optional skip of non-content third parties.

## Skip pixels and A/B SDKs

```ts
if (!isBot(ua)) {
  loadTagManager();
}
```

Reduces vendor cost and noise. Keep **first-party** content identical.

## Logging / tracing

```ts
logger.info("request", {
  isBot: isBot(ua),
  botMatch: isBot(ua) ? findBotMatch(ua) : undefined,
});
```

Call `findBotMatch` only when `isBot` is true (or at debug level). Never `findBotPatterns` on the hot path.

## Verifying claimed search crawlers

isbot README: do **not** whitelist by UA. After `isBot(ua)` (or a Googlebot-specific regex), confirm identity:

1. Reverse DNS on the client IP (e.g. `*.googlebot.com` / `*.google.com`).
2. Forward-confirm that hostname resolves back to the same IP.
3. Or use the search engine’s published IP / `/.well-known` crawler lists.

The README points at [`reverse-dns-lookup`](https://www.npmjs.com/package/reverse-dns-lookup) as one option. That package is separate; pin and review it independently.

Use verification only when the decision is security-sensitive (rate-limit bypass, extra crawl budget, preview of `noindex` resources). For “skip Mixpanel on Googlebot”, `isBot` alone is usually enough.

## Combining with bot-management products

isbot is a **UA regex**. Cloudflare Bot Fight, AWS WAF Bot Control, Fingerprint, and TLS impersonation checks are different layers. Combine as:

```
edge bot score / WAF  →  (optional) isBot(ua) for “self-declared”  →  app policy
```

Do not replace WAF with isbot. Do not expect isbot to agree with a JA3/fingerprint “bot” score — stealth clients look human to isbot.

## Tests

```ts
import { isBot } from "isbot";
import { expect, test } from "vitest";

const googlebot =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const chrome =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

test("classifies fixtures", () => {
  expect(isBot(googlebot)).toBe(true);
  expect(isBot(chrome)).toBe(false);
  expect(isBot(undefined)).toBe(false);
  expect(isBot(null)).toBe(false);
  expect(isBot("")).toBe(false);
});
```

Add one fixture per custom `createIsBotFromList` rule. When upgrading `isbot`, re-run fixtures — pattern patches can flip edge UAs.
