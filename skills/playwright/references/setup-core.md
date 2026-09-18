# Setup And Core

## Packages

| Package | Use when |
| --- | --- |
| `@playwright/test` | E2E / Test Runner (default for this skill) |
| `playwright` | Standalone library scripts without the runner |
| `playwright-core` | Core API without browser download helpers |
| `@playwright/browser-chromium` / `-firefox` / `-webkit` | Optional: download browsers on `bun install` |

Language bindings (Python, .NET, Java) track the same major.minor family but can lag on patch. Prefer Node `@playwright/test` unless the project is already on another language.

Do not add `@playwright/experimental-ct-*` on 1.63+. Those packages stopped at 1.62.x. Component testing now lives on built-in `mount` — see [debugging-ci-advanced.md](debugging-ci-advanced.md).

## System requirements

Docs (https://playwright.dev/docs/intro#system-requirements):

- Node.js: latest 22.x, 24.x, or 26.x
- Windows 11+, Windows Server 2019+, or WSL
- macOS 14 (Sonoma) or later
- Debian 12 / 13, Ubuntu 22.04 / 24.04 / 26.04 (x86-64 or arm64)

Package `engines.node` is `>=20`. Prefer the docs Node line for new installs. Ubuntu 20.04 and Debian 11 are unsupported on current Playwright.

## Install

New project:

```sh
bun create playwright@latest
```

Existing project:

```sh
bun add -d @playwright/test
bunx playwright install
```

CI / Linux deps:

```sh
bunx playwright install --with-deps
```

Update:

```sh
bun add -d @playwright/test@latest
bunx playwright install --with-deps
bunx playwright --version
```

Keep other Playwright versions' browsers when several installs share a machine:

```sh
bunx playwright install --no-remove
```

### Browser binaries

Browser binaries are **not** in the package tarball. Each Playwright version needs matching browsers. After bumping the package, re-run `bunx playwright install`. Env knobs include `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`, `PLAYWRIGHT_DOWNLOAD_HOST`, and `HTTPS_PROXY`.

1.63 browsers: Chromium 153.0.8010.12 (Chrome for Testing, including Linux arm64), Firefox 155.0, WebKit 26.6. Also tested against Chrome 153 and Edge 153.

## Library vs Test

| | `playwright` | `@playwright/test` |
| --- | --- | --- |
| Import | `from 'playwright'` | `from '@playwright/test'` |
| Run | `node script.js` | `bunx playwright test` |
| Fixtures / expect / config | No | Yes |

Prefer Test for app E2E. Use Library for one-off automation outside the runner.

## Config essentials

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  retryStrategy: 'immediate',
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'bun run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Timeouts

| Layer | Typical default |
| --- | --- |
| Test | 30s (body + fixtures + `beforeEach`) |
| Expect | 5s |
| Action / navigation | none (capped by test timeout) unless set in `use` |

Do not paper over flaky locators by raising timeouts first. Fix uniqueness and web-first assertions.

`signal: AbortSignal` on actions/assertions does **not** disable the default timeout. Pass `timeout: 0` to disable it.

### Retries

- `retries` — max attempts after the first failure (0 by default).
- `retryStrategy: 'immediate'` (default) — retry as soon as a worker is free.
- `retryStrategy: 'isolated'` — run all retries at the end, one by one in a single worker (less interference, longer wall clock).
- `failOnFlakyTests: !!process.env.CI` — fail the run if any test is classified flaky.

### Projects and browsers

- One project per browser/device via `devices`.
- Filter locally with `--project=chromium`.
- Use project `dependencies` for setup (auth) projects.
- Branded browsers: `channel: 'chrome' | 'msedge'`.

### `webServer`

Start the app under test from config when tests need a local server. Prefer `url` readiness checks and `reuseExistingServer: !process.env.CI`. Multiple servers can be an array.

For servers without an HTTP readiness URL, wait on stdout/stderr. Named capture groups become env vars:

```ts
webServer: {
  command: 'bun run start',
  wait: {
    stdout: /Listening on port (?<my_server_port>\d+)/,
  },
},
```

Then `test.use({ baseURL: `http://localhost:${process.env.MY_SERVER_PORT ?? 3000}` })`.

### `use` highlights

| Option | Notes |
| --- | --- |
| `trace` / `video` | Modes include `on-first-retry`, `on-all-retries`, `retain-on-failure`, `retain-on-first-failure`, `retain-on-failure-and-retries`. Trace `snapshots` may be `{ dom, aria, screen }`. |
| `screenshot` | `off` / `on` / `only-on-failure` / `on-first-failure` |
| `httpCredentials` | Object or **array**; first matching `origin` wins |
| `reducedMotion` / `forcedColors` / `contrast` | First-class emulation (also via `page.emulateMedia`) |
| `reuseContext` | Discouraged for E2E. Component galleries may set `true` for speed — see [debugging-ci-advanced.md](debugging-ci-advanced.md) |
| `testIdAttribute` | Default `data-testid`; comma-separated list allowed |

## Built-in fixtures

```ts
import { test, expect } from '@playwright/test'

test('example', async ({ page, context, browser, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
})
```

| Fixture | Isolation |
| --- | --- |
| `page` | Fresh page per test |
| `context` | Isolated profile per test |
| `browser` | Shared across tests in a worker |
| `request` | Isolated `APIRequestContext` |
| `mount` | Component stories only — navigates to gallery `baseURL` |

## CLI

| Command | Purpose |
| --- | --- |
| `bunx playwright test` | Run tests |
| `bunx playwright test --headed` | Headed |
| `bunx playwright test --ui` | UI Mode |
| `bunx playwright test --debug` | Inspector |
| `bunx playwright test --debug=cli` | Pause for Playwright CLI attach |
| `bunx playwright test --project=chromium` | Filter project |
| `bunx playwright test path -g "title"` | Filter files / titles (`-G` = `--grep-invert`) |
| `bunx playwright test --add-reporter=perfetto` | Append a reporter; `--reporter` replaces config reporters |
| `bunx playwright show-report` | HTML report (also accepts `.zip`) |
| `bunx playwright show-trace trace.zip` | Trace Viewer |
| `bunx playwright trace …` | CLI trace analysis for agents |
| `bunx playwright codegen [url]` | Record tests (`--http-credentials` for HTTP auth) |
| `bunx playwright test -u` | Update snapshots |
| `bunx playwright install` / `install --with-deps` | Browsers (+ OS deps) |
| `bunx playwright install --no-remove` | Keep browsers from other Playwright versions |
| `bunx playwright mcp` | Bundled MCP server (since 1.62) |
| `bunx playwright cli` | Bundled Playwright CLI (since 1.62) |
| `bunx playwright init-agents --loop=vscode` | Planner / generator / healer definitions |
| `bunx playwright init-skills` | Install Playwright's own agent skills (including CT gallery setup) |

TypeScript is the init default. The Test Runner compiles tests; no separate TS build step is required for typical setups.
