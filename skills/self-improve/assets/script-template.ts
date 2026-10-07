#!/usr/bin/env bun
/**
 * <One sentence: what this script does and why it exists.>
 *
 * Usage:
 *   bun scripts/<name>.ts [--dry-run] [--yes] [--json]
 *
 * Flags:
 *   --dry-run  Print the planned changes without applying them.
 *   --yes      Required for destructive or shared-environment actions.
 *   --json     Print machine-readable output to stdout.
 *   -h, --help Show this help.
 *
 * Env:
 *   <VAR_NAME>  <what it is; where to get it>
 *
 * Side effects:
 *   <what it writes or calls; "none" for read-only scripts>
 *
 * Examples:
 *   bun scripts/<name>.ts --dry-run
 */
import { parseArgs } from "node:util";

const HELP = `Usage: bun scripts/<name>.ts [--dry-run] [--yes] [--json]

<One sentence description.>

  --dry-run  Print the planned changes without applying them
  --yes      Confirm destructive or shared-environment actions
  --json     Machine-readable output
  -h, --help Show this help`;

/** Exit codes shared by every repo script. */
const EXIT = { ok: 0, failure: 1, usage: 2 } as const;

const parseCli = () => {
  try {
    return parseArgs({
      args: Bun.argv.slice(2),
      options: {
        "dry-run": { type: "boolean", default: false },
        yes: { type: "boolean", default: false },
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

const main = async () => {
  const args = parseCli();
  if (args.help) {
    console.log(HELP);
    return;
  }

  // Validate config before doing any work.
  // const url = process.env.DATABASE_URL;
  // if (!url) { console.error("DATABASE_URL is required"); process.exit(EXIT.usage); }

  // 1. Compute the plan (read-only).
  const plan: string[] = [];

  if (args["dry-run"]) {
    console.error(`[dry-run] ${plan.length} change(s) planned`);
    console.log(args.json ? JSON.stringify({ plan }) : plan.join("\n"));
    return;
  }

  // 2. Apply atomically (transaction, or temp file + rename). Safe to re-run.

  console.log(args.json ? JSON.stringify({ applied: plan.length }) : `Applied ${plan.length} change(s)`);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(EXIT.failure);
});
