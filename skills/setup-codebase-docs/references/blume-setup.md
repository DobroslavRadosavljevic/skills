# Blume setup, privacy, and hosting

Blume 2.x turns a folder of Markdown and MDX into a static docs site. Its CLI makes and runs a hidden Astro project in `.blume/`. You own only the content, `blume.config.ts`, and `public/`.

If the installed Blume differs from this page, trust the package. Its bundled `docs/` folder matches its version. Find it with `node -e "console.log(require.resolve('blume/package.json'))"` from the app folder.

## Contents

- [Files per app](#files-per-app)
- [Blume rules that matter here](#blume-rules-that-matter-here)
- [Runbook content type](#runbook-content-type)
- [Private access](#private-access)
- [Hosting](#hosting)
- [Verify](#verify)
- [Known failures](#known-failures)

## Files per app

| File | Source | Notes |
| --- | --- | --- |
| `package.json` | write by hand | private; scripts below; `blume` in `devDependencies` |
| `blume.config.ts` | [assets/human-blume.config.ts](../assets/human-blume.config.ts) or [assets/agent-blume.config.ts](../assets/agent-blume.config.ts) | set the title, description, accent, and the JSDoc that says why the site exists |
| `middleware.ts` | [assets/middleware.ts](../assets/middleware.ts) | or a re-export of one shared package |
| `public/robots.txt` | [assets/robots.txt](../assets/robots.txt) | blocks every crawler |
| `.gitignore` | [assets/docs-app.gitignore](../assets/docs-app.gitignore) | `.blume/`, `.blume-verify/`, `dist/`, `.vercel/` |
| `docs/index.md(x)` | write by hand | the start page |

Scripts in each app (set the port):

```json
{
  "docs:dev": "blume dev --port <port>",
  "build": "blume build",
  "preview": "blume preview --port <port>",
  "docs:check": "blume validate --strict",
  "docs:doctor": "blume doctor"
}
```

The agent app also needs a schema library for the runbook type (`zod` or another Standard Schema library the repo already uses) in `devDependencies`.

## Blume rules that matter here

- **Content root.** `content: { root: "docs" }`. Folder and file names set the sidebar.
- **Order.** Numeric prefixes order pages and sections (`05-billing/02-usage.md`), and Blume strips them from URLs (`/billing/usage`). Use two digits.
- **Format.** Human site: `.mdx`, so pages can use Mermaid diagrams and built-in components. Agent site: plain `.md`, so agents read the source files directly.
- **Strict frontmatter.** Each page needs `title` and `description`. Unknown keys fail the build. Quote a value that contains `: `. Declare extra keys in the config (see the runbook type below).
- **MDX escapes.** In `.mdx`, escape `{` and `<` in prose, write comments as `{/* … */}`, and self-close void tags. Put code and paths in backticks.
- **Diagrams.** Write a fenced `mermaid` block in `.mdx`. Keep node labels in quotes when they contain parentheses or colons.
- **Callouts.** Use directives: `:::note`, `:::tip`, `:::warning`, `:::danger`.
- **Links between pages.** Agent site: relative `.md` paths (`../03-database/02-migrations.md`). Agents can then follow them in the repo too. Human site: site paths (`/billing/usage`) or relative paths.
- **Links to code.** A link to a file outside the content root fails validation. Write repo files as inline code from the repo root: `` `src/billing/usage.ts` ``.
- **Generated folders.** Never edit `.blume/` or `.blume-verify/`. They are rebuilt on every run.
- **Last modified.** `lastModified: "git"` shows each page's last commit date.
- **Agent outputs.** The agent site turns on `agents.llmsTxt`, so tools can read one text index. Both sites turn off SEO outputs, Open Graph images, RSS, the sitemap, feedback, "open in chat", and "powered by". The sites are private, so these outputs only leak or waste build time.

## Runbook content type

The agent config declares a `runbook` content type. Runbook pages set `type: runbook` and `last-verified: YYYY-MM-DD`. Then a runbook without `last-verified` fails the build. YAML reads an unquoted date as a Date, so the schema coerces.

Blume cannot check that the date is real and not in the future, that the index lists each runbook, or that named files and scripts exist. [assets/check-runbooks.ts](../assets/check-runbooks.ts) does that. Copy it to the repo's scripts folder, set its folder constant, and add a `runbooks:check` script.

## Private access

Blume builds a static site with no sign-in. [assets/middleware.ts](../assets/middleware.ts) is a Vercel Routing Middleware with HTTP Basic auth. Vercel runs it before it serves any file: pages, the search index, `llms.txt`, and assets.

- It reads `DOCS_USERNAME` (with a default) and `DOCS_PASSWORD` from the project settings.
- With no `DOCS_PASSWORD`, it answers 503. A missing setting never opens the site.
- It compares digests in constant time, and it decodes UTF-8 and passwords that contain `:`.
- Set the realm text and the default username for the repo.

If the repo has a unit test setup, test the middleware with the repo's test runner. Write the failure modes first, then one test for each:

1. No `DOCS_PASSWORD`: must answer 503.
2. No `Authorization` header: must answer 401 with a `WWW-Authenticate` challenge.
3. A wrong password, or the right password with a wrong user: must answer 401.
4. A malformed header (another scheme, bad base64, no `:`, bytes that are not UTF-8): must answer 401, not 500.
5. A password with `:` in it: must split at the first colon only.
6. A password with non-ASCII characters: must decode as UTF-8.
7. The right user and password: must pass.

Other hosts: on Cloudflare Pages, use Cloudflare Access. On Netlify, use its password protection or an Edge Function with the same check. Do not deploy a public build "for now".

## Hosting

Vercel steps for each site. These are for the user. Do not create projects, set env vars, or deploy without approval.

1. Create a project from the repo. Set Root Directory to the app folder.
2. In a monorepo, turn on "Include files outside the root directory". Set the install command for the repo's package manager (for example `bun install`).
3. Set Build Command `bun run build` and Output Directory `dist`.
4. Set `DOCS_PASSWORD` (required) and `DOCS_USERNAME` (optional) for every environment, previews too.
5. After the first deploy, check that `/` answers 401 without credentials and 200 with them. Also check `/llms.txt` on the agent site. If the middleware imports a workspace package, check that the deploy bundled it.

## Verify

Run these in each app folder:

```bash
bunx blume validate --strict
bunx blume build
```

- `validate --strict` fails on broken links and anchors. Fix the cause. Never use `--no-strict`.
- If a dev server for the app is running, `blume build` refuses to run. Use `bunx blume build --isolated`. It builds into `.blume-verify/` and leaves the server alone.
- Check the built page count against the source page count.
- Agent site: open `dist/llms.txt` and one page's `.md` mirror.
- Run the runbook checker and `doc-paths.ts check` (see [migration.md](migration.md#rewrite-references)).

Then run the repo's full quality commands. Adding Blume adds many packages to the lockfile (Astro, Vite plugins, Scalar, Shiki). That can change which version of a shared package other code resolves.

## Known failures

- **A typecheck fails in code you did not touch after Blume was added.** A package that Blume brings got hoisted, and another package now resolves its newer types. Find the package in the lockfile diff. Fix the resolution, not the product code. With Bun's isolated linker, you can keep the package out of the shared hoist: `[install] hoistPattern = ["*", "!@scope/*"]` in `bunfig.toml`. Bun does not remove links that already exist. Delete them under `node_modules/.bun/node_modules/`, then run `bun install`. Run a control test (remove the pattern and reinstall to see the link come back), and write the reason next to the setting. With other package managers, use their hoist or override settings.
- **`BLUME_FRONTMATTER_INVALID`.** An unknown key, a missing `title`, or an unquoted value with `: `.
- **A link to a repo file fails validation.** Make it inline code.
- **An MDX parse error.** A bare `{` or `<` in prose. Escape it, or put it in backticks.
