# Review Dimensions

Work through every dimension that applies to the scope. Skip only what is clearly irrelevant (e.g. a11y on a pure server-side batch script with no UI), and note major skips under residual risk when non-obvious.

## Correctness

- Logic matches intended behavior and adjacent contracts
- Edge cases: empty, null/undefined, zero, max, duplicates, ordering, timezones, locales
- Error paths, retries, cancellation, partial failure, idempotency
- Concurrency, races, double-submit, stale reads
- Compatibility with existing callers and serialized data

## Types And Contracts

- Public types match runtime behavior
- Narrowness at boundaries; no unsafe escapes without justification
- Schema/validation present where input is untrusted
- API/ABI/semver impact of signature or payload changes

## Architecture And Ownership

- Code sits at the right layer/boundary
- No new circular deps or leaky abstractions
- State/effects owned at the right place for the stack in use
- Duplication vs wrong abstraction judged carefully (only when in scope)

## Security And Privacy

- Injection, XSS, SSRF, path traversal, command execution
- Authn/authz checks on sensitive operations
- Secret handling, logging redaction, PII exposure
- CSRF, cookie flags, CORS, redirect handling
- Dependency and supply-chain red flags in the change itself

## Reliability And Operations

- Timeouts, backpressure, resource cleanup
- Observability: useful errors, metrics, logs without noise/secrets
- Migration/rollback safety for data or config changes
- Feature flags / compatibility windows when relevant

## Performance

- Hot-path complexity, N+1, unnecessary work in render or request path
- Caching correctness (keying, invalidation, stampede)
- Bundle/payload size regressions when UI or client code changes
- Allocations or subscriptions that leak or thrash

## UI / UX (When UI Is In Scope)

- States: loading, empty, error, success, disabled, offline
- Accessibility: roles, names, focus, keyboard, contrast where checkable
- Motion/prefers-reduced-motion when animation is added
- Responsive behavior and overlap/clipping risks when layout changes

## Tests And Verification

- Tests cover the risky behavior changed
- Assertions match user-visible or contract behavior (not only implementation details)
- Missing tests called out with what to add
- Existing failing or flaky patterns not worsened

## Consistency And Maintainability

- Matches local naming, file layout, and idioms
- Comments explain non-obvious why; no lying comments
- No unrelated churn, debug leftovers, or commented-out code
- Docs / changelog / API notes updated when user-facing or public contracts change

## Change Hygiene (Diff Mode)

- Scope matches the stated intent of the change
- No accidental commits of secrets, local paths, or machine-specific config
- Generated files reviewed only for surprising drift
- Dangerous refactors mixed with unrelated features flagged

## Severity Guide

| Severity | Use when |
| --- | --- |
| `blocker` | Wrong/unsafe for merge; data loss, security hole, broken contract, crash on main path |
| `high` | Likely defect or serious risk under realistic conditions |
| `medium` | Real issue with meaningful cost; should fix before or soon after merge |
| `low` | Limited impact or narrow edge; still worth fixing |
| `nit` | Style/clarity preference aligned with local norms; optional |
