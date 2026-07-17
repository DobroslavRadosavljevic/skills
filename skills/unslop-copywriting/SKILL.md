---
name: unslop-copywriting
description: Bans AI-slop public UI copy and rewrites website/app text into plain language for humans. Removes empty marketing verbs, robotic microcopy, vague CTAs, apology-padded errors, and especially leaked internals — agent instructions, implementation criteria, schema/API names, TODOs, stack traces, and prompt residue rendered as user-facing strings. Use when the user says "unslop-copywriting", "unslop copy", "AI copy", "robotic copy", "plain language UI", or asks to fix microcopy, marketing copy, errors, empty states, or text that reads like it was written for machines.
---

# Unslop Copywriting

AI models write public UI text in two failure modes: **marketing slop** (empty empowerment verbs, interchangeable SaaS claims) and **boundary failure** (instructions, criteria, schema, and process notes rendered as if they were product copy). This skill **bans both** and rewrites until every user-visible string reads as plain language for a human completing a task.

## Core Mandate

1. **Public UI is for humans.** Never ship copy that sounds like a system prompt, ticket, schema, stack trace, or implementation note.
2. **Ban first, then rewrite.** Do not polish slop in place. Strip banned phrases and leaked internals, then write specific plain language.
3. **Prefer delete.** If a string adds no task value, remove it. Models always produce text; humans often should not.
4. **Outcome over fluff.** Name the concrete action, destination, or result. Vague verbs and ghost CTAs are failures.
5. **Pivot rule.** If a surface hits **3+** banned patterns, rewrite the whole message set for that surface — do not synonym-swap.

## Hard Bans (never ship)

| Cluster | Banned |
| --- | --- |
| Leaked internals | Agent/dev instructions as headings or body; “criteria” / permission / fallback notes as visible copy; API paths, schema/JSON keys, feature flags, env names; `TODO` / `FIXME` / `lorem ipsum` / placeholder honesty; stack traces, raw `error.message`, HTTP codes as headlines; “As an AI…”, session narration, prompt residue |
| Marketing voice | `unlock`, `empower`, `elevate`, `supercharge`, `harness`, `unleash`, `revolutionize`, `transform` (without concrete before→after); `effortlessly`, `seamlessly`, `streamline`; empty adjectives (`powerful`, `robust`, `cutting-edge`, `next-generation`, `AI-powered` as filler); `Welcome to our platform`, `The future of X`, `Built for modern teams` |
| Rhetoric | `It's not X — it's Y` / `Not just X, but Y`; `In today's …`; `Let's dive in`; `Furthermore` / `Moreover` / `It's worth noting`; em-dash abuse in short UI strings; rule-of-three adjective stacks (`Fast. Secure. Reliable.`) |
| Controls / CTAs | Lone `Submit`, `OK`, `Click here`, `Learn more`, `Get started`, `Yes`/`No` when an outcome verb exists; emoji or `!` on buttons |
| Errors / empty | `Something went wrong` / `An error occurred` alone; `Invalid input`; blame (`illegal`, `you must`, ALL CAPS); apology padding on validation; fake “we've been notified”; empty states with no next step; `No data available` database voice |
| Tone | Over-formal committee voice on routine UI; forced cheer (`Awesome!!`) on high-stakes flows; humor in errors; sensory-only directions (`click the green button`) |

Full catalog: [references/banned-patterns.md](references/banned-patterns.md).

## Workflow

### 1. Scope

- **Full unslop:** all first-party user-visible strings (pages, components, toasts, emails in-app, i18n/locale files, `aria-label`, empty/error states, marketing heroes).
- **Targeted unslop:** named routes, components, locales, or copy categories only.

State the scope, then proceed. Do not rewrite legal/compliance text unless asked; flag it if it fails plain-language tests.

### 2. Audit

Search JSX/HTML/i18n for banned phrases, leak markers, and vague CTAs. Record file, string, pattern id, and severity.

Critical severity (must fix): any leaked internal (I*), stack/exception in UI, prompt residue.

Use [references/review-checklist.md](references/review-checklist.md).

### 3. Lock a voice contract

Before rewriting, write a short contract:

- Audience and reading level (default: plain language, ~6th–8th grade for general UI)
- Product vocabulary glossary (one word per concept: Sign in vs Log in — pick one)
- Voice (plain, direct, specific) and tone shifts by stakes (calmer on billing/errors; warmer on success)
- What must never appear (paste hard bans that matter for this product)
- When silence is better than help text

If the contract would fit any CRM/mattress/tax tool unchanged, revise it.

Craft rules: [references/craft-antidotes.md](references/craft-antidotes.md).

### 4. Rework

For each banned hit:

1. **Delete** leaked internals and filler — do not paraphrase instructions into “nicer” instructions.
2. **Rewrite** remaining copy in plain language: specific verb, user words, one idea per sentence.
3. **Buttons:** verb (+ noun) naming the outcome; sentence case; no punctuation/emoji.
4. **Errors:** what happened → why (if useful) → what to do next. Map exceptions via a user-message helper; never render raw errors.
5. **Empty states:** why empty → one primary next action. Distinguish first-run vs failure-as-empty.
6. **Marketing:** replace every vague adjective with a number, every adverb with a comparison, every power verb with a concrete action — or cut the claim.
7. Preserve meaning and behavior; change copy only. Ask before altering legal/brand-mandated strings.

### 5. Verify

Re-run the checklist. Pass the **human test:** read aloud — would a non-engineer know what to do next with no internal knowledge? Pass the **any-product test:** if the same sentence could sit on an unrelated product unchanged, rewrite.

## Completion Report

- Scope audited
- Leaks removed (critical)
- Banned patterns rewritten (by cluster)
- Voice contract locked
- Remaining exceptions (brief-justified only)
- Checklist status

## Reference Routing

- [references/banned-patterns.md](references/banned-patterns.md) — enforceable ban catalog
- [references/craft-antidotes.md](references/craft-antidotes.md) — plain-language replacements by surface
- [references/review-checklist.md](references/review-checklist.md) — audit/rework checklist
- [references/sources.md](references/sources.md) — research basis
