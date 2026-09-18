# Debugging, CI, And Advanced Surfaces

## Debugging path

1. **UI Mode** (`bunx playwright test --ui`) — watch, time-travel, locator picker, network/console. Project dependencies may not auto-run.
2. **Trace Viewer** — open `trace.zip` with `bunx playwright show-trace` or https://trace.playwright.dev (client-side only).
3. **Inspector** (`bunx playwright test --debug` or `page.pause()`) — headed, timeout 0, step-through.
4. **CLI attach** (`bunx playwright test --debug=cli`) — coding agents attach with Playwright CLI.

### Recording defaults

| Option | Recommended starter |
| --- | --- |
| `trace` | `'on-first-retry'` (CI); avoid always-on in CI |
| `screenshot` | `'only-on-failure'` |
| `video` | `'on-first-retry'` or off |

Trace/video modes also include `on`, `off`, `retain-on-failure`, `on-all-retries`, `retain-on-first-failure`, and `retain-on-failure-and-retries` — pick the lightest option that still diagnoses flake.

### Traces

`use.trace` may be a mode string or an object. `snapshots` now selects what to capture on every action:

```ts
use: {
  trace: {
    mode: 'on-first-retry',
    snapshots: { dom: true, aria: true, screen: true },
  },
}
```

`true` for `snapshots` still means `{ dom: true }`. With aria + screen captured, Trace Viewer **Display Aria** shows the action screenshot beside the aria tree.

`test.step('Login', fn, { subtitle: 'as admin', params: { user: 'admin' } })` carries structured data into the HTML report, traces, and the `perfetto` reporter. Playwright API steps already report the target locator as the subtitle.

CLI trace analysis: `bunx playwright trace open <zip>`, then `actions` / `action N` / `snapshot`.

HTML report: duration waterfall next to steps; `mergeFiles: true` groups by top-level `describe`; `show-report` accepts a `.zip`.

## CI checklist

- [ ] `CI` set; `forbidOnly: !!process.env.CI`
- [ ] `bun install --frozen-lockfile` then `bunx playwright install --with-deps`, or a version-matched Docker image
- [ ] Docker tag matches Playwright version (`mcr.microsoft.com/playwright:v1.63.0-noble`); prefer `--ipc=host`. Also published: `-jammy` (22.04), `-resolute` (26.04). Bare `:v1.63.0` = noble
- [ ] `retries` (often 1–2) + `trace: 'on-first-retry'`. Consider `retryStrategy: 'isolated'` when retries contaminate parallel runs
- [ ] `workers: 1` or a small number on a single machine; scale wall-clock with **shards**
- [ ] Shards: `--shard=x/y`, `reporter: 'blob'`, merge with `bunx playwright merge-reports --reporter html`
- [ ] Upload HTML/trace artifacts with cancellation-safe conditions (`if: ${{ !cancelled() }}`); treat artifacts as sensitive
- [ ] Auth secrets via CI secrets; do not commit `playwright/.auth`
- [ ] Visual baselines generated on the same OS/browser image as CI
- [ ] Optional: `--only-changed` as a fail-fast first pass on PRs, then always a full run

Minimal shape: checkout → setup Node → `bun install --frozen-lockfile` → install browsers → `bunx playwright test` → upload `playwright-report/`.

Do not cache browser binaries in CI; restore time is comparable to download, and OS deps are not cacheable.

## API testing

Use the built-in `request` fixture for pure API tests, seeding state before UI, and asserting server postconditions.

```ts
test('create user via API then see it in UI', async ({ request, page }) => {
  const response = await request.post('/api/users', { data: { name: 'Ada' } })
  await expect(response).toBeOK()
  await page.goto('/users')
  await expect(page.getByRole('cell', { name: 'Ada' })).toBeVisible()
})
```

Type the JSON body with a type argument on the request method:

```ts
const response = await request.get<User>('/api/users/42')
const user = await response.json() // User
```

Also: `apiResponse.timing()`, `securityDetails()`, `serverAddr()`. Bridge API login to UI with `storageState` from the request context.

