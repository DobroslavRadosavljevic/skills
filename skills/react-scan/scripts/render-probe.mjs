#!/usr/bin/env node
// Headless React render probe built on react-scan (verified with react-scan 0.5.7, React 19, Playwright 1.6x).
//
// Loads a page with react-scan injected before any app script, counts renders per component,
// attributes each render to its cause (mount, props, state hooks, context, no own change),
// links renders to Event Timing interactions, and prints JSON to stdout.
//
// Run it from the app's project root so `playwright` and `react-scan` resolve from its node_modules:
//   node <skill>/scripts/render-probe.mjs http://localhost:5173/search --steps ./perf-steps.mjs --cpu 4 --runs 5 > before.json
//   node <skill>/scripts/render-probe.mjs --compare before.json after.json
//
// Options:
//   --steps <file>        ESM module: `export default async ({ page, reset }) => { ... }`. Drive the
//                         interaction there. Call `await reset()` after warm-up to drop mount noise.
//                         Without --steps the probe records the initial load plus --idle ms.
//   --runs <n>            Repeat the whole scenario in fresh browser contexts and report medians. Default 1.
//   --idle <ms>           Wait after load (no steps) or after steps before reading. Default 1000.
//   --cpu <rate>          Chromium CPU throttling rate (4 = mid-range phone). Default 1 (off).
//   --no-inject           Do not inject react-scan; hook into the copy the app already loads
//                         (wraps __REACT_SCAN__.ReactScanInternals.options once it appears).
//   --react-scan <path>   Path to auto.global.js when react-scan is not installed in the project.
//   --headed              Show the browser.
//   --top <n>             Components to print. Default 25.
//   --compare <a> <b>     Print a Markdown before/after table from two saved JSON outputs, then exit.
//
// Notes:
//   - Each run uses a fresh browser context, so a stale localStorage "react-scan-options"
//     (enabled:false) cannot silently stop onRender.
//   - Works on production builds too (react-scan starts when loaded before React), but names are
//     minified and selfMs is 0 there. Prefer the dev server for diagnosis.
//   - Mount detection uses `fiber.alternate === null`; react-scan's own `phase` field reports the
//     first update after mount as a mount, so it is not used.
//   - Injecting while the app also loads react-scan was harmless in testing (exact counts); use
//     --no-inject to avoid the second copy anyway.

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  const value = argv[index + 1];
  argv.splice(index, 2);
  return value;
};
const hasFlag = (name) => {
  const index = argv.indexOf(name);
  if (index === -1) return false;
  argv.splice(index, 1);
  return true;
};

const median = (values) => {
  const numbers = values.filter((value) => typeof value === "number" && !Number.isNaN(value)).sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  const middle = Math.floor(numbers.length / 2);
  return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2;
};
const round = (value, digits = 1) => (value == null ? value : Math.round(value * 10 ** digits) / 10 ** digits);

// ---------- compare mode ----------
const compareIndex = argv.indexOf("--compare");
if (compareIndex !== -1) {
  const [beforePath, afterPath] = argv.slice(compareIndex + 1, compareIndex + 3);
  if (!beforePath || !afterPath) {
    console.error("Usage: node render-probe.mjs --compare before.json after.json");
    process.exit(2);
  }
  const before = JSON.parse(readFileSync(beforePath, "utf8"));
  const after = JSON.parse(readFileSync(afterPath, "utf8"));
  const cell = (value) => (value == null ? "–" : String(round(value)));
  const rows = [
    ["Worst interaction (ms)", before.worstInteractionMs, after.worstInteractionMs],
    ["Render ms inside worst interaction", before.worstInteraction?.rendersMs, after.worstInteraction?.rendersMs],
    ["Commits", before.commits, after.commits],
    ["Total renders", before.totalRenders, after.totalRenders],
  ];
  const byName = (result) => new Map((result.components ?? []).map((component) => [component.name, component]));
  const beforeComponents = byName(before);
  const afterComponents = byName(after);
  const names = [...new Set([...beforeComponents.keys(), ...afterComponents.keys()])]
    .sort((left, right) => (beforeComponents.get(right)?.selfMs ?? 0) - (beforeComponents.get(left)?.selfMs ?? 0))
    .slice(0, 12);
  for (const name of names) {
    const left = beforeComponents.get(name);
    const right = afterComponents.get(name);
    rows.push([`${name} renders / mounts / selfMs`, left, right]);
  }
  const format = (value) =>
    value && typeof value === "object" ? `${value.renders} / ${value.mounts} / ${round(value.selfMs)}` : value === undefined ? "0 / 0 / 0" : cell(value);
  console.log(`Runs: before ${before.runs ?? 1}, after ${after.runs ?? 1} (medians). CPU throttle: before ${before.cpuThrottle}, after ${after.cpuThrottle}.\n`);
  console.log("| Metric | Before | After |\n| --- | --- | --- |");
  for (const [label, left, right] of rows) console.log(`| ${label} | ${format(left)} | ${format(right)} |`);
  process.exit(0);
}

