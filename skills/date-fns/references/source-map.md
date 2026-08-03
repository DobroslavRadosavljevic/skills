# Source Map

This reference captures the docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-03
- Stable npm packages:
  - `date-fns@4.4.0`
  - `@date-fns/tz@1.5.0`
  - `@date-fns/utc@2.1.1`
- Official homepage: https://date-fns.org/
- Core repository: https://github.com/date-fns/date-fns
- TZ package: https://github.com/date-fns/tz (also monorepo `pkgs/tz`)
- UTC package: https://github.com/date-fns/utc (also monorepo `pkgs/utc`)
- Context7 selections: `/date-fns/date-fns`, `/date-fns/tz` (no dedicated `@date-fns/utc` ID — query via `/date-fns/date-fns`)
- Prerelease observed: `date-fns@5.0.0-alpha.0` — do not target unless the project explicitly uses it

Treat alpha/canary dist-tags as unavailable unless the project depends on them.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info date-fns
   bun info @date-fns/tz
   bun info @date-fns/utc
   ```

3. Prefer official docs and repo sources. If docs and package metadata disagree, report the mismatch.
4. Check the local project package versions before applying APIs that require date-fns v4 (`in`, `transpose` TZ patterns) or a minimum companion package version.
5. For UTC-specific docs when Context7 lacks `/date-fns/utc`, query `/date-fns/date-fns` and cross-check https://github.com/date-fns/utc.

## Official Pages

- Getting started: https://date-fns.org/docs/Getting-Started
- FP guide: https://date-fns.org/docs/FP-Guide
- I18n: https://date-fns.org/docs/I18n
- Unicode tokens: https://date-fns.org/docs/Unicode-Tokens
- Time zones: https://date-fns.org/docs/Time-Zones · https://github.com/date-fns/date-fns/blob/main/docs/timeZones.md
- CDN: https://date-fns.org/docs/CDN
- CHANGELOG: https://github.com/date-fns/date-fns/blob/main/CHANGELOG.md
- v4 announcement: https://blog.date-fns.org/v40-with-time-zone-support/
- v3 announcement: https://blog.date-fns.org/v3-is-out/
- npm `date-fns`: https://www.npmjs.com/package/date-fns
- npm `@date-fns/tz`: https://www.npmjs.com/package/@date-fns/tz
- npm `@date-fns/utc`: https://www.npmjs.com/package/@date-fns/utc
- Legacy `date-fns-tz`: https://github.com/marnusw/date-fns-tz
- Per-function docs: `https://date-fns.org/docs/<FunctionName>` (use site version switcher)

## Source Files Used

- `docs/gettingStarted.md` / `pkgs/core/docs/gettingStarted.md`
- `docs/fp.md`
- `docs/i18n.md`
- `docs/unicodeTokens.md`
- `docs/timeZones.md` / `pkgs/core/docs/timeZones.md`
- `pkgs/tz/README.md` and TZ API autodocs
- `pkgs/utc/README.md` / https://github.com/date-fns/utc/blob/main/README.md
- Blog: v3 and v4 release posts
- Issues worth knowing: date-fns/tz#6 (transpose vs TZDate), date-fns/tz#40 (fall-back ambiguity)

## Version Line Orientation

| Line | Role |
| --- | --- |
| date-fns **v4.x** | Current: ESM-first, `{ in }` context, `TZDate`/`UTCDate` interop |
| date-fns **v3.x** | Still common; named exports; strings as args; no first-class `in` |
| date-fns **v2.x** | Legacy: default subpath exports, no string args by design |
| `@date-fns/tz` **1.x** | Official IANA/offset zones for v4+ |
| `@date-fns/utc` **2.x** | Official UTC extensions + `utc` context (2.0+ for date-fns v4) |
| `date-fns-tz` | Third-party; prefer only on pre-v4 stacks |
