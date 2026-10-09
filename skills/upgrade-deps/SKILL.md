---
name: upgrade-deps
description: Safely upgrade JavaScript/TypeScript dependencies in a repo or monorepo, Bun-first. Baselines the gates, inventories outdated and vulnerable packages, groups updates (safe batches, one major per group, coupled families, security first), reads official release notes before each major, runs codemods, verifies every group, commits one group per commit, and reports skipped packages and rollback. Use when the user says "upgrade deps", "update dependencies", "bump packages", "outdated", "major upgrade", "migrate to vX", "security advisory", "audit fix", "bun update", "Renovate PR", "Dependabot PR", "triage dependency PRs", "bump TypeScript/Node/Bun", or asks to configure Renovate/Dependabot grouping or a minimum release age.
---

# Upgrade Deps

**Single goal:** move dependencies forward in small, verified, reversible groups, so every commit is green and every break has one suspect.

Do not mix refactors, feature work, or lint-rule cleanups into upgrade commits. Fix only what the upgrade itself breaks.

## Core Rules

- Start from a clean git tree and a recorded baseline. A failure that existed before the upgrade is not an upgrade failure.
- Never guess a breaking change. Read the official changelog, release notes, or migration guide for every major (and every minor of a 0.x package) before editing code.
- One major per group. Patch and minor updates batch together. Coupled families move together.
- Security fixes go first, as their own group.
- Run non-interactive commands only. Never use `bun update -i` or any prompt-driven flow; select packages by name or pattern.
- Respect the supply-chain gate: prefer versions that are at least a few days old, and review new maintainers and install scripts before trusting a package. See [supply-chain.md](references/supply-chain.md).
- Keep the lockfile committed with its `package.json` change. Never hand-edit `bun.lock`.
- If a group breaks and the cause is not clear in one pass, stop, bisect the group, and defer the culprit. Do not push through red gates.
- Preserve unrelated user changes. Do not touch packages the user excluded or pinned on purpose without saying why.

## Workflow

Track steps with the harness todo list or plan mode when available; otherwise keep a plain checklist in chat. A subagent per major can read release notes in parallel; without subagents, read them one at a time.

### 1. Baseline

1. `git status` must be clean. Create a branch (for example `chore/upgrade-deps`). If the tree is dirty, ask before stashing.
2. Record versions: `bun --version`, Node version, package manager field, TypeScript version.
3. Discover gates from `package.json` scripts, CI config, and AGENTS.md or contributor docs: install, typecheck, lint, format check, tests, build, and E2E if present.
4. Run them all once on the untouched tree. Save the result per gate (pass, fail, count of errors, flaky). These are the **pre-existing failures**. Report them; do not blame them on upgrades.

