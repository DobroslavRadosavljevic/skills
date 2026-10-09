# Security Hardening

Baseline: GitHub's "Secure use reference" plus zizmor 1.x audits. Templates in `assets/` already follow every rule here.

## Token permissions

- Repository or organization default: read-only `GITHUB_TOKEN` ("Workflow permissions" setting). Do not rely on it; declare permissions in the file.
- Workflow level `permissions: {}`, then per job the minimum:

| Need | Permission |
| --- | --- |
| Checkout of this repo | `contents: read` |
| Create release, push tag or commit | `contents: write` |
| Comment on PR / issue | `pull-requests: write` / `issues: write` |
| Upload code scanning (SARIF, zizmor) | `security-events: write` |
| OIDC to cloud, npm trusted publishing, Turborepo OIDC | `id-token: write` |
| Read workflow runs (some online audits) | `actions: read` |

- `id-token: write` only on the job that exchanges the token, never workflow-wide. `write` includes `read`; any scope you list resets all unlisted scopes to `none`.
- Add a short comment after each non-`read` permission saying why. Reviewers and zizmor's auditor persona look for it.

## Dangerous triggers

- `pull_request_target`, `workflow_run`, and `issue_comment` run the default-branch workflow with secrets and often a write token. Never check out, build, test, or run scripts from PR head code in them ("pwn request").
- `actions/checkout` v7 refuses to check out fork PR code under `pull_request_target` or `workflow_run` unless `allow-unsafe-pr-checkout: true` is set. Do not set it. Treat that input as a finding.
- Safe split for "comment on PR with results": untrusted `pull_request` job builds and uploads an artifact; a separate `workflow_run` job downloads it as inert data, validates it (schema, size), and only then comments. Never execute artifact content.
- Low-trust triggers get read-only Actions cache (June 2026 change) and `cache-mode` can only raise it with a warning. Do not restore caches in privileged jobs that attacker-controlled runs could have written.
- Fork `pull_request` runs have no secrets: design so tests pass without them (mock services, skip OIDC with a fork guard).
- Require approval for workflows from outside collaborators in repository settings.

## Script injection

`${{ }}` is substituted into the script text before the shell parses it, so `github.event.pull_request.title`, `head_ref`, `head.ref`, branch names, issue and comment bodies, commit messages, author names, and `inputs.*` strings can inject commands.

```yaml
# Vulnerable
- run: echo "Title: ${{ github.event.pull_request.title }}"

# Safe: untrusted value goes through an env var; the shell treats it as data
- env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "Title: $PR_TITLE"
```

- Always double-quote shell variables. Prefer JavaScript actions or `actions/github-script` with the value read from `context.payload` instead of interpolating into code.
- `github-script` `script:` bodies are also templates: never put `${{ }}` of untrusted data inside them.
- Do not write untrusted text to `$GITHUB_ENV` or `$GITHUB_PATH` (newline injection sets arbitrary variables). Use `$GITHUB_OUTPUT` with a random delimiter for multiline values.
- Safe to inline: `github.sha`, `github.run_id`, `github.repository`, `runner.os`, `job.status`, static `matrix.*`.

## Pin third-party actions

- Pin every third-party action to a full 40-character commit SHA taken from the action's own repository (not a fork), with the version in a trailing comment: `uses: owner/action@<sha> # v1.2.3`. A full SHA is the only immutable reference; tags can be moved.
- Resolve SHAs for annotated tags: `gh api repos/OWNER/REPO/git/ref/tags/TAG --jq .object` and dereference `tag` objects with `gh api repos/OWNER/REPO/git/tags/SHA --jq .object.sha`.
- Enforce it: the repository, organization, or enterprise Actions policy option that requires actions to be pinned to a full-length commit SHA (the allowed-actions list also supports blocking entries with a `!` prefix). The check runs when a workflow runs, not when the PR merges, so also lint in CI (zizmor `unpinned-uses`).
- First-party `actions/*` may stay on tags if policy allows (`assets/zizmor.yml` sets `ref-pin` for `actions/*`, `hash-pin` for the rest). The templates pin them anyway.
- Reusable workflows and composite actions from other repositories follow the same rule. Local `./.github/...` references are fine.
- Keep pins fresh with Dependabot or Renovate (below), with a release-age delay so a freshly compromised release is not adopted within hours.
- Prefer few, well-known actions. A shell step with `gh`, `bun`, or `git` often replaces a marketplace action and removes a supply-chain dependency.

## OIDC instead of stored cloud secrets

```yaml
permissions: {}
jobs:
  deploy:
    permissions:
      contents: read
      id-token: write
    environment: production
    steps:
      - uses: aws-actions/configure-aws-credentials@e1253824e5c10ff9df46874f81ed3ec929e19cfd # v6.3.0
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-deploy-prod
          aws-region: eu-central-1
```

