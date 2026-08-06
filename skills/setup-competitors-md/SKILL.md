---
name: setup-competitors-md
description: >-
  One-time setup that maps direct competitors, alternatives, and category
  substitutes for the current project from the codebase, user input, and
  external research, then writes a root COMPETITORS.md. Use when the user
  invokes $setup-competitors-md, says "setup competitors", "create
  COMPETITORS.md", "competitive landscape", or asks to document rivals and
  differentiation for the project.
---

# Setup COMPETITORS.md

## Overview

One-shot setup: identify who this product competes with (and what users do instead), then write a single root `COMPETITORS.md` for positioning, roadmap, and messaging decisions. Do not treat this as an ongoing maintenance skill unless the user explicitly asks to regenerate or update the file.

## Output

- Write **exactly one** file: repo-root `COMPETITORS.md`.
- If `COMPETITORS.md` already exists, ask once whether to overwrite, merge/update, or abort. Do not silently overwrite.

## Workflow

### 1. Ground in this product

Establish the category and differentiation claim from the repo:

- Root docs, landing/pricing/about copy, feature lists, comparison pages if any.
- Product surfaces and capabilities that imply a market (auth, billing plans, integrations).
- Existing competitor mentions in docs, issues, or marketing copy.
- What job the product claims to replace (spreadsheet, incumbent SaaS, manual process, OSS, etc.).

Prefer primary repo evidence over generic “everyone vs Notion” lists.

### 2. Research the landscape

Use configured research or web tools when available; otherwise search and open primary pages:

- Direct competitors (same job, same buyer).
- Adjacent alternatives (partial overlap).
- Indirect substitutes (status quo: spreadsheets, agencies, DIY, do-nothing).
- Pricing pages, feature matrices, positioning headlines, target customer language.
- Public reviews or changelogs only when they clarify real strengths/weaknesses.

For each notable player, capture URL, date checked, positioning one-liner, ICP hints, pricing shape, and standout strengths/weaknesses. Separate **observed facts** from **inferences**.

Aim for a useful set (often 4–8 named competitors plus substitutes), not an exhaustive industry census.

### 3. Interview the user (only gaps)

Ask only what research cannot settle. Batch questions. Cover when missing:

- Who they consider the real rivals (and who is a false peer).
- Wins/losses anecdotes and why deals closed or churned.
- Features they refuse to copy vs must match for parity.
- Category they want to own vs categories they reject.
- Geographic or segment limits on the competitive set.

If the user declines interview, proceed with labeled assumptions and confidence.

### 4. Synthesize differentiation

- Classify each entry: direct / adjacent / substitute.
- Call out **primary rivals** (usually 2–4) vs watchlist.
- State **our wedge**: why a customer picks this product instead.
- Note parity gaps, table-stakes features, and deliberate non-goals vs competitors.
- Flag stale-risk: pricing and feature claims change; date the research.

### 5. Write COMPETITORS.md

Use [references/template.md](references/template.md). Fill applicable sections; omit empty ones. Quality bar:

- Specific to **this** product’s competitive set, not a generic market essay.
- Actionable for messaging (“say X, don’t claim Y”) and roadmap (“parity vs differentiate”).
- Includes substitutes and anti-peers so agents do not over-compare.
- Cites sources with URLs and check dates; does not invent fake pricing.
- Short profiles beat long dumps; link out for depth.

### 6. Link from AGENTS.md (conditional)

After `COMPETITORS.md` exists:

1. Check for **root** `AGENTS.md` only.
2. If it **does not exist**, skip linking. Do **not** create `AGENTS.md`.
3. If it **exists**, add a clear pointer to `COMPETITORS.md` if missing:
   - Prefer an existing Index / Docs / Related docs section.
   - Otherwise add a short section such as `## Project docs` with a bullet:
     `- [COMPETITORS.md](COMPETITORS.md) — competitive landscape and differentiation`
   - Do not duplicate the full competitive analysis into `AGENTS.md`.
   - Preserve unrelated `AGENTS.md` content.

### 7. Deliver

- Confirm path written.
- Brief summary: primary rivals, our wedge in one sentence, and whether `AGENTS.md` was updated or skipped.
- Do not commit unless the user asks.

## Isolation

This skill stands alone. Do not mention, link to, or depend on other skills. Reference only repo files, external sources, user input, and this skill's `references/`.

## Out of Scope

- Full market research reports, TAM/SAM/SOM modeling, or sales battlecards libraries.
- Rewriting marketing or pricing pages (unless separately requested).
- Creating `AGENTS.md` when missing.
- Recurring competitive audits unless the user asks to run setup again.
