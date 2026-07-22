# AGENTS.md

## Scope

This repo stores harness-neutral agent skills under `skills/<skill-name>/`.

Only create or modify a skill when the user explicitly asks for that skill or approves the change.

Current skills (29):

`base-ui`, `brainstorm`, `bullmq`, `compound-ui`, `effect`, `elysia`, `handoff`, `legend-state`, `loop`, `motion`, `playwright`, `react`, `research`, `simplify-layout`, `subagents`, `tailwind`, `tanstack-form`, `tanstack-hotkeys`, `tanstack-query`, `tanstack-router`, `tanstack-start`, `tanstack-store`, `tanstack-table`, `ultraplan`, `unslop-code`, `unslop-copywriting`, `unslop-docs`, `unsmell`, `zod`

See `README.md` for short purpose blurbs and install instructions.

## Research

- Prefer Exa MCP for web search and research when available.
- Prefer Context7 MCP for current docs about libraries, frameworks, SDKs, APIs, CLIs, and cloud services.
- For docs tasks, resolve the library ID first unless the user provides an exact `/org/project` ID, then query docs with the user's full question.
- Do not use Context7 for refactoring, writing scripts from scratch, business-logic debugging, code review, or general programming concepts.

## Skill Format

- Read and follow the system `skill-creator` guidance before creating or substantially updating a skill.
- Name skill folders with lowercase letters, digits, and hyphens only.
- Keep each skill in `skills/<skill-name>/`.
- Require `SKILL.md` with YAML frontmatter containing only `name` and `description`.
- Match `name` to the skill folder name.
- Put trigger/use information in the frontmatter `description`.
- Keep `SKILL.md` concise and procedural.
- Move detailed material into directly linked files under `references/`.
- Put deterministic helpers under `scripts/` only when they directly support the skill.
- Put reusable output assets under `assets/` only when they directly support the skill.
- Keep product-specific UI metadata in `agents/openai.yaml` when useful.
- Do not add README, installation guides, changelogs, or other auxiliary docs inside individual skill folders.
- Prefer `bun` / `bunx` over `npm` / `npx` (and over `yarn` / `pnpm`) in skill command examples. Keep narrative references to the npm registry or dist-tags when those describe package metadata, not CLI usage.

## Harness Neutrality

- Write skill bodies so they work across agent harnesses.
- Refer to optional capabilities generically, such as plan mode, todo lists, subagents, browser tools, or approval workflows.
- Include a plain chat or manual fallback when a workflow benefits from an optional harness feature.
- Do not make a skill body depend on one product's tool names, UI state, or hidden behavior.

## Validation

After creating or changing a skill:

- Confirm `name` matches the folder name and frontmatter contains only `name` and `description`.
- Confirm `description` covers both what the skill does and when to use it.
- Confirm linked `references/`, `scripts/`, and `assets/` paths exist and are one level deep from `SKILL.md`.
- Search for leftover template markers such as `TODO`, `[TODO]`, `Structuring This Skill`, and stale reference links.
- If a local `quick_validate.py` exists, run `quick_validate.py <path-to-skill>`; otherwise use the checks above.
- Preserve unrelated user changes.
- If prerequisites are missing, report them instead of installing tools without approval.
- Keep `README.md` and this file aligned with the skills present under `skills/`.
