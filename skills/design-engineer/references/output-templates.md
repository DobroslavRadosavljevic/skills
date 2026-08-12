# Output Templates

Use these shapes so diagnosis, options, and decisions stay auditable.

## Full improve report

```markdown
## Scope
- Surface: …
- User job: …
- Mode: Improve | Critique | Propose
- Constraints: tokens / brand / a11y / time …

## Diagnosis

| # | Finding | Severity | Code | Evidence |
| --- | --- | --- | --- | --- |
| 1 | … | blocker\|friction\|polish | HIER|… | … |

## Options

### A — [name]
- Model: …
- Addresses: #…
- Why it might win: …
- Risks: …
- Effort: S|M|L
- Pattern refs: …

### B — [name]
…

### C — [name]
…

## Decision
- Pick: **B**
- Why: …
- Reject: A because …; C because …
- Hybrid notes: (if any)

## Implementation plan
1. …
2. …

## Verify
- Finish bar: pass / deferred items …
- Checks run: …
```

## Critique-only report

Same as above through **Decision** (recommendation required). Stop before
implementation. Label clearly: `Mode: Critique — no code changes`.

## Compact inline decision (small scopes)

When the change is small but still needs the loop:

```markdown
**Job:** …
**Wrong:** … (evidence)
**Options:** A … | B … | C …
**Pick B** because … 
**Ship:** …
```

Still require ≥2 real options unless the only alternative is “do nothing,” and
say so.

## Finding severity legend

- `blocker` — stops the job / serious a11y / data loss risk
- `friction` — slows or confuses
- `polish` — craft quality
- `out-of-scope` — noted only
