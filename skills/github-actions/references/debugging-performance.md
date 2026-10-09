# Debugging and Speed

## Read the failure first

```bash
gh run list --workflow ci.yml --limit 10
gh run view <run-id> --log-failed          # only failed steps
gh run view <run-id> --job <job-id> --log
gh run watch <run-id> --exit-status
gh run rerun <run-id> --failed             # rerun failed jobs only
gh run rerun <run-id> --debug              # rerun with debug logging
```

Find the first failing step, then the first real error above the noisy ones. Check the "Set up job" step for the runner image version, and the annotations on the run summary page.

## Debug logging

- Set `ACTIONS_STEP_DEBUG=true` (verbose step logs, `::debug::` lines) and `ACTIONS_RUNNER_DEBUG=true` (adds runner and worker diagnostic logs in the `runner-diagnostic-logs` folder of the log archive) as repository secrets or variables. If both a secret and a variable exist, the secret wins.
- Preferred: re-run a single run with "Enable debug logging" in the UI (or `gh run rerun --debug`), which turns both on for that run only. Anyone who can re-run can do this. Remove the repo-level values afterward; debug logs are noisier and can echo more context.
- Gate extra diagnostics with `if: ${{ runner.debug == '1' }}`. Print context safely: `toJSON(github.event)` in a step only after checking it has no secrets, never in public logs for untrusted events.
- `::group::` / `::endgroup::` fold long output. `set -x` in a step shows shell commands but also expands secrets that are not masked.
- SSH debug actions open a shell into the runner: avoid on repos with secrets, never use on public PRs.

## Local checks before pushing

- `actionlint` (YAML, expressions, shellcheck) and `zizmor .` catch most mistakes in seconds. Both are local binaries, run them in the pre-push hook and the `workflow-lint` workflow.
- `act` (nektos) runs jobs in local Docker containers: good for iterating on shell logic and matrix wiring (`act -l` lists jobs, `act -n` dry-runs, `-j <job>`, `-s KEY=...`, `--eventpath event.json`). Limits: images are not the GitHub runner images, so tools differ; no real OIDC (`id-token`), no real `actions/cache` or artifact backends without extra flags, environments and approvals are not enforced, `concurrency` and merge queues are not modeled, Windows and macOS jobs do not run, service networking differs, and the `github` context is synthetic. Treat a green `act` run as a syntax and logic check only.
- Test a workflow change safely on a branch with `workflow_dispatch`, a sandbox repository, or a fork with secrets removed. Changes to `on:` filters for `pull_request` apply to the PR's own workflow file; `pull_request_target`, `schedule`, `workflow_run`, and `issue_comment` always use the default-branch file, so test those in a sandbox repository where you can change the default branch freely.

## Common failures

| Symptom | Likely cause and fix |
| --- | --- |
| `Resource not accessible by integration` (403) | Missing job permission (`pull-requests: write`, `contents: write`, ...), fork PR token is read-only, or Dependabot run. Add the exact scope on the job; guard fork PRs. |
| Required check "Expected, waiting for status" forever | Workflow skipped by `paths` or never triggered (`merge_group` missing). Run on every PR and require one aggregate job. |
| `bun install --frozen-lockfile` fails | `bun.lock` out of sync with `package.json`, or lockfile edited by a different Bun major. Run `bun install` locally with the pinned Bun, commit the lockfile. |
| Different results CI vs local | Unpinned Bun or Node, `*-latest` image moved, missing codegen step, case-sensitive file paths on Linux, timezone (UTC in CI). |
| Playwright `Executable doesn't exist` / missing libs | Browsers not installed in this job, or `--with-deps` missing; version of `@playwright/test` changed. Install per job. |
| Playwright flaky only in CI | Parallelism too high (`workers: 1`), no `webServer` wait, animations; collect traces on first retry. |
| Service connection refused | No health check, wrong host (`localhost` on host jobs vs service name in container jobs), port not published. |
| Cache never hits | Empty `hashFiles()` (wrong glob), key includes changing values, cache saved only on `push` to default branch and the PR scope cannot see it, 10 GB repo cap evicting entries, or blocked save on a low-trust trigger. |
| `Artifact name already exists` | Matrix cells share one artifact name. Add a unique suffix. |
| Artifact empty or missing `.something/` | Hidden files excluded. Set `include-hidden-files: true`. |
| `ENEEDAUTH` on `npm publish` | Trusted publisher config mismatch (workflow filename, environment, `repository.url`), missing `id-token: write`, npm older than 11.5.1, or self-hosted runner. |
| `Unable to get ACTIONS_ID_TOKEN_REQUEST_URL` | `id-token: write` missing on that job, or fork PR. |
| Checkout of PR head refused | `actions/checkout` v7 blocks fork PR checkout under `pull_request_target` / `workflow_run`. Redesign the workflow; do not opt in. |
| Job hangs for hours | No `timeout-minutes`, interactive prompt, or a watch-mode test command. Add timeouts and use one-shot commands. |
| Schedule did not run | Not on default branch, repo inactive 60 days, delayed at the top of the hour, workflow disabled. |
| Expression is always true/false | Using `${{ }}` inside `if:` with `!` prefix, comparing string `'false'`, or reading `matrix` in a job-level `if`. |

## Speed playbook (measure with the run's job timing graph first)

1. Cancel superseded PR runs (`concurrency` with `cancel-in-progress`).
2. Do less work: `turbo --affected` plus remote cache; skip docs-only changes inside jobs rather than with `paths:` on required workflows.
3. Parallelize independent checks as jobs/matrix; keep setup short with the composite action and the Bun install cache.
4. Fail fast on cheap checks: format and lint before E2E; E2E in its own workflow that is not on the critical path of unrelated PRs, or gated with `needs`.
5. Shard slow suites (Vitest `--shard`, Playwright `--shard`) only when a single job exceeds about 5 minutes; merge blob reports.
6. Install only needed browsers (`chromium`), avoid rebuilding Docker layers without cache, and avoid `fetch-depth: 0` unless `--affected` or changelog tooling needs it (use `filter: blob:none` to keep it cheap).
7. Use `timeout-minutes` so runaway jobs do not burn the minutes quota.
8. Only then pay for compute: Arm or larger runners; compare minutes cost against wall-clock gain.
9. Keep artifacts small and short-lived; do not upload `node_modules`.
