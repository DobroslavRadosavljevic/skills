// Frame probe: interaction latency and long frames, with the scripts that caused them. It needs no
// React and no DevTools hook, so it works on any page in a Chromium browser.
//
// Use: paste this whole file into the page (devtools console, or the "evaluate JavaScript" call of
// a browser tool). It starts at once. Then do the interaction and read the result:
//   __frameProbe.report()     -> { worstInteractionMs, interactions, longFrames, blockingMs, ... }
//   __frameProbe.reset()      -> clear the data (call it after warm-up)
//   __frameProbe.stop()       -> stop recording
//
// How to read the report:
//   interactions   Event Timing entries grouped by interaction, slowest first. `durationMs` is the
//                  time from the input to the next paint (the INP number, 8 ms steps).
//                  `inputDelayMs` high: earlier work blocked the thread. `processingMs` high: the
//                  event handlers are slow. The rest is rendering and paint after the handlers.
//   longFrames     Long Animation Frames (50 ms or more), slowest first. `scripts` names the
//                  function, the file, and the time of each script in the frame. `layoutMs` is
//                  forced style and layout inside a script: a high value means layout thrash.
//   longTasks      Used only when the browser has no Long Animation Frames (Chrome under 123).
//   blockingMs     The sum of blocking time of all long frames.
//
// Limits: a background tab gets throttled timers and no paints, so bring the tab to the front. An
// interaction shorter than 16 ms and a frame shorter than 50 ms do not show.
(() => {
  window.__frameProbe?.stop();

  const supported = PerformanceObserver.supportedEntryTypes ?? [];
  const round = (value) => Math.round(value * 10) / 10;
  let events = [];
  let longFrames = [];
  let longTasks = [];
  const observers = [];

  const observe = (type, extra, onEntry) => {
    if (!supported.includes(type)) return false;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) onEntry(entry);
    });
    observer.observe({ type, buffered: false, ...extra });
    observers.push(observer);
    return true;
  };

  const target = (node) => {
    if (!(node instanceof Element)) return undefined;
    const name = node.getAttribute("aria-label") || node.getAttribute("data-testid") || node.id;
    return name ? `${node.tagName.toLowerCase()}(${name.slice(0, 40)})` : node.tagName.toLowerCase();
  };

  const hasEvents = observe("event", { durationThreshold: 16 }, (entry) => {
    if (!entry.interactionId) return;
    if (events.length >= 2000) events.shift();
    events.push({
      id: entry.interactionId,
      type: entry.name,
      start: entry.startTime,
      duration: entry.duration,
      inputDelay: entry.processingStart - entry.startTime,
      processing: entry.processingEnd - entry.processingStart,
      target: target(entry.target),
    });
  });
  const hasFrames = observe("long-animation-frame", {}, (entry) => {
    if (longFrames.length >= 500) longFrames.shift();
    longFrames.push({
      t: Math.round(entry.startTime),
      durationMs: round(entry.duration),
      blockingMs: round(entry.blockingDuration),
      renderMs: entry.renderStart ? round(entry.startTime + entry.duration - entry.renderStart) : 0,
      scripts: entry.scripts
        .map((script) => ({
          ms: round(script.duration),
          layoutMs: round(script.forcedStyleAndLayoutDuration),
          invoker: script.invoker,
          function: script.sourceFunctionName || undefined,
          source: script.sourceURL ? `${script.sourceURL.split("?")[0].split("/").slice(-2).join("/")}` : undefined,
        }))
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 5),
    });
  });
  const hasTasks =
    !hasFrames &&
    observe("longtask", {}, (entry) => {
      if (longTasks.length >= 500) longTasks.shift();
      longTasks.push({ t: Math.round(entry.startTime), durationMs: round(entry.duration) });
    });

  window.__frameProbe = {
    reset() {
      events = [];
      longFrames = [];
      longTasks = [];
    },
    stop() {
      for (const observer of observers) observer.disconnect();
      observers.length = 0;
    },
    report({ top = 10 } = {}) {
      const byId = new Map();
      for (const event of events) {
        const group = byId.get(event.id) ?? { t: Math.round(event.start), types: [], durationMs: 0, inputDelayMs: 0, processingMs: 0 };
        group.types.push(event.type);
        group.durationMs = Math.max(group.durationMs, event.duration);
        group.inputDelayMs = Math.max(group.inputDelayMs, round(event.inputDelay));
        group.processingMs = Math.max(group.processingMs, round(event.processing));
        group.target ??= event.target;
        byId.set(event.id, group);
      }
      const interactions = [...byId.values()].sort((a, b) => b.durationMs - a.durationMs);
      const frames = [...longFrames].sort((a, b) => b.durationMs - a.durationMs);
      return {
        supported: { interactions: hasEvents, longFrames: hasFrames, longTasks: hasTasks },
        worstInteractionMs: interactions[0]?.durationMs ?? 0,
        interactionCount: interactions.length,
        longFrameCount: frames.length,
        blockingMs: round(longFrames.reduce((sum, frame) => sum + frame.blockingMs, 0)),
        interactions: interactions.slice(0, top),
        longFrames: frames.slice(0, top),
        longTasks: [...longTasks].sort((a, b) => b.durationMs - a.durationMs).slice(0, top),
      };
    },
  };
  return `Frame probe on. Interactions: ${hasEvents}, long frames: ${hasFrames}, long tasks: ${hasTasks}`;
})();
