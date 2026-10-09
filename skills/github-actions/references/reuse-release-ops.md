# Reuse, Releases, Scheduled Jobs, Runners

## Reusable workflows vs composite actions

| | Reusable workflow (`workflow_call`) | Composite action (`runs.using: composite`) |
| --- | --- | --- |
| Unit | Whole job(s) | A list of steps inside the caller's job |
| Runner, services, permissions, environment | Own `runs-on`, `services`, `permissions`, `environment` | Inherits the caller job |
| Secrets | `secrets:` declared; avoid `secrets: inherit` for third-party callees | No `secrets` context: pass values as inputs |
| Use for | Shared CI/deploy pipelines across repos | Shared setup (Bun install + cache), small step bundles |

Reusable workflow skeleton:

```yaml
# .github/workflows/reusable-deploy.yml
on:
  workflow_call:
    inputs:
      environment: { type: string, required: true }
    outputs:
      url:
        value: ${{ jobs.deploy.outputs.url }}
permissions: {}
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    permissions: { contents: read, id-token: write }
    outputs:
      url: ${{ steps.out.outputs.url }}
    steps: []   # checkout, setup, deploy; set outputs via $GITHUB_OUTPUT
```

Caller: `uses: ORG/REPO/.github/workflows/reusable-deploy.yml@<sha>` (or `./.github/workflows/...` in the same repo) with `with:` and a job-level `permissions:` that already includes everything the callee needs. A called workflow can only keep or reduce the caller's permissions, and cache access. Only inputs and secrets the callee declares are accepted; extras are an error. Nested callers must forward secrets explicitly. Check "Actions limits" for nesting depth and unique-workflow caps before building deep chains. Matrix strategies work on the calling job. Keep inputs typed (`string`, `boolean`, `number`); never pass untrusted text into a callee's `run:` as `${{ inputs.x }}`; the callee must use env vars.

Composite action rules: every `run:` step needs `shell:`; defaults are not inherited; use `${{ github.action_path }}` for bundled files; local use requires checkout first (`uses: ./.github/actions/setup`); pin external actions inside it by SHA. Template: `assets/setup-action.yml`. Do not hide security-sensitive logic in an action from another org without pinning and reading it.

## Releases

Pick one flow; both use npm trusted publishing (OIDC), no `NPM_TOKEN`:

1. **Changesets (`assets/release.changesets.yml`)**: `@changesets/cli` 3 with `changesets/action` v2 split into `select-mode`, `version`, `pack`, `publish`. Contributors add `.changeset/*.md` files with `bunx changeset`. Merging them to `main` opens or updates a "Version Packages" PR; merging that PR publishes. Per-job permissions: `select-mode` and `pack` `contents: read`; `version` `contents: write` + `pull-requests: write`; `publish` `contents: write` + `id-token: write`. Requires the repo setting that lets Actions create pull requests. The guide notes npm staged publishing does not work with Changesets yet.
2. **Tag push (`assets/release.tag.yml`)**: `verify` builds and packs once, `publish` uploads exactly that tarball with `npm publish` from a protected environment, `github-release` creates the release with `gh release create --verify-tag --generate-notes`. Tag must equal `package.json` version.

npm trusted publishing facts (docs.npmjs.com, 2026-10): configure the trusted publisher on the package settings page (owner, repo, workflow filename like `release.yml`, optional environment); npm does not validate the config when saved (errors show at publish time) and a new config must complete its first successful publish within 2 days or it expires; up to 10 publishers per package; `id-token: write` is required, in both parent and child workflows when using `workflow_call`; the validated workflow name is the calling one; needs npm CLI 11.5.1 or newer and Node 22.14 or newer (use Node 24); cloud-hosted runners only; provenance is automatic for public repos publishing public packages, disable with `NPM_CONFIG_PROVENANCE=false`; `ENEEDAUTH` usually means a filename mismatch, missing `id-token`, or `repository.url` not matching the GitHub repo exactly. `npm stage publish` (stage in CI, approve with 2FA later) exists; limit the trusted publisher to stage-only if you want a human approval step outside Actions.
Bun builds and tests; the npm CLI does the publish because trusted publishing is an npm CLI feature. Verify `npm --version` in the job log.

Never publish from `pull_request` runs or from jobs that restored caches. Never let a `workflow_dispatch` input choose the tag or version without validation.

Docker or cloud deploys: build artifact once, deploy by digest/SHA, use `environment:` with reviewers, `concurrency` with `cancel-in-progress: false`, and OIDC. Add `actions/attest` (needs `id-token`, `attestations: write`) when consumers verify provenance.

## Environments and approvals

- Define `staging` and `production` environments; scope secrets/variables to them. `environment:` on a job gates it on required reviewers and branch rules, and sets the OIDC `sub` to `...:environment:<name>`.
- `workflow_dispatch` input `type: environment` offers a picker.
- Environment protection rules do not apply to jobs without `environment:`, so reviewers cannot gate a secret read by an ungated job. Keep deploy secrets only in environments.

## Scheduled jobs

```yaml
on:
  schedule:
    - cron: "17 3 * * 1-5"      # 03:17 UTC, weekdays; off-peak minute
    # or: - cron: "17 9 * * 1-5"
    #     timezone: Europe/Belgrade
  workflow_dispatch: {}          # always add a manual trigger for testing
```

- Runs only on the default branch's latest commit. Delays and dropped runs happen under load. Use idempotent jobs and `concurrency`.
- Public repos: schedules pause after 60 days without repository activity. Re-enable from the Actions tab or via a keep-alive commit policy you accept.
- `github.event.schedule` holds the matching cron string when you have several entries.
- Good fits: dependency audits (`bun audit`), link checks, nightly E2E against staging, stale-issue sweeps, backup verification. Use least-privilege permissions and an environment for anything that touches production.

## Runners

- `ubuntu-latest` = Ubuntu 24.04 (x64). Other labels (runner-images, 2026-10): `ubuntu-26.04`, `ubuntu-24.04-arm`, `ubuntu-26.04-arm`, `ubuntu-22.04`, `macos-latest` = `macos-26` (arm64), `macos-15`, `macos-26-intel`, `windows-latest` = Windows Server 2025, `windows-11-arm`. macOS 14 images are deprecated. `*-latest` moves without a commit; pin an explicit label for reproducible toolchains.
- `ubuntu-slim`: 1 vCPU, container-based, 15-minute job limit. Good for lint, labelers, aggregate gate jobs, zizmor. Not for builds, Docker, or service containers.
- Arm runners (`ubuntu-24.04-arm`) are available for hosted jobs. Test on the architecture you ship and include `runner.arch` in cache keys.
- Larger runners (paid, per-minute, runner groups, up to 1,000 concurrent) help when profiling shows CPU-bound builds or tests (many Playwright workers, big TypeScript builds). Try sharding and Turborepo caching first; they are free.
- Self-hosted: only for private repos with a real need (VPC access, GPUs, licensed tools). Use ephemeral JIT runners, runner groups, patched images, no secrets on disk. Hosted runners are the default.
- Concurrency quotas by plan: 20 (Free), 40 (Pro), 60 (Team), 500 (Enterprise) standard jobs; macOS 5 on non-Enterprise. Matrix size and queue limits are in [workflow-syntax.md](workflow-syntax.md).
