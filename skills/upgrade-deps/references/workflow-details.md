# Workflow Details

## Contents

- Baseline
- Gate order
- When a group breaks
- Cleanup after upgrades
- Monorepo notes
- Handling Renovate and Dependabot PRs

## Baseline

Record this table before any edit. It is the reference for "regression".

```md
| Gate | Command | Result | Notes (error count, flaky, duration) |
| install | bun install --frozen-lockfile | pass | |
| typecheck | bun run typecheck | fail | 12 errors in packages/legacy (pre-existing) |
| lint | bun run lint | pass | 4 warnings |
| format | bun run format:check | pass | |
| test | bun run test | pass | 2 flaky: ... |
| build | bun run build | pass | |
| e2e | bun run test:e2e | skipped | needs services |
```

- Take commands from `package.json` scripts, CI workflows, and contributor docs. If no script exists for a gate, say so; do not invent one. `bunx tsc --noEmit` is a fair typecheck when the repo has a `tsconfig` and no script.
- Install gate: if `bun install --frozen-lockfile` fails on a clean tree, the lockfile was already stale. Report it; ask before refreshing it as a separate commit.
- Run a flaky test three times before calling it flaky. Record which ones.
- Save raw output for failing gates (to a temp location, not the repo) so you can diff error lists later.
- If a gate cannot run (missing services, secrets, licenses), say which, and compensate with a narrower check.

## Gate Order

Run cheap gates first so failures surface early: install, typecheck, lint, format check, unit tests, build, then integration or E2E. For runtime-impacting groups, finish with a real run: start the dev server or the built output, hit one real route or command, and read the console.

## When A Group Breaks

1. Read the first error, not the last. Cascades hide the cause.
2. Classify: (a) a documented breaking change you missed, (b) a transitive or peer mismatch, (c) a config default changed, (d) a flaky or baseline failure, (e) a real upstream bug.
3. (a)/(c): fix the repo code or config minimally; re-read the notes for the same area. (b): see peer conflicts in [major-upgrades.md](major-upgrades.md#peer-dependency-conflicts). (d): compare with the baseline table. (e): search the project's issues for the version; if confirmed, pin below the broken version, record the issue link, and defer.
4. If not resolved in one focused pass, bisect the group: revert half the packages (`git stash` or `git checkout -- package.json bun.lock` then re-apply a subset), re-run the failing gate, and halve again. Use `git bisect` across group commits when a later group exposes an earlier break.
5. Defer the culprit, keep the rest of the group green, and commit the rest. The deferred package goes into the report with the exact error, the version tried, and the next step.
6. Do not weaken tests, loosen types with `any`/`@ts-ignore`, or disable lint rules to get green. If the notes call for a type or config change, make that change; otherwise defer.

## Cleanup After Upgrades

Do this in its own commit after the groups, only for things the upgrades made unnecessary:

- `overrides` / `resolutions` whose pinned dependency is now fixed upstream (remove, `bun install`, run `bun audit` and gates).
- `patchedDependencies` whose fix shipped (remove the patch, reinstall, test).
- `trustedDependencies` entries for packages no longer installed.
- Polyfills and shims for features the new runtime or library provides natively.
- `@types/foo` packages replaced by built-in types.
- `bun dedupe` to collapse duplicate versions; `bun dedupe --check` should pass.
- Stale `engines`, CI matrix entries, and Docker tags that no longer match the supported floor.

Deleting legacy workaround code that is not tied to a dependency version is out of scope here.

## Monorepo Notes

- Run inventory with `bun outdated -r`. Group by catalog entry first, then by member.
- Upgrade shared tooling at the root, libraries before apps, so consumers verify on the new version.
- After a catalog or root bump, run gates for the whole workspace (for example `bun run --filter '*' typecheck`) and, if the repo uses a task runner with an affected filter, also the affected set.
- Internal packages that publish: a dependency bump in a published package can be a consumer-visible change (peer ranges, minimum versions). Flag it for the release process; do not edit versions or changelogs unless the repo's workflow requires it.
- Keep one version per dependency across members when the repo uses catalogs. If a member must differ, record why.

## Handling Renovate And Dependabot PRs

- Treat the bot PR as an input to the same workflow: baseline, read notes, verify, then merge or fix forward.
- Triage list: group, update type, CI status, age of the release, security flag, breaking-change notes, whether another open PR touches the same family or lockfile.
- Merge order: security, then patch/minor batches, then each major. Rebase or recreate the later PRs after each merge, because lockfile conflicts follow.
- Close or ignore PRs for blocked packages with a comment that states the blocker and the condition to retry.
- Configuration for grouping, schedules, and release age lives in [automation-config.md](automation-config.md).
