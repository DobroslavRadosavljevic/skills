---
name: setup-codebase-docs
description: One-time setup of two private Blume docs apps for any codebase, internal-human-docs (owner handbook in prose) and internal-agent-docs (exact reference and runbooks for coding agents), with every page hand-written from the code. Also moves existing docs, runbooks, and doc-like notes into them, deletes the old folders, rewires references, and adds an AGENTS.md rule that agents update both sites as the code grows. Use when the user invokes $setup-codebase-docs or asks to set up, consolidate, or move a codebase's docs into human and agent docs sites. Not for editing a single doc page.
---

# Setup Codebase Docs

Build two private docs sites from the code. Move every existing doc into them. Bind future agents to keep them current.

| App | Reader | Content |
| --- | --- | --- |
| `internal-human-docs` | the owner or founder | How the product works: flows, numbers, money, risks, and decisions, in prose with diagrams |
| `internal-agent-docs` | coding agents | Exact files, symbols, contracts, invariants, commands, change recipes, runbooks, and reference records |

At the end:

- Both apps build with Blume 2.x and pass `blume validate --strict`.
- Both apps are private behind a password when deployed.
- Old docs folders, runbook folders, and doc-like root notes are gone.
- References to old docs paths in the repo now point to the new pages.
- Root `AGENTS.md` sends agents to the agent docs and requires them to update both sites in each change.

## Hard rules

- **Hand-write every page from the code.** Read the code first, then write the page. Do not fill a template with generated text. Do not paste the old docs back in as new pages. The config and page skeleton files in `assets/` are structure only, never content.
- **The code wins.** Check each claim against the code: paths, names, numbers, statuses, and limits. Old docs, plans, and memory can be wrong. When you find a conflict, write what the code does now and record the conflict in the report.
- **Go deep.** Cover every flow, integration, data store, job, calculation, limit, setting, and failure path the code has. A short page that leaves things out is a failure. See [references/codebase-mapping.md](references/codebase-mapping.md).
- **Do not lose knowledge.** Map every old doc file to a new home before you delete it. Back up old files before bulk edits.
- **No secrets.** Name env vars and secret stores only. Never write values, tokens, customer data, or session data.
- **Ask first** before you commit, push, deploy, create hosting projects, add production dependencies, or delete docs that have no new home. Blume is a dev dependency of the docs apps only.
- **Keep other work.** Do not overwrite unrelated changes in shared files such as `AGENTS.md`, `package.json`, or lockfiles.
- **Use parallel helpers only when allowed.** Use subagents or other parallel helpers only if the user or the repo rules allow them. Otherwise do the work in one session.
- **Write clearly.** Use short sentences, active voice, and one word for one idea. The repo's own writing rules also apply.

## Workflow

Keep a progress file in a scratch location: sections, pages, status, and open questions. The work is long, and the file lets you resume after a break.

### 1. Inspect the repo

- Read `AGENTS.md` and any nested `AGENTS.md`, `CLAUDE.md`, and other agent rule files. Also read `README.md`, contributing docs, and CI config.
- Find the shape of the repo: Turborepo or another workspace monorepo, a single package, or a non-JavaScript repo. Also find the package manager, the runtime, the dev ports, and the quality commands.
- Find every doc and doc-like file. Use [references/migration.md](references/migration.md#inventory).
- Check Node `>= 22.19` and the newest Blume 2.x version. If a tool is missing, report it. Do not install system tools without approval.

### 2. Choose the location

Read [references/placement.md](references/placement.md). For Turborepo, use `apps/internal-human-docs` and `apps/internal-agent-docs`. For other repos, the reference gives the folder that keeps the docs apps away from the product code.

### 3. Scaffold both apps

Read [references/blume-setup.md](references/blume-setup.md). Add the package files, the Blume configs, the password middleware, `robots.txt`, `.gitignore`, ports, and start entries. Add one start page per app. Check that both apps build before you write content.

### 4. Map the codebase

Read [references/codebase-mapping.md](references/codebase-mapping.md). Read the code area by area. Write down the facts, flows, numbers, and file paths you will need. This map drives the page list.

### 5. Plan the sections

Read [references/information-architecture.md](references/information-architecture.md). Plan the sections and pages of both sites from the map. Do not plan from a fixed list. Each product area gets a page in both sites. Runbooks get their own section in the agent site.

### 6. Write the pages

Read [references/writing.md](references/writing.md). Write each page by hand. Write the agent page and the human page of an area together, from the same reading of the code. Validate links after each section.

### 7. Move the old docs

Follow [references/migration.md](references/migration.md):

- Rewrite current docs into the new pages.
- Carry dated records (research, audits, history) into the agent site's reference section, with a note on where each came from.
- Move runbooks into the agent site, with their own checker.
- Rewrite references across the repo with `scripts/doc-paths.ts`.
- Update tools that read or write old docs paths.
- Delete the old folders only after every old file maps to a page.

### 8. Wire AGENTS.md

- Add the block from [assets/agents-md-block.md](assets/agents-md-block.md) to root `AGENTS.md` once, between its markers. Fill in this repo's paths, ports, and commands. If the file has no such block, put it near the top, after the repo summary.
- Remove old rules that the block replaces, such as "docs live in `docs/`" or "runbooks live in `runbooks/`". Point old links in the docs index or nested agent files to the new pages.
- If `AGENTS.md` is missing, create it with the block. If another agent file is the main one, add the block to `AGENTS.md` and add a one-line pointer in the other file.
- If the repo keeps a list of official ports, add the two docs ports.

### 9. Verify

Read [references/blume-setup.md](references/blume-setup.md#verify) and run every check:

- `blume validate --strict` and `blume build` for both apps.
- `bun <skill-dir>/scripts/doc-paths.ts check` for references to old or missing paths.
- The runbook checker.
- The repo's full quality commands: format, lint, typecheck, and tests. Adding Blume can change shared dependency resolution, so run them all. Fix each failure your change caused.

### 10. Report

Tell the user:

- The two app paths and local URLs, plus page and word counts for each site.
- Which old files were rewritten, carried over as records, or deleted. Also list the old files that still need a decision.
- Conflicts found between old docs and the code.
- The checks you ran and their results.
- Hosting steps that need the user: the project, the root directory, and the `DOCS_PASSWORD` setting. Do not create hosting projects until the user says yes.
- That nothing is committed, unless the user asked for a commit.
