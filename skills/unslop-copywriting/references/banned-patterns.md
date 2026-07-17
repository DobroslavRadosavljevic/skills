# Banned Patterns

Enforceable AI-copy fingerprints for public website/app UI. One hit is a warning; a cluster is a confession. **Leaked internals are always critical.**

Pattern IDs are stable for audit reports. Match case-insensitively unless noted.

## Leaked internals — I* (critical)

| ID | Ban | Fingerprints |
| --- | --- | --- |
| I01 | Instruction→UI leakage | Headings/body that sound like requirements: “criteria”, “fallback if…”, “handle permissions by…”, “modern X on top of the current data model”, implementation notes as paragraphs |
| I02 | Prompt / agent residue | `As an AI`, `Sure! Here's`, `In this session/chat we…`, system-prompt fragments, model names in UI |
| I03 | Dev placeholders | `TODO`, `FIXME`, `HACK`, `lorem ipsum`, `placeholder`, `add copy here`, `Feature One`, `Your Company`, `asdf`, `test string` |
| I04 | API / schema / code names | `/api/…`, GraphQL types, JSON keys, DB tables/columns, Zod/Prisma field names as labels, enum tokens as user text |
| I05 | Ops / admin leakage | Feature flags, env names (`PRODUCTION_*`), internal ticket IDs, “for admins only” without gating |
| I06 | Exception / runtime dump | `TypeError`, stack traces, `undefined is not`, `ECONNREFUSED`, `null reference`, raw `error.message` / `String(err)` in JSX/toasts |
| I07 | HTTP codes as headlines | Bare `403 Forbidden`, `500`, `Error 0x…` as the primary user message |
| I08 | Framework jargon | `hydration error`, `SSR failed`, component/CSS class names as user copy |

**Rule:** Instructions tell the agent how to build. They must never become what the user reads. Map failures through a dedicated user-message layer; log tech details server-side.

## Marketing voice — M*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| M01 | Empty power verbs | `unlock`, `empower`, `elevate`, `supercharge`, `harness`, `unleash`, `revolutionize`, `transform` without a concrete before→after |
| M02 | Empty adverbs | `effortlessly`, `seamlessly`, `blazingly` |
| M03 | Empty productivity | `streamline`, `optimize your workflow`, `take X to the next level` |
| M04 | Empty adjectives | `powerful`, `robust`, `cutting-edge`, `next-generation`, `innovative`, `game-changing`, `world-class`, `state-of-the-art`, `best-in-class`, `enterprise-grade` |
| M05 | Tech-as-benefit filler | `AI-powered`, `AI-native` as the value claim (name the job done instead) |
| M06 | Hero shells | `Welcome to our platform`, `The future of X`, `The all-in-one X`, `Built for the modern web/teams`, `Built for developers` with no specificity |
| M07 | Unproven proof | `Trusted by leading companies`, `Used by thousands`, `#1 X for Y` without names/numbers |
| M08 | Thesaurus corporate | `leverage`, `utilize`, `facilitate`, `delve`, `tapestry`, `landscape` (figurative), `holistic`, `pivotal`, `testament` |

## Rhetoric / structure — R*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| R01 | Performed contrast | `It's not X — it's Y`, `Not just X, but Y`, `More than a X, it's a…`, `This isn't your typical…` |
| R02 | Throat-clearing | `In today's world/digital age/fast-paced landscape`, `Let's dive in`, `Without further ado`, `Whether you're a startup or enterprise…` |
| R03 | Signpost padding | `Furthermore`, `Moreover`, `Additionally`, `It's worth noting`, `At the end of the day` |
| R04 | Fake intimacy | `Here's the thing`, `The truth is`, `I'll be honest` |
| R05 | Em-dash abuse | Multiple em dashes in a short UI/marketing string; dash used to append polish clauses |
| R06 | Rule-of-three stacks | `Fast. Secure. Reliable.` / `Simple. Powerful. Intuitive.` as section substance |
| R07 | Always-on copy | Help text/tooltips that exist only because the model always emits text |

## Controls and CTAs — C*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| C01 | Ghost CTAs | Lone `Get started`, `Learn more`, `Sign up free`, `Join us`, `Click here`, `Here` |
| C02 | Machine buttons | Lone `Submit`, `OK`, `Done`, `Got it` when an outcome verb is knowable |
| C03 | Yes/No confirms | `Yes`/`No` instead of naming the action (`Delete project` / `Keep project`) |
| C04 | Button chrome | Emoji or `!` in button labels; Title Case On Every Word |
| C05 | Vague continuum | Lone `Next` / `Continue` when the next outcome can be named |
| C06 | Action mismatch | Label that does not match the user’s mental model (e.g. `Save` when they are publishing) |

## Errors, empty states, onboarding — E*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| E01 | Vague errors | `Something went wrong`, `An error occurred`, `Error`, `Failed`, `Request failed` alone |
| E02 | Invalid-speak | `Invalid input`, `Invalid`, `illegal`, `forbidden`, `prohibited` as primary wording |
| E03 | Blame / shout | `you must`, `you failed`, `you forgot`, ALL CAPS, excess `!!!` |
| E04 | Apology padding | `Sorry` on validation; long apology essays; fake `We've been notified` / ticket language when untrue |
| E05 | Database empty voice | `No data available`, `No items found`, `Empty`, `No current items have been selected in your workspace` |
| E06 | Dead-end empty | Empty/zero-results with no recovery path or single primary CTA |
| E07 | Blank AI onboarding | `Ask me anything` / empty prompt as the only first-run guidance |
| E08 | Humor under stress | Jokes in error, payment, or access-failure copy |

## Tone and consistency — V*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| V01 | Committee robot | Over-formal, hedged, no point of view on routine UI |
| V02 | Forced cheer | `Awesome!`, `You're all set!!`, confetti tone on routine or high-stakes actions |
| V03 | Synonym churn | Same concept labeled `Delete` / `Remove` / `Trash` or `Sign in` / `Log in` without a glossary decision |
| V04 | Sensory-only directions | `click the green button`, `menu on the left`, `square box` as the only cue |
| V05 | Please/thank-you spam | Gratuitous `please` / `please note` / `thank you` on every microcopy string |
| V06 | Marketing↔product mismatch | Site sells revolution; app says “module initialized” |

## Stack note

i18n keys, design-system components, and CMS fields are fine. **Unmodified AI default strings are not.** Prefer full-sentence locale units; never concatenate fragments that force English word order.
