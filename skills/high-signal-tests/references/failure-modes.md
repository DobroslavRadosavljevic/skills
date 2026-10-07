# Failure Modes First

Use this when a unit must be tested in isolation, or when the repo has no E2E or integration setup. Write the list **before** the code. The list decides the tests. The code then makes the tests pass.

Writing the list first forces you to think about how the code breaks. Tests written after the code only check how it already works.

## Steps

1. Name the unit and its contract in one sentence: inputs, outputs, side effects.
2. List every way it can fail. Use the prompts below.
3. For each failure, write the expected behavior: the error, the return value, or the state after.
4. Drop failures that an existing E2E or integration test already covers. Note the spec name instead.
5. Write one test per remaining failure. Then write the code.
6. Keep the list next to the tests, as a top comment or as `describe` and `it` names.

## Prompts

- **Input:** empty, null, missing field, wrong type, too large, wrong encoding, duplicates, unsorted.
- **Boundaries:** zero, negative, max value, off by one, first and last item, rounding.
- **Time:** time zones, DST change, leap day, expired value, clock skew.
- **State:** called twice, called out of order, partial write, stale cache, concurrent callers.
- **Dependencies:** timeout, error response, slow response, wrong shape, retries exhausted.
- **Security:** missing auth, wrong tenant, injection, path traversal, replayed request.
- **Resources:** disk full, memory limit, rate limit, connection pool empty.

## Example

```ts
/**
 * Failure modes for applyDiscount(cart, code):
 * 1. Unknown code → throws InvalidCodeError, cart unchanged.
 * 2. Expired code (by server clock, UTC) → throws ExpiredCodeError.
 * 3. Percent discount on 0.1 + 0.2 totals → exact cents, rounds half up.
 * 4. Discount larger than total → total is 0, never negative.
 * 5. Same code applied twice → second call is a no-op.
 * Covered by existing E2E: valid code shows new total (e2e/checkout.spec.ts).
 */
describe('applyDiscount', () => {
  it('rejects an unknown code and keeps the cart unchanged', () => {})
  it('rejects an expired code by UTC server time', () => {})
  it('rounds percent discounts to exact cents, half up', () => {})
  it('never makes the total negative', () => {})
  it('ignores a second apply of the same code', () => {})
})
```
