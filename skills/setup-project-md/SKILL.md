---
name: setup-project-md
description: >-
  One-time setup that maps the codebase and gathers user-provided product
  context to write a root PROJECT.md overview of what the project is, who it
  serves, how it is structured, and how it runs. Use when the user invokes
  $setup-project-md, says "setup project md", "create PROJECT.md", or asks for
  a complete project overview document at the repo root.
---

# Setup PROJECT.md

## Overview

One-shot setup: combine codebase evidence with user-supplied product context into a single root `PROJECT.md` that answers what this project is and how it fits together. Do not treat this as an ongoing maintenance skill unless the user explicitly asks to regenerate or update the file.

## Output

- Write **exactly one** file: repo-root `PROJECT.md`.
- If `PROJECT.md` already exists, ask once whether to overwrite, merge/update, or abort. Do not silently overwrite.

## Workflow

### 1. Map the codebase

Inspect enough to describe the system accurately:

- Root docs: `README.md`, architecture notes, deploy docs, env examples (names only — never copy secret values).
- Manifests and tooling: package managers, workspaces, apps/packages layout, CI, Docker, infra entrypoints.
- Runtime shape: entrypoints, routes, major domains/modules, data stores, queues, external services.
- Product surfaces: web app, API, CLI, workers, admin, docs site — only what exists.

Prefer evidence from the repo over marketing claims. Mark inferences clearly.

### 2. Collect user context

Ask for product facts the code cannot fully answer. Batch questions. Cover:

- Mission / problem solved and non-goals.
- Target users and primary use cases.
- Business model or distribution (if relevant).
- Current stage (prototype, beta, production) and known constraints.
- Important history, ownership, or decisions agents routinely miss.
- Links to live product, design, or issue tracker (optional).

If the user provides a brief up front, use it and only ask for missing critical gaps. If they decline interview, proceed with labeled assumptions.

### 3. Reconcile code vs narrative

- Prefer code and configs for structure, stack, and commands.
- Prefer user input for intent, audience, roadmap, and business context.
- Call out contradictions and resolve with the user when they affect the overview.

### 4. Write PROJECT.md

Use [references/template.md](references/template.md). Fill applicable sections; omit empty ones. Quality bar:

- A new agent can understand purpose, surfaces, layout, and how to run after reading once.
- Distinguishes **product intent** from **implementation map**.
- Concrete paths and commands, not vague architecture essays.
- No secrets; env vars by name only.
- Honest about unknowns and WIP areas.

### 5. Link from AGENTS.md (conditional)

After `PROJECT.md` exists:

1. Check for **root** `AGENTS.md` only.
2. If it **does not exist**, skip linking. Do **not** create `AGENTS.md`.
3. If it **exists**, add a clear pointer to `PROJECT.md` if missing:
   - Prefer an existing Index / Docs / Related docs section.
   - Otherwise add a short section such as `## Project docs` with a bullet:
     `- [PROJECT.md](PROJECT.md) — product and codebase overview`
   - Do not duplicate the full overview into `AGENTS.md`.
   - Preserve unrelated `AGENTS.md` content.

### 6. Deliver

- Confirm path written.
- Brief summary: one-line purpose, main surfaces, and whether `AGENTS.md` was updated or skipped.
- Do not commit unless the user asks.

## Isolation

This skill stands alone. Do not mention, link to, or depend on other skills. Reference only repo files, user input, and this skill's `references/`.

## Out of Scope

- Replacing `README.md` or full architecture ADRs.
- Implementing features or refactoring while mapping.
- Creating `AGENTS.md` when missing.
- Recurring audits unless the user asks to run setup again.
