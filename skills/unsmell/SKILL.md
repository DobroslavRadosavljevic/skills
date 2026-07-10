---
name: unsmell
description: Finds and fixes maintainability problems across a whole codebase or a user-specified scope, with explicit support for TypeScript type safety. Removes duplication, code smells, excessive complexity, poor composition, oversized files, confusing names, dead code, weak boundaries, type hacks, unsafe assertions, suppressed errors, and inconsistent patterns. Use when the user says "unsmell", requests codebase cleanup or refactoring, asks to remove duplication or smells, or wants a targeted area made simpler, safer, and more maintainable.
---

# Unsmell

Improve maintainability without changing intended behavior. Work across the full repository unless the user names a target; when a target is given, modify only that scope and the minimum dependency edges required to keep it working.

## Core Rules

- Read repository guidance and infer conventions before judging the code.
- Preserve public behavior, APIs, data formats, and compatibility unless the user authorizes a change.
- Prefer clear, cohesive code over mechanically smaller code.
- Do not treat every repeated line, long name, large file, or abstraction gap as a defect. Require a concrete maintenance cost.
- Reuse an existing local pattern when it is sound. Do not introduce a competing architecture.
- Make cohesive refactors in reviewable passes. Avoid unrelated formatting churn and speculative rewrites.
- Preserve unrelated user changes. Never remove code merely because its purpose is not immediately obvious.
- Add dependencies only when their value clearly exceeds their maintenance cost and the user permits installation.
- In TypeScript, improve the model or narrow the value instead of silencing the compiler. Do not trade a visible type error for hidden unsoundness.

## Establish Scope

Classify the request before editing:

- **Full unsmell:** inspect the complete first-party codebase, excluding generated files, vendored code, build output, caches, lockfiles, snapshots, and migrations unless they are the stated source of the problem.
- **Targeted unsmell:** inspect and edit only the named files, directory, module, feature, smell category, or dependency path. Follow references outside the target for understanding, but change them only when required by the targeted refactor.

If the boundary is ambiguous and materially affects what will be changed, ask one focused scope question. Otherwise state the inferred boundary and proceed.

## Workflow

### 1. Build a repository map

Inspect project instructions, manifests, source roots, tests, generated-code markers, module boundaries, and available quality commands. Identify the dominant language and framework conventions.

For a full unsmell, search broadly and prioritize hotspots. For a targeted unsmell, trace the target's callers, imports, exports, tests, and contracts without expanding the edit scope unnecessarily.

### 2. Find evidence-backed smells

Look for:

- Duplicated knowledge or behavior likely to drift, not harmless structural similarity.
- Long functions, oversized modules, mixed responsibilities, and low cohesion.
- Deep conditionals, complex control flow, boolean-flag behavior, and hidden state transitions.
- Primitive obsession, shotgun surgery, feature envy, leaky abstractions, and inappropriate coupling.
- Weak composition: inheritance or wrappers that obscure behavior, components with too many responsibilities, prop drilling, and orchestration mixed with domain logic.
- Dead, unreachable, obsolete, or redundant code confirmed through references and runtime or static evidence.
- Misleading, inconsistent, excessively long, or overly abbreviated names.
- Excessive directory depth, redundant path segments, and unclear ownership boundaries.
- Inconsistent error handling, resource cleanup, async control flow, and duplicated validation.
- Repeated expensive work, accidental N+1 behavior, unnecessary allocation, or avoidable rendering when supported by evidence.
- Tests that are duplicated, brittle, implementation-coupled, or missing around behavior being refactored.
- TypeScript escape hatches and type-model smells described below.

Record each candidate with location, concrete cost, confidence, proposed change, behavior risk, and affected dependencies. Do not manufacture a quota of findings.

#### TypeScript standard

In TypeScript codebases, specifically find and resolve:

