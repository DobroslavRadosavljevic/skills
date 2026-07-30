# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: 2026-07-30
- Package: **`vitest@4.1.10`** (npm `latest`)
- V3 line: dist-tag `V3` → **3.2.7** (docs: https://v3.vitest.dev/)
- Next major: dist-tag `beta` → **5.0.0-beta.7** (not current stable)
- Engines: Node `^20.0.0 || ^22.0.0 || >=24.0.0`
- Vite peer (required): `^6.0.0 || ^7.0.0 || ^8.0.0`
- Homepage: https://vitest.dev/
- Docs ToC: https://vitest.dev/llms.txt
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
4. Keep `@vitest/coverage-*`, `@vitest/ui`, `@vitest/browser-*` on the **same** version as `vitest`.
5. For upgrades, re-read https://vitest.dev/guide/migration.

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
- Coverage: https://vitest.dev/guide/coverage
- Browser: https://vitest.dev/guide/browser/
- Projects: https://vitest.dev/guide/projects
- Reporters: https://vitest.dev/guide/reporters
- UI: https://vitest.dev/guide/ui
- Migration: https://vitest.dev/guide/migration
- Testing types: https://vitest.dev/guide/testing-types
- Common errors: https://vitest.dev/guide/common-errors

### API

- `test` / `describe` / hooks: https://vitest.dev/api/
- `expect`: https://vitest.dev/api/expect
- `vi`: https://vitest.dev/api/vi
- `bench`: https://vitest.dev/api/#bench

### Config

- Index: https://vitest.dev/config/
- coverage: https://vitest.dev/config/coverage
- projects: https://vitest.dev/config/projects
- pool / maxWorkers: https://vitest.dev/config/pool · https://vitest.dev/config/maxworkers
- browser: under https://vitest.dev/config/browser/

## Related packages (align to 4.1.10)

| Package | Role |
|---|---|
| `@vitest/coverage-v8` | Default coverage provider |
| `@vitest/coverage-istanbul` | Istanbul coverage |
| `@vitest/ui` | UI + HTML reporter |
| `@vitest/browser-playwright` | Playwright browser provider |
| `@vitest/browser-webdriverio` | WebdriverIO provider |
| `@vitest/browser-preview` | Local preview provider (not for CI) |
| `jsdom` / `happy-dom` | Optional Node DOM environments |
