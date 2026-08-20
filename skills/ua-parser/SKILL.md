---
name: ua-parser
description: "Build, review, debug, migrate, or plan User-Agent detection with UAParser.js v2 (ua-parser-js OSS AGPL and @ua-parser-js/pro-personal, pro-business, pro-enterprise). Use for UAParser, Client Hints, withClientHints, withFeatureCheck, frozen UA, bots, AI crawlers, GPTBot, extensions (Bots, Crawlers, CLIs, Emails, Fetchers, InApps, Libraries, MediaPlayers, ExtraDevices, Vehicles), enums, bot-detection, browser-detection, device-detection, helpers, isBot, isAICrawler, isChromeFamily, isAppleSilicon, device type/vendor/model, engine, OS, CPU, v1 MIT vs v2 AGPL vs PRO licenses, and ua-parser-js CLI."
---

# UAParser.js

Use this skill for **UAParser.js v2** User-Agent and Client Hints detection: browser, engine, OS, CPU, device, bots, apps, and related helpers. Snapshot **2.0.10** (2026-05-21).

OSS and PRO share the **same v2 API**. Pick the package from the license, not from features.

## Workflow

1. Inspect the local surface before changing code:
   - Installed package: `ua-parser-js` (OSS), and/or `@ua-parser-js/pro-personal` / `pro-business` / `pro-enterprise`.
   - Major: prefer **2.0.10+**. Treat **0.7.x / 1.x** as MIT-legacy (weaker detection, no Client Hints, no ESM submodules).
   - Runtime: browser, Node/Bun server, CLI, or managed REST.
   - Need: device/OS/browser only, or bots/AI/email/in-app/libraries too.
   - Client Hints: HTTPS + Chromium 85+, or UA-only fallback.
2. Bind **one** import root for the whole project. Do not mix OSS and PRO packages. See [packages-licenses.md](references/packages-licenses.md).
3. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - License, install, import roots, CLI, REST: [packages-licenses.md](references/packages-licenses.md)
   - Constructor overloads, ESM/CJS, browser vs server: [setup-core.md](references/setup-core.md)
   - `get*`, `IResult`, `is()`, `toString()`, types: [api-results.md](references/api-results.md)
   - Client Hints, feature check, frozen UA: [client-hints-features.md](references/client-hints-features.md)
   - Built-in + custom extensions: [extensions.md](references/extensions.md)
   - `helpers` / `bot-detection` / `browser-detection` / `device-detection`: [submodules.md](references/submodules.md)
   - Enum constants: [enums.md](references/enums.md)
   - v1→v2, AGPL traps, desktop=`undefined`: [pitfalls-migration.md](references/pitfalls-migration.md)
5. Prefer **`bun` / `bunx`** in command examples. Match the project's existing import style (`import { UAParser }` vs `require`).
6. Verify with typecheck plus focused tests for UA-only vs Client Hints, bot extensions, and empty/`undefined` fields.

## License Decision Tree

```
Need v2 detection (Client Hints, bots, ESM, extensions)?
  Closed-source / proprietary commercial product?
    One product, one TLD or one deliverable?
      → @ua-parser-js/pro-business ($29 one-time)
    Many products / unlimited deployments?
      → @ua-parser-js/pro-enterprise ($599 one-time)
    Personal non-commercial only?
      → @ua-parser-js/pro-personal ($14 one-time)
  Open-source that can comply with AGPL-3.0-or-later?
    → ua-parser-js@^2 (npm, AGPL)
  Cannot take AGPL and will not buy PRO?
    → stay on ua-parser-js@1 (MIT, reduced features) or do not use v2 OSS

Already AGPL-ok (internal OSS, AGPL app, or copyleft-compatible)?
  → ua-parser-js@^2
```

PRO editions are **license SKUs of the same v2 library**, not extra feature packs. Do not invent PRO-only APIs.

## Core Judgment

- **One package root.** Map every submodule off that root (`ua-parser-js/extensions` or `@ua-parser-js/pro-business/extensions`). Never dual-install OSS + PRO.
- **`new UAParser(...)` returns an instance; `UAParser(...)` returns `IResult`.** Constructor args are overloaded (UA string, extensions, headers). See [setup-core.md](references/setup-core.md).
- **Desktop is `device.type === undefined`**, not `"desktop"`. Empty objects mean "not detected", not "unknown device named empty".
- **Bots are not in the default parser.** Load `Crawlers` / `Fetchers` / `Bots` (or `isBot()` from `bot-detection`) when traffic classification matters.
- **Chromium frozen UA hides model/OS.** On Chromium, call `withClientHints()` (and `isFrozenUA()` when explaining gaps). Safari/Firefox have no Client Hints.
- **`await` Client Hints / feature-check.** `withClientHints()` / `withFeatureCheck()` return `PromiseLike<T> | T`. Always `await` so both browser (async) and Node (sync) work.
- **`withFeatureCheck()` is browser-only** (Brave, iPad-as-Macintosh). Do not call it on the server.
- Compare with **`.is()` + enums**, not raw string equality. Comparisons are case-insensitive; `"Browser"` / `"OS"` suffixes are ignored.
- **Trim/ReDoS:** UA strings longer than **500** characters are trimmed. Do not rely on a full raw UA beyond that.
- User-Agent detection is **heuristic, not identity**. Do not use it for auth, licensing, or security boundaries.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls ua-parser-js @ua-parser-js/pro-personal @ua-parser-js/pro-business @ua-parser-js/pro-enterprise`
- Confirm a **single** import root and that license matches product (AGPL vs PRO SKU).
- Typecheck constructor overloads, `IResult`, and submodule paths.
- Tests: known UA fixtures (desktop Chrome, iPhone Safari, frozen Android Chrome, GPTBot, curl); Client Hints headers vs UA-only; extension on/off for bots; `device.type` undefined vs `"mobile"`.
- Server: `Accept-CH` / `Critical-CH` set on HTTPS; first request may still be UA-only.
- CLI smoke: `bunx ua-parser-js "Mozilla/5.0 ..."`.

Report which checks ran, which did not, and which package/license was assumed.
