---
name: prove-it
description: Evidence gate before claiming work is done. Requires concrete proof (command and output, test that fails without the change, screenshot, or log) for every "done", "fixed", or "works" claim. Use when the user invokes $prove-it, says "prove it", "show me it works", or when finishing any fix or feature.
---

# Prove It

Never say "done", "fixed", or "works" without evidence.

## Steps

1. List each claim you are about to make (for example "the bug is fixed", "the tests pass").
2. For each claim, get proof by running it now, not from memory:
   - A command and its real output.
   - A test that fails without the change and passes with it.
   - A screenshot or log of the real flow, as a user would run it.
3. Report each claim next to its proof.
4. If you cannot prove a claim, say so plainly: "not verified", and why.

## Rules

- Typecheck or "it compiles" is not proof that a feature works.
- Do not paraphrase output; quote the relevant lines.
- A claim without proof is downgraded to "not verified".
