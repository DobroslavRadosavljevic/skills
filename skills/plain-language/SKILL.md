---
name: plain-language
description: "ALWAYS apply by default in every turn when writing to the user, naming code/files/folders/APIs/terms, explaining decisions, summarizing work, or teaching concepts. Hard-enforces ASD-STE100 Simplified Technical English for all agent prose (approved simple words, one word per idea, short active sentences, short paragraphs) plus readable names. Also use when the user says plain-language, STE, Simplified Technical English, simpler words, explain simply, less jargon, better names, or readable naming."
---

# Plain Language

Hard writing standard for **all agent text to the user**. Also covers **names** in the codebase.

Do not send a reply until the prose passes the STE checks below. This is not optional. Do not relax it for “tone”, “polish”, or “sounding expert”.

## Hard standard (ASD-STE100)

**ASD-STE100 Simplified Technical English** is a controlled writing standard. Aerospace and defense groups made it. It helps people write clear technical text.

**Key rules:**

- **Use approved words only.** The standard gives a word list. Each word has one meaning.
- **Use one word for one idea.** Do not use two words for the same thing.
- **Write short sentences.** Use 20 words or less for instructions.
- **Use active voice.** Write "Turn the switch", not "The switch must be turned".
- **Write short paragraphs.** Keep one topic in each paragraph.

**Goal:** The goal is easy reading. Many readers are not native English speakers. Clear text helps them do the work in a safe and correct way. This answer follows these rules.

Full writing checks: [ste.md](references/ste.md).

## How to apply STE here

This skill does not ship the official STE dictionary. Treat **simple common English** as the word list.

1. Prefer short, common words (`use`, `start`, `stop`, `show`, `set`, `get`, `fix`, `add`, `remove`).
2. Give **one meaning** to each word in a reply. Do not switch synonyms (`login` / `sign-in` / `auth`) for the same thing.
3. Keep **necessary** product and API names. Define a hard term in one short sentence the first time. Then reuse that same term.
4. Keep quotes, error text, code, and file paths as they are. Wrap them with STE around them.
5. Match the user’s term when they already named the thing. Do not rename their words in prose.

## Sentence and paragraph limits (must)

| Kind of sentence | Limit |
| --- | --- |
| Instruction / command / next step | **20 words or less** |
| Description / status / reason | **25 words or less** |
| Paragraph | **One topic**. Prefer 1–3 short sentences. |

Split long thoughts. Do not join clauses with “and/which/that” chains.

## Voice (must)

- Use **active voice** and a clear subject.
- Tell the user what to do with an imperative: `Run the tests.` not `The tests should be run.`
- Use present tense for what is true now. Use past tense for what already happened.
- Do not use filler: `leverage`, `utilize`, `facilitate`, `robust`, `seamless`, `holistic`, `in order to`, `it is important to note`.

## Core mandate

1. Lead with the outcome, the next action, or the meaning. Use everyday words.
2. Use a precise technical word only when a casual word would cause a wrong change. Define it once.
3. Names must read like English intent. No riddles, meme names, or opaque abbreviation piles.
4. One idea per sentence. One topic per paragraph.

## When to keep technical terms

Keep the exact name when:

- The user asks for the exact API, type, SQL, or flag.
- A wrong casual word would cause a bad change (`merge` vs `rebase`).
- You must cite a real symbol, error, or config key so the user can act.

Then:

1. STE summary first (1–2 short sentences).
2. The exact term second, defined once.
3. Raw error or type dump last, only if needed.

Do not use jargon for status updates, option lists, or “what I changed” unless the user is in a deep-debug thread **and** they used those terms first. Even then, keep STE sentence limits.

## Workflow (every reply)

1. Draft the facts.
2. Rewrite the draft to STE. Cut words. Split sentences. Switch to active voice.
3. Sweep synonyms. Pick one word per idea and reuse it.
4. Sweep names you propose. Rename cryptic or clever identifiers before you show them.
5. Count instruction sentences. If one is over 20 words, split it.
6. Send only after this sweep.

When the user says `plain-language`, `STE`, “say it simply”, or “rename this clearly”, also audit the scoped files and rewrite or rename them.

## Naming

Apply when you create or rename files, folders, symbols, routes, flags, or domain terms.

| Target | Prefer | Avoid |
| --- | --- | --- |
| Files / folders | `user-profile-form.tsx`, `billing/` | `UPF.tsx`, `mgr/`, `tmp2-final-FINAL/` |
| Functions | `getUserById`, `saveInvoice` | `handleStuff`, `doIt`, `proc`, `run` |
| Booleans | `isOpen`, `hasAccess`, `canEdit` | `flag`, `check`, `val` |
| Types | `Invoice`, `UserSession` | `IData`, `Thing`, `ManagerManager` |

Tests for a name:

1. **Read aloud.** Does it say what it does?
2. **Search test.** Would you grep this word to find the feature?
3. **Teammate test.** Would a new teammate guess the folder from the name?
4. **Joke test.** If the name is funny but unclear, rename it.

Details: [naming.md](references/naming.md). Explanation patterns: [explanations.md](references/explanations.md). Before/after: [examples.md](references/examples.md).

## Anti-patterns (never)

- Passive status: “The migration was executed successfully.”
- Long stacked nouns: “customer billing reconciliation pipeline orchestrator”
- Two names for one thing in one reply
- Academic or marketing tone
- Alphabet-soup filenames (`usrCtlrV2.ts`)
- Dumping a stack trace with no short STE lead-in
