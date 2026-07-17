---
name: unslop-code
description: Bans AI-slop code fingerprints and reworks implementation to match problem scale. Removes narrating comments, section banners, premature factories/Managers/Utils, try/catch wallpaper, silent fallbacks, any/as-unknown-as escapes, speculative “future” APIs, hallucinated imports, and unrequested platform features. Use when the user says "unslop-code", "AI code slop", "overengineered AI code", or asks to strip Copilot/Cursor/ChatGPT-looking code patterns.
---

# Unslop Code

AI code often compiles and looks “professional” while quietly violating YAGNI, fail-fast, and local conventions. This skill **bans those fingerprints** and reworks code until it matches the problem’s real scale — not a tutorial, not an enterprise scaffold. Scope is model defaults (narrating comments, AbstractFactory-for-todo, silent `return []`, `as unknown as`), not every classical maintainability smell.

## Core Mandate

1. **Ban fingerprints first.** Do not polish over-abstracted or over-commented code in place — delete the default, then keep only what the requirement needs.
2. **Match problem scale.** One call path → one function. Abstract at ≥3 real variants that exist *now*.
3. **Fail loud.** No silent catch fallbacks (`[]`, `{}`, `null`, fake defaults) unless the product explicitly requires soft degradation.
4. **Types over escapes.** Ban new `any` / `as unknown as` / unexplained `@ts-ignore`. Fix the model or narrow `unknown`.
5. **Prefer delete.** Unused params, speculative helpers, unrequested features, and narrating comments go.
6. **Pivot rule.** If a module hits **3+** banned patterns, redesign that unit — do not rename Managers into Managers2.

## Hard Bans (never ship)

| Cluster | Banned |
| --- | --- |
| Comments | Restating the next line; `// ===== Section =====` banners; emoji in comments; JSDoc that only rephrases signatures; README-length docs on private helpers |
| Structure | Single-impl interfaces/abstract classes “for flexibility”; Factory/Builder/Strategy with &lt;3 real variants; `XService`→`XManager`→`XHelper`→`XUtils` stacks; options bags for ≤2 knobs; unrequested rate limiters/webhooks/analytics/pluggable backends |
| Errors | try/catch around non-throwing ops; catch that only logs and continues; silent `return []`/`{}`/`null` in catch; null guards on non-optional typed values; duplicate handling when a boundary already handles errors |
| Types | `: any` / `as any`; `as unknown as T`; `@ts-ignore` / `@ts-expect-error` without why; `!` instead of narrowing |
| Naming | Primary names that are only `data`/`result`/`handler`/`manager`/`util(s)`/`helper`/`processor`/`service` with no domain noun |
| Dead / speculative | Unused params “for later”; feature flags with no caller; leftover `console.log` as “logging”; hallucinated packages/APIs not in the project |
| Style | Multi-turn convention drift in one file (quotes, imports, naming) without aligning to the file |

Full catalog: [references/banned-patterns.md](references/banned-patterns.md).

## Workflow

### 1. Scope

- **Full unslop:** first-party application code (exclude generated, vendored, build output, lockfiles unless they are the target).
- **Targeted unslop:** named files, modules, PRs, or pattern clusters only.

State the scope. Preserve public behavior unless the user authorizes changes.

### 2. Audit

Grep/read for narrating comments, Manager/Utils stacks, bare catch blocks, `any`/`as unknown as`, unused exports, and invented imports. Record file, pattern id, severity.

Critical: hallucinated APIs, swallowed errors that hide failures, type escapes that lie about contracts.

Use [references/review-checklist.md](references/review-checklist.md).

### 3. Lock a scale contract

Before rewriting structure:

- What the requirement actually asks for (one sentence)
- Existing project patterns to reuse (helpers, error boundaries, logging)
- Abstraction budget (default: none until ≥3 variants)
- Error strategy (propagate vs map at boundary)
- What is explicitly out of scope (features not requested)

If the contract sounds like a platform kit for a script, shrink it.

Antidotes: [references/craft-antidotes.md](references/craft-antidotes.md).

### 4. Rework

For each banned hit:

1. Delete narrating comments, banners, speculative APIs, and unrequested features.
2. Collapse wrapper stacks into domain-named functions or the existing project pattern.
3. Propagate or map errors at the real boundary; remove silent fallbacks.
4. Replace type escapes with proper types, `unknown` + narrowing, or schema validation already used in the repo.
5. Align style to the file you edited.
6. Do not drive-by refactor unrelated code.

### 5. Verify

Re-run the checklist. Prefer the project’s existing typecheck/lint/tests for touched scope. Do not install tools without approval.

## Completion Report

- Scope audited
- Fingerprints removed (by cluster)
- Scale contract (what stayed simple on purpose)
- Behavior risks / unverified areas
- Checklist status

## Reference Routing

- [references/banned-patterns.md](references/banned-patterns.md) — enforceable ban catalog
- [references/craft-antidotes.md](references/craft-antidotes.md) — scale-matching replacements
- [references/review-checklist.md](references/review-checklist.md) — audit checklist
- [references/sources.md](references/sources.md) — research basis
