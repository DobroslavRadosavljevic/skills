# Source Map

Snapshot date: 2026-10-09. Refresh the action versions and SHAs (below) before copying templates into a repo that is older than a few weeks: `gh api repos/OWNER/REPO/releases/latest --jq .tag_name`, then resolve the tag to a commit SHA (see [security-hardening.md](security-hardening.md)).

## Versions and SHAs pinned in `assets/`

| Action or tool | Version | Commit SHA |
| --- | --- | --- |
| `actions/checkout` | v7.0.1 (2026-07-20) | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/cache` | v6.1.0 (2026-06-26) | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` |
| `actions/upload-artifact` | v7.0.2 (2026-10-07) | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |
| `actions/download-artifact` | v8.0.2 (2026-10-07) | `9000827ccba6bdab643e8b6fd33ac0654aef8333` |
| `actions/setup-node` | v7.1.0 (2026-10-08) | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `oven-sh/setup-bun` | v2.2.0 (2026-03-14); no v3 exists | `0c5077e51419868618aeaa5fe8019c62421857d6` |
| `changesets/action` (+ `select-mode`, `version`, `pack`, `publish`) | v2.1.2 (2026-09-07), for `@changesets/cli` 3 | `ae32849d5ba541f9ae29e40e22a623bc13562f51` |
| `zizmorcore/zizmor-action` | v0.6.4 (2026-09-09), pre-1.0 | `cc914d7f3750a2d13d75c7f184a1060aa0e9d482` |
| `vercel/setup-turborepo-remote-cache-action` | v1.1.0 (2026-08-21) | `49d7b1b46ba4c9251e1977986bfe18336feabc8f` |
| `aws-actions/configure-aws-credentials` | v6.3.0 (2026-09-15) | `e1253824e5c10ff9df46874f81ed3ec929e19cfd` |

Other majors seen on the same date (not pinned in templates): `google-github-actions/auth` v3, `azure/login` v3.1.0, `actions/github-script` v9.0.0, `actions/dependency-review-action` v5.0.0, `actions/attest` v4.2.2 and `actions/attest-build-provenance` v4.2.2, `step-security/harden-runner` v2.22.1, `docker/build-push-action` v7.4.0.

Tools: Bun 1.4.2, Turborepo 2.11.7, Playwright 1.64.0, Vitest 5.0.3, oxlint 1.87.0, oxfmt 0.72.0, Knip 6.41.0, TypeScript 7.0.2, `@changesets/cli` 3.0.3, actionlint 1.7.12 (does not know `cache-mode`), zizmor 1.30.1 (templates were linted with 1.26.1), Renovate 44.3.1+ for digest age rules. Runtime: current action majors run on `node24`.

Action and tool versions came from `gh api repos/.../releases/latest` and the npm registry on 2026-10-09. Treat "latest" values as a snapshot.

## GitHub documentation

- Workflow syntax (triggers, filters, `permissions`, `concurrency` incl. `queue: max`, `cache-mode`, `schedule` `timezone`): https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Events that trigger workflows: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Secure use reference: https://docs.github.com/en/actions/reference/security/secure-use
- Actions limits: https://docs.github.com/en/actions/reference/actions-limits
- Debug logging: https://docs.github.com/en/actions/how-tos/monitor-workflows/enable-debug-logging
- Reusing workflow configurations: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- Composite actions: https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action
- Dependency caching reference: https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
- Deployments and environments: https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- Larger runners: https://docs.github.com/en/actions/concepts/runners/larger-runners
- Dependabot options reference: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference
- Changelog, `cache-mode` GA (2026-09-10): https://github.blog/changelog/2026-09-10-control-github-actions-cache-access-with-cache-mode
- Changelog, read-only cache for untrusted triggers (2026-06-26): https://github.blog/changelog/2026-06-26-read-only-actions-cache-for-untrusted-triggers/
- Changelog, `queue: max` concurrency (2026-05-07): https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues
- Changelog, schedule timezone (late March 2026 updates): https://github.blog/changelog/2026-03-19-github-actions-late-march-2026-updates/
- Changelog, SHA pinning policy and blocklist (2025-08-15): https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/
- Changelog, 1 vCPU `ubuntu-slim` GA (2026-01-22): https://github.blog/changelog/2026-01-22-1-vcpu-linux-runner-now-generally-available-in-github-actions/
- Changelog, Dependabot `bun` ecosystem GA (2025-02-13): https://github.blog/changelog/2025-02-13-dependabot-version-updates-now-support-the-bun-package-manager-ga
- Runner images (labels, `ubuntu-latest` = 24.04): https://github.com/actions/runner-images

## Action repositories (README and release notes)

- https://github.com/actions/checkout (v7 README: fork PR refusal, `allow-unsafe-pr-checkout`)
- https://github.com/actions/cache (v6: ESM, Node 24)
- https://github.com/actions/upload-artifact and https://github.com/actions/download-artifact
- https://github.com/actions/setup-node (`package-manager-cache` input)
- https://github.com/oven-sh/setup-bun (inputs, version resolution)
- https://github.com/changesets/action and https://github.com/changesets/changesets (`site/guide/_snippets/automating-trusted-publishing.yaml`)
- https://github.com/zizmorcore/zizmor-action
- https://github.com/vercel/setup-turborepo-remote-cache-action

## Bun, Turborepo, test tooling

- Bun CI/CD guide: https://bun.com/docs/guides/runtime/cicd
- `bun check`: https://bun.com/docs/runtime/check
- `bun install` / `bun ci`: https://bun.com/docs/pm/cli/install
- Bun test runtime behavior: https://bun.com/docs/test/runtime-behavior
- Turborepo GitHub Actions guide: https://turborepo.dev/docs/guides/ci-vendors/github-actions
- Turborepo constructing CI (`--affected`, remote cache env): https://turborepo.dev/docs/crafting-your-repository/constructing-ci
- Turborepo remote caching: https://turborepo.dev/docs/core-concepts/remote-caching
- Playwright CI: https://playwright.dev/docs/ci and https://playwright.dev/docs/ci-intro
- Vitest improving performance (sharding, blob reports): https://vitest.dev/guide/improving-performance

## Publishing, linting, update bots

- npm trusted publishers: https://docs.npmjs.com/trusted-publishers
- `npm stage`: https://docs.npmjs.com/cli/v11/commands/npm-stage
- Changesets automating guide: https://changesets.dev/guide/automating
- zizmor usage and configuration: https://docs.zizmor.sh/usage/ and https://docs.zizmor.sh/configuration/
- actionlint: https://github.com/rhysd/actionlint
- Renovate github-actions manager and helpers presets: https://docs.renovatebot.com/modules/manager/github-actions and https://docs.renovatebot.com/presets-helpers
- act: https://github.com/nektos/act and https://nektosact.com/

## Known gaps

- Reusable workflow nesting depth and unique-workflow caps, cache eviction age, and artifact retention maximums were not confirmed from the limits page. Look them up before relying on a number.
- `ubuntu-slim` Docker support is unclear in third-party reports; the runner-images README is authoritative.
- Bun does not appear in npm's trusted publishing docs. Templates use the npm CLI to publish.
- `act` limitations are from general knowledge and the act README, not a single authoritative page.
