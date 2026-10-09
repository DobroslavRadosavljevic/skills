# Quality Gate, Tests, Playwright, Artifacts

Template: `assets/ci.yml` (single package), `assets/ci.turbo.yml` (monorepo), `assets/e2e.yml` (services and Playwright). Tool versions checked 2026-10-09: `oxlint` 1.87, `oxfmt` 0.72, `knip` 6.41, `vitest` 5.0, `@playwright/test` 1.64, `typescript` 7.0.

## Gate order and commands

Run cheap, deterministic checks first and in parallel; they fail in seconds. Every check is a `package.json` script so local and CI commands are identical.

| Check | Command in script | Notes |
| --- | --- | --- |
| Format | `oxfmt --check` | Exit 1 on drift; exit 2 when no files matched. Never auto-write in CI. |
| Lint | `oxlint --deny-warnings` | Add `-f github` for annotations if the default output is not annotated. Type-aware rules need `oxlint-tsgolint`. |
| Types | `bun check` or `tsc --noEmit` | Run after codegen (route trees, API clients). |
| Unused code | `knip` and `knip --production` | Both must exit 0. `--reporter github-actions` annotates. Needs full install and generated files. |
| Tests | `vitest run` or `bun test` | Never `vitest` (watch). Vitest adds the `github-actions` reporter automatically on Actions. |
| Build | `bun run build` | Last; upload `dist` only if a later job consumes it. |

Rules:

- `fail-fast: false` for the checks matrix so one lint error does not hide a type error.
- One aggregate `ci-result` job (`if: always()`, `needs: [...]`, fails on any non-`success`) is the only required status check. It stays stable when jobs are renamed or split.
- Install once per job; share installs through the Bun cache, not through artifacts of `node_modules`.
- Generated code must be built in CI before typecheck. If drift is possible, add a step that regenerates and runs `git diff --exit-code`.

## Vitest sharding

```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2, 3, 4]
steps:
  # checkout and setup omitted
  - run: bunx vitest run --reporter=blob --shard=${{ matrix.shard }}/4
  - uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
    if: ${{ !cancelled() }}
    with:
      name: vitest-blob-${{ matrix.shard }}
      path: .vitest/blob
      include-hidden-files: true   # .vitest is a dot-directory; hidden files are skipped by default
      retention-days: 1
# merge job: needs the test job, runs with if: ${{ !cancelled() }}
  - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
    with:
      pattern: vitest-blob-*
      path: .vitest/blob
      merge-multiple: true
  - run: bunx vitest run --merge-reports
```

Blob reports live in `.vitest/blob/` on Vitest 5. If tests write attachments, also upload and restore `attachmentsDir`. Shard only when a single job exceeds about 5 minutes; each shard repays install time.

## Playwright

- Install per job: `bunx playwright install --with-deps chromium` (name only the browsers you use). Playwright's docs say caching browser binaries is not recommended; if you cache anyway, key on the Playwright version (`~/.cache/ms-playwright` on Linux) and still run `bunx playwright install-deps` because OS packages are not cached.
- Docker alternative: `container: mcr.microsoft.com/playwright:v1.64.0-noble` (tag must match the installed `@playwright/test` version). Service containers then reach each other by service name, not `localhost`.
- Config for CI: `workers: process.env.CI ? 1 : undefined` for stability (Playwright's recommendation), `retries: process.env.CI ? 2 : 0`, `forbidOnly: !!process.env.CI`, `trace: 'on-first-retry'`, `globalTimeout` instead of a job timeout so reporters still write a report.
- Always upload on `!cancelled()` (not `failure()`), including `playwright-report/` and `test-results/` (traces, screenshots, videos). Use `if-no-files-found: ignore` and 14-day retention.
- Sharding: `bunx playwright test --shard=${{ matrix.shard }}/${{ strategy.job-total }} --reporter=blob`, upload `blob-report/` per shard with a unique name, then a merge job downloads with `merge-multiple: true` and runs `bunx playwright merge-reports --reporter=html ./all-blob-reports`.
- Start the app server through `webServer` in `playwright.config.ts` so there is one source of truth for the command, port, and readiness URL.

## Service containers

See `assets/e2e.yml` and the services block in [workflow-syntax.md](workflow-syntax.md).

- Health checks are mandatory. Publish ports and use `localhost` for steps on the host.
- Pin image tags to production versions; use digests when you need immutability (zizmor's auditor persona flags tag-only images).
- Test credentials are throwaway values scoped to the job; do not reuse real passwords. Run migrations as an explicit step so failures are visible.
- Redis for BullMQ-style tests: `redis:8` image, `redis-cli ping` health check. Postgres: `pg_isready`.
- Services are unavailable or unreliable on `ubuntu-slim` (container-based); use `ubuntu-latest`. For several databases or custom networks, start `docker compose` in a step instead.

## Artifacts

- `actions/upload-artifact` v7.0.2 and `actions/download-artifact` v8.0.2 (artifact backend v4+). Names are unique per run within a workflow run: matrix cells need a unique suffix (`${{ matrix.shard }}`, `${{ matrix.os }}`) or the second upload fails.
- Hidden files (dot-directories such as `.vitest`, `.next`) are excluded unless `include-hidden-files: true`.
- `retention-days`: 1 for intermediate data, 7 to 14 for reports, repository default otherwise. Artifact storage counts against the plan quota.
- `download-artifact` with `pattern:` and `merge-multiple: true` collects shard outputs into one directory. Treat downloaded content as untrusted when it came from a PR workflow and is consumed by a privileged `workflow_run` job.
- `upload-artifact` can also upload a single file without zipping (`archive: false` input exists); check the action README before relying on it.

## Job summaries and annotations

- Append Markdown to `$GITHUB_STEP_SUMMARY` (1 MiB per step limit): test counts, bundle sizes, links to artifacts. Use `printf` or a heredoc, never `echo` with untrusted text.
- Workflow commands: `echo "::error file=src/a.ts,line=3::message"`, `::warning::`, `::notice::`, `::group::`/`::endgroup::`. Tools such as `bun check`, Knip, and Vitest emit these natively on Actions.
- Mask a computed sensitive value with `echo "::add-mask::$VALUE"` before it appears in output.