## Component testing (stories / galleries)

1.63+ component tests are ordinary `@playwright/test` specs against a **gallery** page you serve. There is no CT runtime, Vite integration, or extra npm package.

- A **story** (`*.story.tsx` next to the component) is one named scenario: hard-coded props, providers, recorded callbacks.
- The **gallery** (usually `playwright/gallery/`) exposes `window.mount({ story, props })` / `window.unmount()` and is served by **your** dev server.
- Built-in `mount('components/Button/Primary')` navigates to `baseURL`, calls `window.mount`, and returns a locator scoped to the story root.

```ts
import { test, expect } from '@playwright/test'

test('click should expand', async ({ mount }) => {
  const component = await mount('components/Expandable/Stateful')
  await component.getByRole('button').click()
  await expect(component.getByTestId('expanded')).toHaveValue('true')
})
```

`mount<typeof Story>(id, props)` type-checks props. `component.update(props)` re-renders without remounting; `component.unmount()` tears down.

Record callbacks **inside the story** (hidden `data-testid` inputs) instead of marshalling spies from Node. Register `page.route` **before** `mount()`. Screenshot the returned root locator, not the page.

Suggested project:

```ts
{
  name: 'components',
  testDir: './tests/components',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173/playwright/gallery/index.html',
    serviceWorkers: 'block',
    reuseContext: true, // CT speedup only; leave unset for E2E
  },
}
```

`reuseContext` is discouraged for E2E: isolation is best-effort and several context options force a fresh context anyway.

Scaffold the gallery with `bunx playwright init-skills` and ask the coding agent to set up component testing, or implement the gallery contract by hand.

### Migrating experimental CT packages

`@playwright/experimental-ct-react` / `-ct-react17` / `-ct-vue` last published at **1.62.1** and are **not** published for 1.63. `@playwright/experimental-ct-svelte` was already removed (1.58.2). Stay on Playwright 1.62 until stories replace JSX `mount(<Comp onClick={spy} />)`, then drop `playwright/index.html`, `playwright/index.ts`, `playwright/.cache`, and the experimental packages.

Do not mix experimental CT with 1.63 `@playwright/test`.

## Emulation, clock, a11y, visuals

| Need | Approach |
| --- | --- |
| Mobile / device | `devices['iPhone 13']` (and friends); override after spread |
| Geo / permissions | `geolocation` + `permissions: ['geolocation']` |
| Locale / timezone / color scheme | `locale`, `timezoneId`, `colorScheme` |
| Reduced motion / forced colors / contrast | `reducedMotion`, `forcedColors`, `contrast` |
| Time | Prefer `page.clock.setFixedTime`; install clock before other clock APIs |
| A11y audits | `@axe-core/playwright` + `AxeBuilder`; automated ≠ full WCAG |
| A11y structure | `toHaveAccessibleName`, `toHaveAccessibleDescription`, `toHaveRole`, `toMatchAriaSnapshot` |
| Visuals | `expect(page).toHaveScreenshot()`; `.webp` goldens; update with `-u`; same OS/browser as CI |

Headless clipboard is isolated from the OS — `navigator.clipboard` does not read or write the host clipboard.

## Agent tooling

| Tool | Best for |
| --- | --- |
| Playwright CLI (`bunx playwright cli` / `@playwright/cli`) | Coding agents writing/debugging tests in-repo (token-efficient) |
| `@playwright/mcp` / `bunx playwright mcp` | Exploratory / long-running agent loops with persistent browser + a11y-tree snapshots |
| `bunx playwright init-agents --loop=…` | Planner / generator / healer definitions (regenerate after Playwright upgrades) |

Since 1.62 the Test Runner bundles MCP and CLI (`bunx playwright mcp`, `bunx playwright cli`). Standalone packages `@playwright/mcp` and `@playwright/cli` remain separately versioned.

Do not confuse the current harness's generic browser tools with `@playwright/mcp`. Treat `browser_run_code_unsafe`-style capabilities as trusted-client only when present.
