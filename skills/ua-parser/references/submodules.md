# Detection Submodules

All of these exist on OSS v2 **and** PRO. Import from the project package root (`ua-parser-js/...` or `@ua-parser-js/pro-business/...`).

Since **2.0.7**, helpers that are not `isFrozenUA` moved out of `helpers`. Do not import `isBot` / `isChromeFamily` / `getDeviceVendor` from `helpers` on 2.0.7+.

## `helpers`

```ts
import { isFrozenUA } from "ua-parser-js/helpers";
```

| Function | Signature | Notes |
| --- | --- | --- |
| `isFrozenUA` | `(ua: string) => boolean` | Chromium reduced-UA pattern. See [client-hints-features.md](client-hints-features.md). |
| `getOutlookEdition` | (since 2.0.8) | Maps Outlook version numbers to marketing edition names. |

Deprecated in helpers (moved):

| Old (`helpers`) | New module |
| --- | --- |
| `getDeviceVendor`, `isAppleSilicon` | `device-detection` |
| `isAIBot`, `isBot` | `bot-detection` (`isAIBot` split into `isAICrawler` + `isAIAssistant`) |
| `isChromeFamily`, `isElectron`, `isFromEU`, `isStandalonePWA` | `browser-detection` |

## `bot-detection`

Works on a **raw UA string or `IResult`**. Does not require extensions, but pairing with `Bots` / `Crawlers` / `Fetchers` fills `browser.name`.

```ts
import { isAIAssistant, isAICrawler, isBot } from "ua-parser-js/bot-detection";
```

| Function | Meaning |
| --- | --- |
| `isBot(ua)` | Automated client (crawler, fetcher, CLI, library, …) |
| `isAICrawler(ua)` | AI bot that crawls **on its own** to collect data (GPTBot, OAI-SearchBot, …) |
| `isAIAssistant(ua)` | AI bot acting **for a user** (ChatGPT-User, Claude-User, …) |

```ts
import { UAParser } from "ua-parser-js";
import { Bots } from "ua-parser-js/extensions";
import { isAIAssistant, isAICrawler, isBot } from "ua-parser-js/bot-detection";

const result = UAParser(Bots, req.headers);

if (isBot(result)) {
  if (isAICrawler(result)) {
    // training / search crawler — robots.txt / allowlist policy
  } else if (isAIAssistant(result)) {
    // user-initiated fetch — often preview / browse
  }
}
```

`isBot(firefox)` → false; `isBot(AhrefsBot)` → true and `isAICrawler` → false.

## `browser-detection`

```ts
import {
  isChromeFamily,
  isElectron,
  isFromEU,
  isStandalonePWA,
} from "ua-parser-js/browser-detection";
```

| Function | Input | Environment | Meaning |
| --- | --- | --- | --- |
| `isChromeFamily` | `IResult \| string` | Any | Blink / Chromium-family **browser** (new Edge, Opera, Vivaldi, Brave, Arc, Chrome, …). Firefox/Safari → false. |
| `isElectron` | none | **Browser / Electron** | Current window is Electron |
| `isFromEU` | none | **Browser** | Timezone maps to an EU country (`detect-europe-js`). Not an IP geolocation API. |
| `isStandalonePWA` | none | **Browser** | Display-mode standalone PWA (`is-standalone-pwa`) |

`isChromeFamily` is **not** `browser.name === "Chrome"`. Use it for "Chromium engine + Chrome-like client" decisions (polyfills, Client Hints availability, `chrome://` assumptions).

`isFromEU` / `isStandalonePWA` / `isElectron` without a window are the wrong tool on a Node parser of `req.headers`.

## `device-detection`

```ts
import { getDeviceVendor, isAppleSilicon } from "ua-parser-js/device-detection";
```

| Function | Meaning |
| --- | --- |
| `getDeviceVendor(model)` | Guess vendor from a model string: `SM-A605G` → Samsung, `Redmi Note 8` → Xiaomi, `Nexus 6P` → Huawei, `Quest 3` → Facebook, `AQUOS-TVX19B` → Sharp. Returns `string \| undefined`. |
| `isAppleSilicon(resultOrUA)` | Apple Silicon Mac properties (ARM Mac, not "any Apple device"). |

Use `getDeviceVendor` when `device.vendor` is empty but `device.model` is present (common with odd Android strings).

## Combining with enums

```ts
import { BrowserType } from "ua-parser-js/enums";
import { Crawlers } from "ua-parser-js/extensions";

const type = new UAParser(Crawlers)
  .setUA(req.headers["user-agent"] ?? "")
  .getBrowser().type;

if (type === BrowserType.CRAWLER) {
  // named crawler
}
```

Boolean `isBot()` can still be true when `browser.type` is unset (no extension loaded). Load extensions when the product stores `browser.type` / `browser.name`.
