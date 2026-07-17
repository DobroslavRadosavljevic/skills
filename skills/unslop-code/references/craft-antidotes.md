# Craft Antidotes

What to do after deleting AI defaults. Goal: code that matches the requirement and the repo’s existing patterns.

## Scale contract (required)

1. One-sentence requirement
2. Reuse targets (existing helpers, error boundaries, logging, validation)
3. Abstraction budget (default: none; need ≥3 real variants to introduce a pattern)
4. Error strategy (propagate vs map once at the boundary)
5. Explicit non-goals (features not requested)

If the plan looks like a framework for a script, shrink it.

## Comments

| Instead of… | Do… |
| --- | --- |
| Narrating every line | Comment invariants, tradeoffs, and non-obvious “why” only |
| Section banners | Name functions/modules; let structure show sections |
| Signature JSDoc | Rely on types; document public API behavior and edge cases |

## Structure

| Instead of… | Do… |
| --- | --- |
| Interface + one impl | Concrete function or type |
| Factory for one product | `createX(...)` plain function — or just construct |
| Manager/Helper/Utils stack | One domain-named module (`formatInvoiceTotal`, `loadCheckoutSession`) |
| Options bag for 2 knobs | Two parameters or constants |
| Unrequested platform | Minimum that ships the ask; extend when reuse is proven |

## Errors

| Instead of… | Do… |
| --- | --- |
| try/catch everywhere | Catch only to recover differently or map for users |
| `catch { return [] }` | Propagate, or return a typed error result the caller must handle |
| Impossible null checks | Make illegal states unrepresentable; trust narrowed types |

## Types

| Instead of… | Do… |
| --- | --- |
| `any` / double cast | Domain types; `unknown` + narrow; schema parse at boundaries |
| `@ts-ignore` | Fix the type, or `@ts-expect-error` with a one-line why |
| `value!` | Narrow, default explicitly, or fix the upstream type |

## Naming

Prefer **domain verb + noun**. `parseWebhookPayload` beats `handleData`. `InvoiceRepository` beats `DataManager` when persistence is the job — still prefer project vocabulary over generic Manager.

## Dead code and deps

- Delete unused params and speculative helpers in the same change.
- Import only packages that exist in the lockfile (or that the user approved adding).
- Use the project logger — or nothing. `console.log` is not observability.

## Style

Match the file you edited. One import style, one quote style, one naming scheme per change.

## Tests (when touching tests)

Assert observable behavior and failure modes. Prefer the project’s test patterns. Do not add assertion-free “smoke” tests that only construct mocks.

## Human / scale test

After rework:

1. Could a smaller solution satisfy the same requirement?
2. Does any catch hide a real failure?
3. Would a teammate need the narrating comments to understand the code?
4. Was any unrequested feature kept “just in case”?

Fail any → keep simplifying.
