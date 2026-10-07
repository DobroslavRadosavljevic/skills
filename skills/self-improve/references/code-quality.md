# Bounded Code-Quality Pass

The setup run makes a small, reviewable quality pass. It does not rewrite the whole codebase. The standing rules in AGENTS.md handle ongoing improvement. This pass fixes the worst hotspots now and ranks the rest.

## Scope

- First-party code only. Skip generated, vendored, and build output.
- Keep behavior the same. Do not change public APIs unless the user approves.
- Bound the pass to what one reviewer can check in one sitting. As a guide, that is about 10 fixes or a few hundred changed lines. Put larger items in the ranked findings.
- Pick fixes by value divided by risk. High value means the code is touched often, is central, or has bug potential. Low risk means it has test coverage, a local blast radius, and a mechanical change.

## What to Look For

Rank what you find and pick the top items for the pass.

1. **Duplicated knowledge.** The same rule, constant, schema, type, query, or algorithm in two or more places. Collapse it into one source of truth and update the callers. Code that only looks alike but means different things is not duplication; leave it.
2. **Missing JSDoc where it matters.** Complex algorithms, non-obvious invariants, side effects, edge cases, and exported contracts. Write the *why* and the contract. Do not write JSDoc that repeats types, names, or simple code.
3. **Type holes:** `any`, unsafe `as` casts, non-null `!` on uncertain values, `@ts-ignore`, `@ts-expect-error` without a reason, and lint disables without a reason.
4. **Complexity:** functions that do several jobs, deep nesting, long parameter lists, flag arguments that switch behavior, and oversized files.
5. **Weak data integrity:** multi-step writes without a transaction, non-idempotent jobs or handlers, check-then-act races, and swallowed errors.
6. **Dead code:** unused exports, files, flags, and compatibility paths.
7. **Unclear names**, and patterns that do not match the rest of the codebase.

## Principles

- **DRY:** one source of truth per piece of knowledge. Do not build an abstraction until there is real shared meaning.
- **SOLID:**
  - Each module has one reason to change.
  - Extend through composition.
  - Depend on small interfaces at boundaries.
- **KISS / YAGNI:** prefer the simplest code that works. Remove speculative options and layers.
- **ACID (for data writes):**
  - Atomic: all or nothing.
  - Consistent: keep the invariants.
  - Isolated: no races.
  - Durable: confirm the write.
- **Fail fast:** validate at boundaries and throw clear errors. Do not use silent fallbacks.
- **Strict types:** make wrong states impossible to represent where that is cheap.

## Process

1. Gather candidates with search and the repo's own tools. Linters, typecheck output, and duplicate detectors count as evidence.
2. Present the planned fixes in the approval table (SKILL.md step 5).
3. Apply the fixes in small batches. After each batch, run typecheck, lint, and tests. Revert any batch that breaks something you cannot fix cleanly.
4. Report what you applied, and give the remaining findings ranked, each with file, problem, suggested fix, and risk.
