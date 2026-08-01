---
name: jsdoc
description: Enforces purposeful JSDoc on complex or non-obvious TypeScript code—algorithms, invariants, side effects, edge cases, and public contracts—without restating types or narrating simple code. Use when writing or reviewing TypeScript, adding documentation comments, cleaning noisy JSDoc, documenting public APIs, or when the user says jsdoc, JSDoc, document this, or add docs comments.
---

# JSDoc

Add JSDoc only where a careful reader cannot infer intent, constraints, or failure modes from names and types alone. Prefer TypeScript types for shape; use JSDoc for *why*, *when*, and *what breaks*.

## When to Document

Document a symbol when **any** of these are true:

- Control flow, algorithm, or state machine is non-obvious on first look.
- Behavior depends on invariants, ordering, timing, idempotency, or concurrency.
- Side effects matter (I/O, mutation, cache, network, timers, global state).
- Failure modes, throws, empty results, or partial success are part of the contract.
- Units, ranges, formats, or domain meanings are not clear from the type.
- Public / exported API that callers will use without reading the implementation.
- Deprecation, migration, security, or compatibility constraints apply.

## When Not to Document

Skip JSDoc when:

- The name + TypeScript types already explain the symbol.
- The body is a trivial getter, setter, passthrough, or one-liner map/filter.
- The comment would only restate the parameter or return type.
- The comment narrates what the next line does (`// increment i`).
- Generated code, tests that are self-describing fixtures, or vendored files (unless documenting a public test helper).

Default: **no comment**. Silence is better than noise.

## TypeScript Rules

1. **Types carry the shape.** Do not duplicate types in JSDoc (`@param {string} id`) when the signature already has `id: string`.
2. **JSDoc carries meaning.** Use prose + selective tags for behavior types cannot express.
3. Prefer `@param name` / `@returns` **descriptions** without type braces when documenting TS.
4. Keep the first sentence a summary of behavior or purpose, not a restatement of the symbol name.
5. Document non-obvious generics with a short note on what `T` represents and any constraints beyond the type bound.
6. For overloads, document each distinct call pattern; put shared caveats on the implementation or the primary export.
7. Match existing project JSDoc style (tag set, punctuation, `@returns` vs `@return`) when one is already dominant.

## Required Content for Documented Symbols

Every JSDoc block you add must include:

1. **Summary** — one sentence: what it does or why it exists (not “This function…” fluff).
2. **Non-obvious details** — only what a reader would miss: invariants, ordering, side effects, edge cases, units, security.

Add tags only when they earn their keep:

| Tag | Use when |
| --- | --- |
| `@param` | Param semantics, units, valid ranges, or “must be…” constraints beyond the type |
| `@returns` | Meaning of the value, empty/sentinel cases, or “never returns” style contracts |
| `@throws` | Documented error conditions callers should handle |
| `@example` | Non-trivial usage that types alone do not teach (keep short; one example usually enough) |
| `@see` | Related symbol, RFC, ticket, or algorithm source |
| `@deprecated` | Replacement path and removal intent |
| `@template` | Only in JS files or when documenting a generic’s *role*; prefer TS type params in `.ts` |

Do not invent tags the project never uses. Prefer standard JSDoc/TS-supported tags.

## Workflow

1. **Scope** — files, symbols, or “public API only” as the user named. If unclear, prefer exported / complex symbols over private helpers.
2. **Scan** — find candidates using the “When to Document” list. Skip obvious code.
3. **Audit existing JSDoc** — remove or rewrite comments that restate types, lie about behavior, or narrate the obvious.
4. **Write** — add concise blocks; prefer editing the symbol in place over separate doc files.
5. **Verify** — re-read: would a new teammate understand the hard parts without opening every callee? Types still match the prose?

## Quality Bar

Good JSDoc:

- Explains a constraint or failure mode you cannot see from the signature.
- Stays accurate if implementation details change under the same contract.
- Is shorter than the code it documents whenever possible.

Bad JSDoc:

- `@param id - The id`
- `@returns {Promise<User>}` when the signature already says that
- Essays that duplicate the function body
- Outdated comments that contradict the code (delete or fix; never leave lying docs)

## Examples

Concrete good/bad patterns: [examples.md](references/examples.md).

## Completion

When asked to document a scope, report briefly:

- What was documented and why it qualified.
- What was left undocumented (and that it was intentional).
- Any JSDoc removed as noise or corrected as wrong.