// ---------- probe mode ----------
const stepsPath = readFlag("--steps", null);
const runCount = Math.max(1, Number(readFlag("--runs", "1")));
const idleMs = Number(readFlag("--idle", "1000"));
const cpuRate = Number(readFlag("--cpu", "1"));
const reactScanPathFlag = readFlag("--react-scan", null);
const topCount = Number(readFlag("--top", "25"));
const headed = hasFlag("--headed");
const noInject = hasFlag("--no-inject");
const url = argv[0];

if (!url) {
  console.error(
    "Usage: node render-probe.mjs <url> [--steps file.mjs] [--runs n] [--idle ms] [--cpu rate] [--no-inject] [--react-scan path] [--headed] [--top n]\n" +
      "       node render-probe.mjs --compare before.json after.json",
  );
  process.exit(2);
}

const projectRequire = createRequire(resolve(process.cwd(), "package.json"));
const resolveFromProject = (specifier) => {
  try {
    return projectRequire.resolve(specifier);
  } catch {
    return null;
  }
};

const reactScanPath = noInject ? null : (reactScanPathFlag ?? resolveFromProject("react-scan/dist/auto.global.js"));
if (!noInject && (!reactScanPath || !existsSync(reactScanPath))) {
  console.error("Could not find react-scan/dist/auto.global.js. Install react-scan as a devDependency, pass --react-scan <path>, or use --no-inject if the app loads react-scan itself.");
  process.exit(2);
}
const playwrightPath = resolveFromProject("playwright") ?? resolveFromProject("@playwright/test");
if (!playwrightPath) {
  console.error("Could not resolve playwright from the current directory. Run from the project root, or install playwright as a devDependency.");
  process.exit(2);
}
const playwrightModule = await import(pathToFileURL(playwrightPath).href);
const chromium = playwrightModule.chromium ?? playwrightModule.default?.chromium;
const stepsModule = stepsPath ? await import(pathToFileURL(resolve(process.cwd(), stepsPath)).href) : null;

