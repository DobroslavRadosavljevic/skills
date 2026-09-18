# Source Map

This reference captures the current Playwright docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-09-18
- Stable npm packages: `@playwright/test@1.63.0`, `playwright@1.63.0`, `playwright-core@1.63.0` (published 2026-09-04)
- npm `latest` dist-tag: `1.63.0` (all three packages aligned)
- npm `beta` observed: `1.63.0-beta-1789413634000`
- npm `next` observed: `1.64.0-alpha-2026-09-18` (canary; treat as unavailable unless the project uses it)
- Package `engines.node`: `>=20`. Docs system requirements: latest Node 22.x, 24.x, or 26.x
- Official homepage / docs: https://playwright.dev
- Official repository: https://github.com/microsoft/playwright
- Context7 selection used for docs research: `/websites/playwright_dev`, cross-checked against `/microsoft/playwright`
- Docker image family (docs): `mcr.microsoft.com/playwright:v1.63.0-noble` (pin to the project's Playwright version)
- Related agent packages (separate cadence from Test Runner): `@playwright/mcp@0.0.81`, `@playwright/cli@0.1.20`
- Experimental CT packages last published as `@playwright/experimental-ct-react@1.62.1` / `@playwright/experimental-ct-vue@1.62.1` (no 1.63 tarball). `@playwright/experimental-ct-svelte` last published `1.58.2`

Treat canary/`next` and leftover experimental CT APIs as unavailable unless the project explicitly depends on them.

`reducedMotion` / `forcedColors` / `contrast` are first-class `use` options in current API (`Added in: v1.50`). 1.63 release notes still call out the standalone options; do not treat them as 1.63-only.

## 1.63 (current)

Home for facts added or highlighted in Playwright 1.63:

- Named `test(..., { lock })` / `test.describe(..., { lock })` — tests sharing a lock name never run concurrently across files, workers, and projects
- `page.frameLocator()` / `frame.frameLocator()` with no selector search any frame in the subtree; the rest of the locator must still resolve in one frame
- `locator.visible()` — recommended replacement for `:visible` CSS
- `test.step(..., { subtitle, params })`; API steps report locator/args; HTML report duration waterfall
- Trace `snapshots` object: `{ dom, aria, screen }`; Trace Viewer **Display Aria** mode
- `storageState({ opfs: true })` includes Origin Private File System
- `httpCredentials` accepts an array (first matching origin wins; no origin matches any request)
- `page.on('dialogclosed')` / `browserContext.on('dialogclosed')`
- `locator.ariaSnapshotJSON()` / `page.ariaSnapshotJSON()`
- `request.get<User>()` (and siblings) type `response.json()`
- `--add-reporter` appends reporters; `omitTags` on list/line/dot/github/junit
- `bunx playwright install --no-remove`; `bunx playwright codegen --http-credentials`
- Built-in `perfetto` reporter
- Experimental CT packages are no longer published; migrate to stories/galleries before leaving 1.62
- Ubuntu 20.04 unsupported
- Linux arm64 Chromium is now Chrome for Testing (same as other platforms)
- Browsers: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6; also tested Chrome 153 / Edge 153

## 1.62

Home for facts added in Playwright 1.62 (still current on 1.63):

- Built-in `fixtures.mount()` + stories/galleries component-testing model
- Most operations and web-first assertions accept `signal: AbortSignal` (does **not** disable the default timeout; pass `timeout: 0` to disable)
- Visual comparisons and screenshots support WebP (`.webp` name / `type: 'webp'`; quality 100 = lossless)
- `reporter.preprocess()` can skip/exclude/fix/fail tests before `onBegin`
- `retryStrategy: 'immediate' | 'isolated'`
- `storageState({ credentials: true })` persists virtual WebAuthn passkeys
- Action option `scroll: 'auto' | 'none'`
- `apiResponse.timing()`, `locator.waitForFunction()`
- `page.evaluate` / `addInitScript` accept functions as arguments (`exposeFunctions`)
- Test Runner bundles MCP and CLI: `bunx playwright mcp`, `bunx playwright cli`
- HTML reporter `mergeFiles`
- Headless clipboard is isolated from the OS
- Debian 11 unsupported
- Browsers then: Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5

## Docker tags (1.63.0)

Official images (Microsoft Artifact Registry):

| Tag | Base |
| --- | --- |
| `mcr.microsoft.com/playwright:v1.63.0` | Ubuntu 24.04 LTS (Noble) — same as `-noble` |
| `mcr.microsoft.com/playwright:v1.63.0-noble` | Ubuntu 24.04 LTS (Noble Numbat) — default in docs |
| `mcr.microsoft.com/playwright:v1.63.0-jammy` | Ubuntu 22.04 LTS (Jammy) |
| `mcr.microsoft.com/playwright:v1.63.0-resolute` | Ubuntu 26.04 LTS (Resolute) |

The image does **not** include the Playwright npm package. Pin the tag to the installed Playwright version. Prefer `--ipc=host`. Alpine/musl is unsupported (Firefox/WebKit need glibc).

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
- Parallelism / locks: https://playwright.dev/docs/test-parallel
- Network / mock: https://playwright.dev/docs/network · https://playwright.dev/docs/mock
- Trace / debug / UI Mode: https://playwright.dev/docs/trace-viewer · https://playwright.dev/docs/debug · https://playwright.dev/docs/test-ui-mode
- CI / sharding / Docker: https://playwright.dev/docs/ci · https://playwright.dev/docs/test-sharding · https://playwright.dev/docs/docker
- API testing: https://playwright.dev/docs/api-testing
- Component testing: https://playwright.dev/docs/test-components
- Accessibility: https://playwright.dev/docs/accessibility-testing
- Snapshots / aria: https://playwright.dev/docs/test-snapshots · https://playwright.dev/docs/aria-snapshots
- Emulation / clock: https://playwright.dev/docs/emulation · https://playwright.dev/docs/clock
- CLI / codegen: https://playwright.dev/docs/test-cli · https://playwright.dev/docs/codegen-intro
- Reporters: https://playwright.dev/docs/test-reporters
- Test agents: https://playwright.dev/docs/test-agents
- Release notes / canary: https://playwright.dev/docs/release-notes · https://playwright.dev/docs/canary-releases
- MCP / CLI for agents: https://playwright.dev/docs/getting-started-mcp · https://playwright.dev/docs/getting-started-cli
- Languages: https://playwright.dev/docs/languages
