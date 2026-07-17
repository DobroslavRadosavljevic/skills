# Craft Antidotes

Plain-language replacements after bans remove machine voice. Goal: a human knows what happened and what to do next — with no internal knowledge.

## Voice contract (required)

Write before rewriting strings:

1. **Audience** — who reads this, and in what state (calm browse vs. blocked error)
2. **Reading level** — default plain language; specialists still prefer clear words
3. **Glossary** — one term per concept across the product
4. **Voice** — plain, specific, direct; character only after clarity
5. **Tone by stakes** — calmer when money/access/data is at risk; warmer on low-stakes success
6. **Silence rules** — when UI should explain itself without help text
7. **Out of bounds** — paste the hard bans that matter here

GOV.UK benchmark: if people do not notice the copy, you are probably doing it right. Aim to be clear, not impressive.

## Universal rewrite rules

| Instead of… | Do this |
| --- | --- |
| Empty power verb | Concrete outcome, number, or named capability |
| Empty adverb | Name the friction removed or the integration |
| Ghost CTA | Verb + destination/outcome |
| Instruction/criteria text | Delete from UI; keep only in code comments/docs/agent notes |
| Raw exception | Mapped user message + logged detail |
| Always adding copy | Delete the string; fix the UI if it needed explaining |
| Same sentence on any product | Add a detail only this product can claim |

**Density rule:** one banned phrase is yellow; three in one hero/view is red — rewrite the block.

## Leaked internals → human copy

| Bad (machine / internal) | Good |
| --- | --- |
| “Modern ticket handling on top of the current data model” | “Track support tickets in one queue.” |
| “Fallback if permission check fails” (as UI text) | *(delete — implement the fallback; don’t narrate it)* |
| `TypeError: Cannot read properties of undefined` | “We couldn’t load this page. Refresh and try again.” |
| `POST /api/v2/prefs` as a settings label | “Email notifications” |
| `TODO: add onboarding copy` | “Create your first project.” |
| “No hace falta sudo.” / permission criteria printed on success | *(delete — only prompt for elevation when required)* |

**Boundary rule:** if a sentence tells the *builder* what to do, it is not user copy.

## Buttons and CTAs

| Bad | Good |
| --- | --- |
| Submit | Send message / Create account |
| OK / Done | Save changes / Publish |
| Yes / No | Delete project / Keep project |
| Learn more | View pricing / Read the docs |
| Get started | Create your first project / Connect Slack |
| Proceed to configuration | Set up billing |

Rules: sentence case; verb (+ noun); ≤ ~2–3 words when possible; no emoji/punctuation; one primary action per view; destructive actions name the object.

## Errors

Formula: **what happened → why (optional) → what to do next**.

| Bad | Good |
| --- | --- |
| Something went wrong | We couldn’t save your changes. Check your connection and try again. |
| Invalid input | Enter a phone number with country code, like +1 555 123 4567. |
| 403 Forbidden | You don’t have access to this project. Ask an admin to invite you. |
| We’re sorry for any inconvenience. Our team has been notified. | We couldn’t complete checkout. Your card was not charged. Try again or use another card. |

Rules: plain words; active voice; `we` for system faults; no `sorry` on validation; no blame; no humor; never render raw `error.message`.

## Empty states

Formula: **why empty → one primary next action** (optional short context).

| Bad | Good |
| --- | --- |
| No data available | No projects yet. Create your first project. |
| No results found. | No matches for “alpha”. Clear filters or try another name. |
| Ask me anything | Try: “Summarize last week’s orders” — or pick a starter below. |

Distinguish first-run emptiness from **failure-as-empty** (don’t say “no data” when the load failed — use an error).

## Forms and settings

| Bad | Good |
| --- | --- |
| alphanumeric, max 255 bytes | Project name — letters and numbers, up to 255 characters |
| Placeholder as only label | Visible label; placeholder is an example only |
| Configure notification parameters | Email notifications |

Start with less. Add help text only when research or known confusion requires it.

## Marketing / landing

| Bad | Good |
| --- | --- |
| Seamlessly unlock AI to transform your workflow | Catch flaky tests before merge — average review drops from 40m to 8m |
| Works with your existing tools | Works with Slack, Jira, and GitHub |
| Trusted by leading companies | Used by Notion, Figma, and 120 YC startups *(only if true)* |
| Fast. Secure. Reliable. | Encrypts data at rest; SOC 2 Type II; 99.9% uptime last quarter |

Replace vague adjectives with numbers, adverbs with comparisons, power verbs with actions — or cut the claim.

## Onboarding

Prefer recognition over recall: a worked example, a named first action, and one clear path. Do not leave a blank “think of a prompt” void as the product.

## When to delete

Delete the string when:

- It only restates the label next to it
- It narrates implementation or permissions policy
- It exists to sound friendly without changing the next step
- The UI can show the state without words

## Human test

After rewrite, answer:

1. Would a non-engineer know what to do next?
2. Does any sentence still sound like a prompt, ticket, or schema?
3. Could this sentence sit on an unrelated product unchanged?
4. Did we delete anything that should never have been copy?

Fail any → keep rewriting.
