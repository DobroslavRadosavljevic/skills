# Packages and Licenses

UAParser.js ships as **one detection library** under several licenses. v2 OSS and all PRO packages expose the same API (constructor, `get*`, Client Hints, extensions, enums, helpers). The SKU only changes **legal terms**, **npm name**, and **support**.

## Editions (2.0.10)

| Edition | npm package | License | Commercial proprietary use | Copyleft | End-products / deployments | Support | Price |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OSS v1 | `ua-parser-js@1` | MIT | Yes | No | Unlimited | Community | Free |
| OSS v2 | `ua-parser-js@2` | AGPL-3.0-or-later | Yes, **if** AGPL obligations are met | Yes | Unlimited | Community | Free |
| PRO Personal | `@ua-parser-js/pro-personal` | Proprietary | **No** (non-commercial only) | No | Unlimited | 1 year + lifetime updates | $14 one-time |
| PRO Business | `@ua-parser-js/pro-business` | Proprietary | Yes — **1 project**, 1 deliverable or 1 TLD | No | Limited | 1 year + lifetime updates | $29 one-time |
| PRO Enterprise | `@ua-parser-js/pro-enterprise` | Proprietary | Yes — unlimited products | No | Unlimited | 1 year + lifetime updates | $599 one-time |

Feature flags vs v1 MIT (⚠️ = basic / incomplete vs v2):

| Capability | v1 MIT | v2 AGPL | PRO Personal/Business/Enterprise |
| --- | --- | --- | --- |
| Browser / CPU / device / engine / OS | ⚠️ | Yes | Yes |
| Enhanced accuracy, bots, AI, extras (apps, libs, emails, players, crawlers) | No | Yes | Yes |
| Client Hints | No | Yes | Yes |
| CommonJS | Yes | Yes | Yes |
| ESM + bundled TypeScript | Community types | Yes | Yes |
| Permissive (non-copyleft) | Yes | No | Yes |

Do **not** treat PRO as a feature upgrade over AGPL v2. Buy PRO to **avoid AGPL** (or to get vendor support), not to unlock APIs.

## Choose a SKU

- **AGPL v2 OSS** — open-source apps that can release under AGPL, or orgs that accept copyleft for this dependency.
- **PRO Personal** — personal, non-commercial work. Docs: commercial use **not** allowed.
- **PRO Business** — one commercial product. Extra products or extra TLDs need another license. Clients receiving a built product may use the code only as part of that product; they must not extract the library.
- **PRO Enterprise** — many products, white-label, unlimited deployments.
- **Stay on v1 MIT** — only when AGPL is unacceptable **and** PRO will not be purchased. Expect weaker device/browser data and no Client Hints / extensions.

Purchase PRO via https://store.faisalman.com (Lemon Squeezy). After purchase, install the scoped package. Custom licensing: support@uaparser.dev.

PRO packages are commercial software. Do not share the tarball, npm token, or source with unlicensed parties. A third party may use the code only as part of a product built by a valid licensee, when that license allows it.

## Install

```sh
# OSS v2 (AGPL)
bun add ua-parser-js

# Pin legacy MIT if the project must stay on v1
bun add ua-parser-js@1

# PRO (requires a purchased license)
bun add @ua-parser-js/pro-personal
bun add @ua-parser-js/pro-business
bun add @ua-parser-js/pro-enterprise
```

Keep a **single** package. Do not depend on both `ua-parser-js@2` and a PRO package.

Runtime dependencies (pulled in by v2 OSS and PRO): `detect-europe-js`, `is-standalone-pwa`, `ua-is-frozen`.

## Import roots

Replace the OSS root with the PRO package name. Subpath names stay the same.

```ts
// OSS v2
import { UAParser } from "ua-parser-js";
import { Crawlers, Bots } from "ua-parser-js/extensions";
import { BrowserType, DeviceType } from "ua-parser-js/enums";
import { isFrozenUA } from "ua-parser-js/helpers";
import { isBot, isAICrawler, isAIAssistant } from "ua-parser-js/bot-detection";
import { isChromeFamily, isElectron } from "ua-parser-js/browser-detection";
import { getDeviceVendor, isAppleSilicon } from "ua-parser-js/device-detection";

// PRO Business (same for pro-personal / pro-enterprise)
import { UAParser } from "@ua-parser-js/pro-business";
import { Crawlers, Bots } from "@ua-parser-js/pro-business/extensions";
import { isFrozenUA } from "@ua-parser-js/pro-business/helpers";
```

CommonJS:

```js
const UAParser = require("ua-parser-js");
// PRO: require("@ua-parser-js/pro-business")
```

HTML / CDN (global `UAParser`, typically OSS dist — still AGPL for v2):

```html
<script src="https://cdn.jsdelivr.net/npm/ua-parser-js/dist/ua-parser.min.js"></script>
```

Packed build: `dist/ua-parser.pack.js`. Package `browser` field: `dist/ua-parser.pack.js`.

## Package exports (v2.0.10)

| Subpath | Role |
| --- | --- |
| `.` | `UAParser` class/function + result types |
| `./extensions` | `Bots`, `Crawlers`, `CLIs`, `Emails`, `ExtraDevices`, `Fetchers`, `InApps`, `Libraries`, `MediaPlayers`, `Vehicles` |
| `./enums` | `BrowserName`, `BrowserType`, `CPUArch`, `DeviceType`, `DeviceVendor`, `EngineName`, `OSName`, `Extension` |
| `./helpers` | `isFrozenUA` (plus `getOutlookEdition` since 2.0.8) |
| `./bot-detection` | `isBot`, `isAICrawler`, `isAIAssistant` |
| `./browser-detection` | `isChromeFamily`, `isElectron`, `isFromEU`, `isStandalonePWA` |
| `./device-detection` | `getDeviceVendor`, `isAppleSilicon` |

`sideEffects: false`. `bin`: `script/cli.js`. `engines.node`: `*`.

## CLI

```sh
bunx ua-parser-js "Mozilla/5.0 ..."
bunx ua-parser-js --input-file log.txt --output-file log-result.json
```

`--input-file`: one User-Agent per line. `--output-file`: JSON results. Redirect also works: `bunx ua-parser-js "..." >> log.txt`.

## Managed REST API

Skip installing the library: managed User-Agent API powered by UAParser.js (RESTCountries partnership).

```sh
curl https://api.restcountries.com/user-agent/v1 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "User-Agent: Mozilla/5.0 ..."
```

Use this for non-JS stacks or when the team does not want to ship/update the parser. Prefer the npm package inside TypeScript/JavaScript apps. Details: https://docs.uaparser.dev/intro/rest-api.html and https://uaparser.dev/#rest-api.

## Migrating OSS → PRO

1. Purchase the matching SKU.
2. `bun remove ua-parser-js` then `bun add @ua-parser-js/pro-<sku>`.
3. Rewrite imports: `'ua-parser-js'` → `'@ua-parser-js/pro-<sku>'`, and every `/extensions` `/enums` `/helpers` `/bot-detection` `/browser-detection` `/device-detection` subpath.
4. Leave call sites unchanged (`UAParser`, `getResult`, extensions).
