# Blume CLI reference

Every `blume` command, its flags, exit codes, and diagnostic codes (Blume 2.2.2, Node `>=22.19.0`). Use it to run and read Blume tooling and to wire CI without opening upstream docs.

## Contents

- [Invocation and conventions](#invocation-and-conventions)
- [Command index](#command-index)
- [Project lifecycle: init, dev, build, preview, sync, check](#project-lifecycle)
- [Verifying while `blume dev` runs (`--isolated`)](#verifying-while-blume-dev-runs)
- [Components and eject: add, eject](#components-and-eject)
- [blume doctor](#blume-doctor)
- [blume validate](#blume-validate)
- [blume audit](#blume-audit)
- [blume eval](#blume-eval)
- [blume translate](#blume-translate)
- [blume version](#blume-version)
- [Agent-handoff commands: skill, migrate, upgrade](#agent-handoff-commands)
- [JSON output shape](#json-output-shape)
- [Diagnostic codes](#diagnostic-codes)
- [Environment variables](#environment-variables)
- [CI recipes](#ci-recipes)
- [Gotchas](#gotchas)

## Invocation and conventions

```bash
bunx blume <command> [options]
```

Any package runner works (`npx`, `pnpm dlx`, `yarn dlx`). In a project that depends on `blume`, a script (`"build": "blume build"`) puts `blume` on PATH.

- Run commands from the project root (the folder with `blume.config.ts`). The CLI uses `process.cwd()`.
- Before any command runs, the CLI loads `.env.local` then `.env`. It walks from the cwd up to the repo root (first ancestor with `.git`). Values already in the shell win. `NODE_ENV` is never taken from these files.
- Unknown flags fail. Every command rejects a flag it does not take with `BLUME_UNKNOWN_OPTION`, suggests the closest match, and lists the flags it takes. A typo like `--isolatd` does not pass silently.
- `--json` exists on `validate`, `doctor`, `audit`, `eval`, and `translate` only. `build`, `check`, and `dev` report to the terminal only.
- `--codex` / `--claude` select a local agent CLI (Codex or Claude Code). Blume holds no API keys and calls no model itself. A missing agent binary exits 1 with an install hint (`npm install -g @openai/codex` or `npm install -g @anthropic-ai/claude-code`).
- Reports from `audit`, `eval`, `translate`, and `upgrade` go to **stderr**. `--json` output goes to **stdout**. Redirect accordingly in CI.
- Ejected projects: `build`, `check`, `dev`, and `sync` refuse to run and print the Astro equivalent for the project's package manager. See [eject](#components-and-eject).

## Command index

| Command | Purpose | Reads built `dist/`? | Writes `.blume/`? |
| --- | --- | --- | --- |
| `blume init [dir]` | Scaffold a project. | no | no |
| `blume dev` | Dev server with hot reload. | no | yes (holds a lock) |
| `blume build` | Build the static or server site. | no | yes |
| `blume preview` | Serve the last build. | yes | no |
| `blume add [item]` | Copy a source component from the registry. | no | no |
| `blume sync` | Re-fetch remote content sources, regenerate runtime. | no | yes |
| `blume eject` | Turn the runtime into a standalone Astro app. | no | removes it |
| `blume check` | Type-check with `astro check`. | no | yes |
| `blume doctor` | Diagnose config and content. | no | no |
| `blume validate` | Validate links in content. | no | no |
| `blume audit` | Audit the built site for SEO and health. | yes (needs a build) | no |
| `blume eval` | Agent answers questions from docs only; judge grades. | no | no |
| `blume translate` | Translate docs into configured locales. | no | no |
| `blume version [id]` | Freeze docs as an archived version. | no | no |
| `blume skill` | Write the site's agent skill with Codex or Claude Code. | no | no |
| `blume migrate [source]` | Migrate another docs site to Blume with an agent. | no | no |
| `blume upgrade` | Bump `blume`, list config changes left. | no | no |
| `blume mcp-stdio` | Internal: serve an MCP data snapshot over stdio, used by `blume eval`. | no | no |

`doctor`, `validate`, `audit`, `eval`, `translate`, `version`, and `skill` scan the project without regenerating `.blume/`. They are safe to run while `blume dev` is live.

## Project lifecycle

### blume init

```bash
bunx blume init [dir] [--yes] [--content-dir <dir>] [--template docs|api|sdk|changelog] [--package-manager npm|pnpm|yarn|bun] [--no-install] [--eject]
```

| Flag | Meaning |
| --- | --- |
| `[dir]` | Directory to scaffold into. Default: current directory. |
| `--yes` | Skip prompts and use defaults. Also the behavior in CI or when stdin is not a terminal. |
| `--content-dir <dir>` | Content folder. Default `docs`. |
| `--template docs\|api\|sdk\|changelog` | Starter: plain docs seed, API reference, SDK, or changelog. |
| `--package-manager npm\|pnpm\|yarn\|bun` | Install with, and print next steps for, this manager. Default: the one that ran `blume init`. |
| `--no-install` | Write files, skip dependency install. Use in CI or custom dependency flows. |
| `--eject` | Scaffold, then eject to a standalone Astro project. With `--no-install` it falls back to guiding you through `blume eject` after install. |

- In a terminal, `init` asks a few questions (location, site name, template, content sources). Each flag pre-answers its question.
- By default `init` runs the package manager's install. If install fails, the scaffold is kept, the retry command is printed, and the exit code is non-zero.
- `init` adds a `doctor` script to `package.json`. With pnpm run it as `pnpm run doctor`: a bare `pnpm doctor` runs pnpm's built-in command.

Agent-safe scaffold:

```bash
bunx blume init my-docs --yes --template docs --package-manager bun --no-install
```

### blume dev

```bash
bunx blume dev [--host [addr]] [--port <n>] [--open] [--content-dir <dir>] [--debug] [--preview] [--strict]
```

| Flag | Meaning |
| --- | --- |
| `--host [addr]` | Bind a network host. Bare `--host` binds all interfaces. `--host 10.0.0.1` binds that address. Absent means localhost only. |
| `--port <n>` | Port, integer 1-65535. Default 4321. An invalid value exits 1. |
| `--open` | Open the browser on start. |
| `--content-dir <dir>` | Scan a different content folder without editing `blume.config.ts`. |
| `--debug` | Verbose Astro/Vite logging. |
| `--preview` | Include drafts and unpublished CMS content. |
| `--strict` | Fail fast on error diagnostics. Dev continues past errors by default. |

- Dev holds a PID lock at `.blume/dev.lock` (it records the port). A second `blume dev` in the same project exits 1 with a message naming the running URL. Reuse that server. If it crashed, delete `.blume/dev.lock`.
- The dev server URL is the fallback `deployment.site`, so OG images, canonicals, and sitemap work locally without a configured site.
- Run it in the background in agent shells. Do not block on it.

### blume build

```bash
bunx blume build [--no-strict] [--preview] [--analyze] [--budget-js <kb>] [--budget-css <kb>] [--isolated]
```

| Flag | Meaning |
| --- | --- |
| `--strict` (default `true`) | Fail (exit 1) on any error diagnostic. Pages with invalid frontmatter and `.mdx` pages that do not parse are dropped from output, so strict stops a build that would silently lose pages. |
| `--no-strict` | Build despite error diagnostics. The build succeeds and reports how many pages are missing. A failure only the render finds (a page that throws) still fails the build. |
| `--preview` | Include drafts and unpublished CMS content. |
| `--analyze` | Print client JavaScript bundle sizes (largest first) after the build. |
| `--budget-js <kb>` | Fail the build when total client JS exceeds this many kB. Must be a positive number. |
| `--budget-css <kb>` | Same for client CSS. |
| `--isolated` | Build into a throwaway `.blume-verify/` runtime and its own `dist/`. Leaves a running dev server and the real `dist/` untouched. |

- `--budget-js 250kb` is rejected (`Invalid --budget-js`, exit 1). Pass a bare number of kB.
- Budgets and `--analyze` still run for `--isolated` builds, measured against the isolated output.
- `blume build` refuses while `blume dev` is running (exit 1) unless `--isolated` or `BLUME_RUNTIME_DIR` is used.
- A static build with server-only features (assistant, MCP server, Try it proxy, server-mode search) fails with `BLUME_SERVER_FEATURE_REQUIRED`. Switch to a host adapter from `blume/deploy` (for example `deployment: vercel()`), or drop `output: "static"` from the adapter.
- Blume 1 flags (`--adapter`, `--output`) are removed. Passing them exits 1 with advice. Configure `deployment` in `blume.config.ts`.
- The build writes deploy artifacts (search index, `llms.txt`, sitemap, robots, redirects). An isolated build skips them.
- The build summary box prints Output, Adapter, Site, Search, Redirects, Sitemap, Robots, Agent JSON, LLM files, and Server features.

### blume preview

```bash
bunx blume preview [--host [addr]] [--port <n>]
```

Serves the last build. Run `blume build` first. `--host` and `--port` work as in `dev`. A server-output build on an adapter with no local preview server (`blume preview` prints which) cannot be previewed: use `blume dev` or deploy a preview.

### blume sync

```bash
bunx blume sync [--force] [--preview] [--strict]
```

| Flag | Meaning |
| --- | --- |
| `--force` | Clear the `.blume/cache` source cache before refetching (drops stale or corrupt snapshots). |
| `--preview` | Include drafts and unpublished CMS content. |
| `--strict` | Fail on diagnostics. |

Re-fetches remote content sources (GitHub Releases, mdx-remote, Sanity, Notion, and so on) and regenerates the runtime. If a dev server is live, `sync` regenerates with that server's URL as the site fallback and the dev server hot-reloads.

### blume check

```bash
bunx blume check [--strict] [--preview] [--isolated]
```

| Flag | Meaning |
| --- | --- |
| `--strict` | Fail on content diagnostics as well as type errors. Opt-in, unlike `build`. |
| `--preview` | Include drafts and unpublished CMS content. |
| `--isolated` | Type-check in a throwaway `.blume-verify/` runtime. |

- Runs `astro check` after regenerating `.blume` and syncing Astro content types. It reports TypeScript errors in `blume.config.ts`, custom `.astro` pages, and imported components. Exit 1 on type errors; `Type check failed.` is printed.
- Add a root `tsconfig.json` so authored pages resolve `blume/*` imports and virtual modules like `blume:data`. Without one, only the generated runtime is checked:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".blume/.astro/types.d.ts", "**/*"]
}
```

- An unresolvable `extends` or `references` entry in that file stops `build`, `dev`, and `check` with `BLUME_TSCONFIG_EXTENDS`, at the line naming it. Install, restore, or generate the file, or remove the entry.
- Use it as a CI typecheck: `"typecheck": "blume check"`.

## Verifying while `blume dev` runs

`dev` serves the generated `.blume/` runtime and regenerates it on every change. `build` and `check` regenerate the same directory. Running either while dev is live would corrupt it, so both refuse and exit 1:

```
A `blume dev` server is running at http://localhost:4321; building would
corrupt its .blume runtime. Reuse that server, stop it first, or re-run with
--isolated to build/verify against .blume-verify without touching it.
```

`--isolated` relocates the runtime (and for `build`, its `dist/`) to a sibling `.blume-verify/`. Blume adds `.blume-verify/` to `.gitignore`.

```bash
bunx blume check --isolated   # fast: Astro type and template diagnostics, no dist/
bunx blume build --isolated   # thorough: full production render into .blume-verify/dist
```

- `check --isolated` is the quick path. `build --isolated` also catches runtime render errors.
- Isolated builds skip deploy post-steps: search index, hosted-provider sync, `llms.txt`, sitemap/robots, redirects.
- `BLUME_RUNTIME_DIR` makes plain `build` and `check` isolate without the flag. Useful in an agent's shell:

```bash
export BLUME_RUNTIME_DIR=.blume-verify
```

- `eject` also refuses while dev is running.
- `doctor`, `validate`, `audit`, `eval`, `translate`, `version`, `skill` never touch `.blume/` and need no `--isolated`.

## Components and eject

### blume add

```bash
bunx blume add            # list registry items
bunx blume add <item> [--force]
```

Copies the item's source files into the project. Existing files are skipped with a warning unless `--force`. An unknown item exits 1. Post-install notes print after a copy. Registry items include: `callout`, `card`, `card-group`, `code-group`, `badge`, `steps`, `step`, `tabs`, `tab`, `accordion`, `accordion-item`, `columns`, `column`, `frame`, `expandable`, `panel`, `tooltip`, `tile`, `prompt`, `youtube`, `header`, `sidebar`, `breadcrumbs`, `table-of-contents`, `pagination`, `feedback`, `footer`. Run `blume add` with no item for the authoritative list and descriptions.

### blume eject

```bash
bunx blume eject --yes [--force]
```

| Flag | Meaning |
| --- | --- |
| `--yes` | Skip the confirmation prompt. Without it, eject only prints a warning and exits without doing anything. |
| `--force` | Eject again over an already-ejected app, overwriting `astro.config.mjs` and `src/` (discarding your edits to them). |

- Eject is one-way. It writes `astro.config.mjs`, `src/`, and (if absent) `tsconfig.json`. It rewrites `package.json` scripts, adds the packages the Astro app imports to dependencies, and removes `.blume`. An existing `tsconfig.json` is untouched.
- It prints run commands for the detected package manager (install first when dependencies were added). The `blume` package remains importable.
- After eject, use the Astro commands instead of `blume build/check/dev/sync`.
- A second eject without `--force` exits 1. Eject refuses while `blume dev` runs.
- A config or `components.ts` problem is reported as a diagnostic (exit 1), not a stack trace.

## blume doctor

```bash
bunx blume doctor [--json]
```

Scans the project exactly as `blume build` would, without generating or building anything. Run it first when a build fails for a non-obvious reason.

Checks:

| Check | Severity |
| --- | --- |
| Node version vs the range in the installed `blume` `engines` (`BLUME_NODE_VERSION`) | warning |
| `blume.config.ts` validation (removed or renamed keys fail with a hint naming the replacement) | error |
| Every content page and folder meta: invalid frontmatter, `.mdx` that does not parse (`BLUME_MDX_SYNTAX`), navigation problems, missing include targets | error |
| Nav entry (tab, selector item, featured link, header action, CTA) pointing at no page (`BLUME_NAV_MISSING_PAGE`) | warning |
| `<Component>` example whose `path` names no file under `examples` (`BLUME_EXAMPLE_NOT_FOUND`) | warning |
| Server-only feature on a static-output site (assistant, MCP server, Try it proxy, server-mode search such as Mixedbread) | error |
| Packages the config needs but are not installed (search/source/assistant/narration SDK, deployment adapter `@astrojs/*`, Vue or Svelte island renderer). Prints the install command. | error |
| `components.ts` override Blume cannot plan (inline or computed entry, or import to a missing file) | error |
| Version-shaped folder (`v1.0/`) with no `versions` configured | warning |
| Missing secrets an enabled feature reads (`MIXEDBREAD_API_KEY`, `OPENROUTER_API_KEY`, ...) (`BLUME_MISSING_SECRET`) | warning |

- Doctor loads `.env` and `.env.local` first and checks secrets before remote sources fetch.
- After diagnostics it prints a summary: page count, output mode and adapter, search provider, reference, analytics, content source adapters, and the assistant backend.
- Exit: non-zero on error diagnostics. Warnings are reported and do not fail.
- `--json`: prints the [JSON output shape](#json-output-shape) on stdout.

## blume validate

```bash
bunx blume validate [--external] [--ignore <glob>]... [--strict] [--json]
```

Reads content the way a build does and checks every link. Does not generate or build. Run it before `blume build` as a fast gate.

| Flag | Meaning |
| --- | --- |
| `--external` | Also check external `http(s)` links over the network (off by default). |
| `--ignore <glob>` | With `--external`, skip external URLs matching the glob and report nothing. Matched against the full URL including scheme. `*` stays in one path segment, `**` crosses segments, dotfiles match. Repeat the flag for more. Quote each glob. An empty value exits 1. |
| `--strict` | Exit non-zero on warnings too. Info notes stay advisory. |
| `--json` | Diagnostics as JSON on stdout. |

Glob examples: `--ignore "https://api.acme.example/**"` and `--ignore "http://localhost:*/**"`. Internal links are always checked. Fix a broken internal link or add a redirect.

What is checked:

- Internal page links (inline, reference-style at the definition, autolinks in `.md`, a component's string `href`) must resolve to a page. Links inside code and comments are skipped. An `href={...}` expression is not checked.
- Anchor links (`#section`, `/page#section`) must match a heading id (generated or pinned), a raw HTML `id`, or an `<a name>`. Ids in code blocks, inline code, HTML comments, and `<Prompt>` blocks do not count.
- Assets: absolute paths resolve against `public/`. Relative image embeds and relative file links resolve against the page's own folder. Media `src` is checked the same way. `.html` links are reported unless `public/` has that file.
- Redirect `to` targets in `redirects` must lead somewhere. External targets are not checked.
- `mailto:`, `tel:`, and app schemes like `vscode:` are not checked. ReadMe schemes (`doc:`, `ref:`, `page:`, `changelog:`, `blog:`) are warnings.
- A bare URL that GFM autolinks with no link syntax is not read. `blume audit --external` checks it in the built site.
- "Page" covers custom `.astro` pages, API reference pages, the generated changelog index, every redirect, untranslated-page fallback URLs per locale, generated files (`/llms.txt`, `/llms-full.txt`, sitemap, `/robots.txt`, RSS, `/openapi.json`, `/agent-readability.json`, `/skill.md`, `.well-known` files), and `public/<dir>/index.html` folders.
- A page that fails to load (invalid frontmatter, `BLUME_MDX_SYNTAX`) is reported with the link findings.

Diagnostics:

| Code | Severity | Meaning |
| --- | --- | --- |
| `BLUME_BROKEN_LINK` | error | Internal link points at a route no page serves. A relative link to a file starting with `_` is a partial and is not published. |
| `BLUME_BROKEN_ANCHOR` | warning | Page exists but has no anchor matching the fragment. |
| `BLUME_BROKEN_ASSET` | warning | Asset not in `public/`, relative image not beside the page, `.html` link naming no file, or media `src` not served. |
| `BLUME_BROKEN_REDIRECT` | warning | A redirect's internal `to` leads to no page, file, or redirect. |
| `BLUME_UNSUPPORTED_LINK_SCHEME` | warning | A ReadMe link scheme that browsers cannot follow. Link the page by path. |
| `BLUME_DEAD_LINK` | error or warning | With `--external`: 404/410 or unresolvable host is an error. Any other error status (401/403, 429, 5xx), refused connection, or no answer in 10 seconds is a warning. |

Exit code: errors exit non-zero; `--strict` makes warnings do the same.

## blume audit

```bash
bunx blume build
bunx blume audit [--fail-on error|warning|info | --strict] [--url <origin>] [--external] [--ignore <glob>]... [--only <terms>] [--skip <terms>] [--list-checks] [--verbose] [--json] [--codex | --claude]
```

Crawls the HTML in `dist/` after a build. It needs an existing build; without one it exits 1 with "Run `blume build` first." It does not regenerate `.blume/`. Every finding names the source file and the frontmatter line that fixes it.

| Flag | Meaning |
| --- | --- |
| `--fail-on error\|warning\|info` | CI gate: exit non-zero at this severity or above. Default `error`. Any other value exits 1. |
| `--strict` | Alias for `--fail-on warning`. |
| `--url <origin>` | Also probe a live deployment: status codes, headers, configured redirects. Must be a full URL with scheme, otherwise exit 1. |
| `--external` | Probe outbound links over the network. |
| `--ignore <glob>` | With `--external`, skip matching outbound URLs. Repeatable. Same glob rules as `validate`. |
| `--only <terms>` / `--skip <terms>` | Comma-separated check ids or category keys to include or drop. An unknown term is an error suggesting the closest one. The summary count counts only the checks left in. |
| `--list-checks` | Print the full catalog and exit. |
| `--verbose` | List every affected page with full detail instead of the first few. |
| `--json` | JSON report on stdout. Mutually exclusive with `--codex` / `--claude`. |
| `--codex` / `--claude` | Write the full JSON report to a file and open the agent interactively to fix the findings. At most one. The gate does not apply: the run succeeds when the agent session does. |

- Findings are grouped by check. Checks that did not run are shown as skipped, not passing: `network` skipped without `--url`, `external` skipped without `--external`.
- `--url` requests go out as a plain HTTP client, not a crawler user agent. Firewall or CDN rules for crawlers are not exercised.
- With `--url`, each exact redirect's old URL is requested. A 404 is an error. A 200 is a warning (the host served the build's meta-refresh page, not an HTTP redirect). Patterns are not requested.
- Outbound links: 404/410 or unresolvable host is an error. Other statuses, refused connections, and timeouts are warnings.
- Not checked: full schema.org or rich-results validity (only well-formedness: valid JSON, `@context`, `@type`), per-element contrast (only theme config colors), and Core Web Vitals. Layout-shift causes visible offline (images without `width`/`height`, oversized assets) are reported.

Use `--only` and `--skip` with the category keys or with check ids (the `BLUME_AUDIT_` prefix is optional):

| Category | Key |
| --- | --- |
| Accessibility | `accessibility` |
| Content | `content` |
| Duplicates | `duplicates` |
| Indexability | `indexability` |
| Links | `links` |
| Redirects | `redirects` |
| Social cards | `social` |
| Internationalization | `i18n` |
| Assets | `assets` |
| Sitemap | `sitemap` |
| robots.txt | `robots` |
| AI discoverability | `ai` |
| Structured data | `structured-data` |
| Live deployment | `network` |

`blume audit --only i18n` works; `--only Internationalization` does not.

### Audit check catalog

All IDs below carry the `BLUME_AUDIT_` prefix. Tier: default is the built HTML. `[url]` needs `--url`. `[ext]` needs `--external`. `[theme]` reads theme config. Severity: E error, W warning, I info.

| Cat | ID | Sev | Fix |
| --- | --- | --- | --- |
| content | `TITLE_MISSING` | E | Add `title` to frontmatter. |
| content | `TITLE_MULTIPLE` | E | Remove the extra `<title>` from layout or MDX. |
| content | `TITLE_LENGTH` | W | Rewrite `title` to fit the length range. |
| content | `DESCRIPTION_MISSING` | W | Add `description` to frontmatter. |
| content | `DESCRIPTION_MULTIPLE` | E | Remove the extra description `<meta>`. |
| content | `DESCRIPTION_LENGTH` | W | Rewrite `description` to fit the range. |
| content | `H1_MISSING` | W | Give the page a `title` (rendered as `<h1>`). |
| content | `H1_MULTIPLE` | W | Demote body `# Heading` to `##`. |
| content | `LOW_WORD_COUNT` | I | Expand the page or fold it into another. |
| content | `HEADING_SKIP` | I | Use the next heading level (h2 to h4 skips h3). |
| content | `FUTURE_DATED_PAGE` | I | Correct `date` or hold the page back. |
| content | `VIEWPORT_MISSING` | E | Restore the viewport `<meta>` in an ejected layout. |
| duplicates | `DUPLICATE_TITLE` | W | Give each page a distinct `title`. |
| duplicates | `DUPLICATE_DESCRIPTION` | W | Give each page a distinct `description`. |
| duplicates | `DUPLICATE_CONTENT` | W | Merge pages, or set `seo.canonical` on all but one. |
| indexability | `SITE_NOT_SET` | W | Set `deployment.site` in `blume.config.ts`. |
| indexability | `SITE_INFERRED_AT_DEPLOY` | I | Audit a production-like build (for example `VERCEL=1 VERCEL_PROJECT_PRODUCTION_URL=<host> blume build`) or use `--url`. Do not hardcode `deployment.site`: the platform sets it. |
| indexability | `CANONICAL_ON_NOINDEX` | W | Drop the canonical from noindex pages. |
| indexability | `DRAFT_PAGE_PUBLISHED` | W | Rebuild without `--preview`, or remove `draft: true`. |
| indexability | `CANONICAL_MISSING` | W | Set `deployment.site` so canonicals are absolute. |
| indexability | `CANONICAL_NOT_SELF` | I | Point `seo.canonical` at this page or remove it. |
| indexability | `CANONICAL_BAD_TARGET` | E | Point `seo.canonical` at an existing non-redirecting page. |
| indexability | `CANONICAL_PROTOCOL_MISMATCH` | E | Match the protocol of `deployment.site`. |
| indexability | `ROBOTS_META_UNEXPECTED` | I | Remove `noindex` from frontmatter if it should be indexed. |
| indexability | `HTML_TOO_LARGE` | E | Split the page (Googlebot stops reading at 2 MB). |
| indexability | `ROBOTS_HEADER_CONFLICT` `[url]` | E | Remove or align the X-Robots-Tag header. |
| links | `LINK_TO_BROKEN` | E | Fix the target or create the page. Under `deployment.base`, a root-relative link without the base is reported. |
| links | `LINK_TO_REDIRECT` | W | Link straight to the destination. |
| links | `ORPHAN_PAGE` | W | Link to it from the body of a related page (navigation alone does not count). |
| links | `INTERNAL_LINK_ABSOLUTE` | W | Use a root-relative path so links survive previews and `basePath`. |
| links | `INTERNAL_LINK_NOFOLLOW` | I | Drop `rel="nofollow"` on internal links. |
| links | `DOUBLE_SLASH_URL` | E | Check `basePath` / `deployment.base` for a trailing slash. |
| links | `ANCHOR_BROKEN` | W | Point the fragment at an existing heading id. |
| links | `URL_STYLE` | I | Rename the source file to a lowercase hyphenated slug; add a redirect if already published. |
| redirects | `REDIRECT_BROKEN` | E | Point the redirect at an existing page. |
| redirects | `REDIRECT_LOOP` | E | Break the cycle in `redirects`. |
| redirects | `REDIRECT_CHAIN` | W | Point every hop at the final destination. |
| redirects | `META_REFRESH` | W | Use a real redirect in `blume.config.ts`. |
| redirects | `REDIRECT_SOURCE_IS_PAGE` | E | Remove the redirect or delete the shadowed page. |
| redirects | `REDIRECT_TO_HTTP` `[url]` | E | Redirect to the HTTPS URL. |
| redirects | `REDIRECT_NOT_SERVED` `[url]` | E | Deploy the redirect file your host reads, or name the host in `deployment`. W if the old URL answers 200 or redirects elsewhere. |
| social | `OG_INCOMPLETE` | W | Add a `description`; Blume fills the rest. |
| social | `OG_IMAGE_MISSING` | W | Set `deployment.site` (generated OG images) or `seo.image`. |
| social | `OG_IMAGE_BROKEN` | W | Point `seo.image` at an existing file or rebuild. |
| social | `OG_IMAGE_SMALL` | W | Use at least 1200x630. |
| social | `OG_URL_MISMATCH` | W | Align `og:url` with the canonical. |
| social | `TWITTER_CARD_INCOMPLETE` | W | Set `seo.x.handle` in `blume.config.ts`. |
| i18n | `HTML_LANG_MISSING` | E | Restore `lang` on `<html>` in an ejected layout. |
| i18n | `HTML_LANG_INVALID` | E | Use a valid BCP 47 tag. |
| i18n | `HREFLANG_LANG_MISMATCH` | E | `<html lang>` must match the page's hreflang. |
| i18n | `HREFLANG_INVALID` | E | Use a valid BCP 47 tag in hreflang. |
| i18n | `HREFLANG_SELF_MISSING` | W | hreflang set must include a self-reference. |
| i18n | `HREFLANG_XDEFAULT_MISSING` | I | Add an `x-default` alternate to the default-locale page. |
| i18n | `HREFLANG_NO_RETURN_TAG` | E | Every page in the group must link back to every other. |
| i18n | `HREFLANG_BAD_TARGET` | E | Point at an existing canonical page. |
| i18n | `HREFLANG_CONFLICT` | E | Each language in a group must name exactly one page. |
| accessibility | `THEME_CONTRAST_LOW` `[theme]` | W | Pick a darker light-mode or lighter dark-mode shade, per mode with `theme.accent: { light, dark }`. Measured against WCAG AA 4.5:1 for accent text, labels on accent and `action` fills, and body/secondary text on a custom `background`. |
| accessibility | `THEME_COLOR_UNCHECKED` `[theme]` | I | Write the color as hex, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, or a named color. |
| assets | `IMAGE_ALT_MISSING` | W | Add `alt`, or `alt=""` if decorative. |
| assets | `IMAGE_BROKEN` | E | Fix the path or add the file to `public/`. |
| assets | `ASSET_TOO_LARGE` | W | Compress, or serve WebP/AVIF. |
| assets | `IMAGE_MISSING_DIMENSIONS` | W | Set `width` and `height` (layout shift). |
| assets | `SUBRESOURCE_MISSING` | E | Fix the reference or restore the file. |
| assets | `MIXED_CONTENT` | E | Load the subresource over HTTPS. |
| sitemap | `INDEXABLE_PAGE_NOT_IN_SITEMAP` | W | Remove `draft`/`hidden`/`noindex` if it should be indexed. A `public/sitemap.xml` replaces the generated sitemap: add the page there or delete that file. |
| sitemap | `NOINDEX_IN_SITEMAP` | E | Do not advertise noindex pages. |
| sitemap | `NON_CANONICAL_IN_SITEMAP` | E | List only canonical URLs. |
| sitemap | `SITEMAP_BAD_URL` | E | Remove the URL or build the page. |
| sitemap | `SITEMAP_INVALID` | E | Use valid sitemaps.org `urlset` or index XML. |
| sitemap | `SITEMAP_TOO_LARGE` | E | Split it (50 MB / 50,000 URLs). |
| sitemap | `SITEMAP_LASTMOD_INVALID` | W | Use a real W3C date not in the future. |
| sitemap | `SITEMAP_OUT_OF_SCOPE` | W | List only URLs on the sitemap's own origin. |
| sitemap | `SITEMAP_NOT_ACCESSIBLE` `[url]` | E | Make `sitemap.xml` reachable at the site root. |
| robots | `ROBOTS_MISSING` | W | Set `seo.robots: true`. |
| robots | `ROBOTS_INVALID` | E | Every line must be `Field: value` or a comment. |
| robots | `ROBOTS_DISALLOWS_INDEXABLE` | E | A page cannot be both disallowed and in the sitemap. |
| robots | `ROBOTS_BLOCKS_CRAWLER` | W | Narrow the crawler's `User-agent` group rule. Blocking an AI crawler on purpose is fine: skip this check. Reported once per crawler. |
| robots | `ROBOTS_SITEMAP_MISSING` | I | Set `deployment.site` so robots.txt references the sitemap. |
| robots | `ROBOTS_NOT_ACCESSIBLE` `[url]` | E | Make `robots.txt` reachable at the site root. |
| ai | `LLMS_TXT_MISSING` | W | Rebuild; or set `agents.llmsTxt: false` if intentional. |
| ai | `LLMS_TXT_STALE_ENTRY` | W | Rebuild so `llms.txt` matches the site. |
| ai | `LLMS_TXT_PAGE_MISSING` | W | Rebuild; or set `ai.exclude: true` in the page's frontmatter if deliberate. |
| ai | `DNS_AID_MISSING` `[url]` | I | Publish a ServiceMode SVCB or HTTPS record at `_index._agents.<host>`. |
| ai | `DNS_AID_UNSIGNED` `[url]` | I | Enable DNSSEC for the zone (records work unsigned too). |
| structured-data | `JSONLD_INVALID` | E | JSON-LD block must be valid JSON. |
| structured-data | `JSONLD_INCOMPLETE` | W | Every node needs `@context` and `@type`. |
| network | `HTTP_4XX` `[url]` | E | Page is linked or in the sitemap but the deployment 404s. |
| network | `HTTP_5XX` `[url]` | E | The deployment errors on this page. |
| network | `HTTP_TIMEOUT` `[url]` | E | The page did not respond in time. |
| network | `NOT_COMPRESSED` `[url]` | W | Enable gzip or brotli on the host. |
| network | `SLOW_RESPONSE` `[url]` | W | The page was slow to respond. |
| network | `EXTERNAL_LINK_BROKEN` `[ext]` | E | Fix or remove the outbound link. |
| network | `EXTERNAL_LINK_REDIRECT` `[ext]` | I | Link straight to the destination. |

Exit: with the default gate only error findings fail. `--fail-on warning` or `--strict` also fails on warnings. `--fail-on info` fails on anything.

## blume eval

```bash
bunx blume eval [init] [--agent codex|claude] [--file <path>] [--threshold <0..1>] [--timeout <seconds>] [--json] [--fix] [--verbose]
```

Gives the docs a test suite. A reader agent answers each question using only the docs; a judge grades the answer against facts you list. Failures name the page that should state the missing fact. It costs real money and minutes: two model sessions per question.

How it runs:

- Uses an installed agent CLI: Codex by default, Claude Code with `--agent claude`. Blume calls no model itself.
- The reader runs in an empty directory with file, shell, and web tools disabled, connected to a private MCP server that serves the docs (`search_docs`, `get_page`). It cannot read the repo. The judge has no tools.
- Codex sessions run without shell, command, and image tools and inherit none of your env vars. Claude Code sessions run with built-in tools off and skip settings files and `CLAUDE.md`. Your Claude Code login still works; set other needs such as `ANTHROPIC_API_KEY` in the shell, not `settings.json`.
- The MCP snapshot is built from content sources directly. No `blume build` needed. Nothing is deployed or uploaded.
- An answer the docs cannot support fails even when the model's prior knowledge is right. "The documentation doesn't say" also fails.

Flags:

| Flag | Default | Meaning |
| --- | --- | --- |
| `init` (positional) | none | Have the agent draft a starter `evals.yaml` from existing docs. Fails if the file exists. |
| `--agent codex\|claude` | `codex` | Agent CLI for reader and judge. |
| `--file <path>` | `evals.yaml` | Evals file, relative to project root or absolute. |
| `--threshold <0..1>` | `1` | Minimum passing fraction before a non-zero exit. `severity: warning` misses count as passing. An empty value is an error, so `--threshold "$UNSET_VAR"` cannot switch the gate off. |
| `--timeout <seconds>` | `180` | Reader time limit per question. Max `2147483`. |
| `--json` | off | Report on stdout. |
| `--fix` | off | After a failing run, write the JSON report to a file and open the agent interactively to fix the docs. It reruns `blume eval` with the run's own `--agent`, `--file`, `--threshold`, `--timeout`. The agent is told never to delete questions or weaken facts. The gate does not apply to `--fix` runs. |
| `--verbose` | off | Include the reader's full answer under each failure. |

`evals.yaml`:

```yaml
questions:
  - id: install-node-version
    question: What is the minimum Node.js version required?
    expected:
      - Node 22.19 or newer
    routes: /docs/quickstart          # string or list: pages that should answer it
  - id: deploy-vercel
    question: How do I deploy to Vercel?
    expected:
      - run blume build
      - "server features need deployment: vercel() from blume/deploy"
    routes:
      - /docs/deployment
    severity: warning                 # a miss warns, never fails CI
    skip: true                        # excluded, reported as skipped
```

- `expected` lists facts a correct answer must state in substance. Paraphrase passes; a missing or contradicted fact fails.
- `routes` anchors a failure to the page's source file. A hint matching no page is warned about (`BLUME_EVAL_ROUTE_UNKNOWN`).
- Codes: `BLUME_EVAL_QUESTION_FAILED` (docs could not answer), `BLUME_EVAL_QUESTION_ERROR` (the run itself failed: report says `run failed:` and points at the question, not a docs page), `BLUME_EVAL_ROUTE_UNKNOWN`.
- Exit non-zero when the passing fraction is below `--threshold`.
- JSON report: the standard `diagnostics` + `summary` plus per-question results (answer, score, missing facts, cost with Claude Code; Codex reports no spend).
- Run it on docs changes, not every push.

## blume translate

```bash
bunx blume translate --codex|--claude [--locale <codes>] [--concurrency <n>] [--timeout <seconds>] [--force] [--json]
bunx blume translate --check [--locale <codes>] [--json]
```

Needs i18n configured with at least one non-default locale; otherwise it exits 1.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--codex` / `--claude` | required | Agent CLI that translates. Exactly one, except with `--check`, which takes neither (passing one is an error). |
| `--check` | off | Read-only drift gate: report missing and stale pairs, exit non-zero on drift. Runs no agent, writes nothing. |
| `--locale <codes>` | all non-default locales | Comma-separated target locale codes. |
| `--concurrency <n>` | `4` | Parallel agent sessions, 1..16. |
| `--timeout <seconds>` | `600` | Agent time limit per file. Max `2147483`. |
| `--force` | off | Retranslate everything, including up-to-date and hand-authored files. Ignored by `--check`. |
| `--json` | off | Report on stdout, in both modes. |

How it works:

- Blume builds the prompt, runs the agent headlessly (file, shell, web tools off), validates the reply, and writes the target file itself.
- `blume.translations.json` at the project root is the ledger: a hash of each source file at translation time, per locale. Commit it. It is flushed after every finished file, so Ctrl+C loses only in-flight work.
- Reruns are incremental. A source unchanged since its last translation is skipped. A stale page is retranslated with the existing translation shown to the agent so register and terminology are kept.
- Hand-written translations without a ledger entry are adopted (stamped current, not rewritten). Only `--force` retranslates them.
- Pin dialect and tone with `style` on the locale, for example `{ code: "pt", label: "Português", style: "Brazilian Portuguese, informal você" }`. `style` wins over an older translation.

Scope:

- Pages: `.md`/`.mdx` in the default locale. Only prose and these frontmatter values are translated: `title`, `description`, `sidebar.label`, `sidebar.badge`, `seo.title`, `seo.description`. Target paths: `fr/guides/install.mdx` under the `dir` parser, `guides/install.fr.mdx` under `dot`.
- Folder `meta.ts` titles: `dir` parser only, one batched call per locale; other keys (`order`, `pages`, `icon`, `collapsed`) copy verbatim. A default-exported function `meta.ts` is skipped with a warning.
- Skipped: remote and CMS-backed sources (no local file) and header tab labels (localize in `blume.config.ts` with per-locale label maps).
- Validation before write: frontmatter is rebuilt from the source with only the six translatable values overlaid; `seo.canonical` is dropped; code fence count must match; body non-empty; every heading gets a trailing `[#id]` pin matching the source anchor (headings pair positionally; mismatched structure gets no pins). A failing reply writes nothing and the item is reported failed.

Exit codes and codes:

| Mode | Exit 1 when |
| --- | --- |
| `--check` | any missing or stale translation exists. Hand-authored (untracked) translations never fail it. |
| translate run | any item failed or partial. Successes stay in the ledger, so a rerun retries only failures. |

Codes: `BLUME_TRANSLATE_MISSING` (error, `--check`), `BLUME_TRANSLATE_STALE` (error, `--check`), `BLUME_TRANSLATE_FAILED`, `BLUME_TRANSLATE_META_PARTIAL`, `BLUME_TRANSLATE_LEDGER_CONFLICT`, `BLUME_TRANSLATE_META_FACTORY`. In `--check --json`, `summary.error` equals the number of drift diagnostics and matches the exit code.

## blume version

```bash
bunx blume version                 # list configured versions
bunx blume version v1.0 [--force]  # cut a snapshot
```

Freezes the current content tree as an archived version:

1. Copies the content tree to a folder named after the id (`docs/v1.0/`), excluding existing snapshots.
2. Rewrites root-absolute links inside the copy so they stay in the snapshot: `/guides/x` becomes `/v1.0/guides/x`. Covers inline links and images, reference definitions, and HTML `href`/`src`. A link that spells out `basePath` keeps it. Fenced and inline code are untouched. Links to pages with no snapshot copy (generated API references, remote sources like a changelog) keep pointing at live pages.
3. Registers the id in `versions.archived` in `blume.config.ts`. The first cut adds a `versions` block with the live docs labeled "Latest". If the config shape cannot be edited, it warns and prints the entry to paste.
4. Reports files copied and pages rewritten. Archived versions are frozen. Restart `blume dev` to pick the snapshot up.

| Flag | Meaning |
| --- | --- |
| `--force` | Overwrite an existing snapshot folder. |

It exits non-zero without changing anything when:

- the id does not start with a letter, or has characters other than letters, digits, dots, hyphens, underscores (use `v1.0`, not `1.0`);
- the project has error diagnostics (run `blume doctor`);
- the id is already in `versions.archived`;
- the snapshot folder exists and `--force` was not passed.

With no id it lists the current version (label, badge) and each archived id with its folder. Before the first cut it explains how to cut one.

## Agent-handoff commands

All three open Codex or Claude Code interactively on a skill bundled in the `blume` package. With neither `--codex` nor `--claude` they print where the bundled skill lives and how to install it for other agents. Passing both exits 1 ("Pass at most one of --codex or --claude."). A non-zero agent exit code is passed through.

### blume skill

```bash
bunx blume skill [--codex | --claude]
```

Every build publishes a generated `/skill.md` (a map of the docs). `blume skill` has an agent write a richer, docs-grounded skill under the same name that replaces the generated one, using the bundled `blume-write-skill` skill. It scans the content tree without touching the runtime.

### blume migrate

```bash
bunx blume migrate [source] [--codex | --claude]
```

Moves another docs site to Blume with the bundled `blume-migrate` skill. Run it inside the site being migrated. `source` is one of:

`mintlify`, `fumadocs`, `docusaurus`, `starlight`, `nextra`, `vitepress`, `vuepress`, `docus`, `mkdocs`, `mdbook`, `fern`, `gitbook`, `redocly`, `readme`, `docsify`, `jekyll`, `github-wiki`.

- Omit `source` to detect the framework (the detection evidence is printed). An unlisted framework is also fine: the agent inventories the repo first.
- An unknown `source` exits 1. A named source that disagrees with detection prints a warning and proceeds as named.

### blume upgrade

```bash
bunx blume@latest upgrade [--codex | --claude] [--no-install]
```

Run it through the package runner with `@latest`: a project on an older major lacks the command. It:

1. Bumps the `blume` dependency in `package.json` and installs (default; `--no-install` bumps only).
2. Checks the config, `components.ts`, and every page's frontmatter against this version and prints the remaining changes as diagnostics.
3. With `--codex`/`--claude`, hands the list to the agent with the bundled upgrade guide.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--codex` / `--claude` | none | Hand remaining changes to the agent. |
| `--install` / `--no-install` | install | Install dependencies after the bump. |

Exit and outcomes:

- Exits 1 outside a Blume project (no `blume.config.ts` and no `blume` dependency): run it in the package that depends on `blume`.
- Findings remaining and no agent flag: prints the findings and the guide URL, exits 1.
- No findings: prints "Ready for Blume <version>" and exits 0. Then run `blume build` to confirm. If the dependency range could not be rewritten (manual bump), it exits 1 until you update the range.
- Install failure is a warning; run the printed install command yourself.

## JSON output shape

`validate --json` and `doctor --json` print one object on stdout:

```json
{
  "diagnostics": [
    {
      "code": "BLUME_BROKEN_LINK",
      "severity": "error",
      "message": "...",
      "file": "content/docs/page.mdx",
      "line": 12,
      "column": 3,
      "suggestion": "...",
      "docsUrl": "..."
    }
  ],
  "summary": { "error": 1, "warning": 0, "info": 0 }
}
```

- `file` is relative to the project root; `line` and `column` appear only when the finding has a location. `summary` holds counts per severity.
- `audit --json`, `eval --json`, and `translate --check --json` use the same `diagnostics` + `summary` shape with extra fields (audit: per-page findings; eval: per-question results; translate: drift grouped per locale).
- The exit code is unchanged by `--json`, so the same call gates CI and feeds editors. Blume flushes stdout before a non-zero exit so piped JSON is not truncated.
- Parse with `jq`, for example `bunx blume validate --json | jq '.summary'`.

## Diagnostic codes

Codes you meet outside `validate` and `audit`:

| Code | Raised by | Meaning and fix |
| --- | --- | --- |
| `BLUME_UNKNOWN_OPTION` | any command | A flag the command does not take. The message suggests the closest flag and lists accepted ones. |
| `BLUME_MDX_SYNTAX` | dev, build, doctor, validate | An `.mdx` page does not parse. The page is dropped from output; strict `build` fails. |
| `BLUME_MDX_UNDEFINED_NAME` | build | In `.mdx`, `{...}` is a JavaScript expression that reads an undefined name, so the page fails to render. Define the value under `variables` in `blume.config.ts` (use `{{name}}`), or escape the brace (`\{`) or put it in inline code. |
| `BLUME_BUILD_FAILED` | build | Astro failed to compile or render the site. Reported at the file it names. |
| `BLUME_NAV_MISSING_PAGE` | dev, build, doctor | A tab, selector item, featured link, header action, or CTA matches no page, route, `public/` file, or generated file (warning). |
| `BLUME_EXAMPLE_NOT_FOUND` | dev, build, doctor | `<Component path>` names no file under `examples` (warning). |
| `BLUME_INCLUDE_NOT_FOUND` | content scan | An include target is missing. |
| `BLUME_SERVER_FEATURE_REQUIRED` | build | Server-only feature on a static build. Use a host adapter from `blume/deploy`, or drop `output: "static"`. |
| `BLUME_MISSING_SECRET` | build, doctor, sync | An enabled feature or remote source reads an unset env var (warning). Names the variable. |
| `BLUME_NODE_VERSION` | doctor | Node outside the supported range (warning). |
| `BLUME_TSCONFIG_EXTENDS` | build, dev, check | A `tsconfig.json` `extends` or `references` entry does not resolve. |
| `BLUME_YARN_PNP` | any runtime command | Yarn Plug'n'Play is unsupported. Add `nodeLinker: node-modules` to `.yarnrc.yml`, run `yarn install`, rerun. |
| `BLUME_BROKEN_LINK`, `BLUME_BROKEN_ANCHOR`, `BLUME_BROKEN_ASSET`, `BLUME_BROKEN_REDIRECT`, `BLUME_UNSUPPORTED_LINK_SCHEME`, `BLUME_DEAD_LINK` | validate | See [blume validate](#blume-validate). |
| `BLUME_AUDIT_*` | audit | See [Audit check catalog](#audit-check-catalog). |
| `BLUME_EVAL_QUESTION_FAILED`, `BLUME_EVAL_QUESTION_ERROR`, `BLUME_EVAL_ROUTE_UNKNOWN` | eval | See [blume eval](#blume-eval). |
| `BLUME_TRANSLATE_MISSING`, `BLUME_TRANSLATE_STALE`, `BLUME_TRANSLATE_FAILED`, `BLUME_TRANSLATE_META_PARTIAL`, `BLUME_TRANSLATE_LEDGER_CONFLICT`, `BLUME_TRANSLATE_META_FACTORY` | translate | See [blume translate](#blume-translate). |

Each diagnostic's `docsUrl` points to the upstream page explaining it.

## Environment variables

| Variable | Used by | Effect |
| --- | --- | --- |
| `BLUME_RUNTIME_DIR` | `build`, `check` | Runtime directory to use. `.blume-verify` makes plain `build` and `check` isolate without `--isolated`. |
| `BLUME_DOH_URL` | `audit --url` | Overrides the DNS-over-HTTPS resolver list used for the DNS-AID checks. |
| `MIXEDBREAD_API_KEY`, `OPENROUTER_API_KEY`, and other feature or source tokens | `doctor`, `build`, `sync` | Read when the feature or source is enabled. Doctor warns when unset. Put them in `.env`, `.env.local`, or the shell. |
| `ANTHROPIC_API_KEY` | `eval --agent claude` | Set in the shell if your Claude Code setup needs it; the eval session skips `settings.json`. |
| `CONSOLA_LEVEL`, `NODE_ENV`, `TEST`, `CI`, `DEBUG` | all | Read by the logger from the real environment only, never from a project `.env`. |

## CI recipes

Package scripts (with `bunx`):

```json
{
  "scripts": {
    "doctor": "blume doctor",
    "typecheck": "blume check",
    "validate": "blume validate",
    "build": "blume build",
    "audit": "blume audit"
  }
}
```

Order for a docs PR gate: `doctor`, `validate`, `check`, `build`, `audit`. Each exits non-zero on its own failures.

GitHub Actions: PR gate (offline, no network, no agent):

```yaml
- uses: oven-sh/setup-bun@v2
- run: bun install --frozen-lockfile
- run: bunx blume doctor
- run: bunx blume validate --strict
- run: bunx blume check
- run: bunx blume build --budget-js 250 --budget-css 60
- run: bunx blume audit --fail-on warning
```

Budgets are in kB. Pick numbers that fit your site.

Scheduled job: external links and live checks (network flakiness stays out of PR gates):

```yaml
- run: bunx blume validate --external --ignore "http://localhost:*/**" --ignore "https://*.example.com/**"
- run: bunx blume audit --url https://docs.example.com --external --fail-on error
```

Translation drift gate:

```yaml
- run: bunx blume translate --check
```

Docs question gate, only on docs changes (needs the agent CLI and its credentials on the runner, and costs money):

```yaml
- run: bunx blume eval --agent claude --threshold 0.8
```

Machine-readable results:

```bash
bunx blume validate --json > validate.json
bunx blume audit --json > audit.json
bunx blume translate --check --json > translate.json
```

Agent verification loop while the user's dev server is live:

```bash
export BLUME_RUNTIME_DIR=.blume-verify   # or pass --isolated each time
bunx blume check
bunx blume build
bunx blume audit --only content,links --verbose
```

Notes for audit in CI:

- Audit reads `dist/`. Always `blume build` first in the same job.
- If `deployment.site` is inferred at deploy time (for example by Vercel), set the platform env vars when building for the audit, or audit the live site with `--url`. Do not hardcode `deployment.site`.
- Preview-only content (`--preview`) must not be deployed: `DRAFT_PAGE_PUBLISHED` flags it.

## Gotchas

- `blume build` is strict by default. Use `--no-strict` only to get a build through; it silently drops pages that fail validation and only reports a count. `dev` and `sync` are the opposite: lenient by default, `--strict` to fail. `check` is lenient by default too; `--strict` adds content diagnostics.
- `--strict` means different things: on `validate` it escalates warnings to failures; on `audit` it equals `--fail-on warning`; on `build`/`dev`/`sync`/`check` it controls aborting on error diagnostics.
- `blume build` and `blume check` refuse while `blume dev` runs. Use `--isolated` or `BLUME_RUNTIME_DIR=.blume-verify`, or reuse the running server. A crashed dev server leaves `.blume/dev.lock`: delete it.
- Do not start a second `blume dev`. Read the port from the error and reuse that URL.
- `blume audit` fails with "Run `blume build` first." when there is no build. An isolated build leaves its output in `.blume-verify/dist`, not `dist/`, so audit does not see it.
- An ejected project rejects `blume build/check/dev/sync`. Use the Astro commands it prints. `eject` without `--yes` does nothing; with `--yes` it is one-way.
- `--budget-js` and `--budget-css` take bare kB numbers. `250kb` is rejected.
- `--host` takes an optional value. Bare `--host` binds all interfaces.
- `--ignore` is repeatable and only matters with `--external`. Quote globs so the shell does not expand them.
- `blume validate` does not check external links by default. `blume audit` does not probe the network without `--url` or `--external`.
- `blume translate` needs exactly one of `--codex`/`--claude`, except `--check`, which rejects both. Commit `blume.translations.json`; without it every page looks untracked.
- `blume eval` and `blume translate --codex|--claude` shell out to installed agent CLIs and cost real money. A missing binary exits 1. `--timeout` caps at 2147483 seconds.
- `blume upgrade` must run via `bunx blume@latest upgrade`; an old install does not have the command.
- `blume version` ids must start with a letter (`v1.0`). Snapshot content is frozen: edit the live docs, not the snapshot, unless you mean to patch the archive. Restart dev after cutting.
- `pnpm doctor` runs pnpm's built-in command. Use `pnpm run doctor`.
- `blume audit --codex|--claude` and `--json` are mutually exclusive. An agent handoff ignores the exit-code gate.
- A report on stderr plus JSON on stdout means `blume audit --json 2>/dev/null | jq` is clean; without `--json` the report is on stderr and stdout is empty.
- A `public/sitemap.xml` replaces the generated sitemap. The sitemap audit checks that file, not the generated one.
- Under Yarn Plug'n'Play the generated runtime cannot resolve anything (`BLUME_YARN_PNP`). Add `nodeLinker: node-modules` to `.yarnrc.yml`.
- `NODE_ENV` set in `.env` is ignored by design. Set it in the real environment if you need it.
