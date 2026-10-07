# Runbooks

Step-by-step guides for flows that repeat in this repo. One flow per file. Agents and people read these before they start a matching task.

Run `bun scripts/check-runbooks.ts` after you add or change a runbook.

## Index

<!-- One line per runbook, sorted by name: - [Title](slug.md) — what it is for -->

## Format

File: `runbooks/<slug>.md`. The slug is kebab-case and matches `name`.

```markdown
---
name: <slug>
description: <one line: what this flow does and when to use it>
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

Omit Rollback or Troubleshooting only when they do not apply.
