---
name: self-improve
description: One-time repo setup that makes coding agents stop redoing work. Writes standing rules into AGENTS.md, harvests repeatable flows from agent memory and repo evidence, builds permanent TypeScript + Bun scripts and one-flow-per-file Markdown runbooks after user approval (in the repo's agent docs site when it has one, else under runbooks/), and runs a bounded code-quality pass (purposeful JSDoc, deduplication, DRY/SOLID/KISS/YAGNI, transactional writes). Use when the user invokes $self-improve, says "self-improve", asks to set up runbooks, wants agents to stop writing disposable scripts again and again, or wants repeatable workflows captured as scripts and docs.
---

# Self-Improve

Turn repeated agent work into durable repo assets, and install rules so future agents keep doing it. Usually run once per repo. A re-run refreshes the setup in place; it never duplicates it.

Outcome:

- `AGENTS.md` contains the self-improve contract block.
- One Markdown runbook per repeatable flow, plus an index, in the runbooks location (see "Runbooks location").
- Permanent scripts live in the right `scripts/` folders, TypeScript + Bun by default.
- A runbook checker validates the runbooks and the index.
- `.scratch/` is gitignored for true one-off experiments.
- A bounded set of code-quality fixes is applied, and the rest is reported.

## Rules

- **Current state wins.** Memory and old notes can be stale. Verify every harvested flow against the code, config, and tooling as they are now before you encode it.
- **Evidence before assets.** Build a script or runbook only for work with evidence of repetition or clear future need. Do not invent speculative flows to fill the folder.
- **Approval gate.** Present the candidate list and planned quality fixes, then wait for the user's approval before building. Without an approval mechanism, present it in chat and stop until the user replies.
- **Reuse before create.** Extend an existing script, package.json script, Makefile target, or doc before adding a new one. Never create a second source of truth for the same flow.
- **Safe verification.** Verify scripts with `--help`, `--dry-run`, or local-only runs. Do not run mutating scripts against shared, staging, or production systems.
- **No secrets.** Scripts and runbooks name env vars and secret locations. They never contain values.
- **Preserve user work.** Do not overwrite unrelated content in `AGENTS.md`, configs, or docs. Do not commit unless the user asks.
- **Missing prerequisites.** If Bun or another required tool is missing, report it. Do not install tools without approval.

## Runbooks location

Decide this in step 1. It sets every runbook path in this skill.

- **Agent docs site.** Use this when the repo has a docs site for coding agents. Signs: root `AGENTS.md` names a docs app as the agent reference (for example `apps/internal-agent-docs` or `internal-docs/agent`), or rules say docs live only in docs apps. Then runbooks are pages of that site, in its runbooks section (for example `<site>/docs/15-runbooks/`), with an `index.md`. Never create a root `runbooks/` folder in this case. If the site has no runbooks section yet, add one as the next numbered section.
- **Root folder.** Use this when the repo has no agent docs site. Runbooks go in root `runbooks/`, with a `README.md` index.

If a root `runbooks/` folder and an agent docs site both exist, plan to move the runbooks into the site. Put the move in the approval message (step 5). After the move, repoint every reference to the old paths and delete the old folder.

In this skill, `<runbooks dir>` means the chosen folder and `<runbooks index>` means its `index.md` or `README.md`. [references/runbooks.md](references/runbooks.md) has the file rules for each location.

## Workflow

### 1. Inspect the repo

- Read `AGENTS.md`, nested agent files, `README.md`, contributing docs, and any other agent instruction files.
- Detect the shape: single package or monorepo (workspaces, `apps/`, `packages/`), package manager, runtime, test/lint/typecheck commands, and CI.
- Inventory existing automation: `scripts/` and similar folders (`tools/`, `bin/`), package.json scripts, Makefile/justfile targets, docker-compose, and CI steps.
- Check for an agent docs site and choose the runbooks location (above).
- Check for an existing self-improve block, existing runbooks (in either location), an existing runbook checker, and `.scratch/`. If they exist, this is a re-run: refresh in place, and also audit runbooks that are stale or have broken script references.

### 2. Install the contract

- Insert or refresh the block from [assets/agents-md-block.md](assets/agents-md-block.md) in the root `AGENTS.md`, between its `self-improve:start` / `self-improve:end` markers. Fill in `<RUNBOOKS_INDEX>`, `<RUNBOOKS_DIR>`, and `<RUNBOOKS_CHECK>` for the chosen location. Adapt the script locations and commands to this repo. Keep the rules.
- If `AGENTS.md` already has rules for the agent docs site that cover runbooks, keep one source of truth: the block's runbook lines must match them, not repeat them in other words.
- If `AGENTS.md` is missing, create it. If the repo uses another agent instructions file as primary, put the block in `AGENTS.md` and add a one-line pointer in the other file. Do not copy the block twice.
- Add `.scratch/` to `.gitignore`.
- Create the runbooks index if it is missing:
  - Root folder: `runbooks/README.md` from [assets/runbooks-readme.md](assets/runbooks-readme.md).
  - Agent docs site: `<runbooks dir>/index.md` from [assets/runbooks-index.md](assets/runbooks-index.md). If the site rejects unknown frontmatter keys, declare `type` and `last-verified` for runbook pages the way the site does it (for Blume: a `runbook` entry under `content.types` in its config).
- If the repo already has a runbook checker, use it and fix it if it is wrong. Otherwise copy [assets/check-runbooks.ts](assets/check-runbooks.ts) to root `scripts/check-runbooks.ts`. For an agent docs site, set its `DEFAULT_DIR` to `<runbooks dir>`. Add a `runbooks:check` package.json script if the repo uses package.json scripts.

### 3. Harvest candidates

Read [references/harvest.md](references/harvest.md). Collect repeatable flows from agent memory, session history, notes, and repo evidence. Classify each one as **script**, **runbook**, **runbook + script**, or **skip**.

### 4. Plan the quality pass

Read [references/code-quality.md](references/code-quality.md). Find the highest-value, lowest-risk hotspots that fit a bounded pass.

### 5. Get approval

Present one message with two tables, then wait.

Candidates:

| # | Name | Type | Location | Evidence | Why it pays off |
| --- | --- | --- | --- | --- | --- |

Planned quality fixes:

| # | Target | Problem | Fix | Risk |
| --- | --- | --- | --- | --- |

Also ask one question: "What do you ask agents to do again and again that is not on this list?" Add what the user names.

### 6. Build

- Scripts: follow [references/scripts.md](references/scripts.md). Start from [assets/script-template.ts](assets/script-template.ts).
- Runbooks: follow [references/runbooks.md](references/runbooks.md). Add each runbook to `<runbooks index>`.
- Quality fixes: apply them in small batches. Run typecheck, lint, and tests after each batch, using the repo's commands.

### 7. Verify

- Run the runbook checker until it passes. For an agent docs site, also run the site's link check.
- Run every new script with `--help`, and with `--dry-run` where it supports it.
- Run the repo's typecheck, lint, and test commands. Report failures you did not cause as pre-existing; do not hide them.
- Confirm the `AGENTS.md` block appears once and that its paths and commands exist.

### 8. Report

Include:

- Files created or changed.
- Each script, with its run command.
- Each runbook, with a one-line purpose.
- Quality fixes applied.
- Remaining quality findings, ranked.
- Candidates you skipped, and why.
- Follow-ups that need the user, such as adding the checker to CI or installing a missing tool.
