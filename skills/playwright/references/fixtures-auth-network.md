# Fixtures, Auth, And Network

## Page Object Model + fixtures

Prefer POM classes that own locators and high-level methods, then inject them with fixtures instead of only `beforeEach` hooks.

```ts
// pages/todo-page.ts
import type { Page, Locator } from '@playwright/test'

export class TodoPage {
  readonly newTodo: Locator

  constructor(private readonly page: Page) {
    this.newTodo = page.getByPlaceholder('What needs to be done?')
  }

  async goto() {
    await this.page.goto('/todos')
  }

  async addTodo(text: string) {
    await this.newTodo.fill(text)
    await this.newTodo.press('Enter')
  }
}
```

```ts
// fixtures.ts
import { test as base } from '@playwright/test'
import { TodoPage } from './pages/todo-page'

export const test = base.extend<{ todoPage: TodoPage }>({
  todoPage: async ({ page }, use) => {
    await use(new TodoPage(page))
  },
})

export { expect } from '@playwright/test'
```

Fixtures give on-demand setup, colocated teardown via `use()`, and reuse across files. Keep POM selectors role/label/test-id based — centralizing CSS still concentrates brittleness.

## Parallelism and isolation

- Default: files parallel; tests in a file serial unless `fullyParallel` or `describe.configure({ mode: 'parallel' })`.
- Prefer isolation over `serial` mode.
- `workerIndex` vs `parallelIndex`: use `parallelIndex` when mapping to unique accounts that must stay stable across worker restarts.
- Worker-scoped fixtures (`{ scope: 'worker' }`) fit shared auth accounts or expensive bootstrapping.
- Unique backend rows: derive ids from `testInfo.testId`. Unique files: `testInfo.outputPath(...)`.

### Test locks

When a few tests share an external resource that cannot be concurrent, declare a named lock. Tests with the same lock name never run at the same time across files, workers, and projects; everything else stays parallel.

```ts
test('update user settings', { lock: 'user-settings' }, async ({ page }) => {
  // ...
})

test('reset the database', { lock: ['database', 'external-api'] }, async () => {
  // runs only when every listed lock is free
})

test.describe('billing', { lock: 'billing-account' }, () => {
  // every test in the group holds the lock
})
```

Playwright acquires all locks before the test starts and releases them when it finishes.

In default and serial modes, tests in a file run together in order, so a lock on **any** test is held for the **whole file**. Prefer `fullyParallel` (or parallel describes) when locks should be per-test.

Prefer locks over `mode: 'serial'` when only the shared resource needs exclusion.

## Auth / `storageState`

Recommended pattern when tests do not fight over server-side session state:

1. Setup project authenticates once and writes `playwright/.auth/*.json`.
2. Dependent browser projects load `storageState`.
3. Gitignore auth files — they contain cookies and storage.

```ts
// auth.setup.ts
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.USER_EMAIL!)
  await page.getByLabel('Password').fill(process.env.USER_PASSWORD!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
```

```ts
// playwright.config.ts (excerpt)
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user.json',
    },
    dependencies: ['setup'],
  },
]
```

UI Mode does not auto-run project dependencies. Re-run the setup spec when auth expires.

### Storage-state extras

`storageState()` persists cookies, localStorage, and (when opted in) IndexedDB, WebAuthn credentials, and OPFS. Session storage is **not** persisted.

| Need | Option |
| --- | --- |
| IndexedDB auth (e.g. Firebase) | `storageState({ path, indexedDB: true })` |
| Virtual passkeys | `storageState({ path, credentials: true })` after `context.credentials.create` / `install` |
| Origin private file system | `storageState({ path, opfs: true })` |

### Other auth patterns

| Situation | Approach |
| --- | --- |
| Faster login | API login via `request`, then `request.storageState({ path })` |
| Server-side session conflicts | Worker-scoped fixture + unique account per `parallelIndex` |
| Multiple roles | `test.use({ storageState: '…/admin.json' })` per file/`describe` |
| Logged-out tests | `test.use({ storageState: { cookies: [], origins: [] } })` |

### Web Storage API

For the current origin, `page.localStorage` / `page.sessionStorage` read and write storage without `evaluate`:

```ts
await page.localStorage.setItem('token', 'abc')
const token = await page.localStorage.getItem('token')
```

## Network mocking

```ts
await context.route('**/api/users', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Ada' }]),
  })
})

await page.route('**/analytics/**', (route) => route.abort())
```

Rules:

- Prefer `context.route` when popups/new pages matter.
- Register routes before navigation that triggers the request.
- Start `waitForResponse` / `waitForRequest` **before** the click/submit:

```ts
const responsePromise = page.waitForResponse('**/api/checkout')
await page.getByRole('button', { name: 'Pay' }).click()
const response = await responsePromise
```

`httpCredentials` on context/`use` may be a single object or an **array**; the first entry whose `origin` matches the request is used, and entries without `origin` match any request.

### HAR

- Record with `routeFromHAR(..., { update: true })`, then replay.
- Prefer zipped HAR.
- Matching is strict on URL + method (and POST body when relevant).
- Do not commit HAR files that contain secrets.

Also available: `route.continue` with header/method mutation, `route.fetch` then patch + `fulfill`, and `page.addInitScript` for browser API mocks.
