---
name: research
description: Evidence-first research workflow for external web/source research and internal codebase investigation. Use when the user invokes $research, asks to research, investigate, audit what exists, compare options, understand current implementation, gather evidence, inspect docs, look up current facts, or answer repo-grounded questions before implementation. Prefer optional subagents for broad, separable research lanes such as external sources, codebase evidence, docs, risks, and competitor or alternative analysis.
---

# Research

## Overview

Run source-backed research before recommending or implementing. Combine external evidence, internal repository evidence, and explicit uncertainty so the user can trust what is known, inferred, outdated, or still unknown.

## Core Contract

Treat research as read-only unless the user explicitly asks for implementation or persistent changes.

Allowed:

- Read files, docs, configs, logs, tests, git history, package metadata, and generated artifacts.
- Search the codebase and external sources.
- Run inspection commands that do not intentionally mutate the project.
- Use temporary scratch space outside the workspace when necessary for safe inspection.
- Propose plans, decisions, tradeoffs, and next steps.

Avoid unless explicitly approved:

- Editing, creating, deleting, formatting, or generating files in the workspace.
- Installing packages, CLIs, plugins, binaries, browser extensions, or services.
- Starting writes to databases, queues, deployed services, issue trackers, or dashboards.
- Staging, committing, branching, rebasing, pushing, opening PRs, or other stateful git actions.

If a useful research path requires mutation, explain the reason and ask before continuing.

## Source Selection

Prefer primary, current, and local sources:

- For codebase research, start with local instructions such as `AGENTS.md`, ownership docs, package docs, source files, tests, schemas, logs, and read-only git history.
- For external research, use any suitable configured research MCP when available, alongside direct official sources, reputable primary sources, standards, vendor docs, papers, changelogs, and release notes.
- For library, framework, SDK, API, CLI, and cloud-service docs, prefer any suitable configured documentation MCP when available. Resolve the library or project first unless the user provides an exact identifier.
- Use general web search only when better source-specific tools are unavailable or insufficient.
- For fast-changing facts, verify current information and include dates or versions.

Do not treat summaries, snippets, generated answers, forum posts, or memory as authoritative when primary sources are available.

## Internal Research Workflow

1. Read the applicable repo instructions before drawing conclusions.
2. Map the relevant area with fast searches such as filename search, symbol search, route search, config search, and docs search.
3. Inspect the smallest set of source files needed to answer the question.
4. Follow references across tests, schemas, migrations, package exports, runtime entrypoints, and call sites when they affect the answer.
5. Check read-only git history when timing, ownership, or prior behavior matters.
6. Prefer runtime or log evidence when the question is about actual behavior and safe read-only evidence exists.
7. Separate implemented behavior from planned, dead, partial, test-only, or unreachable behavior.

Use `rg` or equivalent fast search first when the harness provides shell access.

## External Research Workflow

1. Clarify the research question, decision, freshness requirement, and acceptable source types when ambiguous.
2. Search broadly enough to find primary sources and competing views.
3. Open and read the relevant source passages instead of relying on search snippets.
4. Capture publication dates, version numbers, author or vendor, and scope limits when they matter.
5. Cross-check important claims across independent sources when the answer affects money, security, legal risk, production architecture, or user trust.
6. Prefer direct quotes only when exact wording matters; otherwise paraphrase and cite.
7. Note conflicts between sources and explain which source is stronger.

## Optional Subagents

Use subagents when they make the research more complete or faster and the harness supports them. Keep the orchestrator responsible for final judgment.

Good research lanes:

- External sources and current facts.
- Internal codebase evidence.
- Official docs or version-specific library behavior.
- Security, privacy, compliance, or operational risks.
- Alternatives, competitors, prior art, or tradeoffs.
- Verification of a narrow claim from another lane.

Dispatch guidance:

- Give each subagent a bounded, read-only lane with exact files, systems, or source types to inspect.
- Ask for evidence, citations, uncertainty, and concise recommendations.
- Avoid giving subagents the intended answer unless validation requires it.
- Prevent overlapping writes by keeping research lanes read-only.
- Integrate centrally, re-check surprising claims, and resolve contradictions before answering.

If subagents are unavailable or the task is narrow, proceed as a single agent and say so only when it affects the result.

## Evidence Ledger

Maintain a lightweight ledger while researching:

- Question: the exact thing being answered.
- Sources: files, commands, docs, URLs, dates, versions, or logs inspected.
- Findings: source-backed facts.
- Inferences: conclusions drawn from facts.
- Unknowns: gaps, stale areas, blocked sources, or ambiguous behavior.
- Confidence: high, medium, or low, with a short reason.

Do not overstate completion. If only part of the question is answered, say exactly what is covered and what remains.

## Answer Shape

Choose the smallest useful format:

- Direct answer with citations or file references.
- Findings ordered by severity, confidence, or decision impact.
- Current-state map of code paths and behavior.
- Option comparison with recommendation and risks.
- Research brief with facts, interpretation, and next actions.

In final answers:

- Lead with the answer or recommendation.
- Cite local files with paths and external sources with links when available.
- Distinguish facts from interpretation.
- Include concrete dates, versions, commands, or file references when they affect correctness.
- State skipped verification, missing access, or stale-risk plainly.
- Recommend implementation only after the evidence supports it.
