---
name: explain-like-pr
description: Write the pull request description before writing the code (what, why, how, risks, how it was tested), then implement to match it. A description that is hard to write means the plan is unclear. Use when the user invokes $explain-like-pr, says "write the PR first", or before starting a non-trivial change.
---

# Explain Like a PR

Write the PR description first. Code second.

## Steps

1. Draft the description:
   - **What**: the change in one or two sentences.
   - **Why**: the problem it solves.
   - **How**: the approach and the main files.
   - **Risks**: what could break and who is affected.
   - **Testing**: how you will prove it works.
2. If any section is vague or hard to write, the plan is not ready. Resolve it (read code, ask the user) before coding.
3. Show the draft, then implement to match it.
4. When done, update the description to match what you built. Note any changes from the draft.

## Rules

- Keep the description short and plain; a reviewer should read it in under a minute.
- If the code drifts from the description, update one of them so they agree.
