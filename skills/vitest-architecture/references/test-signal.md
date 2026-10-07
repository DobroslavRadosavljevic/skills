# Test signal (house policy)

Every test must be able to catch a real bug. A low-signal unit test passes or fails together with the code it copies. It costs upkeep and gives false trust.

## Existing setups only

- Use only the test setups the package already has. A setup exists when it has a config file, at least one test, and a script or CI job.
- Do not add an integration setup (Testcontainers, Docker Compose test stack, test database) or a browser or E2E setup (Vitest browser mode, Playwright) on your own. Suggest it, then wait for approval.
- A user request to scaffold that setup counts as approval.
- The rules that depend on a setup apply only when it exists. The unit-test rules always apply.

## Where a new test goes

1. **An E2E suite exists** (outside Vitest, for example Playwright): put user-visible behavior there. This skill does not own that layout.
2. **The `integration` project exists:** put behavior that crosses a real database, queue, HTTP layer, or service here.
3. **Otherwise, `unit`:** only for failures written down first (see below).

## Unit-test rules

- **Never write unit tests after you write code.** A test written after the code only restates the code.
- **Failure modes first.** Before the code, list every way the unit can fail: bad input, boundaries, time, state, dependency errors, security. Then write one test per listed failure. Then write the code.
- **Keep the list next to the tests,** as a top comment or as `describe` and `it` names.
- **Do not add a unit test that cannot catch a real bug** the existing integration and E2E tests miss.

Good unit targets: parsers, money and date math, pricing rules, permission matrices, state machines, security checks, regression tests for real past bugs, and property-based tests.

## Low-signal smells

Flag these in review. Delete them in a prune pass the user asked for.

| Smell | Why |
| --- | --- |
| Test restates the implementation | It cannot disagree with the code |
| Every collaborator mocked, then asserts the mocks were called | It tests the wiring the test built |
| Asserts private functions, internal state, or call order | Breaks on refactors, passes on real bugs |
| Large snapshot nobody reads | Updating it is a reflex, not a check |
| Checks what TypeScript or a schema already enforces | The compiler fails first |
| Tests framework or library behavior | That is the vendor's suite |
| Trivial getters, constants, re-exports, "renders without crashing" | No branch can be wrong |
| Path already asserted end to end by an existing integration or E2E test | Duplicate signal, extra upkeep |
| Exists only to raise coverage | Coverage is not a bug count |

Do not delete integration or E2E tests in a prune. Do not weaken an assertion, add a retry, or add a skip to make a test pass.
