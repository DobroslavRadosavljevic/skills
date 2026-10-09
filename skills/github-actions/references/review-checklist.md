# Workflow Review Checklist

Run `actionlint` and `zizmor .` first; they cover many rows mechanically. Mark each item pass, fail, or not applicable.

## Triggers and structure

- [ ] Triggers are minimal. `pull_request`, not `pull_request_target`, unless labeling or commenting only; no checkout of PR head in `pull_request_target`, `workflow_run`, or `issue_comment`.
- [ ] Required workflows run on every PR (no `paths:` on them); one aggregate job is the required check; `merge_group` is present if a merge queue is used.
- [ ] `concurrency` group includes the workflow and PR number or ref; PR runs cancel, deploys and releases do not.
- [ ] Every job has `timeout-minutes`; runner labels are explicit where reproducibility matters.
- [ ] `fail-fast` is a deliberate choice; matrix cells have readable names and unique artifact names.
- [ ] Jobs that must run after failures use `!cancelled()` or `always()` on purpose.

## Permissions and secrets

- [ ] `permissions: {}` at workflow level; each job lists only what it needs, with a reason for every non-`read` scope.
- [ ] `id-token: write` only on jobs that use OIDC.
- [ ] `actions/checkout` has `persist-credentials: false` unless the job pushes.
- [ ] No long-lived cloud keys or `NPM_TOKEN`; cloud, npm, and Turborepo use OIDC with a tight `sub`/policy.
- [ ] Deploy secrets live in environments with required reviewers and a branch rule; named secrets only, no `secrets: inherit` to external callees.
- [ ] No secrets in `run:` interpolation, command-line arguments, artifacts, or caches.

## Injection and supply chain

- [ ] No `${{ github.event.* }}`, `head_ref`, `inputs.*`, or step outputs derived from them inside `run:` or `github-script` bodies; values go through `env:`.
- [ ] No untrusted data written to `$GITHUB_ENV` / `$GITHUB_PATH`.
- [ ] Every third-party action is pinned to a full commit SHA with a version comment; Dependabot or Renovate updates them with a release-age delay; SHA-pinning policy is enforced.
- [ ] Workflow files are under CODEOWNERS; a workflow lint job runs actionlint and zizmor.
- [ ] Release jobs build without cache restore, publish from a protected environment, and use trusted publishing.

## Speed and reliability

- [ ] Bun version pinned (`packageManager`), `bun install --frozen-lockfile`, Bun install cache keyed on `bun.lock`.
- [ ] Turborepo: remote cache via OIDC, `--affected` with enough git history, `inputs`/`outputs`/`env` correct.
- [ ] Format, lint, typecheck, Knip (default and `--production`), tests, and build all run; commands are repo scripts shared with local use.
- [ ] Tests use one-shot commands (no watch); reports, traces, and coverage upload with `!cancelled()`; artifact retention is short.
- [ ] Service containers have health checks and pinned image versions; E2E is isolated from the fast gate.
- [ ] Job summary or annotations point reviewers to failures.

## Maintainability

- [ ] Repeated steps are in a composite action; repeated pipelines are in a reusable workflow with typed inputs.
- [ ] Scheduled jobs are idempotent, have `workflow_dispatch`, and use an off-peak minute.
- [ ] Comments explain why for permissions, pins, and deliberate exceptions; suppressions in `.github/zizmor.yml` are narrow and commented.
