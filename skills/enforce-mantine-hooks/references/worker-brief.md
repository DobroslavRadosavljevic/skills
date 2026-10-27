# Worker Brief Template

Copy this into each subagent prompt and fill the brackets.

```text
Task: replace custom code with @mantine/hooks where behavior stays the same or gets better.

First load the mantine-hooks skill. If it is not available, read https://mantine.dev/hooks/ for each hook you use.

Context:
- @mantine/hooks version: [version]. React: [version]. SSR/hydration: [yes/no].
- Import only from @mantine/hooks. Do not add packages.

Your files (edit only these): [list]
Candidates: [file → symbol → proposed Mantine hook → call sites]

For each candidate:
1. Read the custom code and every call site.
2. Read the Mantine hook's current API and source for the installed version.
3. Check every point of this rubric: [paste parity.md points]
4. Verdict: replace, keep, or needs-approval.
5. On replace: update call sites to use the Mantine hook directly, remove the custom code if no file outside your list imports it, and keep the old options (delay, events, keys, initial values) explicit.
6. On needs-approval or keep: change nothing.

Do not edit shared barrels or files outside your list. Report them to the orchestrator.
Run typecheck for touched files if the repo allows a scoped run.

Return one row per candidate:
file | symbol | Mantine hook | verdict | same/better/diff | reason | files changed | leftover imports of removed code
```
