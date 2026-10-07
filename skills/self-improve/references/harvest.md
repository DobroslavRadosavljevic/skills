# Harvest Repeatable Flows

Goal: a short, evidence-backed list of flows worth turning into scripts or runbooks for the repo as it is now.

## Sources

Check every source you can reach. Skip a source if you cannot reach it, and say so in the report.

1. **Agent memory.** Use the persistent memory, notes, or saved feedback that the current harness keeps for this project or user. Look for:
   - Commands that were run more than once.
   - Fixes that were applied more than once.
   - Things the user had to explain again.
   - Lessons like "always do X before Y".
2. **Session history.** Use past session transcripts or logs if the harness exposes them. Look for scripts written again and again, long command chains, and the same debugging steps.
3. **Repo leftovers:**
   - One-off files: `.scratch/`, `tmp/`, `temp/`, root `*.mjs`/`*.js`/`*.sh`, and `scripts/old-*`.
   - Untracked or ignored helper files.
   - Commented-out command blocks.
4. **Git history.** Scan `git log --oneline` for commits that recur: regenerate, reseed, bump, resync, fix lockfile, update snapshots, rotate. Also look for commits that add and then remove helper scripts.
5. **Docs.** Read the setup, release, deploy, and troubleshooting sections in `README.md`, `CONTRIBUTING.md`, `docs/`, and wiki exports. Manual steps there are runbook candidates.
6. **Automation config:**
   - Long inline package.json scripts.
   - Makefile or justfile targets.
   - docker-compose services.
   - CI workflow steps that people also run by hand.
7. **Code comments.** Search for `run this manually`, `remember to`, `don't forget`, `TODO: script`, and `HACK`.
8. **The user.** Ask once, in the approval message (see SKILL.md step 5).

## Signals That a Flow Repeats

- It shows up two or more times in any source.
- It has steps that must run in order, where a wrong order breaks things.
- It needs knowledge about the environment: ports, env var names, service names, accounts, regions.
- It caused mistakes or rework before.
- A new contributor would have to find it out from scratch.

## Common Candidates

Use this list as a prompt for your search, not as a list of things to create. Include an item only when the repo shows evidence for it.

- Bootstrap or local setup, and environment doctor checks.
- Env var sync or validation.
- Database reset, migrate, seed, and fixture loading.
- Codegen: API clients, types, schemas, icons, i18n.
- Scaffolding a new app, package, route, module, or entity in the house style.
- Dependency upgrades and lockfile repair.
- Release, versioning, and changelog.
- Deploy and rollback.
- Fetching logs, traces, or metrics for debugging.
- Known failure fixes: port in use, stale cache, broken generated files.
- Data backfills and one-time migrations that repeat per environment.
- Secret rotation (runbook only; never automate the secret values).

## Classify

| Type | Use when |
| --- | --- |
| Script | The steps are deterministic: same input, same steps, and no judgment needed. |
| Runbook | The flow needs judgment, diagnosis, approvals, external dashboards, or coordination with people. |
| Runbook + script | A judgment flow whose mechanical steps are scripts. The runbook calls the scripts. |
| Skip | One-time only, already covered by an existing command (document it in AGENTS.md instead), or no evidence that it repeats. |

Risky operations (destructive, production, money, data loss) become runbooks with explicit confirmations and a rollback section. If they also become scripts, the scripts need `--dry-run` and an explicit confirmation flag such as `--yes`.

## Placement

- Follow the repo's existing script folder convention if it has one.
- **Single package:** root `scripts/`.
- **Monorepo, flow touches more than one workspace or the whole repo:** root `scripts/`.
- **Monorepo, flow belongs to one workspace:** `<workspace>/scripts/`, for example `apps/web/scripts/`.
- **Many scripts in one area (about 10 or more):** group them in subfolders by domain, such as `scripts/db/`.
- **Runbooks:** always root `runbooks/`, with one flow per file. Use a slug prefix for workspace-specific flows, for example `web-deploy.md`.
