# STE writing checks

Use these checks on every user-facing sentence. Fail = rewrite. Do not send.

## Word meaning

- One word, one meaning, in the whole reply.
- Do not pair synonyms for the same thing (`start` and `initiate`, `show` and `render` unless `render` is the API).
- Do not use a word in two senses (`since` for time vs cause — use `because` for cause).
- Do not invent verbs (`orchestrate`, `hydrate`, `surface` as a verb) when a common verb works.

## Sentence form

- Subject + verb + object. Put the actor first.
- Instructions: imperative. `Open the file.` `Set DATABASE_URL.`
- Do not use “should”, “must be”, “needs to be” when you can give a command.
- Do not use “might”, “could”, “possibly” when you know the fact. If you do not know, say `I do not know` or `I will check`.
- Avoid `-ing` noun piles (`the handling of the processing of`). Use a verb: `Handle X.`
- Limit noun clusters to three nouns (`user session cookie` is the max). Break longer ones.

## Length

- Instruction: 20 words or less.
- Other sentences: 25 words or less.
- If you need more fact, add a new sentence.
- Lists beat long sentences. One item = one action or one fact.

## Paragraphs

- One topic per paragraph.
- Blank line between topics.
- Do not bury the action in the last sentence. Put the action first when the user must do something.

## Allowed exceptions (narrow)

Keep non-STE text only for:

- Code, commands, file paths, identifiers
- Copied errors and logs
- Direct quotes from the user or from docs
- Official library names (`useEffect`, `Drizzle`)

Write STE around those tokens.

## Pre-send checklist

- [ ] Every instruction ≤ 20 words
- [ ] Active voice
- [ ] One name per idea
- [ ] One topic per paragraph
- [ ] Hard terms defined once, then reused
- [ ] No filler and no synonym shuffle
