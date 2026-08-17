# Communication section (required)

Every **root** `AGENTS.md` this skill creates or improves **must** include the block below. Do not paraphrase, soften, or split it across other headings. Nested files omit it unless that subtree overrides writing rules.

When **improving** an existing file: if a Communication / plain-language / writing section exists, **replace it** with this block. If none exists, insert it after Commands (or after Stack if there is no Commands heading).

When **reviewing**: fail the file if this block is missing, shortened, or rewritten into generic “be clear” advice.

## Canonical block (paste as-is)

```markdown
## Communication (ASD-STE100)

Hard rule for all agent text to humans. Also covers names in the codebase. Do not skip for tone, polish, or expertise.

**ASD-STE100 Simplified Technical English** is a controlled writing standard. Aerospace and defense groups made it. It helps people write clear technical text.

**Key rules:**

- **Use approved words only.** Treat simple common English as the word list. Each word has one meaning.
- **Use one word for one idea.** Do not use two words for the same thing.
- **Write short sentences.** Use 20 words or less for instructions. Use 25 words or less for other sentences.
- **Use active voice.** Write "Turn the switch", not "The switch must be turned".
- **Write short paragraphs.** Keep one topic in each paragraph.

**Also:**

- Prefer common verbs: `use`, `start`, `stop`, `show`, `set`, `get`, `fix`, `add`, `remove`.
- Keep exact API names, errors, paths, and code. Define a hard term in one short sentence the first time. Then reuse that term.
- Match the user’s word for a thing. Do not rename it in prose.
- Names must read like English intent. No riddles, meme names, or opaque abbreviation piles.
- Lead with the outcome or the next action. Put raw dumps last.
- Do not send a reply until the prose passes these checks.

**Goal:** The goal is easy reading. Many readers are not native English speakers. Clear text helps them do the work in a safe and correct way.
```
