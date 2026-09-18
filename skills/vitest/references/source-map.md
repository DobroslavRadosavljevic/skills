# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: 2026-09-18
- Package: **`vitest@5.0.1`** (npm `latest`)
- Previous major: dist-tag `V4` → **4.1.11** (docs: https://v4.vitest.dev/)
- V3 line: dist-tag `V3` → **3.2.7** (docs: https://v3.vitest.dev/)
- Pre-releases (stale vs latest): `rc` → **5.0.0-rc.4**, `beta` → **5.0.0-beta.7**
- Engines: Node `^22.12.0 || ^24.0.0 || >=26.0.0`
- Vite peer (required): `^6.4.0 || ^7.0.0 || ^8.0.0`
- `@types/node` peer (optional): `^22.0.0 || >=24.0.0`
- Homepage: https://vitest.dev/
- Docs ToC: https://vitest.dev/llms.txt
- Announcement: https://vitest.dev/blog/vitest-5
- Changelog: https://github.com/vitest-dev/vitest/releases/tag/v5.0.0 · patch https://github.com/vitest-dev/vitest/releases/tag/v5.0.1
- Repo: https://github.com/vitest-dev/vitest
- License: MIT
- Context7 IDs: `/vitest-dev/vitest`, `/websites/vitest_dev`, `/websites/vitest_dev_guide`

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs before answering “latest” questions.
2. Check versions:

   ```sh
   bunx vitest --version
   bun pm ls vitest
   # or: npm view vitest version
   ```

3. Prefer https://vitest.dev/ and https://vitest.dev/llms.txt. If docs and installed package disagree, report the mismatch.
4. Keep `@vitest/coverage-*`, `@vitest/ui`, `@vitest/browser-*` on the **same** version as `vitest` (WebdriverIO may lag; see table).
5. For upgrades, re-read https://vitest.dev/guide/migration/ (4→5) and https://v4.vitest.dev/guide/migration (3→4).

## Official Pages

### Guide

- Getting started: https://vitest.dev/guide/
- Features: https://vitest.dev/guide/features
- Writing tests: https://vitest.dev/guide/learn/writing-tests
- Matchers: https://vitest.dev/guide/learn/matchers
- Async: https://vitest.dev/guide/learn/async
- Setup/teardown: https://vitest.dev/guide/learn/setup-teardown
- CLI: https://vitest.dev/guide/cli
- Filtering: https://vitest.dev/guide/filtering
- Environment: https://vitest.dev/guide/environment
- Parallelism: https://vitest.dev/guide/parallelism
- Snapshot: https://vitest.dev/guide/snapshot
- Mocking: https://vitest.dev/guide/mocking
- Conditional mocking (`vi.when`): https://vitest.dev/guide/recipes/conditional-mocking
- Coverage: https://vitest.dev/guide/coverage
- Browser: https://vitest.dev/guide/browser/
- Trace view: https://vitest.dev/guide/browser/trace-view
- Playwright traces: https://vitest.dev/guide/browser/playwright-traces
- ARIA snapshots: https://vitest.dev/guide/browser/aria-snapshots
- Projects: https://vitest.dev/guide/projects
- Reporters: https://vitest.dev/guide/reporters
- UI: https://vitest.dev/guide/ui
- Benchmarking: https://vitest.dev/guide/benchmarking
- Migration 4→5: https://vitest.dev/guide/migration/
- Jest: https://vitest.dev/guide/migration/jest
- Mocha: https://vitest.dev/guide/migration/mocha
- Testing types: https://vitest.dev/guide/testing-types
- Common errors: https://vitest.dev/guide/common-errors
- Improving performance: https://vitest.dev/guide/improving-performance
- OpenTelemetry: https://vitest.dev/guide/open-telemetry

### API

- `test` / `describe` / hooks: https://vitest.dev/api/
- `expect`: https://vitest.dev/api/expect
- `vi`: https://vitest.dev/api/vi
- Browser context: https://vitest.dev/api/browser/context

### Config

- Index: https://vitest.dev/config/
- coverage: https://vitest.dev/config/coverage
- projects: https://vitest.dev/config/projects
- pool / maxWorkers: https://vitest.dev/config/pool · https://vitest.dev/config/maxworkers
- browser: https://vitest.dev/config/browser/
- fsModuleCache: https://vitest.dev/config/fsmodulecache
- sharedViteServer: https://vitest.dev/config/sharedviteserver
- experimental: https://vitest.dev/config/experimental
- clearMocks: https://vitest.dev/config/clearmocks
- detectAsyncLeaks: https://vitest.dev/config/detectasyncleaks

## Related packages (align to 5.0.1 unless noted)

| Package | Role | npm (2026-09-18) |
|---|---|---|
| `@vitest/coverage-v8` | Default coverage provider | **5.0.1** |
| `@vitest/coverage-istanbul` | Istanbul coverage (`@vitest/istanbuljs` internals) | **5.0.1** |
| `@vitest/ui` | UI + HTML reporter | **5.0.1** |
| `@vitest/browser-playwright` | Playwright browser provider (recommended) | **5.0.1** |
| `@vitest/browser-preview` | Local preview provider (not for CI) | **5.0.1** |
| `@vitest/browser` | Browser internals / `SerializedLocator` types | **5.0.1** |
| `@vitest/browser-webdriverio` | WebdriverIO provider (community-maintained; lags core) | **5.0.0** |
| `jsdom` / `happy-dom` | Optional Node DOM environments | independent |

Deprecated / do not add for new work: `@vitest/runner`, `@vitest/ws-client`. Do not import `expect` from `@vitest/expect` inside Vitest tests — use `vitest`.
