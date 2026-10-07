# External Research For Reviews

Use primary, current sources when the review depends on facts that training memory may get wrong.

## When Research Is Mandatory

Run research if the scoped code involves any of:

- Library / framework / SDK / API / CLI / cloud service usage or configuration
- Version-sensitive defaults, flags, lifecycle, or migration behavior
- Auth, crypto, session, CSRF, CORS, SSRF, XSS, SQL/command injection, secrets handling
- Payments, PII, privacy, licensing, or compliance-adjacent behavior
- Accessibility requirements tied to platform widgets or ARIA patterns
- Networking, caching, consistency, or delivery semantics (queues, kafka, HTTP caching, etc.)
- “Best practice” claims where a vendor guide or standard is the authority

Skip research only when the question is purely local (naming consistency with siblings, dead code in-repo, obvious logic bugs with no external contract).

## Source Preference

1. Configured documentation tools for libraries/frameworks/SDKs/APIs/CLIs/cloud services when available — resolve the library first, then query with the full review question.
2. Official docs, API references, release notes, changelogs, RFCs, WHATWG/W3C specs, vendor security guides.
3. Configured web/research tools for broader practice questions when docs tools do not apply.
4. Reputable secondary sources only to locate primaries or confirm consensus — do not cite them as sole authority for critical findings.

Do not treat search snippets, random forum answers, or unaudited memory as sufficient for blocker/high findings about external behavior.

## How To Research Efficiently

1. Extract the exact APIs, options, versions (from package manifests), and behaviors under doubt.
2. Ask focused questions per concept (e.g. cache invalidation separately from SSR hydration).
3. Read the relevant passages; capture version and date when they affect the ruling.
4. Map the source claim back to the concrete code location.
5. If sources conflict, prefer the official docs for the installed major version and note the conflict.

## Confidence Rules

| Situation | Effect on findings |
| --- | --- |
| Primary source confirms the issue | Full severity as warranted |
| Primary source contradicts the suspicion | Drop or downgrade; note what was checked |
| Research blocked (no network/tool/auth) | Keep as risk/question; label confidence `low` and state the blocker |
| Only secondary sources available | Cap at `medium` unless the risk is obvious independently of the source |

## Reporting

Under Preparation → Research, list:

- Topics researched
- Sources (links or doc IDs) and versions
- Topics skipped as local-only
- Blocked research (if any)
