# Research Sources

Synthesis basis for this skill. Patterns are consensus across designer critiques and anti-slop guides (2025–2026), not a single vendor checklist.

## Critiques and essays

- [Kyle Chayka — The generic style of AI web design](https://kylechayka.substack.com/p/the-generic-style-of-ai-web-design) — cream/beige, terracotta, italic serifs, tracked subheads, ticker bars as Claude-era generic
- [Takuma Kakehi — AI design isn’t ugly, it’s fluent](https://uxdesign.cc/ai-design-isnt-ugly-it-s-fluent-and-that-s-the-problem-131b2f4eb78c) — centered heroes, soft gradients, safe sans, mean-seeking iteration
- [Sascha Becker — Same same but different](https://saschb2b.com/blog/same-same-but-different) — dark glow heroes, Inter, dual CTAs, three icon cards, indigo defaults
- [Nick Babich — How to spot AI-generated design](https://uxplanet.org/how-to-spot-ai-generated-design-697aaabe76c8) — predictable SaaS skeleton, neon/pastel gradients, oversized radii, vague microcopy
- [Codexical — AI UI commodity trap](https://www.codexical.com/posts/2026-04-23-ai-ui-commodity-trap) — dashboard chrome sameness and trust cost
- [Rottoways — Vibecoding design problem](https://rottoways.com/blog/vibecoding-design-problem) — eight recurring vibecode patterns

## Pattern catalogs and anti-slop guides

- [Sailop — 90+ AI design patterns to avoid](https://sailop.com/blog/90-plus-ai-design-patterns-to-avoid-definitive-list) — code-level fingerprints from large AI-page samples
- [Sailop — Why every AI-generated website looks the same](https://sailop.com/blog/why-every-ai-generated-website-looks-the-same) — mode collapse / Tailwind feedback loop
- [Vibe Code Kit — AI slop design](https://vibecodekit.dev/ai-slop-design) — root cause = no decision; lock tokens before styling
- [BSWEN — AI-generated UI anti-patterns](https://docs.bswen.com/blog/2026-03-20-ai-generated-ui-anti-patterns/) — explicit DON’Ts; glass, card nesting, gradient metrics
- [UX Skill — Why AI uses purple gradients](https://uxskill.laithjunaidy.com/blog/why-ai-uses-purple-gradients.html) — violet as training-data centroid
- [UX Skill — How to tell if a website was AI-generated](https://uxskill.laithjunaidy.com/how-to-tell-if-a-website-was-ai-generated.html) — ranked visible tells / cluster rule

## External anti-slop guides

- [Anthropic — Prompting for frontend aesthetics](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics) — avoid Inter/Arial and purple-on-white; warn against Space Grotesk convergence
- [Hallmark — anti-patterns](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/anti-patterns.md) — named tells: purple hero, Inter, 3-column grid, side-stripe, gradient headline
- [Refero — anti-ai-slop](https://github.com/referodesign/refero_skill/blob/HEAD/references/anti-ai-slop.md) — indigo ban, cards ban, dark-default ban, calm-editorial-serif as second-wave default

## Consensus mechanism

Models regress to high-probability UI from Tailwind docs, shadcn examples, and SaaS templates. Negative constraints + locked tokens outperform “make it unique” prompts. Escaping one centroid (purple SaaS) by adopting another (cream editorial) is still slop.
