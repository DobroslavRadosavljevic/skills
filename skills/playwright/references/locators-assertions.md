# Locators, Actions, And Assertions

## Locator pick order

Prefer user-facing attributes and explicit contracts:

1. `getByRole(role, { name })` — default for interactive controls
2. `getByLabel` — form fields with labels
3. `getByPlaceholder` — fields with placeholders but no labels
4. `getByText` — non-interactive text (`div` / `span` / `p`); prefer role for buttons/links
5. `getByAltText` / `getByTitle`
6. `getByTestId` — explicit test contract when copy/roles churn
7. CSS / XPath — last resort with justification

```ts
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByLabel('Email').fill('user@example.com')
await page.getByTestId('checkout-total').click()
```

Locators are lazy and re-resolve on every action. Prefer chaining and `filter({ hasText, has, hasNot, visible })` over `.first()` / `.nth()`.

### Strict mode

Single-target actions fail if the locator matches more than one element. Treat that as ambiguity: tighten the locator. Do not silence with `nth`/`first` unless the list position is the real contract.

### Avoid

- CSS class soup and deep XPath as the default
- Deprecated layout CSS (`:near`, `:right-of`, …)
- Storing and reusing `ElementHandle` across re-renders — keep `Locator`

## Actions and auto-waiting

Actions retry until actionability checks pass or the timeout fires.

| Action | Notes |
| --- | --- |
| `click` / `dblclick` / `check` / `setChecked` | Visible, stable, enabled, receives events |
| `hover` / `dragTo` | Visible, stable, receives events |
| `fill` / `clear` | Default for text inputs; focuses and sets value |
| `pressSequentially` | Only when the page needs real per-key events |
| `press` | Shortcuts / single keys |
| `selectOption` | By value, label, or index |
| `setInputFiles` | Uploads |
| `force: true` | Skips some checks — last resort, document why |
| `evaluate` / `dispatchEvent` | Escape hatches, not user-path defaults |

Prefer `fill` over `locator.type()` for normal forms.

## Web-first assertions

```ts
// Bad — no retry
expect(await page.getByText('Welcome').isVisible()).toBe(true)

// Good — retries until timeout
await expect(page.getByText('Welcome')).toBeVisible()
```

Core matchers:

- Locator: `toBeVisible`, `toBeHidden`, `toHaveText` / `toContainText`, `toHaveValue`, `toBeChecked`, `toBeEnabled` / `toBeDisabled`, `toHaveCount`, `toHaveAttribute`, `toHaveAccessibleName`, `toHaveRole`, `toMatchAriaSnapshot`
- Page: `toHaveURL`, `toHaveTitle`

Also:

- Soft: `expect.soft(...)` continues, fails the test at the end
- Poll: `expect.poll(async () => ...)` and `expect(...).toPass()` for custom retry blocks

Prefer auto-retrying assertions over reading `textContent()` / `allTextContents()` and asserting with plain `toBe`.

## Hard waits

Do not ship `page.waitForTimeout` / sleep for production tests. Wait with locator actions, web-first expect, navigation, or network signals instead.

## Anti-patterns

| Anti-pattern | Prefer |
| --- | --- |
| `waitForTimeout(2000)` | Auto-wait + `expect(...).toBeVisible()` |
| `expect(await el.isVisible()).toBe(true)` | `await expect(el).toBeVisible()` |
| `getByText('Submit')` on a button | `getByRole('button', { name: 'Submit' })` |
| `.first()` to fix strict mode | Unique role/name, filter, or parent scope |
| `click({ force: true })` by default | Fix overlay / hit-target |
| Asserting third-party live sites | `route` mocks |
| Shared mutable page state across tests | Fixtures + isolation / `storageState` |
