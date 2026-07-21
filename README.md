# Agent Skills

Personal agent skills I use in development workflows.

These are plain skill folders. Each skill has a `SKILL.md` entrypoint and may include focused references, scripts, assets, or product-specific metadata. The skill instructions are written to be usable across agent harnesses instead of depending on one tool.

## Skills

| Skill | Purpose |
| --- | --- |
| `base-ui` | Build, review, migrate, or debug React UIs with Base UI primitives. |
| `brainstorm` | Explore ideas, plans, research, and codebase questions in a read-only session. |
| `compound-ui` | Build or refactor React UI into shadcn-style compound components. |
| `effect` | Build, review, debug, migrate, or plan Effect v4 TypeScript code. |
| `elysia` | Build, review, debug, test, and deploy Elysia applications with current docs. |
| `handoff` | Produce or consume agent-to-agent handoff context so another session can resume work. |
| `legend-state` | Build, review, migrate, and debug Legend-State v3 observable, React, persistence, and sync systems. |
| `loop` | Implement, review, fix, and repeat until no actionable review issues remain. |
| `motion` | Design, audit, specify, or implement product UI motion with accessibility and performance in mind. |
| `react` | Build, review, debug, migrate, or plan React apps with current React docs. |
| `research` | Investigate external sources and codebase evidence before recommending next steps. |
| `simplify-layout` | Shorten file and folder names and group related modules so paths stay scannable. |
| `subagents` | Split harder work into safe disjoint lanes and coordinate subagent results. |
| `tailwind` | Build, review, debug, configure, or migrate Tailwind CSS projects. |
| `tanstack-form` | Build, review, debug, migrate, or plan TanStack Form React forms. |
| `tanstack-hotkeys` | Build, review, debug, migrate, or plan TanStack Hotkeys shortcut systems. |
| `tanstack-query` | Build, review, debug, migrate, or plan TanStack Query server-state code. |
| `tanstack-router` | Build, review, debug, configure, migrate, or plan TanStack Router apps. |
| `tanstack-start` | Build, review, debug, configure, migrate, or plan TanStack Start apps. |
| `tanstack-store` | Build, review, debug, migrate, or plan TanStack Store state management. |
| `tanstack-table` | Build, review, debug, migrate, or plan TanStack Table React tables. |
| `ultraplan` | Ask detailed planning questions, recommend answers, and produce a precise implementation plan before work starts. |
| `unslop-code` | Strip AI-looking code fingerprints and rework implementation to match problem scale. |
| `unslop-copywriting` | Rewrite public UI copy into plain language and remove robotic or leaked-internal text. |
| `unslop-docs` | Rewrite README/docs into plain, verifiable guidance and remove generated-docs slop. |
| `unsmell` | Find and fix maintainability problems across a codebase or scoped area. |
| `zod` | Build, review, debug, migrate, or plan Zod v4 validation and schema code. |

## Install With skills.sh

The [skills.sh](https://www.skills.sh/) CLI can install skills from GitHub repos, URLs, or local paths.

From this checkout:

```bash
npx skills add .
```

Install skills directly from the GitHub repo:

```bash
# List available skills without installing
npx skills add DobroslavRadosavljevic/skills --list

# Install one skill
npx skills add DobroslavRadosavljevic/skills --skill loop

# Install multiple skills
npx skills add DobroslavRadosavljevic/skills --skill loop --skill ultraplan

# Install all skills from the repo
npx skills add DobroslavRadosavljevic/skills --skill '*'
```

Useful options:

- `-g, --global`: install globally instead of into the current project.
- `-a, --agent <name>`: install for a specific agent, such as `codex` or `claude-code`.
- `--copy`: copy files instead of symlinking them.
- `-y, --yes`: skip prompts.
- `--all`: install all skills to all supported agents without prompts.

Example:

```bash
npx skills add DobroslavRadosavljevic/skills --skill motion -a codex -g
```

## Skill Conventions

- Skill folder names are lowercase with hyphens.
- `SKILL.md` frontmatter contains only `name` and `description`.
- `description` explains both what the skill does and when it should trigger.
- Long or detailed guidance goes in `references/` and is linked from `SKILL.md`.
- Scripts and assets are included only when the skill actually uses them.
- Individual skill folders do not have their own README files.

## License

[MIT](LICENSE)
