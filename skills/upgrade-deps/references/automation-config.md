# Renovate And Dependabot

Use when the user asks to configure grouping, schedules, or release age for update bots, or to triage their PRs. Verified against official docs on 2026-10-09; re-check option names before writing config, because both tools change often.

## Contents

- Goals
- Dependabot
- Renovate
- PR triage
- Merge policy

## Goals

- Group safe updates into few PRs; keep each major separate.
- Security updates are never delayed by grouping or release-age rules.
- A short release-age delay for non-security updates.
- Same family moves together (framework + plugins, TanStack, Vite + plugins).
- Lockfile updates are part of the PR; no hand edits.

## Dependabot

File: `.github/dependabot.yml`. Bun is a supported ecosystem (`package-ecosystem: "bun"`). Not every option works for every ecosystem; check the options reference for `bun` before relying on `dependency-type` or `indirect`.

```yaml
version: 2
updates:
  - package-ecosystem: "bun"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    cooldown:
      default-days: 3
      semver-major-days: 7
      semver-minor-days: 3
      semver-patch-days: 2
    groups:
      minor-and-patch:
        patterns: ["*"]
        update-types: ["minor", "patch"]
      vite-family:
        patterns: ["vite", "@vitejs/*", "vitest", "@vitest/*"]
      security:
        applies-to: security-updates
        patterns: ["*"]
```

Facts:

- `cooldown` keys: `default-days`, `semver-major-days`, `semver-minor-days`, `semver-patch-days`, `include`, `exclude` (max 150 entries each, `*` allowed; `exclude` wins). It applies to version updates, not security updates. If a `semver-*-days` key is missing, `default-days` applies.
- `groups.<name>` keys: `applies-to` (`version-updates` default, or `security-updates`), `patterns`, `exclude-patterns`, `update-types` (`minor`, `patch`, `major`), `dependency-type` (only some ecosystems), `group-by: dependency-name` (across directories). A dependency that matches several groups lands in the first match.
- Majors are not grouped by the example above, so each major gets its own PR.
- `multi-ecosystem-groups` can combine several ecosystems (for example `bun` and `github-actions`) into one PR on one schedule.
- Add `ignore` entries only with a written reason (blocked major, ESM-only, peer conflict) and an expiry note in the PR or commit.

## Renovate

File: `renovate.json` or `renovate.json5` (or a config in `package.json` where the repo already does that). Renovate has a `bun` manager.

```json5
{
  extends: ["config:best-practices"],
  // best-practices already adds a 3-day npm release delay via security:minimumReleaseAgeNpm
  lockFileMaintenance: { enabled: true, schedule: ["before 6am on monday"] },
  packageRules: [
    {
      description: "Batch non-major updates",
      matchUpdateTypes: ["minor", "patch"],
      matchCurrentVersion: "!/^0/",
      groupName: "non-major dependencies",
    },
    {
      description: "Keep Vite and Vitest families together",
      matchPackageNames: ["vite", "@vitejs/**", "vitest", "@vitest/**"],
      groupName: "vite and vitest",
    },
  ],
  // majors are not grouped above, so each major keeps its own PR
  vulnerabilityAlerts: { enabled: true, minimumReleaseAge: null },
}
```

Facts:

- `minimumReleaseAge` is a duration string (for example `"3 days"`), used inside `packageRules` with `matchDatasources: ["npm"]`, or inherited from `security:minimumReleaseAgeNpm`, which `config:best-practices` extends. It needs the datasource to provide release timestamps; custom registries may not. `minimumReleaseAgeBehaviour` defaults to `timestamp-required`: a version without a timestamp is not treated as stable. Use `timestamp-optional` only if your registry lacks timestamps and you accept the risk.
- With `internalChecksFilter: "strict"` (and `prCreation: "not-pending"` where used), branches are created only after the age passes; otherwise PRs open with a pending `renovate/stability-days` status.
- `osvVulnerabilityAlerts` is experimental and off by default. `vulnerabilityAlerts` (GitHub alerts) is the safer default for security PRs; security PRs should bypass the release-age delay by setting `minimumReleaseAge: null` there. Verify in current docs that the override applies in your Renovate version.
- Option names and defaults shift between Renovate majors (for example the Renovate 42 timestamp requirement). Read the current "configuration options" page and, if possible, validate with `bunx --package renovate renovate-config-validator` before committing.
- Do not put tokens or hosted-registry credentials in the committed config.

## PR Triage

For each open bot PR record: type (security, patch, minor, major), group, CI state, release age, notes link, breaking changes that touch the repo (grep), overlap with other PRs. Then:

1. Security first. Merge or fix forward the same day if gates are green.
2. Patch/minor groups whose CI is green and whose release age passed: merge.
3. Majors: run the full workflow in `SKILL.md` on the PR branch. Read the notes, grep usages, run codemods, verify, then merge or leave a comment with the blocker.
4. After each merge, let the bot rebase the rest; do not resolve `bun.lock` conflicts by hand. Regenerate with `bun install` on the updated base.
5. Close PRs for packages that are blocked, with the reason and the retry condition.

## Merge Policy

- Auto-merge only patch/minor groups with passing CI, a passed release age, and no install-script changes. Never auto-merge majors, runtime bumps, or anything touching install scripts.
- Require the full gate set in CI, including build and E2E where they exist; a bot PR that only ran lint proves little.
- Keep the bot's commit messages if they list versions; add a body note when you changed code to fit the new version.
