#!/usr/bin/env bun
/**
 * Validates the runbooks section of the agent docs site.
 *
 * Why: Blume checks links and requires `last-verified` on `type: runbook` pages. It cannot check
 * that the date is real and not in the future, that the index lists every runbook, or that the
 * files and root scripts a runbook names still exist.
 *
 * Checks:
 *   - Every runbook (each `.md` except index.md) has a non-empty `title` and `description`,
 *     `type: runbook`, and a real `last-verified: YYYY-MM-DD` that is not in the future (UTC).
 *   - The file name is kebab-case.
 *   - `index.md` links every runbook, and every index link opens a real file.
 *   - Every repo path a runbook names in backticks (first folder exists at the repo root, code,
 *     config, or doc extension) exists.
 *   - Every root `bun run <name>` a runbook names is a script in the root package.json (skipped
 *     when the root has no package.json). `bun run --cwd <dir> x` is skipped.
 *
 * Usage:
 *   bun scripts/check-runbooks.ts [--dir <runbooks folder>] [--json]
 *
 * Side effects: none (read-only). Env: none.
 * Exit codes: 0 valid, 1 problems found, 2 bad usage or a missing folder.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

/** Set this to the runbooks section of the agent site, relative to the repo root. */
const RUNBOOKS_DIR = "apps/internal-agent-docs/docs/15-runbooks";
const INDEX_FILE = "index.md";

const HELP = `Usage: bun scripts/check-runbooks.ts [--dir <folder>] [--json]

Validate runbook frontmatter, the index.md table, and the repo paths and root
bun run scripts that runbooks name.

  --dir <folder>  Runbooks folder, relative to the repo root (default: ${RUNBOOKS_DIR})
  --json          Machine-readable output
  -h, --help      Show this help`;

const EXIT = { ok: 0, failure: 1, usage: 2 } as const;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
/**
 * A backticked repo path to a code, config, or doc file, such as `src/billing/usage.ts`. Globs
 * and placeholders do not match. Env files are left out: runbooks often tell you to create one.
 */
const PATH_REF_PATTERN =
  /`((?:[\w.@+-]+\/)+[\w.@+-]+\.(?:tsx?|[mc]?js|json|mdx?|sh|py|go|rs|rb|java|kt|swift|php|cs|sql|toml|ya?ml))`/g;
