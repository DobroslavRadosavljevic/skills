<!-- self-improve:start -->

## Repeatable Work

Do not redo work that a script or runbook already covers. Do not rebuild the same throwaway script twice.

### Before a task

- Read `<RUNBOOKS_INDEX>`. If a runbook matches the task, follow it.
- Look in `scripts/` (and `<workspace>/scripts/` for app or package work). If a script does the job, run it.

### Scripts

- Write a permanent script when a task will likely repeat: setup, data, codegen, release, diagnostics, or bulk edits.
- Use TypeScript run by Bun (`bun scripts/<name>.ts`). Use another language only when the ecosystem requires it, or when Bun cannot run there (for example, a bootstrap that installs Bun).
- Location:
  - Repo-wide scripts go in root `scripts/`.
  - Scripts for one app or package go in `<workspace>/scripts/`.
- Name scripts in kebab-case, verb first: `seed-db.ts`, `sync-env.ts`.
- Every script has:
  - A JSDoc header that gives the purpose, usage, and examples.
  - `--help`.
  - `--dry-run` if it changes state.
  - Safe re-runs.
  - Exit code `0` on success, `1` on failure, and `2` on bad usage.
- Validate env vars at start. Never put secret values in a script.
- Import shared code from the repo. Do not copy logic into scripts.
- Make writes all-or-nothing. Use transactions, write to a temp file then rename, or check before you change.

### Scratch work

- Put one-off experiments in `.scratch/` (gitignored).
- If you need a scratch script a second time, move it to `scripts/` and bring it up to the script rules.

### Runbooks

- Write a runbook when a multi-step flow will come back and needs judgment: release, deploy, migration, incident, onboarding, or debugging a known failure.
- One flow per file: `<RUNBOOKS_DIR>/<slug>.md`, using the frontmatter and sections in `<RUNBOOKS_INDEX>`. Add the runbook to the index.
- Write script paths relative to the repo root.
- If a runbook or script is wrong or out of date, fix it in the same change.
- After you follow a runbook to the end and it works, set its `last-verified` date to today.
- After you change runbooks, run `<RUNBOOKS_CHECK>`.

### Code quality

Leave code better than you found it:

- Add JSDoc where it explains why: invariants, side effects, edge cases, and public contracts. Do not use JSDoc to repeat types or describe obvious code.
- Keep one source of truth for each piece of knowledge. Remove duplication that you find, but do not merge code that only looks the same.
- Apply SOLID, KISS, and YAGNI. Keep functions small and names clear. Delete dead code.
- Keep strict types. Do not add `any`, unsafe casts, or suppressed errors without a written reason.
- Fail fast with clear errors. Make data writes atomic and safe to re-run.
- Change behavior only with tests that prove the new behavior.

<!-- self-improve:end -->
