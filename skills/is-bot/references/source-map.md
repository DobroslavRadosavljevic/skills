# Source Map

This reference captures the docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-20
- Stable npm package: `isbot@5.2.1` (published 2026-07-14)
- License: Unlicense
- Engines: `node: >=18`
- Official repository: https://github.com/omrilotan/isbot
- Homepage / UA tester: https://isbot.js.org
- Types: bundled `index.d.ts` (`"types": "index.d.ts"`)
- Context7: no dedicated `/omrilotan/isbot` library ID at capture time — prefer GitHub README, CHANGELOG, and bundled types
- Related packages observed: `reverse-dns-lookup` (author-recommended crawler verification, not bundled)

Treat older majors (v3 default export, v4 `pattern` named export, `isbot.*` methods) as unavailable unless the project still depends on them.

## Refresh Procedure

1. Resolve current docs before answering "latest" questions. Prefer GitHub README + CHANGELOG + `index.d.ts`.
2. Check package registry metadata:

   ```sh
   bun info isbot
   ```

3. If README, types, and installed version disagree, report the mismatch. 5.2.0 added camelCase aliases; README on npm already shows `isBot` while some cached copies still show `isbot`.
4. Check the local project version before applying:
   - camelCase names (`isBot`, `findBotMatch`, …) — **5.2.0+**
   - `getPattern()` instead of `pattern` — **5.0.0+**
   - named-only import (no default) — **4.0.0+**
   - `null`/`undefined` UA → `false` — **4.2.0 / 4.3.0+**
   - empty-string → `false` (`isNonEmptyString`) — **5.1.37+**
5. Pattern lists change frequently (most 5.1.x patches). Do not hard-code expected match substrings from old versions.

## Official Pages

- npm: https://www.npmjs.com/package/isbot
- GitHub: https://github.com/omrilotan/isbot
- README: https://github.com/omrilotan/isbot/blob/main/README.md
- CHANGELOG: https://github.com/omrilotan/isbot/blob/main/CHANGELOG.md
- Types (published): `index.d.ts` in the npm tarball
- Tester: https://isbot.js.org
- jsDelivr: https://www.jsdelivr.com/package/npm/isbot
- Reverse DNS companion (docs mention): https://www.npmjs.com/package/reverse-dns-lookup

## Source Files Used

- `README.md`
- `CHANGELOG.md`
- `package.json` (`exports`, `engines`, `sideEffects`)
- `src/index.ts` (match helpers, naive fallback, `createIsbotFromList`)
- `src/browser.ts` (UMD/global `isbot`)
- `src/patterns.json` (regex fragments joined into `fullPattern`)
- Published `index.d.ts` @ 5.2.1 (camelCase + legacy dual exports)

## Version Line Orientation

| Line | Role |
| --- | --- |
| **v5.2.x** | Current. Dual export names (`isBot` + `isbot`). Prefer camelCase. |
| v5.0–5.1 | Named `isbot` / `getPattern`. No `pattern` export. |
| v4.x | Named `isbot` only. `pattern` export. Naive fallback from 4.4.0. |
| v3.x | Default export + `isbot.*` attached methods. Do not write new code against this. |
| v6 (unscheduled) | Drop legacy names (`isbot` → `isBot`, `isbotMatch` → `findBotMatch`, …). |

## Data Sources (pattern maintenance)

isbot rebuilds its regex from crawler lists plus a manual list, then checks against non-bot UAs (`user-agents` npm and a manual allow list). Upstream crawler sources cited in the README:

- Kikobeats/top-crawler-agents
- matomo-org/device-detector bot fixtures
- monperrus/crawler-user-agents
- myip.ms live_webcrawlers
- stephenafamo/isbot crawler-user-agents
- user-agents.net bots
- ua-parser-js crawler fixtures
- Manual list
