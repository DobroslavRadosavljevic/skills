---
name: ultraplan
description: Exhaustive planning interrogation for turning vague or complex requests into precise, implementation-ready plans. Use when the user invokes $ultraplan, says "ultraplan", "ultra plan", "deep plan", "plan mode", "ask me everything", "interrogate this", or asks the agent to resolve all requirements, use cases, edge cases, tradeoffs, and open questions before implementation.
---

# Ultraplan

## Overview

Turn an underspecified or high-stakes request into a precise plan by deeply questioning the user, recommending an answer for every question, and converging on explicit decisions before implementation.

## Operating Mode

- Use the harness's plan mode, planning state, or approval workflow when it supports one.
- If no plan mode exists, ask the same questions directly in chat.
- Stay harness-neutral. Do not depend on one product's tool names, UI affordances, or hidden state.
- Do not implement while material requirements are still unresolved unless the user explicitly asks to proceed with stated assumptions.
- Treat recommended answers as proposals for the user to accept, edit, or reject; do not silently treat them as confirmed.

## Questioning Standard

Ask enough questions to remove ambiguity across:

- Goal, user, and success criteria.
- Scope, non-goals, constraints, and required compatibility.
- Inputs, outputs, data shape, state, lifecycle, and ownership boundaries.
- User flows, system flows, failure modes, permissions, safety, privacy, and security.
- Edge cases, scale, performance, accessibility, internationalization, and operational behavior.
- API, UI, storage, migration, testing, rollout, documentation, and observability needs.
- Tradeoffs, rejected alternatives, dependencies, sequencing, and acceptance criteria.

For each question, include:

- The question.
- Why the answer matters when the reason is not obvious.
- A recommended answer.
- Alternatives or tradeoffs when the recommendation is not clearly dominant.

Prefer grouped, themed questions over a flat wall of unrelated prompts. Ask in batches when the list is large, but make the full remaining question map visible so the user understands the depth of the review.

## Workflow

1. Restate the mission in concrete terms.
2. Identify known facts, assumptions, unknowns, and likely risk areas.
3. Build an exhaustive question map grouped by theme.
4. Ask the highest-leverage questions first, each with a recommended answer.
5. Incorporate user answers and mark decisions as confirmed, revised, or still open.
6. Continue questioning until remaining unknowns are either answered, explicitly deferred, or safe to decide by recommendation.
7. Produce a final plan with requirements, decisions, architecture or workflow, steps, validation, edge cases, and open risks.
8. Ask for approval before implementation when the environment or user workflow supports approval.

## Recommended Answer Style

Recommended answers should be specific and usable:

- Prefer "Use X because Y; avoid Z unless W" over vague preferences.
- Include defaults for names, file locations, APIs, data fields, UI states, and validation rules when relevant.
- Flag assumptions that need confirmation.
- Say when the recommended answer is a conservative default, a product judgment, or a technical constraint.
- Keep recommendations editable; the user should be able to answer by saying "yes to your recommendations" or by changing only the parts they disagree with.

## Final Plan

The final plan should include:

- Confirmed goals and non-goals.
- Confirmed decisions and accepted recommendations.
- Implementation phases or ordered steps.
- Data, API, UI, workflow, or architecture details as applicable.
- Edge cases and failure handling.
- Test and verification plan.
- Rollout, migration, documentation, and monitoring notes when relevant.
- Remaining risks, unresolved questions, and assumptions.

If the user asks to proceed without answering everything, state the assumptions being adopted and the risks they create before moving forward.
