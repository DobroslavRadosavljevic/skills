---
name: copywriting
description: >-
  Writes and rewrites visitor-facing copy: marketing pages, app UI, docs, email,
  and YAML fields such as shortDescription, seoTitle, seoDescription, verdict,
  pros, cons, faq, summary, description. One reader, one job, one promise. Each
  file gets its own outline. Bans CMS notes, cloned templates, and the banned
  word and phrase lists in [slop-words.md](references/slop-words.md). All copy stays dead simple to read. Ban
  jargon. Use ASD-STE100 Simplified Technical English for docs, UI, errors, and
  other technical text. Use when the user asks for copywriting,
  public copy, UI microcopy, docs prose, or says the text sounds like a model.
---

# Copywriting

You are writing for a person who will read this on a site, in an app, or in docs. Not for a CMS. Not for another agent.

Say “you” to the reader. Say “we” for the company. Name the product where a person would name it. Legal pages stay exact. They still cannot read like ticket notes.

Every line must be easy to read on the first pass. Short words. Short sentences. One idea each. No jargon unless you define it in the next breath.

For docs, UI, errors, how-tos, and any technical page, write **ASD-STE100 Simplified Technical English** (see **Simple English** below). Marketing pages stay simple too. They can mix a short line with a longer one. They cannot hide behind insider talk.

Do not swap synonyms to trick a detector. Put a real fact in. Cut the rest.

## What counts as public copy

- Buttons, menus, errors, empty states, forms, onboarding, notifications
- Landing, pricing, compare, blog, ads, email
- Tutorials, how-tos, reference, explanation, READMEs
- Front matter the visitor sees: `shortDescription`, `seoTitle`, `seoDescription`, `verdict`, `pros`, `cons`, `faq`, `summary`, `description`

If the reader would see it, it is copy. [surfaces.md](references/surfaces.md) picks the rules for that surface. Errors and docs do not sell.

## Rules

1. Each file has its own outline and its own sentences. Nav can repeat (`Pricing`). Body headings cannot.
2. Lead with what they already care about. Unaware: the problem. Solution-aware: how it works. Product-aware: name, price, what is gated. (Schwartz)
3. H1 and the first 40 words make one promise. A feature earns a “so you can…” or it goes. (FAB)
4. Numbers, limits, prices, who should skip. Invented proof stays off the page. “Limited time” that never ends stays off the page.
5. Check [never.md](references/never.md) and [slop-words.md](references/slop-words.md). Then **Simple English**. One decorative hit or a jargon pile fails the piece.
6. Clear, short, worth reading, believable. Then [sweep.md](references/sweep.md).

Order of beats: [techniques.md](references/techniques.md). How to draft: [craft.md](references/craft.md). Fail/pass: [examples.md](references/examples.md). Slop words: [slop-words.md](references/slop-words.md).

## Steps

1. Name the surface (UI, site, docs, email, legal). Name the reader and the job in one sentence each. For docs, name the kind: tutorial, how-to, reference, or explanation.
2. Collect facts. Read sibling pages so you do not copy their opening. Steal the customer’s words from UI, reviews, or support if you have them.
3. Pick one frame in [techniques.md](references/techniques.md) to order the beats. Do not print PAS or AIDA as headings. Do not reuse one outline on every CMS row.
4. Headings come from what is different about *this* subject. If two pages would share three H2s, change the outline.
5. Write the page and the visitor fields. Promise, proof, limit, next action.
6. Run [never.md](references/never.md), [slop-words.md](references/slop-words.md), and [sweep.md](references/sweep.md). Count words in each sentence. Split anything over the Simple English limits.
7. If you wrote more than one file, compare first sentences, H2s, and closings. If they match, rewrite.

If the sweep fails, do not send it.

## Modes

- **Write** — new copy. Own outline. Sweep.
- **Rewrite** — keep the facts. Kill clones, CMS talk, and banned words.
- **Review** — file, quote, class, rewrite. Leave copy that already sounds like a person.

Stay inside any path the user named.

## Simple English

The reader must get the meaning in one read. Many readers are not native English speakers. Write for them.

**Always (every surface)**

- Everyday words: `use`, `start`, `stop`, `show`, `set`, `get`, `fix`, `add`, `remove`, `pay`, `save`.
- One word for one idea. Do not switch `login` / `sign-in` / `auth` for the same thing.
- Active voice. Name who does the act. `Turn the switch.` not `The switch must be turned.`
- One idea per sentence. One topic per paragraph (1–3 short sentences).
- No stacked nouns (`customer billing reconciliation pipeline`). Split them.
- No unexplained acronyms. Write the full name once. Then the short form.
- Keep real product names, API names, and error strings. Define a hard term in one short sentence. Then reuse that same term.
- Match the reader’s word if they already named the thing.

**Sentence limits**

| Kind | Limit |
| --- | --- |
| Instruction, button, step, error fix | 20 words or less |
| Description, status, reason | 25 words or less |

Split long thoughts. Do not chain `and` / `which` / `that`.

**Technical text (docs, UI, errors, README, how-to): ASD-STE100**

ASD-STE100 Simplified Technical English is a controlled writing standard. Aerospace groups made it so a technician can follow a procedure without guessing.

This skill does not ship the official dictionary. Treat simple common English as the word list. Apply the limits above with no slack.

1. Draft the facts.
2. Cut. Split. Switch to active voice.
3. Pick one word per idea. Reuse it.
4. If an instruction is over 20 words, split it.
5. Then send.

Keep the exact API, flag, or error when a casual word would cause a wrong action (`merge` vs `rebase`). Lead with a plain sentence. Put the exact term second.

**Ban overly technical wording**

Cut: Latinate fog (`utilize`, `facilitate`, `initiate`, `terminate` when `use`, `help`, `start`, `stop` work). Cut insider slang the buyer does not use. Cut fake precision (`asynchronously hydrate the client cache`) when you mean `Load the list again`.

Do not sound like a whitepaper. Sound like a person explaining across a table.
