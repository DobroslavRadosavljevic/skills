# Prune Rubric

One question decides each unit test: **Would this test catch a real bug that the existing E2E and integration tests miss?**

A "real bug" is wrong behavior a user, caller, or operator could see: wrong data, a crash, a security hole, data loss, or a broken contract. A change in internal structure is not a bug.

"Existing" means setups that pass the bar in [detect-setups.md](detect-setups.md). With no higher-level setup, the unit test is the only signal. It stays only if it can catch a real bug on its own.

## Delete: always

These signals apply with or without E2E and integration setups. Delete the test when one matches and no keep signal applies.

| Signal | Why it is low-signal |
| --- | --- |
| Restates the implementation (same formula, same branch logic in the test) | It changes together with the code. It cannot disagree with it. |
| Mocks every collaborator, then asserts the mocks were called | It tests the wiring the test itself built. |
| Asserts on private functions, internal state, or call order | It breaks on refactors and passes on real bugs. |
| Large snapshot of markup or objects that people update without reading | Updating it is a reflex, not a check. |
| Checks what the type system or schema already enforces | The compiler or validator already fails first. |
| Tests framework or library behavior (router matches, ORM saves, React renders) | That is the vendor's test suite. |
| Trivial getters, setters, constants, re-exports, or "renders without crashing" | No branch can be wrong. |
| Was skipped, flaky, or commented out and nobody fixed it | It gives no signal today. |
| Exists only to raise coverage | Coverage is not a bug count. |

## Delete: only when the setup exists

| Signal | Condition |
| --- | --- |
| Covers a path that an E2E spec already asserts end to end | An E2E setup exists and the coverage map shows that spec |
| Mocks a database, queue, or service that an integration test already runs for real | An integration setup exists and covers that path |

## Keep

Keep the test when it checks a failure that higher-level tests cannot reach cheaply or at all. Add a failure-mode comment if one is missing.

- **Combinatorial pure logic:** parsers, money and date math, pricing rules, permission matrices, state machines.
- **Regression tests tied to a real past bug,** with an issue link or a clear comment.
- **Security boundaries:** auth checks, input sanitizing, tenant isolation, signature checks.
- **Hard-to-trigger failures:** timeouts, retries, partial writes, race conditions, clock edges, disk or network errors.
- **Property-based or fuzz tests** over a real invariant.
- **Public library contracts** when the repo is itself a library and the published API is the entry point.
- **Real user-visible behavior with no higher-level setup to move it to.**

## Move up

Pick `move up` when the test checks real user-visible or cross-service behavior, an existing E2E or integration setup can assert it, and no spec does yet. Add that assertion first. Then delete the unit test. Never pick `move up` toward a setup that does not exist.

## Edge cases

- Integration and E2E tests are out of prune scope. Do not judge or delete them here.
- **Component tests** in a real browser that check user-visible behavior count as E2E-like. Keep them if they assert behavior, not markup.
- **Not sure?** Mark `keep` and state the doubt in the reason. A wrong delete costs more than one extra test.

## Verdict format

One line per test:

```text
<file>::<test name>: delete | keep | move up (<E2E | integration>): <reason in one line>
```
