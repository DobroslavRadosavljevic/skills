# Cursor model id

This skill applies **only in Cursor IDE**. Do not use these ids in Codex or other harnesses.

| Surface | Value |
| --- | --- |
| Human label | Cursor Grok 4.6 (any reasoning effort) |
| Task / subagent `model` slug | `cursor-grok-4.6-<effort>` |

`<effort>` is any reasoning-effort suffix Cursor exposes for Grok 4.6, including `low`, `medium`, `high`, `xhigh`, and later labels. Examples: `cursor-grok-4.6-low`, `cursor-grok-4.6-medium`, `cursor-grok-4.6-high`, `cursor-grok-4.6-xhigh`.

Pass a `cursor-grok-4.6-*` slug on every Task / subagent launch (and any other Cursor call that accepts `model`) unless the harness already inherits this parent session as Grok 4.6 **and** `inherit` is accepted. Prefer an explicit `cursor-grok-4.6-*` slug when the user named an effort and that slug is in the allowlist.

If **no** `cursor-grok-4.6-*` slug is in the tool allowlist, stop and report. Do not substitute `cursor-grok-4.5-high`, `composer-2.5-fast`, `inherit` when inherit would resolve to a non-4.6 model, or any other family. If the requested effort slug is missing, pick a different allowlisted `cursor-grok-4.6-*` effort.

Codex has no Grok model. If this skill is loaded outside Cursor, ignore it and do not attempt a Grok lock.
