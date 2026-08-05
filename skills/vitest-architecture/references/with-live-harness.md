# Extension: live harness + skipIf

Load when integration tests probe a running stack (API health, edge worker, network) and skip when unavailable.

## Stance

Optional local/CI tests that need a live process use `describe.skipIf` / `it.skipIf` (or Effect equivalents) after a cheap health probe. Do not fail the whole monorepo unit gate when the stack is down.

## MUST

1. Probe first (health URL, TCP, or fixture fetch); skip clearly when down.
2. Keep live harnesses under **integration** (or a clearly named opt-in script).
3. Never put “requires staging credentials” tests in the default unit script.
4. Document how to start the stack for humans running integration.

## MUST NOT

1. Silent passes that look green but never ran assertions because skip was accidental — log/skip reason should be obvious.
2. Using live harnesses as a substitute for containerized integration when containers are feasible and faster in CI.

## Checklist

```text
Live harness overlay:
- [ ] Health probe + skipIf
- [ ] Integration / opt-in only
- [ ] Docs for starting the stack
```
