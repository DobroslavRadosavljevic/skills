# Removal Checklist

Apply per kill candidate after evidence says it is safe (or the user authorized the break).

## Before Delete

- [ ] Name the **canonical** current path (module, field, flag value, API)
- [ ] List all references: imports, dynamic names, env reads, config, docs, tests, generated clients
- [ ] Check runtime toggles (env, remote config, feature flag defaults and prod state when known)
- [ ] Check persisted data / message formats still produced or consumed in supported versions
- [ ] Confirm public/SemVer impact; get approval if external break

## Delete In This Order

1. **Migrate callers** to the canonical path (or delete obsolete callers).
2. **Remove branches** that select legacy behavior (flags, if/else, dual-read/write).
3. **Delete implementations**, shims, adapters, and obsolete types/schemas.
4. **Remove config**: env vars, flag definitions, defaults, docs tables.
5. **Clean exports**: package exports, barrels, route tables, permission maps.
6. **Fix types** so the obsolete shape is unrepresentable where practical.
7. **Update tests** to current behavior only; delete legacy-only suites/fixtures.
8. **Grep again** for the old names, flag keys, and field names.

## After Delete

- [ ] No commented-out old body left behind
- [ ] No `throw new Error('deprecated')` stubs for internal-only code
- [ ] No empty files or forever-`true` flags left as fossils
- [ ] Error handling fails on invalid *current* input instead of translating to legacy shapes
- [ ] Narrowest typecheck/lint/tests for touched surfaces pass (or gaps reported)

## Data And Migrations

When legacy lives in storage:

- Prefer an explicit migration (or one-shot script) to the new shape, then remove read/write of the old shape from app code.
- Do not delete applied migration history files just to “look clean.”
- New migrations that drop obsolete columns/tables are in scope when the app no longer reads them and the user wants that cleanup.
- If old rows must remain readable temporarily, report that as **Keep** with a dated exit criterion — do not pretend the cleanup is done.

## Breaking Changes

If removal breaks supported external clients:

1. Stop and report impact unless the user already approved a break.
2. If approved, remove completely in-repo and note required client/version cutover in the completion report.
3. Do not leave half-shims that encourage continued use of the old contract.
