#!/usr/bin/env bun
/**
 * Repoints references from old docs folders to the new docs-site pages, and checks that no
 * reference is left behind or broken.
 *
 * Why: moving docs breaks links in Markdown, code comments, agent rules, plans, and scripts. A
 * hand search misses some; a blind search-and-replace breaks relative links. This script resolves
 * each Markdown link from its own file, writes plain mentions as repo-root paths, and lists what
 * it cannot map.
 *
 * Commands:
 *   rewrite  Rewrite references with a map file. Dry run unless --write.
 *   check    Fail on references to an old root and on docs-site paths that do not exist.
 *
 * Usage:
 *   bun doc-paths.ts rewrite --map <map.json> --old-root <dir> [--old-root <dir>…]
 *                            [--skip <path prefix>…] [--backup <dir>] [--write]
 *   bun doc-paths.ts check   --old-root <dir>… --site <docs dir>… [--skip <path prefix>…]
 *
 * Map file (paths relative to the repo root):
 *   { "files": { "docs/a.md": "apps/internal-agent-docs/docs/01-x/02-a.md" },
 *     "anchors": { "docs/a.md#crons": "apps/internal-agent-docs/docs/05-y/01-crons.md" } }
 *
 * Rules:
 *   - Files: tracked and untracked, not ignored (`git ls-files -co --exclude-standard`), text only.
 *   - Markdown links `](target)` that resolve into an old root are rewritten relative to the file.
 *     Absolute site paths (`/x`) and URLs are left alone.
 *   - Plain mentions `<old root>/….md(x)` (comments, inline code) become repo-root paths. A
 *     mention right after `/`, `.`, a letter, or a digit is skipped, so URLs and longer paths stay.
 *   - Old anchors are dropped: the new page has its own headings. Use "anchors" rows to send a
 *     section to the page that now owns it.
 *
 * Side effects: `rewrite --write` edits files in place (temp file, then rename). With --backup, it
 *   first copies each changed file to <dir>/<relative path>. `check` is read-only. Env: none.
 * Exit codes: 0 ok, 1 unmapped or broken references, 2 bad usage or a bad map.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const HELP = `Usage:
  bun doc-paths.ts rewrite --map <map.json> --old-root <dir>… [--skip <prefix>…] [--backup <dir>] [--write]
  bun doc-paths.ts check --old-root <dir>… --site <docs dir>… [--skip <prefix>…]

  --map <file>       JSON map: { "files": { old: new }, "anchors": { "old#anchor": new } }
  --old-root <dir>   Old docs folder, relative to the repo root (repeat for more)
  --site <dir>       Docs folder of a new site, for check (repeat for more)
  --skip <prefix>    Repo path prefix to leave alone (repeat for more)
  --backup <dir>     Copy each file before rewrite --write changes it
  --write            Apply the rewrite (default: dry run)
  -h, --help         Show this help`;

const EXIT = { ok: 0, failure: 1, usage: 2 } as const;

const TEXT_EXTENSIONS = new Set(
  (
    "md mdx markdown txt rst adoc ts tsx mts cts js jsx mjs cjs json jsonc json5 yml yaml toml " +
    "css scss html astro vue svelte py go rs rb java kt swift php cs sql sh bash zsh ini cfg"
  ).split(" "),
);
const LOCKFILES = new Set(["bun.lock", "package-lock.json", "pnpm-lock.yaml", "yarn.lock"]);

type DocMap = { files: Record<string, string>; anchors: Record<string, string> };
type Finding = { file: string; reference: string; message: string };

const fail = (message: string): never => {
  console.error(message);
  process.exit(EXIT.usage);
};

const repoRoot = (): string => {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
  if (result.status !== 0) fail("Run this inside a git repository.");
  return result.stdout.trim();
};

const listFiles = (root: string, skip: readonly string[]): string[] => {
  const result = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.status !== 0) fail(`git ls-files failed: ${result.stderr}`);
  return result.stdout
    .split("\0")
    .filter(Boolean)
    .filter((file) => !skip.some((prefix) => file === prefix || file.startsWith(`${prefix}/`)))
    .filter((file) => !LOCKFILES.has(path.basename(file)))
    .filter((file) => TEXT_EXTENSIONS.has(path.extname(file).slice(1).toLowerCase()))
    .filter((file) => {
      const full = path.join(root, file);
      return existsSync(full) && statSync(full).isFile() && statSync(full).size < 4 * 1024 * 1024;
    });
};

const escapeRegExp = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** `](target)` links, excluding images is not needed: image targets never end in .md. */
const MD_LINK = /\]\(([^)\s]+?)\)/g;

