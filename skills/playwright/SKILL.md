---
name: playwright
description: "Build, review, debug, configure, migrate, or plan Playwright browser automation and E2E tests with current docs. Use for @playwright/test, playwright, playwright.config, locators, getByRole, assertions, fixtures, Page Object Model, storageState auth, network mocking, HAR, traces, UI Mode, codegen, CI sharding, Docker, APIRequestContext, experimental component testing, accessibility, screenshots, visual comparisons, and Playwright MCP or CLI agent tooling."
---

# Playwright

Use this skill when work touches Playwright Test, browser automation, E2E tests, locators, fixtures, auth setup, network mocking, traces, CI, API testing alongside UI, or agent browser tooling built on Playwright.

## Workflow

1. Inspect the local Playwright surface before changing code:
   - Package versions for `@playwright/test`, `playwright`, optional `@playwright/browser-*`, experimental CT packages, and Node.
   - Config: `playwright.config.ts` / `.js`, `testDir`, projects, `use` options, `webServer`, reporters, retries/workers.
   - Test layout: specs, setup projects, fixtures, POM classes, `playwright/.auth`, snapshots, and CI workflows.
   - Runtime intent: E2E UI, API-only, auth reuse, network mocks, visual/a11y checks, component tests, or agent-driven exploration.
2. Refresh docs when the user asks for latest/current behavior, versions are unclear, or the work touches CI, CT, or agent tooling. Start from [source-map.md](references/source-map.md).
3. For install, Library vs Test, config, projects, `webServer`, and CLI, use [setup-core.md](references/setup-core.md).
4. For locators, actions, auto-waiting, web-first assertions, and anti-patterns, use [locators-assertions.md](references/locators-assertions.md).
5. For fixtures, POM, auth/`storageState`, parallelism, and network/HAR mocking, use [fixtures-auth-network.md](references/fixtures-auth-network.md).
6. For traces, UI Mode, debug, CI/sharding/Docker, API testing, CT, a11y/visuals, and agent tooling, use [debugging-ci-advanced.md](references/debugging-ci-advanced.md).
7. Implement in the existing project style:
   - Prefer `@playwright/test` for E2E. Use the `playwright` library only for standalone scripts/automation without the Test Runner.
   - After changing Playwright package versions, reinstall matching browser binaries.
   - Match local locator conventions, fixture patterns, and CI artifact settings unless they contradict official guidance.

## Playwright Judgment

- Prefer user-facing locators: `getByRole` first, then label/placeholder/text/alt/title, then `getByTestId`. Avoid CSS/XPath unless justified.
- Assert with web-first `await expect(...).toBeVisible()` (and siblings). Never `expect(await locator.isVisible()).toBe(true)`.
- Trust auto-waiting. Do not ship `waitForTimeout` / sleep-based synchronization.
- Keep tests isolated. Prefer setup-project `storageState` or worker-scoped accounts over shared mutable login in every test.
- Mock third-party or uncontrollable network at `context`/`page.route`; start `waitForResponse` before the triggering action.
- Local debug path: UI Mode → Trace Viewer for CI failures → `--debug` / Inspector for step-through.
- CI defaults: `forbidOnly`, retries, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, install with `--with-deps` or a version-matched Docker image, scale with shards not only workers.
- Treat experimental CT (React/Vue) as optional and separate from E2E. Svelte CT package was removed.
- For coding agents writing tests in-repo, prefer Playwright CLI + skills when available; use Playwright MCP for live exploratory browser loops. Do not confuse harness browser tools with `@playwright/mcp`.

## Verification

Prefer the repo's existing checks. For meaningful Playwright work, include the relevant subset:

- Focused `bunx playwright test` for the changed specs/projects (`--project`, file path, or `-g` title).
- UI Mode or headed run when locator/timing behavior is unclear.
- Trace or HTML report review for flake, actionability, or network failures.
- CI-shaped smoke when changing retries, shards, reporters, Docker tags, auth setup, or `webServer`.
- Snapshot update (`-u`) only when visual baselines intentionally change, generated on the same OS/browser as CI when possible.
- Typecheck for TypeScript configs, fixtures, and POM helpers when the project typechecks tests.
