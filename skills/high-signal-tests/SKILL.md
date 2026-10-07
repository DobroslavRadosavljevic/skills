---
name: high-signal-tests
description: Enforces a high-signal testing policy. Prunes low-signal unit tests that would not catch a real bug the repo's existing E2E and integration tests miss, stops post-hoc unit tests, prefers E2E and integration tests only when the repo already has that setup (never adds Playwright, Testcontainers, or similar on its own), makes E2E tests end with a verifiable and repeatable artifact, and requires a written failure-mode list before isolated tests or code. Fans pruning out across parallel subagents when available. Use when the user says "high-signal tests", "delete useless unit tests", "prune unit tests", "low-signal tests", "too many unit tests", "tests that test nothing", "stop writing unit tests", "prefer E2E", "prefer integration tests", asks to audit test value, or asks to add these testing rules to AGENTS.md. Also use before an agent writes new tests in a repo that follows this policy.
---

# High-Signal Tests

**Single goal:** every test in the repo must be able to catch a real bug. E2E and integration tests carry the load when the repo has them. Unit tests stay only for written failure modes that the higher-level tests miss.

A low-signal unit test passes or fails together with the code it copies. It costs upkeep, slows refactors, and gives false trust. Delete it.

## The Policy

1. **Use only the test setups the repo already has.** Do not add an E2E setup (for example Playwright) or an integration setup (for example Testcontainers) on your own. Suggest one if a gap is serious, then wait for approval.
2. **Never write unit tests after you write code.** A test written after the code only restates the code. It does not find bugs.
3. **Prefer E2E and integration tests** when those setups exist. Use them to prove that complex features work through real entry points and real services.
4. **End each E2E test with an artifact.** The artifact must be verifiable and repeatable. See [e2e-artifacts.md](references/e2e-artifacts.md). Applies only when an E2E setup exists.
5. **Test a unit in isolation only when you must.** First, write down all the ways it can fail. Then write the code. Each isolated test checks one listed failure. See [failure-modes.md](references/failure-modes.md).

Rules 3 and 4 are enforceable only for setups that exist. Rules 1, 2, and 5, and the unit-test prune, always apply.

## Modes

Pick from the request:

- **Prune**: delete low-signal unit tests from an existing repo.
- **Write**: add tests for new or changed behavior under the policy.
- **Review**: audit a diff or test suite against the policy. Report only, do not edit.
- **Encode**: add the policy to the repo's `AGENTS.md` so later agents follow it.

A request like "delete the useless tests and add the rules" is **Prune** then **Encode**.

## Detect Setups First

Before any mode, find which higher-level setups exist. Signals and the "counts as a setup" bar are in [detect-setups.md](references/detect-setups.md). Record for each one: tool, config path, command for all tests, command for one test, and artifact path (E2E only).

If a setup does not exist, do not create it, do not install its packages, and do not write tests for it. Note the gap in the report.

## Core Rules

- Judge each unit test by one question: *Would this test catch a real bug that the existing E2E and integration tests miss?* If no, delete it. With no higher-level setup, "miss" means every bug, so the test must still catch a real bug to stay. The full rubric is in [prune-rubric.md](references/prune-rubric.md).
- Map E2E and integration coverage before you delete a test for being a duplicate.
- Never delete or weaken E2E or integration tests during a prune.
- Never weaken an assertion, add a retry, or add a skip to make a test pass.
- Delete what only existed for the removed tests: orphan mocks, fixtures, factories, test helpers, and snapshot files.
- Ask first before removing test-runner packages, changing CI jobs, or deleting a whole test project or config.
- Preserve unrelated user changes. Keep each pass reviewable.

## Prune Workflow

### 1. Map coverage

For each existing E2E and integration setup, write a short coverage map: feature, route, or service → spec that exercises it, and what it asserts. Every worker gets this map and the run commands. With no higher-level setup, the map is empty and only the coverage-free delete signals apply.

### 2. Inventory unit tests

List unit and component test files with their subject module. Exclude E2E and integration specs, generated files, vendored code, and build output.

### 3. Fan out

Split the inventory into disjoint batches, by package or directory, about 10–30 files each. Give each batch to one parallel subagent with:

- the setup list, coverage map, and run commands,
- the rubric from [prune-rubric.md](references/prune-rubric.md),
- its exact file list, and the rule to edit only those files and their orphan helpers,
- the required output: one verdict per test (`delete`, `keep`, or `move up`) with a one-line reason.

If the harness has no subagents, run the same batches one after another yourself. Two workers must never edit the same file. Shared helpers go to the orchestrator.

### 4. Reconcile

Collect the verdicts. Remove shared helpers that no remaining test imports. For each `move up` verdict, add the assertion to an existing E2E or integration spec first, then delete the unit test. For each `keep`, make sure a failure-mode comment names the bug it catches.

### 5. Verify

Run typecheck, lint, the remaining unit tests, and every existing E2E and integration suite. Search for imports of deleted helpers. If a check cannot run (for example, no Docker for integration tests), say so.

## Write Workflow

- Start at the highest existing level. If an E2E setup exists, write the E2E test for the user-visible behavior and end it with an artifact. Else, if an integration setup exists, write the integration test against real services.
- Need an isolated unit test, or no higher-level setup exists? Write the failure-mode list first, before the code. Then write the tests and the code from the list.
- Do not add a test for code you already wrote just to raise coverage.

## Encode Workflow

Paste the block from [agents-md-block.md](references/agents-md-block.md) into the root `AGENTS.md`. Replace an existing testing section. Fill the setup lines with real commands from `package.json`, CI, or the test config. Delete the lines for setups that do not exist. Never invent a command.

## Completion Report

- Mode and scope
- Setups found (E2E, integration) and setups missing
- Coverage map summary and gaps
- Deleted: count, plus files grouped by reason
- Kept: each test with the bug it catches
- Moved up: unit test → new E2E or integration assertion
- Artifacts: where E2E runs write them
- Verification run and results; anything skipped
