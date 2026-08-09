# Cursor model id

This skill applies **only in Cursor IDE**. Do not use these ids in Codex or other harnesses.

| Surface | Value |
| --- | --- |
| Human label | Cursor Grok 4.5 (slow mode) |
| Task / subagent `model` slug | `cursor-grok-4.5-high` |

Pass `model: "cursor-grok-4.5-high"` on every Task / subagent launch (and any other Cursor call that accepts `model`) unless the harness already inherits this parent session as Grok 4.5 slow mode **and** does not allow overriding — still prefer the explicit slug when the API accepts one.

If `cursor-grok-4.5-high` is not in the tool allowlist, stop and report. Do not substitute `composer-2.5-fast`, `inherit` when inherit would resolve to a non-Grok model, or any other slug.

Codex has no Grok model. If this skill is loaded outside Cursor, ignore it and do not attempt a Grok lock.
