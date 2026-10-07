# Testing section (required by default)

Every **root** `AGENTS.md` this skill creates or improves includes the block below by default. Omit it only when the user says the repo follows a different test policy. Nested files omit it unless that subtree has its own E2E or integration setup.

The rules stop agents from writing low-signal unit tests. A low-signal unit test passes or fails with the code it copies, so it catches no real bug that the E2E and integration tests miss.

## Only existing setups

The E2E and integration rules apply only to setups the repo already has. A setup exists when it has a config file, at least one test, and a command (script, CI job, or make target). An installed package alone does not count.

- Never add an E2E setup (for example Playwright) or an integration setup (for example Testcontainers) while writing `AGENTS.md`.
- Delete the `E2E` line and the artifact bullet if there is no E2E setup.
- Delete the `Integration` line if there is no integration setup.
- If both are missing, replace both lines with `No E2E or integration setup. Do not add one without approval.`
- The unit-test rules always apply.

## Insert or replace

- If a Testing section exists, **replace it** with this block. Move unique, still-true facts (focused commands, fixtures, test env vars) into the setup lines.
- If none exists, insert it after Communication.
- Fill setup lines with real commands and paths from `package.json`, CI, or the test config. Never invent a command.
- Do not delete existing tests during an `AGENTS.md` edit. If the repo has many low-signal unit tests, offer a separate prune pass and wait for approval.

When **reviewing**: fail the file if the block is missing, a rule is softened, placeholders are unfilled, or it lists a setup the repo does not have.

## Canonical block (paste, then fill or delete setup lines)

```markdown
## Testing (E2E and integration first)

Hard rule for all test work. A unit test that cannot catch a real bug costs upkeep and gives false trust.

- **Use only the test setups listed below.** Do not add a new E2E or integration setup (for example Playwright or Testcontainers). Ask first.
- **Never write unit tests after you write code.** A test written after the code only copies what the code does. It does not find bugs.
- **Prefer E2E and integration tests.** Use them to prove that complex features work through real entry points and real services.
- **End each E2E test with an artifact.** The artifact must be verifiable and repeatable: for example a trace, screenshot, video, HAR file, or JSON report.
- **Test a unit in isolation only when you must.** First, write down all the ways it can fail. Then write the code. Each isolated test checks one failure from that list. Keep the list next to the test.
- **Delete or do not add a unit test that cannot catch a real bug the E2E and integration tests miss.**

Setups in this repo:

- E2E (`<tool>`): all `<command>`, one `<command>`, artifacts in `<path>`
- Integration (`<tool>`): all `<command>`, one `<command>`, needs `<Docker, env vars>`
```
