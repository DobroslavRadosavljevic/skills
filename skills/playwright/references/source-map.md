# Source Map

This reference captures the current Playwright docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-22
- Stable npm packages: `@playwright/test@1.61.1`, `playwright@1.61.1`, `playwright-core@1.61.1`
- npm `latest` dist-tag: `1.61.1`
- npm `next` observed: `1.62.0-alpha-2026-07-22` (canary; treat as unavailable unless the project uses it)
- Official homepage / docs: https://playwright.dev
- Official repository: https://github.com/microsoft/playwright
- Context7 selection used for docs research: `/websites/playwright_dev`, cross-checked against `/microsoft/playwright`
- Docker image family observed in docs: `mcr.microsoft.com/playwright:v1.61.0-noble` (pin to the project's Playwright version)
- Related agent packages (separate from Test Runner): `@playwright/mcp`, `@playwright/cli`

Treat canary/`next` and experimental CT APIs as unavailable unless the project explicitly depends on them.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info @playwright/test
   bun info playwright
   ```

3. Prefer official docs pages under https://playwright.dev/docs/. If docs and package metadata disagree, report the mismatch.
4. Check the local project package version and whether browser binaries match (`bunx playwright --version`, `bunx playwright install` after bumps).
5. For CI Docker, align the image tag with the installed Playwright major.minor.patch.

## Official Pages

- Intro / install: https://playwright.dev/docs/intro
- Library vs Test: https://playwright.dev/docs/library
- Writing tests: https://playwright.dev/docs/writing-tests
- Best practices: https://playwright.dev/docs/best-practices
- Locators: https://playwright.dev/docs/locators
- Actionability: https://playwright.dev/docs/actionability
- Assertions: https://playwright.dev/docs/test-assertions
- Input: https://playwright.dev/docs/input
- Configuration: https://playwright.dev/docs/test-configuration
- Use options: https://playwright.dev/docs/test-use-options
- Projects: https://playwright.dev/docs/test-projects
- Fixtures: https://playwright.dev/docs/test-fixtures
- POM: https://playwright.dev/docs/pom
- Auth: https://playwright.dev/docs/auth
- Network / mock: https://playwright.dev/docs/network · https://playwright.dev/docs/mock
- Trace / debug / UI Mode: https://playwright.dev/docs/trace-viewer · https://playwright.dev/docs/debug · https://playwright.dev/docs/test-ui-mode
- CI / sharding / Docker: https://playwright.dev/docs/ci · https://playwright.dev/docs/test-sharding · https://playwright.dev/docs/docker
- API testing: https://playwright.dev/docs/api-testing
- Component testing: https://playwright.dev/docs/test-components
- Accessibility: https://playwright.dev/docs/accessibility-testing
- Snapshots / aria: https://playwright.dev/docs/test-snapshots · https://playwright.dev/docs/aria-snapshots
- Emulation / clock: https://playwright.dev/docs/emulation · https://playwright.dev/docs/clock
- CLI / codegen: https://playwright.dev/docs/test-cli · https://playwright.dev/docs/codegen-intro
- Release notes / canary: https://playwright.dev/docs/release-notes · https://playwright.dev/docs/canary-releases
- MCP / CLI for agents: https://playwright.dev/docs/getting-started-mcp · https://playwright.dev/docs/getting-started-cli
- Languages: https://playwright.dev/docs/languages