- Constrain the cloud trust policy on the `sub` claim: `repo:ORG/REPO:environment:production` or `repo:ORG/REPO:ref:refs/heads/main`. Use `StringEquals` for exact values; `repo:ORG/REPO:*` matches any branch, pull request, or environment, which is too broad for a deploy role. Always set the `aud` condition (`sts.amazonaws.com` for AWS).
- GCP: `google-github-actions/auth` v3 with Workload Identity Federation. Azure: `azure/login` v3 with federated credentials. Both take `id-token: write`.
- The same pattern removes `NPM_TOKEN` (npm trusted publishing) and `TURBO_TOKEN` (Vercel OIDC policy).
- Reusable workflows need `id-token: write` in both caller and called workflow when the callee requests a token.

## Secrets and environments

- One secret per value. No JSON, YAML, or base64 blobs of several secrets. Rotate on a schedule and after any exposure; delete logs that leaked a value.
- Prefer environment secrets over repository secrets for anything that deploys. Environment `production`: required reviewers, "prevent self-review", deployment branch rule (main or protected tags), optional wait timer. Jobs referencing the environment pause until approved; approvals can wait up to 30 days.
- Secrets are not passed to fork PRs or Dependabot-triggered `pull_request` runs (Dependabot secrets are separate). Do not use `secrets: inherit` to a reusable workflow you do not control; pass named secrets.
- Register derived sensitive values with `::add-mask::`. Do not pass secrets as command-line arguments on self-hosted runners (visible in `ps`).
- `persist-credentials: false` on `actions/checkout` unless the job pushes. It stops the token from sitting in `.git` for later steps (zizmor `artipacked`: never upload the workspace root as an artifact).

## Runners

- GitHub-hosted runners are ephemeral and the safest default. Self-hosted runners are not ephemeral by default: one malicious PR can persist malware. Never attach them to public repos; use JIT/ephemeral runners, runner groups scoped to repos, no cloud metadata access, and no secrets on disk.
- npm trusted publishing does not work from self-hosted runners.

## Lint the workflows

- `actionlint` (1.7.12): syntax, expressions, shell via shellcheck, runner labels. `actionlint -color`. Misses newest keys such as `cache-mode`.
- `zizmor` (1.x): security audits: `template-injection`, `excessive-permissions`, `unpinned-uses`, `artipacked`, `cache-poisoning`, `dangerous-triggers`, `secrets-inherit`, `unpinned-images`, `undocumented-permissions` (auditor). Run `zizmor .` (install with `brew install zizmor`, `uvx zizmor`, or `cargo install zizmor`). Exit codes 11 to 14 mean findings (informational, low, medium, high); `--format=sarif` and `--no-exit-codes` suppress them. Personas: `regular` (default), `pedantic`, `auditor`. Set `GH_TOKEN` for online audits (known-vulnerable actions, ref confusion); config in `.github/zizmor.yml`.
- `zizmorcore/zizmor-action` v0.6.4: default mode uploads SARIF (needs a public repo or Advanced Security, `security-events: write`, and does not fail on findings; enforce through a code scanning ruleset). `advanced-security: false` fails the job instead and works on private repos.
- Add `.github/CODEOWNERS` for `/.github/` so workflow changes need a security reviewer. Add `actions/dependency-review-action` (v5) on PRs.
- OpenSSF Scorecard and CodeQL for Actions workflows add continuous checks.

## Dependabot and Renovate for actions

- Dependabot `github-actions` ecosystem updates SHA pins and their `# vX.Y.Z` comments together. `cooldown.default-days` delays version updates (the options reference states a 3-day default cooldown even when unset); security updates ignore cooldown. `directories` can list several folders (composite actions under `.github/actions/*`). `semver-*-days` cooldown keys are not supported for this ecosystem. Dependabot `bun` ecosystem supports `bun.lock` (not `bun.lockb`).
- Renovate: `extends: ["helpers:pinGitHubActionDigestsToSemver"]` pins digests and keeps the full version in the comment. Renovate before 44.3.1 skipped `minimumReleaseAge` for digest updates (CVE-2026-88884): run a current Renovate and add an explicit `matchUpdateTypes: ["digest","pinDigest"]` age rule (see `assets/renovate.json`).
- Review action bumps like dependency bumps: read the diff of the action, check the release notes for permission or behavior changes (for example, checkout v7's fork-PR refusal).

## Supply-chain extras

- Treat caches and artifacts as untrusted inputs across trust boundaries. Do not restore `node_modules` or build caches written by PR runs into release jobs; release jobs here skip the cache.
- Release builds: build in one unprivileged job, publish from a separate job with only the publish permission and a protected environment. Provenance: npm adds it automatically for trusted publishing from public repos; `actions/attest` (v4) creates build attestations for other artifacts (needs `id-token: write`, `attestations: write`).
- Network egress hardening (for example `step-security/harden-runner`) is optional; if used, start in audit mode and pin by SHA.
