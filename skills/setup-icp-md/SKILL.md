---
name: setup-icp-md
description: >-
  One-time setup that derives the best ideal customer profile for the current
  project from the codebase, product context, and external market signals, then
  writes a root ICP.md. Use when the user invokes $setup-icp-md, says "setup
  icp", "create ICP.md", "ideal customer profile", or asks to define who the
  product is for.
---

# Setup ICP.md

## Overview

One-shot setup: determine the best ideal customer profile for this project and write a single root `ICP.md`. Combine product evidence, user input, and external market signals. Do not treat this as an ongoing maintenance skill unless the user explicitly asks to regenerate or update the file.

## Output

- Write **exactly one** file: repo-root `ICP.md`.
- If `ICP.md` already exists, ask once whether to overwrite, merge/update, or abort. Do not silently overwrite.

## Workflow

### 1. Ground in the product

Learn what is actually being built and sold:

- Root docs, landing/pricing/about copy, positioning claims.
- Features, plans, onboarding, permissions, and who the product clearly serves.
- Domain language in code and docs (roles, org types, workflows).
- Any existing persona, market, or sales notes in the repo.

Prefer primary repo evidence over generic SaaS persona templates.

### 2. Research market signals

Use configured research or web tools when available; otherwise search and open primary sources:

- Competitors and alternatives: who they target on homepage/pricing/careers-for-customers pages.
- Category language: segments, company sizes, jobs-to-be-done, buying triggers.
- Public reviews, case studies, or directories that reveal real buyers vs end users.

Capture sources with URLs and dates. Separate **evidence** from **inference**.

### 3. Interview the user (only gaps)

Ask only what research cannot settle. Batch questions. Cover when missing:

- Who pays vs who uses.
- Best-fit company size, industry, geography, and maturity.
- Disqualifiers (bad-fit customers).
- Sales motion (self-serve, sales-assisted, PLG) and current traction anecdotes.
- Must-win segment vs nice-to-have adjacent segments.

If the user declines interview, proceed with labeled assumptions and confidence levels.

### 4. Choose and justify the ICP

- Pick **one primary ICP** (sharp > broad).
- Optionally list 1–2 secondary segments with lower priority.
- State explicit **anti-ICP** / disqualifiers.
- Explain why this ICP fits the product’s capabilities and GTM reality.
- Note confidence and what would change the recommendation.

### 5. Write ICP.md

Use [references/template.md](references/template.md). Fill applicable sections; omit empty ones. Quality bar:

- Specific enough to guide messaging, roadmap prioritization, and support triage.
- Distinguishes buyer, champion, and end user when they differ.
- Includes triggers, pains, desired outcomes, and objections.
- Includes anti-ICP so agents do not over-generalize.
- Cites sources; does not invent fake demographics.

### 6. Link from AGENTS.md (conditional)

After `ICP.md` exists:

1. Check for **root** `AGENTS.md` only.
2. If it **does not exist**, skip linking. Do **not** create `AGENTS.md`.
3. If it **exists**, add a clear pointer to `ICP.md` if missing:
   - Prefer an existing Index / Docs / Related docs section.
   - Otherwise add a short section such as `## Project docs` with a bullet:
     `- [ICP.md](ICP.md) — ideal customer profile`
   - Do not duplicate the full ICP into `AGENTS.md`.
   - Preserve unrelated `AGENTS.md` content.

### 7. Deliver

- Confirm path written.
- Brief summary: primary ICP in one sentence, top disqualifiers, confidence, and whether `AGENTS.md` was updated or skipped.
- Do not commit unless the user asks.

## Isolation

This skill stands alone. Do not mention, link to, or depend on other skills. Reference only repo files, external sources, user input, and this skill's `references/`.

## Out of Scope

- Full GTM strategy, pricing model design, or sales playbooks.
- Rewriting marketing pages to match the ICP (unless separately requested).
- Creating `AGENTS.md` when missing.
- Recurring audits unless the user asks to run setup again.
