# Source Map

Snapshot captured **2026-10-09**.

## Local verification

- `bun --version` -> **1.4.2** (`744846f`). CLI flags for `bun outdated`, `update`, `add`, `install`, `audit`, `dedupe`, `ci`, `pm`, `info`, `why` were read from `bun <cmd> --help` on this version.
- `bun info <pkg> <property> [--json]` returns registry metadata properties (needs a `package.json` in the working directory); confirmed with `scripts` and `dist-tags`.

## Bun

- `bun update` (ranges, `--latest`, `--recursive`, `--filter`, catalogs, how `package.json` is rewritten): https://bun.com/docs/pm/cli/update
- `bun outdated` (filters, catalog rows): https://bun.com/docs/pm/cli/outdated
- `bun audit` / `bun audit fix` (`--latest`, `--ignore`, `--audit-level`, `--dry-run`, `--json`): https://bun.com/docs/pm/cli/audit
- `bun install` incl. `--minimum-release-age`: https://bun.com/docs/pm/cli/install
- `bun dedupe`: https://bun.com/docs/pm/cli/dedupe
- bunfig `[install]` `minimumReleaseAge` (seconds), `minimumReleaseAgeExcludes`: https://bun.com/docs/runtime/bunfig
- Security scanner API (`[install.security] scanner`): https://bun.com/docs/pm/security-scanner-api
- Catalogs: https://bun.com/docs/pm/catalogs
- Overrides: https://bun.com/docs/pm/overrides
- Docs index: https://bun.com/docs/llms.txt
- Context7: `/websites/bun`

## Other package managers

- pnpm settings (`minimumReleaseAge` in minutes, `minimumReleaseAgeExclude`, added in 10.16; default 1440 in v11): https://pnpm.io/settings
- npm `min-release-age` (days; npm 11.10+; off by default): https://docs.npmjs.com/cli/using-npm/config (confirmed only via secondary sources on 2026-10-09; check `npm help config` on the installed version)

## Bots

- Dependabot options reference (`cooldown`, `groups`, `multi-ecosystem-groups`, `bun` ecosystem): https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference
- Renovate configuration options (`minimumReleaseAge`, `minimumReleaseAgeBehaviour`, `osvVulnerabilityAlerts`, `packageRules`): https://docs.renovatebot.com/configuration-options/
- Renovate security presets (`security:minimumReleaseAgeNpm`, 3-day npm delay, strict internal checks): https://docs.renovatebot.com/presets-security/
- Renovate config presets (`config:best-practices`): https://docs.renovatebot.com/presets-config/

## Refresh procedure

1. Run `bun --version`; if it differs from 1.4.2, re-read `bun <cmd> --help` for the commands above and fix [bun-commands.md](bun-commands.md).
2. Re-check units and names for release-age settings in Bun, npm, pnpm, Renovate, Dependabot.
3. Re-check that Dependabot still lists `bun` and which options it supports there.
4. Update the snapshot date above.