const toPosix = (value: string) => value.split(path.sep).join("/");

/** The repo-relative path a link target points at, or undefined for URLs and site paths. */
const resolveLink = (file: string, target: string): { path: string; anchor: string } | undefined => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#") || target.startsWith("/")) {
    return undefined;
  }
  const [rawPath = "", anchor = ""] = target.split("#", 2);
  const resolved = toPosix(path.normalize(path.join(path.dirname(file), decodeURI(rawPath))));
  if (resolved.startsWith("..")) return undefined;
  return { path: resolved, anchor };
};

const isUnder = (file: string, roots: readonly string[]) =>
  roots.some((root) => file === root || file.startsWith(`${root}/`));

const mentionPattern = (roots: readonly string[], fileOnly: boolean) =>
  new RegExp(
    `(?<![\\w./-])((?:${roots.map(escapeRegExp).join("|")})/[\\w./@+-]*${fileOnly ? "\\.mdx?" : ""})(#[\\w-]+)?`,
    "g",
  );

const loadMap = (root: string, mapFile: string): DocMap => {
  const raw: unknown = JSON.parse(readFileSync(mapFile, "utf8"));
  if (typeof raw !== "object" || raw === null || !("files" in raw)) {
    fail('The map needs a "files" object.');
  }
  const record = raw as { files: unknown; anchors?: unknown };
  const asRecord = (value: unknown, name: string): Record<string, string> => {
    if (value === undefined) return {};
    if (typeof value !== "object" || value === null) return fail(`"${name}" must be an object.`);
    for (const [key, target] of Object.entries(value)) {
      if (typeof target !== "string") fail(`"${name}.${key}" must be a string.`);
      if (!existsSync(path.join(root, target as string))) {
        fail(`Map target does not exist: ${target as string} (from ${key})`);
      }
    }
    return value as Record<string, string>;
  };
  return { files: asRecord(record.files, "files"), anchors: asRecord(record.anchors, "anchors") };
};

const lookup = (map: DocMap, oldPath: string, anchor: string): string | undefined =>
  (anchor ? map.anchors[`${oldPath}#${anchor}`] : undefined) ?? map.files[oldPath];

const relativeLink = (file: string, target: string) => {
  const relative = toPosix(path.relative(path.dirname(file), target));
  return relative === "" ? path.basename(target) : relative;
};

const rewriteFile = (
  file: string,
  text: string,
  map: DocMap,
  oldRoots: readonly string[],
  unmapped: Finding[],
): string => {
  let changed = text.replaceAll(MD_LINK, (whole, target: string) => {
    const resolved = resolveLink(file, target);
    if (!resolved || !isUnder(resolved.path, oldRoots)) return whole;
    const next = lookup(map, resolved.path, resolved.anchor);
    if (!next) {
      unmapped.push({ file, reference: target, message: "link has no map row" });
      return whole;
    }
    return `](${relativeLink(file, next)})`;
  });
  changed = changed.replaceAll(mentionPattern(oldRoots, true), (whole, oldPath: string, hash?: string) => {
    const next = lookup(map, oldPath, hash ? hash.slice(1) : "");
    if (!next) {
      unmapped.push({ file, reference: whole, message: "mention has no map row" });
      return whole;
    }
    return next;
  });
  return changed;
};

const writeAtomic = (full: string, text: string) => {
  const temporary = `${full}.doc-paths-tmp`;
  writeFileSync(temporary, text);
  renameSync(temporary, full);
};

