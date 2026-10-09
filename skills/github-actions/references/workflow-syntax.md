# Workflow Syntax Essentials

Facts verified against the GitHub docs on 2026-10-09. Files live in `.github/workflows/*.yml`; each file max 500 KB.

## Triggers (`on`)

| Trigger | Use | Gotchas |
| --- | --- | --- |
| `pull_request` | Default CI for PR code | Fork PRs: no secrets, read-only `GITHUB_TOKEN`. `GITHUB_SHA` is the merge commit. Dependabot PRs are treated like fork PRs (read-only token, no repo secrets). |
| `push` | Branch and tag builds | Only `tags` or only `branches` set means the other ref type never triggers. `paths` is not evaluated for tag pushes. |
| `merge_group` | Merge queue | Required if required checks come from Actions; otherwise queued PRs never report and cannot merge. Type is `checks_requested`. |
| `workflow_dispatch` | Manual runs | Max 25 inputs, 65,535-character payload. Input types: `string`, `boolean`, `number`, `choice`, `environment`. File must be on the default branch to appear. `inputs.*` keeps booleans typed; `github.event.inputs.*` stringifies. |
| `schedule` | Cron | Five fields, UTC by default; optional IANA `timezone:` per entry (since 2026-03). Minimum 5-minute interval. Runs on the default branch HEAD. Use an off-peak minute such as `17`, not `0`. Public-repo schedules are disabled after 60 days without repo activity. |
| `workflow_call` | Reusable workflow | Inputs need `type`. See [reuse-release-ops.md](reuse-release-ops.md). |
| `workflow_run` | Chain after another workflow | Runs from the default branch with secrets and write token even if the trigger run had none. Chains longer than three workflows do not run. Never check out or execute PR head code here. |
| `pull_request_target` | Label or comment on fork PRs | Runs the default-branch workflow with a write token and secrets. See [security-hardening.md](security-hardening.md). |
| `issue_comment` | ChatOps | Runs from the default branch. Tell PR comments apart with `github.event.issue.pull_request`. |

Filters: `branches` and `branches-ignore` cannot be combined for one event (same for `tags`, `paths`). With both `branches` and `paths` on `pull_request`, both must match. `!` patterns need at least one positive pattern; order matters. A push with more than 1,000 commits, or a diff timeout, always runs. A diff over 3,000 files may skip the workflow.

**`paths` and required checks:** a workflow skipped by `paths` never reports its status, so a required check stays "pending" forever. Run required workflows on every PR and skip work inside (changed-file step, `turbo --affected`, per-job `if`), then require one aggregate job (see `assets/ci.yml`, job `ci-result`).

Typical dispatch input block:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: Target environment
        type: environment
        required: true
      dry-run:
        description: Skip the real deploy
        type: boolean
        default: true
```

## Jobs, `needs`, and conditions

- Jobs run in parallel unless linked by `needs`. A job whose `needs` failed is skipped unless `if: ${{ !cancelled() }}` or `always()` is set. Prefer `!cancelled()` so cancellation still stops the job.
- `if:` on a job is evaluated before `strategy.matrix` expands, so it cannot read `matrix.*`.
- `needs.<job>.result` is `success`, `failure`, `cancelled`, or `skipped`. Gate jobs must treat `skipped` deliberately.
- Set `timeout-minutes` on every job (default 360; hosted jobs cap at 6 hours) and on steps that can hang. `ubuntu-slim` caps at 15 minutes.
- Pass data between jobs with `outputs` (small strings) or artifacts (files). Outputs that contain secrets are dropped.
- Without `shell:`, Linux `run` steps use `bash -e`. Set `defaults.run.shell: bash` to get `-eo pipefail` so a failure inside a pipe fails the step. `defaults` cannot use expressions.

## Matrix

```yaml
strategy:
  fail-fast: false   # let every cell finish so one flake does not hide other failures
  max-parallel: 4
  matrix:
    os: [ubuntu-latest, macos-latest]
    shard: [1, 2, 3]
    include:
      - os: ubuntu-latest
        shard: 4
    exclude:
      - os: macos-latest
        shard: 3
```

- Max 256 jobs per run. `fail-fast` defaults to `true`, which cancels sibling cells on the first failure; use `false` for test shards and quality checks, `true` for expensive build matrices.
- Matrix names are case-insensitive. Give each cell a readable `name:` because it becomes the required-check name.
- Only static, trusted values belong in a matrix that feeds `run:` through an env var. Never interpolate matrix values built from event data into shell.

## Concurrency

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

- Group names are case-insensitive and may use only `github`, `inputs`, and `vars` contexts.
- Cancel superseded PR runs. Never cancel `main` builds, deploys, or release jobs (`cancel-in-progress: false`), or you can kill a half-finished deploy.
- Default behavior keeps one running and one pending run per group; a newer pending run replaces the older pending one. For strict ordered deploys, use `queue: max` (up to 100 queued runs, FIFO). It cannot be combined with `cancel-in-progress: true` (validation error).
- Put different workflows in different groups: `${{ github.workflow }}` prefix avoids one workflow cancelling another.

## Permissions and cache access

- `permissions: {}` at workflow level, then grant per job. Setting any scope sets every unlisted scope to `none`. `id-token` accepts only `write` or `none`.
- `cache-mode` (job or workflow level; `read`, `write`, `write-only`, `none`) controls Actions cache access. Untrusted triggers (`pull_request_target`, `issue_comment`, fork-driven `workflow_run`) default to `read`; trusted ones (`push`, `schedule`, `workflow_dispatch`) to `write`. Declaring `write` on a low-trust trigger adds a warning annotation because it reopens cache poisoning. A blocked save logs a warning and the job continues. Reusable workflows cannot exceed the caller's mode. `actionlint` 1.7.12 does not know this key yet; verify with the docs, not the linter.

## Expressions and contexts

- `${{ }}` is expanded before the shell runs. Treat any context that carries user text as untrusted (see [security-hardening.md](security-hardening.md)).
- `vars.*` for non-secret config, `secrets.*` for secrets, `inputs.*` for dispatch and call inputs, `runner.debug` is `1` when debug logging is on.
- `hashFiles()` hashes files relative to the workspace and returns an empty string when nothing matches; an empty hash in a cache key silently disables lockfile invalidation.
- `env` values cannot reference other keys in the same map. Precedence: step, job, workflow.
- Write step outputs with `echo "name=value" >> "$GITHUB_OUTPUT"`, env with `$GITHUB_ENV`, summaries with `$GITHUB_STEP_SUMMARY`. Never use the removed `set-output` or `save-state` commands.

## Services and containers

```yaml
services:
  postgres:
    image: postgres:18
    env: { POSTGRES_PASSWORD: test-only }
    ports: ["5432:5432"]
    options: >-
      --health-cmd "pg_isready -U postgres" --health-interval 5s --health-timeout 5s --health-retries 10
```

- Steps on the runner host reach services at `localhost:<published port>`. If the job itself uses `container:`, reach services by their service name instead.
- Without a health check the job starts before the database accepts connections. Always add `--health-cmd`.
- Service containers need Docker on the runner. Avoid them on `ubuntu-slim`.
