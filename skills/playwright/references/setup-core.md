# Setup And Core

## Packages

| Package | Use when |
| --- | --- |
| `@playwright/test` | E2E / Test Runner (default for this skill) |
| `playwright` | Standalone library scripts without the runner |
| `playwright-core` | Core API without browser download helpers |
| `@playwright/browser-chromium` / `-firefox` / `-webkit` | Optional: download browsers on `bun install` |

Language bindings (Python, .NET, Java) track the same major.minor family but can lag on patch. Prefer Node `@playwright/test` unless the project is already on another language.

## Install

New project:

```sh
bun create playwright
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

### Browser binaries

Browser binaries are **not** in the package tarball. Each Playwright version needs matching browsers. After bumping the package, re-run `bunx playwright install`. Env knobs include `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`, `PLAYWRIGHT_DOWNLOAD_HOST`, and `HTTPS_PROXY`.

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

### Projects and browsers

- One project per browser/device via `devices`.
- Filter locally with `--project=chromium`.
- Use project `dependencies` for setup (auth) projects.
- Branded browsers: `channel: 'chrome' | 'msedge'`.

### `webServer`

Start the app under test from config when tests need a local server. Prefer `url` readiness checks and `reuseExistingServer: !process.env.CI`. Multiple servers can be an array.

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

## CLI

| Command | Purpose |
| --- | --- |
| `bunx playwright test` | Run tests |
| `bunx playwright test --headed` | Headed |
| `bunx playwright test --ui` | UI Mode |
| `bunx playwright test --debug` | Inspector |
| `bunx playwright test --project=chromium` | Filter project |
| `bunx playwright test path -g "title"` | Filter files / titles |
| `bunx playwright show-report` | HTML report |
| `bunx playwright show-trace trace.zip` | Trace Viewer |
| `bunx playwright codegen [url]` | Record tests |
| `bunx playwright test -u` | Update snapshots |
| `bunx playwright install` / `install --with-deps` | Browsers (+ OS deps) |

TypeScript is the init default. The Test Runner compiles tests; no separate TS build step is required for typical setups.
