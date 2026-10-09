---
title: Runbooks
description: Step-by-step guides for flows that repeat in this repo. Read the matching runbook before you start the task.
---

# Runbooks

A runbook is a step-by-step guide for a flow that repeats and needs judgment. One flow per page. Before a task, find a matching runbook here and follow it. Do not write a new script or a new guide for a flow that a runbook already covers.

## Pick a runbook

<!-- One row per runbook, sorted by title. The runbook checker fails when a runbook has no row. -->

| Runbook | Use it when |
| --- | --- |
| [<Title>](<slug>.md) | <The situation that calls for this runbook.> |

## Keep runbooks correct

- If a runbook is wrong or old, fix it in the same change.
- After you follow a runbook to the end and it works, set its `last-verified` date to today.
- After you add or change a runbook, run `<RUNBOOKS_CHECK_COMMAND>`. Then run `<AGENT_DOCS_VALIDATE_COMMAND>` for the links.

The runbook checker (`<CHECKER_PATH>`) checks:

- Each runbook has `title`, `description`, `type: runbook`, and a real `last-verified` date that is not in the future.
- The file name is kebab-case.
- This page links every runbook, and every link here opens a real file.
- Each repo path a runbook names exists.
- Each root script a runbook names (`bun run <name>`) exists in the root `package.json`.

## Add a runbook

Write a runbook when a multi-step flow will come back and needs judgment: a migration, an incident, onboarding, a live check, or a known failure. Use a script instead when the flow needs no judgment.

1. Add `<slug>.md` to this folder. The slug is kebab-case and is the page URL.
2. Use the format below. Write repo paths from the repo root.
3. Link other agent pages with relative paths. Write files outside this site as inline code, because links outside `docs/` fail validation.
4. Add a row to the table on this page, sorted by title.
5. Run both checks above.

## Format

```markdown
---
title: <Title>
description: <One line: what this flow does and when to use it.>
type: runbook
last-verified: YYYY-MM-DD
---

# <Title>

## When to use

<Trigger situations. Also say when not to use it.>

## Prerequisites

<Tools, access, env vars (names only), and the state the repo or system must be in.>

## Steps

1. <Command or action. Paths are relative to the repo root.>
2. <Expected result, and the decision to make if the result differs.>

## Verify

<How to confirm success: commands, checks, and expected output.>

## Rollback

<How to undo, or "Not reversible" plus the safeguard to use first.>

## Troubleshooting

- **<Symptom>**: <cause> → <fix>.
```

Omit Rollback or Troubleshooting only when they do not apply. Quote a `description` that contains `: `.
