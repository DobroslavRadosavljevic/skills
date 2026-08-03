---
name: ultra-review
description: Runs an exhaustive, evidence-backed code review of current git changes by default, or of a user-named path, module, feature, or package. Forces loading every relevant available agent skill for the review surface, and requires external docs or research when libraries, APIs, security, or established practice matter. Use when the user says "ultra-review", "ultra review", "deep review", "exhaustive review", "review this diff", "review my changes", or asks for a thorough review of git changes or a pointed codebase area.
---

# Ultra Review

Produce a **super-detailed, evidence-backed code review**. Default scope is **current git changes**. If the user names a path, module, feature, package, or concern, review that target instead.

This skill is **read-only** unless the user explicitly asks to apply fixes.

## Non-Negotiable Setup

Complete these before writing findings. Skipping them is a failed review.

### 1. Establish scope

**Git-diff mode (default)** when the user does not name a target:

1. Inspect status, staged diff, unstaged diff, and (when useful) commits ahead of the tracked base branch.
2. Prefer reviewing the full dirty worktree relevant to the ask; if only staged or only unstaged is intended and unclear, state the assumption and proceed.
3. Ignore unrelated dirty files only when the user scopes them out or they are clearly noise (generated lock churn, local env, etc.) — call out exclusions.

**Targeted mode** when the user points at code:

1. Review that path/module/feature/package thoroughly.
2. Follow imports, callers, tests, configs, and contracts only as needed to judge correctness — do not expand into an unsolicited full-repo review.

State the resolved scope in one short paragraph before deep review.

### 2. Load every relevant available skill

Before judging the code:

1. Inventory **agent skills available in this session / harness** (skill lists, skill folders, or equivalent discovery the harness provides).
2. From that inventory, **read and follow every skill whose description or domain matches** the review surface — languages, frameworks, libraries, UI systems, data/validation, auth, testing, build tooling, styling, email, queues, observability, architecture constraints, and similar.
3. Prefer **over-inclusion**: if a skill plausibly applies to any file or concern in scope, load it.
4. Do **not** invent skills that are not available. Do **not** name or depend on skills that are absent.
5. After loading, apply those skills' standards as part of the review criteria for matching code.

If the harness cannot list or load skills, say so once, then continue with repo guidance and research.

Details: [skill-loading.md](references/skill-loading.md).

### 3. Research when it matters

Do **not** review library, API, protocol, security, or “how this should be done” questions from memory alone when current primary sources are reachable.

Required research triggers (any one is enough):

- Code uses or configures a library, framework, SDK, API, CLI, or cloud service.
- Correctness depends on version-specific behavior, defaults, or migration notes.
- Security, privacy, auth, crypto, payments, or compliance patterns appear.
- The change claims to follow an established practice, RFC, accessibility standard, or vendor guide.
- You are unsure whether an API, option, or pattern is current or recommended.

How:

1. Prefer configured documentation / research tools when available (docs resolvers for libraries; web/research tools for general practice).
2. Prefer official docs, changelogs, RFCs, and primary standards over blogs or memory.
3. Record versions and source links/paths that informed the finding.
4. If research is blocked, mark affected findings as lower confidence and say what could not be verified.

Details: [external-research.md](references/external-research.md).

### 4. Read local ground truth

Also load, as applicable:

- Repo agent instructions and ownership docs
- Nearby tests, types, schemas, configs, and public exports
- Existing patterns in sibling modules (consistency bar)

## Review Depth

Review every applicable dimension in [review-dimensions.md](references/review-dimensions.md). For each dimension that applies to the scope, either:

- raise concrete findings with evidence, or
- explicitly note “checked, no issue” only when silence would hide that the dimension was skipped

Do not pad with speculative nits. Prefer fewer high-signal findings over a quota of comments. Still be exhaustive across dimensions — “exhaustive” means coverage, not inventing problems.

## Finding Standard

Each actionable finding must include:

1. **Severity**: `blocker` | `high` | `medium` | `low` | `nit`
2. **Location**: path and symbol, line, or hunk reference when available
3. **Evidence**: what the code does (quote or paraphrase tightly)
4. **Why it matters**: concrete failure, risk, or maintainability cost
5. **Recommendation**: specific fix direction
6. **Basis**: loaded skill rule, local convention, test/contract, or external source (with link/version when external)

Separate:

- **Defects** (wrong, unsafe, broken contracts)
- **Risks** (likely failure modes, missing guards)
- **Design** (API/ownership/abstraction problems)
- **Questions** (need product or owner judgment)

Do not present questions as defects.

## Workflow

```text
- [ ] Resolve scope (git diff vs target)
- [ ] Inventory and load all relevant available skills
- [ ] Map stack, libraries, and risk areas in scope
- [ ] Run external research for triggered topics
- [ ] Read local instructions, tests, and sibling patterns
- [ ] Deep-read the code under review (not only the diff hunk)
- [ ] Score every applicable review dimension
- [ ] Cross-check findings against skills + sources
- [ ] Produce the review report
```

Use parallel reviewer agents when the harness supports them and the scope is large or multi-concern; keep one orchestrator responsible for the final merged review. If unavailable, do the same passes sequentially in chat.

## Report Format

```markdown
## Scope
[diff | path] — files/areas included; exclusions

## Preparation
- Skills loaded: [names of skills actually loaded from this harness]
- Research: [sources/versions consulted, or none with reason]
- Local context: [key docs/tests/patterns read]

## Verdict
[ship | revise | blocked] — one sentence

## Findings
### Blockers
…

### High
…

### Medium
…

### Low / Nits
…

## Questions / Assumptions
…

## What looked solid
[short; only real strengths worth preserving]

## Residual risk
[what was out of scope, unverified, or research-blocked]
```

Lead with blockers and high severity. Keep “what looked solid” brief so it does not dilute the review.

## Completion Rules

- Never claim a clean review if skill loading or required research was skipped without disclosure.
- Never “fix while reviewing” unless the user asked for fixes.
- Preserve unrelated user work: do not demand drive-by cleanups outside scope.
- If there are no findings, say what was checked and why confidence is high.
