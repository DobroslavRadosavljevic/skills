# Pitfalls and Migration

## License (the usual production bug)

Shipping **`ua-parser-js@2`** inside a closed-source commercial app **without** AGPL compliance is a legal problem. Fix: buy **PRO** and switch the import root, or stay on **v1 MIT** (weaker parser), or open the combined work under AGPL.

PRO Personal is **not** a cheap commercial license — commercial use is disallowed. Commercial proprietary → Business or Enterprise.

Do not mix `ua-parser-js@2` and `@ua-parser-js/pro-*` in one lockfile.

## v1 / 0.7 → v2

Install: `bun add ua-parser-js@latest` (or a PRO package).

Breaking detection names:

| v1 | v2 |
| --- | --- |
| Chrome on mobile | `Mobile Chrome` |
| Firefox on mobile | `Mobile Firefox` |
| `Mac OS` | `macOS` |
| `Chromium OS` | `Chrome OS` |

API additions (not in v1): ESM named `import { UAParser }`, `useExtension()`, `withClientHints()`, `withFeatureCheck()`, `.is()`, `.toString()`, `browser.type`, `ua-parser-js/extensions|enums|helpers|bot-detection|browser-detection|device-detection`, CLI, XR `device.type`.

v1 CJS `var parser = new UAParser(); parser.getResult();` still works on v2. Prefer ESM named imports in new code.

Remove `@types/ua-parser-js` when on v2 (bundled types). Enum identifiers from ≤2.0.4 (`Browser`, `CPU`, `Device`, `Vendor`, `Engine`, `OS`) were renamed in **2.0.5**.

AR/VR: old device typing moved to **`xr`** (2.0.0-beta.3+).

## Constructor overloads

`UAParser(req.headers)` parses headers. `UAParser(Bots, req.headers)` is extensions + headers. `UAParser(someObject)` is **not** "stringify this UA".

`new UAParser()` on the server with no args yields an empty/meaningless UA. Always pass `user-agent` or headers.

## Desktop is undefined

```ts
const { device } = UAParser(ua);
if (!device.type) {
  // desktop OR unknown — not "definitely a PC"
}
```

Do not write `device.type === "desktop"`. Do not use `DeviceType.DESKTOP` on 2.0.10+.

## Bots without extensions

Default parser is a **browser/OS/device** library. curl, GPTBot, Slackbot, Axios often look empty or Chrome-like until `CLIs` / `Crawlers` / `Fetchers` / `Libraries` / `Bots` load.

`isBot(ua)` from `bot-detection` can still flag automation without naming it.

## Frozen UA without Client Hints

Chromium mobile frozen UA uses `Android 10; K` and `Chrome/xx.0.0.0`. Model and OS version are lies until `withClientHints()`. Safari/Firefox never send hints.

Always `await` `withClientHints()` / `withFeatureCheck()` (`PromiseLike | T`).

## Client-only helpers on the server

`withFeatureCheck()`, `isElectron()`, `isFromEU()`, `isStandalonePWA()` need a browser (or Electron) environment. Calling them while parsing `req.headers` in Node does not geolocate the client or detect their PWA.

`isFromEU()` is **timezone**, not GDPR legal establishment and not IP country.

## iPad and Brave

Safari iPad "Request Desktop Website" → Macintosh UA. Fix in the **client** with `withFeatureCheck()`.

Brave UA looks like Chrome. Fix in the **client** with `withFeatureCheck()` (`navigator.isBrave`), or treat as Chrome-family via `isChromeFamily()`.

## `.is()` collisions

`device.is("mobile")` is type; `device.is("Nokia")` is vendor; `device.is("Lumia 635")` is model. A model that equals another field can surprise. Prefer `device.type === DeviceType.MOBILE` when the field matters.

## Length / ReDoS

UA **> 500 chars** is trimmed. 2.0.10 also limits Client Hints length. Huge headers will not be parsed in full.

## `isChromeFamily` vs Chrome

True for Edge, Opera, Brave, Arc, Vivaldi, Chrome — anything Blink-based in that helper's sense. Feature-detect Chrome-only APIs separately if needed.

## Security

User-Agent (and Client Hints) are **client-controlled**. Never authorize, rate-limit-uniquely, or license-check from UAParser output alone. Useful for analytics, SSR hints, bot gates (with allow/deny lists), and progressive enhancement.

## Historical npm incident

October 2021: compromised `ua-parser-js` 0.7.29 / 0.8.0 / 1.0.0 pre-releases. Use a lockfile, official `faisalman` packages only, and current 2.0.10 / licensed PRO builds. Do not install random forks named similarly.

## PRO Business scope

One license = **one project** (one deliverable or one TLD per vendor docs). A second production domain/product needs another Business license or Enterprise. Redistributing the library standalone is forbidden; embedding inside the licensed product is the intended path.

## Checklist after a v1 bump

- [ ] License SKU decided (AGPL vs PRO vs stay on v1)
- [ ] Single package in `package.json`
- [ ] Imports updated (`{ UAParser }`, subpaths)
- [ ] Mobile Chrome / macOS / Chrome OS name snapshots in tests updated
- [ ] Bot/email/in-app fixtures load the right extensions
- [ ] Server sets `Accept-CH` if Chromium device accuracy matters
- [ ] `device.type` assertions do not expect `"desktop"`
