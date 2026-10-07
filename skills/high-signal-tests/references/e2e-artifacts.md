# E2E Artifacts

Applies only when the repo already has an E2E setup. Do not add an E2E tool just to make artifacts.

Every E2E test ends by writing an artifact. The artifact is the proof that the feature worked. A person or an agent can open it later and check the result without running the test again.

## Requirements

- **Verifiable:** it shows the outcome, not only "passed". Examples: the final screen, the response body, the trace of each step.
- **Repeatable:** the same code and data give the same artifact. Fix seeds, clocks, time zones, locales, and test data.
- **Findable:** it goes to one known path that the repo ignores in git. CI uploads that path.
- **Named by test:** the file name includes the spec and test name, so a reader can match artifact to test.
- **Free of secrets:** mask tokens, cookies, and personal data before you write it.

## Artifact by surface

| Surface | Artifact | Example setup |
| --- | --- | --- |
| Web UI | Trace, final screenshot, video on failure, HTML report | Playwright: `trace: 'on'`, `screenshot: 'on'`, `video: 'retain-on-failure'`, `outputDir: 'test-results'`, `reporter: [['html'], ['json', { outputFile: 'test-results/report.json' }]]` |
| HTTP API | Request and response log as JSON, or HAR | Write each request, status, and body to `test-results/<spec>/<test>.json` |
| CLI | Golden output file and exit code | Compare stdout to `__golden__/<test>.txt`; write the actual output next to it |
| Jobs, queues, events | Event log as JSON lines | Record each emitted event with a fixed clock |
| Email, PDF, images | Rendered file plus a visual diff | Save the output and compare it to a stored baseline |

## Repeatable runs

- Start from a known state each run: seed script, fresh container, or reset endpoint.
- Freeze time where output depends on it.
- Pin browser, OS image, and fonts in CI when screenshots are compared.
- Do not depend on test order. Each test sets up its own data.

## Commands

Run all specs, then one spec. Use the repo's real scripts. If the repo uses Playwright:

```bash
bunx playwright test
bunx playwright test e2e/checkout.spec.ts
bunx playwright show-report
```
