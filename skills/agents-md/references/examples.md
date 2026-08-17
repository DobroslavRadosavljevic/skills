# AGENTS.md Examples

## Good — command-first, specific, bounded

```markdown
# AGENTS.md

## Stack
- TypeScript strict, Bun, Vitest 4, Oxlint

## Commands
- Install: `bun install`
- Dev: `bun run dev`
- Test all: `bun test`
- Test file: `bun test path/to/file.test.ts`
- Lint: `bun run lint`
- Types: `bun run typecheck`

## Communication (ASD-STE100)

Hard rule for all agent text to humans. Also covers names in the codebase. Do not skip for tone, polish, or expertise.

**ASD-STE100 Simplified Technical English** is a controlled writing standard. Aerospace and defense groups made it. It helps people write clear technical text.

**Key rules:**

- **Use approved words only.** Treat simple common English as the word list. Each word has one meaning.
- **Use one word for one idea.** Do not use two words for the same thing.
- **Write short sentences.** Use 20 words or less for instructions. Use 25 words or less for other sentences.
- **Use active voice.** Write "Turn the switch", not "The switch must be turned".
- **Write short paragraphs.** Keep one topic in each paragraph.

**Also:**

- Prefer common verbs: `use`, `start`, `stop`, `show`, `set`, `get`, `fix`, `add`, `remove`.
- Keep exact API names, errors, paths, and code. Define a hard term in one short sentence the first time. Then reuse that term.
- Match the user’s word for a thing. Do not rename it in prose.
- Names must read like English intent. No riddles, meme names, or opaque abbreviation piles.
- Lead with the outcome or the next action. Put raw dumps last.
- Do not send a reply until the prose passes these checks.

**Goal:** The goal is easy reading. Many readers are not native English speakers. Clear text helps them do the work in a safe and correct way.

## Project rules
- Prefer existing UI primitives under `src/components/ui/`; do not add a second button system.
- Server-only modules stay in `src/server/`; never import them from client components.

## Boundaries
- Always: run `bun test` on touched packages before finishing.
- Ask first: new production dependencies, Drizzle schema changes.
- Never: commit `.env`; edit `src/generated/`.

## Docs index
| Topic | Document |
| --- | --- |
| Setup | `README.md` |
| Architecture | `docs/architecture.md` |
```

Why it works: exact commands, versions/tools, STE communication, silent architecture rules, three-tier boundaries, deep docs indexed not pasted.

## Good — monorepo root excerpt

```markdown
# AGENTS.md

## Workspace
- Bun workspaces. Package names live in each `package.json` `name` field.
- Run a package task: `bun run --filter <package-name> <script>`
- Prefer package-local `AGENTS.md` under `apps/*` and `packages/*` when commands differ.

## Shared rules
- No default exports in library packages.
- Public package API only through each package’s `src/index.ts`.
```

## Bad — vague and padded

```markdown
# AGENTS.md

## Introduction
This repository contains our wonderful application. Please be a helpful
coding assistant and write clean, maintainable, elegant code. Follow best
practices and industry standards at all times.

## Structure
- `src` has source code
- `tests` has tests
- `docs` has documentation

## Style
Use good names. Keep functions small. Prefer composition. Remember SOLID.
Also here is our entire 400-line style guide… 
```

Why it fails: no executable commands, no boundaries, narrates the obvious, burns tokens on generics.

## Bad — wrong format for this skill

```markdown
---
name: docs_agent
description: Expert technical writer
---

You are an expert technical writer…
```

That shape is for **Copilot custom agent personas** (often under `.github/agents/`), not the open project `AGENTS.md` README-for-agents format. If the user wants personas, say so and separate them from project `AGENTS.md`.

## Migration snippet (Claude Code)

When the team needs `CLAUDE.md` without duplicating content:

```markdown
@AGENTS.md

<!-- Optional Claude-only notes below -->
```
