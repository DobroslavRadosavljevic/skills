# AGENTS.md Template

Starter shape. Replace placeholders. Delete sections that do not apply. Prefer fewer lines.

```markdown
# AGENTS.md

## Stack

- Language / runtime: <e.g. TypeScript 5.x on Bun 1.x>
- App framework: <e.g. TanStack Start>
- Data / validation: <e.g. Drizzle, Zod 4>
- Tests: <e.g. Playwright 1.x E2E, Testcontainers integration — only what exists>
- Package manager: <bun | pnpm | npm | …> — use this, not others

## Commands

- Install: `<cmd>`
- Dev: `<cmd>`
- Test (all): `<cmd>`
- Test (focused): `<cmd with file or grep filter>`
- Lint / typecheck: `<cmd>`
- Build: `<cmd>`
- Format (if required before finish): `<cmd>`

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

## Testing (E2E and integration first)

Hard rule for all test work. A unit test that cannot catch a real bug costs upkeep and gives false trust.

- **Use only the test setups listed below.** Do not add a new E2E or integration setup (for example Playwright or Testcontainers). Ask first.
- **Never write unit tests after you write code.** A test written after the code only copies what the code does. It does not find bugs.
- **Prefer E2E and integration tests.** Use them to prove that complex features work through real entry points and real services.
- **End each E2E test with an artifact.** The artifact must be verifiable and repeatable: for example a trace, screenshot, video, HAR file, or JSON report.
- **Test a unit in isolation only when you must.** First, write down all the ways it can fail. Then write the code. Each isolated test checks one failure from that list. Keep the list next to the test.
- **Delete or do not add a unit test that cannot catch a real bug the E2E and integration tests miss.**

Setups in this repo:

- E2E (`<tool>`): all `<command>`, one `<command>`, artifacts in `<path>`
- Integration (`<tool>`): all `<command>`, one `<command>`, needs `<Docker, env vars>`

## Layout

- App / source: `<path>`
- Tests: `<path>`
- Shared packages (monorepo): `<path>`
- Generated / do not edit: `<path>`

## Project rules

- <Invariant agents miss — e.g. “Catch specific errors; never bare `catch (e)`”>
- <Architecture rule — e.g. “Feature modules own routes; no cross-feature imports”>
- Prefer pointing at a canonical file: see `<path>` for the pattern to copy


## Git and PRs

- Commit / PR title: `<format if non-default>`
- Before commit / PR: run `<lint>` and `<test>` (or state what CI owns)
- Ask before: force-push, changing release config, or adding production dependencies

## Boundaries

- Always: <e.g. run focused tests after logic changes; keep secrets in env only>
- Ask first: <e.g. DB schema changes, new dependencies, CI/CD edits>
- Never: commit secrets; edit `<vendor|generated paths>`; <other hard stops>

## Docs index

| Topic | Document |
| --- | --- |
| Human setup | `README.md` |
| Architecture | `<path>` |
| Security model | `<path>` |
| ADRs / decisions | `<path>` |

## Security notes

- <Only repo-specific gotchas; link to the full security doc when long>
```

## Minimal viable file

If the repo is tiny, this can be enough:

```markdown
# AGENTS.md

## Commands
- Install: `bun install`
- Dev: `bun run dev`
- Test: `bun test`
- Lint: `bun run lint`

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

## Testing (E2E and integration first)

Hard rule for all test work. A unit test that cannot catch a real bug costs upkeep and gives false trust.

- **Use only the test setups listed below.** Do not add a new E2E or integration setup (for example Playwright or Testcontainers). Ask first.
- **Never write unit tests after you write code.** A test written after the code only copies what the code does. It does not find bugs.
- **Prefer E2E and integration tests.** Use them to prove that complex features work through real entry points and real services.
- **Test a unit in isolation only when you must.** First, write down all the ways it can fail. Then write the code. Each isolated test checks one failure from that list. Keep the list next to the test.
- **Delete or do not add a unit test that cannot catch a real bug the E2E and integration tests miss.**

Setups in this repo:

- No E2E or integration setup. Do not add one without approval.

## Boundaries
- Ask first before adding dependencies.
- Never commit secrets or edit generated files under `dist/`.
```
