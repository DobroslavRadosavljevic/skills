# Results and API

Every `getBrowser()` / `getCPU()` / `getDevice()` / `getEngine()` / `getOS()` / `getResult()` value implements `IData`: `.is()`, `.toString()`, `.withClientHints()`, `.withFeatureCheck()`.

## IResult

```ts
{
  ua: string;       // original (possibly trimmed) UA
  browser: IBrowser;
  cpu: ICPU;
  device: IDevice;
  engine: IEngine;
  os: IOS;
}
```

Empty inner objects mean "no match", not an error.

## IBrowser

| Field | Meaning |
| --- | --- |
| `name?` | Browser or client name (`Chrome`, `Mobile Chrome`, `Safari`, `GPTBot` with extensions, …) |
| `version?` | Full version string |
| `major?` | Major version only |
| `type?` | Present when the UA is not a generic browser (see below) |

`type` values (`BrowserType` / docs):

| Value | Meaning | Examples |
| --- | --- | --- |
| `undefined` | Ordinary browser | Chrome, Firefox, Safari |
| `cli` | Text / CLI HTTP clients | cURL, Wget, Lynx, PowerShell |
| `crawler` | Indexing / scraping bots | Googlebot, GPTBot |
| `email` | Mail clients | Thunderbird, Outlook |
| `fetcher` | On-demand preview / user-agent bots | Twitterbot, ChatGPT-User, Slackbot |
| `inapp` | In-app WebView / embedded | Slack, Notion; WebView UA marked `inapp` since 2.0.10 |
| `mediaplayer` | Media apps | VLC |
| `library` | HTTP libraries | Axios, Scrapy, undici, Bun |

Most of these `type`s appear only after loading the matching **extension**. Default parse of Chrome stays `type: undefined`.

v2 name changes vs v1: mobile Chrome → `Mobile Chrome`; mobile Firefox → `Mobile Firefox`.

## ICPU

`architecture?` — e.g. `amd64`, `arm`, `arm64`, `ia32`. Compare with `CPUArch` + `.is()`, not ad-hoc strings.

## IDevice

| Field | Meaning |
| --- | --- |
| `type?` | `mobile`, `tablet`, `smarttv`, `wearable`, `console`, `embedded`, `xr` |
| `vendor?` | Manufacturer (`Apple`, `Samsung`, …) |
| `model?` | Model id or marketing name (`SM-X706B`, `iPhone`) |

**Desktop / laptop: `type` is `undefined`.** Do not expect `"desktop"`. `DeviceType.DESKTOP` was removed from the enum (2.0.10). `undefined` can also mean "could not classify" — combine with bot checks before treating traffic as a desktop human.

XR (AR/VR) uses `type: "xr"` (`DeviceType.XR`), not a vendor-only guess.

## IEngine / IOS

Engine: `name?` (`Blink`, `Gecko`, `WebKit`, `Trident`, …) + `version?`.
OS: `name?` + `version?`. v2 normalizes `Mac OS` → `macOS`, `Chromium OS` → `Chrome OS`.

## `.is(value)`

Case-insensitive match against **any** property on that slice.

- Device order: `type`, then `model`, then `vendor`. `device.is("mobile")`, `device.is("Lumia 635")`, and `device.is("Nokia")` can all be true.
- Browser: a trailing `"Browser"` is ignored (`QQ Browser` == `QQ`).
- OS: a trailing `"OS"` is ignored (`Mac OS` == `Mac`).
- Prefer enums: `engine.is(EngineName.BLINK)`, `device.is(DeviceType.MOBILE)`.

Do not use `.is()` as a substitute for checking a specific field when collisions matter (a model string that equals a vendor name).

## `.toString()`

| Slice | Pattern | Example |
| --- | --- | --- |
| browser | `name` + `version` | `Chrome 103.0.0.0` |
| cpu | `architecture` | `arm64` |
| device | `vendor` + `model` | `Samsung SM-X706B` |
| engine | `name` + `version` | `Blink 103.0.0.0` |
| os | `name` + `version` | `Android 12` |

Useful for logs. Do not parse `.toString()` back into fields.

## Minimal parse

```ts
import { UAParser } from "ua-parser-js";
import { DeviceType, EngineName } from "ua-parser-js/enums";

const { browser, device, os, engine } = UAParser(ua);

if (device.is(DeviceType.MOBILE) && !os.is("iOS")) {
  // Android (or other) phone
}

if (engine.is(EngineName.BLINK)) {
  // Chromium family engine — not necessarily Google Chrome
}

browser.toString(); // "Mobile Chrome 124.0.0.0"
```
