# Script Conventions

Scripts are small CLI programs for agents and people. They must be easy to find, safe to run twice, and clear about what they do.

## Language

- Default: TypeScript run directly by Bun (`bun scripts/<name>.ts`). No build step.
- Use another language only when:
  - The ecosystem requires it, for example a Python ML tool or a library that exists only in Python.
  - The script must run before Bun exists, for example a POSIX `sh` bootstrap that installs Bun.
  - The repo standard is different and the user confirms it.
- A one-line wrapper around a single existing command does not need its own file. Put it in package.json scripts or document it in AGENTS.md.

## Required Shape

Start from [../assets/script-template.ts](../assets/script-template.ts).

- **Shebang:** `#!/usr/bin/env bun`.
- **JSDoc header:** purpose, usage, flags, examples, side effects, and required env var names.
- **Arguments:** `parseArgs` from `node:util`, with `strict: true`. Support `--help`/`-h`.
- **`--dry-run`:** required for any script that writes files, data, or remote state. Print what would change, then exit 0.
- **`--yes`:** required for destructive or production-touching actions. Without it, refuse and explain.
- **`--json`:** add it when another script or agent consumes the output. Keep the JSON stable.
- **Exit codes:** `0` on success, `1` on failure, `2` on bad usage or missing config.
- **Output:**
  - Results go to stdout, so piping and `--json` stay clean.
  - Progress and diagnostics go to stderr.

## Behavior

- **Idempotent.** Running it twice gives the same end state. Check before you create, and use upserts.
- **Atomic writes (the ACID idea).** Use DB transactions. Write files to a temp path, then rename. Never leave half-written state. Bulk changes either finish or roll back.
- **Fail fast.** Validate args and env vars before you do any work, and print an actionable error.
- **Reuse.** Import the repo's own modules (db client, env schema, config, types). Do not copy logic into the script. If shared logic is missing, extract it into the codebase first.
- **Shell.** Use Bun Shell (`import { $ } from "bun"`) for shell commands. Quote with template interpolation; never build shell strings by hand.
- **Paths.** Resolve paths from the repo root or `import.meta.dir`. Never depend on the caller's cwd.
- **Secrets.** Read them from env vars or the repo's secret loader. Never log secret values.
- **Types and lint.** The script must pass the repo's typecheck and lint config. Include `scripts/` in a tsconfig if it is not covered.

## Wiring

- Add a package.json script (`<area>:<action>`, for example `db:seed`) only if the script is used often, by CI, or by other scripts.
- Mention important scripts in the matching runbook. Mention them in AGENTS.md only when every session needs them.

## Verify

- `bun <path> --help` prints usage and exits 0.
- `bun <path> --dry-run` (when supported) prints the plan and changes nothing.
- A real run only against local or disposable targets. Never against shared environments while you set up.
