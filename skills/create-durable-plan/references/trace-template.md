# TRACE.md Template

Evidence ledger. Not executable. If TRACE and the live repo disagree, the repo wins and the executing agent stops (`needs-amendment`).

```markdown
# Trace: <mission title>

- **Created:** <YYYY-MM-DD>
- **Repo:** <name>
- **Branch / dirty:** <branch>; dirty files named only if they affect the plan

## Preflight

- Package manager / workspace:
- Verify scripts found:
- Related plan packs:
- Ignore risk for `plans/`: none | <rule>

## Questions this pack answers

- <question> → <answer + fact IDs>

## Facts

| ID | Fact | Source (path or URL) | Taken as |
| --- | --- | --- | --- |
| F1 | | `<path>` or URL + version/date | current behavior / constraint / API |

## Inferences

| ID | Inference | From facts | Risk |
| --- | --- | --- | --- |
| I1 | | F1, F2 | |

## Unknowns

| ID | Unknown | Default used | Phase that absorbs |
| --- | --- | --- | --- |
| U1 | | | P0x |

## Files inspected

| Path | Why opened | Takeaway |
| --- | --- | --- |
| `<path>` | | |

Every `modify` / `delete` in the file map must appear here.

## External sources

| Title | URL | Version or retrieved | Takeaway used by the plan |
| --- | --- | --- | --- |
| | | | |

## Dead ends

- `<path or approach>` — rejected because <fact>

## Confidence by area

| Area | high/medium/low | Why | If not high |
| --- | --- | --- | --- |
| | | | discover phase / asked user / assumption A# |

## Gaps remaining

- <What was not inspected and why it is still safe to proceed, or which discover phase covers it>
```

On create this file must not be a restatement of the user prompt. If research was thin, say so and add discover phases; do not fake facts.
