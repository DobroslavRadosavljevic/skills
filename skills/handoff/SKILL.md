---
name: handoff
description: Produce or consume agent-to-agent handoff context so another session can resume work without re-deriving decisions, state, and next steps. Use when the user invokes $handoff, says "handoff", "hand off", "session handoff", "write a handoff", "resume from handoff", "context for the next agent", or asks to package current work for another AI agent or later session.
---

# Handoff

## Overview

Create or consume a durable handoff so a different agent (or a later session) can continue the same work with goals, decisions, repo state, risks, and next steps intact.

## Modes

Determine which mode applies:

- **Produce**: package the current conversation and workspace state into a handoff.
- **Consume**: treat an existing handoff as the source of truth and resume from it.

If ambiguous, ask once whether to write a handoff or resume from one.

## Core Rules

- Optimize for the next agent, not for the outgoing agent's diary.
- Prefer concrete paths, commands, decisions, and ordered next steps over narrative recap.
- Separate facts, assumptions, and open questions.
- Never include secrets, tokens, passwords, private keys, or full secret values. Name env vars only.
- Do not invent completed work. Verify claims against the workspace when possible.
- Stay harness-neutral. Prefer chat output by default; write a file only when the user asks or names a path.
- If optional todo lists, plan mode, or approval workflows exist, use them only as helpers; the handoff document remains the portable artifact.

## Produce Workflow

1. Confirm the mission the next agent should continue.
2. Inspect enough live state to ground the handoff:
   - Current branch, dirty files, recent commits, and relevant open processes when available.
   - Key files touched or about to be touched.
   - Decisions already confirmed by the user.
3. Fill the template in [references/template.md](references/template.md). Omit empty sections rather than padding them.
4. Prioritize these sections if anything must be shortened:
   - Goal and status
   - Immediate next steps
   - Must-know context
   - What not to do
5. Output the handoff in chat unless the user requested a file path.
6. End with a one-line resume instruction the user can paste into the next session, such as: `Resume from this handoff and continue with step 1.`

### Produce Quality Bar

A good handoff lets another agent start useful work after reading it once.

Include:

- Status: `ready`, `needs-review`, or `blocked` with the blocker named.
- What is done vs unfinished.
- Uncommitted or partial work stated honestly.
- Ordered, verifiable next steps.
- A short "files to read first" list (usually 3-7 paths), each with why.
- Assumptions, gotchas, and rejected alternatives that would otherwise be rediscovered.
- Exact commands or checks already known to matter.

Avoid:

- Dumping the full chat transcript.
- Vague steps like "continue implementing" or "finish the feature".
- Listing every related file in the repo.
- Hiding uncertainty; mark unknowns explicitly.

## Consume Workflow

1. Read the full handoff before making changes.
2. Restate the goal, status, and first next step to the user in one short confirmation when useful.
3. Verify the handoff against live state before trusting it:
   - Branch, dirty tree, and claimed file changes.
   - Whether cited commits, paths, and commands still exist.
   - Whether blockers are still real.
4. If the workspace disagrees with the handoff, stop and report the mismatch before proceeding.
5. Follow "What not to do" and the ordered next steps unless the user overrides them.
6. Read the listed files first, then expand only as needed.
7. When the handoff work is finished or the session must stop again, produce an updated handoff rather than relying on chat memory.

## Output Defaults

- Default destination: chat, as a single markdown document.
- If the user names a path, write there. Common choices: `HANDOFF.md`, `docs/handoff.md`, or a dated path they specify.
- Do not create a handoff file unprompted inside an unrelated project.
- Keep product-specific UI metadata out of the handoff body.

## Minimal Resume Prompt

When producing a handoff, also offer this short starter for the next agent:

```text
Use $handoff in consume mode.
Handoff is below / at <path>.
Verify it against the repo, then continue from Immediate Next Steps without re-litigating settled decisions unless they conflict with the workspace or user direction.
```
