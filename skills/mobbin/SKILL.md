---
name: mobbin
description: "Enforces Mobbin MCP for real shipped-app design inspiration before UI/UX work. Use when designing, redesigning, or reviewing screens, flows, paywalls, onboarding, checkout, settings, empty states, marketing sections, or microcopy patterns; when the user says Mobbin, design inspiration, UI reference, pattern research, or benchmark against real apps. Requires Mobbin MCP search_screens, search_flows, and search_sections — do not invent UI from memory or substitute Dribbble/generic AI layouts."
---

# Mobbin

Use **Mobbin MCP** as the only primary source of design inspiration for UI/UX pattern work. Mobbin is a curated library of **shipped** mobile and web screens/flows — not portfolio mockups. The MCP returns real references (images + metadata + Mobbin links) so agents stop guessing generic UI.

**Hard gate:** Do not propose, sketch, or implement new UI direction until Mobbin MCP has returned references for this task — or until the user explicitly waives the gate after you reported MCP unavailable.

## Workflow

1. **Confirm Mobbin MCP** — Discover the Mobbin MCP server and its tools. If the server is missing, unauthorized (`needsAuth`), or errors, stop UI invention and follow [mcp-setup.md](references/mcp-setup.md). Authenticate when required; do not proceed on memory.
2. **Frame the design question** — Product surface, platform (`ios` | `web`), user job, constraints (brand, density, a11y), and whether you need a single screen, a multi-step flow, or a marketing/site section. Ask only the clarifying questions that change search intent.
3. **Search with the right tool** — Follow [search-playbook.md](references/search-playbook.md):
   - `search_screens` — one screen / layout / component composition
   - `search_flows` — multi-step journeys (onboarding, checkout, KYC, permissions)
   - `search_sections` — website sections (pricing, footers, heroes, feature grids)
4. **Inspect results** — Open/read returned images and `mobbin_url` links. Prefer concrete UI structure, hierarchy, CTAs, and empty/error states over vague “looks modern.”
5. **Synthesize, don’t clone** — Extract patterns (hierarchy, progressive disclosure, trust signals, motion of the flow) and adapt to the project’s brand/system. See [synthesis.md](references/synthesis.md).
6. **Iterate searches** — If results are weak, repeated, or off-domain, rewrite the query (more UI detail, named peer apps, exclude prior screen IDs). Run a second/third focused search before designing.
7. **Only then design or code** — Ground proposals in cited Mobbin references (app name + link). Keep fidelity appropriate (low/mid wire first unless asked for polished UI).

## Enforcement Rules

- **Must call Mobbin MCP** for inspiration, benchmarking, redesign direction, and “how do top apps do X?” questions.
- **Must discover tool schemas** before calling (do not guess argument names).
- **Must set `platform`** to `ios` or `web` explicitly; never bury platform in the query string.
- **Must write specific queries** — one intent per search; name UI elements and relationships; avoid vague style words (`modern`, `clean`, `beautiful`) and negations (`without ads`).
- **Must prefer `mode: "deep"`** for nuanced design questions; use `"standard"` only for quick breadth or rate-limit recovery (`"fast"` is deprecated alias of `"standard"`).
- **Must cite** at least 2–3 concrete references (app + what pattern was taken) before committing to a direction — unless the user asked for a single reference or MCP returned fewer usable hits.
- **Must not** invent UI from training memory, Dribbble/Behance vibes, or “typical SaaS” defaults when Mobbin MCP is available.
- **Must not** treat Mobbin as a license to copy proprietary assets, logos, or pixel-identical layouts — patterns and structure only.
- **If MCP is unavailable:** report blocker + setup steps; offer Mobbin website manual search as interim research only; still do **not** fabricate references.

## Verification

Before finishing design/UI work under this skill:

- [ ] Mobbin MCP was actually invoked (tool name + query + platform recorded).
- [ ] Tool choice matches need (screen vs flow vs section).
- [ ] Queries followed the specificity rules (no vague style keywords, one intent each).
- [ ] Results were inspected (images/links), not just app names recited.
- [ ] Final direction cites shipped references and explains adapted patterns.
- [ ] Implementation respects the project’s existing design system / brand constraints.
