---
name: agents-md
description: >-
  Create, review, rewrite, or enforce a high-quality AGENTS.md (the open
  “README for coding agents” format). Use when the user invokes $agents-md,
  says AGENTS.md, agents.md, agent instructions, project agent context,
  nest AGENTS.md, or asks to scaffold, audit, improve, or standardize
  repository guidance for AI coding agents. Always include the ASD-STE100
  Communication block in new or existing root AGENTS.md files.
---

# AGENTS.md

## Overview

Produce or harden a project `AGENTS.md`: concise, actionable, harness-neutral instructions that coding agents load as always-on project context. Optimize for agent success, not human onboarding (that stays in `README.md`).

This skill targets the open [AGENTS.md](https://agents.md/) format (plain Markdown, no required fields). Do not confuse it with GitHub Copilot custom-agent personas under `.github/agents/` (frontmatter + persona files). Lessons about commands, examples, and boundaries still apply; personas do not.

## Modes

Pick one:

- **Create** — no usable `AGENTS.md` (or user asked to scaffold).
- **Review** — audit an existing file against the quality bar; report gaps without rewriting unless asked.
- **Improve** — rewrite or edit so the file meets the quality bar.
- **Nest** — add or fix package/subdir `AGENTS.md` files in a monorepo.

If ambiguous, ask once: create, review, improve, or nest?

## Core Rules

- Prefer one root `AGENTS.md`. Nest only when a subtree has different commands, boundaries, or conventions.
- **Required:** every root `AGENTS.md` must include the Communication (ASD-STE100) block from [references/communication.md](references/communication.md). Paste it as-is. Nested files skip it unless they override writing rules.
- Every other line must earn its keep. Litmus: *Would removing this cause the agent to make a mistake it would not otherwise make?* If no, delete it.
- Target **≤150 lines** for a root file; **30–50** is enough for small repos. Split or index when larger.
- Put **exact executable commands early** (with flags/filters the project actually uses). Agents will re-run these.
- Prefer **pointers and an orientation table** over pasting architecture essays, full style guides, or README clones.
- Document what agents cannot infer: package manager, odd layouts, silent invariants, forbidden paths, security gotchas, and “ask first” changes.
- Use **concrete examples** (short snippets or canonical paths) instead of vague style prose.
- State **boundaries** in three tiers when useful: Always / Ask first / Never.
- Stay **harness-neutral**: no dependence on one product’s tool names, UI, or hidden behavior. Optional capabilities (plan mode, approvals, subagents) may be mentioned generically with a manual fallback.
- Never put secrets, tokens, private keys, or real credentials in `AGENTS.md`.
- Treat the file as living docs: when the user reports a repeated agent mistake, encode the fix here (or in a linked doc).
- Prefer the project’s real package manager and scripts from `package.json` / `Makefile` / `justfile` / CI — do not invent commands.
- Prefer `bun` / `bunx` in *this skill’s* examples only when the target repo already uses Bun; otherwise match the repo.

## Quality Bar (must pass)

A great `AGENTS.md` covers these when they apply (omit empty sections; do not pad). **Communication is not optional** on the root file.

1. **Stack** — languages, frameworks, key libs **with versions** when non-obvious.
2. **Commands** — install, dev, test, lint/typecheck, build; scoped variants for monorepos.
3. **Communication** — the ASD-STE100 block from [references/communication.md](references/communication.md) (required on root files).
4. **Layout** — where source, tests, configs, and generated output live (only if non-standard).
5. **Conventions** — project-specific style/architecture rules agents get wrong; link to lint/format otherwise.
6. **Testing** — how to run focused tests, what “done” means, whether to add tests unprompted.
7. **Git / PR** — commit/PR norms that differ from defaults (title format, required checks).
8. **Boundaries** — always / ask first / never (secrets, vendor dirs, prod config, schema, deps).
9. **Index** — links or a table to deeper docs (architecture, ADRs, security model) instead of inlining them.

Full checklist: [references/quality-bar.md](references/quality-bar.md).

## Workflow

### 1. Inspect the repo

Before writing:

- Read existing `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, CI workflows, and package scripts.
- Note package manager, test runner, lint/format tools, monorepo layout, and unsafe areas.
- Skim for prior agent instruction files (`CLAUDE.md`, `.cursor/rules`, `GEMINI.md`, etc.) to migrate unique content — do not blindly duplicate.

### 2. Draft or edit

- Use [references/template.md](references/template.md) as a starting shape; delete unused sections.
- Always paste the Communication block from [references/communication.md](references/communication.md) into the root file.
- Put high-frequency commands near the top. Put Communication next.
- Encode only project-specific constraints; strip generic advice agents already know. Do not strip Communication.
- For monorepos, follow [references/nesting.md](references/nesting.md).

### 3. Validate

Check against:

- Quality bar above and [references/quality-bar.md](references/quality-bar.md).
- Communication block present and unmodified: [references/communication.md](references/communication.md).
- Anti-patterns in [references/anti-patterns.md](references/anti-patterns.md).
- Good/bad patterns in [references/examples.md](references/examples.md).

Confirm every linked path exists. Confirm commands match scripts/CI. Confirm no secrets.

### 4. Deliver

- **Create / Improve / Nest**: write the file(s) at the agreed path(s), usually repo-root `AGENTS.md`.
- **Review**: return a short report — passes, failures, suggested edits — without rewriting unless asked.
- End with a brief note: line count, sections present, and any intentional omissions.

## Conflict and Precedence Notes

Document these for maintainers when relevant (do not lecture inside every file):

- Closest nested `AGENTS.md` to the edited files wins over parent guidance when agents resolve conflicts that way; user chat always overrides files.
- Some agents concatenate root → cwd (later/more specific wins). Keep nested files additive and explicit about overrides.
- Soft size caps exist in some tools (for example Codex’s project-doc byte limit). Prefer splitting/nesting over one huge root file.
- For Claude Code compatibility when needed, a thin `CLAUDE.md` that includes `@AGENTS.md` (plus any Claude-only extras) avoids duplicating the whole guide.

## Out of Scope

- Replacing path-scoped IDE rule systems (for example `.cursor/rules` with globs) when the user wants fine-grained, file-pattern rules — `AGENTS.md` is the simple, portable default.
- Authoring Copilot custom-agent persona packs under `.github/agents/` unless the user explicitly asks for those.
- Copying the entire human README into `AGENTS.md`.
