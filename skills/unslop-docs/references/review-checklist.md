# Review Checklist

Mark failures with IDs from [banned-patterns.md](banned-patterns.md).

## Critical

- [ ] No install/API/CLI fiction (FIC01, FIC02)
- [ ] No prompt/chat/invisible leakage (LEK*)
- [ ] No badges that 404 or use placeholders (CHR02)

## Grep / static

- [ ] No emoji in headings (CHR01)
- [ ] No badge walls / beautifier chrome (CHR02, CHR03)
- [ ] No empty skeleton with fluff (STR01)
- [ ] No labeled-bullet Feature walls / triad substance (STR02, STR03)
- [ ] Identity before benefits (STR05)
- [ ] No marketing fluff cluster (CLM*)
- [ ] No soft unpinned install (CLM03)
- [ ] No changelog empty phrases (FIC04)
- [ ] CONTRIBUTING/CoC fit this repo (BPL*)

## Verifiability

- [ ] Every install/usage command checked against manifests and/or CI
- [ ] Every documented public symbol/flag/endpoint exists in source or generated API
- [ ] Architecture diagrams match modules (or removed)
- [ ] Features are user-visible capabilities, not dependency lists
- [ ] Changelog entries are user-facing and honest about breakages

## Quality read

- [ ] Docs contract exists (identity + happy path + API truth)
- [ ] Section depth matches difficulty
- [ ] Prefer examples + failure modes over signature dumps
- [ ] New contributor could succeed without asking chat

## Pivot

**3+** hits on one page → rewrite the page; don’t just strip emoji.

## Pass criteria

Chrome/fluff cleared, leaks zero, and remaining claims were verified (or explicitly marked unverified).