// Runs in the page before any app script. Must stay self-contained (serialized by Playwright).
const installProbe = () => {
  const MAX_RENDER_EVENTS = 200000;
  const probe = { components: {}, commits: 0, interactions: [], renderEvents: [] };
  const COMPOSITE_HOOK_TAGS = new Set([0, 11, 15]); // FunctionComponent, ForwardRef, SimpleMemoComponent
  const CLASS_TAG = 1;

  const changedProps = (fiber) => {
    const previous = fiber.alternate?.memoizedProps;
    const next = fiber.memoizedProps;
    if (!previous || !next || typeof previous !== "object" || typeof next !== "object") return [];
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
    return [...keys].filter((key) => !Object.is(previous[key], next[key]));
  };

  // Indexes count every hook in call order (custom-hook internals included); only hooks with an
  // update queue (useState, useReducer, useSyncExternalStore, useActionState...) are reported.
  const changedHooks = (fiber) => {
    if (fiber.tag === CLASS_TAG) {
      return Object.is(fiber.memoizedState, fiber.alternate?.memoizedState) ? [] : ["class-state"];
    }
    if (!COMPOSITE_HOOK_TAGS.has(fiber.tag)) return [];
    const changed = [];
    let nextHook = fiber.memoizedState;
    let previousHook = fiber.alternate?.memoizedState;
    let index = 0;
    while (nextHook && previousHook && typeof nextHook === "object" && "next" in nextHook) {
      if (nextHook.queue && !Object.is(nextHook.memoizedState, previousHook.memoizedState)) changed.push(index);
      nextHook = nextHook.next;
      previousHook = previousHook.next;
      index += 1;
    }
    return changed;
  };

  const changedContexts = (fiber) => {
    const changed = [];
    let nextDependency = fiber.dependencies?.firstContext;
    let previousDependency = fiber.alternate?.dependencies?.firstContext;
    while (nextDependency && previousDependency) {
      if (nextDependency.context !== previousDependency.context) break;
      if (!Object.is(nextDependency.memoizedValue, previousDependency.memoizedValue)) {
        const context = nextDependency.context;
        changed.push(context?.displayName ?? context?.Provider?.displayName ?? "Context");
      }
      nextDependency = nextDependency.next;
      previousDependency = previousDependency.next;
    }
    return [...new Set(changed)];
  };

  const bump = (record, key) => {
    record[key] = (record[key] ?? 0) + 1;
  };

  const onRender = (fiber, renders) => {
    for (const render of renders) {
      if (render.phase === 4) continue;
      const name = render.componentName ?? "Anonymous";
      const selfMs = render.time ?? 0;
      const entry = (probe.components[name] ??= {
        renders: 0,
        mounts: 0,
        selfMs: 0,
        compiled: false,
        noOwnChange: 0,
        props: {},
        state: {},
        context: {},
      });
      entry.renders += 1;
      entry.selfMs += selfMs;
      entry.compiled ||= Boolean(render.forget);
      if (probe.renderEvents.length < MAX_RENDER_EVENTS) probe.renderEvents.push([performance.now(), name, selfMs]);
      if (!fiber.alternate) {
        entry.mounts += 1;
        continue;
      }
      const props = changedProps(fiber);
      const hooks = changedHooks(fiber);
      const contexts = changedContexts(fiber);
      props.forEach((key) => bump(entry.props, key));
      hooks.forEach((key) => bump(entry.state, String(key)));
      contexts.forEach((key) => bump(entry.context, key));
      if (props.length === 0 && hooks.length === 0 && contexts.length === 0) entry.noOwnChange += 1;
    }
  };
  const onCommitFinish = () => {
    probe.commits += 1;
  };

  // Event Timing: one interaction (keydown/keyup/input or pointerdown/pointerup/click) shares an
  // interactionId. Track the window it covers and the largest processing and duration of any entry.
  try {
    new PerformanceObserver((list) => {
      for (const timing of list.getEntries()) {
        if (!timing.interactionId) continue;
        let interaction = probe.interactions.find((existing) => existing.id === timing.interactionId);
        if (!interaction) {
          interaction = { id: timing.interactionId, types: [], target: null, start: timing.startTime, end: 0, durationMs: 0, maxProcessingMs: 0, maxInputDelayMs: 0 };
          probe.interactions.push(interaction);
        }
        interaction.types.push(timing.name);
        interaction.target ??= timing.target?.tagName?.toLowerCase() ?? null;
        interaction.start = Math.min(interaction.start, timing.startTime);
        interaction.end = Math.max(interaction.end, timing.startTime + timing.duration);
        interaction.durationMs = Math.max(interaction.durationMs, timing.duration);
        interaction.maxProcessingMs = Math.max(interaction.maxProcessingMs, timing.processingEnd - timing.processingStart);
        interaction.maxInputDelayMs = Math.max(interaction.maxInputDelayMs, timing.processingStart - timing.startTime);
      }
    }).observe({ type: "event", durationThreshold: 16, buffered: true });
  } catch {
    // Event Timing is missing in some browsers; interactions stay empty.
  }

  window.__renderProbe = probe;
  window.__renderProbeReset = () => {
    probe.components = {};
    probe.commits = 0;
    probe.interactions = [];
    probe.renderEvents = [];
  };

  if (typeof window.reactScan === "function") {
    window.reactScan({ enabled: true, onCommitFinish, onRender });
    return;
  }
  // --no-inject: wait for the app's own react-scan and wrap its options signal.
  const attach = () => {
    const internals = globalThis.__REACT_SCAN__?.ReactScanInternals;
    if (!internals) return false;
    const previous = internals.options.value;
    internals.options.value = {
      ...previous,
      onRender: (fiber, renders) => {
        onRender(fiber, renders);
        previous.onRender?.(fiber, renders);
      },
      onCommitFinish: () => {
        onCommitFinish();
        previous.onCommitFinish?.();
      },
    };
    probe.attachedLate = true;
    return true;
  };
  const timer = setInterval(() => {
    if (attach()) clearInterval(timer);
  }, 10);
};