const runRewrite = (
  root: string,
  values: { map?: string; "old-root"?: string[]; skip?: string[]; backup?: string; write?: boolean },
) => {
  const oldRoots = values["old-root"] ?? [];
  if (!values.map || oldRoots.length === 0) fail("rewrite needs --map and at least one --old-root.");
  const mapFile = path.resolve(values.map!);
  const map = loadMap(root, mapFile);
  const unmapped: Finding[] = [];
  const changedFiles: string[] = [];
  // The map names every old path on purpose; never rewrite it.
  const skip = [...(values.skip ?? []), ...oldRoots, toPosix(path.relative(root, mapFile))];

  for (const file of listFiles(root, skip)) {
    const full = path.join(root, file);
    const text = readFileSync(full, "utf8");
    const next = rewriteFile(file, text, map, oldRoots, unmapped);
    if (next === text) continue;
    changedFiles.push(file);
    if (values.write) {
      if (values.backup) {
        const copy = path.join(path.resolve(values.backup), file);
        mkdirSync(path.dirname(copy), { recursive: true });
        copyFileSync(full, copy);
      }
      writeAtomic(full, next);
    }
  }

  console.log(`${values.write ? "Changed" : "Would change"} ${changedFiles.length} file(s).`);
  for (const file of changedFiles) console.log(`  ${file}`);
  if (unmapped.length > 0) {
    console.log(`\nUnmapped references (${unmapped.length}):`);
    for (const item of unmapped) console.log(`  ${item.file}: ${item.reference} (${item.message})`);
  }
  if (!values.write) console.log("\nDry run. Add --write to apply.");
  process.exit(unmapped.length === 0 ? EXIT.ok : EXIT.failure);
};

const runCheck = (root: string, values: { "old-root"?: string[]; site?: string[]; skip?: string[] }) => {
  const oldRoots = values["old-root"] ?? [];
  const sites = values.site ?? [];
  if (oldRoots.length === 0 && sites.length === 0) fail("check needs --old-root or --site.");
  const findings: Finding[] = [];
  const sitePattern = sites.length > 0 ? mentionPattern(sites, true) : undefined;

  for (const file of listFiles(root, [...(values.skip ?? []), ...sites])) {
    const text = readFileSync(path.join(root, file), "utf8");
    for (const [, target] of text.matchAll(MD_LINK)) {
      const resolved = target ? resolveLink(file, target) : undefined;
      if (!resolved) continue;
      if (isUnder(resolved.path, oldRoots)) {
        findings.push({ file, reference: target!, message: "link into an old docs root" });
      } else if (isUnder(resolved.path, sites) && !existsSync(path.join(root, resolved.path))) {
        findings.push({ file, reference: target!, message: "link to a missing docs page" });
      }
    }
    if (oldRoots.length > 0) {
      for (const [whole] of text.matchAll(mentionPattern(oldRoots, false))) {
        findings.push({ file, reference: whole, message: "mention of an old docs root" });
      }
    }
    if (sitePattern) {
      for (const [, sitePath] of text.matchAll(sitePattern)) {
        if (sitePath && !existsSync(path.join(root, sitePath))) {
          findings.push({ file, reference: sitePath, message: "mention of a missing docs page" });
        }
      }
    }
  }

  if (findings.length === 0) {
    console.log("OK: no old or broken docs references.");
    process.exit(EXIT.ok);
  }
  for (const item of findings) console.log(`${item.file}: ${item.reference} (${item.message})`);
  console.error(`${findings.length} problem(s).`);
  process.exit(EXIT.failure);
};

const main = () => {
  let parsed: ReturnType<typeof parseCommandLine>;
  try {
    parsed = parseCommandLine();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(HELP);
    process.exit(EXIT.usage);
  }
  const { values, positionals } = parsed;
  if (values.help) {
    console.log(HELP);
    process.exit(EXIT.ok);
  }
  const root = repoRoot();
  const command = positionals[0];
  if (command === "rewrite") runRewrite(root, values);
  else if (command === "check") runCheck(root, values);
  else fail(`Unknown command "${command ?? ""}".\n\n${HELP}`);
};

const parseCommandLine = () =>
  parseArgs({
    allowPositionals: true,
    options: {
      map: { type: "string" },
      "old-root": { type: "string", multiple: true },
      site: { type: "string", multiple: true },
      skip: { type: "string", multiple: true },
      backup: { type: "string" },
      write: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

main();
