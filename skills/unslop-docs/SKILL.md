---
name: unslop-docs
description: Bans AI-slop documentation and rewrites README/docs into plain, verifiable guidance for humans. Removes emoji headers, badge walls, labeled-bullet Features, marketing fluff, install/API claims that don't match the repo, changelog empty phrases, unfit CONTRIBUTING boilerplate, and prompt/chat leakage. Use when the user says "unslop-docs", "AI README", "docs slop", or asks to fix documentation that looks generated, vague, or inaccurate.
---

# Unslop Docs

AI docs fail as **generator chrome** (emoji headers, badge walls, skeleton sections) and as **unverifiable fiction** (install commands, APIs, and features that don’t match the repo). This skill **bans both** and rewrites until docs teach a human what the project is, how to run it, and what will go wrong — with claims checked against the tree.

## Core Mandate

1. **Verifiability over polish.** Every install command, flag, endpoint, and public symbol must exist in the repo (or generated API truth). Wrong docs are bugs.
2. **Identity first.** Line 1 answers “what is this?” before benefits.
3. **Ban generator fingerprints.** No emoji headings, badge walls, labeled-bullet Feature pages, or stock skeletons filled with fluff.
4. **Prefer delete.** Marketing adjectives, restated signatures, and boilerplate that doesn’t fit this repo go.
5. **Rewrite from notes, don’t synonym-humanize.** Treat AI drafts as scrap; write plain docs from verified facts.
6. **Pivot rule.** If a doc hits **3+** banned patterns, rewrite the page — do not emoji-strip and keep the same empty outline.

## Hard Bans (never ship)

| Cluster | Banned |
| --- | --- |
| Chrome | Emoji in headings; badge walls (&gt;~5 or non-resolving/placeholder shields); centered logo+emoji TOC as the first screen; `---` before every heading |
| Structure | Skeleton-only Overview→Features→Install→Usage→Contributing→License with generic filler; labeled bullets (`**Zero-config.** …`) as the default Features shape; rule-of-three stacks as substance; rhetorical H2s (“Pick your path”, “What you get”) |
| Claims | `seamlessly` / `empower` / `robust` / `cutting-edge` / `enterprise-grade` / `modern best practices`; Features that are only stack names; soft install (“ensure Node is installed”) without pins |
| Fiction | Install/usage that doesn’t match manifests/CI; invented CLI flags/APIs/endpoints; Mermaid/architecture that doesn’t match modules; changelogs of “various improvements” / “enhanced UX” |
| Leakage | `Certainly!`, `I hope this helps`, `turn0search`, `oaicite`, `utm_source=chatgpt`, `[Your Name]`, `INSERT_…`; HTML comments / invisible prompts with agent instructions |
| Boilerplate | Stock CONTRIBUTING/CoC with wrong project name, contacts, or process |

Full catalog: [references/banned-patterns.md](references/banned-patterns.md).

## Workflow

### 1. Scope

- **Full unslop:** README, `docs/`, API docs, CHANGELOG, CONTRIBUTING/CoC that ship with the project.
- **Targeted unslop:** named files or doc sections only.

Do not invent product claims. If truth is unknown, say so or omit.

### 2. Audit

Grep for emoji headings, leak tokens, marketing fluff, and shields. Dry-run install commands against package manifests and CI. Check every documented API/CLI symbol against source or generated truth.

Critical: hallucinated commands/APIs, prompt leakage, non-resolving badges that imply false status.

Use [references/review-checklist.md](references/review-checklist.md).

### 3. Lock a docs contract

Before rewriting:

- One-sentence identity (“X is a …”)
- Primary audience and the one happy-path setup
- Source of truth for APIs (OpenAPI, `--help`, typed exports, examples in CI)
- What not to document (internal, unstable, wrong for this repo)
- Plain markdown rules (no emoji headings unless house style requires)

Antidotes: [references/craft-antidotes.md](references/craft-antidotes.md).

### 4. Rework

1. Strip chrome and fluff; open with identity.
2. Features = user-visible capabilities with one concrete example each — not dependency lists.
3. Install: one verified path with pinned versions; copy commands from CI or a smoke script when possible.
4. Teach: concept → minimal example → failure modes → link to reference. Cut signature restatements.
5. Changelog: user-visible deltas; breaking changes first; no empty benefit-washing.
6. CONTRIBUTING/CoC: only keep what matches real process and contacts; delete the rest.
7. Remove leak tokens and agent-instruction HTML comments from published docs.

### 5. Verify

Re-run the checklist. Prefer running documented commands when the environment allows. Fail the skill completion if install/API claims were not checked.

## Completion Report

- Scope audited
- Unverifiable claims fixed or removed
- Fingerprints removed (by cluster)
- Docs contract (identity + happy path)
- What was not verified and why
- Checklist status

## Reference Routing

- [references/banned-patterns.md](references/banned-patterns.md) — enforceable ban catalog
- [references/craft-antidotes.md](references/craft-antidotes.md) — plain verifiable docs
- [references/review-checklist.md](references/review-checklist.md) — audit checklist
- [references/sources.md](references/sources.md) — research basis
