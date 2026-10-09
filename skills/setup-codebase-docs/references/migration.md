# Migration of existing docs

Move every doc and doc-like file into the two sites. Then delete the old copies and repoint every reference. Lose nothing.

## Contents

- [Inventory](#inventory)
- [Classify](#classify)
- [Runbooks](#runbooks)
- [Rewrite references](#rewrite-references)
- [Tools that use old paths](#tools-that-use-old-paths)
- [Delete the old folders](#delete-the-old-folders)

## Inventory

List each candidate with `git ls-files` plus untracked, non-ignored files:

```bash
git ls-files -co --exclude-standard | grep -Ei '\.(md|mdx|markdown|rst|adoc|txt)$'
```

Look in particular at:

- `docs/`, `doc/`, `documentation/`, `wiki/`, `guides/`, `handbook/`
- `runbooks/`, `playbooks/`, `ops/`, `procedures/`
- `adr/`, `decisions/`, `rfcs/`, `architecture/`, `design/`
- `research/`, `notes/`, `audits/`, `reviews/`, `postmortems/`, `incidents/`
- Root notes: `ARCHITECTURE.md`, `NOTES.md`, `DESIGN.md`, `SECURITY.md` (as internal notes), `CONTRIBUTING.md` (internal parts), and other uppercase `*.md` files
- Package and app `README.md` files with more than setup steps
- Long comment blocks that act as docs, such as a design note at the top of a file

Put the list in your progress file with one row per file: path, what it covers, last commit date, and the planned new home.

## Classify

| Class | What it is | Action |
| --- | --- | --- |
| Current doc | describes how the system works now | Rewrite into the right agent and human pages, from the code. Do not copy. |
| Dated record | research, audit, review, competitor notes, decision log, design history | Carry it into the agent site's reference section. Keep the content, fix the frontmatter and links, and add a note at the top: "Reference record moved from `<old path>` on `<date>`. It shows the state of `<its date>`; the code may have changed since." Summarize the useful parts on a human page. |
| Runbook | step-by-step flow that repeats | Move it to the agent site's runbooks section (below). Check each step against the code. |
| Rules for agents | coding rules, style rules, architecture rules | Keep binding rules in `AGENTS.md` files. Move long detail into an agent page, and link it from `AGENTS.md`. |
| Outdated or wrong | describes removed code | Do not move it. List it in the report so the user can decide. |
| Must stay | files tools or platforms need at a fixed path | Keep it: root `README.md` (short setup and a pointer to the sites), `LICENSE`, `CHANGELOG.md`, `SECURITY.md` (as a public policy), `CODE_OF_CONDUCT.md`, issue and PR templates, `AGENTS.md`, `CLAUDE.md`, plan packs, published package READMEs. |

Keep files that are working state for another tool, such as active plan folders. Update their links to the new docs paths.

## Runbooks

Put runbooks in a numbered section of the agent site, for example `docs/15-runbooks/`:

- `index.md`: from [assets/runbooks-index.md](../assets/runbooks-index.md). Fill in one table row per runbook, sorted by title.
- One page per flow: `<slug>.md`, with a kebab-case slug.
- Frontmatter: `title`, `description`, `type: runbook`, and `last-verified: YYYY-MM-DD`. Keep the old verified date. Do not set today's date unless you ran the flow.
- Sections: When to use, Prerequisites, Steps, Verify, Rollback, Troubleshooting.
- Links to other runbooks and agent pages are relative. Repo files are inline code.
- Copy [assets/check-runbooks.ts](../assets/check-runbooks.ts) into the repo's scripts folder, set `RUNBOOKS_DIR`, and add a `runbooks:check` script. If the repo already has a runbook checker, change that checker to the new folder instead.
- Test the checker one time on a broken copy: a wrong type, a future date, and a missing index row. Then restore the files.

## Rewrite references

After the new pages exist, repoint each reference to an old path. Use `scripts/doc-paths.ts` in this skill folder.

1. Write a map file (JSON) from old paths to new paths, relative to the repo root. Add anchor rows when one old page split into several new pages:

   ```json
   {
     "files": {
       "docs/architecture/billing.md": "apps/internal-agent-docs/docs/08-money/02-usage-meter.md",
       "runbooks/database-migration.md": "apps/internal-agent-docs/docs/15-runbooks/database-migration.md"
     },
     "anchors": {
       "docs/architecture/billing.md#crons": "apps/internal-agent-docs/docs/08-money/03-polar.md"
     }
   }
   ```

   Point each old file to the agent page that now owns its topic. Agents follow these references.

2. Back up the files the script will change. Copy them, with their relative paths, into a backup folder outside the tracked tree (for example `.temp/backup/<slug>/`). Do not use git stash or checkout as a backup.
3. Dry run, then write:

   ```bash
   bun <skill-dir>/scripts/doc-paths.ts rewrite --map doc-map.json --old-root docs --old-root runbooks --skip apps/internal-agent-docs --skip apps/internal-human-docs
   bun <skill-dir>/scripts/doc-paths.ts rewrite --map doc-map.json --old-root docs --old-root runbooks --skip apps/internal-agent-docs --skip apps/internal-human-docs --write
   ```

   The script rewrites Markdown link targets as paths relative to each file. It rewrites plain mentions (code comments, inline code) as repo-root paths. It drops anchors that no longer apply, and it lists references it cannot map.
4. Fix the listed references by hand, or add map rows and run again.
5. Read the diff. Rewrites inside historical records, such as a plan's file table, are fine. Leave external URLs that contain `docs/` alone. The script skips URLs.

Then check:

```bash
bun <skill-dir>/scripts/doc-paths.ts check --old-root docs --old-root runbooks --site apps/internal-agent-docs/docs --site apps/internal-human-docs/docs
```

It fails on references to the old roots and on references to docs-site files that do not exist.

## Tools that use old paths

Search code and config for the old folder names: generators that write a docs page, checkers that read a docs folder, CI path filters, lint or format ignore lists, task-runner inputs, and editor settings. Change each one to the new path in the same change. For a generator, make it write valid Blume frontmatter.

## Delete the old folders

Delete an old folder only when all of these are true:

- Each file in it has a row in the progress file with a new home, or the user agreed to drop it.
- The folder has no local edits by someone else (`git status --short <folder>`).
- A backup copy exists.
- `doc-paths.ts check` passes.

Then delete it. Search one last time for the folder name in configs and scripts.
