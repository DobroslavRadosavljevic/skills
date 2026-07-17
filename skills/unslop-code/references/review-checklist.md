# Review Checklist

Mark failures with IDs from [banned-patterns.md](banned-patterns.md).

## Critical

- [ ] No hallucinated imports/APIs (DED04)
- [ ] No silent catch fallbacks hiding failures (ERR02, ERR03)
- [ ] No new `any` / `as unknown as` / unexplained suppressions (TYP*)

## Grep / static

- [ ] No narrating / banner / emoji comments (CMT*)
- [ ] No signature-only JSDoc on internals (CMT04, CMT05)
- [ ] No Manager/Helper/Utils wrapper stacks for one path (STR03)
- [ ] No single-impl interface/abstract “flexibility” (STR01)
- [ ] No Factory/Strategy with &lt;3 variants (STR02)
- [ ] No unrequested platform features (STR06)
- [ ] No try/catch on non-throwing work (ERR01)
- [ ] No impossible null guards (ERR04)
- [ ] No unused “future” params/flags (DED01, DED02)
- [ ] No leftover `console.log` as logging (DED03)
- [ ] Edited file matches its own conventions (STY01)
- [ ] No drive-by unrelated refactors (STY02)

## Scale / design

- [ ] Scale contract exists and matches the ask
- [ ] Reuses project helpers/boundaries instead of reinventing
- [ ] Abstraction count justified by real variants *now*
- [ ] Errors propagate or map once at the right boundary
- [ ] Public behavior preserved (unless authorized)

## Tests (if in scope)

- [ ] Assert behavior, not only mocks (TST01)
- [ ] Every test has expectations (TST02)
- [ ] No mock fixtures in production paths (TST03)

## Pivot

**3+** hits in one module → redesign the unit; don’t rename wrappers.

## Pass criteria

Fingerprints cleared (or brief-excepted), types honest, failures visible, solution sized to the requirement.
