# JSDoc Examples

Patterns for TypeScript. Types own the shape; comments own meaning.

## Skip obvious code

```ts
// Bad — narrates the type and the name
/**
 * Gets a user by id.
 * @param {string} id - The user id
 * @returns {Promise<User | null>} The user or null
 */
export async function getUserById(id: string): Promise<User | null> {
  return db.users.findById(id);
}

// Good — no JSDoc; signature is enough
export async function getUserById(id: string): Promise<User | null> {
  return db.users.findById(id);
}
```

## Document non-obvious contracts

```ts
/**
 * Resolves the effective price after stacking discounts.
 *
 * Discounts apply in declaration order. Percentage discounts use the
 * running subtotal, not the original amount. Returns 0 when the stack
 * would go negative — never throws for over-discounting.
 *
 * @param cents - Amount in integer cents (not dollars)
 * @param discounts - Empty array leaves `cents` unchanged
 */
export function applyDiscountStack(
  cents: number,
  discounts: readonly Discount[],
): number {
  // ...
}
```

## Side effects and ordering

```ts
/**
 * Claims the next job for this worker and marks it `running`.
 *
 * Uses `SELECT … FOR UPDATE SKIP LOCKED`. Safe under concurrent workers.
 * Must call {@link completeJob} or {@link failJob} for the returned id;
 * abandoned claims are re-queued after `visibilityTimeoutMs`.
 *
 * @throws {QueueUnavailableError} when the broker connection is down
 */
export async function claimNextJob(
  workerId: string,
  visibilityTimeoutMs: number,
): Promise<Job | null> {
  // ...
}
```

## Invariants and edge cases

```ts
/**
 * Binary-searches a timeline sorted by ascending `at` (ms since epoch).
 *
 * @returns Index of the latest event with `at <= targetAt`, or `-1` when
 *   every event is strictly after `targetAt` (including empty input)
 */
export function latestEventIndexAtOrBefore(
  events: readonly TimelineEvent[],
  targetAt: number,
): number {
  // ...
}
```

## Generics — role, not restated bounds

```ts
/**
 * Groups items by a key derived from each element.
 *
 * Key order follows first-seen insertion. Values within a group keep
 * input order. Prefer this over `Map` + manual loops when the group key
 * is expensive to recompute at call sites.
 *
 * @param keyOf - Must be pure and stable for the same item within one call
 */
export function groupBy<T, K>(
  items: readonly T[],
  keyOf: (item: T) => K,
): Map<K, T[]> {
  // ...
}
```

## `@example` when usage is non-obvious

```ts
/**
 * Parses a compact duration used in ops configs.
 *
 * Accepts `ms`, `s`, `m`, `h` suffixes. Plain integers are milliseconds.
 *
 * @example
 * parseDuration("500") // 500
 * parseDuration("2s") // 2000
 * parseDuration("1.5m") // 90000
 *
 * @throws {SyntaxError} when the string is empty or the unit is unknown
 */
export function parseDuration(raw: string): number {
  // ...
}
```

## Deprecation

```ts
/**
 * @deprecated Use {@link createSessionV2} — v1 cookies are rejected after 2026-09-01.
 */
export function createSession(userId: string): Session {
  // ...
}
```

## Classes and complex state

```ts
/**
 * Rate limiter using a fixed window per key.
 *
 * Windows are UTC-aligned to `windowMs`. Counts are eventually consistent
 * across processes when backed by Redis; local mode is single-process only.
 * `check` does not consume a token; `take` does.
 */
export class RateLimiter {
  /**
   * Consumes one token if available.
   *
   * @returns `ok: false` with `retryAfterMs` when the window is exhausted
   */
  take(key: string): { ok: true } | { ok: false; retryAfterMs: number } {
    // ...
  }
}
```

## Fix noisy existing JSDoc

```ts
// Before — type echo + vague summary
/**
 * Handles the webhook.
 * @param req - Request
 * @param res - Response
 * @returns Promise
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {

// After — document the hard parts only
/**
 * Verifies the Stripe signature, then enqueues idempotent domain events.
 *
 * Duplicate deliveries with the same `event.id` are acknowledged with 200
 * and skipped. Raw body must be untouched — do not JSON-parse before this.
 *
 * @throws {WebhookSignatureError} when `Stripe-Signature` is missing or invalid
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
```

## Private helpers

Document a private helper only if it encodes a subtle invariant that callers inside the module rely on:

```ts
/**
 * Normalizes emails for identity comparison: trim, lowercase, strip
 * `+tag` for allowlisted consumer domains only (see `PLUS_TAG_DOMAINS`).
 */
function canonicalEmail(raw: string): string {
  // ...
}
```

Otherwise leave private helpers uncommented when names and types suffice.
