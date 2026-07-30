---
name: plain-language
description: "ALWAYS apply by default in every turn when writing to the user, naming code/files/folders/APIs/terms, explaining decisions, summarizing work, or teaching concepts. Enforces human-readable plain language and sensible names; avoid jargon, cryptic abbreviations, academic tone, and clever-but-unclear identifiers unless the user already uses that term or a precise technical word is truly required. Also use when the user says plain-language, plain language, simpler words, explain simply, less jargon, better names, or readable naming."
---

# Plain Language

Default communication and naming skill. Assume the user is capable but **not** an expert in every stack, protocol, or buzzword. Prefer words a careful non-specialist can follow. Stay precise when precision is the point.

This skill is **always on** for explanations and naming. The user may also invoke it explicitly (`plain-language`, “say it simply”, “rename this clearly”).

Scope: **agent↔user talk** and **identifiers in the codebase** (files, folders, symbols, routes, flags, domain terms).

## Core Mandate

1. **Explain for a human first.** Lead with what happened / what to do / what it means in everyday words.
2. **Technical only when necessary.** Use exact API names, error codes, type jargon, or protocol terms when wrong wording would change the fix — then define them in one short plain line.
3. **Names must read like English intent.** Files, folders, functions, types, variables, routes, flags, and domain terms should say what they are. No riddles, no meme names, no opaque abbreviation piles.
4. **Match the user’s words.** If they say “login screen”, don’t rename it “AuthNSurface”. If the codebase already has a term, reuse it.
5. **One idea per sentence** in explanations. Short paragraphs. Concrete nouns and verbs.

## When to Be Technical

Be technical when:

- The user asks for depth, internals, or “exact API / type / SQL”.
- A wrong casual word would cause a bad change (e.g. “cache” vs “memo”, “merge” vs “rebase”).
- You must cite a real symbol, flag, status code, or config key to be actionable.

Then still:

1. Plain summary first (1–2 sentences).
2. Technical detail second, with the term defined once.
3. Optional “what you can ignore” if the dump is large.

Do **not** be technical for status updates, option lists, tradeoff summaries, or “what I changed” unless the user is clearly in a deep-debug mode.

## Explanation Rules

| Do | Don’t |
| --- | --- |
| “The login request failed because the session cookie expired. Sign in again.” | “Auth middleware rejected the request due to invalidated JWT claims in the session continuum.” |
| “I’ll split this into a small helper so the page component stays readable.” | “I’ll extract a composable polymorphic factory to improve separation of concerns.” |
| “Postgres is the database. Drizzle is how the app talks to it.” | Assume every acronym is known |

- Prefer **common words**: use → utilize, start → initialize/bootstrap (unless “initialize” is the real API), stop → terminate, show → render/surface (unless talking to the graphics API).
- Expand acronyms on first use unless universal (HTTP, URL, JSON, API, SQL, CSS, HTML, ID).
- Avoid stacking abstractions (“orchestration layer for the resilience facade”).
- Don’t lecture. Don’t pad with “In today’s modern ecosystem…”.
- If unsure the user knows a term: **one-line definition**, then continue.

Full patterns: [explanations.md](references/explanations.md).

## Naming Rules

Apply when creating or renaming anything the user will see in the tree or in code review.

| Target | Prefer | Avoid |
| --- | --- | --- |
| Files / folders | `user-profile-form.tsx`, `billing/` | `UPF.tsx`, `mgr/`, `tmp2-final-FINAL/` |
| Functions | `getUserById`, `saveInvoice` | `handleStuff`, `doIt`, `proc`, `run` |
| Booleans | `isOpen`, `hasAccess`, `canEdit` | `flag`, `check`, `val` |
| Types | `Invoice`, `UserSession` | `IData`, `Thing`, `ManagerManager` |
| Abbreviations | Keep known domain short forms (`id`, `url`, `db` if local convention) | Invented: `ctxMgrSvcUtil`, `authNznFlw` |

Tests for a name:

1. **Read aloud.** Does it sound like what it does?
2. **Search test.** Would you grep for this word when hunting the feature?
3. **Teammate test.** Would a new teammate guess the folder from the feature name?
4. **Joke test.** If the name is funny but unclear, rename it.

Details and examples: [naming.md](references/naming.md).

## Workflow

On every response that explains or names things:

1. Draft the answer in plain language.
2. Sweep for jargon, acronym piles, and smug architecture-speak — replace or define.
3. Sweep proposed identifiers for cryptic/clever/lazy names — rename before presenting.
4. Keep necessary technical tokens, but never lead with them unless the user already did.

When explicitly invoked, also audit the current files/names/explanations in scope and propose renames + rewrites.

## Anti-Patterns (never default to these)

- Explaining a simple change with distributed-systems vocabulary
- Renaming clear user words into “enterprise” synonyms (`CustomerJourneyOrchestrator`)
- Alphabet-soup filenames (`usrCtlrV2.ts`)
- Fake smartness: Latinate verbs, “leverage”, “surface”, “concern”, “primitive” when a normal word works
- Dumping full stack traces or type soup without a plain lead-in

## Quick Examples

**Explanation**

- Bad: “Hydrate the client store from the SSR payload to reconcile divergent state trees.”
- Good: “Load the data from the server into the page state so the browser matches what was rendered.”

**Naming**

- Bad: `svc/authN/FlwMgr.ts` → `processAuthNzn()`
- Good: `auth/login-flow.ts` → `startLogin()`

More before/after: [examples.md](references/examples.md).
