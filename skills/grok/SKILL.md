---
name: grok
description: "Cursor IDE only — do not apply in Codex or any harness without Grok. ALWAYS apply by default in Cursor for every turn, Task/subagent launch, best-of-N run, cloud agent, and any model-selectable operation. Enforces Cursor Grok 4.6 exclusively (any reasoning effort: low, medium, high, xhigh, and later 4.6 effort labels) — never Composer, GPT, Claude, Gemini, Auto, Grok 4.5, or other model families. Use in Cursor when spawning subagents, setting Task model, choosing agent models, or when the user says grok, Grok 4.6, or model lock."
---

# Grok

**Cursor IDE only.** Apply this skill only when the current harness is Cursor. Codex and other agents do not expose Grok — if you are not in Cursor, ignore this skill entirely and do not attempt a Grok model lock.

In Cursor, this skill is **always on**. Every agent turn, Task/subagent, best-of-N runner, cloud agent, and other model-selectable operation must run on **Cursor Grok 4.6**. Reasoning effort may be any 4.6 effort the harness exposes.

## Required Model

| Surface | Value |
| --- | --- |
| Human name | Cursor Grok 4.6 (any effort) |
| Task / subagent `model` slug | `cursor-grok-4.6-<effort>` |

`<effort>` is any reasoning-effort label Cursor lists for Grok 4.6 (for example `low`, `medium`, `high`, `xhigh`, or later labels). Details: [harness-ids.md](references/harness-ids.md).

## Core Mandate

1. **Only in Cursor.** Never load or enforce this lock outside Cursor IDE.
2. **Only Grok 4.6.** Never select Composer, GPT, Claude, Gemini, Auto, Grok 4.5, other Grok major versions, or any non-4.6 family for the parent agent, subagents, best-of-N runners, cloud agents, or background tasks.
3. **Any 4.6 reasoning effort is allowed.** Honor the user’s requested effort when the matching `cursor-grok-4.6-*` slug is in the allowlist. If the user does not specify effort, use `inherit` when the parent is already Grok 4.6, otherwise pick any allowlisted `cursor-grok-4.6-*` slug. Do not omit `model` hoping for a default that might land on another family.
4. **User asks for another family → refuse.** Stay on Grok 4.6. Do not substitute Composer, GPT, Claude, Gemini, Auto, or Grok 4.5.
5. **No 4.6 slug in the allowlist → stop.** Tell the user and skip that launch. Do **not** fall back to another family. If a requested *effort* slug is missing, use a different allowlisted `cursor-grok-4.6-*` effort instead.
6. **Propagate to children.** Subagent prompts must state that they and any nested agents they spawn must also use only Cursor Grok 4.6 (any effort).
7. **No silent family switches.** Never pick Composer, Auto, or a non-4.6 Grok to “optimize” cost or latency. Changing effort within 4.6 is allowed.

## Workflow

1. Confirm the harness is Cursor. If not, stop applying this skill.
2. On every model-selectable Cursor operation, set `model` to a `cursor-grok-4.6-*` slug (or `inherit` only when the parent is already Grok 4.6).
3. Restate the 4.6 lock in child-agent prompts so nested launches inherit it. Do not lock children to a single effort.
4. If no Grok 4.6 slug is available, or the user requests a different model family, stop and report — do not substitute another family.

## Checklist (every Task / subagent)

- [ ] Running in Cursor IDE (otherwise skip this skill)
- [ ] `model` is `inherit` (parent is Grok 4.6) or a `cursor-grok-4.6-*` slug
- [ ] No non-4.6 family in parameters or prompt
- [ ] Nested-agent instructions repeat the Grok 4.6 lock (any effort)

## Anti-Patterns

- Applying this skill in Codex or any non-Cursor harness
- Omitting `model` so Cursor picks Composer / Auto
- Using `composer-2.5-fast`, `cursor-grok-4.5-high`, GPT, Claude, or any non-4.6 slug
- Treating a non-xhigh 4.6 effort as forbidden
- Falling back to another family when a Grok 4.6 slug is missing from the allowlist
- Honoring a request for GPT/Claude/Composer on a subagent

## Verification

Before finishing Cursor work that spawned Tasks or other model-selectable runs:

- [ ] Every launch used Grok 4.6 (`inherit` from a 4.6 parent, or `cursor-grok-4.6-*`)
- [ ] No fallback to another model family
- [ ] Child prompts carried the 4.6 lock forward
