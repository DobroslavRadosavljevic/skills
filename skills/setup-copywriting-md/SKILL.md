---
name: setup-copywriting-md
description: >-
  One-time setup that analyzes a project's existing copy, competitor and
  category messaging, and writes a root COPYWRITING.md with voice, patterns,
  good/bad examples, and writing rules. Use when the user invokes
  $setup-copywriting-md, says "setup copywriting", "create COPYWRITING.md",
  or asks to extract copywriting patterns, tone, or messaging guidelines for
  the current project.
---

# Setup COPYWRITING.md

## Overview

One-shot setup: research this project's copy and category messaging, then write a single root `COPYWRITING.md` agents and humans can follow. Do not treat this as an ongoing maintenance skill unless the user explicitly asks to regenerate or update the file.

## Output

- Write **exactly one** file: repo-root `COPYWRITING.md`.
- If `COPYWRITING.md` already exists, ask once whether to overwrite, merge/update, or abort. Do not silently overwrite.

## Workflow

### 1. Gather project context

Read enough to understand product, audience, and existing voice:

- Root docs: `README.md`, landing/marketing pages, about/pricing pages, onboarding copy.
- In-product strings: UI labels, empty states, errors, emails, notifications, CTA patterns.
- Brand or style notes if present (do not invent a brand book that does not exist).
- Package metadata, site config, and public URLs that reveal positioning.

Prefer primary sources in the repo over assumptions.

### 2. Research external patterns

Use configured research or web tools when available; otherwise search and open primary pages:

- Direct competitors and close alternatives (homepages, pricing, feature pages, onboarding).
- Category leaders and strong adjacent products with clear messaging.
- Note recurring structures: headline formulas, proof patterns, CTA verbs, objection handling, tone.

Capture concrete examples (short quotes + URLs). Distinguish **observed** patterns from **recommendations**.

### 3. Interview the user (only gaps)

Ask only for what the repo and research cannot answer. Batch questions. Cover when missing:

- Intended brand voice (words to use / avoid).
- Non-negotiable claims, compliance, or legal constraints.
- Preferred languages/locales and formality level.
- Products or surfaces that must stay out of scope.

If the user declines interview, proceed with labeled assumptions.

### 4. Write COPYWRITING.md

Use [references/template.md](references/template.md). Fill every section that applies; omit empty ones. Quality bar:

- Specific to **this** product, not generic marketing advice.
- Includes do / don't with short real or realistic examples.
- Separates facts (current copy) from guidance (recommended patterns).
- Names competitors/sources used, with dates or URLs when useful.
- Actionable enough that another agent can write on-brand copy without re-researching.

### 5. Link from AGENTS.md (conditional)

After `COPYWRITING.md` exists:

1. Check for **root** `AGENTS.md` only.
2. If it **does not exist**, skip linking. Do **not** create `AGENTS.md`.
3. If it **exists**, add a clear pointer to `COPYWRITING.md` if missing:
   - Prefer an existing Index / Docs / Related docs section.
   - Otherwise add a short section such as `## Project docs` with a bullet:
     `- [COPYWRITING.md](COPYWRITING.md) — voice, tone, and copy patterns`
   - Do not duplicate the full copywriting content into `AGENTS.md`.
   - Preserve unrelated `AGENTS.md` content.

### 6. Deliver

- Confirm path written.
- Brief summary: voice in one sentence, top 3 rules, and whether `AGENTS.md` was updated or skipped.
- Do not commit unless the user asks.

## Isolation

This skill stands alone. Do not mention, link to, or depend on other skills. Reference only repo files, external sources, and this skill's `references/`.

## Out of Scope

- Rewriting all product copy in the codebase.
- Creating a full brand book, design system, or marketing site.
- Creating `AGENTS.md` when missing.
- Recurring audits unless the user asks to run setup again.
