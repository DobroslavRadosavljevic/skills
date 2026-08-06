# AGENTS.md Anti-Patterns

Do not ship these.

## Content

| Anti-pattern | Why it hurts | Do instead |
| --- | --- | --- |
| README clone | Dilutes agent signal; duplicates human docs | Keep human onboarding in `README.md`; link it |
| Generic advice (“write clean code”) | Models already know this | Encode only project-specific constraints |
| Full style guide paste | Burns context; drifts from prettier/eslint | Rely on formatters/linters; note only exceptions |
| Entire architecture essay inline | Always-on context overload | Short summary + link / index table |
| Auto-init dump left unedited | ETH Zurich-style findings: generic context can *hurt* | Strip the obvious; keep gotchas and commands |
| Vague stack (“React project”) | Wrong APIs and patterns | “React 19 + Vite 8 + Tailwind 4” (real versions) |
| Commands without flags | Agent runs the expensive wrong invocation | Exact scripts agents should type |
| No boundaries | Touches secrets, vendor, prod config | Always / Ask first / Never |
| Secrets in the file | Leaks into prompts and git | Name env vars only |
| Every rare edge case | Noise | Add rules when agents repeatedly fail |
| Persona / roleplay as the whole file | Wrong format for open AGENTS.md | Save personas for Copilot custom agents if needed |
| Harness-specific tool names as requirements | Breaks other agents | Describe outcomes; optional tools generically |

## Structure

- **One mega-file for a large monorepo** — nest package-level files; keep root as workspace map + shared rules.
- **Contradictory nested files** — state overrides explicitly (“For this package, use `make test-payments` instead of root `bun test`”).
- **Deep link chains** — from `AGENTS.md`, link one level to real docs; do not make agents chase nested “see also” mazes.
- **Empty ceremonial headings** — delete unused sections from the template.

## Process

- Shipping agent-generated `AGENTS.md` without a human pass.
- Never updating after repeated agent mistakes.
- Duplicating the same prose into `CLAUDE.md`, `GEMINI.md`, and `AGENTS.md` — prefer one source (`AGENTS.md`) and thin includes where a tool requires another filename.
