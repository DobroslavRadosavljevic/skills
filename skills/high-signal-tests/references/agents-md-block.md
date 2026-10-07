# AGENTS.md Block

Paste this block into the root `AGENTS.md`. Put it after the commands and any writing rules. If a testing section exists, replace it and keep its still-true commands.

Fill the setup lines from `package.json`, CI, or the test config. Never invent a command.

- Delete the `E2E` line if the repo has no E2E setup. Also delete the artifact bullet.
- Delete the `Integration` line if the repo has no integration setup.
- If both are missing, replace both lines with `No E2E or integration setup. Do not add one without approval.`

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
