---
name: subagents
description: Orchestrator/subagent coordination workflow for tasks that can be split into clear disjoint work. Use when the user invokes $subagents, says "use subagents", "spawn agents", "parallelize this", "delegate this", "split this across agents", or asks for coordinated multi-agent work. Prefer subagents for harder tasks, broad research, multi-file changes, independent reviews, or separable implementation lanes. Skip subagents when the task is simple, the harness does not support them, or safe disjoint work cannot be identified.
---

# Subagents

## Overview

Coordinate work between one orchestrator and one or more subagents. Use subagents to explore or execute independent lanes while the orchestrator owns decomposition, conflict control, integration, verification, and final judgment.

## Core Rule

Use subagents only when they make the work safer, faster, or more thorough.

Before dispatching, decide whether the task has clear disjoint lanes. If the task is small, tightly coupled, or likely to cause file conflicts, skip subagents and say why. If the harness does not support subagents, continue as a single agent and state that limitation.

## Orchestrator Responsibilities

- Understand the user request and inspect enough context to split work safely.
- Identify independent lanes by file ownership, subsystem, question, artifact, or review concern.
- Avoid assigning overlapping writes to multiple subagents.
- Give each subagent a bounded prompt with scope, allowed files or areas, expected output, and constraints.
- Keep secrets, credentials, hidden reasoning, and unrelated user changes out of subagent prompts.
- Track each subagent's status, findings, outputs, and risks.
- Integrate results centrally instead of letting subagents make conflicting final decisions.
- Run final verification and produce the final answer.

## Good Subagent Lanes

Dispatch subagents for lanes such as:

- Researching separate libraries, APIs, docs, or product options.
- Auditing different concerns, such as correctness, security, UX, performance, docs, or tests.
- Inspecting different code areas that do not require simultaneous edits to the same files.
- Implementing isolated modules, tests, fixtures, docs, or examples with clear boundaries.
- Reproducing independent failures or collecting logs from separate systems.

Prefer one subagent per meaningful lane. Do not create extra agents just to appear parallel.

## Bad Subagent Lanes

Do not dispatch subagents when:

- The task is trivial enough that coordination overhead is larger than the work.
- The work requires one continuous design judgment from a single editor.
- Multiple agents would need to edit the same files or closely coupled code at the same time.
- The repo is in a fragile dirty state and parallel edits would risk overwriting user work.
- The available subagent mechanism cannot return enough detail to verify or integrate safely.
- The user asks for direct implementation without delegation and the task is narrow.

## Dispatch Prompt Checklist

Each subagent prompt should include:

- The user goal.
- The exact lane assigned to the subagent.
- Files, directories, systems, or sources the subagent should inspect.
- Files or areas the subagent may edit, if editing is allowed.
- Files or areas the subagent must not touch.
- Expected deliverable: findings, patch summary, test result, recommendation, or artifact.
- Verification expectations for that lane.
- A request to report blockers and uncertainty explicitly.

When the lane is research or review, ask for evidence and actionable findings rather than broad commentary.

## Integration Workflow

1. Create a short decomposition plan.
2. Decide whether subagents are useful and safe.
3. If useful, dispatch bounded lanes in parallel when the harness supports it.
4. Review each subagent result before trusting it.
5. Resolve contradictions, duplicates, and scope drift.
6. Apply or integrate accepted changes centrally, preserving unrelated user work.
7. Run verification that covers the combined result.
8. Summarize which subagents were used, what each handled, what changed, and what verification passed.

## Conflict Control

- Treat the orchestrator as the only final integrator.
- Prefer subagents that produce findings or focused patches over broad uncontrolled edits.
- If two lanes unexpectedly overlap, stop parallel editing for that overlap and merge manually.
- Re-read files before applying or integrating work when another agent may have touched nearby code.
- Never overwrite user changes or another agent's work blindly.

## Final Response

Report:

- Whether subagents were used.
- If used, the lanes assigned and what each returned.
- If skipped, the reason.
- Final integrated changes or conclusions.
- Verification performed and any remaining risks.
