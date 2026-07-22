# Debugging, CI, And Advanced Surfaces

## Debugging path

1. **UI Mode** (`bunx playwright test --ui`) — watch, time-travel, locator picker, network/console. Project dependencies may not auto-run.
2. **Trace Viewer** — open `trace.zip` with `bunx playwright show-trace` or https://trace.playwright.dev (client-side only).
3. **Inspector** (`bunx playwright test --debug` or `page.pause()`) — headed, timeout 0, step-through.

### Recording defaults

| Option | Recommended starter |
| --- | --- |
| `trace` | `'on-first-retry'` (CI); avoid always-on in CI |
| `screenshot` | `'only-on-failure'` |
| `video` | `'on-first-retry'` or off |

Trace mode set also includes `on`, `off`, `retain-on-failure`, `on-all-retries`, and related retain variants — pick the lightest option that still diagnoses flake.

## CI checklist

- [ ] `CI` set; `forbidOnly: !!process.env.CI`
- [ ] `bun install --frozen-lockfile` then `bunx playwright install --with-deps`, or a version-matched Docker image
- [ ] Docker tag matches Playwright version (`mcr.microsoft.com/playwright:vX.Y.Z-noble`); prefer `--ipc=host`
- [ ] `retries` (often 1–2) + `trace: 'on-first-retry'`
- [ ] `workers: 1` or a small number on a single machine; scale wall-clock with **shards**
- [ ] Shards: `--shard=x/y`, `reporter: 'blob'`, merge with `bunx playwright merge-reports --reporter html`
- [ ] Upload HTML/trace artifacts with cancellation-safe conditions; treat artifacts as sensitive
- [ ] Auth secrets via CI secrets; do not commit `playwright/.auth`
- [ ] Visual baselines generated on the same OS/browser image as CI

Minimal shape: checkout → setup Node → `bun install --frozen-lockfile` → install browsers → `bunx playwright test` → upload `playwright-report/`.

## API testing

Use the built-in `request` fixture for pure API tests, seeding state before UI, and asserting server postconditions.

```ts
test('create user via API then see it in UI', async ({ request, page }) => {
  await request.post('/api/users', { data: { name: 'Ada' } })
  await page.goto('/users')
  await expect(page.getByRole('cell', { name: 'Ada' })).toBeVisible()
})
```

Bridge API login to UI with `storageState` from the request context.

## Component testing (experimental)

- Packages: `@playwright/experimental-ct-react`, `@playwright/experimental-ct-vue`
- `@playwright/experimental-ct-svelte` was **removed**
- Node tests + real browser `mount`; Vite under the hood
- Caveats: no complex live objects across the boundary; module mocks often do not affect the browser bundle; mount per test; prefer user-facing assertions

Use CT only when the project already adopted it or the task is explicitly component-level. Otherwise prefer E2E.

## Emulation, clock, a11y, visuals

| Need | Approach |
| --- | --- |
| Mobile / device | `devices['iPhone 13']` (and friends); override after spread |
| Geo / permissions | `geolocation` + `permissions: ['geolocation']` |
| Locale / timezone / color scheme | `locale`, `timezoneId`, `colorScheme` |
| Time | Prefer `page.clock.setFixedTime`; install clock before other clock APIs |
| A11y audits | `@axe-core/playwright` + `AxeBuilder`; automated ≠ full WCAG |
| A11y structure | `toHaveAccessibleName`, `toHaveRole`, `toMatchAriaSnapshot` |
| Visuals | `expect(page).toHaveScreenshot()`; update with `-u`; same OS/browser as CI |

## Agent tooling

| Tool | Best for |
| --- | --- |
| Playwright CLI + skills (`@playwright/cli` / playwright-cli) | Coding agents writing/debugging tests in-repo (more token-efficient) |
| `@playwright/mcp` | Exploratory / long-running agent loops with persistent browser + a11y-tree snapshots |

Do not confuse the current harness's generic browser tools with `@playwright/mcp`. Treat `browser_run_code_unsafe`-style capabilities as trusted-client only when present.
