# Setup and Core Usage

Examples use `ua-parser-js`. Swap the specifier for `@ua-parser-js/pro-personal` / `pro-business` / `pro-enterprise` when that is the project package.

## ESM vs CommonJS vs script tag

```ts
import { UAParser } from "ua-parser-js";
```

```js
const UAParser = require("ua-parser-js");
```

```html
<script src="ua-parser.min.js"></script>
<script>
  const parser = new UAParser();
</script>
```

v2 ships dual ESM (`.mjs`) and CJS (`.js`) plus bundled `.d.ts`. v1 is CJS-first; community `@types/ua-parser-js` may appear on old trees — v2 does not need it.

## Constructor vs function

- `new UAParser(...)` → instance (`getBrowser()`, `setUA()`, `useExtension()`, …).
- `UAParser(...)` without `new` → `IResult` (same as `new UAParser(...).getResult()`).

Browser: if no UA string is passed, the parser reads `window.navigator.userAgent`.
Server: always pass the UA string and/or request headers. There is no ambient UA.

## Argument overloads

Accepted combinations (class and function):

```ts
UAParser();
UAParser(uastring: string);
UAParser(extensions: UAParserExt);
UAParser(headers: UAParserHeaders);
UAParser(uastring: string, extensions: UAParserExt);
UAParser(uastring: string, headers: UAParserHeaders);
UAParser(extensions: UAParserExt, headers: UAParserHeaders);
UAParser(uastring: string, extensions: UAParserExt, headers: UAParserHeaders);
```

`UAParserHeaders` is `Record<string, string | string[] | undefined> | Headers`.

Typical server patterns:

```ts
import { UAParser } from "ua-parser-js";
import { Bots } from "ua-parser-js/extensions";

const fromUa = UAParser(req.headers["user-agent"]);
const fromHeaders = UAParser(req.headers); // User-Agent + Sec-CH-UA-*
const botsPlusHeaders = UAParser(Bots, req.headers);
```

Do not pass a random object as the first argument and expect it to be treated as a UA string. Objects are headers or extensions.

## Instance methods

| Method | Returns | Notes |
| --- | --- | --- |
| `getUA()` | `string` | Current UA string |
| `setUA(ua)` | `UAParser` | Chainable; leading space trimmed (2.0.6+) |
| `getBrowser()` | `IBrowser` | `name`, `version`, `major`, `type` |
| `getCPU()` | `ICPU` | `architecture` |
| `getDevice()` | `IDevice` | `type`, `vendor`, `model` |
| `getEngine()` | `IEngine` | `name`, `version` |
| `getOS()` | `IOS` | `name`, `version` |
| `getResult()` | `IResult` | `{ ua, browser, cpu, device, engine, os }` |
| `useExtension(ext)` | `UAParser` | Chainable; added in **2.0.10** |

Static fields: `UAParser.VERSION`, plus `BROWSER` / `CPU` / `DEVICE` / `ENGINE` / `OS` property-name constants used when writing custom regex maps.

`UAParser.DEVICE` type constants: `console`, `mobile`, `smarttv`, `tablet`, `wearable`, `xr`, `embedded`. There is **no** `desktop` constant.

## Reuse vs one-shot

Batch-parse with one instance:

```ts
const parser = new UAParser();
for (const ua of lines) {
  const result = parser.setUA(ua).getResult();
}
```

One-shot:

```ts
const result = UAParser(ua);
```

## Length limit

Any User-Agent longer than **500** characters is trimmed (ReDoS mitigation). 2.0.10 also limits Client Hints input length (GHSA-9h5v-pfqq-x599). Do not assume the parser sees the full original header past those caps.

## TypeScript

```ts
import {
  UAParser,
  IResult,
  IBrowser,
  ICPU,
  IDevice,
  IEngine,
  IOS,
  UAParserExt,
  UAParserHeaders,
} from "ua-parser-js";
```

`IData<T>` (on every result slice and on `IResult`):

- `is(val: string): boolean`
- `toString(): string`
- `withClientHints(): PromiseLike<T> | T`
- `withFeatureCheck(): PromiseLike<T> | T`

Optional fields are `undefined` when undetected. Always null-check `name` / `type` / `vendor` / `model`.

## Browser vs server checklist

| | Browser | Node / Bun |
| --- | --- | --- |
| Default UA | `navigator.userAgent` | Must pass UA or headers |
| Client Hints | `await get*().withClientHints()` (Chromium, secure context) | Pass `req.headers`, then `.withClientHints()` |
| `withFeatureCheck()` | Yes (Brave, iPad) | No — skip |
| `isElectron` / `isFromEU` / `isStandalonePWA` | Window/timezone APIs | `isFromEU` / `isStandalonePWA` / `isElectron` are client-oriented |

## CDN / script

```html
<script src="https://cdn.jsdelivr.net/npm/ua-parser-js/dist/ua-parser.min.js"></script>
```

v2 CDN builds remain AGPL. Proprietary products that cannot comply should not load v2 from a CDN; use a PRO package instead.
