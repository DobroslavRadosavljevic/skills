# Research Sources

Synthesis basis for this skill. Focus: AI/model fingerprints, not classical maintainability debt.

## Over-engineering and abstraction

- [DEV — AI loves to over-engineer](https://dev.to/tyson_cung/ai-loves-to-over-engineer-your-code-and-youre-letting-it-4p9m)
- [Arslan — Stop AI from over-engineering](https://arslandg.substack.com/p/how-to-stop-ai-from-over-engineering)
- [Agent Patterns — Abstraction bloat](https://agentpatterns.ai/anti-patterns/abstraction-bloat/)
- [Claude Code Guides — Wrong abstraction level](https://claudecodeguides.com/claude-code-wrong-abstraction-level-fix-2026/)
- [Claude Code Guides — Overcomplicates simplicity](https://claudecodeguides.com/claude-code-overcomplicates-simplicity-fix-2026/)

## Defensive fallbacks and errors

- [BrainGrid — The fallback trap](https://www.braingrid.ai/blog/the-fallback-trap)
- [Assrt — AI defensive fallbacks](https://assrt.ai/t/ai-code-defensive-fallbacks)
- [Agent Patterns — Happy-path bias](https://agentpatterns.ai/anti-patterns/happy-path-bias/)

## Types, comments, and detection catalogs

- [Sailop — 23 AI-generated code tells](https://sailop.com/blog/ai-generated-code-tells-23-signs-2026)
- [Noen Thuda — Why LLMs write horrible code](https://noenthuda.substack.com/p/why-llms-write-horrible-code)
- [BeyondIT — Agents and TypeScript `any`](https://beyondit.blog/blogs/i-let-3-ai-agents-touch-my-typescript-codebase)
- [DEV — Copilot defaults to `any`](https://dev.to/avery_code/why-github-copilot-defaults-to-any-in-react-typescript-projects-2m47)
- [agent-review TAXONOMY](https://github.com/vnmoorthy/agent-review/blob/main/TAXONOMY.md)
- [AI-SLOP-Detector patterns](https://github.com/flamehaven01/AI-SLOP-Detector/blob/main/docs/PATTERNS.md)
- [vibecop](https://github.com/pikespeak/vibecop)

## Consensus mechanism

Models optimize for “looks complete / doesn’t crash / compiles.” That produces narrating comments, enterprise scaffolding, silent fallbacks, and type escapes. Negative constraints + scale budgets outperform “write clean code” prompts. Leave organic maintainability debt outside this skill’s core list.
