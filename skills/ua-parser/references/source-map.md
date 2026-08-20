# Source Map

This reference captures the docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-20
- Stable npm packages (all at **2.0.10**, published 2026-05-21 unless noted):
  - `ua-parser-js@2.0.10` — OSS, license `AGPL-3.0-or-later`
  - `@ua-parser-js/pro-personal@2.0.10` — PRO Personal
  - `@ua-parser-js/pro-business@2.0.10` — PRO Business
  - `@ua-parser-js/pro-enterprise@2.0.10` — PRO Enterprise
- MIT legacy line: `ua-parser-js@1.0.x` (and older `0.7.x`) — reduced detection, no Client Hints
- Official site: https://uaparser.dev
- Docs v2: https://docs.uaparser.dev
- Docs v1: https://docs.uaparser.dev/v1
- Core repository: https://github.com/faisalman/ua-parser-js
- Context7: `/faisalman/ua-parser-js-docs` (prefer), `/faisalman/ua-parser-js`
- Author: Faisal Salman (`faisalman`)

Treat alpha/beta/rc dist-tags as unavailable unless the project depends on them.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info ua-parser-js
   bun info @ua-parser-js/pro-personal
   bun info @ua-parser-js/pro-business
   bun info @ua-parser-js/pro-enterprise
   ```

3. Prefer official docs and the GitHub repo. If docs and package metadata disagree, report the mismatch.
4. Check the local project's installed package **and license SKU** before applying v2-only APIs (`withClientHints`, extensions, enums, `useExtension`).
5. Changelog: https://docs.uaparser.dev/intro/changelog.html and https://github.com/faisalman/ua-parser-js/blob/master/CHANGELOG.md

## Official Pages

- Home / demo: https://uaparser.dev
- v2 docs index: https://docs.uaparser.dev
- v1→v2: https://docs.uaparser.dev/intro/whats-new.html
- Upgrade to PRO: https://docs.uaparser.dev/intro/upgrade-to-pro.html
- REST API: https://docs.uaparser.dev/intro/rest-api.html
- Constructor: https://docs.uaparser.dev/api/main/overview.html
- Client Hints: https://docs.uaparser.dev/api/main/idata/with-client-hints.html
- Feature check: https://docs.uaparser.dev/api/main/idata/with-feature-check.html
- Extensions: https://docs.uaparser.dev/api/submodules/extensions/overview.html
- Custom regex: https://docs.uaparser.dev/intro/extending-regex.html
- Enums: https://docs.uaparser.dev/api/submodules/enums/overview.html
- Helpers: https://docs.uaparser.dev/api/submodules/helpers/overview.html
- Bot detection: https://docs.uaparser.dev/api/submodules/bot-detection/overview.html
- Browser detection: https://docs.uaparser.dev/api/submodules/browser-detection/overview.html
- Device detection: https://docs.uaparser.dev/api/submodules/device-detection/overview.html
- CLI: https://docs.uaparser.dev/intro/quick-start/using-cli.html
- Node: https://docs.uaparser.dev/intro/quick-start/using-node-js.html
- HTML/CDN: https://docs.uaparser.dev/intro/quick-start/using-html.html
- npm OSS: https://www.npmjs.com/package/ua-parser-js
- npm PRO: https://www.npmjs.com/package/@ua-parser-js/pro-personal · https://www.npmjs.com/package/@ua-parser-js/pro-business · https://www.npmjs.com/package/@ua-parser-js/pro-enterprise
- Store: https://store.faisalman.com · Lemon Squeezy buy link on GitHub README
- Support: support@uaparser.dev
- ReDoS Client Hints advisory: GHSA-9h5v-pfqq-x599 (fixed in 2.0.10)

## Source Files Used

- `package.json` exports / `bin` (`script/cli.js`)
- `src/main/ua-parser.d.ts`
- Docs: `docs/intro/*`, `docs/api/main/*`, `docs/api/submodules/*`, `docs/info/browser/type.md`
- PRO license texts on `pro-personal` / `pro-business` / `pro-enterprise` branches
- CHANGELOG through 2.0.10

## Version Line Orientation

| Line | Role |
| --- | --- |
| **2.0.10** | Current v2: ESM, Client Hints, extensions, bots/AI, `useExtension()`, ReDoS CH limit |
| **2.0.7** | Split helpers into `bot-detection` / `browser-detection` / `device-detection` |
| **2.0.5** | Enum rename: `Browser`→`BrowserName`, `CPU`→`CPUArch`, `Device`→`DeviceType`, `Vendor`→`DeviceVendor`, `Engine`→`EngineName`, `OS`→`OSName` |
| **2.0.0** | AGPL v2 public release: ESM, TS, CH, extensions, CLI |
| **1.0.x / 0.7.x** | MIT legacy: CJS, basic detection, no CH / no official ESM submodules |