const ROOT_SCRIPT_PATTERN = /\bbun run (?!--cwd)([\w:-]+)/g;
const MD_LINK_PATTERN = /\]\((?:\.\/)?([^)#\s]+\.md)(?:#[^)]*)?\)/g;

type Problem = { file: string; message: string };

const findRepoRoot = (start: string): string => {
  let current = start;
  while (!existsSync(path.join(current, ".git"))) {
    const parent = path.dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
  return current;
};

/** Removes HTML comments and fenced code blocks, so examples are not read as links or paths. */
const stripNonContent = (markdown: string): string =>
  markdown.replaceAll(/<!--[\s\S]*?-->/g, "").replaceAll(/^(```|~~~)[\s\S]*?^\1/gm, "");

/** Flat `key: value` frontmatter. Runbook frontmatter has only scalar fields on purpose. */
const parseFrontmatter = (markdown: string): Record<string, string> | undefined => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!match?.[1]) {
    return undefined;
  }
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator > 0) {
      fields[line.slice(0, separator).trim()] = line
        .slice(separator + 1)
        .trim()
        .replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return fields;
};

/** A real calendar date (rejects 2026-02-31) that is today or earlier, in UTC. */
const isValidPastDate = (value: string): boolean => {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
  return real && date.getTime() <= Date.now();
};

const checkRunbook = (
  repoRoot: string,
  label: string,
  markdown: string,
  rootScripts: Set<string> | undefined,
): Problem[] => {
  const problems: Problem[] = [];
  const at = (message: string) => problems.push({ file: label, message });
  const slug = path.basename(label, ".md");

  const frontmatter = parseFrontmatter(markdown);
  if (frontmatter) {
    if (!frontmatter["title"]) at("frontmatter title is empty");
    if (!frontmatter["description"]) at("frontmatter description is empty");
    if (frontmatter["type"] !== "runbook") {
      at(`frontmatter type "${frontmatter["type"] ?? ""}" must be "runbook"`);
    }
    const verified = frontmatter["last-verified"] ?? "";
    if (!isValidPastDate(verified)) {
      at(`last-verified "${verified}" must be a real YYYY-MM-DD date, not in the future`);
    }
  } else {
    at("missing frontmatter (title, description, type, last-verified)");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    at("file name must be kebab-case");
  }

  const content = stripNonContent(markdown);
  for (const [, reference] of content.matchAll(PATH_REF_PATTERN)) {
    if (!reference) continue;
    const top = path.join(repoRoot, reference.split("/")[0]!);
    const isRepoPath = existsSync(top) && statSync(top).isDirectory();
    if (isRepoPath && !existsSync(path.join(repoRoot, reference))) {
      at(`names missing file ${reference}`);
    }
  }
  if (rootScripts) {
    for (const [, script] of content.matchAll(ROOT_SCRIPT_PATTERN)) {
      if (script && !rootScripts.has(script)) {
        at(`names missing root script "bun run ${script}"`);
      }
    }
  }
  return problems;
};

const checkIndex = (folder: string, label: string, runbookFiles: readonly string[]): Problem[] => {
  const indexPath = path.join(folder, INDEX_FILE);
  if (!existsSync(indexPath)) {
    return [{ file: label, message: "index file is missing" }];
  }
  const problems: Problem[] = [];
  const linked = new Set<string>();
  for (const [, target] of stripNonContent(readFileSync(indexPath, "utf8")).matchAll(
    MD_LINK_PATTERN,
  )) {
    if (!target) continue;
    linked.add(target);
    if (!existsSync(path.join(folder, target))) {
      problems.push({ file: label, message: `index links missing file ${target}` });
    }
  }
  for (const file of runbookFiles) {
    if (!linked.has(file)) {
      problems.push({ file: label, message: `index does not link ${file}` });
    }
  }
  return problems;
};

const readRootScripts = (repoRoot: string): Set<string> | undefined => {
  const manifestPath = path.join(repoRoot, "package.json");
  if (!existsSync(manifestPath)) {
    return undefined;
  }
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
  const scripts =
    typeof manifest === "object" && manifest !== null && "scripts" in manifest
      ? manifest.scripts
      : undefined;
  return new Set(typeof scripts === "object" && scripts !== null ? Object.keys(scripts) : []);
};

const main = () => {
  let values: { dir?: string; json?: boolean; help?: boolean };
  try {
    ({ values } = parseArgs({
      options: {
        dir: { type: "string" },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(HELP);
    process.exit(EXIT.usage);
  }
  if (values.help) {
    console.log(HELP);
    process.exit(EXIT.ok);
  }

  const repoRoot = findRepoRoot(process.cwd());
  const relativeDir = values.dir ?? RUNBOOKS_DIR;
  const folder = path.join(repoRoot, relativeDir);
  if (!existsSync(folder)) {
    console.error(`No runbooks folder at ${folder}`);
    process.exit(EXIT.usage);
  }

  const rootScripts = readRootScripts(repoRoot);
  const runbookFiles = readdirSync(folder)
    .filter((file) => file.endsWith(".md") && file !== INDEX_FILE)
    .sort();
  const problems = [
    ...runbookFiles.flatMap((file) =>
      checkRunbook(
        repoRoot,
        `${relativeDir}/${file}`,
        readFileSync(path.join(folder, file), "utf8"),
        rootScripts,
      ),
    ),
    ...checkIndex(folder, `${relativeDir}/${INDEX_FILE}`, runbookFiles),
  ];

  if (values.json) {
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
