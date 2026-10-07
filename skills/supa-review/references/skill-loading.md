# Skill Loading For Reviews

Load skills that raise the quality of judgment for **this** review. Do not name or require skills that are not available in the current harness.

## Discovery

Use whatever the harness provides, in order of reliability:

1. Session / system skill inventory (names + descriptions)
2. Local skill directories the harness exposes for this agent
3. Project or user skill manifests mentioned in repo instructions

Build a candidate list from descriptions and domains, not from memory of skill names used in other projects.

## Selection Rules

Include a skill when **any** of these is true for the review scope:

- A dependency, import, or config matches the skill’s domain (framework, library, CSS system, ORM, auth, queue, test runner, bundler, etc.).
- The change edits files that the skill’s description says it governs (routes, forms, email templates, workers, schemas, …).
- The review needs standards the skill encodes (ownership boundaries, naming/layout of a specific stack, validation patterns, …).
- Security, permissions, observability, or i18n skills exist and the change touches those concerns.
- A language or runtime skill exists and the change is substantially in that language/runtime.

When unsure whether a skill applies, **load it**. The cost of an unused loaded skill is lower than a missed domain rule.

## Application

For each loaded skill:

1. Read its entry instructions fully enough to apply its hard rules.
2. Open linked references only as needed for the files under review.
3. Translate skill rules into review checks (findings when violated; silence when satisfied).
4. If two loaded skills conflict, prefer: (a) repo-local instructions, then (b) the more specific domain skill, then (c) call out the conflict as a question.

## Reporting

In the review report’s Preparation section, list the skills that were actually loaded. Do not list skills you only considered. Do not claim coverage from a skill you did not read.
