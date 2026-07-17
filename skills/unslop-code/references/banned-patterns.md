# Banned Patterns

AI-code fingerprints. This catalog owns **model defaults**, not every classical maintainability smell (Long Method, God Class, organic duplication).

## Comments — CMT*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| CMT01 | Narrating comments | `// increment i`, `// return the result`, `// create the client` above obvious code |
| CMT02 | Section banners | `// ===== Helpers =====`, `/* --- Utils --- */`, box-drawing separators |
| CMT03 | Emoji in comments/docs | `// 🚀`, `/** ✅ ... */` |
| CMT04 | Signature-restating JSDoc | `@param id - The id`, `@returns The result` with no extra meaning |
| CMT05 | README-in-code | Multi-paragraph docs on private/internal helpers |

## Structure — STR*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| STR01 | Single-impl abstraction | `interface X` / abstract class with exactly one concrete impl “for flexibility” |
| STR02 | Premature patterns | Factory/Builder/Strategy/Observer/DI with &lt;3 real variants *now* |
| STR03 | Wrapper stacks | `XService` → `XManager` → `XHelper` → `XUtils` for one call path |
| STR04 | Tiny options bags | Config object for ≤2 knobs that never vary |
| STR05 | File for one-use crumbs | New module for &lt;~30 lines used once |
| STR06 | Unrequested platform | Rate limiter, webhooks, analytics, pluggable backends, auth frameworks beyond the ask |

## Errors — ERR*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| ERR01 | Try/catch wallpaper | try/catch around non-throwing ops (`toFixed`, property access, sync pure work) |
| ERR02 | Swallow | catch that only `console.error` / logs and continues |
| ERR03 | Silent fallback | `return []` / `{}` / `null` / fake default inside catch |
| ERR04 | Impossible guards | null/undefined checks on non-optional typed values |
| ERR05 | Duplicate boundaries | Local handling when framework/global boundary already maps errors |

## Types — TYP*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| TYP01 | `any` | `: any`, `as any` in new/changed code |
| TYP02 | Double assertion | `as unknown as T` |
| TYP03 | Unexplained suppress | `@ts-ignore` / `@ts-expect-error` / `# type: ignore` without why |
| TYP04 | Non-null crutch | `!` used instead of narrowing or fixing the type |

## Naming — NAM*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| NAM01 | Generic primary names | `data`, `result`, `handler`, `manager`, `util(s)`, `helper`, `processor`, `service` without a domain noun |
| NAM02 | Hungarian noise | `IFoo` + `Foo` inconsistency introduced in the same change without project convention |

## Dead / deps — DED*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| DED01 | Future surface | Unused params, dead helpers, phantom types “for later” |
| DED02 | Dead flags | Feature flags / optional branches with no current caller |
| DED03 | Debug as logging | Leftover `console.log` / `print` framed as production logging |
| DED04 | Hallucinated deps | Imports, methods, or packages not in lockfile/stdlib/project |

## Style — STY*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| STY01 | Convention drift | Mixed quotes/imports/React import style/naming in one edited file |
| STY02 | Drive-by rewrite | Unrelated refactors bundled with the requested change |

## Tests (when in scope) — TST*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| TST01 | Mock theatre | Tests that only assert mocks were called, not behavior |
| TST02 | Assertion-free | Tests with no expectations |
| TST03 | Mock leakage | Mock URLs/ids/fixtures leaking into production paths |