Details: [workflow-details.md](references/workflow-details.md#baseline).

### 2. Inventory

Run the checks in [bun-commands.md](references/bun-commands.md):

- `bun outdated` (add `-r` or `--filter` in a workspace repo; catalogs show as their own rows).
- `bun audit` (and `--json` for a machine-readable list).
- Where versions live: `dependencies`, `devDependencies`, `peerDependencies`, workspace `catalog`/`catalogs`, `overrides`/`resolutions`, `patchedDependencies`, `trustedDependencies`, `engines`/`devEngines`, `packageManager`, CI image tags, `.nvmrc`/`.tool-versions`.
- Pinned (exact) vs ranged entries. `bun update` leaves exact pins and dist-tags as written; only `--latest` rewrites them.
- Deprecated packages and install-time deprecation warnings.

### 3. Classify and group

Sort every outdated package into a group. Order of execution:

1. **Security** (`bun audit` findings): own group.
2. **Runtime and tooling floor**: Bun, Node, TypeScript, `@types/node`, `@types/bun`. Each is its own group when it is a major or minor.
3. **Patch + minor batch** (in-range, no majors).
4. **Coupled families**, one group per family.
5. **Each remaining major**, one per group, lowest risk first.
6. **Cleanup**: `bun dedupe`, remove obsolete overrides, shims, polyfills.

Family examples, grouping rules, and the group-plan template: [grouping.md](references/grouping.md).

### 4. Prepare each major

For each major (or risky minor):

1. Read the official changelog, release notes, and migration guide. Use docs tools, a docs MCP, or web search. Record the source URL.
2. List the breaking changes, removals, renamed APIs, changed defaults, new peer ranges, new engine floor, and ESM/CJS changes.
3. Grep this codebase for each affected API. Keep only breaking changes that actually touch the repo.
4. Check for an official codemod or upgrade CLI. Run it on its own commit-sized step and review the diff.
5. Check peer ranges of the consumers (plugins, adapters) and whether they already support the new version. If not, the group is **blocked**; record it.

Playbook: [major-upgrades.md](references/major-upgrades.md).

### 5. Apply

Use the narrowest command that matches the group. Prefer `--dry-run` first. Examples (flags verified in [bun-commands.md](references/bun-commands.md)):

```sh
bun update --dry-run
bun update zod '@types/*'                    # in-range
bun update --latest vite @vitejs/plugin-react # cross-range, named only
bun add -d typescript@<version>               # explicit version
bun audit fix --dry-run && bun audit fix
```

In a monorepo, edit the shared **catalog** entry once (or use `bun update` from the root, which rewrites the catalog entry, never `catalog:` references), then run `bun install`. Remove overrides, patches, shims, and polyfills the new version made unnecessary.

### 6. Verify

After each group run the baseline gates in the same order. Compare against the baseline, not against "zero".

- Always: install with the lockfile (`bun install`, then `bun ci` or `bun install --frozen-lockfile` to prove the lockfile is consistent), typecheck, lint, tests, build.
- Runtime-impacting groups (framework, bundler, ORM, HTTP server, auth, Bun/Node, TypeScript emit): also start the app or run E2E and check the console for new deprecation warnings.
- Check `bun pm untrusted` for newly blocked install scripts.
- Check `bun outdated` and peer-dependency warnings from the install output for leftovers.

If a gate regresses, fix only what the upgrade broke. If it takes more than one focused pass, bisect inside the group (revert half, rerun) and defer the culprit. Failure triage: [workflow-details.md](references/workflow-details.md#when-a-group-breaks).

### 7. Commit

One group per commit. Include the lockfile, catalog, and the minimal code changes needed. Message lists `from -> to` versions and notable changes. Template: [report-and-rollback.md](references/report-and-rollback.md#commit-message). Do not push or open a PR unless asked.

### 8. Report

Finish with the upgrade table, skipped and blocked packages with reasons, pre-existing failures, deprecations to address later, and the rollback path. Template: [report-and-rollback.md](references/report-and-rollback.md#final-report).

## Reference Map

| Need | File |
| --- | --- |
| Verified Bun and npm/pnpm commands | [bun-commands.md](references/bun-commands.md) |
| Grouping, coupled families, ordering | [grouping.md](references/grouping.md) |
| Majors, TypeScript, Node/Bun, ESM-only, peers | [major-upgrades.md](references/major-upgrades.md) |
| Baseline detail, triage, deprecations | [workflow-details.md](references/workflow-details.md) |
| Release age, install scripts, maintainers | [supply-chain.md](references/supply-chain.md) |
| Renovate and Dependabot config, PR triage | [automation-config.md](references/automation-config.md) |
| Commit and report templates, rollback | [report-and-rollback.md](references/report-and-rollback.md) |
| Sources and snapshot date | [source-map.md](references/source-map.md) |

## Completion Check

- Every group ended green relative to the baseline, or is listed as blocked or deferred with a reason.
- Lockfile is committed and `bun install --frozen-lockfile` passes.
- No leftover temporary overrides without a comment naming the removal condition.
- The final report states which gates ran, which did not, and any assumption.
