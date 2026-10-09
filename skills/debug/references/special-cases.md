# Special Cases

Each case changes steps 2-5 of the workflow. The proof, fix, regression check, and sibling hunt still apply.

## Contents

- Flaky or intermittent tests
- Async and race conditions
- Memory leaks
- Performance regressions
- Production-only bugs
- Dependency-upgrade breakages
- Type errors vs runtime errors
- Hydration and SSR mismatches
- Heisenbugs

## Flaky or Intermittent Tests

A flaky test is a deterministic bug with a hidden input. Find the input.

1. Measure the failure rate: run the single test 30-100 times (`bun test --rerun-each 50 path`, or a shell loop). Record fails/runs.
2. Run it alone, then with the whole file, then with the whole suite. If it fails only in the larger runs, the cause is order or shared state.
3. Randomize order and record the seed (`bun test --randomize --seed <n>`, or the runner's shuffle option). Replay the failing seed.
4. Check the usual causes:
   - **Timing:** real clocks, `sleep`, timers, debounce, animation frames. Control time with fake timers or an injected clock.
   - **Ordering:** reliance on test order, on object key order, on unordered DB results without `ORDER BY`.
   - **Shared state:** module-level singletons, caches, global mocks not restored, shared DB rows, shared files or ports, env vars mutated by another test.
   - **Concurrency:** parallel workers sharing a DB, port, temp dir, or fixture; unawaited promises that finish after the test ends.
   - **Environment:** timezone, locale, CPU speed, network, CI resource limits, system clock edge cases (midnight, DST, month end).
   - **Randomness and ids:** unseeded random data, collisions, time-based ids.
5. Retries that turn it green are masking, not fixing. Remove retries while debugging. Do not leave them as the fix.
6. Prove: the failure rate drops from X/N to 0/N over a larger N (at least 3x the original sample), and a forced adversarial schedule (reverse order, single worker, slow CPU, added delay at the suspect point) fails before the fix and passes after.

## Async and Race Conditions

- Draw the timeline: who starts what, what awaits what, and where two flows can interleave.
- Look for: missing `await`, floating promises, check-then-act gaps (read, decide, write), stale closures, shared mutable state across awaits, lost updates, double submits, out-of-order responses (older response overwrites newer), cancellation not handled, event listeners registered twice.
- Make it deterministic: inject delays at the suspect points, control promise resolution order in a test, force a specific interleaving, or lower concurrency to 1 and then raise it.
- Log with a correlation id and monotonic timestamps to reconstruct the order. Log start and end of each step.
- Prove with a forced interleaving that fails before and passes after. A fix that only changes timing is not a fix.
- Fix with the right primitive: atomic DB operation or transaction, optimistic concurrency version, lock or queue, idempotency key, abort signal, "latest request wins" token. Not a `sleep`.

## Memory Leaks

1. Confirm growth: sample memory (RSS and heap used) over time under a steady load, forcing GC between samples if possible. A rising sawtooth is normal; a rising floor is a leak.
2. Reproduce with a script that repeats the suspect operation N times and prints memory after each batch.
3. Take heap snapshots at two points (after warm-up, and after N more iterations) and diff them. Look at object types and counts that grow, then follow their retainer paths.
4. Common retainers: unbounded caches or maps, listeners or subscriptions never removed, timers and intervals never cleared, closures holding large objects, global arrays of logs or requests, per-request state stored globally, unclosed streams, sockets, DB connections, and workers.
5. Browser: detached DOM nodes, un-cleaned effects, observers, and event handlers on window.
6. Fix the owner of the lifetime: add the cleanup, bound the cache, use weak references where right. Prove with the same script: flat floor after the fix, and the snapshot diff no longer grows.

## Performance Regressions

1. Define the metric and the budget: latency percentile, throughput, build time, bundle size, memory. Get a number, not a feeling.
2. Build a repeatable benchmark that isolates the slow path. Warm up, repeat, and report median and spread. Run on a quiet machine.
3. Locate the change: `git bisect run` with the benchmark and a threshold exit code, or compare profiles from a good and a bad commit.
4. Profile before optimizing. Measure where time goes (CPU profile, query plan, network waterfall, flame chart) instead of guessing.
5. Typical causes: N+1 queries, missing index, accidental O(n^2), repeated work in a loop or render, lost cache, sync work on the hot path, larger payloads, a dependency change, removed memoization, extra re-renders.
6. Fix the dominant cost first. Re-measure with the same benchmark. Report before and after numbers. Add a guard that fails on regression only if the repo already has a perf or budget check.

## Production-Only Bugs

Observability first: do not guess against a system you cannot see.

1. Gather what exists: error tracker events, structured logs, traces, metrics, request ids, release version, and the time the problem started. Correlate the start with deploys, config changes, flag flips, data migrations, traffic changes, and dependency or provider incidents.
2. Find the differences from local: build mode, env vars, secrets, data volume and shape, concurrency, region, proxy or CDN, runtime version, feature flags, cache state, third-party responses.
3. If evidence is thin, add observability, not behavior: log the missing context (inputs shape, ids, branch taken) at the failing boundary, add a trace span, or improve the error message. Ship that first, then wait for the next occurrence.
4. Reproduce locally with production-like data (sanitized copy or generated), build, and config. Replay a captured request when you have one, with secrets and personal data removed.
5. Use read-only access. Do not run writes, restarts, or experiments against production without explicit user approval.
6. If a mitigation is needed now (rollback, flag off), say so separately from the root-cause fix, and keep investigating after mitigation.

## Dependency-Upgrade Breakages

1. Identify the exact change: lockfile diff between the last good and first bad state, direct and transitive. Do not assume the package named in the PR is the culprit.
2. Bisect the upgrade: revert half of the bumped packages, then half again, until one package (or one version step) flips the repro.
3. Read the release notes and migration guide between versions. Check breaking changes, new defaults, changed types, dropped runtimes, and ESM/CJS or export-map changes.
4. Inspect the dependency's source or diff for the changed behavior (`node_modules`, the tag diff, the changelog).
5. Decide the fix: adapt your code to the new behavior (preferred), pin with a comment and a tracked reason, or report an upstream bug with a minimal repro. A pin is a mitigation, not a root-cause fix; say so.
6. Check peer-dependency warnings, duplicate versions, and tool versions (TypeScript, bundler, runtime) that moved with the upgrade.

## Type Errors vs Runtime Errors

- **Type error (compile or typecheck time):** the compiler is usually right about a real mismatch. Read the full error, from the innermost message outward. Find which assumption is wrong: the value, the declared type, or a dependency's types. Fix the model or narrow the value. Do not silence it with `any`, `as`, `@ts-ignore`, or non-null `!`. Check that the typecheck runs the same config (`tsconfig`, TypeScript version) as CI.
- **Runtime error:** types can be wrong at runtime. Look at the boundaries: network, storage, env, parsed JSON, user input, third-party code. Types do not validate these. The fix is usually validation at the boundary plus a correct type.
- **Both disagree** (types pass, runtime fails): find the unsound spot: an assertion, an `any`, a generic that lies, an outdated `@types` package, or data from outside. Log the actual runtime value and compare with the declared type.
- **Build vs dev differences:** transpile-only tools skip type checks; typecheck with the project's checker (`bunx tsc --noEmit`).

## Hydration and SSR Mismatches

Symptom: server HTML differs from the first client render ("Hydration failed", text content mismatch, flicker).

1. Get the exact mismatch from the framework warning: which element, server text vs client text. Compare the raw server HTML (view source or `curl`) with the first client render.
2. Common causes:
   - Values that differ per environment: `Date.now()`, `new Date()`, `Math.random()`, ids generated without a stable id source.
   - Time zone, locale, or number/date formatting that differs between server and browser.
   - Reading `window`, `localStorage`, `matchMedia`, cookies, or user agent during render.
   - Browser-only branches (`typeof window !== 'undefined'`) that change the markup.
   - Invalid HTML nesting that the browser repairs (`<div>` inside `<p>`, nested `<a>`, `<table>` without `<tbody>`).
   - Browser extensions or third-party scripts that edit the DOM before hydration.
   - Data that changes between server render and client render (stale cache, different fetch results).
3. Fix by making the first client render match the server: derive values from props or serialized server data, pass the same locale and time zone, use the framework's stable id helper, and move browser-only values into an effect or a client-only boundary after mount. Do not blanket-suppress the warning unless the mismatch is intentional and the output is harmless.
4. Prove with the exact repro page: no hydration warning, and server HTML equals first client render. Check with browser automation, or ask the user for console output if no browser tool exists.

## Heisenbugs

Bugs that change or vanish when observed.

- Logging, debuggers, and breakpoints change timing and memory layout. Suspect races, uninitialized or stale state, timing-dependent code, and undefined behavior.
- Observe with low-overhead tools: buffered logs with monotonic timestamps, counters, trace spans, post-mortem dumps, and assertions that record state on violation.
- Change the observation, not the code under test: log after the fact, record events into an in-memory ring buffer and dump on failure.
- Amplify instead of observing: add stress (higher concurrency, more iterations, slower CPU, injected delays), randomize schedules, and run many times to raise the failure rate.
- Check whether the bug depends on build mode (optimized vs debug), caching, warm vs cold start, or data that your debug session changes.
- When the bug disappears under a change, treat the change as evidence: what did it alter in timing, ordering, or state? That difference points at the cause.
