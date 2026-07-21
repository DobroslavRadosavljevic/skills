# Handoff Template

Copy and fill this structure when producing a handoff. Omit sections that do not apply. Keep entries concrete.

```markdown
# Handoff: <short title>

- **Date:** <YYYY-MM-DD>
- **Project:** <repo or path>
- **Branch:** <branch name>
- **Status:** ready | needs-review | blocked (<blocker>)
- **From:** <outgoing agent or session label, optional>
- **To:** next agent

## Goal

<What success looks like for the continuing work. 1-3 sentences.>

## Current State

<Where things left off. What works now. What is partial or broken.>

## Done

- <Completed item with evidence: path, command, or commit when useful>

## Not Done

- <Remaining item>

## Immediate Next Steps

1. <First verifiable action>
2. <Second verifiable action>
3. <Third verifiable action>

## Files To Read First

- `<path>` — <why>
- `<path>` — <why>

## Relevant Changes

| Path | Change | Notes |
| --- | --- | --- |
| `<path>` | <what changed or needs changing> | <commit / uncommitted / planned> |

## Decisions

| Decision | Alternatives considered | Why |
| --- | --- | --- |
| <chose X> | <Y, Z> | <rationale> |

## Assumptions

- <assumption that the next agent should treat as true unless contradicted>

## Gotchas

- <non-obvious trap, quirk, or failure mode>

## What Not To Do

- Do not <action> — <reason>

## Blockers / Open Questions

- <blocker or question> — needs: <decision, access, or info>

## Verification

- <command or check already known to matter>
- <expected signal of success>

## Environment

- Branch / worktree notes:
- Running processes or services:
- Env var names that matter (no values):
- External systems or accounts involved:

## References

- <doc, issue, PR, URL, or prior artifact>
```

## Filling Guidance

1. Write the handoff before context is exhausted.
2. Make **Immediate Next Steps** independently verifiable.
3. Prefer paths with enough precision to act (`src/auth/session.ts`) over vague areas ("auth stuff").
4. Keep **Files To Read First** short; put critical explanation in the handoff itself.
5. Be honest about dirty trees, failed checks, and unfinished edits.
6. Never paste secrets. List secret names only when necessary.
7. If status is `blocked`, put the unblock condition in both Status and Blockers.
