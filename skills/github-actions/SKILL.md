---
name: github-actions
description: "Build, review, debug, harden, and speed up GitHub Actions CI/CD for Bun + TypeScript repos and Turborepo monorepos with current docs. Use for .github/workflows YAML, on triggers (pull_request vs pull_request_target, workflow_run, merge_group, paths filters, workflow_dispatch inputs, schedule timezone), jobs/needs/matrix/fail-fast, concurrency cancel-in-progress and queue max, permissions: {} least privilege, cache-mode, actions/checkout v7 (allow-unsafe-pr-checkout), actions/cache v6, upload-artifact v7, download-artifact v8, oven-sh/setup-bun v2 and ~/.bun/install/cache, bun install --frozen-lockfile, bun check, Turborepo remote cache (OIDC, TURBO_TOKEN, TURBO_TEAM) and turbo --affected, quality gates (oxfmt, oxlint, tsc, knip, vitest sharding, Playwright traces and reports, service containers for Postgres and Redis), SHA pinning, script injection via github.event env vars, OIDC to AWS/GCP/Azure, zizmor and actionlint, secrets and environments with required reviewers, reusable workflows and composite actions, job summaries, changesets/action v2 and npm trusted publishing with provenance, Dependabot and Renovate for actions, scheduled jobs, ubuntu-slim/arm/larger/self-hosted runners, and debugging with ACTIONS_STEP_DEBUG, gh run rerun --debug, and act. Use whenever the user mentions GitHub Actions, CI, workflow YAML, a failing or slow pipeline, release automation, or CI security, even without naming Actions."
---

# GitHub Actions

Use this skill when work touches `.github/workflows/*`, `.github/actions/*`, CI speed or flakiness, workflow security, release publishing, or Dependabot/Renovate config for actions. Default stack: Bun, TypeScript, optional Turborepo, oxfmt, oxlint, Knip, Vitest, Playwright.

Snapshot (2026-10-09): `actions/checkout@v7.0.1`, `actions/cache@v6.1.0`, `actions/upload-artifact@v7.0.2`, `actions/download-artifact@v8.0.2`, `actions/setup-node@v7.1.0`, `oven-sh/setup-bun@v2.2.0` (v2 is still current), `changesets/action@v2.1.2`, Bun 1.4.2, Turborepo 2.11.7. Full SHAs and sources: [source-map.md](references/source-map.md). Re-resolve versions before pinning into an old repo.

## Workflow

1. Inspect before editing:
   - Workflows, composite actions, `dependabot.yml`/`renovate.json`, `CODEOWNERS`, rulesets and required checks.
   - `package.json` scripts and `packageManager`, `bun.lock`, `turbo.json`, test, e2e, and release setup.
   - Triggers and trust: public or private repo, fork PRs, secrets in use, deploy targets, `permissions`, environments.
   - Failing run logs (`gh run view <id> --log-failed`) when debugging.
2. Route to the focused reference:
   - Triggers, matrix, concurrency, permissions, expressions, services: [workflow-syntax.md](references/workflow-syntax.md).
   - Bun install and cache, `bun check`, Turborepo remote cache and `--affected`: [bun-turborepo.md](references/bun-turborepo.md).
   - Quality gate, Vitest/Playwright, service containers, artifacts, summaries: [testing-quality-gates.md](references/testing-quality-gates.md).
   - Permissions, injection, pinning, OIDC, secrets, linting, update bots: [security-hardening.md](references/security-hardening.md).
   - Reusable workflows, composite actions, releases, schedules, runners: [reuse-release-ops.md](references/reuse-release-ops.md).
   - Debugging, `act`, common failures, speed playbook: [debugging-performance.md](references/debugging-performance.md).
   - Reviews and audits: [review-checklist.md](references/review-checklist.md).
3. Start from a template in `assets/` instead of writing YAML from memory, then adapt script names and paths.
4. Lint with `actionlint` and `zizmor .` (see below), then prove the change on a branch or `workflow_dispatch` run.

## Templates (`assets/`)

