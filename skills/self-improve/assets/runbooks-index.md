---
title: Runbooks
description: Step-by-step guides for flows that repeat in this repo. Read the matching runbook before you start the task.
---

# Runbooks

Step-by-step guides for flows that repeat in this repo. One flow per page. Agents and people read these before they start a matching task.

Run `<RUNBOOKS_CHECK>` after you add or change a runbook. Then run the site's link check.

## Pick a runbook

<!-- One row per runbook, sorted by title: | [Title](slug.md) | when to use it | -->

| Runbook | Use it when |
| --- | --- |

## Format

File: `<slug>.md` in this folder. The slug is kebab-case and is the page URL.

```markdown
---
title: <Title>
description: <one line: what this flow does and when to use it>
type: runbook
last-verified: YYYY-MM-DD
---

# <Title>

## When to use

<Trigger situations. Also say when not to use it.>

## Prerequisites

<Tools, access, env vars (names only), and the state the repo or system must be in.>

## Steps

1. <Command or action. Script paths are relative to the repo root.>
2. <Expected result, and the decision to make if the result differs.>

## Verify

<How to confirm success: commands, checks, and expected output.>

## Rollback

<How to undo, or "Not reversible" plus the safeguard to use first.>

## Troubleshooting

- **<Symptom>**: <cause> → <fix>.
```

Link other pages of this site with relative paths. Write repo files as inline code. Omit Rollback or Troubleshooting only when they do not apply.
