# Surfaces

Name the surface first. When rules collide, this file wins. Docs do not sell. Errors do not joke.

## App UI

Job: finish the task. NN/g: clear, then short, then personality. Personality never blocks the task.

**Buttons and menus** (NN/g, Material, Primer, Mailchimp)

The verb is the next state. While a video plays, the button is `Pause`, not `Playing`.

One to four words. Imperative. `Save draft` beats `OK` and `Submit`.

The same command keeps the same label. Add a noun if `Delete` is ambiguous: `Delete folder`.

Sentence case, unless this product already picked another rule and stuck to it.

No coined brand verbs on commands. No period on the button. No “Click here.”

**Errors** (NN/g)

What happened, in words a person uses. Not `ERR_422` as the only line.

How to fix it, next to the field.

Do not blame: `invalid`, `illegal`, “you entered incorrectly.” The system dropped the ball.

Keep what they typed. Offer a fix, not a sermon.

No jokes. `Oops!` is not a message.

Support codes can exist. Hide them or put them last.

**Empty states** (NN/g)

Say the work finished: `No invoices in this date range.` Do not look like a spinner that died.

Say what belongs here and how to add it. One action: `Create invoice`.

**Forms**

Label the field, not the widget. Ask only what you will use.

Helper text answers a real doubt (`16 characters, at least one number`). Not a slogan.

A delete confirm names the object: `Delete “Q3 forecast”?` The button matches: `Delete forecast`.

**First-run**

One next step. Do not paste the marketing site into a modal.

Success names the outcome: `Invite sent to alex@acme.com`. Not “You’re all set!!”

**Tone** (Material)

The voice stays the same. The tone gets quieter on money, deletion, errors, and waiting. A joke that repeats on every error is cruelty.

## Websites

One job per URL. Beat order lives in [techniques.md](techniques.md).

Five seconds: H1 + subhead = what, who, why (CXL).

One main button. Action plus result (CXL / Laja).

A number or a named limit in the first screen if you have one (Hopkins, Ogilvy).

Links name the destination. Not `click here`. Not a bare `Learn more`.

Compare pages: criteria, skip-conditions, a different outline per entity.

## Docs

Four kinds. Keep them apart (Divio).

| Kind | For | Shape | How to write |
| --- | --- | --- | --- |
| Tutorial | learning | a lesson | One success path. Hold their hand. |
| How-to | a goal | numbered steps | They already know the product. No origin story. |
| Reference | looking up | tables, signatures | Dry. Complete. Same shape every time. No pep. |
| Explanation | why | a discussion | Tradeoffs. No procedure. No API dump. |

Google developer docs, as defaults:

- You, active. Condition before the step: `If the token expired, refresh it.`
- Task heading: `Create an instance`. Concept heading: `Instance quotas`.
- Sentence case. One H1. No links in headings.
- Numbers for sequences. Bullets for bags of items.
- First paragraph says what this page is for (Write the Docs).
- Do not say `easy`, `simple`, or `just` (Primer).
- FAQs rot. Use them last (Write the Docs).
- ASD-STE100: 20-word steps, active voice, one word per idea. Define a hard term once.

README: the problem it solves, one working snippet, install for the default case, how to get help. Not the full reference.

## Email, ads, notifications

One offer or one status. The subject is specific. Urgency only if true.

Transactional: what happened, what to do. Marketing: one button.

Do not retell the homepage. Stop on the ask or the fact.

## Legal, billing, money, health

Exact. Calm. No CMS notes. No jokes. No fake hurry at checkout.

## Where these rules came from

You do not need to open the books to write. This is the trail:

- Schwartz, *Breakthrough Advertising* — how much they already know
- Hopkins, *Scientific Advertising*; Ogilvy, *Confessions* / *Ogilvy on Advertising* — specifics, one promise
- Cialdini, *Influence* / *Pre-Suasion* — proof; no fake scarcity
- Masterson — 4 U’s
- Bencivenga — promise + proof + offer − friction
- Nielsen Norman Group — UI labels, errors, empty states
- Material writing; Google developer documentation style guide
- Mailchimp content style guide — voice vs tone, buttons as actions
- GitHub Primer — sentence case; no “easy/just”; no jokes in errors
- Divio — four doc kinds
- Write the Docs — README; FAQ trap
- CXL / Peep Laja — five-second test; button copy
- ASD-STE100 Simplified Technical English — short, active, one word per idea (docs and UI)
- Kobak et al., *Sci. Adv.* 2025; Wikipedia *Signs of AI writing* — [slop-words.md](slop-words.md)
