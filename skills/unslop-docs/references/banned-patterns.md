# Banned Patterns

AI-documentation fingerprints. Prefer verifiable plain docs over generator polish.

## Chrome — CHR*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| CHR01 | Emoji headings | `## 🚀 Quick Start`, `## Features ✨` |
| CHR02 | Badge walls | Long shield rows; placeholders (`yourusername`); badges that 404 or lie |
| CHR03 | Beautifier header | Centered logo + emoji TOC as the first screen |
| CHR04 | Rule spam | `---` before every heading; bold label on every bullet |

## Structure — STR*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| STR01 | Empty skeleton | Overview→Features→Install→Usage→Contributing→License with generic filler only |
| STR02 | Labeled-bullet Features | `**Zero-config.** Does X…` as the default feature shape |
| STR03 | Rule-of-three substance | `Fast. Secure. Reliable.` / triad stacks as the main claim |
| STR04 | Rhetorical H2s | `Pick your path`, `What you get`, comma-couplet slogans as headings |
| STR05 | Deferred identity | Benefit slogans before “X is a …” |

## Claims / fluff — CLM*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| CLM01 | Marketing adjectives | `seamlessly`, `empower`, `robust`, `cutting-edge`, `enterprise-grade`, `industry-leading` |
| CLM02 | Stack-as-feature | “Built with TypeScript, React, and modern best practices” as Features |
| CLM03 | Soft install | “Ensure you have Node/Python installed” without pinned versions/commands |
| CLM04 | Hollow glue | `It's worth noting`, `Furthermore`, `This allows you to…` with no new fact |
| CLM05 | Significance puffing | `pivotal`, `testament`, `evolving landscape`, `broader movement` |

## Fiction / mismatch — FIC*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| FIC01 | Install fiction | Commands that don’t match `package.json` / `pyproject` / Makefile / CI |
| FIC02 | API/CLI hallucination | Flags, endpoints, methods not in code or generated API |
| FIC03 | Diagram fiction | Mermaid/architecture that doesn’t match modules |
| FIC04 | Changelog fluff | `various bug fixes`, `improved performance and reliability`, `enhanced UX` with no delta |
| FIC05 | Changelog lies | Invented capabilities; buried/silent breaking changes |

## Leakage — LEK*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| LEK01 | Chat residue | `Certainly!`, `Of course!`, `I hope this helps`, `Great question` |
| LEK02 | Citation / UTM tokens | `turn0search`, `oaicite`, `utm_source=chatgpt`, `utm_source=openai` |
| LEK03 | Unfilled templates | `[Your Name]`, `INSERT_…`, `yourusername`, `TODO: document` |
| LEK04 | Invisible prompts | HTML comments / ref-links with `SYSTEM:`, “ignore previous”, agent instructions |

## Boilerplate — BPL*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| BPL01 | Unfit CONTRIBUTING | Stock process that doesn’t match real branches/tests/review |
| BPL02 | Unfit CoC | Contributor Covenant (or similar) with wrong project name/contacts |
| BPL03 | Democratic length | Every section same weight regardless of difficulty |
