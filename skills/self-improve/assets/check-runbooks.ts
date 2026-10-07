#!/usr/bin/env bun
/**
 * Validates `runbooks/`: frontmatter, the README index, and script references.
 *
 * Checks:
 *   - Every `runbooks/*.md` (except README.md) has frontmatter with `name`
 *     equal to its filename, a non-empty `description`, and a valid
 *     `last-verified: YYYY-MM-DD` that is not in the future.
 *   - `runbooks/README.md` links every runbook, and every index link resolves.
 *   - Every `scripts/...` path that a runbook mentions exists. Paths are
 *     resolved from the repo root.
 *
 * Usage:
 *   bun scripts/check-runbooks.ts [--root <dir>] [--json]
 *
 * Side effects: none (read-only).
 *
 * Exit codes: 0 when valid, 1 when problems are found, 2 on bad usage or a
 * missing runbooks folder.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const HELP = `Usage: bun scripts/check-runbooks.ts [--root <dir>] [--json]

Validate runbook frontmatter, the runbooks/README.md index, and script references.

  --root <dir>  Repo root (default: parent of this script's folder)
  --json        Machine-readable output
  -h, --help    Show this help`;

const EXIT = { ok: 0, failure: 1, usage: 2 } as const;
const INDEX_FILE = "README.md";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Matches `scripts/...` paths, optionally under a workspace (`apps/web/scripts/x.ts`). */
const SCRIPT_REF_PATTERN = /(?<![\w./-])((?:[\w.-]+\/)*scripts\/[\w./-]+\.(?:ts|tsx|js|mjs|cjs|sh|py))/g;
const MD_LINK_PATTERN = /\]\((?:\.\/)?([^)#\s]+\.md)(?:#[^)]*)?\)/g;

interface Problem {
  file: string;
  message: string;
}

const parseCli = () => {
  try {
    return parseArgs({
      args: Bun.argv.slice(2),
      options: {
        root: { type: "string" },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
      strict: true,
    }).values;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error(HELP);
    process.exit(EXIT.usage);
  }
};

/** Removes HTML comments and fenced code blocks so examples are not read as real links. */
const stripNonContent = (markdown: string): string =>
  markdown.replace(/<!--[\s\S]*?-->/g, "").replace(/^(```|~~~)[\s\S]*?^\1/gm, "");

/**
 * Parses flat `key: value` YAML frontmatter. Nested YAML is not supported on
 * purpose: runbook frontmatter has exactly three scalar fields.
 */
const parseFrontmatter = (markdown: string): Record<string, string> | undefined => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!match?.[1]) return undefined;
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    fields[key] = value;
  }
  return fields;
};

const isValidPastDate = (value: string): boolean => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Round-trip rejects impossible dates such as 2026-02-31.
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) && date.getTime() <= Date.now();
};

const checkRunbook = (root: string, file: string, markdown: string): Problem[] => {
  const problems: Problem[] = [];
  const at = (message: string) => problems.push({ file: `runbooks/${file}`, message });
  const slug = file.replace(/\.md$/, "");

  const frontmatter = parseFrontmatter(markdown);
  if (!frontmatter) {
    at("missing frontmatter (name, description, last-verified)");
  } else {
    if (frontmatter.name !== slug) at(`frontmatter name "${frontmatter.name ?? ""}" must equal "${slug}"`);
    if (!frontmatter.description) at("frontmatter description is empty");
    const verified = frontmatter["last-verified"] ?? "";
    if (!isValidPastDate(verified)) at(`last-verified "${verified}" must be a real YYYY-MM-DD date, not in the future`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) at("filename must be kebab-case");

  for (const [, ref] of markdown.matchAll(SCRIPT_REF_PATTERN)) {
    if (ref && !existsSync(join(root, ref))) at(`references missing script ${ref}`);
  }
  return problems;
};

const checkIndex = (runbooksDir: string, runbookFiles: string[]): Problem[] => {
  const indexPath = join(runbooksDir, INDEX_FILE);
  if (!existsSync(indexPath)) return [{ file: `runbooks/${INDEX_FILE}`, message: "index file is missing" }];

  const problems: Problem[] = [];
  const linked = new Set<string>();
  for (const [, target] of stripNonContent(readFileSync(indexPath, "utf8")).matchAll(MD_LINK_PATTERN)) {
    if (!target) continue;
    linked.add(target);
    if (!existsSync(join(runbooksDir, target))) {
      problems.push({ file: `runbooks/${INDEX_FILE}`, message: `index links missing file ${target}` });
    }
  }
  for (const file of runbookFiles) {
    if (!linked.has(file)) problems.push({ file: `runbooks/${INDEX_FILE}`, message: `index does not link ${file}` });
  }
  return problems;
};

const main = () => {
  const args = parseCli();
  if (args.help) {
    console.log(HELP);
    return;
  }

  const root = resolve(args.root ?? join(import.meta.dir, ".."));
  const runbooksDir = join(root, "runbooks");
  if (!existsSync(runbooksDir)) {
    console.error(`No runbooks folder at ${runbooksDir}`);
    process.exit(EXIT.usage);
  }

  const runbookFiles = readdirSync(runbooksDir)
    .filter((file) => file.endsWith(".md") && file !== INDEX_FILE)
    .sort();

  const problems = [
    ...runbookFiles.flatMap((file) => checkRunbook(root, file, readFileSync(join(runbooksDir, file), "utf8"))),
    ...checkIndex(runbooksDir, runbookFiles),
  ];

  if (args.json) {
    console.log(JSON.stringify({ ok: problems.length === 0, runbooks: runbookFiles.length, problems }));
  } else if (problems.length === 0) {
    console.log(`OK: ${runbookFiles.length} runbook(s) valid`);
  } else {
    for (const { file, message } of problems) console.log(`${file}: ${message}`);
    console.error(`${problems.length} problem(s) in ${runbookFiles.length} runbook(s)`);
  }
  process.exit(problems.length === 0 ? EXIT.ok : EXIT.failure);
};

main();
