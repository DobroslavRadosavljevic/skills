# Client Hints, Feature Check, Frozen UA

Chromium reduced (frozen) User-Agent strings hide model, exact OS version, and often architecture. UAParser.js v2 reads **User-Agent Client Hints** to recover that data.

## When Client Hints exist

- Chromium 85+ (Chrome, Edge, Opera, Brave, Arc, …).
- **Secure context only**: `https://`, `http://localhost`, `http://127.0.0.1`, `file://`.
- Safari and Firefox **do not** send Client Hints (privacy). UA-only parse is the whole story there.

Low-entropy hints may appear by default (`Sec-CH-UA`, `Sec-CH-UA-Mobile`, `Sec-CH-UA-Platform`). High-entropy hints (model, full version, arch, bitness, form factors, platform version) require the server to **ask**.

## Server: request high-entropy hints

On the **response** of the first visit, advertise:

```ts
const hints =
  "Sec-CH-UA-Full-Version-List, Sec-CH-UA-Mobile, Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Form-Factors";

res.setHeader("Accept-CH", hints);
res.setHeader("Critical-CH", hints);
```

`Critical-CH` makes Chromium retry the request with those headers (extra round trip). First request is often still UA-only — detection must tolerate that.

Pass the **whole headers object**, then call `withClientHints()`:

```ts
import { UAParser } from "ua-parser-js";

const uaOnly = UAParser(req.headers);
// e.g. os.name "Linux", device.model undefined  (frozen desktop UA on Android)

const enriched = UAParser(req.headers).withClientHints();
// os.name "Android", device.type "mobile", device.model from Sec-CH-UA-Model
```

Slice-level:

```ts
const browser = await new UAParser(req.headers).getBrowser().withClientHints();
```

On Node, `withClientHints()` usually returns a **plain object** (not a Promise). Still `await` it so browser and server code share one path.

Headers of interest: `user-agent`, `sec-ch-ua`, `sec-ch-ua-full-version-list`, `sec-ch-ua-mobile`, `sec-ch-ua-model`, `sec-ch-ua-platform`, `sec-ch-ua-platform-version`, `sec-ch-ua-arch`, `sec-ch-ua-bitness`, `sec-ch-ua-form-factors`.

2.0.10 caps Client Hints input length (ReDoS fix GHSA-9h5v-pfqq-x599).

## Browser: async hints

```ts
const ua = new UAParser();

const fromUa = ua.getBrowser();
const fromHints = await ua.getBrowser().withClientHints();
```

Without `await` / `.then()`, Chromium returns a Promise and logs/serialization look wrong.

Non-Chromium browsers: `withClientHints()` returns the UA-based object synchronously.

## Frozen UA helper

```ts
import { isFrozenUA } from "ua-parser-js/helpers";

isFrozenUA(
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.0.0 Mobile Safari/537.36",
); // true — model replaced by "K", Chrome patch .0.0.0

isFrozenUA(
  "Mozilla/5.0 (Linux; Android 9; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.1234.56 Mobile Safari/537.36",
); // false
```

Frozen pattern tokens (Chromium reduction):

| Token | Desktop examples | Mobile |
| --- | --- | --- |
| unified platform | `Windows NT 10.0; Win64; x64`, `Macintosh; Intel Mac OS X 10_15_7`, `X11; Linux x86_64`, CrOS, Fuchsia | `Linux; Android 10; K` |
| deviceCompat | empty | `Mobile` |

If `isFrozenUA(ua)` is true and Client Hints are missing, **do not trust** `device.model` / detailed OS version.

## `withFeatureCheck()` (browser only)

Refines UA-based results using runtime APIs. **Do not use on the server.**

| Check | What it fixes |
| --- | --- |
| `navigator.isBrave` | Brave otherwise looks like Chrome |
| `navigator.standalone` + `navigator.maxTouchPoints` | iPad requesting desktop site reports as Macintosh |

```ts
const naive = UAParser();
// iPad desktop-mode: { vendor: "Apple", model: "Macintosh", type: undefined }

const fixed = await UAParser().withFeatureCheck();
// { vendor: "Apple", model: "iPad", type: "tablet" }
```

Chain with hints when both apply:

```ts
const result = await UAParser().withClientHints().withFeatureCheck();
```

(Chaining both exists since 2.0.7.)

## Practical policy

```
Chromium + HTTPS?
  → Accept-CH / Critical-CH on server, always withClientHints()
  → isFrozenUA() to explain residual gaps

Safari / Firefox / old browsers?
  → UA only; document uncertainty on model / Android version

Need Brave vs Chrome, or real iPad vs Mac in the client app?
  → withFeatureCheck() in the browser

Need bots / AI crawlers?
  → extensions + bot-detection (Client Hints do not replace that)
```
