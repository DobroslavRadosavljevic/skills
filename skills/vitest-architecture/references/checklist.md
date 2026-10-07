# Checklists (Vitest architecture)

## Scaffold Vitest on a package

```text
Vitest scaffold:
- [ ] vitest.config.ts with projects + passWithNoTests
- [ ] vitest.unit.config.ts (name: "unit")
- [ ] vitest.integration.config.ts (name: "integration") — only if real-dep tests exist or the user asked
- [ ] tests/unit/ (+ tests/integration/ when that project exists)
- [ ] No new Testcontainers / test DB / browser setup without approval
- [ ] package.json scripts: test, test:watch, test:integration
- [ ] vitest (+ aligned @vitest/*) as catalog: or pinned dep
- [ ] Import from vitest in first test
```

## Add a unit test

```text
Unit test:
- [ ] No existing integration or E2E test can catch this failure
- [ ] Failure-mode list written before the code; one test per listed failure
- [ ] Not written after the code or to raise coverage
- [ ] File under tests/unit/
- [ ] Fast / in-memory / no Docker; mocks only at real boundaries
- [ ] Aspect-named file
- [ ] No live paid APIs
```

## Add an integration test

```text
Integration test:
- [ ] Integration project already exists (else suggest it; do not add it)
- [ ] File under tests/integration/
- [ ] Real dep strategy matches what the package already uses (containers / host DB / live skipIf)
- [ ] Timeouts / fileParallelism sensible
- [ ] Load matching with-* overlay if needed
- [ ] Elysia HTTP: treaty(app) — see with-elysia-eden.md (no handle/Request)
```

## Review

```text
Layout review:
- [ ] Matches references/tree.md
- [ ] Default gate is unit-only
- [ ] passWithNoTests present
- [ ] No bun:test
- [ ] Low-signal unit tests flagged (see test-signal.md)
- [ ] CI runs test:integration when it exists
- [ ] Propose move map before rewriting paths
```
