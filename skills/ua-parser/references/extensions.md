# Extensions

Default UAParser.js detects browsers, engines, OS, CPU, and devices. **Bots, CLI tools, email clients, HTTP libraries, in-app WebViews, media players, extra/rare devices, and vehicles need an extension pack.**

Load packs from `<pkg>/extensions` (`ua-parser-js/extensions` or `@ua-parser-js/pro-*/extensions`).

## Built-in packs

| Export | Detects | Sets `browser.type` (typical) |
| --- | --- | --- |
| `Crawlers` | Indexing / AI training crawlers (Googlebot, GPTBot, ClaudeBot, …) | `crawler` |
| `Fetchers` | On-demand fetchers / preview bots (ChatGPT-User, Slackbot, Twitterbot, Lighthouse) | `fetcher` |
| `CLIs` | curl, wget, httpie, Lynx, PowerShell, Elinks | `cli` |
| `Libraries` | Axios, undici, Python Requests, OkHttp, Bun, Deno, Scrapy, … | `library` |
| `Bots` | Union of `CLIs` + `Crawlers` + `Fetchers` + `Libraries`, **preserving each type** | mixed |
| `Emails` | Thunderbird, Outlook, Apple Mail, Proton Mail, … | `email` |
| `InApps` | Slack, Discord, Notion, Teams, VS Code, Figma, Postman, TikTok Lite, … | `inapp` |
| `MediaPlayers` | Music/video/radio apps (VLC, etc.) | `mediaplayer` |
| `ExtraDevices` | Rare / legacy devices still in the wild | device fields |
| `Vehicles` | In-car browsers: BMW, BYD, Jeep, Rivian, Tesla, Volvo | device vendor/model |

Docs CSV sometimes writes `Mediaplayers`; import the **`MediaPlayers`** identifier from the dedicated docs page.

`Bots` is the default choice for "is this automated traffic, and what kind?" when crawlers, fetchers, CLIs, and libraries all matter. Prefer specific packs when the product only cares about one class (e.g. `Crawlers` for SEO, `Emails` for pixel tracking).

## Apply extensions

Constructor (preferred for a dedicated parser):

```ts
import { UAParser } from "ua-parser-js";
import { Emails, Crawlers, Fetchers } from "ua-parser-js/extensions";

const emailParser = new UAParser(Emails);
const many = new UAParser([Emails, Crawlers, Fetchers]);
```

After construction (**2.0.10+**):

```ts
import { CLIs } from "ua-parser-js/extensions";

const uap = new UAParser();
uap.setUA(powershellUa);
uap.getBrowser().name; // undefined
uap.useExtension(CLIs);
uap.getBrowser().name; // "PowerShell"
```

Merge regex maps manually:

```ts
const botParser = new UAParser({
  browser: [...Crawlers.browser, ...CLIs.browser],
});
```

Function form with headers:

```ts
const result = UAParser(Bots, req.headers);
```

## What extensions change

Without `Crawlers`, a GPTBot UA may look like a generic WebKit/Chrome-like client (or mostly empty). With `Crawlers`:

```ts
import { Crawlers } from "ua-parser-js/extensions";

const ua =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)";
const browser = new UAParser(Crawlers).setUA(ua).getBrowser();
// { name: "GPTBot", type: "crawler", version: "1.0", major: "1" }
```

Boolean helpers in `bot-detection` can classify a raw string without naming it; extensions are required to fill `browser.name` / `browser.type` for those clients.

## Custom regex maps

Custom entries run **before** built-in regexes.

Shape: `Partial<Record<'browser' | 'cpu' | 'device' | 'engine' | 'os', RegexMap>>` or an array of those objects.

```ts
const myBrowsers = [
  [
    /(mybrowser)\/([\w\.]+)/i,
  ],
  [
    UAParser.BROWSER.NAME,
    UAParser.BROWSER.VERSION,
    [UAParser.BROWSER.TYPE, "bot"],
  ],
];

const parser = new UAParser({ browser: myBrowsers });
parser.setUA("Mozilla/5.0 MyBrowser/1.3").getBrowser();
// { name: "MyBrowser", version: "1.3", major: "1", type: "bot" }
```

Device example with a fixed type:

```ts
const myDevices = [
  [/(mytab) ([\w ]+)/i],
  [
    UAParser.DEVICE.VENDOR,
    UAParser.DEVICE.MODEL,
    [UAParser.DEVICE.TYPE, UAParser.DEVICE.TABLET],
  ],
  [/(myphone)/i],
  [UAParser.DEVICE.VENDOR, [UAParser.DEVICE.TYPE, UAParser.DEVICE.MOBILE]],
];
```

Capture groups map to listed fields in order. `[field, constant]` writes a literal (type/vendor/name).

## AI vs human-driven bots (with extensions)

Use extensions **and** `bot-detection`:

| UA example | `isBot` | `isAICrawler` | `isAIAssistant` | Typical extension name |
| --- | --- | --- | --- | --- |
| Firefox | false | false | false | (none) |
| AhrefsBot | true | false | false | crawler |
| OAI-SearchBot / GPTBot | true | true | false | crawler |
| ChatGPT-User | true | false | true | fetcher |

See [submodules.md](submodules.md) for helper signatures and [enums.md](enums.md) for `Extension.BrowserName.*` constants (GPTBot, ChatGPT-User, …).
