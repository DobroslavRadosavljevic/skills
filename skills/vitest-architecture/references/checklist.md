# Checklists (Vitest architecture)

## Scaffold Vitest on a package

```text
Vitest scaffold:
- [ ] vitest.config.ts with projects + passWithNoTests
- [ ] vitest.unit.config.ts (name: "unit")
- [ ] vitest.integration.config.ts (name: "integration")
- [ ] tests/unit/ (+ tests/integration/ as needed)
- [ ] package.json scripts: test, test:watch, test:integration
- [ ] vitest (+ aligned @vitest/*) as catalog: or pinned dep
- [ ] Import from vitest in first test
```

## Add a unit test

```text
Unit test:
- [ ] File under tests/unit/
- [ ] Fast / mocked / no Docker
- [ ] Aspect-named file
- [ ] No live paid APIs
```

## Add an integration test

```text
Integration test:
- [ ] File under tests/integration/
- [ ] Real dep strategy chosen (containers / host DB / live skipIf)
- [ ] Timeouts / fileParallelism sensible
- [ ] Load matching with-* overlay if needed
```

## Review

```text
Layout review:
- [ ] Matches references/tree.md
- [ ] Default gate is unit-only
- [ ] passWithNoTests present
- [ ] No bun:test
- [ ] Propose move map before rewriting paths
```
