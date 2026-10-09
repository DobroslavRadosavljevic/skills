# Investigation Toolkit

Pick the tool that answers the current hypothesis. Run commands non-interactively with timeouts. Adapt names to the repo's package manager and test runner; prefer `bun` / `bunx`.

## Contents

- Read the code path
- Temporary instrumentation
- Debugger
- Regressions: bisect and history
- Dependencies and lockfile
- Environment and config diffs
- Network, DB, and queues
- Profiling
- Cleanup

## Read the Code Path

- Start at the failing line in the stack trace. Walk up to the entry point and down to the callee that returned the bad value.
- Read the code that runs, not the code you expect to run. Check for wrappers, middleware, proxies, monkey patches, generated code, and build transforms.
- Confirm you run your edited code: stale build output, caches, a second running process, a wrong workspace package, a different Node or Bun version.
- Search for all callers and all writers of the bad value (`rg`/`grep`). Find who sets it, not only who reads it.
- Read the error's `cause` chain and the first error in the logs, not the last. Later errors are often fallout.

## Temporary Instrumentation

- Log at boundaries: function entry/exit, input and output, before/after await, branch taken.
- Log values and types, not only presence. Use `JSON.stringify` or `console.dir(x, { depth: null })`, and log lengths, ids, and timestamps.
- Add assertions for the invariants you believe hold. A failing assertion pinpoints the first place a belief is false.
- Tag every temporary line (`// DEBUGTMP`, `[DEBUGTMP]`). Before finishing: `rg DEBUGTMP` must return nothing.
- Never log secrets, tokens, or personal data. Redact.
- Binary search with logs: put one probe in the middle of the path, see whether state is good or bad, then move toward the bad half.

## Debugger

Use when you need to inspect live state or step through control flow.

```bash
bun --inspect-brk run script.ts        # pause on first line, attach via the printed URL
bun --inspect-wait test path/to/file.test.ts
node --inspect-brk node_modules/.bin/<tool> <args>
```

Attach from the editor debugger or the browser inspector the runtime prints. Use conditional breakpoints, watch expressions, and "break on exception". If no debugger can attach (harness limits), fall back to targeted logging.

For browser code, use the browser devtools or a browser automation tool: inspect console, network, DOM, and breakpoints. Without browser tooling, ask the user for console output, a HAR export, or a screenshot.

## Regressions: Bisect and History

First find a good and a bad commit, and a repro command that exits non-zero on bad, zero on good (exit 125 means "skip this commit").

```bash
git stash push -u -m debug-save         # only if the tree is dirty; or use a separate worktree
git bisect start
git bisect bad HEAD
git bisect good <known-good-sha-or-tag>
git bisect run sh -c 'bun install --frozen-lockfile >/dev/null 2>&1 && <repro command>'
git bisect reset
```

A worktree keeps the user's tree untouched: `git worktree add ../bisect-tmp <sha>`.

Other history tools:

```bash
git log --no-pager -S'symbolName' --oneline -- path/    # commits that added/removed a string
git log --no-pager -G'regex' --oneline -- path/         # commits whose diff matches a regex
git log --no-pager -L:funcName:path/file.ts             # history of one function
git blame -w -C -C path/file.ts                         # who last changed each line
git diff --stat <good>..<bad>                           # scope of change
```

Blame shows who touched the line last, not who caused the bug. Follow the commit to its reason before concluding.

## Dependencies and Lockfile

```bash
git diff <good>..<bad> -- bun.lock package.json         # what moved
bun why <package>                                        # why and which version is installed
bun pm ls --all | rg <package>                           # duplicate or hoisted versions
```

- Look for transitive bumps, not only direct ones. A patch bump in a sub-dependency is a common cause.
- Read the changelog and release notes between the two versions. Check for deprecations, changed defaults, dropped runtime support, and changed ESM/CJS exports.
- Confirm by pinning only the suspect back to the previous version and re-running the repro. If the failure disappears, the dependency is proven; then find what in your code relies on the changed behavior.
- Check for duplicate copies of the same library (two React, two Zod, two copies of a singleton).

## Environment and Config Diffs

When "works here, fails there":

- Compare runtime versions (`bun --version`, `node --version`), OS, CPU architecture, locale, timezone, and clock.
- Compare env var names and values (redact secrets): `.env*` files, CI settings, deploy settings. A missing or differently typed variable is a frequent cause.
- Compare build mode: dev vs production build, minification, tree-shaking, `NODE_ENV`.
- Compare data: size, nulls, encodings, ids, migrations applied, seed state.
- Compare feature flags, config files, and permissions.
- Make the working environment fail by changing one difference at a time, or make the failing one work.

## Network, DB, and Queues

- Capture the actual request and response: method, URL, headers, status, body, timing. Use `curl -v`, the app's request logs, devtools network tab, or a recording proxy.
- Compare the request your code sends with the one the API expects. Check content-type, encoding, auth, and idempotency.
- For databases: log the generated SQL and parameters; run `EXPLAIN` on it; inspect rows directly with read-only queries; check transaction isolation, locks, and migration state.
- For queues and events: inspect the message payload, ordering, retries, and dead-letter entries.
- Use read-only access or copies for production data. Never mutate production to test a theory.

## Profiling

```bash
node --cpu-prof --heap-prof script.js        # writes .cpuprofile / .heapprofile files
node --inspect-brk script.js                 # then take heap snapshots from devtools
```

Check `bun --help` for the runtime's current profiling flags. Compare profiles from a good and a bad run, not one alone. See [special-cases.md](special-cases.md) for leaks and slowdowns.

## Cleanup

Before finishing:

- `rg DEBUGTMP` (or your tag) returns nothing.
- `git status` and `git diff` show only the fix and the regression check.
- Bisect state is reset (`git bisect reset`), temporary worktrees are removed, stashes are restored, pinned versions are reverted unless the pin is the fix.
- Debug ports, background processes, and temp files are gone.
