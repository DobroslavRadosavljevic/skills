# AGENTS.md Quality Bar

Use this checklist when creating or reviewing. Mark N/A only when truly irrelevant.

## Hard requirements

- [ ] Filename is `AGENTS.md` (or intentional nested `AGENTS.md` / documented override name).
- [ ] Plain Markdown; no required schema. Headings match content, not ceremony.
- [ ] No secrets, tokens, private keys, or live credentials.
- [ ] Commands are copy-pasteable and match real scripts/CI/Makefiles.
- [ ] Linked paths exist (or the review explicitly flags dead links).
- [ ] Root file roughly ≤150 lines (or nested split justified); no essay dumps.
- [ ] Each retained line passes the litmus test: removing it would cause a real agent mistake.

## Coverage (include when applicable)

| Area | Passes when |
| --- | --- |
| Stack | Names frameworks/tools with versions or release lines when ambiguity would change code |
| Commands | Install, dev, test, lint/typecheck, build appear early with useful flags/filters |
| Layout | Non-obvious paths called out; obvious `src/` trees not narrated |
| Conventions | Only project-specific rules; style enforced by tooling is linked or omitted |
| Testing | How to run focused tests; expectation to fix green / add tests when changing code |
| Git / PR | Only non-default norms (title format, required checks, “ask before push”) |
| Boundaries | Always / Ask first / Never for destructive or policy-sensitive actions |
| Security | Gotchas unique to this repo (auth boundaries, PII, sandbox limits) if any |
| Index | Table or bullets pointing to deeper docs instead of inlining them |

## Signal density

Passes:

- Imperative bullets (“Run X”, “Never Y”).
- Short canonical snippet or path showing preferred pattern.
- Orientation table for deep docs.

Fails:

- Generic “be helpful / write clean code”.
- Full style guide paste.
- Auto-generated tour of every folder the model can already see.
- Duplicating README marketing or human onboarding fluff.

## Living document

Passes when the file (or linked docs) capture:

- Silent invariants that fail without loud errors.
- Repeated agent mistakes the team already hit.
- Explicit “do not touch” areas (generated code, vendored trees, release automation).

## Monorepo extras

- [ ] Root file states workspace tooling and how to target one package.
- [ ] Nested files only add deltas / overrides for that package.
- [ ] No contradictory commands without stating which wins for that subtree.

See [nesting.md](nesting.md).