| File | Copy to | Purpose |
| --- | --- | --- |
| `setup-action.yml` | `.github/actions/setup/action.yml` | Composite action: Bun from `packageManager`, install cache, frozen install |
| `ci.yml` | `.github/workflows/ci.yml` | Parallel format, lint, typecheck, Knip, test, build, plus one aggregate required check |
| `ci.turbo.yml` | `.github/workflows/ci.yml` | Turborepo gate: OIDC remote cache, `--affected`, full-history checkout |
| `e2e.yml` | `.github/workflows/e2e.yml` | Postgres and Redis services, migrations, Playwright, report and trace upload |
| `release.changesets.yml` | `.github/workflows/release.yml` | Changesets 3 version PR and npm trusted publishing behind an environment |
| `release.tag.yml` | `.github/workflows/publish.yml` | Tag-driven verify, publish exact tarball, GitHub release |
| `workflow-lint.yml` | `.github/workflows/workflow-lint.yml` | actionlint and zizmor on workflow changes |
| `dependabot.yml`, `renovate.json` | `.github/dependabot.yml` / repo root | SHA-pin updates with release-age delay |
| `zizmor.yml` | `.github/zizmor.yml` | Pin policy: `hash-pin` third party, `ref-pin` `actions/*` |

## Core Judgment

- Trust boundaries first. Anything triggered by `pull_request_target`, `workflow_run`, `issue_comment`, or a fork has different secrets and token rights. Never check out or run PR head code with a privileged token; checkout v7 refuses fork PR checkout there by default, so never set `allow-unsafe-pr-checkout`.
- Set `permissions: {}` at the top and grant per job, each with a reason. `id-token: write` only where OIDC is exchanged.
- Never put `${{ github.event.* }}`, branch names, titles, comments, or `inputs.*` text inside `run:` or script bodies. Pass them through `env:` and quote the shell variable.
- Pin every third-party action to a full commit SHA with a `# vX.Y.Z` comment, and let Dependabot or Renovate update it with a release-age delay. Enforce with the Actions SHA-pinning policy and zizmor.
- Prefer OIDC over stored secrets: cloud roles, npm trusted publishing (no `NPM_TOKEN`), Turborepo remote cache via Vercel OIDC. Constrain the cloud trust on `sub` (environment or ref).
- Required checks must always report: do not use `paths:` on required workflows; use `merge_group` with a merge queue; require one aggregate job.
- Set `concurrency` with `cancel-in-progress` for PRs only. Never cancel deploys or releases.
- Set `timeout-minutes` on every job. Use one-shot commands (`vitest run`, `bun run test`), never watch modes.
- Install with `bun install --frozen-lockfile`; pin Bun through `packageManager`. Cache `~/.bun/install/cache`, not `node_modules`. Skip caches in release jobs.
- With Turborepo, run `turbo run ... --affected` with enough git history and remote cache; keep `inputs`, `outputs`, and `env` correct or cache hits lie.
- Upload reports with `if: ${{ !cancelled() }}`, unique artifact names per matrix cell, `include-hidden-files: true` for dot-directories, and short retention.
- Service containers need health checks. Playwright installs browsers per job; its docs advise against caching binaries.
- Release from a separate job with a protected environment and only the publish permission. npm trusted publishing needs npm CLI 11.5.1+ and a cloud-hosted runner; Bun builds, the npm CLI publishes.
- Prefer hosted ephemeral runners. Never attach self-hosted runners to public repos. Try caching, `--affected`, and sharding before paying for larger runners.
- Do not mimic features from memory. `cache-mode`, `concurrency.queue: max`, and `schedule.timezone` are new; confirm in docs and note that older linters may not know them.

## Verification

- `actionlint` and `zizmor .` (add `--persona=pedantic` when reviewing; set `GH_TOKEN` for online audits) clean, or every suppression is narrow and explained.
- Every action is SHA-pinned, `permissions` is explicit, no untrusted `${{ }}` in scripts, `timeout-minutes` set.
- The change ran on a branch or `workflow_dispatch`; the aggregate check name matches branch protection or rulesets.
- Cache hit and miss both worked; artifacts exist for failing runs; fork PR path still passes without secrets.
- For releases: dry run on a sandbox package or `npm publish --dry-run`; trusted publisher config matches workflow filename and environment exactly.
- Report which checks ran, which could not (secrets, OIDC, environment approvals need the real repo), and assumptions about plan, runners, and repo settings.