const summarizeRun = (raw) => {
  // Link renders to interactions: renders whose onRender time falls inside the interaction window.
  const interactions = raw.interactions.map((interaction) => {
    const inside = raw.renderEvents.filter(([time]) => time >= interaction.start && time <= interaction.end);
    const byComponent = {};
    for (const [, name, selfMs] of inside) {
      const component = (byComponent[name] ??= { renders: 0, selfMs: 0 });
      component.renders += 1;
      component.selfMs += selfMs;
    }
    const rendersMs = inside.reduce((sum, [, , selfMs]) => sum + selfMs, 0);
    return {
      id: interaction.id,
      types: [...new Set(interaction.types)],
      target: interaction.target,
      durationMs: interaction.durationMs,
      maxProcessingMs: round(interaction.maxProcessingMs),
      maxInputDelayMs: round(interaction.maxInputDelayMs),
      renders: inside.length,
      rendersMs: round(rendersMs, 2),
      renderShare: interaction.durationMs > 0 ? round(Math.min(1, rendersMs / interaction.durationMs), 2) : null,
      topComponents: Object.entries(byComponent)
        .map(([name, component]) => ({ name, renders: component.renders, selfMs: round(component.selfMs, 2) }))
        .sort((left, right) => right.selfMs - left.selfMs)
        .slice(0, 5),
    };
  });
  const worstInteraction = interactions.reduce((worst, interaction) => (!worst || interaction.durationMs > worst.durationMs ? interaction : worst), null);
  return {
    commits: raw.commits,
    totalRenders: Object.values(raw.components).reduce((sum, entry) => sum + entry.renders, 0),
    worstInteraction,
    components: raw.components,
    interactions,
  };
};

const runOnce = async (browser) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const reactScanMessages = [];
  page.on("console", (message) => {
    if (/\[React Scan\]/.test(message.text())) reactScanMessages.push(message.text());
    else if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  if (cpuRate > 1) {
    const session = await context.newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
  }
  if (!noInject) await page.addInitScript({ path: reactScanPath });
  await page.addInitScript(installProbe);
  await page.goto(url, { waitUntil: "load" });

  const attached = await page
    .waitForFunction(() => Boolean(window.__REACT_SCAN__), null, { timeout: 10000 })
    .then(() => true, () => false);
  if (noInject && attached) await page.waitForFunction(() => Boolean(window.__renderProbe?.attachedLate), null, { timeout: 5000 }).catch(() => {});

  const reset = () => page.evaluate(() => window.__renderProbeReset());
  if (stepsModule) await stepsModule.default({ page, reset });
  await page.waitForTimeout(idleMs);

  const raw = await page.evaluate(() => JSON.parse(JSON.stringify(window.__renderProbe)));
  await context.close();
  return { attached, consoleErrors, reactScanMessages, ...summarizeRun(raw) };
};

const browser = await chromium.launch({ headless: !headed });
const runs = [];
for (let index = 0; index < runCount; index += 1) runs.push(await runOnce(browser));
await browser.close();

// Medians across runs. Per-component cause maps come from the run whose worst interaction is the median.
const componentNames = [...new Set(runs.flatMap((run) => Object.keys(run.components)))];
const medianRun = [...runs].sort((left, right) => (left.worstInteraction?.durationMs ?? 0) - (right.worstInteraction?.durationMs ?? 0))[Math.floor(runs.length / 2)];
const components = componentNames
  .map((name) => {
    const values = runs.map((run) => run.components[name]).filter(Boolean);
    const pick = (key) => median(runs.map((run) => run.components[name]?.[key] ?? 0));
    const causes = medianRun.components[name] ?? values[0];
    return {
      name,
      renders: pick("renders"),
      mounts: pick("mounts"),
      selfMs: round(pick("selfMs"), 2),
      noOwnChange: pick("noOwnChange"),
      compiled: values.some((value) => value.compiled),
      props: causes.props,
      state: causes.state,
      context: causes.context,
    };
  })
  .sort((left, right) => right.selfMs - left.selfMs || right.renders - left.renders)
  .slice(0, topCount);

console.log(
  JSON.stringify(
    {
      url,
      runs: runCount,
      attached: runs.every((run) => run.attached),
      cpuThrottle: cpuRate,
      injected: !noInject,
      worstInteractionMs: median(runs.map((run) => run.worstInteraction?.durationMs ?? null)),
      commits: median(runs.map((run) => run.commits)),
      totalRenders: median(runs.map((run) => run.totalRenders)),
      perRun: runs.map((run) => ({ worstInteractionMs: run.worstInteraction?.durationMs ?? null, commits: run.commits, totalRenders: run.totalRenders })),
      worstInteraction: medianRun.worstInteraction,
      components,
      interactions: medianRun.interactions,
      consoleErrors: [...new Set(runs.flatMap((run) => run.consoleErrors))],
      reactScanMessages: [...new Set(runs.flatMap((run) => run.reactScanMessages))],
    },
    null,
    2,
  ),
);
