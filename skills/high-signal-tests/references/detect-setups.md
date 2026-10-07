# Detect Setups

Find which higher-level test setups the repo already has. Rules that depend on a setup apply only when it exists.

## What counts as a setup

A setup exists only when all three are true:

1. A config or harness file is present.
2. At least one test uses it.
3. A command runs it: a script in `package.json`, a CI job, a `Makefile` or `justfile` target.

An installed package with no config, no tests, or no command is **not** a setup. Do not finish it. Report it as a gap.

## E2E signals

| Tool | Signals |
| --- | --- |
| Playwright | `playwright.config.*`, `@playwright/test` in deps, `*.spec.ts` under `e2e/` or `tests/` |
| Cypress | `cypress.config.*`, `cypress/e2e/` |
| WebdriverIO | `wdio.conf.*` |
| Detox / Maestro (mobile) | `.detoxrc*`, `.maestro/` flows |
| API or CLI E2E | A suite that starts the real app or binary and calls it from outside (HTTP client, spawned process), with its own script such as `test:e2e` |

## Integration signals

| Tool | Signals |
| --- | --- |
| Testcontainers | `testcontainers` or `@testcontainers/*` in deps, container setup in a global setup file |
| Docker Compose test stack | `docker-compose.test.yml`, `compose.test.yaml`, or a CI service block used by tests |
| Test runner project | A separate integration project or config (for example a Vitest project named `integration`, `vitest.integration.config.*`, `jest.integration.config.*`) |
| Real test database | A test database URL in `.env.test` or CI, with a migrate or seed step before tests |
| In-process app with real dependencies | Tests that boot the real app and hit real services, not mocks, with their own script such as `test:integration` |

## Record

For each setup found, record:

- tool and config path,
- command to run all tests and one test,
- artifact path (E2E only),
- what it needs to run (Docker, browsers, env vars).

For each missing setup, write one line: `No <E2E | integration> setup. Not added.`
