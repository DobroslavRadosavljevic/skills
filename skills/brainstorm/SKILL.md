---
name: brainstorm
description: Read-only brainstorming mode for exploring ideas, plans, architecture, debugging approaches, product decisions, research topics, codebase questions, and alternatives without mutating the user's codebase. Use when the user invokes $brainstorm, says "brainstorm", "brainstorming session", "let's think", "explore this", "research only", "read-only", or otherwise asks to discuss before implementation. Remain read-only until the user explicitly asks to implement, edit, write, apply, commit, install, or otherwise change state.
---

# Brainstorm

## Overview

Turn the conversation into a read-only brainstorming session. Explore the user's topic deeply, gather context when useful, compare options, ask sharp questions, and produce clear recommendations without changing the codebase or persistent project state.

## Read-Only Contract

Do not mutate the user's codebase or project state during brainstorm mode.

Forbidden unless the user explicitly exits brainstorm mode:

- Creating, editing, deleting, moving, formatting, or generating files in the workspace.
- Applying patches or automated refactors.
- Installing, upgrading, or removing dependencies.
- Running commands that intentionally write to the repo, database, services, caches, generated outputs, lockfiles, or configuration.
- Committing, staging, branching, rebasing, pushing, opening PRs, or changing issue/task trackers.
- Starting implementation after the user asks only for exploration, research, or discussion.

Allowed:

- Reading files, directories, git history, logs, configs, docs, tests, and code.
- Searching the codebase.
- Running commands that only inspect state.
- Researching external sources when current or source-backed information matters.
- Asking questions and proposing options, plans, diagrams, tradeoffs, risks, and next steps in chat.
- Cloning or downloading material into a temporary directory outside the workspace for inspection, provided the temporary work does not alter the user's repo.

If a useful investigation would require mutation, explain why and ask before doing it.

## Session Workflow

1. Confirm the topic and the kind of brainstorming the user wants when it is ambiguous.
2. State the read-only boundary early when the user may expect implementation.
3. Gather relevant context from chat, repo inspection, docs, or web research.
4. Map the problem space: goals, constraints, assumptions, unknowns, risks, options, and stakeholders.
5. Explore multiple directions before converging when the topic benefits from alternatives.
6. Challenge weak assumptions and call out tradeoffs plainly.
7. Recommend a path when enough evidence exists, or list the information still needed.
8. End with useful next actions, but do not perform implementation actions unless the user explicitly switches modes.

## Question Style

Ask questions that improve the outcome rather than slowing the session down:

- Ask for missing goals, constraints, deadlines, target users, risk tolerance, and non-goals.
- Offer likely default answers or assumptions when that helps the user respond quickly.
- Prefer a few high-leverage questions at a time over a long interrogation unless the user asks for exhaustive planning.
- If the user wants freeform ideation, generate options first and ask follow-ups after patterns emerge.

## Output Shapes

Choose the output that fits the topic:

- Option map with pros, cons, risks, and recommendation.
- Architecture or implementation plan, still read-only.
- Investigation notes grounded in codebase or external research.
- Product brief, decision record, checklist, or phased roadmap.
- Open questions and assumptions ledger.

Keep facts, interpretations, and recommendations distinct when the topic is uncertain.

## Exiting Brainstorm Mode

Remain read-only until the user explicitly asks to change state.

Clear exit signals include:

- "Implement this."
- "Make the changes."
- "Edit the files."
- "Apply the plan."
- "Write this into the repo."
- "Install it."
- "Commit it."

When the user exits brainstorm mode, briefly restate the implementation scope and any assumptions before making changes.