- Explicit or implicit `any`, unsafe `unknown` handling, `as any`, double assertions such as `as unknown as T`, and assertions used only to force compatibility.
- Unjustified non-null assertions, definite-assignment assertions, optional chaining that masks an invalid state, and fallback values that hide missing data.
- `@ts-ignore`, unjustified `@ts-expect-error`, disabled type-aware lint rules, and generated declarations used to conceal source errors.
- Broad types such as `object`, `Function`, `{}`, unbounded `Record<string, unknown>`, loose string identifiers, and unions widened beyond valid domain states.
- Duplicated or contradictory interfaces, hand-written types that can be derived from source schemas or APIs, and parallel runtime/type definitions that can drift.
- Optional-property overload, boolean state combinations, and nullable models that permit impossible states; prefer discriminated unions and explicit state transitions when appropriate.
- Generic parameters, conditional types, overloads, utility types, and type-level abstractions that add complexity without stronger guarantees.
- Incorrect variance, mutable data exposed as readonly or vice versa, unchecked indexed access, unsafe key iteration, and lost literal types.
- Missing runtime validation at untrusted boundaries. Static types do not validate network, storage, environment, user, or parsed data.
- Type-only import/export mistakes, circular type dependencies, oversized barrel files, accidental public exports, and module boundaries that leak internals.
- Promise and callback types that hide rejection, dropped promises, mixed sync/async contracts, or errors typed more narrowly than runtime behavior.

Fix the underlying contract, data model, control-flow narrowing, or boundary validation. Prefer inference, `satisfies`, type predicates with real runtime checks, discriminated unions, exhaustive `never` checks, and schema-derived types where the project already uses a schema library. Use assertions only where an invariant is proven but cannot be expressed to the compiler; keep them narrow and document the invariant when it is not obvious.

Do not blindly enable stricter compiler options during a targeted cleanup because that expands scope. During a full TypeScript unsmell, inspect `tsconfig` strictness and recommend or enable stronger options only when the resulting errors can be resolved within the requested work and compatibility constraints.

### 3. Prioritize

Order work by:

1. Correctness hazards and unsafe lifecycle behavior.
2. High-cost duplication and boundary problems.
3. Complexity in frequently changed or central code.
4. Composition and cohesion improvements.
5. Naming, file organization, and local consistency.

Prefer changes that remove a root cause and make later changes simpler. Skip low-value churn.

### 4. Refactor in passes

For each pass:

1. Establish current behavior from tests, contracts, call sites, and types.
2. Make the smallest coherent structural change that resolves the smell.
3. Update imports, exports, references, tests, documentation, and configuration affected by moves or renames.
4. Run the narrowest relevant verification available.
5. Re-read the result for accidental indirection, changed semantics, or a newly introduced smell.

Use these defaults:

- Extract shared code only when it represents one stable concept. Prefer a little duplication over a false abstraction.
- Split files by responsibility and change cadence, not by arbitrary line limits.
- Compose small units around explicit inputs and outputs. Keep orchestration separate from domain logic and side effects at boundaries.
- Flatten control flow with guard clauses or focused helpers when it improves readability.
- Rename for clarity, not brevity alone. A long precise name may be better than a short vague one.
- Move or rename files and folders only when navigation or ownership improves enough to justify import churn.
- Remove dead code only after checking dynamic loading, reflection, framework conventions, scripts, and external/public consumers.
- Keep comments that explain why, invariants, or constraints; remove comments that merely narrate obvious code.
- In TypeScript, do not solve errors with casts, suppressions, looser generics, fake defaults, or widened return types. Preserve or strengthen useful inference and public contracts.

### 5. Complete the requested scope

For full unsmell, repeat discovery and refactoring passes until no high- or medium-confidence actionable smells remain in first-party code. Do not stop after one representative fix.

For targeted unsmell, stop when the specified target is clean and verified. Do not opportunistically refactor neighboring areas.

### 6. Verify

Use the repository's existing formatter, linter, type checker, tests, build, and architecture checks in proportion to the changes. For TypeScript, run the project type checker without emitting files and use type-aware linting when already configured. Start narrow, then run the broadest relevant existing checks after a full-codebase refactor. Do not install missing tools without approval.

When verification cannot run, report exactly what was not verified and why. Do not claim the codebase is fully clean when excluded areas, uncertain dynamic references, or failing pre-existing checks remain.

## Completion Report

Summarize:

- Scope inspected and exclusions.
- Root smells removed and the resulting structural improvements.
- Important renames, moves, extractions, consolidations, and deletions.
- Verification run and results.
- Remaining issues, each with reason: out of scope, low confidence, behavior change required, prerequisite missing, or disproportionate churn.

Keep the report concise. Lead with completed outcomes rather than an inventory of every edit.
